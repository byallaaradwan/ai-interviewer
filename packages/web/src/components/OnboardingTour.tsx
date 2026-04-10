import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type TourStep = {
  /** CSS selector for the element to spotlight */
  target: string;
  /** Tooltip text */
  text: string;
  /** Preferred bubble position relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right';
};

type Props = {
  /** Unique key for localStorage tracking */
  id: string;
  steps: TourStep[];
  /** Called when tour finishes or is skipped */
  onDone?: () => void;
};

const TOUR_KEY = 'tour_done_v1';

function getCompleted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(TOUR_KEY) || '[]')); } catch { return new Set(); }
}
function markCompleted(id: string) {
  const set = getCompleted();
  set.add(id);
  localStorage.setItem(TOUR_KEY, JSON.stringify([...set]));
}

/** Ensure sidebar is visible so tour can spotlight items inside it */
function ensureSidebarOpen(target: string) {
  const el = document.querySelector(target);
  if (!el) return;
  const inSidenav = el.closest('.sidenav');
  if (inSidenav) {
    document.body.classList.add('sidenav-open');
  }
}

function closeSidebarIfNeeded() {
  // Only close on narrow screens where sidebar is an overlay
  if (window.innerWidth < 1024) {
    document.body.classList.remove('sidenav-open');
  }
}

export function OnboardingTour({ id, steps, onDone }: Props) {
  const [active, setActive] = useState(() => !getCompleted().has(id));
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const current = steps[step];

  const measure = useCallback(() => {
    if (!active || !current) return;
    ensureSidebarOpen(current.target);
    // Small delay to let sidebar animation finish
    requestAnimationFrame(() => {
      const el = document.querySelector(current.target);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    });
  }, [active, current]);

  useLayoutEffect(() => { measure(); }, [measure]);

  // Re-measure after a short delay to catch post-animation positions
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(measure, 350);
    return () => clearTimeout(t);
  }, [active, step, measure]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [active, measure]);

  const finish = useCallback(() => {
    markCompleted(id);
    setActive(false);
    closeSidebarIfNeeded();
    onDone?.();
  }, [id, onDone]);

  const next = () => {
    if (step >= steps.length - 1) { finish(); } else { setStep(s => s + 1); }
  };
  const back = () => { if (step > 0) setStep(s => s - 1); };
  const skip = () => { finish(); };

  if (!active || !current) return null;

  const pad = 8;
  const pos = current.position || 'bottom';

  // Calculate bubble position
  let bubbleStyle: React.CSSProperties = {};
  if (rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    switch (pos) {
      case 'bottom':
        bubbleStyle = { top: rect.bottom + pad + 8, left: Math.max(16, Math.min(cx - 150, window.innerWidth - 316)) };
        break;
      case 'top':
        bubbleStyle = { bottom: window.innerHeight - rect.top + pad + 8, left: Math.max(16, Math.min(cx - 150, window.innerWidth - 316)) };
        break;
      case 'left':
        bubbleStyle = { top: Math.max(16, cy - 50), right: window.innerWidth - rect.left + pad + 8 };
        break;
      case 'right':
        bubbleStyle = { top: Math.max(16, cy - 50), left: rect.right + pad + 8 };
        break;
    }
  }

  return (
    <div className="tour-overlay">
      {/* Dark backdrop with cutout for spotlight */}
      <svg className="tour-backdrop" width="100%" height="100%">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - pad}
                y={rect.top - pad}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx={10}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-mask)" />
      </svg>

      {/* Spotlight ring */}
      {rect && (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}

      {/* Tooltip bubble */}
      <div className={`tour-bubble tour-bubble-${pos}`} style={bubbleStyle} ref={bubbleRef}>
        <div className="tour-step-badge">Step {step + 1} of {steps.length}</div>
        <p className="tour-text">{current.text}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={skip}>Skip</button>
          <div className="tour-nav">
            {step > 0 && (
              <button type="button" className="tour-btn tour-back" onClick={back} aria-label="Previous step">
                &lt; Back
              </button>
            )}
            <button type="button" className="tour-btn tour-next" onClick={next}>
              {step >= steps.length - 1 ? 'Done' : 'Next >'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
