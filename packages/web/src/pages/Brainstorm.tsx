import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createT, type Lang } from '../i18n';
import { isConfigured, singleShot } from '../lib/llm';

type Ctx = { lang: Lang };

const MOCK_QUESTIONS = `1. Walk me through the last time you used a podcast app — what were you trying to do?
2. How did you decide which podcast to listen to next?
3. What does a great podcast discovery experience look like to you?
4. Tell me about a time you couldn't find what you wanted in a podcast app.
5. When you find a podcast you love, how do you usually share it with others?
6. What would you change about how podcasts are recommended to you today?
7. How do you decide whether a new podcast is worth your time?
8. What signals make you trust a podcast recommendation?
9. Describe your typical listening routine — when, where, and how.
10. If a friend asked you to recommend an app for finding new podcasts, what would you say and why?`;

function questionsSystemPrompt(lang: Lang): string {
  if (lang === 'ar') {
    return `أنت باحث UX خبير. عند إعطائك موضوعًا وجمهورًا، أنشئ قائمة من 10 أسئلة مقابلة مفتوحة شبه منظمة. لا تستخدم أسئلة "نعم/لا". اجعل الأسئلة محايدة وتشجّع على القصص. أرقّمها 1-10. لا تضف مقدمة أو خاتمة.`;
  }
  return `You are an expert UX researcher. Given a topic and audience, generate exactly 10 open-ended, semi-structured interview questions. AVOID yes/no questions. Encourage storytelling and specific past examples ("walk me through the last time…"). Use neutral, non-leading language. Number them 1-10. Output only the numbered list — no intro, no outro.`;
}

export function Brainstorm() {
  const { lang } = useOutletContext<Ctx>();
  const t = createT(lang);
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setBusy(true);
    setOutput('');
    try {
      const userText = `Topic: ${topic}\nAudience: ${audience || 'general users'}\n\nGenerate 10 interview questions.`;
      const text = await singleShot({
        systemText: questionsSystemPrompt(lang),
        userText,
        mockResponse: MOCK_QUESTIONS,
      });
      setOutput(text.trim());
    } catch (e: any) {
      setError(e?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('brainstormTitle')}</h1>
        <p className="subtitle">{t('brainstormSub')}</p>
      </div>

      <div className="card">
        {!isConfigured() && (
          <div className="resume-banner" style={{ marginBottom: 14 }}>
            <div className="text">
              <h3>{t('llmNotConfiguredTitle')}</h3>
              <p>{t('llmNotConfiguredBody')}</p>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="bs-topic">{t('topicLabel')}</label>
          <input
            id="bs-topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder={t('topicPH')}
          />
        </div>

        <div className="field">
          <label htmlFor="bs-audience">{t('audienceLabel')}</label>
          <input
            id="bs-audience"
            type="text"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder={t('audiencePH')}
          />
        </div>

        <button
          type="button"
          className="btn"
          disabled={!topic.trim() || busy}
          onClick={generate}
        >
          {busy ? t('generating') : t('generateQuestions')}
        </button>

        {error && <div className="validation invalid" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {output && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{t('generatedQuestions')}</h2>
            <button type="button" className="btn btn-secondary" onClick={copy}>{t('copy')}</button>
          </div>
          <pre className="ai-output">{output}</pre>
        </div>
      )}
    </div>
  );
}
