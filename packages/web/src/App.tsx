import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createT, I18N, type Lang } from './i18n';
import {
  PROVIDERS, type ProviderId, type HistoryMsg, type SummaryResult,
  callProvider, getStructuredTurn, stripControlTokens,
  buildSystemInstruction, generateSummaryCall,
  DEFAULT_SYSTEM_PROMPT, TOTAL_CORE_QUESTIONS,
} from './providers';

// =============== CONSTANTS ===============
const SESSION_KEY = 'session_v1';
type View = 'lang' | 'setup' | 'welcome' | 'chat' | 'thankyou' | 'summary';
type ClosingPhase = null | 'q1' | 'q2_consent' | 'q2_channel' | 'done';

const STOPWORDS = new Set(
  ("a an the and or but if then so for of to in on at by with from as is are was were be been being have has had do does did will would could should can may might i me my mine you your yours he him his she her it its we us our they them their this that these those not no yes just like really very too also more most some any many much few how what when where why who which there here").split(' ')
);

// =============== UTIL ===============
function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// =============== CONFETTI (imperative canvas, fire-and-forget) ===============
function launchConfetti() {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.id = 'confettiCanvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);
  const colors = ['#10B1A7', '#7C6FF7', '#FF7A59', '#3DBD7D', '#F5A623', '#0C8A82'];
  const N = 160;
  const particles = Array.from({ length: N }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 240,
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 9,
    vy: Math.random() * -11 - 4,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    life: 0,
  }));
  const start = performance.now();
  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.vy += 0.25;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.life = elapsed / 3200;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.globalAlpha = Math.max(0, 1 - p.life);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    });
    if (elapsed < 3200) requestAnimationFrame(frame);
    else { window.removeEventListener('resize', resize); canvas.remove(); }
  }
  requestAnimationFrame(frame);
}

// =============== APP ===============
export function App() {
  // -------- core state --------
  const [lang, setLang] = useState<Lang | null>(() => (localStorage.getItem('lang') as Lang) || null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [view, setView] = useState<View>('lang');

  // Setup form state
  const [provider, setProvider] = useState<ProviderId>(() => (localStorage.getItem('provider') as ProviderId) || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem('system_prompt') || DEFAULT_SYSTEM_PROMPT);
  const [topic, setTopic] = useState(() => localStorage.getItem('topic') || '');
  const [audience, setAudience] = useState(() => localStorage.getItem('audience') || '');
  const [researchGoal, setResearchGoal] = useState(() => localStorage.getItem('researchGoal') || '');
  const [painPoints, setPainPoints] = useState(() => localStorage.getItem('painPoints') || '');
  const [region, setRegion] = useState(() => localStorage.getItem('region') || '');

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyValidation, setApiKeyValidation] = useState<{ text: string; kind: '' | 'ok' | 'err' }>({ text: '', kind: '' });
  const [keyValidated, setKeyValidated] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Chat state
  const [history, setHistory] = useState<HistoryMsg[]>([]);
  const [coreQuestionsAsked, setCoreQuestionsAsked] = useState(0);
  const [followUpsForCurrent, setFollowUpsForCurrent] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typing, setTyping] = useState(false);
  const [closingPhase, setClosingPhase] = useState<ClosingPhase>(null);
  const [contactConsent, setContactConsent] = useState<'yes' | 'no' | null>(null);
  const [contactChannel, setContactChannel] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [quitEarly, setQuitEarly] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  // Chip UI state
  const [chipQuestion, setChipQuestion] = useState<{ chips: { label: string; value: string }[]; onPick: (value: string, label: string) => void } | null>(null);
  const [otherInputOpen, setOtherInputOpen] = useState(false);
  const [otherInputValue, setOtherInputValue] = useState('');
  const otherOnSubmitRef = useRef<((val: string) => void) | null>(null);

  // Summary state
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Modals & panels
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemPromptDraft, setSystemPromptDraft] = useState(systemPrompt);
  const [newConfirmOpen, setNewConfirmOpen] = useState(false);
  const [quitModalOpen, setQuitModalOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [resumeBannerVisible, setResumeBannerVisible] = useState(false);

  // Voice
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Refs
  const messagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const autoScrollRef = useRef(true);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const t = useMemo(() => createT(lang || 'en'), [lang]);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const progressPct = closingPhase ? 100 : Math.min(100, Math.round((coreQuestionsAsked / TOTAL_CORE_QUESTIONS) * 100));
  const progressLabel =
    complete ? t('interviewComplete')
    : closingPhase ? t('closingPhase')
    : coreQuestionsAsked === 0 ? t('gettingStarted')
    : t('coreOf', Math.min(coreQuestionsAsked, TOTAL_CORE_QUESTIONS), TOTAL_CORE_QUESTIONS);

  // =============== THEME + LANG EFFECTS ===============
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (lang) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('lang', lang);
    }
  }, [lang]);

  // =============== INIT ===============
  useEffect(() => {
    // Initial view
    if (lang) setView('setup');
    else setView('lang');

    // Initial key validation — if we have a stored key AND the stored provider is not demo
    const p = PROVIDERS[provider];
    if (p.isLocal) {
      setKeyValidated(true);
      setApiKeyValidation({ text: '✓ Demo mode — no API key required', kind: 'ok' });
    } else if (apiKey && apiKey.trim().length >= 20) {
      setKeyValidated(true);
      setApiKeyValidation({ text: t('looksValid'), kind: 'ok' });
    }

    // Check for resumable session
    const persisted = loadPersistedSession();
    if (persisted) setResumeBannerVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============== PERSIST SETUP FIELDS ===============
  useEffect(() => { localStorage.setItem('provider', provider); }, [provider]);
  useEffect(() => { localStorage.setItem('system_prompt', systemPrompt); }, [systemPrompt]);
  useEffect(() => { localStorage.setItem('topic', topic); }, [topic]);
  useEffect(() => { localStorage.setItem('audience', audience); }, [audience]);
  useEffect(() => { localStorage.setItem('researchGoal', researchGoal); }, [researchGoal]);
  useEffect(() => { localStorage.setItem('painPoints', painPoints); }, [painPoints]);
  useEffect(() => { localStorage.setItem('region', region); }, [region]);

  // =============== PERSIST SESSION ===============
  const persistSession = useCallback(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      try {
        const data = {
          history, coreQuestionsAsked, followUpsForCurrent, closingPhase,
          contactConsent, contactChannel, topic, audience, researchGoal,
          painPoints, region, lang, sessionStart, complete, quitEarly,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      } catch (_) { /* ignore */ }
    }, 300);
  }, [history, coreQuestionsAsked, followUpsForCurrent, closingPhase, contactConsent, contactChannel, topic, audience, researchGoal, painPoints, region, lang, sessionStart, complete, quitEarly]);

  const clearPersistedSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  function loadPersistedSession(): any {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.history) || data.history.length === 0) return null;
      if (data.complete && data.closingPhase === 'done') return null;
      return data;
    } catch (_) { return null; }
  }

  useEffect(() => {
    // Auto-persist whenever anything interview-related changes
    if (sessionStart !== null) persistSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, coreQuestionsAsked, followUpsForCurrent, closingPhase, contactConsent, contactChannel, complete, quitEarly, sessionStart]);

  // =============== AUTO-SCROLL MESSAGES ===============
  useLayoutEffect(() => {
    if (autoScrollRef.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [history, typing]);

  // =============== PROVIDER CHANGE ===============
  const handleProviderChange = (next: ProviderId) => {
    setProvider(next);
    const p = PROVIDERS[next];
    if (p.isLocal) {
      setKeyValidated(true);
      setApiKeyValidation({ text: '✓ Demo mode — no API key required', kind: 'ok' });
    } else {
      setKeyValidated(false);
      setApiKeyValidation({ text: '', kind: '' });
    }
  };

  // =============== KEY VALIDATION ===============
  const handleKeyBlur = () => {
    const p = PROVIDERS[provider];
    if (p.isLocal) return;
    const v = apiKey.trim();
    if (!v) {
      setApiKeyValidation({ text: '', kind: '' });
      setKeyValidated(false);
    } else if (v.length >= 20) {
      setApiKeyValidation({ text: t('looksValid'), kind: 'ok' });
      setKeyValidated(true);
      localStorage.setItem('gemini_api_key', v);
    } else {
      setApiKeyValidation({ text: t('keyTooShort'), kind: 'err' });
      setKeyValidated(false);
    }
  };

  const handleTestConnection = async () => {
    const p = PROVIDERS[provider];
    if (p.isLocal) {
      setApiKeyValidation({ text: '✓ Demo mode ready', kind: 'ok' });
      setKeyValidated(true);
      return;
    }
    const k = apiKey.trim();
    if (!k) {
      setApiKeyValidation({ text: t('enterKeyFirst'), kind: 'err' });
      return;
    }
    setTestingConnection(true);
    try {
      const { url, headers, body } = p.buildTestRequest!(k);
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      if (res.ok) {
        setApiKeyValidation({ text: t('connectionOk'), kind: 'ok' });
        setKeyValidated(true);
        localStorage.setItem('gemini_api_key', k);
      } else {
        const e = await res.json().catch(() => ({}));
        setApiKeyValidation({ text: '✗ ' + (p.extractError!(e) || 'Connection failed'), kind: 'err' });
        setKeyValidated(false);
      }
    } catch (_err) {
      setApiKeyValidation({ text: '✗ Network error', kind: 'err' });
      setKeyValidated(false);
    }
    setTestingConnection(false);
  };

  // =============== CHAT LOGIC ===============
  const callCtx = useMemo(() => ({
    providerId: provider,
    apiKey,
    systemText: buildSystemInstruction({ systemPrompt, topic, audience, researchGoal, painPoints, region, lang: lang || 'en' }),
    topic,
  }), [provider, apiKey, systemPrompt, topic, audience, researchGoal, painPoints, region, lang]);

  const appendModel = useCallback((text: string, closing = false) => {
    const ts = Date.now();
    setHistory(h => [...h, { role: 'model', text, ts, closing }]);
  }, []);
  const appendUser = useCallback((text: string, closing = false) => {
    const ts = Date.now();
    setHistory(h => [...h, { role: 'user', text, ts, closing }]);
  }, []);

  const beginInterview = useCallback(async () => {
    setIsGenerating(true);
    setTyping(true);
    try {
      const seed: HistoryMsg[] = [{ role: 'user', text: 'Please begin the interview now with a brief friendly intro and your first core question. Reply as the JSON schema with action "next_core".', ts: Date.now() }];
      const { parsed, raw } = await getStructuredTurn(callCtx, seed);
      setTyping(false);
      const text = parsed ? parsed.message : stripControlTokens(raw);
      appendModel(text);
      setCoreQuestionsAsked(1);
      setFollowUpsForCurrent(0);
    } catch (err: any) {
      setTyping(false);
      appendModel(t('somethingWrong') + '\n\n' + (err?.message || String(err)));
      console.error(err);
    }
    setIsGenerating(false);
  }, [callCtx, appendModel, t]);

  const startClosingQ1 = useCallback(() => {
    setClosingPhase('q1');
    appendModel(t('closingQ1'), true);
  }, [appendModel, t]);

  const startClosingQ2Consent = useCallback(() => {
    setClosingPhase('q2_consent');
    appendModel(t('closingQ2Consent'), true);
    setChipQuestion({
      chips: [{ label: t('chipYes'), value: 'yes' }, { label: t('chipNo'), value: 'no' }],
      onPick: (val) => {
        setContactConsent(val as 'yes' | 'no');
        setChipQuestion(null);
        if (val === 'no') {
          finishClosing();
        } else {
          startClosingQ2Channel();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendModel, t]);

  const startClosingQ2Channel = useCallback(() => {
    setClosingPhase('q2_channel');
    appendModel(t('closingQ2Channel'), true);
    setChipQuestion({
      chips: [
        { label: t('chipEmail'), value: 'email' },
        { label: t('chipPhone'), value: 'phone' },
        { label: t('chipWhatsApp'), value: 'whatsapp' },
        { label: t('chipOther'), value: 'other' },
      ],
      onPick: (val, label) => {
        setChipQuestion(null);
        if (val === 'other') {
          setOtherInputOpen(true);
          otherOnSubmitRef.current = (customVal: string) => {
            setContactChannel(customVal);
            finishClosing();
          };
        } else {
          setContactChannel(label);
          finishClosing();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendModel, t]);

  const finishClosing = useCallback(() => {
    setClosingPhase('done');
    setComplete(true);
  }, []);

  const handleChipPick = (value: string, label: string) => {
    appendUser(label, true);
    chipQuestion?.onPick(value, label);
  };

  const handleOtherSubmit = () => {
    const v = otherInputValue.trim();
    if (!v) return;
    appendUser(v, true);
    setOtherInputValue('');
    setOtherInputOpen(false);
    if (otherOnSubmitRef.current) otherOnSubmitRef.current(v);
    otherOnSubmitRef.current = null;
  };

  const sendUserMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || isGenerating || complete) return;
    appendUser(text, !!closingPhase);
    setDraft('');

    // Closing q1 (free text) → advance to q2_consent
    if (closingPhase === 'q1') {
      setTimeout(() => startClosingQ2Consent(), 120);
      return;
    }

    setIsGenerating(true);
    setTyping(true);
    try {
      const apiHistory: HistoryMsg[] = [...history, { role: 'user', text, ts: Date.now() }]
        .filter(m => !m.closing)
        .map(m => ({ role: m.role, text: m.text, ts: m.ts }));
      const { parsed, raw } = await getStructuredTurn(callCtx, apiHistory);
      setTyping(false);

      let action = parsed?.action;
      const messageText = parsed ? parsed.message : stripControlTokens(raw);

      // Hard cap on follow-ups
      if (action === 'follow_up' && followUpsForCurrent >= 2) action = 'next_core';

      if (action === 'follow_up') {
        setFollowUpsForCurrent(n => n + 1);
      } else if (action === 'next_core') {
        setCoreQuestionsAsked(n => Math.min(TOTAL_CORE_QUESTIONS, n + 1));
        setFollowUpsForCurrent(0);
      }

      appendModel(messageText);

      if (action === 'complete') {
        setIsGenerating(false);
        setTimeout(() => startClosingQ1(), 500);
        return;
      }
    } catch (err: any) {
      setTyping(false);
      appendModel(t('somethingWrong') + '\n\n' + (err?.message || String(err)));
      console.error(err);
    }
    setIsGenerating(false);
  }, [draft, isGenerating, complete, closingPhase, history, callCtx, followUpsForCurrent, appendUser, appendModel, startClosingQ2Consent, startClosingQ1, t]);

  // =============== SUBMIT INTERVIEW ===============
  const submitInterview = useCallback(async () => {
    setIsGenerating(true);
    setView('thankyou');
    launchConfetti();
    setTimeout(() => generateSummary(), 10000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============== SUMMARY GENERATION ===============
  const generateSummary = useCallback(async () => {
    setView('summary');
    setGeneratingSummary(true);
    setSummaryError(null);

    const userTurns = history.filter(m => m.role === 'user' && !m.closing).length;
    if (userTurns < 1) {
      setSummary({ themes: [], quotes: [], insights: ['Interview ended early — insufficient data for analysis.'] });
      setGeneratingSummary(false);
      clearPersistedSession();
      return;
    }

    const transcript = history.filter(m => !m.closing)
      .map(m => `${m.role === 'model' ? 'Interviewer' : 'Participant'}: ${m.text}`)
      .join('\n\n');
    const langInstr = lang === 'ar' ? '\n\nIMPORTANT: All themes, quote contexts, and insights must be written in Arabic.' : '';
    const prompt = `Analyze this user interview transcript and produce a JSON object with this exact shape:
{
  "themes": ["theme 1", "theme 2", ...],
  "quotes": [{"context": "the question that prompted this", "quote": "verbatim user quote"}, ...],
  "insights": ["insight 1", "insight 2", ...]
}
Provide 3-5 themes, 3-5 notable quotes, and 3-5 actionable insights for a research/product team.
Output ONLY the JSON object, no markdown fences.${langInstr}

Transcript:
${transcript}`;

    try {
      const result = await generateSummaryCall(callCtx, prompt);
      setSummary(result);
    } catch (err: any) {
      console.error('Summary generation failed:', err);
      setSummaryError(err?.message || String(err));
      setSummary({ themes: [], quotes: [], insights: [] });
    }
    setGeneratingSummary(false);
    clearPersistedSession();
  }, [history, lang, callCtx, clearPersistedSession]);

  // =============== START INTERVIEW ===============
  const startInterview = useCallback(() => {
    setHistory([]);
    setCoreQuestionsAsked(0);
    setFollowUpsForCurrent(0);
    setComplete(false);
    setClosingPhase(null);
    setContactConsent(null);
    setContactChannel(null);
    setQuitEarly(false);
    setSummary(null);
    setSummaryError(null);
    setSessionStart(Date.now());
    setChipQuestion(null);
    setOtherInputOpen(false);
    setDraft('');
    clearPersistedSession();
    setView('welcome');
  }, [clearPersistedSession]);

  const resetAll = useCallback(() => {
    setHistory([]);
    setCoreQuestionsAsked(0);
    setFollowUpsForCurrent(0);
    setComplete(false);
    setClosingPhase(null);
    setContactConsent(null);
    setContactChannel(null);
    setQuitEarly(false);
    setSummary(null);
    setChipQuestion(null);
    setOtherInputOpen(false);
    setSessionStart(null);
    setDraft('');
    clearPersistedSession();
    setView('setup');
  }, [clearPersistedSession]);

  // =============== QUIT ===============
  const handleQuitConfirm = useCallback(() => {
    setQuitModalOpen(false);
    setQuitEarly(true);
    setComplete(true);
    generateSummary();
  }, [generateSummary]);

  // =============== RESUME ===============
  const handleResume = useCallback(() => {
    const data = loadPersistedSession();
    if (!data) { setResumeBannerVisible(false); return; }
    setHistory(data.history || []);
    setCoreQuestionsAsked(data.coreQuestionsAsked || 0);
    setFollowUpsForCurrent(data.followUpsForCurrent || 0);
    setClosingPhase(data.closingPhase || null);
    setContactConsent(data.contactConsent || null);
    setContactChannel(data.contactChannel || null);
    setTopic(data.topic || '');
    setAudience(data.audience || '');
    setResearchGoal(data.researchGoal || '');
    setPainPoints(data.painPoints || '');
    setRegion(data.region || '');
    setSessionStart(data.sessionStart || Date.now());
    setComplete(!!data.complete);
    setQuitEarly(!!data.quitEarly);
    setResumeBannerVisible(false);
    setView('chat');
  }, []);

  // =============== VOICE ===============
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const voiceSupported = !!SR;

  const toggleVoice = useCallback(() => {
    if (!SR) return;
    if (recognizing) {
      recognitionRef.current?.stop();
      return;
    }
    try {
      const recognition = new SR();
      recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      const baseText = draft;
      recognition.onstart = () => setRecognizing(true);
      recognition.onresult = (evt: any) => {
        let interim = '';
        let finalText = '';
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          const r = evt.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        setDraft((baseText + (baseText ? ' ' : '') + finalText + interim).trim());
      };
      recognition.onerror = (e: any) => console.warn('speech error', e);
      recognition.onend = () => setRecognizing(false);
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) { console.warn('Speech recognition unavailable', e); }
  }, [SR, recognizing, lang, draft]);

  // =============== EXPORTS ===============
  const getClosingResponses = useCallback(() => {
    const out: { question: string | null; answer: string }[] = [];
    let lastModelClosing: string | null = null;
    history.forEach(m => {
      if (m.closing && m.role === 'model') lastModelClosing = m.text;
      else if (m.closing && m.role === 'user') {
        out.push({ question: lastModelClosing, answer: m.text });
        lastModelClosing = null;
      }
    });
    return out;
  }, [history]);

  const escapeHtml = (s: string) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

  const summaryAsMarkdown = useCallback(() => {
    const s = summary || { themes: [], quotes: [], insights: [] };
    const closing = getClosingResponses();
    let md = `# ${t('summaryTitle')}\n\n`;
    if (quitEarly) md += `> ${t('earlyBanner')}\n\n`;
    md += `## ${t('keyThemes')}\n${(s.themes || []).map(x => `- ${x}`).join('\n')}\n\n## ${t('notableQuotes')}\n`;
    (s.quotes || []).forEach(q => { md += `> "${q.quote}"\n> — *${t('inResponseTo')}: ${q.context}*\n\n`; });
    md += `## ${t('actionableInsights')}\n${(s.insights || []).map(i => `- ${i}`).join('\n')}\n\n`;
    if (closing.length) {
      md += `## ${t('closingResponses')}\n`;
      closing.forEach(c => { md += `**${c.question}**\n${c.answer}\n\n`; });
    }
    md += `## ${t('fullTranscript')}\n`;
    history.forEach(m => { md += `**${m.role === 'model' ? t('interviewer') : t('participant')}** (${fmtTime(m.ts)}): ${m.text}\n\n`; });
    return md;
  }, [summary, history, quitEarly, t, getClosingResponses]);

  const summaryAsText = useCallback(() => {
    const s = summary || { themes: [], quotes: [], insights: [] };
    let r = t('summaryTitle').toUpperCase() + '\n\n' + t('keyThemes') + ':\n' + (s.themes || []).map(x => '- ' + x).join('\n');
    r += '\n\n' + t('notableQuotes') + ':\n' + (s.quotes || []).map(q => `"${q.quote}" (${t('inResponseTo')}: ${q.context})`).join('\n');
    r += '\n\n' + t('actionableInsights') + ':\n' + (s.insights || []).map(x => '- ' + x).join('\n');
    return r;
  }, [summary, t]);

  const downloadBlob = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(summaryAsText());
  };

  const handleDownloadMd = () => downloadBlob('interview-summary.md', summaryAsMarkdown(), 'text/markdown');
  const handleDownloadJson = () => {
    const data = {
      topic, audience, researchGoal, painPoints, region, lang,
      endedEarly: quitEarly, contactConsent, contactChannel,
      summary, closingResponses: getClosingResponses(), transcript: history,
    };
    downloadBlob('interview-summary.json', JSON.stringify(data, null, 2), 'application/json');
  };
  const handleDownloadPdf = () => {
    const s = summary || { themes: [], quotes: [], insights: [] };
    const closing = getClosingResponses();
    const d = lang === 'ar' ? 'rtl' : 'ltr';
    const html = `<!DOCTYPE html><html dir="${d}"><head><meta charset="UTF-8"><title>${t('summaryTitle')}</title>
<style>
  body { font-family: "Inter", -apple-system, system-ui, sans-serif; max-width: 720px; margin: 24px auto; padding: 0 16px; color: #111; background: white; line-height: 1.6; }
  h1 { font-size: 28px; margin-bottom: 4px; letter-spacing: -0.02em; }
  h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 16px; }
  .quote { border-${d === 'rtl' ? 'right' : 'left'}: 3px solid #7C6FF7; padding: 8px 14px; margin: 10px 0; background: #f6f5ff; border-radius: 6px; }
  .quote .ctx { color: #666; font-size: 12px; margin-bottom: 4px; }
  .banner { background: #fff4dc; border: 1px solid #F5A623; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; }
  .tx { padding: 6px 0; border-bottom: 1px solid #eee; }
  .tx .role { font-weight: 600; font-size: 12px; color: #666; }
  ul { padding-${d === 'rtl' ? 'right' : 'left'}: 20px; }
  @media print { body { margin: 0; } h2 { page-break-after: avoid; } }
</style></head><body>
${quitEarly ? `<div class="banner">${t('earlyBanner')}</div>` : ''}
<h1>${t('summaryTitle')}</h1>
<div class="meta">${escapeHtml(topic || '')}${audience ? ' · ' + escapeHtml(audience) : ''}</div>
<h2>${t('keyThemes')}</h2><ul>${(s.themes || []).map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
<h2>${t('notableQuotes')}</h2>
${(s.quotes || []).map(q => `<div class="quote"><div class="ctx">${t('inResponseTo')}: "${escapeHtml(q.context || '')}"</div>"${escapeHtml(q.quote || '')}"</div>`).join('')}
<h2>${t('actionableInsights')}</h2><ul>${(s.insights || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
${closing.length ? `<h2>${t('closingResponses')}</h2>${closing.map(c => `<div class="quote"><div class="ctx">${escapeHtml(c.question || '')}</div>${escapeHtml(c.answer || '—')}</div>`).join('')}` : ''}
<h2>${t('fullTranscript')}</h2>
${history.map(m => `<div class="tx"><div class="role">${m.role === 'model' ? t('interviewer') : t('participant')} · ${fmtTime(m.ts)}</div>${escapeHtml(m.text)}</div>`).join('')}
<script>window.onload=()=>{setTimeout(()=>window.print(),300);};<\/script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow popups for PDF export.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  // =============== ANALYTICS ===============
  const analytics = useMemo(() => {
    const userAnswers = history.filter(m => m.role === 'user' && !m.closing);
    const totalAnswers = userAnswers.length;
    const avgLen = totalAnswers ? Math.round(userAnswers.reduce((a, m) => a + m.text.length, 0) / totalAnswers) : 0;
    const durationMs = sessionStart ? (Date.now() - sessionStart) : 0;
    const durationMin = Math.round(durationMs / 60000);
    const followUps = Math.max(0, history.filter(m => m.role === 'model' && !m.closing).length - Math.max(1, coreQuestionsAsked));

    const maxLen = Math.max(...userAnswers.map(m => m.text.length), 1);
    const lenBars = userAnswers.map((m, i) => ({ idx: i + 1, len: m.text.length, pct: Math.round((m.text.length / maxLen) * 100) }));

    const words = userAnswers.map(m => m.text.toLowerCase()).join(' ')
      .replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(w => w && w.length > 2 && !STOPWORDS.has(w));
    const freq: Record<string, number> = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const maxFreq = top.length ? top[0][1] : 1;
    const keywords = top.map(([w, c]) => ({ word: w, count: c, scale: 0.85 + (c / maxFreq) * 0.6 }));

    return { totalAnswers, avgLen, durationMin, followUps, lenBars, keywords };
  }, [history, coreQuestionsAsked, sessionStart]);

  // =============== RENDER ===============
  const showTopbar = view !== 'lang' || lang !== null;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-emblem">
            <svg viewBox="0 0 24 24">
              <path d="M7 11a5 5 0 0 1 10 0v3l2 3H5l2-3v-3z" fill="white" />
            </svg>
          </div>
          <span className="brand-label">AI Interviewer</span>
        </div>
        <div className="row">
          {view === 'chat' && (
            <button className="icon-btn danger" onClick={() => setQuitModalOpen(true)} aria-label={t('quit')}>
              ✕ {t('quit')}
            </button>
          )}
          {view === 'chat' && (
            <button className="icon-btn" onClick={() => { setSystemPromptDraft(systemPrompt); setSettingsOpen(true); }} aria-label={t('settings')}>
              ⚙ {t('settings')}
            </button>
          )}
          {view !== 'lang' && (
            <button className="icon-btn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="Change language">
              🌐 {lang === 'ar' ? 'AR' : 'EN'}
            </button>
          )}
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode">
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </div>
      </div>

      {/* LANG VIEW */}
      {view === 'lang' && (
        <div className="container view-in">
          <div className="card lang-card">
            <div className="dual-title">
              <span>{I18N.en.chooseYourLanguage as string}</span>
              <span dir="rtl">{I18N.ar.chooseYourLanguage as string}</span>
            </div>
            <div className="lang-buttons">
              <button className="lang-btn" onClick={() => { setLang('en'); setView('setup'); }}>English</button>
              <button className="lang-btn" onClick={() => { setLang('ar'); setView('setup'); }}>العربية</button>
            </div>
          </div>
        </div>
      )}

      {/* SETUP VIEW */}
      {view === 'setup' && (
        <div className="container view-in">
          {resumeBannerVisible && (
            <div className="resume-banner">
              <div className="text">
                <h3>{t('resumeTitle')}</h3>
                <p>{t('resumeBody')}</p>
              </div>
              <div className="actions">
                <button className="btn btn-secondary" onClick={() => setDiscardModalOpen(true)}>{t('resumeDiscard')}</button>
                <button className="btn" onClick={handleResume}>{t('resumeYes')}</button>
              </div>
            </div>
          )}
          <div className="card">
            <h1>{t('setupTitle')}</h1>
            <p className="subtitle">{t('setupSub')}</p>

            <div className="field">
              <label htmlFor="provider">{t('providerLabel')}</label>
              <select id="provider" value={provider} onChange={e => handleProviderChange(e.target.value as ProviderId)}>
                <option value="gemini">Google Gemini (gemini-2.5-flash)</option>
                <option value="openai">OpenAI (gpt-4o-mini)</option>
                <option value="mock">Demo mode (no API key needed)</option>
              </select>
              <div className="helper">{t('providerHelp')}</div>
            </div>

            <div className="field">
              <label htmlFor="apiKey">{t('apiKeyLabel')}</label>
              <div className="input-row">
                <input
                  id="apiKey"
                  type={apiKeyVisible ? 'text' : 'password'}
                  autoComplete="off"
                  placeholder={PROVIDERS[provider].keyPlaceholder}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onBlur={handleKeyBlur}
                  disabled={PROVIDERS[provider].isLocal}
                />
                <button type="button" className="toggle" onClick={() => setApiKeyVisible(v => !v)}>{apiKeyVisible ? 'HIDE' : 'SHOW'}</button>
              </div>
              <div className={`validation ${apiKeyValidation.kind}`}>{apiKeyValidation.text}</div>
              <div className="helper">{t('apiKeyHelp')}</div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={handleTestConnection} disabled={testingConnection}>
                  {testingConnection ? '…' : t('testConn')}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="topic">{t('topicLabel')}</label>
              <input id="topic" type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('topicPH')} />
              <div className="helper">{t('topicHelp')}</div>
            </div>

            <div className="field">
              <label htmlFor="audience">{t('audienceLabel')}</label>
              <input id="audience" type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder={t('audiencePH')} />
              <div className="helper">{t('audienceHelp')}</div>
            </div>

            <div className="field">
              <label htmlFor="researchGoal">{t('goalLabel')}</label>
              <input id="researchGoal" type="text" value={researchGoal} onChange={e => setResearchGoal(e.target.value)} placeholder={t('goalPH')} />
              <div className="helper">{t('goalHelp')}</div>
            </div>

            <div className="field">
              <label htmlFor="painPoints">{t('painLabel')}</label>
              <input id="painPoints" type="text" value={painPoints} onChange={e => setPainPoints(e.target.value)} placeholder={t('painPH')} />
              <div className="helper">{t('painHelp')}</div>
            </div>

            <div className="field">
              <label htmlFor="region">{t('regionLabel')}</label>
              <input id="region" type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder={t('regionPH')} />
              <div className="helper">{t('regionHelp')}</div>
            </div>

            <details className="disclosure">
              <summary>{t('advanced')}</summary>
              <div className="disclosure-body">
                <label htmlFor="systemPrompt">{t('sysPromptLabel')}</label>
                <textarea id="systemPrompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
                <div className="char-counter"><span>{systemPrompt.length}</span> <span>{t('characters')}</span></div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}>{t('resetDefault')}</button>
                </div>
                <div className="helper">{t('sysPromptHelp')}</div>
              </div>
            </details>

            <button className="btn" onClick={startInterview} disabled={!keyValidated}>{t('startInterview')}</button>
          </div>
        </div>
      )}

      {/* WELCOME VIEW */}
      {view === 'welcome' && (
        <div className="container view-in">
          <div className="card center-card">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <span className="eyebrow">{t('eyebrowWelcome')}</span>
            <h1>{t('welcomeTitle')}</h1>
            <div className="lines">
              <p dangerouslySetInnerHTML={{ __html: t('welcomeLine1', topic) }} />
              <p>{t('welcomeLine2')}</p>
              <p>{t('welcomeLine3')}</p>
            </div>
            <button className="btn" onClick={() => { setView('chat'); beginInterview(); }}>{t('beginInterview')}</button>
          </div>
        </div>
      )}

      {/* CHAT VIEW */}
      {view === 'chat' && (
        <div className="chat-wrap view-in">
          <div className="chat-header">
            <div className="title">{t('chatHeader')}</div>
            <div className="progress">
              <div className="progress-label">{progressLabel}</div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
            </div>
            <div />
          </div>
          <div
            className="messages"
            ref={messagesRef}
            onScroll={() => {
              if (messagesRef.current) {
                const el = messagesRef.current;
                autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
              }
            }}
          >
            {history.map((m, i) => (
              <div key={i} className={`msg ${m.role === 'model' ? 'ai' : 'user'}`}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="bubble">{m.text}</div>
                  <div className="time">{fmtTime(m.ts)}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="msg ai typing">
                <div className="bubble"><span className="dot" /><span className="dot" /><span className="dot" /></div>
              </div>
            )}
          </div>
          <div className="input-area">
            {closingPhase !== 'done' && !chipQuestion && !otherInputOpen && (
              <>
                <div className="input-row-chat">
                  {voiceSupported && (
                    <button
                      type="button"
                      className={`mic-btn ${recognizing ? 'recording' : ''}`}
                      onClick={toggleVoice}
                      aria-label="Toggle voice input"
                      aria-pressed={recognizing}
                      title={recognizing ? t('micListening') : t('micStart')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                  <textarea
                    ref={chatInputRef}
                    rows={1}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendUserMessage();
                      }
                    }}
                    placeholder={t('typeAnswer')}
                    aria-label="Your answer"
                    disabled={isGenerating}
                  />
                  <button className="btn" onClick={sendUserMessage} disabled={isGenerating} aria-label={t('send')}>{t('send')}</button>
                </div>
                <div className="keyhint">{t('keyhint')}</div>
              </>
            )}

            {chipQuestion && (
              <div className="chip-area">
                <div className="chip-row">
                  {chipQuestion.chips.map((c, i) => (
                    <button key={i} type="button" className="chip" onClick={() => handleChipPick(c.value, c.label)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {otherInputOpen && (
              <div className="chip-area">
                <div className="chip-other-input">
                  <input
                    type="text"
                    placeholder={t('otherPlaceholder')}
                    value={otherInputValue}
                    onChange={e => setOtherInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleOtherSubmit(); }}
                    autoFocus
                  />
                  <button className="btn" onClick={handleOtherSubmit}>{t('otherSend')}</button>
                </div>
              </div>
            )}

            {closingPhase === 'done' && (
              <div className="submit-area">
                <p>{t('submitHint')}</p>
                <button className="btn" onClick={submitInterview} disabled={isGenerating}>{t('submitInterview')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THANK-YOU VIEW */}
      {view === 'thankyou' && (
        <div className="container view-in">
          <div className="card center-card">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="check-icon">
              <svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 7" /></svg>
            </div>
            <span className="eyebrow">{t('eyebrowThankYou')}</span>
            <h1>{t('thankYouTitle')}</h1>
            <div className="lines">
              <p>{t('thanks1')}</p>
              <p>{t('thanks2')}</p>
              <p>{t('thanks3')}</p>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY VIEW */}
      {view === 'summary' && (
        <div className="container view-in">
          <div className="card">
            {quitEarly && <div className="early-banner">{t('earlyBanner')}</div>}
            <h1>{t('summaryTitle')}</h1>
            <p className="subtitle">{t('summarySub')}</p>
            {generatingSummary ? (
              <p style={{ color: 'var(--muted)' }}>{t('summaryGenerating')}</p>
            ) : summaryError ? (
              <p style={{ color: 'var(--error)', padding: 16, background: 'rgba(224,90,90,0.08)', borderRadius: 12, border: '1px solid var(--error)' }}>
                {t('summaryError')}
                <br />
                <small style={{ color: 'var(--muted)' }}>{summaryError}</small>
              </p>
            ) : summary && (
              <>
                <div className="summary-section">
                  <h2>{t('keyThemes')}</h2>
                  <ul>{summary.themes.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
                <div className="summary-section">
                  <h2>{t('notableQuotes')}</h2>
                  {summary.quotes.map((q, i) => (
                    <div className="quote" key={i}>
                      <div className="q-context">{t('inResponseTo')}: "{q.context}"</div>
                      <div>"{q.quote}"</div>
                    </div>
                  ))}
                </div>
                <div className="summary-section">
                  <h2>{t('actionableInsights')}</h2>
                  <ul>{summary.insights.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
                {getClosingResponses().length > 0 && (
                  <div className="summary-section">
                    <h2>{t('closingResponses')}</h2>
                    {getClosingResponses().map((c, i) => (
                      <div className="quote" key={i}>
                        <div className="q-context">{c.question || ''}</div>
                        <div>{c.answer || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <details className="analytics">
              <summary>📊 <span>{t('analyticsTitle')}</span></summary>
              <div style={{ marginTop: 12 }}>
                <div className="stats-grid">
                  <div className="stat-box"><div className="stat-value">{analytics.totalAnswers}</div><div className="stat-label">{t('statAnswers')}</div></div>
                  <div className="stat-box"><div className="stat-value">{analytics.avgLen}</div><div className="stat-label">{t('statAvgLen')}</div></div>
                  <div className="stat-box"><div className="stat-value">{analytics.durationMin}m</div><div className="stat-label">{t('statDuration')}</div></div>
                  <div className="stat-box"><div className="stat-value">{analytics.followUps}</div><div className="stat-label">{t('statFollowups')}</div></div>
                </div>
                <h3>{t('responseLengths')}</h3>
                {analytics.lenBars.length ? analytics.lenBars.map(r => (
                  <div className="len-bar" key={r.idx}>
                    <span style={{ minWidth: 28 }}>#{r.idx}</span>
                    <div className="bar"><div className="fill" style={{ width: `${r.pct}%` }} /></div>
                    <span>{r.len}</span>
                  </div>
                )) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>—</p>}
                <h3 style={{ marginTop: 20 }}>{t('topKeywords')}</h3>
                <div className="keyword-cloud">
                  {analytics.keywords.length ? analytics.keywords.map((k, i) => (
                    <span key={i} className="kw" style={{ fontSize: Math.round(k.scale * 14) }}>
                      {k.word} <span style={{ opacity: 0.6 }}>{k.count}</span>
                    </span>
                  )) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>—</p>}
                </div>
              </div>
            </details>

            <details className="transcript">
              <summary><strong>{t('fullTranscript')}</strong></summary>
              <div style={{ marginTop: 12 }}>
                {history.map((m, i) => (
                  <div className="transcript-msg" key={i}>
                    <div className="role">{m.role === 'model' ? t('interviewer') : t('participant')} · {fmtTime(m.ts)}</div>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>
            </details>

            <div className="row" style={{ marginTop: 28 }}>
              <button className="btn" onClick={handleCopySummary}>{t('copyClipboard')}</button>
              <button className="btn btn-secondary" onClick={handleDownloadMd}>{t('downloadMd')}</button>
              <button className="btn btn-secondary" onClick={handleDownloadJson}>{t('downloadJson')}</button>
              <button className="btn btn-secondary" onClick={handleDownloadPdf}>{t('downloadPdf')}</button>
              <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setNewConfirmOpen(true)}>{t('startNew')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings side panel */}
      {settingsOpen && (
        <div className="panel-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="side-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t('editSysPrompt')}</h2>
            <textarea value={systemPromptDraft} onChange={e => setSystemPromptDraft(e.target.value)} style={{ minHeight: 300 }} />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => { setSystemPrompt(systemPromptDraft); setSettingsOpen(false); }}>{t('save')}</button>
              <button className="btn btn-secondary" onClick={() => setSettingsOpen(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* New interview confirm */}
      {newConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginTop: 0 }}>{t('newConfirmTitle')}</h2>
            <p style={{ color: 'var(--muted-strong)' }}>{t('newConfirmBody')}</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setNewConfirmOpen(false)}>{t('cancel')}</button>
              <button className="btn" onClick={() => { setNewConfirmOpen(false); resetAll(); }}>{t('newConfirmYes')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Quit confirm */}
      {quitModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginTop: 0 }}>{t('quitTitle')}</h2>
            <p style={{ color: 'var(--muted-strong)' }}>{t('quitBody')}</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setQuitModalOpen(false)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleQuitConfirm}>{t('quitConfirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Discard confirm */}
      {discardModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginTop: 0 }}>{t('discardTitle')}</h2>
            <p style={{ color: 'var(--muted-strong)' }}>{t('discardBody')}</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDiscardModalOpen(false)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={() => { clearPersistedSession(); setDiscardModalOpen(false); setResumeBannerVisible(false); }}>{t('discardConfirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
