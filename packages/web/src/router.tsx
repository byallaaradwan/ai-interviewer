import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Diagnose } from './pages/Diagnose';
import { Placeholder } from './pages/Placeholder';
import { ParticipantPlaceholder } from './pages/ParticipantPlaceholder';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app/new" element={<App />} />
        <Route path="/i/:token" element={<ParticipantPlaceholder />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="brainstorm" element={<Placeholder titleKey="navBrainstorm" />} />
          <Route path="history" element={<Placeholder titleKey="navHistory" />} />
          <Route path="templates" element={<Placeholder titleKey="navTemplates" />} />
          <Route path="settings" element={<Placeholder titleKey="navSettings" />} />
          <Route path="account" element={<Placeholder titleKey="navAccount" />} />
          <Route path="help" element={<Placeholder titleKey="navHelp" />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
