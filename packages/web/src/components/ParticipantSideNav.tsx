import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { setRole, PASSCODE } from '../lib/role';

type NavItem = { to: string; label: string; icon: string; end?: boolean };

const ITEMS: NavItem[] = [
  { to: '/p',          label: 'Dashboard',  icon: '◉', end: true },
  { to: '/p/inbox',    label: 'Inbox',      icon: '📥' },
  { to: '/p/completed',label: 'Completed',  icon: '✓' },
  { to: '/p/help',     label: 'Help',       icon: '?' },
];

export function ParticipantSideNav({ onNavigate }: { onNavigate?: () => void }) {
  const nav = useNavigate();
  const [askPass, setAskPass] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const trySwitch = () => {
    if (pass === PASSCODE) { setRole('researcher'); nav('/app'); }
    else setErr('Wrong passcode');
  };

  return (
    <nav className="sidenav" aria-label="Main">
      <div className="sidenav-header">
        <NavLink to="/p" className="sidenav-brand" onClick={onNavigate}>
          <span className="sidenav-brand-mark">AI</span>
          <span className="sidenav-brand-text">AI Interviewer</span>
        </NavLink>
      </div>
      <div className="sidenav-section">
        {ITEMS.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            className={({ isActive }) => `sidenav-item ${isActive ? 'is-active' : ''}`}
          >
            <span className="sidenav-icon" aria-hidden="true">{it.icon}</span>
            <span className="sidenav-label">{it.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidenav-footer">
        {!askPass ? (
          <button
            type="button"
            className="sidenav-item"
            onClick={() => setAskPass(true)}
            style={{ background: 'transparent', border: 'none', textAlign: 'inherit', cursor: 'pointer', font: 'inherit', color: 'inherit', width: '100%' }}
          >
            <span className="sidenav-icon" aria-hidden="true">🔬</span>
            <span className="sidenav-label">Switch to researcher</span>
          </button>
        ) : (
          <div style={{ padding: '8px 16px' }}>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') trySwitch(); if (e.key === 'Escape') { setAskPass(false); setPass(''); } }}
              autoFocus
              placeholder="Passcode"
              style={{ width: '100%', marginBottom: 6 }}
            />
            {err && <p style={{ color: 'var(--error)', fontSize: '0.8rem', margin: '0 0 4px' }}>{err}</p>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={trySwitch}>Go</button>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => { setAskPass(false); setPass(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
