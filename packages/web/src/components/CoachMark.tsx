import { useState } from 'react';

const DISMISSED_KEY = 'coach_dismissed_v1';

function getDismissed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); } catch { return new Set(); }
}
function dismiss(id: string) {
  const set = getDismissed();
  set.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

type Props = {
  id: string;           // unique key, persisted in localStorage
  text: string;         // tooltip content
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode; // the element being annotated
};

export function CoachMark({ id, text, position = 'top', children }: Props) {
  const [visible, setVisible] = useState(() => !getDismissed().has(id));

  const handleDismiss = () => { dismiss(id); setVisible(false); };

  return (
    <span className="coach-anchor">
      {children}
      {visible && (
        <span className={`coach-bubble coach-${position}`} role="status">
          <span className="coach-text">{text}</span>
          <button type="button" className="coach-close" onClick={handleDismiss} aria-label="Dismiss">✕</button>
        </span>
      )}
    </span>
  );
}
