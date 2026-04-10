import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ParticipantSideNav } from './ParticipantSideNav';
import { useSidebarState } from './SideNav';

function readTheme(): 'light' | 'dark' {
  const v = localStorage.getItem('theme');
  if (v === 'light' || v === 'dark') return v;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ParticipantLayout() {
  const sidebar = useSidebarState();
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <ParticipantSideNav onNavigate={sidebar.close} />
      {sidebar.open && <div className="sidenav-scrim" onClick={sidebar.close} />}
      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="icon-btn sidenav-toggle"
            aria-label="Toggle navigation"
            onClick={sidebar.toggle}
          >
            ☰
          </button>
          <div className="app-topbar-spacer" />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? '☀' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
