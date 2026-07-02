import { fetchFranchiseAnalysis, fetchPopulationAnalysis, fetchTransitAnalysis, fetchFacilityAnalysis } from '../api/analysis';

export async function printLocationReport(locationData, aiData) {
  const { address, lat, lng, analysis_radius: radius = 500,
    target_business, premium, deposit, monthly_rent, interior_budget,
    other_initial_cost, expected_daily_sales, floor_info, is_corner,
    visibility_score, accessibility_score, parking_available,
    building_age, nearby_vacancy_rate, contract_period,
    landlord_asking_rent, desired_rent, field_memo } = locationData;

  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  const radiusStr = radius >= 1000 ? `${radius / 1000}km` : `${radius}m`;
  const totalInitial = (Number(premium)||0)+(Number(deposit)||0)+(Number(interior_budget)||0)+(Number(other_initial_cost)||0);
  const monthlyRevenue = (Number(expected_daily_sales)||0) * 25;
  const paybackMonths = (monthlyRevenue - (Number(monthly_rent)||0)) > 0
    ? Math.ceil(totalInitial / (monthlyRevenue - (Number(monthly_rent)||0))) : null;

  // 상권 분석 데이터 실시간 조회
  let populationData = null, franchiseData = null, transitData = null, facilityData = null;
  if (lat && lng) {
    const [pop, fra, tra, fac] = await Promise.allSettled([
      fetchPopulationAnalysis({ lat, lng }),
      fetchFranchiseAnalysis({ lat, lng, radius }),
      fetchTransitAnalysis({ lat, lng, radius }),
      fetchFacilityAnalysis({ lat, lng, radius }),
    ]);
    if (pop.status === 'fulfilled') populationData = pop.value;
    if (fra.status === 'fulfilled') franchiseData = fra.value;
    if (tra.status === 'fulfilled') transitData = tra.value;
    if (fac.status === 'fulfilled') facilityData = fac.value;
  }

  const competitionBar = (level) =>
    Array.from({ length: 5 }, (_, i) =>
      `<div style="width:10px;height:10px;border-radius:2px;background:${i < level ? '#0d1b2e' : '#e0e2e6'};display:inline-block;margin-right:2px;"></div>`
    ).join('');

  // AI 판정 섹션
  const verdictColor = aiData?.verdict === 'GO' ? '#2ecc71' : aiData?.verdict === 'NO_GO' ? '#e74c3c' : '#f39c12';
  const verdictLabel = aiData?.verdict === 'GO' ? '✅ GO' : aiData?.verdict === 'NO_GO' ? '❌ NO-GO' : '⚠️ 조건부 GO';

  const aiHtml = aiData?.verdict ? `
    <div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:10px;padding:14px 16px;margin-bottom:14px;color:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;">🤖 AI 종합 분석</div>
        <div style="background:${verdictColor};color:#fff;font-size:14px;font-weight:800;padding:5px 14px;border-radius:8px;">${verdictLabel}</div>
      </div>
      ${aiData.summary ? `<div style="font-size:11px;color:rgba(255,255,255,0.85);line-height:1.7;margin-bottom:10px;">${aiData.summary}</div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:10px;">
        ${aiData.strengths?.length > 0 ? `
          <div>
            <div style="color:#2ecc71;font-weight:600;margin-bottom:4px;">✅ 강점</div>
            ${aiData.strengths.map(s => `<div style="color:rgba(255,255,255,0.8);margin-bottom:3px;">· ${s}</div>`).join('')}
          </div>
        ` : ''}
        ${aiData.risks?.length > 0 ? `
          <div>
            <div style="color:#e74c3c;font-weight:600;margin-bottom:4px;">⚠️ 리스크</div>
            ${aiData.risks.map(r => `<div style="color:rgba(255,255,255,0.8);margin-bottom:3px;">· ${r}</div>`).join('')}
          </div>
        ` : ''}
      </div>
      ${aiData.verdictReason ? `<div style="font-size:10px;color:rgba(255,255,255,0.65);margin-top:8px;font-style:italic;">${aiData.verdictReason}</div>` : ''}
    </div>
  ` : '';

  // 재무 섹션
  const financeHtml = `
    <div class="card">
      <div class="card-title">💰 재무 현황</div>
      <table class="data-table">
        <tr><td style="color:#5a6a7e;">권리금</td><td style="text-align:right;font-weight:500;">${premium ? `${Number(premium).toLocaleString()}만원` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">보증금</td><td style="text-align:right;font-weight:500;">${deposit ? `${Number(deposit).toLocaleString()}만원` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">월세</td><td style="text-align:right;font-weight:500;">${monthly_rent ? `${Number(monthly_rent).toLocaleString()}만원` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">인테리어</td><td style="text-align:right;font-weight:500;">${interior_budget ? `${Number(interior_budget).toLocaleString()}만원` : '-'}</td></tr>
        <tr style="border-top:1px solid #e2e6ea;">
          <td style="font-weight:600;">총 초기투자금</td>
          <td style="text-align:right;font-weight:700;color:#0d1b2e;">${totalInitial.toLocaleString()}만원</td>
        </tr>
        <tr><td style="color:#5a6a7e;">예상 일매출</td><td style="text-align:right;">${expected_daily_sales ? `${Number(expected_daily_sales).toLocaleString()}만원` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">투자금 회수</td><td style="text-align:right;">${paybackMonths ? `약 ${paybackMonths}개월` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">임대인 제시</td><td style="text-align:right;">${landlord_asking_rent ? `${Number(landlord_asking_rent).toLocaleString()}만원` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">희망 임대료</td><td style="text-align:right;">${desired_rent ? `${Number(desired_rent).toLocaleString()}만원` : '-'}</td></tr>
      </table>
    </div>
  `;

  // 현장 체크 섹션
  const fieldHtml = `
    <div class="card">
      <div class="card-title">🏢 현장 체크</div>
      <table class="data-table">
        <tr><td style="color:#5a6a7e;">업종</td><td style="text-align:right;font-weight:500;">${target_business || '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">층수</td><td style="text-align:right;">${floor_info || '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">코너</td><td style="text-align:right;">${is_corner ? '✅ 코너 위치' : '일반 위치'}</td></tr>
        <tr><td style="color:#5a6a7e;">가시성</td><td style="text-align:right;">${visibility_score}/5점</td></tr>
        <tr><td style="color:#5a6a7e;">접근성</td><td style="text-align:right;">${accessibility_score}/5점</td></tr>
        <tr><td style="color:#5a6a7e;">주차</td><td style="text-align:right;">${parking_available ? '가능' : '불가'}</td></tr>
        <tr><td style="color:#5a6a7e;">건물 연식</td><td style="text-align:right;">${building_age ? `${building_age}년` : '-'}</td></tr>
        <tr><td style="color:#5a6a7e;">주변 공실율</td><td style="text-align:right;">${nearby_vacancy_rate || 0}%</td></tr>
        <tr><td style="color:#5a6a7e;">계약 기간</td><td style="text-align:right;">${contract_period || '-'}</td></tr>
      </table>
      ${field_memo ? `<div style="margin-top:8px;padding:8px;background:#f8f9fb;border-radius:6px;font-size:10px;color:#5a6a7e;line-height:1.6;">${field_memo}</div>` : ''}
    </div>
  `;

  // 상권 분석 섹션
  const populationHtml = populationData ? `
    <div class="card">
      <div class="card-title">👥 생활인구</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${populationData.total?.toLocaleString()}명</div>
      <div style="font-size:10px;color:#5a6a7e;margin-bottom:8px;">남 ${populationData.totalM?.toLocaleString()}명 · 여 ${populationData.totalF?.toLocaleString()}명 · ${populationData.maxAge} 최다</div>
      <table class="data-table">
        ${populationData.ageGroups?.map(g => `
          <tr>
            <td style="color:#5a6a7e;">${g.age}</td>
            <td style="text-align:right;font-weight:${g.age === populationData.maxAge ? '700' : '400'}">${g.total?.toLocaleString()}명</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const transitHtml = transitData ? `
    <div class="card">
      <div class="card-title">🚇 대중교통</div>
      <div style="font-size:10px;color:#5a6a7e;margin-bottom:8px;">지하철 ${transitData.subway?.count}개 · 버스 ${transitData.bus?.count}개</div>
      ${transitData.subway?.stations?.slice(0,3).map(s => `
        <div style="font-size:10px;margin-bottom:3px;">· ${s.name}역 (${s.line}) ${s.distance >= 1000 ? `${(s.distance/1000).toFixed(1)}km` : `${s.distance}m`}</div>
      `).join('')}
    </div>
  ` : '';

  const franchiseHtml = franchiseData ? `
    <div class="card full-width">
      <div class="card-title" style="display:flex;justify-content:space-between;">
        <span>🏪 업종 현황</span>
        <span style="font-weight:400;color:#5a6a7e;font-size:10px;">총 ${franchiseData.totalCount?.toLocaleString()}개</span>
      </div>
      <table class="data-table">
        <thead><tr style="border-bottom:1px solid #e2e6ea;">
          <th style="text-align:left;color:#5a6a7e;font-weight:400;">업종</th>
          <th style="text-align:left;color:#5a6a7e;font-weight:400;">경쟁강도</th>
          <th style="text-align:right;color:#5a6a7e;font-weight:400;">매장수</th>
        </tr></thead>
        <tbody>
          ${franchiseData.byCategory?.slice(0,7).map(cat => `
            <tr style="border-bottom:1px solid #f0f2f5;">
              <td style="padding:3px 0;font-weight:500;">${cat.name}</td>
              <td style="padding:3px 0;">${competitionBar(cat.competitionLevel)}</td>
              <td style="padding:3px 0;text-align:right;font-weight:600;">${cat.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // 체크리스트 섹션
  const checklistHtml = aiData?.checklist?.length > 0 ? `
    <div class="card full-width">
      <div class="card-title">📋 계약 전 확인 체크리스트</div>
      ${aiData.checklist.map(item => `
        <div style="font-size:10px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
          <span style="width:14px;height:14px;border:1px solid #e2e6ea;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;">
            ${item.checked ? '✓' : ''}
          </span>
          <span style="color:#2d3748;">${typeof item === 'object' ? item.text : item}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>세종홀딩스 입지 분석 리포트</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans KR', sans-serif; font-size: 11px; color: #0d1b2e; padding: 18mm 16mm; background: #fff; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0d1b2e; padding-bottom: 12px; margin-bottom: 14px; }
    .header-title { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header-sub { font-size: 11px; color: #5a6a7e; margin-top: 3px; }
    .location-bar { background: #f0f2f5; border-left: 4px solid #c9a84c; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .card { border: 1px solid #e2e6ea; border-radius: 8px; padding: 10px 12px; }
    .card.full-width { grid-column: 1 / -1; }
    .card-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e6ea; display:flex;justify-content:space-between; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table td, .data-table th { padding: 3px 0; }
    .footer { border-top: 1px solid #e2e6ea; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #9aa5b1; margin-top: 10px; }
    @media print { body { padding: 0; } @page { size: A4; margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">입지 분석 리포트</div>
      <div class="header-sub">세종홀딩스 내부 분석 자료 · 분석 반경 ${radiusStr}</div>
    </div>
    <div style="text-align:right;font-size:10px;color:#5a6a7e;">
      <div>분석일: ${dateStr}</div>
      ${target_business ? `<div>업종: ${target_business}</div>` : ''}
    </div>
  </div>

  <div class="location-bar">
    <div style="font-size:11px;font-weight:600;margin-bottom:3px;">📍 분석 위치</div>
    <div style="font-size:12px;color:#1e3a5f;font-weight:500;">${address || '-'}</div>
  </div>

  ${aiHtml}

  <div class="grid">
    ${financeHtml}
    ${fieldHtml}
    ${populationHtml}
    ${transitHtml}
    ${franchiseHtml}
    ${checklistHtml}
  </div>

  <div class="footer">
    <span>세종홀딩스 상권/입지 분석 시스템 · 데이터: 소상공인시장진흥공단, 행정안전부, 교육부</span>
    <span>내부 검토 목적 자료</span>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}