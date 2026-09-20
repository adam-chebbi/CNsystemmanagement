import { useEffect } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SITE } from './config/site';
import { useRouter } from './lib/router';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';

const TITLES: Record<string, string> = {
  '/': `${SITE.name} — ${SITE.tagline}`,
  '/menu': `Menu — ${SITE.name}`,
  '/a-propos': `À propos — ${SITE.name}`,
};

function NotFound() {
  const { navigate } = useRouter();
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <p className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Cette page n'existe pas.</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}

export default function App() {
  const { path } = useRouter();

  useEffect(() => {
    document.title = TITLES[path] ?? `Page introuvable — ${SITE.name}`;
  }, [path]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-[#111827] dark:text-gray-100">
      <Header />
      <main className="flex-1">
        {path === '/' && <HomePage />}
        {path === '/menu' && <MenuPage />}
        {path === '/a-propos' && <AboutPage />}
        {!TITLES[path] && <NotFound />}
      </main>
      <Footer />
    </div>
  );
}
