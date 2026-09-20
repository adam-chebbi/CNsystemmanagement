import { Menu as MenuIcon, X } from 'lucide-react';
import { useState } from 'react';
import { NAV_ITEMS, PHONE_HREF } from '../config/site';
import { useActiveSection } from '../lib/useActiveSection';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const SECTION_IDS = NAV_ITEMS.map((n) => n.id);

export function Header() {
  const active = useActiveSection(SECTION_IDS);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[72px] lg:px-12">
        <Logo />

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              className={`relative py-1 text-[13px] font-medium transition-colors hover:text-ink ${
                active === item.id ? 'text-ink' : 'text-muted'
              }`}
            >
              {item.label}
              <span
                aria-hidden
                className={`absolute -bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-brand transition-all ${
                  active === item.id ? 'w-4 opacity-100' : 'w-0 opacity-0'
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <a
            href={PHONE_HREF}
            className="hidden rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-on-brand transition-[filter] hover:brightness-95 sm:inline-flex"
          >
            Réserver une table
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          >
            {open ? <X size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-line bg-page px-5 pb-5 pt-2 sm:px-8 lg:hidden" aria-label="Navigation mobile">
          <ul className="divide-y divide-line">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between py-3.5 text-base font-medium ${active === item.id ? 'text-ink' : 'text-muted'}`}
                >
                  {item.label}
                  {active === item.id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={PHONE_HREF}
            className="mt-3 flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-on-brand"
          >
            Réserver une table
          </a>
        </nav>
      )}
    </header>
  );
}
