const pool = require('../config/db');
const { reverseGeocode } = require('./geocode.service');

async function getPopulationAnalysis(lat, lng) {
  // 1. 좌표 → 행정동 찾기
  const geo = await reverseGeocode(lat, lng);
  if (!geo) return null;

  const { dongName, sigunguName } = geo;

  // 2. 행정동명으로 DB 조회 (resident_population)
  const [rows] = await pool.query(
    `SELECT category, gender, value
     FROM population_stats
     WHERE admin_dong_name = ?
       AND sigungu_name = ?
       AND stat_type = 'resident_population'
     ORDER BY category, gender`,
    [dongName, sigunguName]
  );

  if (rows.length === 0) {
    // 행정동명 매칭 실패 시 시군구명만으로 재시도
    const [rows2] = await pool.query(
      `SELECT category, gender, value
       FROM population_stats
       WHERE sigungu_name = ?
         AND stat_type = 'resident_population'
         AND admin_dong_name = (
           SELECT admin_dong_name FROM population_stats
           WHERE sigungu_name = ? AND stat_type = 'resident_population'
           LIMIT 1
         )
       ORDER BY category, gender`,
      [sigunguName, sigunguName]
    );
    if (rows2.length === 0) return { dongName, sigunguName, ageGroups: [], total: 0 };
    return buildResult(dongName, sigunguName, rows2);
  }

  return buildResult(dongName, sigunguName, rows);
}

function buildResult(dongName, sigunguName, rows) {
  const AGE_ORDER = ['10대미만', '10대', '20대', '30대', '40대', '50대', '60대이상'];

  // 연령대별 남/여 집계
  const groupMap = {};
  let total = 0;
  let totalM = 0;
  let totalF = 0;

  for (const row of rows) {
    if (row.category === '전체') {
      total = row.value;
      continue;
    }
    if (!groupMap[row.category]) {
      groupMap[row.category] = { M: 0, F: 0 };
    }
    if (row.gender === 'M') groupMap[row.category].M = row.value;
    if (row.gender === 'F') groupMap[row.category].F = row.value;
    if (row.gender === 'M') totalM += row.value;
    if (row.gender === 'F') totalF += row.value;
  }

  const ageGroups = AGE_ORDER.map((age) => ({
    age,
    M: groupMap[age]?.M || 0,
    F: groupMap[age]?.F || 0,
    total: (groupMap[age]?.M || 0) + (groupMap[age]?.F || 0),
  }));

  // 최고/최저 연령대 찾기
  const sorted = [...ageGroups].sort((a, b) => b.total - a.total);
  const maxAge = sorted[0]?.age;
  const minAge = sorted[sorted.length - 1]?.age;

  return {
    dongName,
    sigunguName,
    total: total || totalM + totalF,
    totalM,
    totalF,
    ageGroups,
    maxAge,
    minAge,
  };
}

module.exports = { getPopulationAnalysis };