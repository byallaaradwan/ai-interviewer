import { useEffect, useMemo, useState } from 'react';
import { singleShot } from '../lib/llm';
import type { Lang } from '../i18n';
import { createT } from '../i18n';

type Msg = { role: 'model' | 'user'; text: string; ts: number; closing?: boolean };

type JourneyStage = {
  name: string;
  actions: string[];
  thoughts: string[];
  emotion: string;
  emotion_score: number;
  pains: string[];
  quote: string;
};
type Journey = { stages: JourneyStage[]; overall_summary: string };

const MOCK_JOURNEY: Journey = {
  stages: [
    { name: 'Awareness', actions: ['Searches online', 'Asks friends'], thoughts: ['Which option is best?'], emotion: 'curious', emotion_score: 0.3, pains: ['Too many conflicting reviews'], quote: 'I had no idea where to start.' },
    { name: 'Consideration', actions: ['Compares options'], thoughts: ['Is it worth the price?'], emotion: 'uncertain', emotion_score: -0.1, pains: ['Hidden trade-offs'], quote: 'Every option felt like a gamble.' },
    { name: 'Decision', actions: ['Picks one'], thoughts: ['Hope this works'], emotion: 'hopeful', emotion_score: 0.4, pains: ['Fear of buyer regret'], quote: 'I just went with my gut.' },
    { name: 'Use', actions: ['Tries the product'], thoughts: ['Am I doing this right?'], emotion: 'mixed', emotion_score: 0.0, pains: ['Onboarding friction'], quote: 'It took longer than I expected.' },
    { name: 'Reflection', actions: ['Reviews experience'], thoughts: ['Would I do this again?'], emotion: 'satisfied', emotion_score: 0.6, pains: ['Wishes for more guidance'], quote: 'In the end I am glad I tried it.' },
  ],
  overall_summary: 'A cautious journey from confusion to satisfaction with friction at onboarding.',
};

const EMOJI = (score: number) => score > 0.5 ? '😊' : score > 0.1 ? '🙂' : score > -0.1 ? '😐' : score > -0.5 ? '😕' : '😩';

export function SummaryExtras({ history, themes, lang }: { history: Msg[]; themes: string[]; lang: Lang }) {
  const t = createT(lang);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loadingJ, setLoadingJ] = useState(false);
  const [errJ, setErrJ] = useState<string | null>(null);

  const userMsgs = useMemo(() => history.filter(m => m.role === 'user' && !m.closing), [history]);

  // Simple lexical sentiment proxy: positive/negative word counts
  const POS = ['good','great','love','easy','simple','clear','helpful','useful','nice','amazing','perfect','works','better','quick','fast','enjoy','like','happy'];
  const NEG = ['bad','hate','hard','difficult','confusing','slow','broken','fail','problem','issue','annoying','frustrating','wrong','never','cant','can\'t','dont','don\'t'];
  const sentimentSeries = useMemo(() => userMsgs.map((m, i) => {
    const w = m.text.toLowerCase().split(/\s+/);
    let s = 0;
    w.forEach(x => { if (POS.includes(x)) s += 1; if (NEG.includes(x)) s -= 1; });
    const norm = Math.max(-1, Math.min(1, s / 3));
    return { i: i + 1, v: norm, text: m.text };
  }), [userMsgs]);

  const themeFreq = useMemo(() => themes.map(th => {
    const words = th.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    let count = 0;
    userMsgs.forEach(m => {
      const lo = m.text.toLowerCase();
      if (words.some(w => lo.includes(w))) count += 1;
    });
    return { theme: th, count };
  }), [themes, userMsgs]);

  const lengthSeries = useMemo(() => userMsgs.map((m, i) => ({ i: i + 1, len: m.text.length })), [userMsgs]);

  const generateJourney = async () => {
    setLoadingJ(true);
    setErrJ(null);
    try {
      const transcript = history.map(m => `${m.role === 'model' ? 'Q' : 'A'}: ${m.text}`).join('\n');
      const sys = 'You are a UX researcher. Given an interview transcript, build a 5-stage customer journey map. Return ONLY JSON matching: {"stages":[{"name":"","actions":[""],"thoughts":[""],"emotion":"","emotion_score":0,"pains":[""],"quote":""}],"overall_summary":""}. Use 5 stages. emotion_score is -1..1. quote must be verbatim from the transcript.';
      const raw = await singleShot({ systemText: sys, userText: transcript, mockResponse: JSON.stringify(MOCK_JOURNEY) });
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setJourney(parsed);
    } catch (e: any) {
      setErrJ(e.message || 'Failed to generate journey');
    } finally {
      setLoadingJ(false);
    }
  };

  useEffect(() => {
    if (history.length > 0 && !journey) generateJourney();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const W = 600, H = 140, P = 28;
  const xStep = sentimentSeries.length > 1 ? (W - P * 2) / (sentimentSeries.length - 1) : 0;
  const yMid = H / 2;
  const sentPath = sentimentSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${P + i * xStep} ${yMid - p.v * (H / 2 - P)}`).join(' ');

  const maxLen = Math.max(1, ...lengthSeries.map(l => l.len));
  const lenPath = lengthSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${P + i * xStep} ${H - P - (p.len / maxLen) * (H - P * 2)}`).join(' ');

  const maxTheme = Math.max(1, ...themeFreq.map(t => t.count));

  return (
    <>
      <div className="summary-section">
        <h2>{t('chartsTitle')}</h2>

        {sentimentSeries.length > 0 && (
          <div className="chart-block">
            <h4>{t('chartSentiment')}</h4>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Sentiment trend">
              <line x1={P} y1={yMid} x2={W - P} y2={yMid} stroke="var(--border)" strokeDasharray="2 4" />
              <path d={sentPath} fill="none" stroke="var(--primary)" strokeWidth="2" />
              {sentimentSeries.map((p, i) => (
                <circle key={i} cx={P + i * xStep} cy={yMid - p.v * (H / 2 - P)} r="3.5" fill={p.v >= 0 ? 'var(--primary)' : 'var(--error)'}>
                  <title>{`#${p.i}: ${p.text.slice(0, 80)}`}</title>
                </circle>
              ))}
            </svg>
          </div>
        )}

        {themeFreq.length > 0 && (
          <div className="chart-block">
            <h4>{t('chartThemes')}</h4>
            <div className="theme-bars">
              {themeFreq.map((tf, i) => (
                <div key={i} className="theme-bar-row">
                  <span className="theme-bar-label">{tf.theme}</span>
                  <div className="theme-bar-track"><div className="theme-bar-fill" style={{ width: `${(tf.count / maxTheme) * 100}%` }} /></div>
                  <span className="theme-bar-count">{tf.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lengthSeries.length > 0 && (
          <div className="chart-block">
            <h4>{t('chartLength')}</h4>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Response length">
              <path d={lenPath} fill="none" stroke="var(--secondary)" strokeWidth="2" />
              {lengthSeries.map((p, i) => (
                <circle key={i} cx={P + i * xStep} cy={H - P - (p.len / maxLen) * (H - P * 2)} r="3" fill="var(--secondary)" />
              ))}
            </svg>
          </div>
        )}
      </div>

      <div className="summary-section">
        <h2>{t('journeyTitle')}</h2>
        {loadingJ && <p style={{ color: 'var(--muted)' }}>{t('journeyLoading')}</p>}
        {errJ && <p style={{ color: 'var(--error)' }}>{errJ}</p>}
        {journey && (
          <>
            <p className="subtitle" style={{ marginBottom: 12 }}>{journey.overall_summary}</p>
            <div className="journey-grid">
              {journey.stages.map((s, i) => (
                <div className="journey-stage" key={i}>
                  <div className="journey-stage-head">
                    <strong>{s.name}</strong>
                    <span className="journey-emoji" aria-label={s.emotion}>{EMOJI(s.emotion_score)}</span>
                  </div>
                  {s.actions?.length > 0 && (
                    <div className="journey-row"><em>{t('journeyActions')}</em><ul>{s.actions.map((a, j) => <li key={j}>{a}</li>)}</ul></div>
                  )}
                  {s.thoughts?.length > 0 && (
                    <div className="journey-row"><em>{t('journeyThoughts')}</em><ul>{s.thoughts.map((a, j) => <li key={j}>{a}</li>)}</ul></div>
                  )}
                  {s.pains?.length > 0 && (
                    <div className="journey-row"><em>{t('journeyPains')}</em><ul>{s.pains.map((a, j) => <li key={j}>{a}</li>)}</ul></div>
                  )}
                  {s.quote && (
                    <div className="journey-quote">"{s.quote}"</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
