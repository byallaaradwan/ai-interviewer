import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SideNav, useSidebarState } from './SideNav';
import { OnboardingTour, type TourStep } from './OnboardingTour';
import { createT, type Lang } from '../i18n';

const RESEARCHER_TOUR: TourStep[] = [
  { target: '[data-tour="sidenav"]', text: 'This is your main navigation. All your tools live here — interviews, brainstorming, history, and more.', position: 'right' },
  { target: '[data-tour="nav-new"]', text: 'Start here to create a new interview. Set up your topic, audience, and scope.', position: 'right' },
  { target: '[data-tour="nav-diagnose"]', text: 'Not sure what kind of interview to run? Describe your problem and get a recommendation.', position: 'right' },
  { target: '[data-tour="nav-brainstorm"]', text: 'Test and refine your interview questions before going live. AI will critique and improve them.', position: 'right' },
  { target: '[data-tour="nav-history"]', text: 'All your past interviews are saved here. Export or review them any time.', position: 'right' },
  { target: '[data-tour="lang-toggle"]', text: 'Switch between English and Arabic. The entire interface adjusts automatically.', position: 'bottom' },
  { target: '[data-tour="theme-toggle"]', text: 'Toggle between light and dark mode. Your preference is remembered.', position: 'bottom' },
];

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
  const t = createT(lang);
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);
  const sidebar = useSidebarState();
  const [tourDone, setTourDone] = useState(false);

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
            data-tour="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            aria-label="Change language"
          >
            🌐 {lang === 'en' ? 'EN' : 'ع'}
          </button>
          <button
            type="button"
            className="icon-btn"
            data-tour="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? '🌙' : '☀'} {theme === 'dark' ? t('themeDark') : t('themeLight')}
          </button>
        </header>
        <div className="app-content">
          <Outlet context={{ lang, setLang, theme, setTheme }} />
        </div>
        {!tourDone && <OnboardingTour id="researcher" steps={RESEARCHER_TOUR} onDone={() => setTourDone(true)} />}
      </div>
    </div>
  );
}
