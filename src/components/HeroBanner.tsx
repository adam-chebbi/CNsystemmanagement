import React from 'react';
import {
  Bell,
  Monitor,
  Package,
  Users,
  FileText,
} from 'lucide-react';

interface HeroBannerProps {
  onActionClick?: (action: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onActionClick }) => {
  return (
    <div
      id="hero-greeting-banner"
      className="relative overflow-hidden rounded-2xl bg-[#0F172A] dark:bg-[#0B1120] text-white p-6 sm:p-7 shadow-sm border border-slate-800"
    >
      {/* Background ambient starry accents */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] mix-blend-screen" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left greeting & day's summary */}
        <div className="space-y-2 max-w-xl">
          <p className="text-xs sm:text-sm text-slate-400 font-normal">Je vous salue ,</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Café Noir <span className="text-2xl animate-pulse">☕</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Voici ce qui se passe dans votre café aujourd'hui.
          </p>

          {/* Today's sales pill banner */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-xs">
              <span className="flex items-center gap-1 text-[8px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
              <span>3,250.00 DT Les ventes de ce jour</span>
            </div>
          </div>
        </div>

        {/* Right side stats & quick action tiles */}
        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full lg:w-auto">
          {/* Stat 1: Today's sales */}
          <div
            id="hero-stat-today-sales"
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 min-w-[140px] backdrop-blur-sm"
          >
            <div className="text-lg font-bold text-white tracking-tight">3,250.00 DT</div>
            <div className="text-[11px] text-slate-400">Aujourd'hui, les ventes</div>
          </div>

          {/* Stat 2: Growth */}
          <div
            id="hero-stat-growth"
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 min-w-[120px] backdrop-blur-sm"
          >
            <div className="text-lg font-bold text-emerald-400 tracking-tight">89%</div>
            <div className="text-[11px] text-slate-400">La croissance</div>
          </div>

          {/* Quick icon actions */}
          <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-0 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {/* Notifications */}
            <button
              id="hero-quick-notifications"
              onClick={() => onActionClick?.('notifications')}
              className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white transition"
              title="Les notifications"
            >
              <div className="relative p-2 rounded-lg bg-slate-800/60 group-hover:bg-slate-800 border border-slate-700/50 transition">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 whitespace-nowrap">
                Les notifications
              </span>
            </button>

            {/* POS */}
            <button
              id="hero-quick-pos"
              onClick={() => onActionClick?.('pos')}
              className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white transition"
              title="Le point de vente"
            >
              <div className="p-2 rounded-lg bg-slate-800/60 group-hover:bg-slate-800 border border-slate-700/50 transition">
                <Monitor size={18} />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 whitespace-nowrap">
                Le point de vente
              </span>
            </button>

            {/* Products */}
            <button
              id="hero-quick-products"
              onClick={() => onActionClick?.('products')}
              className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white transition"
              title="Produits"
            >
              <div className="p-2 rounded-lg bg-slate-800/60 group-hover:bg-slate-800 border border-slate-700/50 transition">
                <Package size={18} />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 whitespace-nowrap">
                Produits
              </span>
            </button>

            {/* Clients */}
            <button
              id="hero-quick-clients"
              onClick={() => onActionClick?.('clients')}
              className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white transition"
              title="Les clients"
            >
              <div className="p-2 rounded-lg bg-slate-800/60 group-hover:bg-slate-800 border border-slate-700/50 transition">
                <Users size={18} />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 whitespace-nowrap">
                Les clients
              </span>
            </button>

            {/* Reports */}
            <button
              id="hero-quick-reports"
              onClick={() => onActionClick?.('reports')}
              className="flex flex-col items-center gap-1 group text-slate-400 hover:text-white transition"
              title="Rapports sur les"
            >
              <div className="p-2 rounded-lg bg-slate-800/60 group-hover:bg-slate-800 border border-slate-700/50 transition">
                <FileText size={18} />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 whitespace-nowrap">
                Rapports sur les
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
