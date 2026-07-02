import React, { useState } from 'react';

const SCHOOL_TYPES = [
  { key: 'elementary', label: '초등학교', color: '#3498db' },
  { key: 'middle', label: '중학교', color: '#2ecc71' },
  { key: 'high', label: '고등학교', color: '#9b59b6' },
];

export default function SchoolTab({ data, loading }) {
  const [activeType, setActiveType] = useState('elementary');

  if (loading) return <p style={{ color: '#888', padding: '16px 0', fontSize: 13 }}>분석 중...</p>;
  if (!data && !loading) return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>지도를 클릭해서 위치를 선택하세요.</p>;
  if (!data) return null;

  const current = data[activeType];
  const currentType = SCHOOL_TYPES.find(t => t.key === activeType);

  return (
    <div>
      {/* 요약 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {SCHOOL_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => setActiveType(type.key)}
            style={{
              padding: '5px 12px', borderRadius: 16, border: 'none',
              background: activeType === type.key ? type.color : '#f0f2f5',
              color: activeType === type.key ? '#fff' : '#5a6a7e',
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {type.label} {data[type.key].count}개
          </button>
        ))}
      </div>

      {current.count === 0 ? (
        <p style={{ fontSize: 13, color: '#aaa' }}>반경 내 {currentType.label}이 없습니다.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e2e6' }}>
              <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>학교명</th>
              <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 400 }}>거리</th>
            </tr>
          </thead>
          <tbody>
            {current.items.map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f1f3' }}>
                <td style={{ padding: '8px 0', fontWeight: 500 }}>{s.name}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', color: '#666', whiteSpace: 'nowrap' }}>
                  {s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${s.distance}m`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}