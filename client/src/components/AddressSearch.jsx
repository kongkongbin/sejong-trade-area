import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AddressSearch({ onResult }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [error, setError] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const wrapperRef = useRef(null);

  // 디바운스된 쿼리로 자동완성 검색
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    async function fetchSuggestions() {
      setLoading(true);
      try {
        const res = await api.post('/analysis/geocode-suggest', { address: debouncedQuery });
        setSuggestions(res.data.results || []);
        setShowDrop(true);
        setError('');
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedQuery]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(item) {
    setQuery(item.roadAddress || item.jibunAddress);
    setShowDrop(false);
    setSuggestions([]);
    onResult(item);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/analysis/geocode', { address: query });
      setShowDrop(false);
      onResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || '검색 결과가 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={wrapperRef} style={{ marginBottom: 14, position: 'relative' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="주소 또는 장소 검색 (예: 대구 수성구 범어동)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(''); }}
          onFocus={() => suggestions.length > 0 && setShowDrop(true)}
          style={{
            flex: 1, height: 40, padding: '0 14px',
            border: '1.5px solid #e2e6ea', borderRadius: 8,
            fontSize: 13, fontFamily: 'inherit', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocusCapture={(e) => e.target.style.borderColor = '#c9a84c'}
          onBlurCapture={(e) => e.target.style.borderColor = '#e2e6ea'}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            height: 40, padding: '0 16px',
            background: loading ? '#8a9ab0' : 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : '🔍 검색'}
        </button>
      </form>

      {/* 자동완성 드롭다운 */}
      {showDrop && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 56,
          background: '#fff', border: '1.5px solid #e2e6ea',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(13,27,46,0.12)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {suggestions.map((item, i) => (
            <div
              key={i}
              onClick={() => handleSelect(item)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f0f2f5' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5ecd4'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2e' }}>
                {item.roadAddress || item.jibunAddress}
              </div>
              {item.roadAddress && item.jibunAddress && (
                <div style={{ fontSize: 11, color: '#9aa5b1', marginTop: 2 }}>
                  {item.jibunAddress}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#d23b3b', margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  );
}