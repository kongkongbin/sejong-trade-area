import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

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
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          style={{
            width: 36, height: 36, borderRadius: 6,
            border: '1.5px solid #e2e6ea',
            background: value >= v ? '#0d1b2e' : '#fff',
            color: value >= v ? '#fff' : '#aaa',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

const defaultForm = {
  address: '', lat: null, lng: null, analysis_radius: 500,
  premium: '', deposit: '', monthly_rent: '', interior_budget: '', other_initial_cost: '',
  target_business: '', avg_price_per_customer: '', expected_daily_sales: '', business_hours: '',
  visibility_score: 3, accessibility_score: 3, parking_available: false,
  building_age: '', has_elevator: false, is_corner: false, floor_info: '',
  nearby_vacancy_rate: 0, redevelopment_plan: false, redevelopment_note: '', landlord_note: '',
  field_memo: '', contract_period: '', landlord_asking_rent: '', desired_rent: '',
};

export default function LocationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [addressInput, setAddressInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/locations/${id}`).then(res => {
        setForm(res.data);
        setAddressInput(res.data.address);
      });
    }
  }, [id]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  async function handleAddressSearch(e) {
    e.preventDefault();
    if (!addressInput.trim()) return;
    try {
      const res = await api.post('/analysis/geocode', { address: addressInput });
      set('address', res.data.roadAddress || addressInput);
      set('lat', res.data.lat);
      set('lng', res.data.lng);
      setMsg('✅ 주소 확인됨');
    } catch {
      setMsg('❌ 주소를 찾을 수 없습니다.');
    }
  }

  async function handleSave() {
    if (!form.address) { setMsg('주소를 먼저 검색해주세요.'); return; }
    setSaving(true);
    try {
      if (id) {
        await api.put(`/locations/${id}`, form);
      } else {
        const res = await api.post('/locations', form);
        navigate(`/location/${res.data.id}`);
      }
      setMsg('✅ 저장되었습니다.');
    } catch {
      setMsg('❌ 저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/locations')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#5a6a7e', fontFamily: 'inherit',
        }}>← 목록</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          {id ? '입지 데이터 수정' : '입지 데이터 입력'}
        </h2>
      </div>

      {/* 주소 검색 */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label style={labelStyle}>분석 주소</label>
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
        {form.lat && (
          <div style={{ fontSize: 12, color: '#2ecc71', marginTop: 6 }}>
            📍 {form.address} ({Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)})
          </div>
        )}
      </div>

      {/* 탭 */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
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
                  {((Number(form.premium)||0)+(Number(form.deposit)||0)+(Number(form.interior_budget)||0)+(Number(form.other_initial_cost)||0)).toLocaleString()}만원
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
                style={{
                  ...inputStyle, height: 200, padding: 12,
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </Field>
          )}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        {msg && <span style={{ fontSize: 13, color: msg.includes('✅') ? '#2ecc71' : '#e74c3c' }}>{msg}</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginLeft: 'auto', height: 42, padding: '0 24px',
            background: 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중...' : '💾 저장'}
        </button>
      </div>
    </div>
  );
}

// AI 의견 생성 기능은 Dashboard에서 분석 후 location과 연동하는 방식으로 추가 예정
// 현재 LocationForm에서는 저장된 AI 의견만 표시