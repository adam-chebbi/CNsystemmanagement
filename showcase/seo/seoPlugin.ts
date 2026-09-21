import { closeSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { BUSINESS, SEO_PAGES, SEO_SITE, type SeoPath } from '../src/config/seo';

// Build-time SEO for a static single-page site:
//  - every page gets its OWN <head> (title, description, canonical, Open Graph, Twitter, JSON-LD) in
//    static HTML — /menu is emitted as dist/menu/index.html — so crawlers and link previews that do
//    not run JavaScript still see the right tags;
//  - sitemap.xml, robots.txt and llms.txt are generated with the absolute URLs of the deployed domain
//    (VITE_SITE_URL, default https://test.cafenoir.tn).

const START = '<!--seo:start-->';
const END = '<!--seo:end-->';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Width and height of a JPEG, read from its header (so the announced size stays right when the photo is replaced). */
function jpegSize(file: string): { width: number; height: number } | null {
  try {
    const fd = openSync(file, 'r');
    const size = statSync(file).size;
    const buf = Buffer.alloc(Math.min(size, 65536));
    readSync(fd, buf, 0, buf.length, 0);
    closeSync(fd);
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i += 1; continue; }
      const marker = buf[i + 1];
      // Start-of-frame markers (baseline / progressive / …) carry the dimensions.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } catch {
    /* fall through */
  }
  return null;
}

const pageUrl = (siteUrl: string, p: SeoPath): string => (p === '/' ? `${siteUrl}/` : `${siteUrl}${p}`);

function jsonLd(siteUrl: string, page: SeoPath): string[] {
  const home = pageUrl(siteUrl, '/');
  const image = `${siteUrl}${SEO_SITE.ogImage}`;
  const business = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    '@id': `${home}#cafe`,
    name: SEO_SITE.name,
    url: home,
    image: [image],
    description: SEO_PAGES['/'].description,
    hasMenu: pageUrl(siteUrl, '/menu'),
    hasMap: BUSINESS.mapsUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.locality,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.latitude, longitude: BUSINESS.longitude },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: BUSINESS.opens,
        closes: BUSINESS.closes,
      },
    ],
    servesCuisine: ['Café', 'Brunch', 'Pâtisserie'],
    currenciesAccepted: 'TND',
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${home}#website`,
    name: SEO_SITE.name,
    url: home,
    inLanguage: SEO_SITE.lang,
    publisher: { '@id': `${home}#cafe` },
  };
  const out = [business, website];
  if (page === '/menu') {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: home },
        { '@type': 'ListItem', position: 2, name: 'Menu', item: pageUrl(siteUrl, '/menu') },
      ],
    } as never);
  }
  return out.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`);
}

function renderHead(siteUrl: string, page: SeoPath, og: { width: number; height: number } | null): string {
  const { title, description } = SEO_PAGES[page];
  const url = pageUrl(siteUrl, page);
  const image = `${siteUrl}${SEO_SITE.ogImage}`;
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="${SEO_SITE.lang}" href="${esc(url)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SEO_SITE.name)}" />`,
    `<meta property="og:locale" content="${SEO_SITE.locale}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image)}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    ...(og ? [`<meta property="og:image:width" content="${og.width}" />`, `<meta property="og:image:height" content="${og.height}" />`] : []),
    `<meta property="og:image:alt" content="${esc(SEO_SITE.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(SEO_SITE.ogImageAlt)}" />`,
    `<meta name="geo.region" content="${BUSINESS.region}" />`,
    `<meta name="geo.placename" content="${esc(BUSINESS.locality)}" />`,
    `<meta name="geo.position" content="${BUSINESS.latitude};${BUSINESS.longitude}" />`,
    `<meta name="ICBM" content="${BUSINESS.latitude}, ${BUSINESS.longitude}" />`,
    ...jsonLd(siteUrl, page),
  ];
  return `${START}\n    ${tags.join('\n    ')}\n    ${END}`;
}

export function seoPlugin(siteUrlRaw: string): Plugin {
  const siteUrl = siteUrlRaw.replace(/\/+$/, '');
  let root = process.cwd();
  let outDir = path.resolve(root, 'dist');
  let publicDir = path.resolve(root, 'public');
  const ogSize = () => jpegSize(path.join(publicDir, SEO_SITE.ogImage));

  return {
    name: 'cafe-noir-seo',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(root, config.build.outDir);
      publicDir = config.publicDir ? config.publicDir : path.resolve(root, 'public');
    },
    // Home page <head>, injected into index.html at the marker (also in dev, so the tags are always there).
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!--seo:head-->', renderHead(siteUrl, '/', ogSize())),
    },
    closeBundle() {
      // Only after a real build (dist/index.html exists) — not in dev.
      let indexHtml: string;
      try {
        indexHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      } catch {
        return;
      }
      const og = ogSize();

      // /menu gets its own static HTML: same app shell, its own <head>.
      const block = new RegExp(`${START}[\\s\\S]*?${END}`);
      if (!block.test(indexHtml)) throw new Error('seo: head markers were removed from the built index.html');
      mkdirSync(path.join(outDir, 'menu'), { recursive: true });
      writeFileSync(path.join(outDir, 'menu', 'index.html'), indexHtml.replace(block, () => renderHead(siteUrl, '/menu', og)));

      const lastmod = new Date().toISOString().slice(0, 10);
      const image = `${siteUrl}${SEO_SITE.ogImage}`;
      const urls = (Object.keys(SEO_PAGES) as SeoPath[])
        .map((p) => {
          const page = SEO_PAGES[p];
          return [
            '  <url>',
            `    <loc>${esc(pageUrl(siteUrl, p))}</loc>`,
            `    <lastmod>${lastmod}</lastmod>`,
            `    <changefreq>${page.changefreq}</changefreq>`,
            `    <priority>${page.priority}</priority>`,
            ...(p === '/' ? [`    <image:image><image:loc>${esc(image)}</image:loc></image:image>`] : []),
            '  </url>',
          ].join('\n');
        })
        .join('\n');
      writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`
      );

      writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

      writeFileSync(
        path.join(outDir, 'llms.txt'),
        [
          `# ${SEO_SITE.name}`,
          '',
          `> ${SEO_PAGES['/'].description}`,
          '',
          `- Adresse : ${BUSINESS.streetAddress}, ${BUSINESS.postalCode} ${BUSINESS.locality}, Tunisie`,
          `- Plan : ${BUSINESS.mapsUrl}`,
          '',
          '## Pages',
          `- [Accueil](${pageUrl(siteUrl, '/')}) : présentation, histoire et galerie`,
          `- [Menu](${pageUrl(siteUrl, '/menu')}) : boissons, pâtisseries et plats avec leurs prix en TND, mis à jour en direct`,
          '',
        ].join('\n')
      );
    },
  };
}
