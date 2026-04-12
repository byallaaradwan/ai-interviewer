import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';
import { isConfigured, singleShot, readLLMConfig } from '../lib/llm';

type Ctx = { lang: Lang };

const TONES = ['friendly', 'professional', 'casual'] as const;
type Tone = typeof TONES[number];

const MOCK_EMAIL = `Subject: Quick favor — 15 minutes to share your experience?

Hi {first_name},

I'm reaching out because we're working on improving how people discover new podcasts, and I'd love to learn from your experience as a long-time listener.

Would you be open to a 15-minute conversation in the next two weeks? I'm not selling anything — I just want to understand how you currently find podcasts and what frustrates you about the process. Your input will directly shape what we build next.

As a thank you, I'll send you a $20 Amazon gift card after our chat.

If you're up for it, just reply to this email with a few times that work for you. I'm flexible across timezones.

Thanks so much for considering it.

Best,
{your_name}`;

function emailSystemPrompt(lang: Lang, tone: Tone): string {
  if (lang === 'ar') {
    return `أنت كاتب نسخ تسويقية خبير متخصص في تجنيد المشاركين في أبحاث المستخدم. اكتب بريدًا إلكترونيًا قصيرًا (أقل من 200 كلمة) بأسلوب ${tone}، يدعو الجمهور المحدد لمقابلة مدتها 15-30 دقيقة. اشمل سطر الموضوع. استخدم {first_name} و{your_name} كمتغيرات. اذكر بوضوح أنك لا تبيع شيئًا واقترح حافزًا.`;
  }
  return `You are an expert copywriter specialised in user-research recruitment. Write a concise email (under 200 words) in a ${tone} tone inviting the target audience to a 15-30 minute interview. Include a Subject line. Use {first_name} and {your_name} as merge variables. Make it crystal clear you are NOT selling anything. Suggest an incentive (gift card, store credit, etc). End with a clear ask: reply with a few times.`;
}

export function EmailGen() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [incentive, setIncentive] = useState('');
  const [tone, setTone] = useState<Tone>('friendly');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inlineKey, setInlineKey] = useState('');
  const [configured, setConfigured] = useState(isConfigured());

  const saveInlineKey = (v: string) => {
    setInlineKey(v);
    if (v.length > 10) {
      localStorage.setItem('gemini_api_key', v);
      setConfigured(true);
    }
  };

  const generate = async () => {
    setError('');
    setBusy(true);
    setOutput('');
    try {
      const userText = `Research topic: ${topic}\nTarget audience: ${audience || 'general users'}\nIncentive offered: ${incentive || 'a small gift card'}\n\nWrite the recruitment email now.`;
      const text = await singleShot({
        systemText: emailSystemPrompt(lang, tone),
        userText,
        mockResponse: MOCK_EMAIL,
      });
      setOutput(text.trim());
    } catch (e: any) {
      setError(e?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('emailTitle')}</h1>
        <p className="subtitle">{t('emailSub')}</p>
      </div>

      <div className="card">
        {!configured && (
          <div className="resume-banner" style={{ marginBottom: 14 }}>
            <div className="text">
              <h3>{t('llmNotConfiguredTitle')}</h3>
              <p>{t('llmNotConfiguredBody')}</p>
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label htmlFor="em-apikey">API Key</label>
              <input
                id="em-apikey"
                type="password"
                value={inlineKey}
                onChange={e => saveInlineKey(e.target.value)}
                placeholder="sk-... or AIza..."
              />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="em-topic">{t('topicLabel')}</label>
          <input id="em-topic" type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('topicPH')} />
        </div>

        <div className="field">
          <label htmlFor="em-audience">{t('audienceLabel')}</label>
          <input id="em-audience" type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder={t('audiencePH')} />
        </div>

        <div className="field">
          <label htmlFor="em-incentive">{t('emailIncentiveLabel')}</label>
          <input id="em-incentive" type="text" value={incentive} onChange={e => setIncentive(e.target.value)} placeholder={t('emailIncentivePH')} />
        </div>

        <div className="field">
          <label>{t('emailToneLabel')}</label>
          <div className="chip-row" style={{ justifyContent: 'flex-start' }}>
            {TONES.map(tn => (
              <button
                key={tn}
                type="button"
                className={`chip ${tone === tn ? 'is-selected' : ''}`}
                onClick={() => setTone(tn)}
              >
                {t(`tone_${tn}`)}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="btn" disabled={!topic.trim() || busy} onClick={generate}>
          {busy ? t('generating') : t('generateEmail')}
        </button>

        {error && <div className="validation invalid" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {output && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{t('generatedEmail')}</h2>
            <button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(output)}>{t('copy')}</button>
          </div>
          <pre className="ai-output">{output}</pre>
        </div>
      )}
    </div>
  );
}
