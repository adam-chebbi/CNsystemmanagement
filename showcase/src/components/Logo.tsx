import { SITE } from '../config/site';
import { Link } from '../lib/router';

/** Brand mark + wordmark, side by side on one line. Swaps to a light-ink variant in dark mode. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" aria-label={`${SITE.name} — accueil`} className={`flex items-center gap-2 ${className}`}>
      <img src="/logo-icon.png" alt="" className="h-8 w-auto dark:hidden sm:h-9" />
      <img src="/logo-icon-dark.png" alt="" className="hidden h-8 w-auto dark:block sm:h-9" />
      <img src="/logo-text.png" alt={SITE.name} className="h-4 w-auto dark:hidden sm:h-[1.15rem]" />
      <img src="/logo-text-dark.png" alt={SITE.name} className="hidden h-4 w-auto dark:block sm:h-[1.15rem]" />
    </Link>
  );
}
