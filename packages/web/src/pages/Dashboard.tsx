import { Link, useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

export function Dashboard() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);

  const cards = [
    { to: '/app/new',       icon: '+', titleKey: 'dashNewTitle',       bodyKey: 'dashNewBody' },
    { to: '/app/diagnose',  icon: '◎', titleKey: 'dashDiagnoseTitle',  bodyKey: 'dashDiagnoseBody' },
    { to: '/app/brainstorm',icon: '✦', titleKey: 'dashBrainstormTitle',bodyKey: 'dashBrainstormBody' },
    { to: '/app/history',   icon: '⌚',titleKey: 'dashHistoryTitle',   bodyKey: 'dashHistoryBody' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashTitle')}</h1>
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
    </div>
  );
}
