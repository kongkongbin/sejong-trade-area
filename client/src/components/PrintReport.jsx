export function printReport({ center, address, radius, populationData, franchiseData, transitData, facilityData, scoreData }) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  const radiusStr = radius >= 1000 ? `${radius / 1000}km` : `${radius}m`;

  const competitionBar = (level) =>
    Array.from({ length: 5 }, (_, i) =>
      `<div style="width:11px;height:11px;border-radius:2px;background:${i < level ? '#0d1b2e' : '#e0e2e6'};display:inline-block;margin-right:2px;"></div>`
    ).join('');

  const scoreHtml = scoreData ? `
    <div style="background:linear-gradient(135deg,#0d1b2e,#1e3a5f);border-radius:10px;padding:14px 16px;margin-bottom:14px;color:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:3px;">종합 상권 점수</div>
          <div style="font-size:26px;font-weight:700;">${scoreData.totalScore}<span style="font-size:12px;font-weight:400;color:rgba(255,255,255,0.6);">/100</span></div>
        </div>
        <div style="text-align:center;">
          <div style="background:${scoreData.grade.color};color:#fff;font-size:18px;font-weight:800;padding:6px 16px;border-radius:8px;">${scoreData.grade.grade}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:3px;">${scoreData.grade.label}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:10px;">
        <div><div style="color:rgba(255,255,255,0.6);margin-bottom:2px;">👥 생활인구</div><div style="color:rgba(255,255,255,0.9);">${scoreData.breakdown.population.comment}</div></div>
        <div><div style="color:rgba(255,255,255,0.6);margin-bottom:2px;">🚇 교통 접근성</div><div style="color:rgba(255,255,255,0.9);">${scoreData.breakdown.transit.comment}</div></div>
        <div><div style="color:rgba(255,255,255,0.6);margin-bottom:2px;">🏪 상권 활성도</div><div style="color:rgba(255,255,255,0.9);">${scoreData.breakdown.franchise.comment}</div></div>
        <div><div style="color:rgba(255,255,255,0.6);margin-bottom:2px;">🏥 생활 인프라</div><div style="color:rgba(255,255,255,0.9);">${scoreData.breakdown.facility.comment}</div></div>
      </div>
    </div>
  ` : '';

  const populationHtml = populationData ? `
    <div class="card">
      <div class="card-title">👥 생활인구</div>
      <div style="margin-bottom:6px;">
        <span style="font-size:18px;font-weight:700;">${populationData.total.toLocaleString()}</span>
        <span style="font-size:10px;color:#5a6a7e;">명 (거주인구)</span>
      </div>
      <div style="font-size:10px;color:#5a6a7e;margin-bottom:6px;">
        남 ${populationData.totalM.toLocaleString()}명 · 여 ${populationData.totalF.toLocaleString()}명
        ${populationData.maxAge ? ` · ${populationData.maxAge} 최다` : ''}
        ${scoreData ? ` · ${scoreData.breakdown.population.compareText}` : ''}
      </div>
      <table class="data-table">
        ${populationData.ageGroups.map(g => `
          <tr>
            <td style="color:#5a6a7e;width:60px;">${g.age}</td>
            <td style="text-align:right;font-weight:${g.age === populationData.maxAge ? '700' : '400'};">${g.total.toLocaleString()}명</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const transitHtml = transitData ? `
    <div class="card">
      <div class="card-title">🚇 대중교통</div>
      <div style="font-size:10px;color:#5a6a7e;margin-bottom:6px;">
        지하철역 ${transitData.subway.count}개 · 버스정류장 ${transitData.bus.count}개
        ${scoreData ? ` · ${scoreData.breakdown.transit.level}` : ''}
      </div>
      ${transitData.subway.stations.length > 0 ? `
        <div style="font-size:10px;font-weight:600;margin-bottom:3px;">지하철</div>
        <table class="data-table" style="margin-bottom:6px;">
          ${transitData.subway.stations.slice(0, 5).map(s => `
            <tr>
              <td style="color:#5a6a7e;">${s.name}역</td>
              <td style="color:#5a6a7e;">${s.line}</td>
              <td style="text-align:right;">${s.distance >= 1000 ? `${(s.distance/1000).toFixed(1)}km` : `${s.distance}m`}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      ${transitData.bus.stations.length > 0 ? `
        <div style="font-size:10px;font-weight:600;margin-bottom:3px;">버스 정류장 (근접순)</div>
        <table class="data-table">
          ${transitData.bus.stations.slice(0, 5).map(s => `
            <tr>
              <td style="color:#5a6a7e;">${s.name}</td>
              <td style="text-align:right;">${s.distance >= 1000 ? `${(s.distance/1000).toFixed(1)}km` : `${s.distance}m`}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
    </div>
  ` : '';

  const franchiseHtml = franchiseData ? `
    <div class="card full-width">
      <div class="card-title" style="display:flex;justify-content:space-between;">
        <span>🏪 업종 현황</span>
        <span style="font-weight:400;color:#5a6a7e;font-size:10px;">총 ${franchiseData.totalCount.toLocaleString()}개 상가업소</span>
      </div>
      <table class="data-table">
        <thead>
          <tr style="border-bottom:1px solid #e2e6ea;">
            <th style="text-align:left;padding:4px 0;color:#5a6a7e;font-weight:400;">업종</th>
            <th style="text-align:left;padding:4px 0;color:#5a6a7e;font-weight:400;">경쟁강도</th>
            <th style="text-align:right;padding:4px 0;color:#5a6a7e;font-weight:400;">매장 수</th>
          </tr>
        </thead>
        <tbody>
          ${franchiseData.byCategory.slice(0, 8).map(cat => `
            <tr style="border-bottom:1px solid #f0f2f5;">
              <td style="padding:4px 0;font-weight:500;">${cat.name}</td>
              <td style="padding:4px 0;">${competitionBar(cat.competitionLevel)}</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">${cat.count.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const facilityHtml = facilityData ? `
    <div class="card full-width">
      <div class="card-title">🏥 주변 시설</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:10px;">
        <div>
          <div style="font-weight:600;margin-bottom:4px;color:#e74c3c;">의료기관 ${facilityData.hospital?.count || 0}개</div>
          ${(facilityData.hospital?.items || []).slice(0, 3).map(h => `
            <div style="color:#5a6a7e;margin-bottom:2px;">· ${h.name} (${h.distance >= 1000 ? `${(h.distance/1000).toFixed(1)}km` : `${h.distance}m`})</div>
          `).join('')}
        </div>
        <div>
          <div style="font-weight:600;margin-bottom:4px;color:#3498db;">학교 ${(facilityData.elementary?.count||0)+(facilityData.middle?.count||0)+(facilityData.high?.count||0)}개</div>
          ${[...(facilityData.elementary?.items||[]), ...(facilityData.middle?.items||[]), ...(facilityData.high?.items||[])].slice(0,3).map(s => `
            <div style="color:#5a6a7e;margin-bottom:2px;">· ${s.name} (${s.distance >= 1000 ? `${(s.distance/1000).toFixed(1)}km` : `${s.distance}m`})</div>
          `).join('')}
        </div>
        <div>
          <div style="font-weight:600;margin-bottom:4px;color:#f39c12;">유치원 ${facilityData.kindergarten?.count || 0}개</div>
          ${(facilityData.kindergarten?.items || []).slice(0, 3).map(k => `
            <div style="color:#5a6a7e;margin-bottom:2px;">· ${k.name} (${k.distance >= 1000 ? `${(k.distance/1000).toFixed(1)}km` : `${k.distance}m`})</div>
          `).join('')}
        </div>
      </div>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>세종홀딩스 상권/입지 분석 리포트</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans KR', sans-serif; font-size: 11px; color: #0d1b2e; padding: 20mm 18mm; background: #fff; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0d1b2e; padding-bottom: 12px; margin-bottom: 14px; }
    .header-title { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header-sub { font-size: 11px; color: #5a6a7e; margin-top: 3px; }
    .header-right { text-align: right; font-size: 10px; color: #5a6a7e; }
    .location-bar { background: #f0f2f5; border-left: 4px solid #c9a84c; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; }
    .location-bar .label { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
    .location-bar .address { font-size: 12px; color: #1e3a5f; font-weight: 500; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .card { border: 1px solid #e2e6ea; border-radius: 8px; padding: 10px 12px; }
    .card.full-width { grid-column: 1 / -1; }
    .card-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e6ea; display:flex; justify-content:space-between; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table td, .data-table th { padding: 3px 0; }
    .footer { border-top: 1px solid #e2e6ea; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #9aa5b1; margin-top: 10px; }
    @media print { body { padding: 0; } @page { size: A4; margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">상권/입지 분석 리포트</div>
      <div class="header-sub">세종홀딩스 내부 분석 자료 · 분석 반경 ${radiusStr}</div>
    </div>
    <div class="header-right">
      <div>분석일: ${dateStr}</div>
    </div>
  </div>

  <div class="location-bar">
    <div class="label">📍 분석 위치</div>
    <div class="address">${address || (center ? `${Number(center.lat).toFixed(5)}, ${Number(center.lng).toFixed(5)}` : '-')}</div>
    ${populationData ? `<div style="font-size:10px;color:#5a6a7e;margin-top:2px;">행정동: 대구광역시 ${populationData.sigunguName} ${populationData.dongName}</div>` : ''}
  </div>

  ${scoreHtml}

  <div class="grid">
    ${populationHtml}
    ${transitHtml}
    ${franchiseHtml}
    ${facilityHtml}
  </div>

  <div class="footer">
    <span>세종홀딩스 상권/입지 분석 시스템 · 데이터 출처: 소상공인시장진흥공단, 행정안전부, 교육부</span>
    <span>본 자료는 내부 검토 목적으로만 사용하시기 바랍니다.</span>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}