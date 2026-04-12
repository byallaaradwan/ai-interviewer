import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

export function Account() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('user_display_name') || '');
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('user_display_name', displayName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportData = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key) || '';
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muhawer-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          Object.entries(data).forEach(([k, v]) => { localStorage.setItem(k, v as string); });
          window.location.reload();
        } catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAll = () => {
    localStorage.clear();
    window.location.href = '/landing';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('accountTitle')}</h1>
        <p className="subtitle">{t('accountSub')}</p>
      </div>

      {/* Profile */}
      <div className="card settings-section">
        <h3>{t('accountProfile')}</h3>
        <div className="field">
          <label>{t('accountDisplayName')}</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={t('accountDisplayNamePH')} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button type="button" className="btn" onClick={handleSave}>{t('save')}</button>
          {saved && <span style={{ color: 'var(--success, #22c55e)', fontSize: '0.85rem' }}>✓ {t('settingsSaved')}</span>}
        </div>
        <div className="settings-row">
          <div><label className="settings-label">{t('accountRole')}</label></div>
          <span className="placeholder-badge">{t('accountRoleResearcher')}</span>
        </div>
      </div>

      {/* Data Management */}
      <div className="card settings-section">
        <h3>{t('accountData')}</h3>
        <p className="subtitle" style={{ marginBottom: 16 }}>{t('accountExportHelp')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className="btn" onClick={exportData}>{t('accountExport')}</button>
          <button type="button" className="btn btn-secondary" onClick={importData}>{t('accountImport')}</button>
          {!confirmClear ? (
            <button type="button" className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={() => setConfirmClear(true)}>
              {t('accountClearAll')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, width: '100%' }}>
              <p style={{ color: 'var(--error)', fontSize: '0.85rem', margin: 0 }}>{t('accountClearConfirm')}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn" style={{ background: 'var(--error)' }} onClick={clearAll}>{t('accountClearAll')}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card settings-section">
        <h3>{t('accountAbout')}</h3>
        <div className="settings-row">
          <label className="settings-label">{t('accountVersion')}</label>
          <span style={{ color: 'var(--muted)' }}>1.0.0</span>
        </div>
        <div className="settings-row">
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('accountBuiltWith')}</span>
        </div>
      </div>
    </div>
  );
}
