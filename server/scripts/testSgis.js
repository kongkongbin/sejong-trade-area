// 로컬 테스트: node server/scripts/testSgis.js
require('dotenv').config();
const {
  getPopulationByAdmCd,
  getCompanyByAdmCd,
  findDongAdmCd,
} = require('../src/services/sgis.service');

function logError(err) {
  if (err.response) {
    console.error('실패: HTTP', err.response.status);
    console.error('응답 바디:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error('실패:', err.message);
  }
}

async function main() {
  console.log('=== 0. 인증(authentication) 단독 테스트 ===');
  try {
    const { authenticate } = require('../src/services/sgis.service');
    const token = await authenticate();
    console.log('토큰 발급 성공:', token);
  } catch (err) {
    logError(err);
  }

  console.log('\n=== 1. 대구 중구(22010) 읍면동 단위 인구 조회 ===');
  try {
    const pop = await getPopulationByAdmCd('22010', 1);
    console.log(JSON.stringify(pop, null, 2));
  } catch (err) {
    logError(err);
  }

  console.log('\n=== 2. 대구 중구(22010) 직장인구(company.json) 조회 ===');
  try {
    const company = await getCompanyByAdmCd('22010', 0);
    console.log(JSON.stringify(company, null, 2));
  } catch (err) {
    logError(err);
  }

  console.log('\n=== 3. 이름 매칭 테스트 (남구 / 대명동) ===');
  try {
    const dong = await findDongAdmCd('남구', '대명동');
    console.log(JSON.stringify(dong, null, 2));
  } catch (err) {
    logError(err);
  }
}

main();