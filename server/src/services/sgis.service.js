const axios = require('axios');
require('dotenv').config();

const CONSUMER_KEY = process.env.SGIS_API_KEY;
const CONSUMER_SECRET = process.env.SGIS_API_SECRET;

const AUTH_URL = 'https://sgisapi.mods.go.kr/OpenAPI3/auth/authentication.json';
const POPULATION_URL = 'https://sgisapi.mods.go.kr/OpenAPI3/stats/searchpopulation.json';
const COMPANY_URL = 'https://sgisapi.mods.go.kr/OpenAPI3/stats/company.json';
const HOUSEHOLD_URL = 'https://sgisapi.mods.go.kr/OpenAPI3/stats/household.json';

// 대구 시군구 SGIS 코드 (행안부 코드와 다름 — SGIS 시도코드는 22)
const DAEGU_SIGUNGU_CODE = {
  '중구': '22010',
  '동구': '22020',
  '서구': '22030',
  '남구': '22040',
  '북구': '22050',
  '수성구': '22060',
  '달서구': '22070',
  '달성군': '22510',
  '군위군': '22520',
};

// ---- 토큰 캐싱 ----
let cachedToken = null;
let tokenExpiredAt = 0;

async function authenticate() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiredAt) {
    return cachedToken;
  }

  const res = await axios.get(AUTH_URL, {
    params: {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    },
  });

  const result = res.data?.result;
  if (!result?.accessToken) {
    throw new Error(`SGIS 인증 실패: ${JSON.stringify(res.data)}`);
  }

  cachedToken = result.accessToken;
  // accessTimeout은 보통 밀리초 단위 만료 타임스탬프로 내려옴. 안전하게 1분 여유를 둠.
  const timeoutMs = result.accessTimeout ? Number(result.accessTimeout) - now : 30 * 60 * 1000;
  tokenExpiredAt = now + Math.max(timeoutMs - 60 * 1000, 60 * 1000);

  return cachedToken;
}

// SGIS가 제공하는 최신 확정 연도. 필요시 바꿔서 쓸 수 있게 상수로 분리.
const DEFAULT_YEAR = 2023;

// ---- 인구 통계 조회 ----
// adm_cd: SGIS 행정구역 코드 (예: '22010' = 대구 중구)
// lowSearch: 0 = 해당 구 전체 합계, 1 = 하위 읍면동 단위로 리스트 반환
// year: 기준연도 (필수 파라미터, 기본값 DEFAULT_YEAR)
async function getPopulationByAdmCd(admCd, lowSearch = 0, year = DEFAULT_YEAR) {
  const token = await authenticate();

  const res = await axios.get(POPULATION_URL, {
    params: {
      accessToken: token,
      year,
      adm_cd: admCd,
      low_search: lowSearch,
    },
  });

  if (res.data?.errCd && res.data.errCd !== 0 && res.data.errCd !== '0') {
    throw new Error(`SGIS 인구 조회 실패: ${JSON.stringify(res.data)}`);
  }

  return res.data?.result || [];
}

// ---- 직장인구(사업체) 조회 ----
// year도 필수 파라미터. 응답 필드: adm_cd, adm_nm, corp_cnt(사업체수), tot_worker(종사자수=직장인구)
async function getCompanyByAdmCd(admCd, lowSearch = 0, year = DEFAULT_YEAR) {
  const token = await authenticate();

  const res = await axios.get(COMPANY_URL, {
    params: {
      accessToken: token,
      year,
      adm_cd: admCd,
      low_search: lowSearch,
    },
  });

  if (res.data?.errCd && res.data.errCd !== 0 && res.data.errCd !== '0') {
    throw new Error(`SGIS 직장인구 조회 실패: ${JSON.stringify(res.data)}`);
  }

  return res.data?.result || [];
}

// ---- 가구(배후세대) 조회 ----
// 응답 필드: adm_cd, adm_nm, household_cnt(가구수), family_member_cnt(가구원수), avg_family_member_cnt(평균가구원수)
async function getHouseholdByAdmCd(admCd, lowSearch = 0, year = DEFAULT_YEAR) {
  const token = await authenticate();

  const res = await axios.get(HOUSEHOLD_URL, {
    params: {
      accessToken: token,
      year,
      adm_cd: admCd,
      low_search: lowSearch,
    },
  });

  if (res.data?.errCd && res.data.errCd !== 0 && res.data.errCd !== '0') {
    throw new Error(`SGIS 가구 조회 실패: ${JSON.stringify(res.data)}`);
  }

  return res.data?.result || [];
}

// ---- 동 이름으로 SGIS adm_cd 찾기 ----
// 네이버 역지오코딩이 주는 dongName(예: '대명동')과 sigunguName(예: '남구')을 받아서,
// 코드 변환표 없이 구 단위 low_search 리스트에서 이름으로 매칭
async function findDongAdmCd(sigunguName, dongName) {
  const sigunguCode = DAEGU_SIGUNGU_CODE[sigunguName];
  if (!sigunguCode) {
    throw new Error(`알 수 없는 시군구명: ${sigunguName}`);
  }

  const list = await getPopulationByAdmCd(sigunguCode, 1);

  // SGIS 응답의 동 이름 필드는 보통 adm_nm (예: '대명9동')
  // 1순위: 완전 일치
  let match = list.find((item) => item.adm_nm === dongName);

  // 2순위: 숫자를 뗀 이름으로 비교 (예: '대명9동' vs '대명동' → 둘 다 '대명동'으로 정규화)
  if (!match) {
    const normalize = (name) => (name || '').replace(/\d+/g, '');
    const targetNorm = normalize(dongName);
    match = list.find((item) => normalize(item.adm_nm) === targetNorm);
  }

  // 3순위: 포함 관계 (그 외 예외 케이스 대비)
  if (!match) {
    match = list.find(
      (item) => item.adm_nm?.includes(dongName) || dongName.includes(item.adm_nm)
    );
  }

  if (!match) {
    return null;
  }

  return {
    admCd: match.adm_cd,
    admNm: match.adm_nm,
  };
}

// ---- 좌표 기반 고수준 함수: 직장인구 + 배후세대 ----
// geocode.service의 reverseGeocode 결과(dongName, sigunguName)를 받아서 사용
async function getWorkplacePopulation(sigunguName, dongName) {
  const dong = await findDongAdmCd(sigunguName, dongName);
  if (!dong) {
    return null;
  }

  const [companyRows, householdRows] = await Promise.all([
    getCompanyByAdmCd(dong.admCd, 0),
    getHouseholdByAdmCd(dong.admCd, 0),
  ]);
  // low_search: 0 이므로 결과는 항상 1건 (해당 동 자체 합계)
  const company = companyRows?.[0];
  const household = householdRows?.[0];

  return {
    admCd: dong.admCd,
    admNm: dong.admNm,
    // 직장인구
    corpCnt: company ? Number(company.corp_cnt) : 0,
    totWorker: company ? Number(company.tot_worker) : 0,
    // 배후세대
    householdCnt: household ? Number(household.household_cnt) : 0,
    familyMemberCnt: household ? Number(household.family_member_cnt) : 0,
    avgFamilyMemberCnt: household ? Number(household.avg_family_member_cnt) : 0,
  };
}

module.exports = {
  authenticate,
  getPopulationByAdmCd,
  getCompanyByAdmCd,
  getHouseholdByAdmCd,
  findDongAdmCd,
  getWorkplacePopulation,
  DAEGU_SIGUNGU_CODE,
};