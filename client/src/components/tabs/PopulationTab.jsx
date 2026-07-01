import React from 'react';

function AgeBar({ value, max, gender }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = gender === 'M' ? '#4a7fc1' : '#e05c7a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
      <div style={{
        width: `${pct}%`, maxWidth: '100%', height: 10,
        background: color, borderRadius: 2, minWidth: pct > 0 ? 2 : 0,
        transition: 'width 0.3s',
      }} />
      <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function PopulationTab({ data, loading }) {
  if (loading) {
    return <p style={{ color: '#888', padding: '16px 0', fontSize: 13 }}>분석 중...</p>;
  }

  if (!data && !loading) {
    return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>지도를 클릭해서 위치를 선택하세요.</p>;
  }

  if (!data) return null;

  const maxGroupTotal = Math.max(...data.ageGroups.map((g) => g.total));

  return (
    <div>
      {/* 행정동 정보 */}
      <div style={{
        background: '#f4f5f7', borderRadius: 8, padding: '10px 14px',
        marginBottom: 16, fontSize: 13,
      }}>
        <span style={{ color: '#888' }}>분석 행정동: </span>
        <strong>대구광역시 {data.sigunguName} {data.dongName}</strong>
      </div>

      {/* 총 거주 인구 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f1f3',
      }}>
        <div>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px' }}>거주 인구(추정)</p>
          <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            {data.total.toLocaleString()}명
          </p>
          {data.maxAge && (
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
              {data.maxAge} 인구가 가장 많아요
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#4a7fc1', marginBottom: 4 }}>
            ■ 남 {data.totalM.toLocaleString()}명
          </div>
          <div style={{ fontSize: 12, color: '#e05c7a' }}>
            ■ 여 {data.totalF.toLocaleString()}명
          </div>
        </div>
      </div>

      {/* 연령대별 바 차트 */}
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px', color: '#1a2233' }}>
        연령대별 인구
      </p>
      <div>
        {data.ageGroups.map((group) => (
          <div key={group.age} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{group.age}</span>
              <span style={{ fontSize: 11, color: '#aaa' }}>
                {group.total.toLocaleString()}명
                {group.age === data.maxAge && (
                  <span style={{
                    marginLeft: 6, background: '#1a2233', color: '#fff',
                    fontSize: 10, padding: '1px 5px', borderRadius: 3,
                  }}>최고</span>
                )}
                {group.age === data.minAge && (
                  <span style={{
                    marginLeft: 6, background: '#aaa', color: '#fff',
                    fontSize: 10, padding: '1px 5px', borderRadius: 3,
                  }}>최저</span>
                )}
              </span>
            </div>
            <AgeBar value={group.M} max={maxGroupTotal} gender="M" />
            <AgeBar value={group.F} max={maxGroupTotal} gender="F" />
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#888' }}>
        <span><span style={{ color: '#4a7fc1' }}>■</span> 남자</span>
        <span><span style={{ color: '#e05c7a' }}>■</span> 여자</span>
      </div>
    </div>
  );
}