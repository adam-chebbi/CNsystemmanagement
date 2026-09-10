import React from 'react';
import { HourlySalesHeatmap } from '../data/dashboardModel';

interface ActivityHeatmapProps {
  data: HourlySalesHeatmap;
}

const LEVEL_CLASSES = ['bg-primary/5', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80', 'bg-primary'];

const computeLevel = (value: number, max: number): number => {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.6) return 3;
  if (ratio <= 0.8) return 4;
  return 5;
};

const formatDT = (v: number): string => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  return (
    <div
      id="hourly-sales-heatmap-card"
      className="rounded-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex flex-col space-y-1.5 p-5 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="tracking-tight text-base font-semibold text-gray-900 dark:text-white">Ventes par heure et par jour</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Les 7 derniers jours · plus sombre = plus occupé</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span>Faible</span>
            <div className="w-4 h-4 rounded-sm bg-primary/20" />
            <div className="w-4 h-4 rounded-sm bg-primary/40" />
            <div className="w-4 h-4 rounded-sm bg-primary/60" />
            <div className="w-4 h-4 rounded-sm bg-primary/80" />
            <div className="w-4 h-4 rounded-sm bg-primary" />
            <span>Très haut</span>
          </div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="p-4 overflow-x-auto flex-1 flex flex-col">
        <div className="min-w-[640px]">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">00:00 — 23:59</p>

          {/* Hour column headers */}
          <div className="flex items-center mb-2 gap-1.5">
            <div className="w-10 shrink-0" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-gray-400 dark:text-gray-500">
                {h.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* One row per day */}
          {data.days.map((day) => (
            <div key={day.dateIso} className="flex items-center mb-2 gap-1.5">
              <div className="w-10 shrink-0 text-xs text-gray-400 dark:text-gray-500 text-right pr-2">{day.label}</div>
              {day.hours.map((value, hour) => {
                const level = computeLevel(value, data.maxValue);
                return (
                  <div
                    key={hour}
                    title={`${day.label} ${hour.toString().padStart(2, '0')}h — ${formatDT(value)}`}
                    className={`flex-1 aspect-square rounded-sm cursor-pointer transition-transform hover:scale-125 hover:z-10 ${LEVEL_CLASSES[level]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
