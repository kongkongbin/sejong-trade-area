/**
 * 대구 전체 보건·의료 업종 배치 적재 스크립트
 * 실행: node scripts/seedMedical.js (server 폴더에서)
 */

require('dotenv').config();
const axios = require('axios');
const pool = require('../src/config/db');

const SERVICE_KEY = process.env.DATA_GO_KR_SERVICE_KEY;
const BASE_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2';

// 대구 시군구 코드
const SIGUNGU_CODES = [
  { code: '27110', name: '중구' },
  { code: '27140', name: '동구' },
  { code: '27170', name: '서구' },
  { code: '27200', name: '남구' },
  { code: '27230', name: '북구' },
  { code: '27260', name: '수성구' },
  { code: '27290', name: '달서구' },
  { code: '27710', name: '달성군' },
  { code: '27720', name: '군위군' },
];

async function fetchBySigngu(signguCd, pageNo = 1) {
  const res = await axios.get(`${BASE_URL}/storeListInDong`, {
    params: {
      divId: 'signguCd',
      key: signguCd,
      indsLclsCd: 'Q1',
      pageNo,
      numOfRows: 1000,
      type: 'json',
      serviceKey: SERVICE_KEY,
    },
  });
  return res.data;
}

async function main() {
  console.log('대구 보건·의료 업종 배치 적재 시작...');

  await pool.query('SET SQL_SAFE_UPDATES = 0');
  await pool.query(`DELETE FROM facilities WHERE category = 'hospital'`);
  console.log('기존 병원 데이터 삭제 완료\n');

  let totalInserted = 0;

  for (const sigungu of SIGUNGU_CODES) {
    try {
      const first = await fetchBySigngu(sigungu.code);
      const totalCount = first.body?.totalCount || 0;

      if (!totalCount) {
        console.log(`${sigungu.name}: 데이터 없음`);
        continue;
      }

      let allItems = first.body.items || [];
      const totalPages = Math.ceil(totalCount / 1000);

      for (let page = 2; page <= totalPages; page++) {
        const data = await fetchBySigngu(sigungu.code, page);
        allItems = allItems.concat(data.body.items || []);
        await new Promise(r => setTimeout(r, 100));
      }

      const values = allItems
        .filter(item => item.lat && item.lon)
        .map(item => {
          const name = (item.bizesNm || '').replace(/'/g, "''");
          const addr = (item.rdnmAdr || item.lnoAdr || '').replace(/'/g, "''");
          const extra = JSON.stringify({
            subCategory: item.indsSclsNm || '',
            bizesId: item.bizesId
          }).replace(/'/g, "''");
          return `('hospital', '${name}', '${addr}', ${item.lat}, ${item.lon}, '${extra}')`;
        });

      if (values.length > 0) {
        await pool.query(
          `INSERT INTO facilities (category, name, address, lat, lng, extra_info) VALUES ${values.join(',')}`
        );
      }

      totalInserted += values.length;
      console.log(`${sigungu.name}: ${totalCount}개 조회 → ${values.length}개 적재`);
      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      console.error(`${sigungu.name} 오류:`, err.message);
    }
  }

  console.log(`\n완료! 총 ${totalInserted}개 의료기관 적재`);
  process.exit(0);
}

main().catch(err => {
  console.error('치명적 오류:', err);
  process.exit(1);
});