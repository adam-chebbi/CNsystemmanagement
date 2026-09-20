import { Ambiance } from './components/Ambiance';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { Story } from './components/Story';

// One-page site: every nav entry is an anchor to a section below.
export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <MenuSection />
        <Story />
        <Ambiance />
      </main>
      <Footer />
    </div>
  );
}
