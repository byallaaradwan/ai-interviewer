import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

export function ResearcherHelp() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);

  const faqs = [
    { q: t('helpQ1'), a: t('helpA1') },
    { q: t('helpQ2'), a: t('helpA2') },
    { q: t('helpQ3'), a: t('helpA3') },
    { q: t('helpQ4'), a: t('helpA4') },
    { q: t('helpQ5'), a: t('helpA5') },
    { q: t('helpQ6'), a: t('helpA6') },
    { q: t('helpQ7'), a: t('helpA7') },
    { q: t('helpQ8'), a: t('helpA8') },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('helpTitle')}</h1>
        <p className="subtitle">{t('helpSub')}</p>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {faqs.map((f, i) => (
          <details key={i} className="card" style={{ padding: 16 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{f.q}</summary>
            <p style={{ margin: '10px 0 0', color: 'var(--muted)' }}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
