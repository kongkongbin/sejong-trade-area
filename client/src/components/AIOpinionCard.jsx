import React, { useState } from 'react';
import api from '../api/axios';
import AIOpinionEditor from './AIOpinionEditor';

const VERDICT_STYLE = {
  GO: { label: '✅ GO', bg: '#2ecc71', desc: '입점 추천' },
  CONDITIONAL_GO: { label: '⚠️ 조건부 GO', bg: '#f39c12', desc: '조건 확인 필요' },
  NO_GO: { label: '❌ NO-GO', bg: '#e74c3c', desc: '입점 비추천' },
};

export default function AIOpinionCard({
  center, address, radius,
  populationData, franchiseData, transitData, facilityData, scoreData,
}) {
  const [step, setStep] = useState('idle');
  const [locationId, setLocationId] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  async function handleGenerate() {
    if (!center) { alert('먼저 지도에서 위치를 선택해주세요.'); return; }

    setStep('saving');
    try {
      const saveRes = await api.post('/locations', {
        address: address || `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`,
        lat: center.lat,
        lng: center.lng,
        analysis_radius: radius,
      });
      const id = saveRes.data.id;
      setLocationId(id);

      setStep('generating');

      const lightFranchise = franchiseData ? {
        totalCount: franchiseData.totalCount,
        byCategory: franchiseData.byCategory?.map(({ code, name, count, competitionLevel }) => ({
          code, name, count, competitionLevel,
        })),
      } : null;

      const lightFacility = facilityData ? {
        hospital: { count: facilityData.hospital?.count || 0 },
        kindergarten: { count: facilityData.kindergarten?.count || 0 },
        elementary: { count: facilityData.elementary?.count || 0 },
        middle: { count: facilityData.middle?.count || 0 },
        high: { count: facilityData.high?.count || 0 },
      } : null;

      const aiRes = await api.post(`/locations/${id}/generate-ai`, {
        analysisData: {
          populationData, franchiseData: lightFranchise,
          transitData, facilityData: lightFacility,
          scoreData, radius,
        },
      });

      setAiData(aiRes.data);
      setStep('done');
    } catch (err) {
      console.error(err);
      setStep('error');
    }
  }

  const verdictInfo = VERDICT_STYLE[aiData?.verdict];

  return (
    <div style={{ marginBottom: 14 }}>
      {step === 'idle' && (
        <button onClick={handleGenerate} style={{
          width: '100%', height: 42,
          background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
          color: '#0d1b2e', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          cursor: 'pointer', boxShadow: '0 2px 6px rgba(201,168,76,0.3)',
        }}>
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

      {step === 'done' && aiData && (
        <div style={{ background: '#fff', border: '1px solid #e2e6ea', borderRadius: 10, overflow: 'hidden' }}>
          {/* 판정 헤더 */}
          <div style={{
            background: verdictInfo?.bg || '#888', padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{verdictInfo?.label}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowEditor(!showEditor)}
                style={{
                  fontSize: 11, padding: '3px 10px', border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: 6, background: 'rgba(255,255,255,0.15)',
                  color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {showEditor ? '미리보기' : '✏️ 편집'}
              </button>
              <button onClick={() => setStep('idle')} style={{
                fontSize: 11, padding: '3px 10px', border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 6, background: 'rgba(255,255,255,0.15)',
                color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              }}>🔄 재생성</button>
            </div>
          </div>

          {/* 편집 모드 */}
          {showEditor ? (
            <div style={{ padding: 16 }}>
              <AIOpinionEditor
                locationId={locationId}
                initialData={aiData}
                onSave={(updated) => setAiData({ ...aiData, ...updated })}
              />
            </div>
          ) : (
            /* 미리보기 모드 */
            <div style={{ padding: 16 }}>
              {/* 핵심 요약 */}
              {aiData.summary && (
                <div style={{ marginBottom: 14, fontSize: 13, lineHeight: 1.7, color: '#2d3748' }}>
                  {aiData.summary}
                </div>
              )}

              {/* 강점 */}
              {aiData.strengths?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2ecc71', marginBottom: 6 }}>✅ 강점</div>
                  {aiData.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#2d3748', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #2ecc71' }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* 리스크 */}
              {aiData.risks?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e74c3c', marginBottom: 6 }}>⚠️ 리스크</div>
                  {aiData.risks.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#2d3748', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e74c3c' }}>
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {/* 판정 이유 */}
              {aiData.verdictReason && (
                <div style={{ fontSize: 12, color: '#5a6a7e', fontStyle: 'italic', marginTop: 8 }}>
                  {aiData.verdictReason}
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <a href={`/location/${locationId}`} style={{
                  fontSize: 12, padding: '5px 12px', background: '#f0f2f5',
                  borderRadius: 6, textDecoration: 'none', color: '#0d1b2e',
                }}>
                  📋 입지 데이터 보기/수정
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}