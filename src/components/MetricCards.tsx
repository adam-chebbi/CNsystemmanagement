import React, { useState } from 'react';
import {
  Receipt,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Users2,
  Package,
  ReceiptText,
  Percent,
} from 'lucide-react';
import { DashboardPeriodData } from '../data/dashboardModel';

interface MetricCardsProps {
  data: DashboardPeriodData;
  compareWithPrevious: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  data,
  compareWithPrevious,
}) => {
  const [showMoreKpis, setShowMoreKpis] = useState(false);

  // 5 core cards as requested - preserved with their exact visual styling and colors
  const coreCards = [
    {
      id: 'total-sales',
      title: 'Ventes totales',
      amount: data.turnover,
      subtitle: compareWithPrevious ? `${data.turnoverChange} vs période préc.` : 'ventes de la période',
      change: data.turnoverChange,
      accentColor: 'emerald' as const,
      iconType: 'receipt' as const,
      hasTopArrow: true,
    },
    {
      id: 'total-purchases',
      title: 'Achat total des biens et services',
      amount: data.purchases,
      subtitle: compareWithPrevious
        ? `${data.purchasesChange} vs période préc.`
        : 'achats de la période',
      change: data.purchasesChange,
      accentColor: 'blue' as const,
      iconType: 'cart' as const,
      hasTopArrow: true,
    },
    {
      id: 'total-expenses',
      title: 'Total des dépenses',
      amount: data.expenses,
      subtitle: compareWithPrevious
        ? `${data.expensesChange} vs période préc.`
        : 'dépenses approuvées',
      change: data.expensesChange,
      accentColor: 'rose' as const,
      iconType: 'wallet' as const,
      hasTopArrow: true,
    },
    {
      id: 'monthly-sales',
      title: 'Ventes mensuelles',
      amount: data.monthlyTurnover,
      subtitle: `${data.monthlyTurnoverChange} par rapport au mois précédent`,
      change: data.monthlyTurnoverChange,
      accentColor: 'purple' as const,
      iconType: 'trending' as const,
      hasTopArrow: false,
    },
    {
      id: 'monthly-purchases',
      title: 'Achats mensuels',
      amount: data.monthlyPurchases,
      subtitle: 'ce mois-ci',
      change: data.monthlyPurchasesChange,
      accentColor: 'sky' as const,
      iconType: 'coins' as const,
      hasTopArrow: false,
    },
  ];

  // 4 additional non-duplicated KPI cards (Panier moyen removed as requested)
  const additionalKpis = [
    {
      id: 'staff-cost',
      title: 'Coût du personnel',
      amount: data.staffCost,
      subtitle: compareWithPrevious
        ? `${data.staffCostChange} (${data.staffCostRatio})`
        : data.staffCostRatio,
      change: data.staffCostChange,
      accentColor: 'amber' as const,
      icon: Users2,
    },
    {
      id: 'stock-value',
      title: 'Valeur du stock',
      amount: data.stockValue,
      subtitle: 'Valeur actuelle du stock (instantané)',
      change: undefined,
      accentColor: 'teal' as const,
      icon: Package,
    },
    {
      id: 'ticket-count',
      title: 'Nombre de tickets',
      amount: `${data.ticketCount} tickets`,
      subtitle: compareWithPrevious
        ? `${data.ticketCountChange} (${data.itemsPerTicket})`
        : data.itemsPerTicket,
      change: data.ticketCountChange,
      accentColor: 'indigo' as const,
      icon: ReceiptText,
    },
    {
      id: 'estimated-margin',
      title: 'Marge estimée',
      amount: data.estimatedMargin,
      subtitle: compareWithPrevious
        ? `${data.estimatedMarginChange} (taux: ${data.marginPercent})`
        : `${data.marginPercent} de marge brute`,
      change: data.estimatedMarginChange,
      accentColor: 'emerald' as const,
      icon: Percent,
    },
  ];

  const getCoreIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <Receipt size={16} />;
      case 'cart':
        return <ShoppingCart size={16} />;
      case 'wallet':
        return <Wallet size={16} />;
      case 'trending':
        return <TrendingUp size={16} />;
      case 'coins':
      case 'dollar':
        return <Coins size={16} />;
      default:
        return <Receipt size={16} />;
    }
  };

  const getStyleConfigs = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
          titleColor: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-100 dark:border-emerald-950/80',
          circleBg: 'bg-emerald-50/70 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
          titleColor: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-100 dark:border-blue-950/80',
          circleBg: 'bg-blue-50/70 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
          badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
          titleColor: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-100 dark:border-rose-950/80',
          circleBg: 'bg-rose-50/70 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
          badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
          titleColor: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-100 dark:border-purple-950/80',
          circleBg: 'bg-purple-50/70 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
          badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        };
      case 'sky':
        return {
          iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
          titleColor: 'text-sky-600 dark:text-sky-400',
          border: 'border-sky-100 dark:border-sky-950/80',
          circleBg: 'bg-sky-50/70 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
          badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
          titleColor: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-100 dark:border-amber-950/80',
          circleBg: 'bg-amber-50/70 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        };
      case 'teal':
        return {
          iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
          titleColor: 'text-teal-600 dark:text-teal-400',
          border: 'border-teal-100 dark:border-teal-950/80',
          circleBg: 'bg-teal-50/70 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
          badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
          titleColor: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-100 dark:border-indigo-950/80',
          circleBg: 'bg-indigo-50/70 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
          badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
        };
      default:
        return {
          iconBg: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
          titleColor: 'text-gray-600 dark:text-gray-300',
          border: 'border-gray-100 dark:border-gray-800',
          circleBg: 'bg-gray-50 text-gray-600',
          badge: 'bg-gray-100 text-gray-700',
        };
    }
  };

  return (
    <div id="metric-cards-section" className="space-y-3">
      {/* 5 Classic Core Metric Cards */}
      <div
        id="metric-cards-container"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        {coreCards.map((card) => {
          const style = getStyleConfigs(card.accentColor);
          const isMonthlySales = card.id === 'monthly-sales';

          return (
            <div
              key={card.id}
              id={`metric-card-${card.id}`}
              className={`relative p-4 rounded-xl bg-white dark:bg-[#151D2A] border ${style.border} shadow-2xs hover:shadow-xs transition flex flex-col justify-between`}
            >
              {/* Top row icons */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.iconBg}`}
                >
                  {getCoreIcon(card.iconType)}
                </div>

                {card.hasTopArrow && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${style.circleBg}`}
                  >
                    <ArrowUpRight size={13} />
                  </div>
                )}
                {card.accentColor === 'purple' && (
                  <div className="w-6 h-6 rounded-full bg-purple-50/50 dark:bg-purple-900/30" />
                )}
                {card.accentColor === 'sky' && (
                  <div className="w-6 h-6 rounded-full bg-sky-50/50 dark:bg-sky-900/30" />
                )}
              </div>

              {/* Label & Amount */}
              <div className="space-y-1">
                <p className={`text-[11px] font-medium leading-tight ${style.titleColor}`}>
                  {card.title}
                </p>
                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {card.amount}
                </h3>
              </div>

              {/* Subtitle / Comparison */}
              <div className="pt-2 text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
                {isMonthlySales ? (
                  <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-medium">
                    {data.monthlyTurnoverChange.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{data.monthlyTurnoverChange} par rapport au mois précédent</span>
                  </span>
                ) : compareWithPrevious && card.change ? (
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      card.change.startsWith('+')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {card.change.startsWith('+') ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}
                    <span>{card.subtitle}</span>
                  </span>
                ) : (
                  <span>{card.subtitle}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Button to see more KPI cards: Coût du personnel, Valeur du stock, Nombre de tickets, Marge estimée */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          {showMoreKpis
            ? "9 indicateurs d'exploitation affichés pour Café Noir"
            : '5 indicateurs principaux affichés'}
        </span>

        <button
          id="toggle-more-kpis-button"
          onClick={() => setShowMoreKpis(!showMoreKpis)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition active:scale-98 cursor-pointer"
        >
          <SlidersHorizontal size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>
            {showMoreKpis
              ? 'Masquer les indicateurs additionnels'
              : "Voir plus d'indicateurs (KPIs)"}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            +4
          </span>
          {showMoreKpis ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Additional 4 KPI cards shown when toggled */}
      {showMoreKpis && (
        <div
          id="additional-kpi-cards-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1 animate-in fade-in slide-in-from-top-2"
        >
          {additionalKpis.map((kpi) => {
            const style = getStyleConfigs(kpi.accentColor);
            const IconComponent = kpi.icon;

            return (
              <div
                key={kpi.id}
                id={`additional-kpi-${kpi.id}`}
                className={`relative p-4 rounded-xl bg-white dark:bg-[#151D2A] border ${style.border} shadow-2xs hover:shadow-xs transition flex flex-col justify-between`}
              >
                {/* Top icon and badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.iconBg}`}
                  >
                    <IconComponent size={16} />
                  </div>

                  {compareWithPrevious && kpi.change && (
                    <div
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        kpi.change.startsWith('+')
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      {kpi.change.startsWith('+') ? (
                        <ArrowUpRight size={10} />
                      ) : (
                        <ArrowDownRight size={10} />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  )}
                </div>

                {/* Label & Amount */}
                <div className="space-y-1">
                  <p className={`text-[11px] font-medium leading-tight ${style.titleColor}`}>
                    {kpi.title}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {kpi.amount}
                  </h3>
                </div>

                {/* Subtitle */}
                <div className="pt-2 text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
                  <span>{kpi.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
