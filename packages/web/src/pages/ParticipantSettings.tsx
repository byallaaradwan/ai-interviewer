import { useState } from 'react';
import { createT, type Lang } from '../i18n';

export function ParticipantSettings() {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'en');
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const v = localStorage.getItem('theme');
    if (v === 'light' || v === 'dark') return v;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const t = createT(lang);

  const setTheme = (v: 'light' | 'dark') => {
    setThemeState(v);
    document.documentElement.setAttribute('data-theme', v);
    localStorage.setItem('theme', v);
  };

  const setLang = (v: Lang) => {
    setLangState(v);
    document.documentElement.lang = v;
    document.documentElement.dir = v === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', v);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('settingsTitle')}</h1>
        <p className="subtitle">{t('settingsSub')}</p>
      </div>

      <div className="card settings-section">
        <h3>{t('settingsAppearance')}</h3>
        <div className="settings-row">
          <div><label className="settings-label">{t('settingsTheme')}</label></div>
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
          <div><label className="settings-label">{t('settingsLanguage')}</label></div>
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
    </div>
  );
}
