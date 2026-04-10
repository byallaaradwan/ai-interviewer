import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ParticipantSideNav } from './ParticipantSideNav';
import { useSidebarState } from './SideNav';
import { OnboardingTour, type TourStep } from './OnboardingTour';

const PARTICIPANT_TOUR: TourStep[] = [
  { target: '[data-tour="p-dashboard"]', text: 'Your dashboard shows charts and stats from your completed interviews.', position: 'right' },
  { target: '[data-tour="p-inbox"]', text: 'Check your inbox for interviews a researcher has prepared for you. Click one to begin.', position: 'right' },
  { target: '[data-tour="p-completed"]', text: 'All your finished interviews are saved here for reference.', position: 'right' },
  { target: '[data-tour="p-help"]', text: 'Have questions? Check the Help section for tips and FAQs.', position: 'right' },
];

function readTheme(): 'light' | 'dark' {
  const v = localStorage.getItem('theme');
  if (v === 'light' || v === 'dark') return v;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ParticipantLayout() {
  const sidebar = useSidebarState();
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);
  const [tourDone, setTourDone] = useState(false);

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
        {!tourDone && <OnboardingTour id="participant" steps={PARTICIPANT_TOUR} onDone={() => setTourDone(true)} />}
      </div>
    </div>
  );
}
