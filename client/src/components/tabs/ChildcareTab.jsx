import React from 'react';

function FacilityList({ items, emptyMsg }) {
  if (!items || items.length === 0) return <p style={{ fontSize: 13, color: '#aaa' }}>{emptyMsg}</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 8 }}>
      <tbody>
        {items.map((f, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f0f1f3' }}>
            <td style={{ padding: '8px 0', fontWeight: 500 }}>{f.name}</td>
            <td style={{ padding: '8px 0', textAlign: 'right', color: '#666', whiteSpace: 'nowrap' }}>
              {f.distance >= 1000 ? `${(f.distance / 1000).toFixed(1)}km` : `${f.distance}m`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ChildcareTab({ data, loading }) {
  if (loading) return <p style={{ color: '#888', padding: '16px 0', fontSize: 13 }}>분석 중...</p>;
  if (!data && !loading) return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>지도를 클릭해서 위치를 선택하세요.</p>;
  if (!data) return null;

  const kinder = data.kindergarten;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ background: '#f39c12', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>유치원</span>
        <span style={{ fontSize: 13, color: '#666' }}>
          분석 지역에 유치원이 <strong>{kinder.count}개</strong> 있어요
        </span>
      </div>
      <FacilityList items={kinder.items.slice(0, 20)} emptyMsg="반경 내 유치원이 없습니다." />
    </div>
  );
}