import { PROVIDERS, type ProviderId } from '../providers';

export function readLLMConfig() {
  const providerId = (localStorage.getItem('provider') || 'mock') as ProviderId;
  const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('apiKey') || '';
  return { providerId, apiKey };
}

export function isConfigured(): boolean {
  const { providerId, apiKey } = readLLMConfig();
  return PROVIDERS[providerId]?.isLocal === true || apiKey.length > 10;
}

/**
 * Single-shot prompt for non-interview tasks (brainstorm, email gen, etc).
 * Bypasses the interview-specific mock script: when in demo mode, callers
 * should pass a `mockResponse` to use as canned content.
 */
export async function singleShot(opts: {
  systemText: string;
  userText: string;
  mockResponse?: string;
}): Promise<string> {
  const { providerId, apiKey } = readLLMConfig();
  const provider = PROVIDERS[providerId] || PROVIDERS.gemini;

  if (provider.isLocal) {
    await new Promise(r => setTimeout(r, 700));
    return opts.mockResponse || 'Demo mode does not have canned content for this action.';
  }

  // Build a single-turn request via the provider's interview path,
  // but most providers will accept any system+user combo.
  const history = [{ role: 'user' as const, text: opts.userText, ts: Date.now() }];
  const { url, headers, body } = provider.buildTurnRequest!(apiKey, opts.systemText, history, false);
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(provider.extractError!(e) || `API request failed (${res.status})`);
  }
  const data = await res.json();
  return provider.extractText!(data);
}
