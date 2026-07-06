import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import AIOpinionEditor from '../components/AIOpinionEditor';
import { printLocationReport } from '../components/LocationPrintReport';

const TABS = ['재무정보', '업종정보', '현장체크', '계약정보', '메모'];

const inputStyle = {
  width: '100%', height: 38, padding: '0 12px',
  border: '1.5px solid #e2e6ea', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 12, fontWeight: 500, color: '#5a6a7e', marginBottom: 4, display: 'block',
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ScoreInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)} style={{
          width: 36, height: 36, borderRadius: 6,
          border: '1.5px solid #e2e6ea',
          background: value >= v ? '#0d1b2e' : '#fff',
          color: value >= v ? '#fff' : '#aaa',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>{v}</button>
      ))}
    </div>
  );
}

const defaultForm = {
  address: '', lat: null, lng: null, analysis_radius: 500,
  premium: '', deposit: '', monthly_rent: '', interior_budget: '', other_initial_cost: '',
  target_business: '', avg_price_per_customer: '', expected_daily_sales: '', business_hours: '',
  visibility_score: 3, accessibility_score: 3, parking_available: false,
  building_age: '', has_elevator: false, is_corner: false, floor_info: '', area_pyeong: '',
  nearby_vacancy_rate: 0, redevelopment_plan: false, redevelopment_note: '', landlord_note: '',
  field_memo: '', contract_period: '', landlord_asking_rent: '', desired_rent: '',
};

const VERDICT_OPTIONS = [
  { value: 'GO', label: '✅ GO', color: '#2ecc71' },
  { value: 'CONDITIONAL_GO', label: '⚠️ 조건부 GO', color: '#f39c12' },
  { value: 'NO_GO', label: '❌ NO-GO', color: '#e74c3c' },
];

export default function LocationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [addressInput, setAddressInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [msg, setMsg] = useState('');
  const [aiData, setAiData] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiEditor, setShowAiEditor] = useState(false);
  const [nearbyStats, setNearbyStats] = useState(null);

  useEffect(() => {
    if (id) {
      // 수정 모드 — 기존 데이터 불러오기
      api.get(`/locations/${id}`).then(res => {
        const data = res.data;
        setForm(data);
        setAddressInput(data.address);
        setSavedId(Number(id));
        if (data.lat && data.lng) fetchNearbyStats(data.lat, data.lng);

        // 저장된 AI 데이터 있으면 불러오기
        if (data.ai_verdict) {
          const parseJson = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            try { return JSON.parse(val); } catch { return []; }
          };
          setAiData({
            verdict: data.ai_verdict,
            summary: data.ai_summary || '',
            strengths: parseJson(data.ai_strengths),
            risks: parseJson(data.ai_risks),
            financial: data.ai_financial || '',
            checklist: parseJson(data.ai_checklist),
            verdictReason: data.ai_verdict_reason || '',
          });
        }
      });
    } else {
      // 신규 — URL 파라미터에서 주소/좌표 가져오기
      const address = searchParams.get('address');
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      const radius = searchParams.get('radius');

      if (address || lat) {
        setForm(f => ({
          ...f,
          address: address || '',
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null,
          analysis_radius: radius ? Number(radius) : 500,
        }));
        setAddressInput(address || '');
      }
    }
  }, [id]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  async function fetchNearbyStats(lat, lng) {
    if (!lat || !lng) return;
    try {
      const res = await api.get('/locations/nearby-average', {
        params: { lat, lng, radius: 500, excludeId: id || undefined },
      });
      setNearbyStats(res.data.count > 0 ? res.data : null);
    } catch {
      setNearbyStats(null);
    }
  }

  function applyNearbyStats() {
    if (!nearbyStats) return;
    setForm(f => ({
      ...f,
      visibility_score: Math.round(nearbyStats.avgVisibility),
      accessibility_score: Math.round(nearbyStats.avgAccessibility),
      nearby_vacancy_rate: nearbyStats.avgVacancyRate,
    }));
  }

  async function handleAddressSearch(e) {
    e.preventDefault();
    if (!addressInput.trim()) return;
    try {
      const res = await api.post('/analysis/geocode', { address: addressInput });
      set('address', res.data.roadAddress || addressInput);
      set('lat', res.data.lat);
      set('lng', res.data.lng);
      setMsg('✅ 주소 확인됨');
      fetchNearbyStats(res.data.lat, res.data.lng);
    } catch {
      setMsg('❌ 주소를 찾을 수 없습니다.');
    }
  }

  async function handleSave() {
    if (!form.address) { setMsg('주소를 먼저 입력해주세요.'); return; }
    setSaving(true);
    try {
      if (id || savedId) {
        await api.put(`/locations/${id || savedId}`, form);
        setSavedId(id || savedId);
        setMsg('✅ 저장되었습니다.');
      } else {
        const res = await api.post('/locations', form);
        setSavedId(res.data.id);
        setMsg('✅ 저장되었습니다. 이제 AI 분석을 생성할 수 있습니다.');
      }
    } catch {
      setMsg('❌ 저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateAI() {
    if (!savedId) { setMsg('먼저 저장해주세요.'); return; }
    setAiGenerating(true);
    try {
      const res = await api.post(`/locations/${savedId}/generate-ai`, {
        analysisData: { radius: form.analysis_radius },
      });
      setAiData(res.data);
      setShowAiEditor(true);
      setMsg('✅ AI 분석이 생성되었습니다.');
    } catch {
      setMsg('❌ AI 분석 생성 실패');
    } finally {
      setAiGenerating(false);
    }
  }

  const totalInitial = (Number(form.premium)||0) + (Number(form.deposit)||0) +
    (Number(form.interior_budget)||0) + (Number(form.other_initial_cost)||0);

  return (
    <div className="location-form-page" style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/locations')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#5a6a7e', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>← 목록</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {id ? '입지 데이터 수정' : '새 입지 추가'}
        </h2>
        {savedId && (
          <span style={{ fontSize: 12, color: '#2ecc71', marginLeft: 4, whiteSpace: 'nowrap' }}>✅ 저장됨</span>
        )}
        {savedId && (
          <button
            onClick={() => printLocationReport(form, aiData)}
            style={{
              marginLeft: 'auto', height: 34, padding: '0 14px',
              background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
              color: '#0d1b2e', border: 'none', borderRadius: 6,
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🖨️ 리포트 출력
          </button>
        )}
      </div>

      {/* 주소 */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label style={labelStyle}>📍 분석 위치</label>
        <form onSubmit={handleAddressSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            placeholder="주소 입력 후 검색"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" style={{
            padding: '0 16px', background: '#0d1b2e', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>검색</button>
        </form>
        {form.lat && !isNaN(Number(form.lat)) && (
          <div style={{ fontSize: 12, color: '#2ecc71', marginTop: 6 }}>
            📍 {form.address} ({Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)})
          </div>
        )}
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ ...labelStyle, margin: 0 }}>분석 반경</label>
          <select
            value={form.analysis_radius}
            onChange={e => set('analysis_radius', Number(e.target.value))}
            style={{ height: 32, padding: '0 8px', border: '1px solid #e2e6ea', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}
          >
            {[100, 300, 500, 1000, 1500, 2000, 3000].map(r => (
              <option key={r} value={r}>{r >= 1000 ? `${r/1000}km` : `${r}m`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 입력 탭 */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e6ea' }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
              background: activeTab === i ? '#0d1b2e' : '#fff',
              color: activeTab === i ? '#fff' : '#5a6a7e',
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {/* 재무정보 */}
          {activeTab === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="권리금 (만원)">
                <input type="number" value={form.premium} onChange={e => set('premium', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="보증금 (만원)">
                <input type="number" value={form.deposit} onChange={e => set('deposit', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="월세 (만원)">
                <input type="number" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="인테리어 예산 (만원)">
                <input type="number" value={form.interior_budget} onChange={e => set('interior_budget', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="기타 초기비용 (만원)">
                <input type="number" value={form.other_initial_cost} onChange={e => set('other_initial_cost', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="총 초기투자금">
                <div style={{ height: 38, padding: '0 12px', lineHeight: '38px', background: '#f5ecd4', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#0d1b2e' }}>
                  {totalInitial.toLocaleString()}만원
                </div>
              </Field>
            </div>
          )}

          {/* 업종정보 */}
          {activeTab === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="입점 예정 업종">
                <input value={form.target_business} onChange={e => set('target_business', e.target.value)} style={inputStyle} placeholder="예: 카페, 편의점" />
              </Field>
              <Field label="영업시간">
                <input value={form.business_hours} onChange={e => set('business_hours', e.target.value)} style={inputStyle} placeholder="예: 09:00~22:00" />
              </Field>
              <Field label="예상 객단가 (원)">
                <input type="number" value={form.avg_price_per_customer} onChange={e => set('avg_price_per_customer', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="예상 일매출 (만원)">
                <input type="number" value={form.expected_daily_sales} onChange={e => set('expected_daily_sales', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
            </div>
          )}

          {/* 현장체크 */}
          {activeTab === 2 && (
            <div>
              {nearbyStats && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  background: '#f5ecd4', border: '1px solid #e8c96a', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#5a4a1a',
                }}>
                  <span>
                    📍 반경 500m 내 매물 {nearbyStats.count}곳 평균 —
                    가시성 {nearbyStats.avgVisibility} · 접근성 {nearbyStats.avgAccessibility} · 공실률 체감 {nearbyStats.avgVacancyRate}%
                  </span>
                  <button
                    type="button"
                    onClick={applyNearbyStats}
                    style={{
                      marginLeft: 'auto', padding: '4px 12px', background: '#0d1b2e',
                      color: '#fff', border: 'none', borderRadius: 6, fontSize: 11.5,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >
                    이 값으로 적용
                  </button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Field label="가시성 (1~5점)">
                  <ScoreInput value={form.visibility_score} onChange={v => set('visibility_score', v)} />
                </Field>
                <Field label="접근성 (1~5점)">
                  <ScoreInput value={form.accessibility_score} onChange={v => set('accessibility_score', v)} />
                </Field>
                <Field label="층수 정보">
                  <input value={form.floor_info} onChange={e => set('floor_info', e.target.value)} style={inputStyle} placeholder="예: 지상 1층" />
                </Field>
                <Field label="전용면적 (평)">
                  <input type="number" step="0.1" value={form.area_pyeong} onChange={e => set('area_pyeong', e.target.value)} style={inputStyle} placeholder="예: 15.5" />
                </Field>
                <Field label="건물 연식 (년)">
                  <input type="number" value={form.building_age} onChange={e => set('building_age', e.target.value)} style={inputStyle} placeholder="예: 15" />
                </Field>
                <Field label="주변 공실/폐업 비율 체감 (%)">
                  <input type="number" min="0" max="100" value={form.nearby_vacancy_rate} onChange={e => set('nearby_vacancy_rate', e.target.value)} style={inputStyle} placeholder="0~100" />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  ['parking_available', '주차 가능'],
                  ['has_elevator', '엘리베이터 있음'],
                  ['is_corner', '코너 위치'],
                  ['redevelopment_plan', '재개발/개발 계획 있음'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              {form.redevelopment_plan && (
                <Field label="재개발 관련 메모">
                  <input value={form.redevelopment_note} onChange={e => set('redevelopment_note', e.target.value)} style={inputStyle} placeholder="재개발 계획 상세" />
                </Field>
              )}
              <Field label="임대인 특이사항">
                <input value={form.landlord_note} onChange={e => set('landlord_note', e.target.value)} style={inputStyle} placeholder="임대인 관련 특이사항" />
              </Field>
            </div>
          )}

          {/* 계약정보 */}
          {activeTab === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="계약 기간">
                <input value={form.contract_period} onChange={e => set('contract_period', e.target.value)} style={inputStyle} placeholder="예: 2년" />
              </Field>
              <Field label="임대인 제시 임대료 (만원)">
                <input type="number" value={form.landlord_asking_rent} onChange={e => set('landlord_asking_rent', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
              <Field label="희망 임대료 (만원)">
                <input type="number" value={form.desired_rent} onChange={e => set('desired_rent', e.target.value)} style={inputStyle} placeholder="0" />
              </Field>
            </div>
          )}

          {/* 메모 */}
          {activeTab === 4 && (
            <Field label="현장 메모">
              <textarea
                value={form.field_memo}
                onChange={e => set('field_memo', e.target.value)}
                placeholder="현장에서 느낀 점, 특이사항 등 자유롭게 작성"
                style={{ ...inputStyle, height: 200, padding: 12, resize: 'vertical', lineHeight: 1.6 }}
              />
            </Field>
          )}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {msg && <span style={{ fontSize: 13, color: msg.includes('✅') ? '#2ecc71' : '#e74c3c' }}>{msg}</span>}
        <button onClick={handleSave} disabled={saving} style={{
          marginLeft: 'auto', height: 42, padding: '0 24px',
          background: 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? '저장 중...' : '💾 저장'}
        </button>
      </div>

      {/* AI 분석 섹션 — 저장 후에만 표시 */}
      {savedId && (
        <div style={{
          background: '#fff', borderRadius: 10, padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          width: '100%', maxWidth: '100%', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🤖 AI 종합 분석</h3>
            <button
              onClick={handleGenerateAI}
              disabled={aiGenerating}
              style={{
                height: 36, padding: '0 16px',
                background: aiGenerating ? '#aaa' : 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                color: '#0d1b2e', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                cursor: aiGenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {aiGenerating ? '분석 중... (10~20초)' : aiData ? '🔄 재분석' : '✨ AI 분석 생성'}
            </button>
          </div>

          {!aiData && !aiGenerating && (
            <p style={{ fontSize: 13, color: '#9aa5b1', margin: 0 }}>
              데이터를 저장한 후 AI 분석을 생성하세요. 입력한 재무/현장 데이터를 바탕으로 종합 의견을 작성해드립니다.
            </p>
          )}

          {aiGenerating && (
            <p style={{ fontSize: 13, color: '#5a6a7e', margin: 0 }}>AI가 분석 중입니다...</p>
          )}

          {aiData && (
            <div>
              {/* 판정 뱃지 */}
              {aiData.verdict && (
                <div style={{
                  display: 'inline-block', padding: '6px 16px', borderRadius: 8,
                  background: aiData.verdict === 'GO' ? '#2ecc71' : aiData.verdict === 'NO_GO' ? '#e74c3c' : '#f39c12',
                  color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 14,
                }}>
                  {aiData.verdict === 'GO' ? '✅ GO' : aiData.verdict === 'NO_GO' ? '❌ NO-GO' : '⚠️ 조건부 GO'}
                </div>
              )}

              <button
                onClick={() => setShowAiEditor(!showAiEditor)}
                style={{
                  marginLeft: 10, fontSize: 12, padding: '5px 12px',
                  border: '1px solid #e0e2e6', borderRadius: 6,
                  background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {showAiEditor ? '미리보기' : '✏️ 편집'}
              </button>

              {showAiEditor ? (
                <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <AIOpinionEditor
                    locationId={savedId}
                    initialData={aiData}
                    onSave={updated => setAiData({ ...aiData, ...updated })}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#2d3748', whiteSpace: 'pre-wrap', marginTop: 10 }}>
                  {aiData.summary && <p style={{ marginBottom: 10 }}>{aiData.summary}</p>}
                  {aiData.strengths?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <strong style={{ color: '#2ecc71' }}>✅ 강점</strong>
                      {aiData.strengths.map((s, i) => <div key={i} style={{ paddingLeft: 12, marginTop: 4 }}>· {s}</div>)}
                    </div>
                  )}
                  {aiData.risks?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <strong style={{ color: '#e74c3c' }}>⚠️ 리스크</strong>
                      {aiData.risks.map((r, i) => <div key={i} style={{ paddingLeft: 12, marginTop: 4 }}>· {r}</div>)}
                    </div>
                  )}
                  {aiData.verdictReason && (
                    <div style={{ fontSize: 12, color: '#5a6a7e', fontStyle: 'italic', marginTop: 8 }}>
                      {aiData.verdictReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}