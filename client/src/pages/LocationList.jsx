import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const VERDICT_STYLE = {
  GO: { label: 'GO', bg: '#2ecc71', color: '#fff' },
  CONDITIONAL_GO: { label: '조건부 GO', bg: '#f39c12', color: '#fff' },
  NO_GO: { label: 'NO-GO', bg: '#e74c3c', color: '#fff' },
};

export default function LocationList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/locations').then(res => {
      setList(res.data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id) {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/locations/${id}`);
    setList(list.filter(l => l.id !== id));
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>입지 데이터 목록</h2>
        <button
          onClick={() => navigate('/location/new')}
          style={{
            height: 38, padding: '0 16px',
            background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
            color: '#0d1b2e', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          + 새 입지 추가
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>불러오는 중...</p>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14 }}>저장된 입지 데이터가 없습니다.</div>
          <button
            onClick={() => navigate('/location/new')}
            style={{
              marginTop: 16, padding: '8px 20px',
              background: '#0d1b2e', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            첫 번째 입지 추가하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(item => {
            const verdict = VERDICT_STYLE[item.ai_verdict];
            return (
              <div key={item.id} style={{
                background: '#fff', borderRadius: 10,
                padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
                    {item.address}
                  </div>
                  <div style={{ fontSize: 12, color: '#9aa5b1' }}>
                    {item.target_business || '업종 미입력'} ·
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                {verdict && (
                  <span style={{
                    padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700,
                    background: verdict.bg, color: verdict.color,
                  }}>
                    {verdict.label}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigate(`/location/${item.id}`)}
                    style={{
                      padding: '6px 14px', background: '#f0f2f5',
                      border: 'none', borderRadius: 6, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >수정</button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '6px 14px', background: '#fff0f0', color: '#e74c3c',
                      border: 'none', borderRadius: 6, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}