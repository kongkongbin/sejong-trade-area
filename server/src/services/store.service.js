const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2';
const SERVICE_KEY = process.env.DATA_GO_KR_SERVICE_KEY;

const CATEGORY_MAP = {
  I1: '숙박', I2: '음식', G2: '소매', S2: '수리·개인',
  M1: '과학·기술', P1: '교육', Q1: '보건·의료', R1: '예술·스포츠',
  N1: '시설관리·임대', J1: '정보통신', K1: '금융·보험',
  L1: '부동산', H1: '운수·창고', O1: '공공행정',
};

function calcCompetitionLevel(count) {
  if (count >= 100) return 5;
  if (count >= 50) return 4;
  if (count >= 20) return 3;
  if (count >= 10) return 2;
  return 1;
}

async function fetchPage(cx, cy, radius, pageNo, numOfRows = 1000) {
  const res = await axios.get(`${BASE_URL}/storeListInRadius`, {
    params: { cx, cy, radius, pageNo, numOfRows, type: 'json', serviceKey: SERVICE_KEY },
  });
  return res.data;
}

async function fetchAllStoresInRadius(cx, cy, radius) {
  const firstPage = await fetchPage(cx, cy, radius, 1);
  const { totalCount } = firstPage.body;
  let items = firstPage.body.items || [];

  if (totalCount === 0 || items.length === 0) {
    return { items: [], totalCount: 0 };
  }

  const totalPages = Math.ceil(totalCount / 1000);
  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchPage(cx, cy, radius, page);
    items = items.concat(data.body.items || []);
  }

  return { items, totalCount };
}

// 업종 대분류별 집계 + 매장 리스트 포함
function aggregateByCategory(items) {
  const countMap = {};

  for (const item of items) {
    const code = item.indsLclsCd;
    const name = item.indsLclsNm || CATEGORY_MAP[code] || code;
    if (!countMap[code]) {
      countMap[code] = { code, name, count: 0, stores: [] };
    }
    countMap[code].count++;
    countMap[code].stores.push({
      id: item.bizesId,
      name: item.bizesNm,
      branch: item.brchNm || '',
      category: item.indsSclsNm || item.indsMclsNm || '',
      address: item.rdnmAdr || item.lnoAdr || '',
      floor: item.flrNo || '',
      lat: item.lat,
      lng: item.lon,
    });
  }

  return Object.values(countMap)
    .map((cat) => ({
      ...cat,
      competitionLevel: calcCompetitionLevel(cat.count),
    }))
    .sort((a, b) => b.count - a.count);
}

function aggregateByMiddleCategory(items, lclsCd) {
  const filtered = items.filter((item) => item.indsLclsCd === lclsCd);
  const countMap = {};

  for (const item of filtered) {
    const code = item.indsMclsCd;
    const name = item.indsMclsNm || code;
    if (!countMap[code]) {
      countMap[code] = { code, name, count: 0 };
    }
    countMap[code].count++;
  }

  return Object.values(countMap)
    .map((cat) => ({ ...cat, competitionLevel: calcCompetitionLevel(cat.count) }))
    .sort((a, b) => b.count - a.count);
}

async function getFranchiseAnalysis(lat, lng, radius) {
  const { items, totalCount } = await fetchAllStoresInRadius(lng, lat, radius);
  const byCategory = aggregateByCategory(items);

  // 전체 매장 리스트 (검색용)
  const allStores = items.map((item) => ({
    id: item.bizesId,
    name: item.bizesNm,
    branch: item.brchNm || '',
    category: item.indsSclsNm || item.indsMclsNm || '',
    categoryLarge: item.indsLclsNm || '',
    address: item.rdnmAdr || item.lnoAdr || '',
    floor: item.flrNo || '',
    lat: item.lat,
    lng: item.lon,
  }));

  return {
    totalCount,
    byCategory,
    foodDetail: aggregateByMiddleCategory(items, 'I2'),
    allStores,
  };
}

module.exports = { getFranchiseAnalysis, fetchAllStoresInRadius, aggregateByCategory };