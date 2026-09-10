import React, { useState } from 'react';
import { DailyContributionDay } from '../types';
import { DailyHeatmapData } from '../data/dashboardModel';
import { Calendar, Receipt, TrendingUp } from 'lucide-react';

interface ActivityHeatmapProps {
  data: DailyHeatmapData;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const [hoveredDay, setHoveredDay] = useState<DailyContributionDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyContributionDay | null>(null);

  const { weeks, monthLabels, totalSales, totalTickets, averageSales, maxDay } = data;

  const dayLabels = ['Lun', '', 'Mer', '', 'Ven', '', 'Dim'];

  // Color mapping according to intensity (0 to 4)
  const getCellFill = (intensity: number) => {
    switch (intensity) {
      case 0:
        return '#F3F4F6'; // gray-100
      case 1:
        return '#D1FAE5'; // emerald-100
      case 2:
        return '#6EE7B7'; // emerald-300
      case 3:
        return '#10B981'; // emerald-500
      case 4:
        return '#047857'; // emerald-700
      default:
        return '#F3F4F6';
    }
  };

  const activeDay = hoveredDay || selectedDay;

  // Layout calculations for responsive SVG
  const weeksCount = weeks.length;
  const svgWidth = 720;
  const svgHeight = 115;
  const labelWidth = 32;
  const availableWidth = svgWidth - labelWidth - 8;
  const colWidth = availableWidth / weeksCount;
  const cellWidth = Math.max(colWidth - 3, 16);
  const cellHeight = 10.5;
  const rowGap = 3.5;
  const topMargin = 20;

  return (
    <div
      id="daily-sales-activity-calendar"
      className="bg-white dark:bg-[#151D2A] rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-50 dark:border-gray-800/80">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Ventes par jour</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Calendrier d'activité
            </span>
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-400">
            Intensité du chiffre d'affaires quotidien de Café Noir sur les {weeksCount} dernières semaines
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 self-start sm:self-auto">
          <span>Moins</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 dark:bg-gray-800 inline-block" title="0 - 400 DT" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-100 dark:bg-emerald-950 inline-block" title="400 DT - 850 DT" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-300 dark:bg-emerald-800 inline-block" title="850 DT - 1400 DT" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-600 inline-block" title="1400 DT - 2100 DT" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700 dark:bg-emerald-400 inline-block" title="2100 DT+" />
          </div>
          <span>Plus</span>
        </div>
      </div>

      {/* Responsive & Intelligent SVG Calendar Heatmap */}
      <div className="pt-3 pb-1 w-full">
        <div className="w-full relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none block"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Month Labels along top */}
            {monthLabels.map((m, idx) => {
              const xPos = labelWidth + m.weekIndex * colWidth;
              return (
                <text
                  key={idx}
                  x={xPos}
                  y="12"
                  className="fill-gray-400 dark:fill-gray-500 text-[10px] font-semibold"
                  textAnchor="start"
                >
                  {m.label}
                </text>
              );
            })}

            {/* Day of week labels on left (Lun, Mer, Ven, Dim) */}
            {dayLabels.map((label, dIdx) => {
              if (!label) return null;
              const yPos = topMargin + dIdx * (cellHeight + rowGap) + cellHeight * 0.85;
              return (
                <text
                  key={dIdx}
                  x="0"
                  y={yPos}
                  className="fill-gray-400 dark:fill-gray-500 text-[9px] font-medium"
                >
                  {label}
                </text>
              );
            })}

            {/* Matrix of Days (weeksCount columns x 7 days) */}
            {weeks.map((week, wIdx) => {
              const xPos = labelWidth + wIdx * colWidth;
              return (
                <g key={wIdx}>
                  {week.map((day, dIdx) => {
                    const yPos = topMargin + dIdx * (cellHeight + rowGap);
                    const isHovered = activeDay?.date === day.date;
                    const fill = getCellFill(day.intensity);

                    return (
                      <rect
                        key={dIdx}
                        x={xPos}
                        y={yPos}
                        width={cellWidth}
                        height={cellHeight}
                        rx="2.5"
                        ry="2.5"
                        fill={fill}
                        className={`transition-all duration-150 cursor-pointer ${
                          isHovered
                            ? 'stroke-slate-900 dark:stroke-white stroke-[1.5px] filter drop-shadow-sm'
                            : 'stroke-transparent hover:stroke-emerald-400 stroke-[1px]'
                        }`}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => setSelectedDay(day)}
                      >
                        <title>
                          {`${day.date} : ${day.amount.toLocaleString()} DT (${day.tickets} tickets)`}
                        </title>
                      </rect>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Intelligent Interactive Day Details / Summary Footer */}
      <div className="pt-3 border-t border-gray-50 dark:border-gray-800/80 mt-1">
        {activeDay ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Calendar size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                  {activeDay.date}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  Activité journalière enregistrée au comptoir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block">Chiffre d'affaires</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {activeDay.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DT
                </span>
              </div>
              <div className="h-6 w-px bg-emerald-200 dark:bg-emerald-800" />
              <div>
                <span className="text-[10px] text-gray-400 block">Nombre de tickets</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {activeDay.tickets} tickets
                </span>
              </div>
              <div className="h-6 w-px bg-emerald-200 dark:bg-emerald-800" />
              <div>
                <span className="text-[10px] text-gray-400 block">Panier indicatif</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {(activeDay.amount / Math.max(activeDay.tickets, 1)).toFixed(2)} DT
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-gray-50/60 dark:bg-gray-800/40">
              <span className="text-[10px] text-gray-400 block">Cumul sur la période</span>
              <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                {totalSales.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} DT
              </span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50/60 dark:bg-gray-800/40">
              <span className="text-[10px] text-gray-400 block">Tickets encaissés</span>
              <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                {totalTickets.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50/60 dark:bg-gray-800/40">
              <span className="text-[10px] text-gray-400 block">Moyenne quotidienne</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                {averageSales.toLocaleString()} DT / jour
              </span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50/60 dark:bg-gray-800/40">
              <span className="text-[10px] text-gray-400 block">Journée record</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 text-xs sm:text-sm">
                {maxDay.amount.toLocaleString()} DT
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
