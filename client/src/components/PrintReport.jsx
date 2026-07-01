// 인쇄용 HTML을 새 탭에 열어서 인쇄하는 유틸 함수
export function printReport({ center, address, radius, populationData, franchiseData, transitData }) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  const radiusStr = radius >= 1000 ? `${radius / 1000}km` : `${radius}m`;

  const competitionBar = (level) => {
    return Array.from({ length: 5 }, (_, i) =>
      `<div style="width:11px;height:11px;border-radius:2px;background:${i < level ? '#0d1b2e' : '#e0e2e6'};display:inline-block;margin-right:2px;"></div>`
    ).join('');
  };

  const populationHtml = populationData ? `
    <div class="card">
      <div class="card-title">👥 생활인구</div>
      <div style="margin-bottom:8px;">
        <span style="font-size:20px;font-weight:700;">${populationData.total.toLocaleString()}</span>
        <span style="font-size:11px;color:#5a6a7e;">명 (거주인구)</span>
      </div>
      <div style="font-size:10px;color:#5a6a7e;margin-bottom:8px;">
        남 ${populationData.totalM.toLocaleString()}명 · 여 ${populationData.totalF.toLocaleString()}명
        ${populationData.maxAge ? ` · ${populationData.maxAge} 인구 최다` : ''}
      </div>
      <table class="data-table">
        ${populationData.ageGroups.map(g => `
          <tr>
            <td style="color:#5a6a7e;width:60px;">${g.age}</td>
            <td style="text-align:right;font-weight:${g.age === populationData.maxAge ? '700' : '400'};">
              ${g.total.toLocaleString()}명
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  const transitHtml = transitData ? `
    <div class="card">
      <div class="card-title">🚇 대중교통</div>
      <div style="font-size:10px;color:#5a6a7e;margin-bottom:8px;">
        지하철역 ${transitData.subway.count}개 · 버스정류장 ${transitData.bus.count}개
      </div>
      ${transitData.subway.stations.length > 0 ? `
        <div style="font-size:10px;font-weight:600;margin-bottom:4px;">지하철</div>
        <table class="data-table" style="margin-bottom:8px;">
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
        <div style="font-size:10px;font-weight:600;margin-bottom:4px;">버스 정류장 (근접순)</div>
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

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>세종홀딩스 상권/입지 분석 리포트</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans KR', sans-serif;
      font-size: 11px;
      color: #0d1b2e;
      padding: 20mm 18mm;
      background: #fff;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 3px solid #0d1b2e;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-title { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header-sub { font-size: 11px; color: #5a6a7e; margin-top: 3px; }
    .header-right { text-align: right; font-size: 10px; color: #5a6a7e; }
    .location-bar {
      background: #f0f2f5;
      border-left: 4px solid #c9a84c;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .location-bar .label { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
    .location-bar .address { font-size: 12px; color: #1e3a5f; font-weight: 500; }
    .location-bar .dong { font-size: 10px; color: #5a6a7e; margin-top: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .card {
      border: 1px solid #e2e6ea;
      border-radius: 8px;
      padding: 12px;
    }
    .card.full-width { grid-column: 1 / -1; }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e6ea;
    }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table td, .data-table th { padding: 3px 0; }
    .footer {
      border-top: 1px solid #e2e6ea;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9aa5b1;
      margin-top: 14px;
    }
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">상권/입지 분석 리포트</div>
      <div class="header-sub">세종홀딩스 내부 분석 자료</div>
    </div>
    <div class="header-right">
      <div>분석일: ${dateStr}</div>
      <div>분석 반경: ${radiusStr}</div>
    </div>
  </div>

  <div class="location-bar">
    <div class="label">📍 분석 위치</div>
    <div class="address">${address || (center ? `${Number(center.lat).toFixed(5)}, ${Number(center.lng).toFixed(5)}` : '-')}</div>
    ${populationData ? `<div class="dong">행정동: 대구광역시 ${populationData.sigunguName} ${populationData.dongName}</div>` : ''}
  </div>

  <div class="grid">
    ${populationHtml}
    ${transitHtml}
    ${franchiseHtml}
  </div>

  <div class="footer">
    <span>세종홀딩스 상권/입지 분석 시스템</span>
    <span>본 자료는 내부 검토 목적으로만 사용하시기 바랍니다.</span>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}