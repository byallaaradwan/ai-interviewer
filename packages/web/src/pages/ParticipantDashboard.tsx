import { useEffect, useMemo, useState } from 'react';

type HistoryEntry = {
  id: string;
  ts: number;
  topic?: string;
  turns?: number;
  summary?: { themes?: string[] };
};

const HIST_KEY = 'interview_history_v1';

const DEMO_HISTORY: HistoryEntry[] = [
  // Theme counts: Search friction=5, Trust concerns=4, Confusing UX=3, Slow response=2, Feature gaps=1 — all unique
  { id: 'demo_1', ts: Date.now() - 86400000 * 6, topic: 'Podcast discovery habits', turns: 9, summary: { themes: ['Search friction', 'Trust concerns', 'Confusing UX', 'Feature gaps'] } },
  { id: 'demo_2', ts: Date.now() - 86400000 * 4, topic: 'Onboarding experience review', turns: 14, summary: { themes: ['Confusing UX', 'Search friction', 'Trust concerns', 'Slow response'] } },
  { id: 'demo_3', ts: Date.now() - 86400000 * 3, topic: 'Mobile checkout friction', turns: 6, summary: { themes: ['Trust concerns', 'Search friction', 'Slow response'] } },
  { id: 'demo_4', ts: Date.now() - 86400000 * 1, topic: 'Feature prioritization feedback', turns: 11, summary: { themes: ['Search friction', 'Trust concerns', 'Confusing UX'] } },
  { id: 'demo_5', ts: Date.now() - 3600000, topic: 'Customer support satisfaction', turns: 8, summary: { themes: ['Search friction'] } },
];

function readHistory(): HistoryEntry[] {
  try {
    const stored = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    if (stored.length > 0) return stored;
    // Seed demo data on first visit
    localStorage.setItem(HIST_KEY, JSON.stringify(DEMO_HISTORY));
    return DEMO_HISTORY;
  } catch { return DEMO_HISTORY; }
}

export function ParticipantDashboard() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  useEffect(() => { setEntries(readHistory()); }, []);

  const totalInterviews = entries.length;
  const totalTurns = entries.reduce((s, e) => s + (e.turns || 0), 0);
  const avgTurns = totalInterviews > 0 ? Math.round(totalTurns / totalInterviews) : 0;

  const topics = useMemo(() => entries.map(e => e.topic).filter(Boolean) as string[], [entries]);

  const themeFreq = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => {
      (e.summary?.themes || []).forEach(th => { map[th] = (map[th] || 0) + 1; });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);
  const maxTheme = Math.max(1, ...themeFreq.map(([, c]) => c));

  const turnsData = useMemo(() => entries.slice().reverse().map((e, i) => ({ i: i + 1, turns: e.turns || 0, topic: e.topic || '' })), [entries]);
  const maxTurns = Math.max(1, ...turnsData.map(d => d.turns));

  const W = 500, H = 120, P = 24;
  const barW = turnsData.length > 0 ? Math.min(40, (W - P * 2) / turnsData.length - 4) : 20;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Your interview activity at a glance.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-box"><div className="stat-value">{totalInterviews}</div><div className="stat-label">Interviews</div></div>
        <div className="stat-box"><div className="stat-value">{totalTurns}</div><div className="stat-label">Total responses</div></div>
        <div className="stat-box"><div className="stat-value">{avgTurns}</div><div className="stat-label">Avg turns / interview</div></div>
      </div>

      {turnsData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px' }}>Turns per interview</h3>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Turns per interview">
            {turnsData.map((d, i) => {
              const x = P + i * ((W - P * 2) / turnsData.length) + 2;
              const h = (d.turns / maxTurns) * (H - P * 2);
              return (
                <g key={i}>
                  <rect x={x} y={H - P - h} width={barW} height={h} rx={4} fill="var(--primary)" opacity={0.85}>
                    <title>{d.topic}: {d.turns} turns</title>
                  </rect>
                  <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill="var(--muted)" fontSize={9}>#{d.i}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {topics.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px' }}>Topics covered</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topics.map((t, i) => (
              <span key={i} className="chip is-selected">{t}</span>
            ))}
          </div>
        </div>
      )}

      {themeFreq.length > 0 && (
        <div className="card">
          <h3 style={{ margin: '0 0 12px' }}>Top themes</h3>
          <div className="theme-bars">
            {themeFreq.map(([th, count], i) => (
              <div key={i} className="theme-bar-row">
                <span className="theme-bar-label">{th}</span>
                <div className="theme-bar-track"><div className="theme-bar-fill" style={{ width: `${(count / maxTheme) * 100}%` }} /></div>
                <span className="theme-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalInterviews === 0 && (
        <div className="card placeholder-card">
          <h2 style={{ margin: '0 0 8px' }}>No activity yet</h2>
          <p className="subtitle">Complete an interview from your inbox to see your dashboard.</p>
        </div>
      )}
    </div>
  );
}
