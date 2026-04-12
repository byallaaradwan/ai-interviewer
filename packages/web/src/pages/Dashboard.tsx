import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

type HistoryEntry = {
  id: string;
  ts: number;
  topic?: string;
  turns?: number;
  summary?: { themes?: string[] };
};

const HIST_KEY = 'interview_history_v1';

const DEMO: HistoryEntry[] = [
  { id: 'rd1', ts: Date.now() - 86400000 * 28, topic: 'Podcast discovery habits', turns: 12, summary: { themes: ['Search friction', 'Trust concerns', 'Content overload'] } },
  { id: 'rd2', ts: Date.now() - 86400000 * 23, topic: 'Onboarding experience review', turns: 9, summary: { themes: ['Confusing UX', 'Feature discovery', 'Trust concerns'] } },
  { id: 'rd3', ts: Date.now() - 86400000 * 18, topic: 'Mobile checkout friction', turns: 15, summary: { themes: ['Payment anxiety', 'Slow response', 'Trust concerns', 'Confusing UX'] } },
  { id: 'rd4', ts: Date.now() - 86400000 * 14, topic: 'Feature prioritization feedback', turns: 7, summary: { themes: ['Feature gaps', 'Search friction'] } },
  { id: 'rd5', ts: Date.now() - 86400000 * 10, topic: 'Customer support satisfaction', turns: 11, summary: { themes: ['Slow response', 'Search friction', 'Feature gaps'] } },
  { id: 'rd6', ts: Date.now() - 86400000 * 6, topic: 'Pricing perception study', turns: 14, summary: { themes: ['Trust concerns', 'Feature gaps', 'Content overload'] } },
  { id: 'rd7', ts: Date.now() - 86400000 * 3, topic: 'Notification preferences', turns: 8, summary: { themes: ['Confusing UX', 'Feature discovery'] } },
  { id: 'rd8', ts: Date.now() - 86400000 * 1, topic: 'Onboarding drop-off analysis', turns: 10, summary: { themes: ['Search friction', 'Confusing UX', 'Slow response'] } },
];

function readHistory(): HistoryEntry[] {
  try {
    const stored = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    if (stored.length > 0) return stored;
    localStorage.setItem(HIST_KEY, JSON.stringify(DEMO));
    return DEMO;
  } catch { return DEMO; }
}

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', '#3DB3C4', '#9B8AF9'];

export function Dashboard() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const nav = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [newInterviewAlert, setNewInterviewAlert] = useState(false);
  const lastSeenCount = useRef<number>(-1);
  const displayName = localStorage.getItem('user_display_name') || '';

  useEffect(() => { setEntries(readHistory()); }, []);

  // Detect new interviews via polling
  useEffect(() => {
    if (lastSeenCount.current === -1) {
      lastSeenCount.current = entries.length;
    }
    const timer = setInterval(() => {
      const current = readHistory();
      if (current.length > lastSeenCount.current) {
        setNewInterviewAlert(true);
        setEntries(current);
        lastSeenCount.current = current.length;
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [entries.length]);

  const totalInterviews = entries.length;
  const totalTurns = entries.reduce((s, e) => s + (e.turns || 0), 0);
  const avgTurns = totalInterviews > 0 ? Math.round(totalTurns / totalInterviews) : 0;
  const completionRate = totalInterviews > 0 ? Math.round((entries.filter(e => (e.turns || 0) > 3).length / totalInterviews) * 100) : 0;

  // Turns bar chart
  const turnsData = useMemo(() => entries.slice().reverse().map((e, i) => ({ i: i + 1, turns: e.turns || 0, topic: e.topic || '' })), [entries]);
  const maxTurns = Math.max(1, ...turnsData.map(d => d.turns));
  const W = 500, H = 120, P = 24;
  const barW = turnsData.length > 0 ? Math.min(40, (W - P * 2) / turnsData.length - 4) : 20;

  // Theme frequency
  const themeFreq = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { (e.summary?.themes || []).forEach(th => { map[th] = (map[th] || 0) + 1; }); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);
  const maxTheme = Math.max(1, ...themeFreq.map(([, c]) => c));

  // Topic distribution (top 5)
  const topicFreq = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { if (e.topic) map[e.topic] = (map[e.topic] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);
  const topicTotal = topicFreq.reduce((s, [, c]) => s + c, 0);

  // Timeline (last 30 days)
  const timeline = useMemo(() => {
    const now = Date.now();
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: 0 });
    }
    entries.forEach(e => {
      const key = new Date(e.ts).toISOString().slice(0, 10);
      const day = days.find(d => d.date === key);
      if (day) day.count++;
    });
    return days;
  }, [entries]);
  const maxTimeline = Math.max(1, ...timeline.map(d => d.count));

  const cards = [
    { to: '/app/new', icon: '+', titleKey: 'dashNewTitle', bodyKey: 'dashNewBody' },
    { to: '/app/diagnose', icon: '◎', titleKey: 'dashDiagnoseTitle', bodyKey: 'dashDiagnoseBody' },
    { to: '/app/brainstorm', icon: '✦', titleKey: 'dashBrainstormTitle', bodyKey: 'dashBrainstormBody' },
    { to: '/app/history', icon: '⌚', titleKey: 'dashHistoryTitle', bodyKey: 'dashHistoryBody' },
  ];

  if (totalInterviews === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>{t('dashTitle')}{displayName ? `, ${displayName}` : ''}</h1>
          <p className="subtitle">{t('dashSub')}</p>
        </div>
        <div className="dash-grid">
          {cards.map(c => (
            <Link key={c.to} to={c.to} className="dash-card">
              <div className="dash-card-icon" aria-hidden="true">{c.icon}</div>
              <div className="dash-card-title">{t(c.titleKey)}</div>
              <div className="dash-card-body">{t(c.bodyKey)}</div>
            </Link>
          ))}
        </div>
        <div className="card placeholder-card" style={{ marginTop: 24 }}>
          <h2 style={{ margin: '0 0 8px' }}>{t('dashNoData')}</h2>
          <p className="subtitle">{t('dashNoDataBody')}</p>
        </div>
      </div>
    );
  }

  const TW = 500, TH = 100, TP = 24;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashTitle')}{displayName ? `, ${displayName}` : ''}</h1>
        <p className="subtitle">{t('dashSub')}</p>
      </div>

      {newInterviewAlert && (
        <div className="resume-banner" style={{ marginBottom: 18 }}>
          <div className="text">
            <h3>🎉 {t('newInterviewAlert')}</h3>
          </div>
          <div className="actions">
            <button className="btn" onClick={() => { setNewInterviewAlert(false); nav('/app/history'); }}>{t('showBtn')}</button>
            <button className="btn btn-secondary" onClick={() => setNewInterviewAlert(false)}>✕</button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-box"><div className="stat-value">{totalInterviews}</div><div className="stat-label">{t('dashStatsInterviews')}</div></div>
        <div className="stat-box"><div className="stat-value">{totalTurns}</div><div className="stat-label">{t('dashStatsResponses')}</div></div>
        <div className="stat-box"><div className="stat-value">{avgTurns}</div><div className="stat-label">{t('dashStatsAvgTurns')}</div></div>
        <div className="stat-box"><div className="stat-value">{completionRate}%</div><div className="stat-label">{t('dashStatsCompletion')}</div></div>
      </div>

      {/* Quick Actions */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {cards.map(c => (
          <Link key={c.to} to={c.to} className="dash-card">
            <div className="dash-card-icon" aria-hidden="true">{c.icon}</div>
            <div className="dash-card-title">{t(c.titleKey)}</div>
            <div className="dash-card-body">{t(c.bodyKey)}</div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Turns per interview */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>{t('dashTurnsChart')}</h3>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img">
            {turnsData.map((d, i) => {
              const x = P + i * ((W - P * 2) / turnsData.length) + 2;
              const h = (d.turns / maxTurns) * (H - P * 2);
              return (
                <g key={i}>
                  <rect x={x} y={H - P - h} width={barW} height={h} rx={4} fill="var(--primary)" opacity={0.85}>
                    <title>{d.topic}: {d.turns}</title>
                  </rect>
                  <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill="var(--muted)" fontSize={9}>#{d.i}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Interview Timeline */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>{t('dashTimeline')} <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>({t('dashLast30')})</span></h3>
          <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" height={TH} role="img">
            <defs>
              <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {/* Area */}
            <path d={(() => {
              const pts = timeline.map((d, i) => {
                const x = TP + i * ((TW - TP * 2) / (timeline.length - 1));
                const y = TH - TP - (d.count / maxTimeline) * (TH - TP * 2);
                return `${x},${y}`;
              });
              const lastX = TP + (timeline.length - 1) * ((TW - TP * 2) / (timeline.length - 1));
              return `M${TP},${TH - TP} L${pts.join(' L')} L${lastX},${TH - TP} Z`;
            })()} fill="url(#tl-grad)" />
            {/* Line */}
            <polyline points={timeline.map((d, i) => {
              const x = TP + i * ((TW - TP * 2) / (timeline.length - 1));
              const y = TH - TP - (d.count / maxTimeline) * (TH - TP * 2);
              return `${x},${y}`;
            }).join(' ')} fill="none" stroke="var(--primary)" strokeWidth={2} />
            {/* Dots */}
            {timeline.map((d, i) => {
              if (d.count === 0) return null;
              const x = TP + i * ((TW - TP * 2) / (timeline.length - 1));
              const y = TH - TP - (d.count / maxTimeline) * (TH - TP * 2);
              return <circle key={i} cx={x} cy={y} r={3} fill="var(--primary)"><title>{d.date}: {d.count}</title></circle>;
            })}
          </svg>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Topic Distribution - Donut */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>{t('dashTopicDist')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg viewBox="0 0 100 100" width={120} height={120}>
              {(() => {
                let offset = 0;
                const circumference = 2 * Math.PI * 36;
                return topicFreq.map(([topic, count], i) => {
                  const pct = count / topicTotal;
                  const dash = pct * circumference;
                  const gap = circumference - dash;
                  const el = (
                    <circle key={i} cx={50} cy={50} r={36} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={18}
                      strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)">
                      <title>{topic}: {count}</title>
                    </circle>
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
              {topicFreq.map(([topic], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Themes */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>{t('dashTopThemes')}</h3>
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
      </div>
    </div>
  );
}
