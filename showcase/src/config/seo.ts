// SEO facts shared by the site (client-side updates on route change) and the build
// (seo/seoPlugin.ts: static <head> per page, sitemap.xml, robots.txt, llms.txt, JSON-LD).
// Pure data on purpose — no import.meta.env, no DOM — because the Vite config imports it in Node.

export const SEO_SITE = {
  name: 'Café Noir',
  lang: 'fr',
  locale: 'fr_TN',
  themeColor: '#FAF9F5',
  // Picture used when a page is shared (Open Graph / Twitter). Swap the file to change it; the width
  // and height announced to social networks are read from the file at build time.
  ogImage: '/images/ambiance.jpg',
  ogImageAlt: 'Le comptoir de Café Noir : bar vert menthe, fleurs blanches et ambiance lumineuse à Tunis',
} as const;

export type SeoPath = '/' | '/menu';

export interface SeoPage {
  title: string; // ≈ 60 characters or fewer
  description: string; // ≈ 155 characters or fewer
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

// The menu's own products and categories come from the management system at runtime, so nothing
// about them is written here — the copy stays true whatever the menu contains.
export const SEO_PAGES: Record<SeoPath, SeoPage> = {
  '/': {
    title: 'Café Noir — Café, brunch & pâtisserie à Tunis',
    description:
      'Café Noir, coffee shop au Centre Makni à Tunis : cafés d’exception, brunch, pâtisseries artisanales et produits locaux. Découvrez notre menu et venez nous voir.',
    changefreq: 'weekly',
    priority: '1.0',
  },
  '/menu': {
    title: 'Menu — Café Noir | Boissons, brunch, pâtisseries et plats à Tunis',
    description:
      'Le menu complet de Café Noir à Tunis : toutes nos boissons, pâtisseries et plats avec leurs prix en dinars (TND), mis à jour en direct.',
    changefreq: 'daily',
    priority: '0.9',
  },
};

export const NOT_FOUND_TITLE = 'Page introuvable — Café Noir';

export const BUSINESS = {
  streetAddress: 'Centre Makni, Rue Ahmed Ghanmi',
  locality: 'Tunis',
  postalCode: '1013',
  country: 'TN',
  region: 'TN-11', // ISO 3166-2: Tunis governorate
  latitude: 36.8465365,
  longitude: 10.1536695,
  // The exact Google Maps place (no tracking parameters).
  mapsUrl:
    'https://www.google.com/maps/place/Caf%C3%A9+noir/@36.8465408,10.1510946,17z/data=!3m1!4b1!4m6!3m5!1s0x12fd33ac03c1d4ab:0x29f717cb2de59ae7!8m2!3d36.8465365!4d10.1536695!16s%2Fg%2F11k48pc0zc',
  // Opening hours announced on the site: every day, 7h to 22h.
  opens: '07:00',
  closes: '22:00',
} as const;
