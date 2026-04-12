import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setRole, PASSCODE, PARTICIPANT_PASSCODE } from '../lib/role';
import { MuhawerLogo } from '../components/MuhawerLogo';
import { I18N, createT, type Lang } from '../i18n';

export function Landing() {
  const nav = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const savedLang = localStorage.getItem('lang') as Lang | null;
  const [langPreview, setLangPreview] = useState<Lang | null>(null);
  const [langConfirmed, setLangConfirmed] = useState<boolean>(!!savedLang);
  const lang: Lang = savedLang || langPreview || 'en';
  const [askPass, setAskPass] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [showPass, setShowPass] = useState(false);
  // Participant passcode
  const [askParticipantPass, setAskParticipantPass] = useState(false);
  const [participantPass, setParticipantPass] = useState('');
  const [participantErr, setParticipantErr] = useState('');
  const [showParticipantPass, setShowParticipantPass] = useState(false);

  const t = createT(lang);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1600);
    const t2 = setTimeout(() => setSplashDone(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const confirmLang = () => {
    const l = langPreview || 'en';
    localStorage.setItem('lang', l);
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
    setLangConfirmed(true);
  };

  const pickParticipant = () => { setAskParticipantPass(true); setParticipantErr(''); };
  const pickResearcher = () => { setAskPass(true); setErr(''); };
  const submitPass = () => {
    if (pass === PASSCODE) { setRole('researcher'); nav('/app'); }
    else setErr(t('landingWrongPass'));
  };
  const submitParticipantPass = () => {
    if (participantPass === PARTICIPANT_PASSCODE) { setRole('participant'); nav('/p'); }
    else setParticipantErr(t('landingWrongPass'));
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

      <div
        className="container view-in"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
          opacity: splashDone ? 1 : 0, transition: 'opacity 0.4s ease',
        }}
      >
        {/* Language selection */}
        {!langConfirmed && (
          <div className="card" style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <h1 style={{ marginTop: 0, marginBottom: 24 }}>
              {langPreview === 'ar' ? I18N.ar.chooseYourLanguage as string : I18N.en.chooseYourLanguage as string}
            </h1>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn lang-pick-btn"
                style={{
                  flex: 1, padding: '18px', fontSize: '1.05rem',
                  outline: langPreview === 'en' ? '3px solid var(--primary)' : 'none',
                  outlineOffset: 2,
                  opacity: langPreview && langPreview !== 'en' ? 0.6 : 1,
                }}
                onClick={() => setLangPreview('en')}
              >
                English
              </button>
              <button
                type="button"
                className="btn lang-pick-btn"
                style={{
                  flex: 1, padding: '18px', fontSize: '1.05rem',
                  outline: langPreview === 'ar' ? '3px solid var(--primary)' : 'none',
                  outlineOffset: 2,
                  opacity: langPreview && langPreview !== 'ar' ? 0.6 : 1,
                }}
                onClick={() => setLangPreview('ar')}
              >
                العربية
              </button>
            </div>
            {langPreview && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: 16, padding: '14px', fontSize: '1rem', width: '100%' }}
                onClick={confirmLang}
              >
                {langPreview === 'ar' ? 'تأكيد' : 'Confirm'}
              </button>
            )}
          </div>
        )}

        {/* Role selection */}
        {langConfirmed && (
          <div className="card" style={{ maxWidth: 560, width: '100%' }}>
            <h1 style={{ marginTop: 0 }}>{t('landingTitle')}</h1>
            <p className="subtitle">{t('landingSub')}</p>

            {!askPass && !askParticipantPass ? (
              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                <button type="button" className="btn" onClick={pickResearcher} style={{ padding: '18px', fontSize: '1.05rem' }}>
                  {t('landingResearcher')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={pickParticipant} style={{ padding: '18px', fontSize: '1.05rem' }}>
                  {t('landingParticipant')}
                </button>
              </div>
            ) : askPass ? (
              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                <p>{t('landingPassPrompt')}</p>
                <div className="input-row">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={e => { setPass(e.target.value); setErr(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') submitPass(); }}
                    autoFocus
                    placeholder={t('landingPassPH')}
                  />
                  <button type="button" className="toggle" onClick={() => setShowPass(v => !v)}>{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
                {err && <p style={{ color: 'var(--error)', margin: 0 }}>{err}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" onClick={submitPass}>{t('landingContinue')}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setAskPass(false); setPass(''); }}>{t('landingBack')}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                <p>{t('landingParticipantPassPrompt')}</p>
                <div className="input-row">
                  <input
                    type={showParticipantPass ? 'text' : 'password'}
                    value={participantPass}
                    onChange={e => { setParticipantPass(e.target.value); setParticipantErr(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') submitParticipantPass(); }}
                    autoFocus
                    placeholder={t('landingPassPH')}
                  />
                  <button type="button" className="toggle" onClick={() => setShowParticipantPass(v => !v)}>{showParticipantPass ? 'HIDE' : 'SHOW'}</button>
                </div>
                {participantErr && <p style={{ color: 'var(--error)', margin: 0 }}>{participantErr}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" onClick={submitParticipantPass}>{t('landingContinue')}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setAskParticipantPass(false); setParticipantPass(''); }}>{t('landingBack')}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
