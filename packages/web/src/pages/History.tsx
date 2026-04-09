import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

type HistoryEntry = {
  id: string;
  ts: number;
  topic?: string;
  audience?: string;
  lang?: string;
  diagType?: string;
  turns?: number;
  summary?: {
    themes?: string[];
    quotes?: { context: string; quote: string }[];
    insights?: string[];
  };
};

const HIST_KEY = 'interview_history_v1';

function readHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function History() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readHistory());
  }, []);

  const remove = (id: string) => {
    if (!confirm(t('historyConfirmDelete'))) return;
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportOne = (entry: HistoryEntry) => {
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-${entry.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviews-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const incoming: HistoryEntry[] = Array.isArray(data) ? data : [data];
      const valid = incoming.filter(e => e && e.id && e.ts);
      if (valid.length === 0) { alert(t('historyImportEmpty')); return; }
      const existingIds = new Set(entries.map(e => e.id));
      const merged = [...valid.filter(e => !existingIds.has(e.id)), ...entries];
      setEntries(merged);
      try { localStorage.setItem(HIST_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
      alert(t('historyImportOk').replace('{n}', String(valid.length)));
    } catch (e: any) {
      alert(t('historyImportFail') + ': ' + e.message);
    }
  };

  const clearAll = () => {
    if (!confirm(t('historyConfirmClearAll'))) return;
    setEntries([]);
    try { localStorage.removeItem(HIST_KEY); } catch { /* ignore */ }
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleString(lang === 'ar' ? 'ar' : undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1>{t('historyTitle')}</h1>
          <p className="subtitle">{t('historySub')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            {t('historyImport')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }}
          />
          {entries.length > 0 && (
            <>
              <button type="button" className="btn btn-secondary" onClick={exportAll}>
                {t('historyExportAll')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={clearAll}>
                {t('historyClearAll')}
              </button>
            </>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card placeholder-card">
          <h2 style={{ margin: '0 0 8px' }}>{t('historyEmptyTitle')}</h2>
          <p className="subtitle">{t('historyEmptyBody')}</p>
          <p className="subtitle" style={{ marginTop: 8 }}>{t('historyEmptyImportHint')}</p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map(e => {
            const isOpen = openId === e.id;
            return (
              <div key={e.id} className={`card history-item ${isOpen ? 'is-open' : ''}`}>
                <div className="history-item-head">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="history-item-title">{e.topic || t('historyUntitled')}</div>
                    <div className="history-item-meta">
                      {fmtDate(e.ts)}
                      {e.turns ? ` · ${e.turns} ${t('turnsLabel')}` : ''}
                      {e.diagType ? ` · ${e.diagType}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setOpenId(isOpen ? null : e.id)}>
                      {isOpen ? t('historyHide') : t('historyView')}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => exportOne(e)} aria-label="Export">
                      ↓
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => remove(e.id)} aria-label="Delete">
                      ✕
                    </button>
                  </div>
                </div>
                {isOpen && e.summary && (
                  <div className="history-item-body">
                    {(e.summary.themes && e.summary.themes.length > 0) && (
                      <div>
                        <h4>{t('keyThemes')}</h4>
                        <ul>{e.summary.themes.map((th, i) => <li key={i}>{th}</li>)}</ul>
                      </div>
                    )}
                    {(e.summary.insights && e.summary.insights.length > 0) && (
                      <div>
                        <h4>{t('actionableInsights')}</h4>
                        <ul>{e.summary.insights.map((ins, i) => <li key={i}>{ins}</li>)}</ul>
                      </div>
                    )}
                    {(e.summary.quotes && e.summary.quotes.length > 0) && (
                      <div>
                        <h4>{t('notableQuotes')}</h4>
                        {e.summary.quotes.map((q, i) => (
                          <div key={i} className="history-quote">
                            <div className="history-quote-ctx">{q.context}</div>
                            <div>"{q.quote}"</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
