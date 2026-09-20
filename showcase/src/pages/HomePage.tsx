import { ArrowRight, Clock, Coffee, Leaf, MapPin, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { MAPS_URL, SITE } from '../config/site';
import { Link } from '../lib/router';
import { useCatalog } from '../lib/useCatalog';

const HIGHLIGHTS = [
  { icon: Coffee, title: 'Café de spécialité', text: 'Des grains sélectionnés avec soin, torréfiés et préparés avec exigence.' },
  { icon: Leaf, title: 'Fait maison', text: 'Une carte simple, préparée chaque jour avec des produits frais.' },
  { icon: Sparkles, title: 'Une ambiance chaleureuse', text: 'Un lieu pensé pour prendre son temps, seul ou entre amis.' },
];

export function HomePage() {
  const { state } = useCatalog();

  const featured = useMemo(() => {
    if (state.status !== 'ready') return [];
    // Prefer products that have a photo, then fill up with the rest — first three in system order.
    const { products } = state.catalog;
    return [...products.filter((p) => p.imageUrl), ...products.filter((p) => !p.imageUrl)].slice(0, 3);
  }, [state]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-400/10" />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="animate-steam-rise absolute bottom-10 hidden h-16 w-1.5 rounded-full bg-emerald-300/50 blur-sm dark:bg-emerald-300/20 md:block"
              style={{ right: `${18 + i * 5}%`, animationDelay: `${i * 1.6}s` }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-soft-foreground">
              <Coffee size={14} /> {SITE.tagline}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Le goût du vrai café, <span className="text-primary">à Tunis</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
              Chez Café Noir, chaque tasse raconte une histoire : des grains choisis, une préparation soignée et un accueil
              qui donne envie de rester.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
              >
                Découvrir la carte <ArrowRight size={16} />
              </Link>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-[#151D2A] dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <MapPin size={16} /> Nous trouver
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#151D2A]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && state.status === 'ready' && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">De notre carte</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">À découvrir</h2>
            </div>
            <Link to="/menu" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline">
              Tout le menu <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} extras={state.catalog.extras} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary p-8 text-white shadow-sm sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Passez nous voir</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
              <MapPin size={16} /> {SITE.address}
            </p>
            {SITE.hours.length > 0 && (
              <p className="mt-1 flex items-center gap-2 text-sm text-white/85">
                <Clock size={16} /> {SITE.hours[0].days} : {SITE.hours[0].time}
              </p>
            )}
          </div>
          <Link
            to="/a-propos"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            En savoir plus <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
