import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SideNav, useSidebarState } from './SideNav';
import type { Lang } from '../i18n';

function readLang(): Lang {
  const v = localStorage.getItem('lang');
  return v === 'ar' ? 'ar' : 'en';
}

function readTheme(): 'light' | 'dark' {
  const v = localStorage.getItem('theme');
  if (v === 'light' || v === 'dark') return v;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppLayout() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);
  const sidebar = useSidebarState();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('theme', theme);
    localStorage.setItem('lang', lang);
  }, [lang, theme]);

  return (
    <div className="app-shell">
      <SideNav lang={lang} onNavigate={sidebar.close} />
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
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            aria-label="Change language"
          >
            🌐 {lang === 'en' ? 'EN' : 'ع'}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </header>
        <div className="app-content">
          <Outlet context={{ lang, setLang, theme, setTheme }} />
        </div>
      </div>
    </div>
  );
}
