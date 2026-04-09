export type Role = 'researcher' | 'participant';

const ROLE_KEY = 'app_role';
export const PASSCODE = '123456';

export function getRole(): Role | null {
  const v = localStorage.getItem(ROLE_KEY);
  return v === 'researcher' || v === 'participant' ? v : null;
}

export function setRole(r: Role) {
  localStorage.setItem(ROLE_KEY, r);
}

export function clearRole() {
  localStorage.removeItem(ROLE_KEY);
}

export type PendingInterview = {
  id: string;
  createdAt: number;
  topic: string;
  audience: string;
  researchGoal: string;
  painPoints: string;
  region: string;
  company: string;
  industry: string;
  competitors: string[];
  scopeIn: string;
  scopeOut: string;
  diagType?: string;
};

const PENDING_KEY = 'pending_interviews_v1';

export function readPending(): PendingInterview[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}
export function writePending(list: PendingInterview[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}
export function addPending(p: PendingInterview) {
  writePending([p, ...readPending()]);
}
export function removePending(id: string) {
  writePending(readPending().filter(p => p.id !== id));
}
