import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

export function Placeholder({ titleKey }: { titleKey: string }) {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  return (
    <div className="page">
      <div className="card placeholder-card">
        <h1>{t(titleKey)}</h1>
        <p className="subtitle">{t('placeholderBody')}</p>
        <div className="placeholder-badge">{t('comingSoon')}</div>
      </div>
    </div>
  );
}
