import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

type InterviewType = {
  id: string;
  titleKey: string;
  bodyKey: string;
  keywords: string[];
};

const TYPES: InterviewType[] = [
  {
    id: 'discovery',
    titleKey: 'diagTypeDiscovery',
    bodyKey: 'diagTypeDiscoveryBody',
    keywords: ['discover', 'explore', 'unmet need', 'jobs to be done', 'jtbd', 'problem space', 'market fit', 'early stage', 'new market', 'segment', 'persona', 'need', 'opportunity', 'market', 'customer', 'research', 'understand', 'learn', 'behavior', 'habit', 'audience'],
  },
  {
    id: 'usability',
    titleKey: 'diagTypeUsability',
    bodyKey: 'diagTypeUsabilityBody',
    keywords: ['usability', 'flow', 'click', 'tap', 'navigate', 'confused', 'broken', 'stuck', 'prototype', 'ui', 'ux', 'interface', 'screen', 'button', 'menu', 'dropdown', 'user interface', 'user experience'],
  },
  {
    id: 'concept',
    titleKey: 'diagTypeConcept',
    bodyKey: 'diagTypeConceptBody',
    keywords: ['concept', 'idea', 'pitch', 'mock', 'prototype', 'react', 'feedback', 'opinion', 'positioning', 'message', 'landing', 'validate', 'test idea', 'new product', 'proposition', 'wireframe', 'mock-up', 'value proposition'],
  },
  {
    id: 'churn',
    titleKey: 'diagTypeChurn',
    bodyKey: 'diagTypeChurnBody',
    keywords: ['churn', 'cancel', 'leave', 'left', 'quit', 'unsubscribe', 'attrition', 'win-back', 'lost', 'inactive', 'lapsed', 'retention', 'lost customer', 'drop off', 'stopped using', 'switched'],
  },
  {
    id: 'pricing',
    titleKey: 'diagTypePricing',
    bodyKey: 'diagTypePricingBody',
    keywords: ['price', 'pricing', 'pay', 'paying', 'cost', 'expensive', 'cheap', 'plan', 'tier', 'willingness to pay', 'wtp', 'budget', 'affordable', 'willingness', 'monetize', 'subscription', 'free', 'premium'],
  },
  {
    id: 'satisfaction',
    titleKey: 'diagTypeSatisfaction',
    bodyKey: 'diagTypeSatisfactionBody',
    keywords: ['satisfaction', 'happy', 'love', 'hate', 'nps', 'csat', 'recommend', 'experience', 'feel', 'loyalty', 'sentiment', 'delight', 'frustration', 'unhappy'],
  },
];

function recommend(text: string): { primary: InterviewType; alt: InterviewType[] } {
  const lower = text.toLowerCase();
  const words = new Set(lower.split(/\W+/).filter(Boolean));
  const scored = TYPES.map(t => ({
    type: t,
    score: t.keywords.reduce((s, k) => {
      if (k.includes(' ')) {
        // Multi-word phrase: higher weight
        return s + (lower.includes(k) ? 3 : 0);
      }
      // Single word: word-boundary match
      return s + (words.has(k) ? 1 : 0);
    }, 0),
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: prefer Discovery over Usability
    const order = ['discovery', 'concept', 'churn', 'pricing', 'satisfaction', 'usability'];
    return order.indexOf(a.type.id) - order.indexOf(b.type.id);
  });
  const primary = scored[0].score > 0 ? scored[0].type : TYPES[0]; // default Discovery
  const alt = scored.slice(1, 3).filter(s => s.score > 0).map(s => s.type);
  return { primary, alt };
}

export function Diagnose() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const [problem, setProblem] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => (problem.trim().length >= 10 ? recommend(problem) : null), [problem]);

  const startWithType = (type: InterviewType) => {
    // Stash the diagnosis so /app/new can prefill the topic field
    try {
      localStorage.setItem('diagnose_problem', problem.trim());
      localStorage.setItem('diagnose_type', type.id);
      // Also seed the topic field used by the existing setup form
      if (!localStorage.getItem('topic')) {
        localStorage.setItem('topic', problem.trim().slice(0, 200));
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('diagTitle')}</h1>
        <p className="subtitle">{t('diagSub')}</p>
      </div>

      <div className="card">
        <label htmlFor="problem"><strong>{t('diagPromptLabel')}</strong></label>
        <textarea
          id="problem"
          value={problem}
          onChange={e => setProblem(e.target.value)}
          placeholder={t('diagPromptPH')}
          style={{ minHeight: 140, marginTop: 10 }}
        />
        <div className="helper">{t('diagPromptHelp')}</div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn"
            disabled={problem.trim().length < 10}
            onClick={() => setSubmitted(true)}
          >
            {t('diagAnalyze')}
          </button>
        </div>
      </div>

      {submitted && result && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="diagnose-result">
            <div className="diagnose-tag">{t('diagRecommended')}</div>
            <h2 style={{ margin: '8px 0 6px' }}>{t(result.primary.titleKey)}</h2>
            <p style={{ color: 'var(--muted-strong)', margin: 0 }}>{t(result.primary.bodyKey)}</p>
            <Link
              to="/app/new"
              className="btn"
              style={{ marginTop: 16, display: 'inline-block' }}
              onClick={() => startWithType(result.primary)}
            >
              {t('diagStartCta')} →
            </Link>
          </div>
          {result.alt.length > 0 && (
            <div className="diagnose-alts">
              <div className="helper" style={{ marginBottom: 8 }}>{t('diagAlsoConsider')}</div>
              <div className="chip-row" style={{ justifyContent: 'flex-start' }}>
                {result.alt.map(a => (
                  <Link
                    key={a.id}
                    to="/app/new"
                    className="chip"
                    onClick={() => startWithType(a)}
                  >
                    {t(a.titleKey)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
