import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createT, type Lang } from '../i18n';

type NavItem = { to: string; labelKey: string; icon: string; end?: boolean };

const ITEMS: NavItem[] = [
  { to: '/app',            labelKey: 'navDashboard',  icon: '◉', end: true },
  { to: '/app/new',        labelKey: 'navNewInterview', icon: '+' },
  { to: '/app/diagnose',   labelKey: 'navDiagnose',   icon: '◎' },
  { to: '/app/brainstorm', labelKey: 'navBrainstorm', icon: '✦' },
  { to: '/app/email',      labelKey: 'navEmail',      icon: '✉' },
  { to: '/app/history',    labelKey: 'navHistory',    icon: '⌚' },
  { to: '/app/templates',  labelKey: 'navTemplates',  icon: '☰' },
];

const FOOTER: NavItem[] = [
  { to: '/app/settings', labelKey: 'navSettings', icon: '⚙' },
  { to: '/app/account',  labelKey: 'navAccount',  icon: '◐' },
  { to: '/app/help',     labelKey: 'navHelp',     icon: '?' },
];

export function SideNav({ lang, onNavigate }: { lang: Lang; onNavigate?: () => void }) {
  const t = createT(lang);
  const renderItem = (it: NavItem) => (
    <NavLink
      key={it.to}
      to={it.to}
      end={it.end}
      onClick={onNavigate}
      className={({ isActive }) => `sidenav-item ${isActive ? 'is-active' : ''}`}
    >
      <span className="sidenav-icon" aria-hidden="true">{it.icon}</span>
      <span className="sidenav-label">{t(it.labelKey)}</span>
    </NavLink>
  );

  return (
    <nav className="sidenav" aria-label="Main">
      <div className="sidenav-header">
        <NavLink to="/app" className="sidenav-brand" onClick={onNavigate}>
          <span className="sidenav-brand-mark">AI</span>
          <span className="sidenav-brand-text">AI Interviewer</span>
        </NavLink>
      </div>
      <div className="sidenav-section">
        {ITEMS.map(renderItem)}
      </div>
      <div className="sidenav-footer">
        {FOOTER.map(renderItem)}
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
