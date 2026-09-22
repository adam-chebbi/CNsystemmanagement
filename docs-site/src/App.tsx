import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Closes the mobile drawer on every navigation — otherwise clicking a link inside it would leave
// it open over the new page.
const RouteChangeCloser: React.FC<{ onChange: () => void }> = ({ onChange }) => {
  const location = useLocation();
  useEffect(() => { onChange(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

const Shell: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <RouteChangeCloser onChange={() => setMobileSidebarOpen(false)} />
      <Header onToggleSidebar={() => setMobileSidebarOpen(true)} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 py-8">
          <div className="sticky top-24">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-5">
                <img src="/logo.png" alt="Café Noir" className="h-6 w-auto" />
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 py-8 sm:py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:slug" element={<ArticlePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      <footer className="border-t border-gray-100 mt-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 text-center text-[11px] text-gray-400">
          Café Noir — Centre d'aide interne, réservé à l'équipe.
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
);
