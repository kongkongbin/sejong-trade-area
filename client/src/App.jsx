import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LocationList from './pages/LocationList';
import LocationForm from './pages/LocationForm';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const navBtn = (path, label) => (
    <button
      onClick={() => navigate(path)}
      style={{
        background: location.pathname.startsWith(path) ? 'rgba(201,168,76,0.2)' : 'none',
        border: location.pathname.startsWith(path) ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
        color: location.pathname.startsWith(path) ? '#c9a84c' : 'rgba(255,255,255,0.7)',
        padding: '5px 12px', borderRadius: 6, fontSize: 12,
        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#c9a84c', fontSize: 18 }}>🏢</span>
        <span>세종홀딩스 상권/입지 분석</span>
        <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
          {navBtn('/dashboard', '📊 상권분석')}
          {navBtn('/locations', '📋 입지데이터')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {user.name && (
          <span style={{ fontSize: 13, color: '#c9a84c', fontWeight: 500 }}>{user.name}</span>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
            color: '#c9a84c', padding: '5px 12px', borderRadius: 6,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <>
                <Topbar />
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/locations" element={<LocationList />} />
                  <Route path="/location/new" element={<LocationForm />} />
                  <Route path="/location/:id" element={<LocationForm />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}