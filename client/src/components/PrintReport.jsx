import React from 'react';

function CompetitionBar({ level }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          width: 12, height: 12, borderRadius: 2,
          background: i <= level ? '#0d1b2e' : '#e0e2e6',
        }} />
      ))}
    </div>
  );
}

export default function PrintReport({ center, address, radius, populationData, franchiseData, transitData }) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  const radiusStr = radius >= 1000 ? `${radius / 1000}km` : `${radius}m`;

  return (
    <div id="print-report" style={{
      display: 'none',
      fontFamily: "'Noto Sans KR', sans-serif",
      color: '#0d1b2e',
      fontSize: 11,
      lineHeight: 1.5,
    }}>
      {/* 헤더 */}
      <div style={{
        borderBottom: '3px solid #0d1b2e',
        paddingBottom: 12, marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
            상권/입지 분석 리포트
          </div>
          <div style={{ fontSize: 11, color: '#5a6a7e', marginTop: 3 }}>
            세종홀딩스 내부 분석 자료
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#5a6a7e' }}>
          <div>분석일: {dateStr}</div>
          <div>분석 반경: {radiusStr}</div>
        </div>
      </div>

      {/* 분석 위치 */}
      <div style={{
        background: '#f0f2f5', borderRadius: 8, padding: '10px 14px',
        marginBottom: 16, borderLeft: '4px solid #c9a84c',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>📍 분석 위치</div>
        <div style={{ marginTop: 4, color: '#1e3a5f', fontWeight: 500 }}>
          {address || (center ? `${Number(center.lat).toFixed(5)}, ${Number(center.lng).toFixed(5)}` : '-')}
        </div>
        {populationData && (
          <div style={{ fontSize: 10, color: '#5a6a7e', marginTop: 2 }}>
            행정동: 대구광역시 {populationData.sigunguName} {populationData.dongName}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {/* 생활인구 */}
        {populationData && (
          <div style={{ border: '1px solid #e2e6ea', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e2e6ea' }}>
              👥 생활인구
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#5a6a7e' }}>거주 인구 </span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{populationData.total.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: '#5a6a7e' }}>명</span>
            </div>
            <div style={{ fontSize: 10, color: '#5a6a7e', marginBottom: 6 }}>
              남 {populationData.totalM.toLocaleString()}명 · 여 {populationData.totalF.toLocaleString()}명
              {populationData.maxAge && ` · ${populationData.maxAge} 최다`}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              {populationData.ageGroups.map((g) => (
                <tr key={g.age}>
                  <td style={{ padding: '2px 0', color: '#5a6a7e', width: 60 }}>{g.age}</td>
                  <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: g.age === populationData.maxAge ? 700 : 400 }}>
                    {g.total.toLocaleString()}명
                  </td>
                </tr>
              ))}
            </table>
          </div>
        )}

        {/* 대중교통 */}
        {transitData && (
          <div style={{ border: '1px solid #e2e6ea', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e2e6ea' }}>
              🚇 대중교통
            </div>
            <div style={{ marginBottom: 8, fontSize: 10, color: '#5a6a7e' }}>
              지하철역 {transitData.subway.count}개 · 버스정류장 {transitData.bus.count}개
            </div>
            {transitData.subway.stations.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>지하철</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 8 }}>
                  {transitData.subway.stations.slice(0, 5).map((s, i) => (
                    <tr key={i}>
                      <td style={{ padding: '2px 0', color: '#5a6a7e' }}>{s.name}역</td>
                      <td style={{ padding: '2px 0', color: '#5a6a7e' }}>{s.line}</td>
                      <td style={{ padding: '2px 0', textAlign: 'right' }}>
                        {s.distance >= 1000 ? `${(s.distance/1000).toFixed(1)}km` : `${s.distance}m`}
                      </td>
                    </tr>
                  ))}
                </table>
              </>
            )}
            {transitData.bus.stations.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>버스 정류장 (근접순)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  {transitData.bus.stations.slice(0, 5).map((s, i) => (
                    <tr key={i}>
                      <td style={{ padding: '2px 0', color: '#5a6a7e' }}>{s.name}</td>
                      <td style={{ padding: '2px 0', textAlign: 'right' }}>
                        {s.distance >= 1000 ? `${(s.distance/1000).toFixed(1)}km` : `${s.distance}m`}
                      </td>
                    </tr>
                  ))}
                </table>
              </>
            )}
          </div>
        )}
      </div>

      {/* 업종 현황 */}
      {franchiseData && (
        <div style={{ border: '1px solid #e2e6ea', borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e2e6ea', display: 'flex', justifyContent: 'space-between' }}>
            <span>🏪 업종 현황</span>
            <span style={{ fontWeight: 400, color: '#5a6a7e', fontSize: 10 }}>
              총 {franchiseData.totalCount.toLocaleString()}개 상가업소
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e6ea' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', color: '#5a6a7e', fontWeight: 400 }}>업종</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: '#5a6a7e', fontWeight: 400 }}>경쟁강도</th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: '#5a6a7e', fontWeight: 400 }}>매장 수</th>
              </tr>
            </thead>
            <tbody>
              {franchiseData.byCategory.slice(0, 8).map((cat) => (
                <tr key={cat.code} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '4px 0', fontWeight: 500 }}>{cat.name}</td>
                  <td style={{ padding: '4px 0' }}>
                    <CompetitionBar level={cat.competitionLevel} />
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>
                    {cat.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 푸터 */}
      <div style={{
        borderTop: '1px solid #e2e6ea', paddingTop: 10,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: '#9aa5b1',
      }}>
        <span>세종홀딩스 상권/입지 분석 시스템</span>
        <span>본 자료는 내부 검토 목적으로만 사용하시기 바랍니다.</span>
      </div>
    </div>
  );
}