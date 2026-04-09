import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Diagnose } from './pages/Diagnose';
import { Brainstorm } from './pages/Brainstorm';
import { EmailGen } from './pages/EmailGen';
import { Templates } from './pages/Templates';
import { History } from './pages/History';
import { Placeholder } from './pages/Placeholder';
import { ParticipantPlaceholder } from './pages/ParticipantPlaceholder';
import { Landing } from './pages/Landing';
import { ParticipantInbox } from './pages/ParticipantInbox';
import { getRole } from './lib/role';

function RoleGate({ children, allow }: { children: JSX.Element; allow: 'researcher' | 'participant' }) {
  const role = getRole();
  // Participant in interview run is allowed through /app/new even without role=researcher
  if (allow === 'researcher' && localStorage.getItem('participant_mode') === '1') return children;
  if (!role) return <Navigate to="/landing" replace />;
  if (role !== allow) return <Navigate to={role === 'participant' ? '/p' : '/app'} replace />;
  return children;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/p" element={<RoleGate allow="participant"><ParticipantInbox /></RoleGate>} />
        <Route path="/app/new" element={<RoleGate allow="researcher"><App /></RoleGate>} />
        <Route path="/i/:token" element={<ParticipantPlaceholder />} />
        <Route path="/app" element={<RoleGate allow="researcher"><AppLayout /></RoleGate>}>
          <Route index element={<Dashboard />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="brainstorm" element={<Brainstorm />} />
          <Route path="email" element={<EmailGen />} />
          <Route path="history" element={<History />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Placeholder titleKey="navSettings" />} />
          <Route path="account" element={<Placeholder titleKey="navAccount" />} />
          <Route path="help" element={<Placeholder titleKey="navHelp" />} />
        </Route>
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
