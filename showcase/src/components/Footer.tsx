import { Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { MAPS_EMBED_URL, MAPS_URL, PHONE_HREF, SITE } from '../config/site';
import { Logo } from './Logo';

const SOCIAL_ICONS: Record<string, ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-8h2.7l.5-3.2h-3.2V7.9c0-.9.4-1.7 1.8-1.7h1.5V3.4c-.3 0-1.3-.2-2.5-.2-2.6 0-4.3 1.6-4.3 4.4v2.2H7v3.2h2.5v8h4z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
      <path d="M16.6 3h-3.1v11.7a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V8.9a5.8 5.8 0 1 0 5 5.7V8.7a7 7 0 0 0 4 1.3V6.9A4.1 4.1 0 0 1 16.6 3z" />
    </svg>
  ),
};

export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-16 border-t border-line lg:scroll-mt-[72px]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.3fr_1.2fr_0.9fr_1.2fr] lg:gap-12 lg:px-12 lg:py-14">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-subtle">{SITE.tagline}</p>
          <p className="mt-5 max-w-[15rem] text-[13px] leading-relaxed text-muted">{SITE.hours}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Contact</h3>
          <ul className="mt-4 space-y-3.5 text-[13px] text-muted">
            <li className="flex items-start gap-3">
              <Phone size={14} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <a href={PHONE_HREF} className="hover:text-ink">
                {SITE.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={14} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="max-w-[14rem] leading-relaxed hover:text-ink">
                {SITE.address}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={14} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <a href={`mailto:${SITE.email}`} className="break-all hover:text-ink">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Suivez-nous</h3>
          <ul className="mt-4 flex gap-5 text-ink">
            {SITE.socials.map((s) => (
              <li key={s.id}>
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="transition-colors hover:text-accent">
                    {SOCIAL_ICONS[s.id]}
                  </a>
                ) : (
                  <span role="img" aria-label={s.label}>
                    {SOCIAL_ICONS[s.id]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-36 overflow-hidden rounded-xl border border-line bg-section sm:col-span-2 lg:col-span-1 lg:h-[132px]">
          <iframe
            title={`Plan d’accès — ${SITE.name}`}
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0 dark:[filter:invert(92%)_hue-rotate(180deg)_saturate(0.7)]"
          />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-1.5 px-5 py-5 text-center text-[11px] text-subtle sm:flex-row sm:px-8 sm:text-left lg:px-12">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <p>Site réalisé par {SITE.credit}</p>
        </div>
      </div>
    </footer>
  );
}
