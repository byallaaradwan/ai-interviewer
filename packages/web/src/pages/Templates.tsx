import { useNavigate, useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';

type Ctx = { lang: Lang };

type Template = {
  id: string;
  titleKey: string;
  bodyKey: string;
  fields: {
    topic: string;
    audience: string;
    researchGoal: string;
    painPoints: string;
    scopeIn: string;
    scopeOut: string;
  };
};

const TEMPLATES: Template[] = [
  {
    id: 'discovery',
    titleKey: 'tpl_discovery_title',
    bodyKey: 'tpl_discovery_body',
    fields: {
      topic: 'Understanding how users currently solve [problem area]',
      audience: 'Active users of the problem space, mixed seniority',
      researchGoal: 'Identify the top 3 unmet needs we could build for',
      painPoints: 'Workarounds, abandoned tools, time waste',
      scopeIn: 'Current behaviour, motivations, workflows, mental models, what good looks like',
      scopeOut: 'Specific feature requests for our product, pricing, technical implementation',
    },
  },
  {
    id: 'usability',
    titleKey: 'tpl_usability_title',
    bodyKey: 'tpl_usability_body',
    fields: {
      topic: 'Usability test of [feature or flow]',
      audience: 'Target users matching the persona for this feature',
      researchGoal: 'Find friction points in the [specific] flow before launch',
      painPoints: 'Confusion, dead ends, abandoned tasks, unclear labels',
      scopeIn: 'Task completion, navigation choices, mental model vs actual behavior, first-impression reactions',
      scopeOut: 'Pricing, feature wishlists, brand perception, marketing copy',
    },
  },
  {
    id: 'churn',
    titleKey: 'tpl_churn_title',
    bodyKey: 'tpl_churn_body',
    fields: {
      topic: 'Why users cancelled or stopped using [product]',
      audience: 'Users who churned in the last 60 days',
      researchGoal: 'Identify the top 2-3 reasons for churn we can act on',
      painPoints: 'Unmet expectations, missing features, alternatives chosen, pricing concerns',
      scopeIn: 'Trigger event for leaving, what they tried before quitting, what would have made them stay, where they went next',
      scopeOut: 'Pitching them to come back, defending the product, technical bug reports',
    },
  },
  {
    id: 'pricing',
    titleKey: 'tpl_pricing_title',
    bodyKey: 'tpl_pricing_body',
    fields: {
      topic: 'Pricing and willingness to pay for [product/feature]',
      audience: 'Decision makers in target accounts',
      researchGoal: 'Understand price anchors and packaging that resonates',
      painPoints: 'Procurement friction, value perception, alternatives',
      scopeIn: 'Current spending in this category, perceived value, anchoring against alternatives, packaging preferences',
      scopeOut: 'Specific dollar amounts (avoid leading numbers), discounts, contract length',
    },
  },
];

export function Templates() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const navigate = useNavigate();

  const useTemplate = (tpl: Template) => {
    try {
      Object.entries(tpl.fields).forEach(([k, v]) => localStorage.setItem(k, v));
    } catch { /* ignore */ }
    navigate('/app/new');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('templatesTitle')}</h1>
        <p className="subtitle">{t('templatesSub')}</p>
      </div>

      <div className="dash-grid">
        {TEMPLATES.map(tpl => (
          <div key={tpl.id} className="dash-card" style={{ cursor: 'default' }}>
            <div className="dash-card-icon">★</div>
            <div className="dash-card-title">{t(tpl.titleKey)}</div>
            <div className="dash-card-body" style={{ marginBottom: 14 }}>{t(tpl.bodyKey)}</div>
            <button type="button" className="btn btn-secondary" onClick={() => useTemplate(tpl)}>
              {t('useTemplate')} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
