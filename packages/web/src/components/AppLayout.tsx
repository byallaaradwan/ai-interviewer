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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('onboarding_dismissed_v1'); } catch { return false; }
  });
  const dismissOnboarding = () => {
    try { localStorage.setItem('onboarding_dismissed_v1', '1'); } catch { /* ignore */ }
    setShowOnboarding(false);
  };

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
          {showOnboarding && (
            <div className="onboarding-hint" role="status">
              <div className="onboarding-hint-icon" aria-hidden="true">👋</div>
              <div className="onboarding-hint-body">
                <strong>{lang === 'ar' ? 'مرحبًا بك في AI Interviewer' : 'Welcome to AI Interviewer'}</strong>
                <p>
                  {lang === 'ar'
                    ? 'ابدأ من "تشخيص المشكلة" لمعرفة أفضل نوع مقابلة، ثم "مقابلة جديدة" لإجراء جلستك. كل شيء يعمل في وضع العرض بدون مفتاح API.'
                    : 'Start at Diagnose problem to find the right interview type, then New interview to run a session. Demo mode works without an API key.'}
                </p>
              </div>
              <button type="button" className="onboarding-hint-close" onClick={dismissOnboarding} aria-label="Dismiss">✕</button>
            </div>
          )}
          <Outlet context={{ lang, setLang, theme, setTheme }} />
        </div>
      </div>
    </div>
  );
}
