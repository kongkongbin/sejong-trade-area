import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const VERDICT_STYLE = {
  GO: { label: 'GO', bg: '#2ecc71', color: '#fff' },
  CONDITIONAL_GO: { label: '조건부 GO', bg: '#f39c12', color: '#fff' },
  NO_GO: { label: 'NO-GO', bg: '#e74c3c', color: '#fff' },
};

const EXAMPLES = [
  '구암동에 보증금 1000에 월세 10 매물 보여줘',
  '월세 50 이하 카페 자리 있어?',
  '수성구에 GO 판정 받은 곳',
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // { query, results, count } 배열
  const inputRef = useRef(null);

  async function handleSearch(query) {
    const q = (query ?? input).trim();
    if (!q || loading) return;

    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/search', { message: q });
      setHistory(prev => [...prev, { query: q, ...res.data }]);
    } catch {
      setHistory(prev => [...prev, { query: q, error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>🔍 매물 검색</h2>
      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#9aa5b1' }}>
        저장된 입지 데이터 중에서 조건에 맞는 매물을 대화로 찾아보세요.
      </p>

      {/* 검색창 */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 14,
        background: '#fff', padding: 10, borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 구암동에 보증금 1000에 월세 10 매물 보여줘"
          disabled={loading}
          style={{
            flex: 1, height: 40, padding: '0 14px',
            border: '1.5px solid #e2e6ea', borderRadius: 8,
            fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !input.trim()}
          style={{
            height: 40, padding: '0 18px',
            background: loading || !input.trim() ? '#e0e2e6' : '#0d1b2e',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 예시 (아직 검색 안 했을 때만) */}
      {history.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleSearch(ex)}
              style={{
                padding: '6px 12px', background: '#fff', border: '1px solid #e2e6ea',
                borderRadius: 16, fontSize: 12, color: '#5a6a7e', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 히스토리 (최신이 아래) */}
      {history.map((h, hi) => (
        <div key={hi} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'inline-block', padding: '6px 14px', background: '#f0f2f5',
            borderRadius: 14, fontSize: 12.5, color: '#5a6a7e', marginBottom: 10,
          }}>
            "{h.query}"
          </div>

          {h.error ? (
            <p style={{ fontSize: 13, color: '#e74c3c' }}>검색 중 오류가 발생했습니다.</p>
          ) : h.count === 0 ? (
            <p style={{ fontSize: 13, color: '#9aa5b1' }}>조건에 맞는 매물이 없습니다.</p>
          ) : (
            <>
              <p style={{ fontSize: 12.5, color: '#9aa5b1', margin: '0 0 8px' }}>
                {h.count}건 찾았어요
              </p>
              {h.results.map(item => {
                const verdict = VERDICT_STYLE[item.ai_verdict];
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/location/${item.id}`)}
                    style={{
                      background: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
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
                    <div style={{ fontSize: 12.5, color: '#5a6a7e' }}>
                      {item.target_business || '업종 미입력'}
                      {' · 보증금 '}{item.deposit ? Number(item.deposit).toLocaleString() : 0}만원
                      {' · 월세 '}{item.monthly_rent ? Number(item.monthly_rent).toLocaleString() : 0}만원
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ))}
    </div>
  );
}