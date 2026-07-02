import React, { useState } from 'react';

function ScoreBar({ score, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: '#f0f2f5', borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${(score / max) * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 28, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  );
}

export default function ScoreCard({ scoreData, loading }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div style={{
        background: '#f0f2f5', borderRadius: 10, padding: '14px 16px',
        marginBottom: 14, fontSize: 13, color: '#9aa5b1',
      }}>
        종합 점수 계산 중...
      </div>
    );
  }

  if (!scoreData) return null;

  const { totalScore, grade, breakdown } = scoreData;

  return (
    <div style={{
      background: `linear-gradient(135deg, #0d1b2e 0%, #1e3a5f 100%)`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 14,
      color: '#fff',
    }}>
      {/* 상단: 점수 + 등급 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>종합 상권 점수</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-1px' }}>
            {totalScore}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>/100</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: grade.color, color: '#fff',
            fontSize: 20, fontWeight: 800, padding: '6px 18px',
            borderRadius: 8, letterSpacing: '-0.5px',
          }}>
            {grade.grade}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{grade.label}</div>
        </div>
      </div>

      {/* 항목별 바 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 8 }}>
        {[
          { label: '생활인구', score: breakdown.population.score, max: 30, color: '#c9a84c' },
          { label: '교통 접근성', score: breakdown.transit.score, max: 25, color: '#3498db' },
          { label: '상권 활성도', score: breakdown.franchise.score, max: 25, color: '#e74c3c' },
          { label: '생활 인프라', score: breakdown.facility.score, max: 20, color: '#2ecc71' },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>
              {item.label}
            </div>
            <ScoreBar score={item.score} max={item.max} color={item.color} />
          </div>
        ))}
      </div>

      {/* 상세 보기 토글 */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.8)',
          fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'inherit', width: '100%', marginTop: 4,
        }}
      >
        {expanded ? '▲ 접기' : '▼ 상세 분석 보기'}
      </button>

      {/* 상세 분석 */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {[
            { key: 'population', label: '👥 생활인구', data: breakdown.population },
            { key: 'transit', label: '🚇 교통 접근성', data: breakdown.transit },
            { key: 'franchise', label: '🏪 상권 활성도', data: breakdown.franchise },
            { key: 'facility', label: '🏥 생활 인프라', data: breakdown.facility },
          ].map((item) => (
            <div key={item.key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                {item.data.comment}
              </div>
              {item.key === 'population' && item.data.ageComment && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                  {item.data.ageComment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}