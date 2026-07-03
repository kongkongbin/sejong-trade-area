import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const VERDICT_STYLE = {
  GO: { label: 'GO', bg: '#2ecc71', color: '#fff' },
  CONDITIONAL_GO: { label: '조건부 GO', bg: '#f39c12', color: '#fff' },
  NO_GO: { label: 'NO-GO', bg: '#e74c3c', color: '#fff' },
};

const DAEGU_GU = ['전체', '중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'];

export default function LocationList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGu, setFilterGu] = useState('전체');
  const [filterVerdict, setFilterVerdict] = useState('전체');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    api.get('/locations').then(res => {
      setList(res.data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/locations/${id}`);
    setList(list.filter(l => l.id !== id));
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    return list
      .filter(item => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
          item.address?.toLowerCase().includes(q) ||
          item.target_business?.toLowerCase().includes(q);
        const matchGu = filterGu === '전체' || item.address?.includes(filterGu);
        const matchVerdict = filterVerdict === '전체' || item.ai_verdict === filterVerdict;
        return matchSearch && matchGu && matchVerdict;
      })
      .sort((a, b) => {
        let va = a[sortKey] || '';
        let vb = b[sortKey] || '';
        if (sortDir === 'asc') return va > vb ? 1 : -1;
        return va < vb ? 1 : -1;
      });
  }, [list, search, filterGu, filterVerdict, sortKey, sortDir]);

  const SortIcon = ({ key }) => (
    <span style={{ fontSize: 10, marginLeft: 3, color: sortKey === key ? '#c9a84c' : '#aaa' }}>
      {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  );

  return (
    <div className="location-list-page" style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>입지 데이터 목록</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9aa5b1' }}>
            총 {list.length}개 · 필터 결과 {filtered.length}개
          </p>
        </div>
        <button onClick={() => navigate('/location/new')} style={{
          height: 38, padding: '0 16px',
          background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
          color: '#0d1b2e', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          + 새 입지 추가
        </button>
      </div>

      {/* 필터 바 */}
      <div className="location-filter-bar" style={{
        background: '#fff', borderRadius: 10, padding: '14px 18px',
        marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* 검색 */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 주소 또는 업종 검색"
          className="location-search-input"
          style={{
            height: 36, padding: '0 12px', border: '1.5px solid #e2e6ea',
            borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
            outline: 'none', width: 220,
          }}
        />

        {/* 구 필터 */}
        <select
          value={filterGu}
          onChange={e => setFilterGu(e.target.value)}
          style={{
            height: 36, padding: '0 10px', border: '1.5px solid #e2e6ea',
            borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        >
          {DAEGU_GU.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* 판정 필터 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['전체', 'GO', 'CONDITIONAL_GO', 'NO_GO'].map(v => {
            const style = VERDICT_STYLE[v];
            const isActive = filterVerdict === v;
            return (
              <button key={v} onClick={() => setFilterVerdict(v)} style={{
                height: 32, padding: '0 12px', borderRadius: 16,
                border: '1.5px solid',
                borderColor: isActive ? (style?.bg || '#0d1b2e') : '#e2e6ea',
                background: isActive ? (style?.bg || '#0d1b2e') : '#fff',
                color: isActive ? (style?.color || '#fff') : '#5a6a7e',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {v === '전체' ? '전체' : v === 'GO' ? 'GO' : v === 'CONDITIONAL_GO' ? '조건부 GO' : 'NO-GO'}
              </button>
            );
          })}
        </div>

        {(search || filterGu !== '전체' || filterVerdict !== '전체') && (
          <button onClick={() => { setSearch(''); setFilterGu('전체'); setFilterVerdict('전체'); }}
            style={{ fontSize: 12, color: '#9aa5b1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            필터 초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      {loading ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14 }}>
            {list.length === 0 ? '저장된 입지 데이터가 없습니다.' : '검색 결과가 없습니다.'}
          </div>
          {list.length === 0 && (
            <button onClick={() => navigate('/location/new')} style={{
              marginTop: 16, padding: '8px 20px', background: '#0d1b2e', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>첫 번째 입지 추가하기</button>
          )}
        </div>
      ) : (
        <>
        {/* 데스크톱: 테이블 */}
        <div className="desktop-table-wrap" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e2e6ea' }}>
                {[
                  { key: 'address', label: '주소' },
                  { key: 'target_business', label: '업종' },
                  { key: 'monthly_rent', label: '월세' },
                  { key: 'ai_verdict', label: 'AI 판정' },
                  { key: 'created_at', label: '등록일' },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '12px 16px', textAlign: 'left', fontWeight: 600,
                      color: '#5a6a7e', cursor: 'pointer', whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {col.label}<SortIcon key={col.key} />
                  </th>
                ))}
                <th style={{ padding: '12px 16px', color: '#5a6a7e', fontWeight: 600 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const verdict = VERDICT_STYLE[item.ai_verdict];
                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/location/${item.id}`)}
                    style={{
                      borderBottom: '1px solid #f0f2f5', cursor: 'pointer',
                      background: i % 2 === 0 ? '#fff' : '#fafbfc',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5ecd4'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.address || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5a6a7e' }}>
                      {item.target_business || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5a6a7e', whiteSpace: 'nowrap' }}>
                      {item.monthly_rent ? `${Number(item.monthly_rent).toLocaleString()}만원` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {verdict ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: verdict.bg, color: verdict.color,
                        }}>{verdict.label}</span>
                      ) : <span style={{ color: '#ccc', fontSize: 12 }}>미분석</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9aa5b1', whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={e => handleDelete(item.id, e)}
                        style={{
                          padding: '4px 10px', background: '#fff0f0', color: '#e74c3c',
                          border: 'none', borderRadius: 6, fontSize: 11,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >삭제</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 리스트 (스크롤 없이 세로로 쌓임) */}
        <div className="mobile-card-list">
          {filtered.map(item => {
            const verdict = VERDICT_STYLE[item.ai_verdict];
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/location/${item.id}`)}
                style={{
                  background: '#fff', borderRadius: 10, padding: 14, marginBottom: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, flex: 1, marginRight: 8 }}>
                    {item.address || '-'}
                  </div>
                  {verdict ? (
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: verdict.bg, color: verdict.color, whiteSpace: 'nowrap',
                    }}>{verdict.label}</span>
                  ) : <span style={{ color: '#ccc', fontSize: 11, whiteSpace: 'nowrap' }}>미분석</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#5a6a7e' }}>
                  <span>
                    {item.target_business || '업종 미입력'}
                    {item.monthly_rent ? ` · 월세 ${Number(item.monthly_rent).toLocaleString()}만원` : ''}
                  </span>
                  <span style={{ color: '#bbb' }}>
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <button
                    onClick={e => handleDelete(item.id, e)}
                    style={{
                      padding: '5px 12px', background: '#fff0f0', color: '#e74c3c',
                      border: 'none', borderRadius: 6, fontSize: 11.5,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >삭제</button>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}