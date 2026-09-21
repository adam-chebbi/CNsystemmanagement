import { useEffect } from 'react';
import { Ambiance } from './components/Ambiance';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { Story } from './components/Story';
import { applySeo } from './lib/seoClient';
import { Link, useRouter } from './lib/router';
import { MenuPage } from './pages/MenuPage';

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <MenuSection />
      <Story />
      <Ambiance />
    </>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-28 text-center sm:px-8">
      <p className="font-serif text-7xl text-accent">404</p>
      <p className="mt-3 font-serif text-3xl text-ink">Cette page n’existe pas.</p>
      <Link to="/" className="mt-7 inline-flex rounded-full bg-brand px-6 py-3 text-[13px] font-semibold text-on-brand hover:brightness-95">
        Retour à l’accueil
      </Link>
    </div>
  );
}

// Two pages: the one-page home (sections reached by anchors) and the dedicated menu page.
export default function App() {
  const { path } = useRouter();

  useEffect(() => {
    applySeo(path);
  }, [path]);

  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      <Header />
      <main className="flex-1">
        {path === '/' && <Home />}
        {path === '/menu' && <MenuPage />}
        {path !== '/' && path !== '/menu' && <NotFound />}
      </main>
      <Footer />
    </div>
  );
}
