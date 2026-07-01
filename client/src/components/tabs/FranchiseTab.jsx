import React, { useState, useMemo } from 'react';

function CompetitionBar({ level }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: 2,
          background: i <= level ? '#1a2233' : '#e0e2e6',
        }} />
      ))}
    </div>
  );
}

function StoreList({ stores }) {
  if (!stores || stores.length === 0) return null;
  return (
    <div style={{ background: '#f8f9fb', borderRadius: 6, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
      {stores.map((store) => (
        <div key={store.id} style={{
          padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: 13,
        }}>
          <div style={{ fontWeight: 500 }}>
            {store.name}{store.branch ? ` ${store.branch}` : ''}
            {store.floor ? <span style={{ color: '#aaa', fontWeight: 400 }}> {store.floor}층</span> : ''}
          </div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            {store.category && <span style={{ marginRight: 8, color: '#5a7fa0' }}>{store.category}</span>}
            {store.address}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FranchiseTab({ data, loading }) {
  const [openCategory, setOpenCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !data?.allStores) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.allStores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.branch.toLowerCase().includes(q)
    );
  }, [searchQuery, data]);

  if (loading) {
    return <p style={{ color: '#888', padding: '16px 0', fontSize: 13 }}>분석 중...</p>;
  }

  if (!data && !loading) {
    return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>지도를 클릭해서 위치를 선택하세요.</p>;
  }

  if (!data || data.totalCount === 0) {
    return <p style={{ color: '#aaa', padding: '16px 0', fontSize: 13 }}>해당 위치 반경 내 상가업소 데이터가 없습니다.</p>;
  }

  return (
    <div>
      {/* 상단 요약 + 검색 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
          총 <strong>{data.totalCount.toLocaleString()}개</strong> 상가업소
        </p>
        <button
          onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
          style={{
            fontSize: 12, padding: '4px 10px', border: '1px solid #d8dbe0',
            borderRadius: 14, background: showSearch ? '#1a2233' : '#fff',
            color: showSearch ? '#fff' : '#444', cursor: 'pointer',
          }}
        >
          🔍 상호 검색
        </button>
      </div>

      {/* 검색창 */}
      {showSearch && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="상호명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13,
              border: '1px solid #d8dbe0', borderRadius: 6, boxSizing: 'border-box',
            }}
            autoFocus
          />
          {searchQuery && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
              {searchResults.length > 0
                ? `검색 결과 ${searchResults.length}개`
                : '검색 결과가 없습니다.'}
            </div>
          )}
          {searchQuery && searchResults.length > 0 && (
            <StoreList stores={searchResults} />
          )}
        </div>
      )}

      {/* 업종별 테이블 */}
      {!showSearch && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e2e6' }}>
              <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>업종</th>
              <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 400 }}>경쟁 강도</th>
              <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 400 }}>매장 수</th>
            </tr>
          </thead>
          <tbody>
            {data.byCategory.map((cat) => (
              <React.Fragment key={cat.code}>
                <tr
                  style={{ borderBottom: '1px solid #f0f1f3', cursor: 'pointer' }}
                  onClick={() => setOpenCategory(openCategory === cat.code ? null : cat.code)}
                >
                  <td style={{ padding: '10px 0', fontWeight: 500 }}>
                    <span style={{ marginRight: 6, fontSize: 11, color: '#aaa' }}>
                      {openCategory === cat.code ? '▲' : '▼'}
                    </span>
                    {cat.name}
                  </td>
                  <td style={{ padding: '10px 0' }}>
                    <CompetitionBar level={cat.competitionLevel} />
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#1a2233', fontWeight: 600 }}>
                    {cat.count.toLocaleString()}
                  </td>
                </tr>
                {openCategory === cat.code && (
                  <tr>
                    <td colSpan={3} style={{ paddingBottom: 10 }}>
                      <StoreList stores={cat.stores} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}