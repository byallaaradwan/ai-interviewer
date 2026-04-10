import { Outlet } from 'react-router-dom';
import { ParticipantSideNav } from './ParticipantSideNav';
import { useSidebarState } from './SideNav';

export function ParticipantLayout() {
  const sidebar = useSidebarState();

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
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
