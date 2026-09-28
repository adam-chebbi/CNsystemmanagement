import { useLayoutEffect, useRef, useState } from 'react';

const SEEN_KEY = 'cafenoir-intro-seen';
const HOLD_MS = 800;
const SHRINK_MS = 1300;
const CROSSFADE_MS = 450;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

type Phase = 'skip' | 'holding' | 'shrinking' | 'crossfading' | 'done';

/**
 * Plays once per browser session, on first load of the site (any route — the header is mounted
 * everywhere): the logo + wordmark appear large and centered, hold briefly, then shrink and glide
 * into their real spot in the header (measured live via getBoundingClientRect — a small FLIP, so
 * it lands pixel-perfect at any viewport size). The real header logo stays invisible (opacity: 0,
 * set by the parent via `onLogoRevealChange`) until the overlay is exactly on top of it, then the
 * two cross-fade — no pop, no flash of doubled logo.
 */
export function IntroAnimation({ onLogoRevealChange }: { onLogoRevealChange: (revealed: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === 'undefined') return 'skip';
    if (sessionStorage.getItem(SEEN_KEY)) return 'skip';
    if (prefersReducedMotion()) return 'skip';
    return 'holding';
  });
  const groupRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('translate(-50%, -50%)');

  useLayoutEffect(() => {
    if (phase === 'skip') {
      onLogoRevealChange(true);
      return;
    }
    sessionStorage.setItem(SEEN_KEY, '1');

    const holdTimer = window.setTimeout(() => {
      const group = groupRef.current;
      const target = document.getElementById('header-logo');
      if (!group || !target) {
        setPhase('done');
        onLogoRevealChange(true);
        return;
      }
      const groupRect = group.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scale = targetRect.width / groupRect.width;
      const dx = targetRect.left + targetRect.width / 2 - (groupRect.left + groupRect.width / 2);
      const dy = targetRect.top + targetRect.height / 2 - (groupRect.top + groupRect.height / 2);
      setTransform(`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`);
      setPhase('shrinking');
    }, HOLD_MS);

    return () => window.clearTimeout(holdTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (phase !== 'shrinking') return;
    const timer = window.setTimeout(() => {
      onLogoRevealChange(true);
      setPhase('crossfading');
    }, SHRINK_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== 'crossfading') return;
    const timer = window.setTimeout(() => setPhase('done'), CROSSFADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'skip' || phase === 'done') return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[70] bg-page transition-opacity ${phase === 'crossfading' ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
    >
      <div
        ref={groupRef}
        className="absolute left-1/2 top-1/2 flex items-center gap-4 transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform, transitionDuration: `${SHRINK_MS}ms` }}
      >
        <img src="/logo-icon.png" alt="" className="h-24 w-auto dark:hidden sm:h-28" />
        <img src="/logo-icon-dark.png" alt="" className="hidden h-24 w-auto dark:block sm:h-28" />
        <img src="/logo-text.png" alt="Café Noir" className="h-12 w-auto dark:hidden sm:h-14" />
        <img src="/logo-text-dark.png" alt="Café Noir" className="hidden h-12 w-auto dark:block sm:h-14" />
      </div>
    </div>
  );
}
