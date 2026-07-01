import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <div className="login-logo-icon">🏢</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1b2e', letterSpacing: '-0.3px' }}>
              세종홀딩스
            </div>
            <div style={{ fontSize: 11, color: '#9aa5b1' }}>SEJONG HOLDINGS</div>
          </div>
        </div>

        <h1>상권/입지 분석</h1>
        <p className="login-subtitle">관리자 전용 내부 시스템입니다.</p>

        {error && <p className="login-error">{error}</p>}

        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}