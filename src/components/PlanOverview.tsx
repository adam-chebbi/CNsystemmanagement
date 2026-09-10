import React, { useState } from 'react';
import { Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { CategoryShare } from '../data/dashboardModel';

interface PlanOverviewProps {
  categories: CategoryShare[];
  monthlyTarget: number;
  achievedToDate: number;
}

const formatDT = (v: number): string => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;

export const PlanOverview: React.FC<PlanOverviewProps> = ({ categories, monthlyTarget, achievedToDate }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Circle geometry for SVG donut (r=40 -> circumference = 2 * PI * 40 ≈ 251.32)
  const circumference = 251.32;
  const targetPercent = monthlyTarget > 0 ? Math.round((achievedToDate / monthlyTarget) * 1000) / 10 : 0;

  return (
    <div
      id="plan-overview-card"
      className="bg-white dark:bg-[#151D2A] rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-gray-800/80">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Vue d'ensemble du plan</span>
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-400">
            Objectifs & Répartition du plan d'exploitation
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
          Plan Café Noir
        </span>
      </div>

      {/* Plan target stat tags (3 summary metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
        {/* Objectif mensuel */}
        <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100/60 dark:border-blue-900/40 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Target size={12} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Objectif mois</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">{formatDT(monthlyTarget)}</p>
          </div>
        </div>

        {/* Réalisé à ce jour */}
        <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/40 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={12} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Réalisé</p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatDT(achievedToDate)}</p>
          </div>
        </div>

        {/* Progression globale */}
        <div className="p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100/60 dark:border-purple-900/40 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp size={12} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Progression</p>
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400">{targetPercent}%</p>
          </div>
        </div>
      </div>

      {/* Donut Chart & Category Breakdown Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-5 pb-2">
        {/* SVG Circular Donut Chart matching original graph type */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-gray-100 dark:stroke-gray-800"
              strokeWidth="9"
              fill="transparent"
            />

            {/* Render segments representing 100% of product sales breakdown */}
            {categories.map((cat) => {
              const dashLength = (circumference * cat.strokeLength) / 100;
              const dashGap = circumference - dashLength;
              const rotationAngle = (cat.strokeOffset / 100) * 360;
              const isSelected = hoveredCategory === cat.id;

              return (
                <circle
                  key={cat.id}
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={cat.color}
                  strokeWidth={isSelected ? '11' : '9'}
                  strokeDasharray={`${dashLength} ${dashGap}`}
                  strokeDashoffset="0"
                  transform={`rotate(${rotationAngle} 50 50)`}
                  fill="transparent"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Donut Center KPI Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {hoveredCategory
                ? `${categories.find((c) => c.id === hoveredCategory)?.percent}%`
                : `${targetPercent}%`}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-400 font-medium max-w-[80px] leading-tight">
              {hoveredCategory
                ? categories.find((c) => c.id === hoveredCategory)?.label.split('&')[0]
                : 'Objectif atteint'}
            </span>
          </div>
        </div>

        {/* Categories Legend with interactivity */}
        <div className="space-y-2 text-xs w-full sm:w-auto">
          {categories.map((cat) => {
            const isHovered = hoveredCategory === cat.id;
            return (
              <div
                key={cat.id}
                className={`flex items-center justify-between sm:justify-start gap-3 p-1 rounded-md transition cursor-pointer ${
                  isHovered ? 'bg-gray-50 dark:bg-gray-800/80' : ''
                }`}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span
                    className={`font-medium text-[11px] ${
                      isHovered
                        ? 'text-gray-900 dark:text-white font-bold'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  {cat.percent}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
