import React from 'react';

export default function HospitalTab({ data, loading }) {
  if (loading) return <p style={{ color: '#888', padding: '16px 0', fontSize: 13 }}>분석 중...</p>;
  if (!data && !loading) return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>지도를 클릭해서 위치를 선택하세요.</p>;
  if (!data) return null;

  const hospitals = data.hospital;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>종합병원</span>
        <span style={{ fontSize: 13, color: '#666' }}>
          분석 지역에 종합병원이 <strong>{hospitals.count}개</strong> 있어요
        </span>
      </div>

      {hospitals.count === 0 ? (
        <p style={{ fontSize: 13, color: '#aaa' }}>반경 내 종합병원이 없습니다.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e2e6' }}>
              <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>병원명</th>
              <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 400 }}>거리</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.items.map((h, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f1f3' }}>
                <td style={{ padding: '9px 0' }}>
                  <div style={{ fontWeight: 500 }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: '#9aa5b1', marginTop: 2 }}>{h.address}</div>
                </td>
                <td style={{ padding: '9px 0', textAlign: 'right', color: '#666', whiteSpace: 'nowrap' }}>
                  {h.distance >= 1000 ? `${(h.distance / 1000).toFixed(1)}km` : `${h.distance}m`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}