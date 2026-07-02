const pool = require('../config/db');

// 대구 평균 인구 (캐싱)
let daeguAvgPopulation = null;

async function getDaeguAvgPopulation() {
  if (daeguAvgPopulation) return daeguAvgPopulation;
  const [rows] = await pool.query(`
    SELECT AVG(value) as avg_pop
    FROM population_stats
    WHERE stat_type = 'resident_population'
      AND category = '전체'
      AND gender = 'ALL'
      AND stat_ym = (SELECT MAX(stat_ym) FROM population_stats)
  `);
  daeguAvgPopulation = Math.round(rows[0].avg_pop || 0);
  return daeguAvgPopulation;
}

// 생활인구 점수 (30점)
function calcPopulationScore(populationData, avgPop) {
  if (!populationData || !populationData.total) return { score: 0, comment: '인구 데이터 없음' };
  const total = populationData.total;
  const ratio = total / (avgPop || 1);
  let score;
  if (ratio >= 2.0) score = 30;
  else if (ratio >= 1.5) score = 25;
  else if (ratio >= 1.0) score = 20;
  else if (ratio >= 0.7) score = 14;
  else if (ratio >= 0.4) score = 8;
  else score = 4;

  const pct = ((ratio - 1) * 100).toFixed(0);
  const compareText = ratio >= 1
    ? `대구 평균 대비 ${pct}% 높음`
    : `대구 평균 대비 ${Math.abs(pct)}% 낮음`;

  // 주요 연령대 분석
  const maxAge = populationData.maxAge || '';
  const ageComment = maxAge ? `${maxAge} 인구 비중 가장 높음` : '';

  return {
    score,
    total,
    avgPop,
    compareText,
    ageComment,
    comment: `거주인구 ${total.toLocaleString()}명 · ${compareText}`,
  };
}

// 교통 접근성 점수 (25점)
function calcTransitScore(transitData) {
  if (!transitData) return { score: 0, comment: '교통 데이터 없음' };
  const subwayCount = transitData.subway.count;
  const busCount = transitData.bus.count;

  let score = 0;
  // 지하철 (최대 15점)
  if (subwayCount >= 3) score += 15;
  else if (subwayCount >= 2) score += 12;
  else if (subwayCount === 1) score += 8;
  else score += 0;

  // 버스 (최대 10점)
  if (busCount >= 20) score += 10;
  else if (busCount >= 10) score += 8;
  else if (busCount >= 5) score += 5;
  else if (busCount >= 1) score += 3;

  let comment = '';
  if (subwayCount > 0) comment += `지하철 ${subwayCount}개역 반경 내`;
  if (busCount > 0) comment += `${comment ? ' · ' : ''}버스 정류장 ${busCount}개`;
  if (!comment) comment = '대중교통 접근 어려움';

  const level = score >= 20 ? '매우 우수' : score >= 15 ? '우수' : score >= 8 ? '보통' : '미흡';

  return { score, subwayCount, busCount, comment, level };
}

// 업종/상권 점수 (25점)
function calcFranchiseScore(franchiseData) {
  if (!franchiseData) return { score: 0, comment: '상권 데이터 없음' };
  const total = franchiseData.totalCount;
  const categoryCount = franchiseData.byCategory?.length || 0;

  let score = 0;
  // 총 상가 수 (최대 15점)
  if (total >= 500) score += 15;
  else if (total >= 300) score += 12;
  else if (total >= 150) score += 9;
  else if (total >= 50) score += 5;
  else score += 2;

  // 업종 다양성 (최대 10점)
  if (categoryCount >= 8) score += 10;
  else if (categoryCount >= 6) score += 8;
  else if (categoryCount >= 4) score += 5;
  else score += 2;

  // 주요 업종 분석
  const topCategory = franchiseData.byCategory?.[0];
  const comment = topCategory
    ? `총 ${total.toLocaleString()}개 업소 · ${topCategory.name} 업종 최다(${topCategory.count}개)`
    : `총 ${total.toLocaleString()}개 업소`;

  return { score, total, categoryCount, comment };
}

// 인프라 점수 (20점)
function calcFacilityScore(facilityData) {
  if (!facilityData) return { score: 0, comment: '시설 데이터 없음' };
  const hospitalCount = facilityData.hospital?.count || 0;
  const schoolCount = (facilityData.elementary?.count || 0) +
    (facilityData.middle?.count || 0) + (facilityData.high?.count || 0);
  const kinderCount = facilityData.kindergarten?.count || 0;

  let score = 0;
  // 의료 (최대 10점)
  if (hospitalCount >= 10) score += 10;
  else if (hospitalCount >= 5) score += 8;
  else if (hospitalCount >= 2) score += 5;
  else if (hospitalCount >= 1) score += 3;

  // 교육 (최대 10점)
  const eduTotal = schoolCount + kinderCount;
  if (eduTotal >= 10) score += 10;
  else if (eduTotal >= 5) score += 8;
  else if (eduTotal >= 2) score += 5;
  else if (eduTotal >= 1) score += 3;

  const parts = [];
  if (hospitalCount > 0) parts.push(`의료기관 ${hospitalCount}개`);
  if (schoolCount > 0) parts.push(`학교 ${schoolCount}개`);
  if (kinderCount > 0) parts.push(`유치원 ${kinderCount}개`);
  const comment = parts.length > 0 ? parts.join(' · ') : '주변 생활시설 부족';

  return { score, hospitalCount, schoolCount, kinderCount, comment };
}

// 등급 산출
function getGrade(totalScore) {
  if (totalScore >= 85) return { grade: 'A+', label: '최우수', color: '#27ae60' };
  if (totalScore >= 75) return { grade: 'A', label: '우수', color: '#2ecc71' };
  if (totalScore >= 65) return { grade: 'B+', label: '양호', color: '#3498db' };
  if (totalScore >= 55) return { grade: 'B', label: '보통', color: '#f39c12' };
  if (totalScore >= 40) return { grade: 'C', label: '미흡', color: '#e67e22' };
  return { grade: 'D', label: '취약', color: '#e74c3c' };
}

async function calcScore({ populationData, transitData, franchiseData, facilityData }) {
  const avgPop = await getDaeguAvgPopulation();

  const population = calcPopulationScore(populationData, avgPop);
  const transit = calcTransitScore(transitData);
  const franchise = calcFranchiseScore(franchiseData);
  const facility = calcFacilityScore(facilityData);

  const totalScore = population.score + transit.score + franchise.score + facility.score;
  const grade = getGrade(totalScore);

  return {
    totalScore,
    grade,
    breakdown: { population, transit, franchise, facility },
  };
}

module.exports = { calcScore };