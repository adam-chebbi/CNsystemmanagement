// Single place to edit the showcase's public-facing facts and where its menu data comes from.

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

interface SiteInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: { days: string; time: string }[];
}

export const SITE: SiteInfo = {
  name: 'Café Noir',
  tagline: 'Torréfacteur & Coffee Shop Artisanal',
  address: 'Avenue Habib Bourguiba, Tunis',
  // Optional contact details — a row is only rendered when its value is filled in.
  phone: '',
  email: '',
  hours: [],
};

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.name} ${SITE.address}`
)}`;
