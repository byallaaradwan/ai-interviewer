import { useEffect, useState } from 'react';

type HistoryEntry = {
  id: string;
  ts: number;
  topic?: string;
  turns?: number;
  diagType?: string;
};

const HIST_KEY = 'interview_history_v1';

function readHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
}

export function ParticipantCompleted() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  useEffect(() => { setEntries(readHistory()); }, []);

  const fmtDate = (ts: number) => new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Completed interviews</h1>
        <p className="subtitle">Interviews you've finished. Your detailed responses are stored privately.</p>
      </div>

      {entries.length === 0 ? (
        <div className="card placeholder-card">
          <h2 style={{ margin: '0 0 8px' }}>Nothing here yet</h2>
          <p className="subtitle">After you complete an interview from the inbox, it will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {entries.map(e => (
            <div key={e.id} className="card history-item">
              <div className="history-item-title">{e.topic || 'Untitled interview'}</div>
              <div className="history-item-meta">
                {fmtDate(e.ts)}
                {e.turns ? ` · ${e.turns} turns` : ''}
                {e.diagType ? ` · ${e.diagType}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
