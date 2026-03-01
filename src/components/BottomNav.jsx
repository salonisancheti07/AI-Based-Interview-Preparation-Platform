import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/BottomNav.css';

const items = [
  { label: 'Home', path: '/dashboard', icon: '🏠' },
  { label: 'Practice', path: '/interview', icon: '🧩' },
  { label: 'Contests', path: '/contests', icon: '🏁' },
  { label: 'Mocks', path: '/mock-rounds', icon: '🎤' },
  { label: 'Profile', path: '/profile', icon: '👤' },
  { label: 'Behavioral', path: '/behavioral', icon: '💼' },
  { label: 'Systems', path: '/system-design', icon: '🧱' }
];

export default function BottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="bottom-nav">
      {items.map((item) => {
        const active = pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            className={`bn-item ${active ? 'active' : ''}`}
            onClick={() => nav(item.path)}
          >
            <span className="bn-icon">{item.icon}</span>
            <span className="bn-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
