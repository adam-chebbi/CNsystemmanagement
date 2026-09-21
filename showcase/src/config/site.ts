import { BUSINESS } from './seo';

// Single place to edit the showcase's public-facing facts and where its menu data comes from.

/** Public address of the deployed site, for canonical links (set VITE_SITE_URL at build time to change it). */
export const SITE_URL: string = (import.meta.env.VITE_SITE_URL ?? 'https://test.cafenoir.tn').replace(/\/+$/, '');

/**
 * Base URL of the management app's public API. In dev it's '' so calls go through the Vite `/api`
 * proxy (same-origin). In a production build it defaults to the management app's own domain — the
 * showcase is hosted on a DIFFERENT URL, so it must call the system by absolute URL (the route is
 * CORS-open). Override at build time with VITE_API_BASE_URL.
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '' : 'https://cafe.cafenoir.tn')
).replace(/\/+$/, '');

interface SocialLink {
  id: 'instagram' | 'facebook' | 'tiktok';
  label: string;
  /** Leave empty until the real profile URL is known — the icon is then shown without a link. */
  href: string;
}

interface SiteInfo {
  name: string;
  tagline: string;
  eyebrow: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  socials: SocialLink[];
  credit: string;
}

export const SITE: SiteInfo = {
  name: 'Café Noir',
  tagline: 'Café · Brunch · Pâtisserie',
  eyebrow: 'Café · Brunch · Pâtisserie',
  address: 'Centre Makni, Rue Ahmed Ghanmi, Tunis 1013',
  phone: '+216 71 123 456',
  email: 'contact@cafenoir.tn',
  hours: 'Nous vous accueillons tous les jours de 7h à 22h.',
  socials: [
    { id: 'instagram', label: 'Instagram', href: '' },
    { id: 'facebook', label: 'Facebook', href: '' },
    { id: 'tiktok', label: 'TikTok', href: '' },
  ],
  credit: 'Creative Comet',
};

// The café's exact Google Maps place ("Café noir", Centre Makni) — the link opened by "Nous trouver" and
// the address, and the pin shown by the embedded map in the footer. Both point at the same place id
// (0x12fd33ac03c1d4ab:0x29f717cb2de59ae7) and coordinates, never at a text search.
export const MAPS_URL = BUSINESS.mapsUrl;
export const MAPS_EMBED_URL =
  'https://www.google.com/maps/embed?pb=' +
  '!1m18!1m12!1m3!1d3194.2!2d10.1536695!3d36.8465365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1' +
  '!3m3!1m2!1s0x12fd33ac03c1d4ab%3A0x29f717cb2de59ae7!2sCaf%C3%A9%20noir!5e0!3m2!1sfr!2stn!4v1758000000000!5m2!1sfr!2stn';
export const PHONE_HREF = `tel:${SITE.phone.replace(/[^+\d]/g, '')}`;

export const NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'menu', label: 'Menu' },
  { id: 'histoire', label: 'Notre histoire' },
  { id: 'galerie', label: 'Galerie' },
  { id: 'contact', label: 'Contact' },
] as const;

// Photography lives in public/images — swap a file (same name) to change a picture.
export const IMAGES = {
  hero: '/images/hero.jpg',
  story: '/images/story.jpg',
  ambiance: '/images/ambiance.jpg',
  cafes: '/images/cafes.jpg',
  boissons: '/images/boissons.jpg',
  patisseries: '/images/patisseries.jpg',
  sales: '/images/sales.jpg',
} as const;

export const GALLERY = [
  { src: IMAGES.hero, alt: 'Un cappuccino et des viennoiseries sur une table en marbre' },
  { src: IMAGES.story, alt: 'Le comptoir et la salle de Café Noir' },
  { src: IMAGES.cafes, alt: 'Un café latte dans une tasse noire' },
  { src: IMAGES.boissons, alt: 'Un latte matcha glacé' },
  { src: IMAGES.patisseries, alt: 'Un croissant doré' },
  { src: IMAGES.sales, alt: 'Un avocado toast' },
  { src: IMAGES.ambiance, alt: 'La salle de Café Noir, lumière naturelle et verdure' },
] as const;
