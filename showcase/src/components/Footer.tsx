import { Mail, MapPin, Phone } from 'lucide-react';
import { MAPS_URL, SITE } from '../config/site';
import { Link } from '../lib/router';
import { Logo } from './Logo';
import { NAV_ITEMS } from './Header';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-[#0d1420]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">{SITE.tagline}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Navigation</h3>
          <ul className="mt-3 space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nous trouver</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                {SITE.address}
              </a>
            </li>
            {SITE.phone && (
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-primary" />
                <a href={`tel:${SITE.phone.replace(/\s+/g, '')}`} className="hover:text-primary">
                  {SITE.phone}
                </a>
              </li>
            )}
            {SITE.email && (
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-primary" />
                <a href={`mailto:${SITE.email}`} className="hover:text-primary">
                  {SITE.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
        © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
