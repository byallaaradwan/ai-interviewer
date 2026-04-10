import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readPending, type PendingInterview, setRole, PASSCODE } from '../lib/role';

export function ParticipantInbox() {
  const nav = useNavigate();
  const [pending, setPending] = useState<PendingInterview[]>([]);
  const [selected, setSelected] = useState<PendingInterview | null>(null);
  const [askSwitch, setAskSwitch] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { setPending(readPending()); }, []);

  const startInterview = (p: PendingInterview) => {
    // Hydrate the App's setup keys from this pending interview
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

  const trySwitch = () => {
    if (pass === PASSCODE) { setRole('researcher'); nav('/app'); }
    else setErr('Wrong passcode');
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <header className="participant-topbar">
        <div className="participant-brand">AI Interviewer</div>
        <button type="button" className="btn btn-secondary" onClick={() => setAskSwitch(true)}>
          Switch to researcher
        </button>
      </header>
      <div className="container view-in" style={{ paddingTop: 40 }}>
        <div className="card">
          <div>
            <h1 style={{ marginTop: 0 }}>💬 Your interview inbox</h1>
            <p className="subtitle">A researcher has prepared the following interviews. Click one to begin.</p>
          </div>

        {askSwitch && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
            <p style={{ marginTop: 0 }}>Enter the researcher passcode:</p>
            <input type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') trySwitch(); }} autoFocus placeholder="Passcode" />
            {err && <p style={{ color: 'var(--error)', marginBottom: 0 }}>{err}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" className="btn" onClick={trySwitch}>Continue</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setAskSwitch(false); setPass(''); }}>Cancel</button>
            </div>
          </div>
        )}

        {pending.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
            <p>No interviews waiting for you right now.</p>
            <p style={{ fontSize: '0.9rem' }}>Ask the researcher to set one up.</p>
          </div>
        ) : selected ? (
          <div style={{ marginTop: 20 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
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
      </div>
    </>
  );
}
