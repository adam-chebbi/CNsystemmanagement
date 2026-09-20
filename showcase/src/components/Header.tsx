import { Menu as MenuIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useRouter } from '../lib/router';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export const NAV_ITEMS = [
  { to: '/', label: 'Accueil' },
  { to: '/menu', label: 'Menu' },
  { to: '/a-propos', label: 'À propos' },
];

export function Header() {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  const linkClass = (to: string) =>
    `rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
      path === to
        ? 'bg-primary-soft text-primary-soft-foreground'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md dark:border-gray-800 dark:bg-[#111827]/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass(item.to)} aria-current={path === item.to ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/menu"
            className="hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 sm:inline-flex"
          >
            Voir la carte
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 dark:border-gray-800 dark:bg-[#151D2A] dark:text-gray-300 md:hidden"
          >
            {open ? <X size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#111827] md:hidden" aria-label="Navigation mobile">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
