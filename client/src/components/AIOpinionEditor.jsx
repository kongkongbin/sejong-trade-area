import React, { useState } from 'react';
import api from '../api/axios';

const VERDICT_OPTIONS = [
  { value: 'GO', label: '✅ GO', color: '#2ecc71' },
  { value: 'CONDITIONAL_GO', label: '⚠️ 조건부 GO', color: '#f39c12' },
  { value: 'NO_GO', label: '❌ NO-GO', color: '#e74c3c' },
];

const sectionStyle = {
  background: '#fff', border: '1px solid #e2e6ea',
  borderRadius: 10, padding: 16, marginBottom: 14,
};

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#5a6a7e',
  marginBottom: 8, display: 'block',
};

function ListEditor({ items, onChange, placeholder }) {
  function updateItem(i, value) {
    const next = [...items];
    next[i] = typeof items[i] === 'object' ? { ...items[i], text: value } : value;
    onChange(next);
  }

  function addItem() {
    onChange([...items, typeof items[0] === 'object' ? { text: '', checked: false } : '']);
  }

  function removeItem(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function toggleCheck(i) {
    const next = [...items];
    next[i] = { ...next[i], checked: !next[i].checked };
    onChange(next);
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {typeof item === 'object' && (
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleCheck(i)}
              style={{ flexShrink: 0 }}
            />
          )}
          <input
            value={typeof item === 'object' ? item.text : item}
            onChange={e => updateItem(i, e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1, height: 34, padding: '0 10px',
              border: '1px solid #e2e6ea', borderRadius: 6,
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <button
            onClick={() => removeItem(i)}
            style={{
              width: 28, height: 28, border: 'none', background: '#fff0f0',
              color: '#e74c3c', borderRadius: 6, cursor: 'pointer', fontSize: 14,
              flexShrink: 0,
            }}
          >×</button>
        </div>
      ))}
      <button
        onClick={addItem}
        style={{
          fontSize: 12, padding: '5px 12px', border: '1px dashed #c9a84c',
          borderRadius: 6, background: '#fff', color: '#c9a84c',
          cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
        }}
      >+ 항목 추가</button>
    </div>
  );
}

export default function AIOpinionEditor({ locationId, initialData, onSave }) {
  const [data, setData] = useState({
    summary: initialData?.summary || '',
    strengths: initialData?.strengths || [],
    risks: initialData?.risks || [],
    financial: initialData?.financial || '',
    checklist: initialData?.checklist || [],
    verdict: initialData?.verdict || 'CONDITIONAL_GO',
    verdictReason: initialData?.verdictReason || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (key, value) => setData(d => ({ ...d, [key]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/locations/${locationId}/ai-structured`, data);
      setMsg('✅ 저장되었습니다.');
      if (onSave) onSave(data);
    } catch {
      setMsg('❌ 저장 실패');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  const verdictInfo = VERDICT_OPTIONS.find(v => v.value === data.verdict);

  return (
    <div>
      {/* 핵심 요약 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📋 입지 핵심 요약</label>
        <textarea
          value={data.summary}
          onChange={e => set('summary', e.target.value)}
          placeholder="핵심 요약을 입력하세요..."
          style={{
            width: '100%', height: 100, padding: 10,
            border: '1px solid #e2e6ea', borderRadius: 6,
            fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
            lineHeight: 1.6, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 강점 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>✅ 강점</label>
        <ListEditor
          items={data.strengths}
          onChange={v => set('strengths', v)}
          placeholder="강점 항목 입력..."
        />
      </div>

      {/* 리스크 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>⚠️ 리스크</label>
        <ListEditor
          items={data.risks}
          onChange={v => set('risks', v)}
          placeholder="리스크 항목 입력..."
        />
      </div>

      {/* 재무 분석 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>💰 재무 분석</label>
        <textarea
          value={data.financial}
          onChange={e => set('financial', e.target.value)}
          placeholder="재무 분석 내용..."
          style={{
            width: '100%', height: 120, padding: 10,
            border: '1px solid #e2e6ea', borderRadius: 6,
            fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
            lineHeight: 1.6, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 체크리스트 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📋 계약 전 확인 체크리스트</label>
        <ListEditor
          items={data.checklist}
          onChange={v => set('checklist', v)}
          placeholder="체크리스트 항목..."
        />
      </div>

      {/* 최종 판정 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🎯 세종의 최종 의견</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {VERDICT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set('verdict', opt.value)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 8,
                background: data.verdict === opt.value ? opt.color : '#f0f2f5',
                color: data.verdict === opt.value ? '#fff' : '#5a6a7e',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <textarea
          value={data.verdictReason}
          onChange={e => set('verdictReason', e.target.value)}
          placeholder="판정 이유를 입력하세요..."
          style={{
            width: '100%', height: 80, padding: 10,
            border: `1.5px solid ${verdictInfo?.color || '#e2e6ea'}`,
            borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
            resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {msg && <span style={{ fontSize: 13, color: msg.includes('✅') ? '#2ecc71' : '#e74c3c' }}>{msg}</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginLeft: 'auto', height: 40, padding: '0 20px',
            background: 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중...' : '💾 저장'}
        </button>
      </div>
    </div>
  );
}