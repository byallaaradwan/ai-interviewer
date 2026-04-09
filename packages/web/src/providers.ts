// =============== TYPES ===============
export type ChatRole = 'user' | 'model';

export interface HistoryMsg {
  role: ChatRole;
  text: string;
  ts: number;
  closing?: boolean;
}

export interface TurnResult {
  message: string;
  action: 'follow_up' | 'next_core' | 'complete';
}

export interface SummaryResult {
  themes: string[];
  quotes: { context: string; quote: string }[];
  insights: string[];
}

// =============== SCHEMAS ===============
export const TURN_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    action: { type: "string", enum: ["follow_up", "next_core", "complete"] }
  },
  required: ["message", "action"]
};

export const TURN_SCHEMA_OPENAI = {
  type: "object",
  properties: {
    message: { type: "string" },
    action: { type: "string", enum: ["follow_up", "next_core", "complete"] }
  },
  required: ["message", "action"],
  additionalProperties: false
};

export const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    themes: { type: "array", items: { type: "string" } },
    quotes: {
      type: "array",
      items: {
        type: "object",
        properties: { context: { type: "string" }, quote: { type: "string" } },
        required: ["context", "quote"]
      }
    },
    insights: { type: "array", items: { type: "string" } }
  },
  required: ["themes", "quotes", "insights"]
};

// =============== PROVIDERS REGISTRY ===============
export type ProviderId = 'gemini' | 'openai' | 'mock';

interface ProviderDef {
  label: string;
  model: string;
  keyPlaceholder: string;
  isLocal?: boolean;
  buildTestRequest?: (key: string) => { url: string; headers: Record<string, string>; body: any };
  buildTurnRequest?: (key: string, systemText: string, history: HistoryMsg[], structured: boolean) => { url: string; headers: Record<string, string>; body: any };
  buildSummaryRequest?: (key: string, prompt: string, schema: any) => { url: string; headers: Record<string, string>; body: any };
  extractText?: (data: any) => string;
  extractError?: (data: any) => string | undefined;
  mockTurn?: (history: HistoryMsg[], topic: string) => string;
  mockSummary?: () => string;
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  gemini: {
    label: 'Google Gemini',
    model: 'gemini-2.5-flash',
    keyPlaceholder: 'AIza...',
    buildTestRequest: (key) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      headers: { 'Content-Type': 'application/json' },
      body: { contents: [{ role: 'user', parts: [{ text: 'Reply with just: ok' }] }] }
    }),
    buildTurnRequest: (key, systemText, history, structured) => {
      const generationConfig: any = {
        maxOutputTokens: 2048,
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 }
      };
      if (structured) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = TURN_SCHEMA;
      }
      const body = {
        systemInstruction: { parts: [{ text: systemText }] },
        contents: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig
      };
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
        headers: { 'Content-Type': 'application/json' },
        body
      };
    },
    buildSummaryRequest: (key, prompt, schema) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }
    }),
    extractText: (data) => {
      const cand = data.candidates?.[0];
      const text = cand?.content?.parts?.[0]?.text || '';
      if (!text) {
        const reason = cand?.finishReason;
        if (reason === 'MAX_TOKENS') throw new Error('Response hit the max-tokens limit. Try a shorter prompt.');
        if (reason === 'SAFETY') throw new Error('Response blocked by safety filter.');
        if (reason === 'RECITATION') throw new Error('Response blocked due to recitation.');
        if (data.promptFeedback?.blockReason) throw new Error('Prompt blocked: ' + data.promptFeedback.blockReason);
        throw new Error('Empty response from Gemini' + (reason ? ' (finishReason: ' + reason + ')' : ''));
      }
      return text;
    },
    extractError: (data) => data.error?.message
  },
  openai: {
    label: 'OpenAI',
    model: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    buildTestRequest: (key) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Reply with just: ok' }], max_tokens: 5 }
    }),
    buildTurnRequest: (key, systemText, history, structured) => {
      const messages: any[] = [{ role: 'system', content: systemText }];
      history.forEach(m => messages.push({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
      const body: any = { model: 'gpt-4o-mini', messages };
      if (structured) {
        body.response_format = {
          type: 'json_schema',
          json_schema: { name: 'interview_turn', strict: true, schema: TURN_SCHEMA_OPENAI }
        };
      }
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body
      };
    },
    buildSummaryRequest: (key, prompt, _schema) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }
    }),
    extractText: (data) => data.choices?.[0]?.message?.content || '',
    extractError: (data) => data.error?.message
  },
  mock: {
    label: 'Demo mode',
    model: 'local',
    keyPlaceholder: 'No key needed — demo uses canned responses',
    isLocal: true,
    mockTurn: (history, topic) => {
      const modelTurns = history.filter(m => m.role === 'model').length;
      const t = topic || 'this topic';
      const script = [
        { message: `Hi there! Thanks for taking a few minutes to chat today. I'd love to understand your experience with ${t}. To start, could you walk me through the last time this came up for you?`, action: 'next_core' },
        { message: `That's really helpful, thanks for sharing. Next, what would you say is the most frustrating part of that experience for you?`, action: 'next_core' },
        { message: `Got it — really appreciate the detail. One last question: if you could change one thing about how this works today, what would it be and why?`, action: 'next_core' },
        { message: `Thank you so much — this has been incredibly valuable. Your answers give us a lot to think about.`, action: 'complete' }
      ];
      const idx = Math.min(modelTurns, script.length - 1);
      return JSON.stringify(script[idx]);
    },
    mockSummary: () => JSON.stringify({
      themes: [
        'Discovery friction during initial research',
        'Trust signals matter more than price',
        'Comparison fatigue across multiple sources',
        'Preference for peer recommendations over ads'
      ],
      quotes: [
        { context: 'Walk me through the last time this came up', quote: 'I usually start by asking friends, then I check reviews on two or three sites.' },
        { context: 'What is the most frustrating part', quote: 'Every site tells me something slightly different and I never know who to trust.' },
        { context: 'If you could change one thing', quote: 'I wish there was one source that just told me honestly what is worth it.' }
      ],
      insights: [
        'Build a trust layer: surface verified peer reviews over marketing copy.',
        'Reduce comparison fatigue with a single-source summary view.',
        'Prioritize honesty signals (pros AND cons) in product descriptions.',
        'Test social-proof placements earlier in the research funnel.'
      ]
    })
  }
};

// =============== PARSE + STRIP ===============
export function stripControlTokens(s: string): string {
  return String(s).replace(/\[[A-Z][A-Z0-9_]*\]/g, '').replace(/\s{2,}/g, ' ').trim();
}

export function parseTurn(text: string): TurnResult {
  const cleaned = String(text).replace(/```json\s*|```/g, '').trim();
  const obj = JSON.parse(cleaned);
  if (typeof obj.message !== 'string' || !obj.message.trim()) throw new Error('missing message');
  if (!['follow_up', 'next_core', 'complete'].includes(obj.action)) throw new Error('invalid action');
  obj.message = stripControlTokens(obj.message);
  if (!obj.message) throw new Error('empty after sanitize');
  return obj as TurnResult;
}

// =============== CALL PROVIDER ===============
export interface CallContext {
  providerId: ProviderId;
  apiKey: string;
  systemText: string;
  topic: string;
}

export async function callProvider(
  ctx: CallContext,
  historyForApi: HistoryMsg[],
  opts: { structured?: boolean } = {}
): Promise<string> {
  const { structured = false } = opts;
  const provider = PROVIDERS[ctx.providerId] || PROVIDERS.gemini;

  if (provider.isLocal) {
    await new Promise(r => setTimeout(r, 600));
    return provider.mockTurn!(historyForApi, ctx.topic);
  }

  const { url, headers, body } = provider.buildTurnRequest!(ctx.apiKey, ctx.systemText, historyForApi, structured);
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    const err = new Error(provider.extractError!(e) || `API request failed (${res.status})`);
    (err as any).status = res.status;
    throw err;
  }
  const data = await res.json();
  return provider.extractText!(data);
}

export async function getStructuredTurn(
  ctx: CallContext,
  historyForApi: HistoryMsg[]
): Promise<{ parsed: TurnResult | null; raw: string }> {
  let raw: string;
  try {
    raw = await callProvider(ctx, historyForApi, { structured: true });
  } catch (err) {
    throw err;
  }
  try {
    return { parsed: parseTurn(raw), raw };
  } catch (_parseErr) {
    try {
      const retryHistory: HistoryMsg[] = historyForApi.concat([{
        role: 'user',
        text: 'Your previous reply was not valid JSON. Reply again with a single valid JSON object exactly matching the schema {"message": string, "action": "follow_up"|"next_core"|"complete"}. No prose, no fences.',
        ts: Date.now()
      }]);
      const raw2 = await callProvider(ctx, retryHistory, { structured: true });
      return { parsed: parseTurn(raw2), raw: raw2 };
    } catch (_err2) {
      const raw3 = await callProvider(ctx, historyForApi, { structured: false });
      return { parsed: null, raw: raw3 };
    }
  }
}

// =============== SUMMARY ===============
export async function generateSummaryCall(
  ctx: CallContext,
  prompt: string
): Promise<SummaryResult> {
  const provider = PROVIDERS[ctx.providerId] || PROVIDERS.gemini;

  if (provider.isLocal) {
    await new Promise(r => setTimeout(r, 800));
    return JSON.parse(provider.mockSummary!());
  }

  const { url, headers, body } = provider.buildSummaryRequest!(ctx.apiKey, prompt, SUMMARY_SCHEMA);
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(provider.extractError!(e) || `HTTP ${res.status}`);
  }
  const data = await res.json();
  let text = provider.extractText!(data);
  if (!text.trim()) throw new Error('Empty response from API');
  text = text.replace(/```json\s*|```/g, '').trim();
  const parsed = JSON.parse(text);
  const hasContent = (parsed.themes?.length || 0) + (parsed.quotes?.length || 0) + (parsed.insights?.length || 0) > 0;
  if (!hasContent) throw new Error('Summary returned empty — try again.');
  return parsed as SummaryResult;
}

// =============== BUILD SYSTEM PROMPT ===============
export interface InterviewContext {
  systemPrompt: string;
  topic: string;
  audience: string;
  researchGoal: string;
  painPoints: string;
  region: string;
  // Phase 1a additions
  company?: string;
  industry?: string;
  competitors?: string[];
  scopeIn?: string;
  scopeOut?: string;
  lang: 'en' | 'ar';
}

export function buildSystemInstruction(ctx: InterviewContext): string {
  let s = ctx.systemPrompt;

  // --- Research context block (instrumental: tells the AI what to DO with the info) ---
  const items: string[] = [];
  if (ctx.topic) items.push(`Topic: ${ctx.topic}`);
  if (ctx.audience) items.push(`Target audience: ${ctx.audience}`);
  if (ctx.researchGoal) items.push(`Research goal: ${ctx.researchGoal}`);
  if (ctx.painPoints) items.push(`Pain points to explore: ${ctx.painPoints}`);
  if (ctx.region) items.push(`Geography: ${ctx.region}`);
  if (ctx.company) items.push(`Company: ${ctx.company}`);
  if (ctx.industry) items.push(`Industry: ${ctx.industry}`);
  if (items.length) s += `\n\n--- Research context ---\n${items.join('\n')}`;

  // Competitors get their own instrumental block so the model knows WHAT to do
  if (ctx.competitors && ctx.competitors.length > 0) {
    s += `\n\n--- Competitors to watch for ---\n${ctx.competitors.map(c => `- ${c}`).join('\n')}\n\nWhen the participant mentions any of these competitors by name, pay extra attention — this is a natural moment to ask a follow-up about comparison or preference.`;
  }

  // Scope hard constraint — positive + negative + fallback behavior
  if (ctx.scopeIn || ctx.scopeOut) {
    s += `\n\n--- SCOPE (hard constraint) ---`;
    if (ctx.scopeIn) s += `\nIN SCOPE: ${ctx.scopeIn}`;
    if (ctx.scopeOut) s += `\nOUT OF SCOPE: ${ctx.scopeOut}`;
    s += `\n\nRules:\n- If the participant brings up something out of scope, acknowledge it briefly and gently redirect back to what's in scope.\n- Do not ask follow-ups that drift outside scope.\n- If you cannot think of a next_core question within scope, output action="complete" — do NOT invent off-topic questions.`;
  }

  if (ctx.lang === 'ar') {
    s += `\n\nIMPORTANT: Conduct the entire interview in Arabic (العربية). The participant is an Arabic speaker. All "message" fields in your JSON output MUST be in Arabic. Keep "action" values in English ("follow_up", "next_core", "complete").`;
  }
  return s;
}

// Common industry presets for the setup form combobox
export const INDUSTRY_PRESETS = [
  'SaaS / B2B software',
  'Consumer app',
  'E-commerce / Retail',
  'Fintech / Banking',
  'Healthcare / Medtech',
  'Education / Edtech',
  'Media / Publishing',
  'Gaming',
  'Travel / Hospitality',
  'Food delivery',
  'Mobility / Transport',
  'Consumer hardware',
  'Enterprise software',
  'Developer tools',
  'AI / ML tools',
  'Marketplace',
  'Productivity',
  'Social / Community',
  'Non-profit',
  'Government / Public sector',
];

export const DEFAULT_SYSTEM_PROMPT = `You are a warm, curious, and skilled UX researcher conducting a semi-structured user interview.

OUTPUT FORMAT (strict):
You MUST reply with a single JSON object and nothing else — no markdown fences, no prose outside the JSON. Schema:
{
  "message": "the visible interviewer message to the participant",
  "action": "follow_up" | "next_core" | "complete"
}

ACTION SEMANTICS:
- "next_core": you are asking a NEW core question. Use this for the very first question and whenever you move on to the next topic.
- "follow_up": you are probing the participant's previous answer to go deeper. ONLY use this when their last answer was vague, very brief, or mentioned an interesting thread genuinely worth probing. If their answer was already detailed and clear, do NOT use follow_up — use next_core instead.
- "complete": you have finished the interview. Put a brief warm thank-you in "message". ONLY use this after you have covered exactly 3 core questions.

INTERVIEW RULES:
- Ask ONE question per message. Never combine multiple questions.
- Begin with a brief friendly intro inside "message" along with your first core question (action: next_core).
- Plan for EXACTLY 3 core questions total.
- At MOST 2 follow-ups per core question, and only when truly needed. The system enforces this hard cap.
- Be neutral and non-leading. Keep messages short (1-3 sentences typically).
- Follow-ups must reference what the user just said and stay strictly within the interview topic. Do not follow tangents.`;

export const TOTAL_CORE_QUESTIONS = 3;
