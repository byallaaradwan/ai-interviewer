import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readPending, type PendingInterview } from '../lib/role';

export function ParticipantInbox() {
  const nav = useNavigate();
  const [pending, setPending] = useState<PendingInterview[]>([]);
  const [selected, setSelected] = useState<PendingInterview | null>(null);

  useEffect(() => { setPending(readPending()); }, []);

  const startInterview = (p: PendingInterview) => {
    localStorage.setItem('topic', p.topic);
    localStorage.setItem('audience', p.audience);
    localStorage.setItem('researchGoal', p.researchGoal);
    localStorage.setItem('painPoints', p.painPoints);
    localStorage.setItem('region', p.region);
    localStorage.setItem('company', p.company);
    localStorage.setItem('industry', p.industry);
    localStorage.setItem('competitors', JSON.stringify(p.competitors || []));
    localStorage.setItem('scopeIn', p.scopeIn);
    localStorage.setItem('scopeOut', p.scopeOut);
    if (p.diagType) localStorage.setItem('diagnose_type', p.diagType);
    localStorage.setItem('participant_mode', '1');
    localStorage.setItem('participant_pending_id', p.id);
    nav('/app/new');
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inbox</h1>
        <p className="subtitle">Interviews a researcher prepared for you. Click one to begin.</p>
      </div>

      {pending.length === 0 ? (
        <div className="card placeholder-card">
          <h2 style={{ margin: '0 0 8px' }}>No interviews waiting</h2>
          <p className="subtitle">Ask the researcher to set one up for you.</p>
        </div>
      ) : selected ? (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{selected.topic}</h2>
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 6px' }}>🎯 Why we're doing this</h3>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{selected.researchGoal || 'To learn from your experience.'}</p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px' }}>🔐 Your privacy</h3>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Your responses stay on this device. Nothing is sold or shared. You don't need to give your name.
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px' }}>⏱ How long</h3>
              <p style={{ margin: 0, color: 'var(--muted)' }}>About 8–12 minutes. You can stop anytime.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button type="button" className="btn" onClick={() => startInterview(selected)}>
              I understand, let's begin
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {pending.map(p => (
            <div key={p.id} className="card history-item" style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
              <div className="history-item-title">{p.topic || 'Untitled interview'}</div>
              <div className="history-item-meta">
                Created {fmtDate(p.createdAt)}
                {p.audience ? ` · ${p.audience}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
