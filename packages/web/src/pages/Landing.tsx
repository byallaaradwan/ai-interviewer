import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setRole, PASSCODE } from '../lib/role';

export function Landing() {
  const nav = useNavigate();
  const [askPass, setAskPass] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const pickParticipant = () => { setRole('participant'); nav('/p'); };
  const pickResearcher = () => { setAskPass(true); setErr(''); };
  const submitPass = () => {
    if (pass === PASSCODE) { setRole('researcher'); nav('/app'); }
    else setErr('Wrong passcode');
  };

  return (
    <div className="container view-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 560, width: '100%' }}>
        <h1 style={{ marginTop: 0 }}>Who are you?</h1>
        <p className="subtitle">Pick how you'll use the app today. You can switch later.</p>

        {!askPass ? (
          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <button type="button" className="btn" onClick={pickResearcher} style={{ padding: '18px', fontSize: '1.05rem' }}>
              🔬 I'm a researcher
            </button>
            <button type="button" className="btn btn-secondary" onClick={pickParticipant} style={{ padding: '18px', fontSize: '1.05rem' }}>
              💬 I'm a participant
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <p>Enter the researcher passcode:</p>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submitPass(); }}
              autoFocus
              placeholder="Passcode"
            />
            {err && <p style={{ color: 'var(--error)', margin: 0 }}>{err}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn" onClick={submitPass}>Continue</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setAskPass(false); setPass(''); }}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
