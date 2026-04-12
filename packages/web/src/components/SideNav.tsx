import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createT, type Lang } from '../i18n';
import { setRole } from '../lib/role';
import { MuhawerLogo } from './MuhawerLogo';

type NavItem = { to: string; labelKey: string; icon: string; end?: boolean; tourId?: string };

const ITEMS: NavItem[] = [
  { to: '/app',            labelKey: 'navDashboard',  icon: '◉', end: true, tourId: 'nav-dashboard' },
  { to: '/app/new',        labelKey: 'navNewInterview', icon: '＋', tourId: 'nav-new' },
  { to: '/app/diagnose',   labelKey: 'navDiagnose',   icon: '◎', tourId: 'nav-diagnose' },
  { to: '/app/brainstorm', labelKey: 'navBrainstorm', icon: '✦', tourId: 'nav-brainstorm' },
  { to: '/app/email',      labelKey: 'navEmail',      icon: '✉' },
  { to: '/app/history',    labelKey: 'navHistory',    icon: '↻', tourId: 'nav-history' },
  { to: '/app/templates',  labelKey: 'navTemplates',  icon: '▤' },
];

const FOOTER: NavItem[] = [
  { to: '/app/settings', labelKey: 'navSettings', icon: '⚙' },
  { to: '/app/account',  labelKey: 'navAccount',  icon: '◐' },
  { to: '/app/help',     labelKey: 'navHelp',     icon: '?' },
];

export function SideNav({ lang, onNavigate }: { lang: Lang; onNavigate?: () => void }) {
  const t = createT(lang);
  const nav = useNavigate();
  const switchToParticipant = () => {
    setRole('participant');
    onNavigate?.();
    nav('/p');
  };
  const renderItem = (it: NavItem) => (
    <NavLink
      key={it.to}
      to={it.to}
      end={it.end}
      onClick={onNavigate}
      className={({ isActive }) => `sidenav-item ${isActive ? 'is-active' : ''}`}
      {...(it.tourId ? { 'data-tour': it.tourId } : {})}
    >
      <span className="sidenav-icon" aria-hidden="true">{it.icon}</span>
      <span className="sidenav-label">{t(it.labelKey)}</span>
    </NavLink>
  );

  return (
    <nav className="sidenav" aria-label="Main" data-tour="sidenav">
      <div className="sidenav-header">
        <NavLink to="/app" className="sidenav-brand" onClick={onNavigate}>
          <MuhawerLogo size={28} />
          <span className="sidenav-brand-text">{t('brandName')}</span>
        </NavLink>
      </div>
      <div className="sidenav-section">
        {ITEMS.map(renderItem)}
      </div>
      <div className="sidenav-footer">
        {FOOTER.map(renderItem)}
        <button type="button" className="sidenav-switch" onClick={switchToParticipant}>
          <span aria-hidden="true">↔</span>
          <span>{t('navSwitchParticipant')}</span>
        </button>
      </div>
    </nav>
  );
}

export function useSidebarState() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('sidenav-open', open);
    return () => document.body.classList.remove('sidenav-open');
  }, [open]);
  return { open, setOpen, toggle: () => setOpen(o => !o), close: () => setOpen(false) };
}
