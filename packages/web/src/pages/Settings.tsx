import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';
import { PROVIDERS, type ProviderId } from '../providers';

type Ctx = { lang: Lang; setLang: (l: Lang) => void; theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') => void };

export function Settings() {
  const { lang, setLang, theme, setTheme } = useOutletContext<Ctx>();
  const t = createT(lang);

  const [provider, setProvider] = useState<ProviderId>(() => (localStorage.getItem('provider') as ProviderId) || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [defaultAudience, setDefaultAudience] = useState(() => localStorage.getItem('default_audience') || '');
  const [defaultRegion, setDefaultRegion] = useState(() => localStorage.getItem('default_region') || '');
  const [defaultScope, setDefaultScope] = useState(() => localStorage.getItem('default_scope') || '');
  const [saved, setSaved] = useState(false);

  const saveField = (key: string, value: string) => {
    localStorage.setItem(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('settingsTitle')}</h1>
        <p className="subtitle">{t('settingsSub')}</p>
      </div>

      {saved && (
        <div style={{ padding: '8px 14px', background: 'var(--primary-soft)', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', color: 'var(--primary)' }}>
          ✓ {t('settingsSaved')}
        </div>
      )}

      {/* Appearance */}
      <div className="card settings-section">
        <h3>{t('settingsAppearance')}</h3>
        <div className="settings-row">
          <div>
            <label className="settings-label">{t('settingsTheme')}</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={`btn ${theme === 'light' ? '' : 'btn-secondary'}`} onClick={() => setTheme('light')} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              ☀ {t('themeLight')}
            </button>
            <button type="button" className={`btn ${theme === 'dark' ? '' : 'btn-secondary'}`} onClick={() => setTheme('dark')} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              🌙 {t('themeDark')}
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <label className="settings-label">{t('settingsLanguage')}</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={`btn ${lang === 'en' ? '' : 'btn-secondary'}`} onClick={() => setLang('en')} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              English
            </button>
            <button type="button" className={`btn ${lang === 'ar' ? '' : 'btn-secondary'}`} onClick={() => setLang('ar')} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              العربية
            </button>
          </div>
        </div>
      </div>

      {/* AI Provider */}
      <div className="card settings-section">
        <h3>{t('settingsProvider')}</h3>
        <p className="subtitle" style={{ marginBottom: 16 }}>{t('settingsProviderHelp')}</p>
        <div className="field">
          <label>{t('providerLabel')}</label>
          <select value={provider} onChange={e => { const v = e.target.value as ProviderId; setProvider(v); saveField('provider', v); }}>
            {Object.entries(PROVIDERS).map(([id, p]) => (
              <option key={id} value={id}>{p.label} ({p.model})</option>
            ))}
          </select>
        </div>
        {provider !== 'mock' && (
          <div className="field">
            <label>{t('apiKeyLabel')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); saveField('gemini_api_key', e.target.value); }}
                placeholder={PROVIDERS[provider]?.keyPlaceholder || t('apiKeyPH')}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary" onClick={() => setShowKey(!showKey)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                {showKey ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 6 }}>{t('apiKeyHelp')}</p>
          </div>
        )}
      </div>

      {/* Default Preferences */}
      <div className="card settings-section">
        <h3>{t('settingsDefaults')}</h3>
        <div className="field">
          <label>{t('settingsDefaultAudience')}</label>
          <input type="text" value={defaultAudience} onChange={e => { setDefaultAudience(e.target.value); saveField('default_audience', e.target.value); }} placeholder={t('settingsDefaultAudiencePH')} />
        </div>
        <div className="field">
          <label>{t('settingsDefaultRegion')}</label>
          <input type="text" value={defaultRegion} onChange={e => { setDefaultRegion(e.target.value); saveField('default_region', e.target.value); }} placeholder={t('settingsDefaultRegionPH')} />
        </div>
        <div className="field">
          <label>{t('settingsDefaultScope')}</label>
          <textarea value={defaultScope} onChange={e => { setDefaultScope(e.target.value); saveField('default_scope', e.target.value); }} placeholder={t('settingsDefaultScopePH')} rows={3} />
        </div>
      </div>

      {/* Notifications */}
      <div className="card settings-section">
        <h3>{t('settingsNotifications')}</h3>
        <div className="settings-row" style={{ opacity: 0.5 }}>
          <div>
            <label className="settings-label">{t('settingsEmailNotif')}</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" disabled />
            <span className="placeholder-badge">{t('comingSoon')}</span>
          </div>
        </div>
        <div className="settings-row" style={{ opacity: 0.5 }}>
          <div>
            <label className="settings-label">{t('settingsCompletionAlerts')}</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" disabled />
            <span className="placeholder-badge">{t('comingSoon')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
