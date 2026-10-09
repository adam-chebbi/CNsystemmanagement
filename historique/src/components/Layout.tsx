import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calculator,
  CloudOff,
  Download,
  ExternalLink,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  NotebookPen,
  Plus,
  Receipt,
  RefreshCw,
  ScrollText,
  Settings,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { addDays, formatDateFr, JOURNEE_STATUT_LABELS } from '../../shared/model';
import { flushOutbox, useOutbox } from '../api/outbox';
import { useAuth } from '../auth/AuthContext';
import { useJournee } from '../lib/JourneeContext';
import { applyUpdate, useInstallPrompt, useUpdateAvailable } from '../lib/pwa';
import { navigate, useRoute, type PageId } from '../lib/router';
import { Badge } from './ui';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  show?: boolean;
}

export const MAIN_APP_URL = 'https://system.cafenoir.tn';

const useNav = (): { heading: string; items: NavItem[] }[] => {
  const { canConfigure } = useAuth();
  const sections: { heading: string; items: NavItem[] }[] = [
    {
      heading: 'La journée',
      items: [
        { id: 'journee', label: 'Tableau de la journée', icon: LayoutDashboard },
        { id: 'ventes', label: 'Ventes', icon: Receipt },
        { id: 'depenses', label: 'Dépenses', icon: Wallet },
        { id: 'ca', label: "Chiffre d'affaires (Z)", icon: ScrollText },
        { id: 'comptage', label: 'Comptage de caisse', icon: Calculator },
        { id: 'mouvements', label: 'Mouvements de caisse', icon: ArrowLeftRight },
        { id: 'cloture', label: 'Clôture de la journée', icon: Lock },
      ],
    },
    {
      heading: 'Suivi',
      items: [
        { id: 'notes', label: 'Notes & incidents', icon: NotebookPen },
        { id: 'credits', label: 'Crédits clients', icon: Users },
        { id: 'historique', label: 'Historique', icon: CalendarDays },
        { id: 'journal', label: "Journal d'activité", icon: History },
      ],
    },
    {
      heading: 'Compte',
      items: [
        { id: 'parametres', label: 'Paramètres', icon: Settings, show: canConfigure },
        { id: 'compte', label: 'Mon compte', icon: UserRound },
      ],
    },
  ];
  return sections.map((s) => ({ ...s, items: s.items.filter((i) => i.show !== false) }));
};

export const PAGE_TITLES: Record<PageId, string> = {
  journee: 'Tableau de la journée',
  ventes: 'Ventes',
  depenses: 'Dépenses',
  ca: "Chiffre d'affaires",
  comptage: 'Comptage de caisse',
  mouvements: 'Mouvements de caisse',
  cloture: 'Clôture',
  notes: 'Notes & incidents',
  credits: 'Crédits clients',
  historique: 'Historique',
  journal: "Journal d'activité",
  parametres: 'Paramètres',
  compte: 'Mon compte',
};

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { page } = useRoute();
  const { user, logout } = useAuth();
  const sections = useNav();
  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs no-print" />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] w-64 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300 no-print ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] flex items-center gap-2">
          <img src="/logo.png" alt="Café Noir" className="h-8 w-auto object-contain" />
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Historique</p>
            <p className="text-[11px] text-gray-400">& Comptage</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Fermer le menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-1 custom-scrollbar">
          {sections.map((s) => (
            <div key={s.heading} className="px-1.5 mt-3">
              <p className="px-2 pb-1 text-[13px] font-bold text-gray-500">{s.heading}</p>
              <ul className="flex flex-col gap-0.5">
                {s.items.map((item) => {
                  const active = page === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          navigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-2 h-9 px-2 rounded-md text-sm text-left transition-colors cursor-pointer ${
                          active ? 'bg-[#E8F8F2] text-[#00A86B] font-semibold' : 'text-gray-600 hover:bg-[#E8F8F2] hover:text-[#00A86B]'
                        }`}
                      >
                        <item.icon size={16} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 px-1">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
              {(user?.fullName ?? '?').trim().slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.isSuperAdmin ? 'Super Admin' : user?.roleName}</p>
            </div>
            <button onClick={() => void logout()} className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Déconnexion" aria-label="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const DateSwitcher: React.FC = () => {
  const { date, setDate, isToday, day } = useJournee();
  const { businessDate } = useAuth();
  const statut = day?.journee?.statut;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <button onClick={() => setDate(addDays(date, -1))} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer" aria-label="Jour précédent">
        <ChevronLeft size={16} />
      </button>
      <label className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer min-w-0">
        <CalendarDays size={14} className="text-emerald-600 shrink-0" />
        <span className="text-xs font-semibold text-gray-800 truncate capitalize">{isToday ? "Aujourd'hui" : formatDateFr(date)}</span>
        <input
          type="date"
          value={date}
          max={businessDate}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Choisir la journée"
        />
      </label>
      <button
        onClick={() => setDate(addDays(date, 1))}
        disabled={date >= businessDate}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Jour suivant"
      >
        <ChevronRight size={16} />
      </button>
      {statut && (
        <Badge tone={statut === 'ouverte' ? 'emerald' : statut === 'cloturee' ? 'amber' : 'blue'} className="hidden sm:inline-flex">
          {statut !== 'ouverte' && <Lock size={10} />}
          {JOURNEE_STATUT_LABELS[statut]}
        </Badge>
      )}
      {!isToday && (
        <button onClick={() => setDate(null)} className="hidden sm:inline-flex text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer ml-1">
          Revenir à aujourd'hui
        </button>
      )}
    </div>
  );
};

// Pages whose content is "one journée" get the day switcher in the header.
const DAY_PAGES: PageId[] = ['journee', 'ventes', 'depenses', 'ca', 'comptage', 'mouvements', 'cloture'];

const Banners: React.FC = () => {
  const pending = useOutbox();
  const [online, setOnline] = useState(() => navigator.onLine);
  const updateAvailable = useUpdateAvailable();
  const { stale } = useJournee();
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  const failed = pending.filter((p) => p.error);
  return (
    <div className="no-print">
      {(!online || stale) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs">
          <CloudOff size={14} className="shrink-0" />
          <span className="flex-1">Hors ligne — vos nouvelles saisies sont gardées sur l’appareil et seront envoyées dès le retour de la connexion.</span>
        </div>
      )}
      {pending.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-2 text-xs ${failed.length ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>
          <RefreshCw size={14} className="shrink-0" />
          <span className="flex-1">
            {pending.length} saisie(s) en attente d’envoi{failed.length ? ` dont ${failed.length} refusée(s) — à vérifier` : ''}.
          </span>
          <button onClick={() => (failed.length ? navigate('compte') : void flushOutbox())} className="font-semibold underline cursor-pointer">
            {failed.length ? 'Voir' : 'Envoyer'}
          </button>
        </div>
      )}
      {updateAvailable && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs">
          <Download size={14} className="shrink-0" />
          <span className="flex-1">Une nouvelle version est disponible.</span>
          <button onClick={applyUpdate} className="font-semibold underline cursor-pointer">
            Mettre à jour
          </button>
        </div>
      )}
    </div>
  );
};

const QUICK_ACTIONS: { label: string; page: PageId; icon: NavItem['icon']; tone: string }[] = [
  { label: 'Vente', page: 'ventes', icon: Receipt, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Dépense', page: 'depenses', icon: Wallet, tone: 'bg-rose-50 text-rose-700' },
  { label: 'Mouvement de caisse', page: 'mouvements', icon: ArrowLeftRight, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Note / incident', page: 'notes', icon: NotebookPen, tone: 'bg-amber-50 text-amber-700' },
  { label: 'Comptage', page: 'comptage', icon: Calculator, tone: 'bg-violet-50 text-violet-700' },
  { label: 'Ticket Z', page: 'ca', icon: ScrollText, tone: 'bg-gray-100 text-gray-700' },
];

const BottomBar: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const { page } = useRoute();
  const [sheet, setSheet] = useState(false);
  const tab = (id: PageId, label: string, Icon: NavItem['icon']) => (
    <button onClick={() => navigate(id)} className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold cursor-pointer ${page === id ? 'text-emerald-600' : 'text-gray-500'}`}>
      <Icon size={20} />
      {label}
    </button>
  );
  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center px-2 pb-[env(safe-area-inset-bottom)] no-print">
        {tab('journee', 'Journée', LayoutDashboard)}
        {tab('depenses', 'Dépenses', Wallet)}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => setSheet(true)}
            className="-mt-6 w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition cursor-pointer"
            aria-label="Nouvelle saisie"
          >
            <Plus size={26} />
          </button>
        </div>
        {tab('comptage', 'Comptage', Calculator)}
        <button onClick={onMenu} className="flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold text-gray-500 cursor-pointer">
          <Menu size={20} />
          Menu
        </button>
      </nav>
      {sheet && (
        <div className="fixed inset-0 z-[60] flex items-end lg:hidden no-print">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-sheet-up">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-900 mb-3 px-1">Nouvelle saisie</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => {
                    setSheet(false);
                    navigate(a.page, { nouveau: '1' });
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 active:scale-98 transition cursor-pointer"
                >
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.tone}`}>
                    <a.icon size={20} />
                  </span>
                  <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { page } = useRoute();
  const { canInstall, promptInstall } = useInstallPrompt();

  useEffect(() => {
    document.getElementById('app-main-scroll-area')?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="flex h-[100dvh] w-full bg-gray-50/60 overflow-hidden">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-[#fcfcfc]/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden p-1.5 rounded-lg border border-gray-200 text-gray-500 cursor-pointer" aria-label="Menu">
              <Menu size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-800 truncate hidden md:block">{PAGE_TITLES[page]}</span>
            <div className="flex-1 flex md:justify-center min-w-0">{DAY_PAGES.includes(page) ? <DateSwitcher /> : <span className="md:hidden text-sm font-semibold text-gray-800 truncate">{PAGE_TITLES[page]}</span>}</div>
            <div className="hidden sm:flex items-center gap-1.5">
              {canInstall && (
                <button onClick={() => void promptInstall()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                  <Download size={14} /> Installer
                </button>
              )}
              <a href={MAIN_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100">
                <ExternalLink size={13} /> Café Noir
              </a>
            </div>
          </div>
        </header>
        <Banners />
        <main id="app-main-scroll-area" className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-28 lg:pb-10">{children}</div>
        </main>
      </div>
      <BottomBar onMenu={() => setMenuOpen(true)} />
    </div>
  );
};
