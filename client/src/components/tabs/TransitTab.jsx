import React, { useState } from 'react';

const LINE_COLORS = {
  '1호선': '#d93f2c',
  '2호선': '#2a9d45',
  '3호선': '#f5a623',
};

export default function TransitTab({ data, loading }) {
  const [showAllBus, setShowAllBus] = useState(false);

  if (loading) {
    return <p style={{ color: '#888', padding: '16px 0', fontSize: 13 }}>분석 중...</p>;
  }

  if (!data && !loading) {
    return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>지도를 클릭해서 위치를 선택하세요.</p>;
  }

  if (!data) return null;

  const busToShow = showAllBus ? data.bus.stations : data.bus.stations.slice(0, 10);

  return (
    <div>
      {/* 지하철 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            background: '#1a2233', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
          }}>지하철</span>
          <span style={{ fontSize: 13, color: '#666' }}>
            분석 지역에 지하철역이 <strong>{data.subway.count}개</strong> 있어요
          </span>
        </div>

        {data.subway.count === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa' }}>반경 내 지하철역이 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e2e6' }}>
                <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>역명</th>
                <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>호선</th>
                <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 400 }}>거리</th>
              </tr>
            </thead>
            <tbody>
              {data.subway.stations.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f1f3' }}>
                  <td style={{ padding: '9px 0', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '9px 0' }}>
                    <span style={{
                      background: LINE_COLORS[s.line] || '#888',
                      color: '#fff', fontSize: 11,
                      padding: '2px 7px', borderRadius: 10,
                    }}>{s.line}</span>
                  </td>
                  <td style={{ padding: '9px 0', textAlign: 'right', color: '#666' }}>
                    {s.distance >= 1000
                      ? `${(s.distance / 1000).toFixed(1)}km`
                      : `${s.distance}m`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 버스 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            background: '#2a7fc1', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
          }}>버스</span>
          <span style={{ fontSize: 13, color: '#666' }}>
            분석 지역에 버스 정류장이 <strong>{data.bus.count}개</strong> 있어요
          </span>
        </div>

        {data.bus.count === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa' }}>반경 내 버스 정류장이 없습니다.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e2e6' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>정류장명</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 400 }}>거리</th>
                </tr>
              </thead>
              <tbody>
                {busToShow.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f1f3' }}>
                    <td style={{ padding: '8px 0' }}>{s.name}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: '#666' }}>
                      {s.distance >= 1000
                        ? `${(s.distance / 1000).toFixed(1)}km`
                        : `${s.distance}m`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.bus.stations.length > 10 && (
              <button
                onClick={() => setShowAllBus(!showAllBus)}
                style={{
                  marginTop: 8, fontSize: 12, color: '#2a7fc1',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                {showAllBus
                  ? '접기'
                  : `${data.bus.stations.length - 10}개 더보기 ▼`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}