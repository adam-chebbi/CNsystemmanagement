import { Link } from '../lib/router';

/** Text-only wordmark — the showcase's logo is literally the words "Café Noir". */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Café Noir — accueil"
      className={`inline-flex items-baseline gap-1.5 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white ${className}`}
    >
      <span>Café</span>
      <span className="text-primary">Noir</span>
    </Link>
  );
}
