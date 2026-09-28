import { Coffee, MessageCircle } from 'lucide-react';
import { useSiteInfo } from '../lib/siteInfo';
import { Link } from '../lib/router';

/**
 * Persistent contact shortcuts, always on top of the page:
 * - Desktop (lg+): a single small round WhatsApp button, bottom-right.
 * - Mobile (below lg): a two-button bar pinned to the bottom of the screen (Menu + WhatsApp),
 *   which stays in place while the page scrolls (position: fixed, not part of page flow).
 * WhatsApp only ever shows if a real number is configured in Paramètres → Site vitrine — never a
 * made-up one.
 */
export function FloatingContactButtons() {
  const info = useSiteInfo();
  const whatsappHref = info.socials.find((s) => s.platform === 'whatsapp')?.href;

  return (
    <>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Nous contacter sur WhatsApp"
          title="WhatsApp"
          className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-[0_10px_30px_-8px] shadow-black/40 transition-transform hover:scale-105 active:scale-95 lg:flex"
        >
          <MessageCircle size={24} strokeWidth={2} />
        </a>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-page/95 p-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Link
          to="/menu"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-[13px] font-semibold text-on-brand shadow-sm active:scale-[0.98]"
        >
          <Coffee size={16} /> Voir le menu
        </Link>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-brand px-4 py-3 text-[13px] font-semibold text-ink shadow-sm active:scale-[0.98]"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        )}
      </div>
    </>
  );
}
