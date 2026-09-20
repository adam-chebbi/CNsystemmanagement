import { SITE } from '../config/site';
import { Link } from '../lib/router';

/** Text-only wordmark — the logo is literally the words "Café Noir" set in the display serif. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label={`${SITE.name} — accueil`}
      className={`font-serif text-[1.55rem] leading-none tracking-[-0.01em] text-ink sm:text-[1.75rem] ${className}`}
    >
      {SITE.name}
    </Link>
  );
}
