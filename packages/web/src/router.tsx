import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import { AppLayout } from './components/AppLayout';
import { ParticipantLayout } from './components/ParticipantLayout';
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
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { ParticipantCompleted } from './pages/ParticipantCompleted';
import { ParticipantHelp } from './pages/ParticipantHelp';
import { Settings } from './pages/Settings';
import { ParticipantSettings } from './pages/ParticipantSettings';
import { Account } from './pages/Account';
import { ParticipantAccount } from './pages/ParticipantAccount';
import { ResearcherHelp } from './pages/ResearcherHelp';
import { getRole } from './lib/role';

function RoleGate({ children, allow }: { children: JSX.Element; allow: 'researcher' | 'participant' }) {
  const role = getRole();
  // participant_mode handled by dedicated /interview route
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
        <Route path="/i/:token" element={<ParticipantPlaceholder />} />
        <Route path="/interview" element={<App />} />
        <Route path="/app" element={<RoleGate allow="researcher"><AppLayout /></RoleGate>}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<App />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="brainstorm" element={<Brainstorm />} />
          <Route path="email" element={<EmailGen />} />
          <Route path="history" element={<History />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<Account />} />
          <Route path="help" element={<ResearcherHelp />} />
        </Route>
        <Route path="/p" element={<RoleGate allow="participant"><ParticipantLayout /></RoleGate>}>
          <Route index element={<ParticipantDashboard />} />
          <Route path="inbox" element={<ParticipantInbox />} />
          <Route path="completed" element={<ParticipantCompleted />} />
          <Route path="help" element={<ParticipantHelp />} />
          <Route path="settings" element={<ParticipantSettings />} />
          <Route path="account" element={<ParticipantAccount />} />
        </Route>
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
