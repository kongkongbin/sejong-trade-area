import React, { useState, useMemo } from 'react';

function CompetitionBar({ level }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: 2,
          background: i <= level ? '#0d1b2e' : '#e0e2e6',
        }} />
      ))}
    </div>
  );
}

function StoreList({ stores, categoryCode, onStoreClick, activeStoreId }) {
  if (!stores || stores.length === 0) return null;
  return (
    <div style={{ background: '#f8f9fb', borderRadius: 6, marginTop: 6, maxHeight: 260, overflowY: 'auto' }}>
      {stores.map((store) => (
        <div
          key={store.id}
          onClick={() => onStoreClick({ ...store, categoryCode })}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #eee',
            fontSize: 13,
            cursor: 'pointer',
            background: activeStoreId === store.id ? '#f5ecd4' : 'transparent',
            borderLeft: activeStoreId === store.id ? '3px solid #c9a84c' : '3px solid transparent',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (activeStoreId !== store.id) e.currentTarget.style.background = '#f0f2f5'; }}
          onMouseLeave={(e) => { if (activeStoreId !== store.id) e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ fontWeight: 500 }}>
            {store.name}{store.branch ? ` ${store.branch}` : ''}
            {store.floor ? <span style={{ color: '#aaa', fontWeight: 400 }}> {store.floor}층</span> : ''}
            <span style={{ fontSize: 11, color: '#c9a84c', marginLeft: 6 }}>📍</span>
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

export default function FranchiseTab({ data, loading, onStoreClick, activeStoreId }) {
  const [openCategory, setOpenCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
          총 <strong>{data.totalCount.toLocaleString()}개</strong> 상가업소
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowMissing(!showMissing)}
            style={{
              fontSize: 12, padding: '4px 10px', border: '1px solid #d8dbe0',
              borderRadius: 14, background: showMissing ? '#c9a84c' : '#fff',
              color: showMissing ? '#fff' : '#444', cursor: 'pointer',
            }}
          >
            🕳️ 빈틈 업종
          </button>
          <button
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
            style={{
              fontSize: 12, padding: '4px 10px', border: '1px solid #d8dbe0',
              borderRadius: 14, background: showSearch ? '#0d1b2e' : '#fff',
              color: showSearch ? '#fff' : '#444', cursor: 'pointer',
            }}
          >
            🔍 상호 검색
          </button>
        </div>
      </div>

      {showMissing && (
        <div style={{ marginBottom: 14, background: '#fdf9ef', border: '1px solid #e8c96a', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#5a4a1a', margin: '0 0 8px' }}>
            🕳️ 반경 내에 없는 업종 (창업 빈틈)
          </p>
          {(!data.missingCategories || data.missingCategories.length === 0) ? (
            <p style={{ fontSize: 12, color: '#9a8a5a', margin: 0 }}>
              주요 업종이 대부분 이미 입점해있어 뚜렷한 빈틈이 안 보여요.
            </p>
          ) : (
            data.missingCategories.map((group) => (
              <div key={group.largeCategoryCode} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#5a4a1a' }}>
                  {group.largeCategoryName}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {group.missing.map((m) => (
                    <span key={m.code} style={{
                      fontSize: 11, padding: '3px 9px', background: '#fff',
                      border: '1px solid #e8c96a', borderRadius: 12, color: '#5a4a1a',
                    }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

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
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          {searchQuery && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
              {searchResults.length > 0 ? `검색 결과 ${searchResults.length}개` : '검색 결과가 없습니다.'}
            </div>
          )}
          {searchQuery && searchResults.length > 0 && (
            <StoreList
              stores={searchResults}
              onStoreClick={onStoreClick}
              activeStoreId={activeStoreId}
            />
          )}
        </div>
      )}

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
                  onClick={() => {
                    const isOpening = openCategory !== cat.code;
                    setOpenCategory(isOpening ? cat.code : null);
                    // 업종 닫으면 마커 초기화
                    if (!isOpening) onStoreClick(null);
                    // 업종 열면 해당 업종 전체 마커 표시
                    else if (cat.stores) {
                      onStoreClick({ bulk: true, stores: cat.stores, categoryCode: cat.code });
                    }
                  }}
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
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#0d1b2e', fontWeight: 600 }}>
                    {cat.count.toLocaleString()}
                  </td>
                </tr>
                {openCategory === cat.code && (
                  <tr>
                    <td colSpan={3} style={{ paddingBottom: 10 }}>
                      <StoreList
                        stores={cat.stores}
                        categoryCode={cat.code}
                        onStoreClick={onStoreClick}
                        activeStoreId={activeStoreId}
                      />
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