import React, { useState } from 'react';
import {
  ChevronDown,
  PanelLeft,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onRefresh,
  isRefreshing,
  isCollapsed = false,
  onToggleCollapse,
  activeTab = 'dashboard',
  onNavigate,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggleSidebar();
    } else if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      onToggleSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Collapsible Sidebar Icon + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            id="header-toggle-sidebar-button"
            onClick={handleToggleSidebar}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isCollapsed
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            title={isCollapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale (icônes seules)'}
          >
            <PanelLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'sales' ? (
              <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <button
                  onClick={() => onNavigate?.('dashboard')}
                  className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition cursor-pointer"
                >
                  Tableau de bord
                </button>
                <span className="text-gray-400 text-xs">&gt;</span>
                <span className="text-gray-600 dark:text-gray-300 font-medium hidden sm:inline">
                  Gestion des ventes
                </span>
                <span className="text-gray-400 text-xs hidden sm:inline">&gt;</span>
                <span className="font-bold text-gray-900 dark:text-white">Ventes</span>
              </nav>
            ) : (
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Tableau de bord
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls (Company user profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Company User profile dropdown */}
          <div className="relative">
            <button
              id="header-user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Company profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:block text-left pr-1">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  Company
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                  company@example.com
                </div>
              </div>
              <ChevronDown size={13} className="text-gray-400 hidden sm:inline" />
            </button>

            {showUserMenu && (
              <div
                id="user-dropdown-menu"
                className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 z-50 animate-in fade-in"
              >
                <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">Company</p>
                  <p className="text-[11px] text-gray-400 truncate">company@example.com</p>
                </div>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                  Paramètres du compte
                </button>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                  Préférences
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
