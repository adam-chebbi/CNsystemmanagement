import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MAIN_APP_URL } from '../config/site';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => (
  <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <Link to="/" className="flex items-center gap-2 shrink-0">
        <img src="/logo.png" alt="Café Noir" className="h-7 w-auto" />
        <span className="hidden sm:block text-sm font-extrabold text-gray-900 leading-tight">
          Aide &amp; Support
        </span>
      </Link>

      <div className="flex-1 max-w-xl hidden md:block">
        <SearchBar />
      </div>

      <a
        href={MAIN_APP_URL}
        className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition shrink-0"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Retour à l'application</span>
      </a>
    </div>
    <div className="md:hidden px-4 pb-3">
      <SearchBar />
    </div>
  </header>
);
