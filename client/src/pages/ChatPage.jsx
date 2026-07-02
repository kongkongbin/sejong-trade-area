import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `안녕하세요! 세종홀딩스 AI 입지 상담 시스템입니다. 🏢

현장에서 확인하신 매물 정보를 대화로 입력해주시면, 자동으로 입지 데이터를 저장하고 AI 종합 분석을 진행해드립니다.

먼저 **분석할 주소나 위치**를 알려주세요.
(예: "대구 수성구 범어동 OO빌딩 1층")`
};

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedLocationId, setSavedLocationId] = useState(null);
  const [done, setDone] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/message', {
        messages: newMessages,
        locationId: savedLocationId,
      });

      const { reply, locationId, isComplete } = res.data;

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (locationId) setSavedLocationId(locationId);
      if (isComplete) setDone(true);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다, 오류가 발생했습니다. 다시 시도해주세요.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 60px)', background: '#f0f2f5',
    }}>
      {/* 헤더 */}
      <div style={{
        background: '#fff', padding: '12px 20px',
        borderBottom: '1px solid #e2e6ea',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>🤖</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0d1b2e' }}>AI 입지 상담</div>
          <div style={{ fontSize: 11, color: '#9aa5b1' }}>대화로 입지 데이터를 입력하세요</div>
        </div>
        {savedLocationId && (
          <button
            onClick={() => navigate(`/location/${savedLocationId}`)}
            style={{
              marginLeft: 'auto', height: 32, padding: '0 12px',
              background: '#f5ecd4', border: '1px solid #c9a84c',
              color: '#0d1b2e', borderRadius: 6, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            }}
          >
            📋 입지 데이터 보기
          </button>
        )}
      </div>

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end',
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #0d1b2e, #1e3a5f)'
                : '#fff',
              color: msg.role === 'user' ? '#fff' : '#0d1b2e',
              fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🤖</div>
            <div style={{
              padding: '10px 16px', background: '#fff', borderRadius: 16,
              borderBottomLeftRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#c9a84c',
                    animation: `bounce 1s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {done && (
          <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
            <button
              onClick={() => navigate(`/location/${savedLocationId}`)}
              style={{
                height: 44, padding: '0 24px',
                background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                color: '#0d1b2e', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(201,168,76,0.3)',
              }}
            >
              📋 입지 데이터 확인 및 AI 분석 생성 →
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      {!done && (
        <div style={{
          padding: '12px 16px', background: '#fff',
          borderTop: '1px solid #e2e6ea',
          display: 'flex', gap: 10, alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter로 전송)"
            disabled={loading}
            style={{
              flex: 1, minHeight: 40, maxHeight: 120, padding: '10px 14px',
              border: '1.5px solid #e2e6ea', borderRadius: 12,
              fontSize: 13, fontFamily: 'inherit', resize: 'none',
              outline: 'none', lineHeight: 1.5,
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: loading || !input.trim()
                ? '#e0e2e6'
                : 'linear-gradient(135deg, #0d1b2e, #1e3a5f)',
              color: '#fff', fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}