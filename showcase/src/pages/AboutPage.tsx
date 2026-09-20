import { Clock, Coffee, Mail, MapPin, Phone } from 'lucide-react';
import { MAPS_URL, SITE } from '../config/site';
import { Link } from '../lib/router';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <div className="max-w-2xl animate-fade-up">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">À propos</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">L'histoire de Café Noir</h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
          Café Noir est un torréfacteur et coffee shop artisanal installé à Tunis. Notre idée est simple : servir un
          café que l'on a envie de savourer lentement, dans un lieu où l'on se sent bien.
        </p>
        <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
          Nous choisissons nos grains avec soin, préparons chaque boisson à la commande et cuisinons une carte courte
          pour garder l'essentiel : la qualité et la fraîcheur.
        </p>
        <Link
          to="/menu"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
          <Coffee size={16} /> Voir la carte
        </Link>
      </div>

      <section id="contact" className="mt-16 scroll-mt-24">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Nous trouver</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#151D2A]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Adresse</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{SITE.address}</p>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-bold text-primary hover:underline">
                  Ouvrir dans Google Maps
                </a>
              </div>
            </div>

            {SITE.phone && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Téléphone</p>
                  <a href={`tel:${SITE.phone.replace(/\s+/g, '')}`} className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    {SITE.phone}
                  </a>
                </div>
              </div>
            )}

            {SITE.email && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">E-mail</p>
                  <a href={`mailto:${SITE.email}`} className="text-sm text-gray-500 hover:text-primary dark:text-gray-400">
                    {SITE.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {SITE.hours.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#151D2A]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Clock size={20} />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Horaires</p>
              </div>
              <ul className="mt-4 divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {SITE.hours.map((h) => (
                  <li key={h.days} className="flex justify-between gap-4 py-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{h.days}</span>
                    <span className="text-gray-500 dark:text-gray-400">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
