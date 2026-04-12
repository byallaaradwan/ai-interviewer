import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setRole, PASSCODE } from '../lib/role';
import { MuhawerLogo } from '../components/MuhawerLogo';

export function Landing() {
  const nav = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [askPass, setAskPass] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1600);
    const t2 = setTimeout(() => setSplashDone(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const pickParticipant = () => { setRole('participant'); nav('/p'); };
  const pickResearcher = () => { setAskPass(true); setErr(''); };
  const submitPass = () => {
    if (pass === PASSCODE) { setRole('researcher'); nav('/app'); }
    else setErr('Wrong passcode');
  };

  return (
    <>
      {/* Splash screen */}
      {!splashDone && (
        <div className={`splash-screen ${splashFading ? 'splash-out' : ''}`}>
          <MuhawerLogo size={120} />
          <h1 className="splash-logo-text">Muhawer</h1>
        </div>
      )}

      {/* Role selection */}
      <div
        className="container view-in"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
          opacity: splashDone ? 1 : 0, transition: 'opacity 0.4s ease',
        }}
      >
        <div className="card" style={{ maxWidth: 560, width: '100%' }}>
          <h1 style={{ marginTop: 0 }}>Who are you?</h1>
          <p className="subtitle">Pick how you'll use the app today. You can switch later.</p>

          {!askPass ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              <button type="button" className="btn" onClick={pickResearcher} style={{ padding: '18px', fontSize: '1.05rem' }}>
                I'm a researcher
              </button>
              <button type="button" className="btn btn-secondary" onClick={pickParticipant} style={{ padding: '18px', fontSize: '1.05rem' }}>
                I'm a participant
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
    </>
  );
}
