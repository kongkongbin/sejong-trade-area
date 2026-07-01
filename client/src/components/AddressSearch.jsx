import React, { useState } from 'react';
import api from '../api/axios';

export default function AddressSearch({ onResult }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/analysis/geocode', { address: query });
      onResult(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || '검색 결과가 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="주소 또는 장소 검색 (예: 대구 수성구 범어동)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            height: 40,
            padding: '0 14px',
            border: '1.5px solid #e2e6ea',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#c9a84c'}
          onBlur={(e) => e.target.style.borderColor = '#e2e6ea'}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            height: 40,
            padding: '0 16px',
            background: loading ? '#8a9ab0' : 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '검색 중...' : '🔍 검색'}
        </button>
      </form>
      {error && (
        <p style={{ fontSize: 12, color: '#d23b3b', margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  );
}