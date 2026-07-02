import React, { useState } from 'react';
import api from '../api/axios';

const VERDICT_STYLE = {
  GO: { label: '✅ GO', bg: '#2ecc71', desc: '입점 추천' },
  CONDITIONAL_GO: { label: '⚠️ 조건부 GO', bg: '#f39c12', desc: '조건 확인 필요' },
  NO_GO: { label: '❌ NO-GO', bg: '#e74c3c', desc: '입점 비추천' },
};

export default function AIOpinionCard({
  center, address, radius,
  populationData, franchiseData, transitData, facilityData, scoreData,
}) {
  const [step, setStep] = useState('idle'); // idle | saving | generating | done | error
  const [locationId, setLocationId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [verdict, setVerdict] = useState(null);

  async function handleGenerate() {
    if (!center) { alert('먼저 지도에서 위치를 선택해주세요.'); return; }
    if (!address) { alert('주소를 먼저 검색해주세요.'); return; }

    setStep('saving');
    try {
      // 1. 위치 저장
      const saveRes = await api.post('/locations', {
        address,
        lat: center.lat,
        lng: center.lng,
        analysis_radius: radius,
      });
      const id = saveRes.data.id;
      setLocationId(id);

      // 2. AI 의견 생성
      setStep('generating');

      // 무거운 매장 리스트 제외하고 전송
      const lightFranchise = franchiseData ? {
        totalCount: franchiseData.totalCount,
        byCategory: franchiseData.byCategory?.map(({ code, name, count, competitionLevel }) => ({
          code, name, count, competitionLevel,
        })),
      } : null;

      const lightFacility = facilityData ? {
        hospital: { count: facilityData.hospital?.count || 0, items: facilityData.hospital?.items?.slice(0, 3) || [] },
        kindergarten: { count: facilityData.kindergarten?.count || 0 },
        elementary: { count: facilityData.elementary?.count || 0 },
        middle: { count: facilityData.middle?.count || 0 },
        high: { count: facilityData.high?.count || 0 },
      } : null;

      const aiRes = await api.post(`/locations/${id}/generate-ai`, {
        analysisData: {
          populationData,
          franchiseData: lightFranchise,
          transitData,
          facilityData: lightFacility,
          scoreData,
          radius,
        },
      });

      setOpinion(aiRes.data.opinion);
      setVerdict(aiRes.data.verdict);
      setStep('done');
    } catch (err) {
      console.error(err);
      setStep('error');
    }
  }

  const verdictInfo = VERDICT_STYLE[verdict];

  return (
    <div style={{ marginBottom: 14 }}>
      {step === 'idle' && (
        <button
          onClick={handleGenerate}
          style={{
            width: '100%', height: 42,
            background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
            color: '#0d1b2e', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(201,168,76,0.3)',
          }}
        >
          🤖 AI 종합 의견 생성
        </button>
      )}

      {step === 'saving' && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: '#5a6a7e' }}>
          📍 위치 저장 중...
        </div>
      )}

      {step === 'generating' && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: '#5a6a7e' }}>
          🤖 AI가 분석 중입니다... (10~20초 소요)
        </div>
      )}

      {step === 'error' && (
        <div>
          <div style={{ fontSize: 13, color: '#e74c3c', marginBottom: 8 }}>❌ AI 의견 생성 실패</div>
          <button onClick={() => setStep('idle')} style={{
            fontSize: 12, padding: '4px 12px', border: '1px solid #e0e2e6',
            borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>다시 시도</button>
        </div>
      )}

      {step === 'done' && verdict && (
        <div style={{ background: '#fff', border: '1px solid #e2e6ea', borderRadius: 10, overflow: 'hidden' }}>
          {/* 판정 헤더 */}
          <div style={{
            background: verdictInfo.bg, padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{verdictInfo.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{verdictInfo.desc}</div>
          </div>

          {/* AI 의견 본문 */}
          <div style={{
            padding: '14px 16px', fontSize: 12, lineHeight: 1.8,
            color: '#2d3748', whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto',
          }}>
            {opinion}
          </div>

          {/* 하단 버튼 */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e6ea', display: 'flex', gap: 8 }}>
            <a
              href={`/location/${locationId}`}
              style={{
                fontSize: 12, padding: '5px 12px', background: '#f0f2f5',
                border: 'none', borderRadius: 6, textDecoration: 'none', color: '#0d1b2e',
              }}
            >
              📋 입지 데이터 보기/수정
            </a>
            <button
              onClick={() => setStep('idle')}
              style={{
                fontSize: 12, padding: '5px 12px', background: '#fff',
                border: '1px solid #e0e2e6', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🔄 재생성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}