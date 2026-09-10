import React, { useState } from 'react';
import { PurchasesDayPoint, buildPurchasesDailySeries } from '../data/dashboardModel';
import type { PurchaseOrder } from '../data/purchasesModel';

interface PurchasesChartProps {
  orders: PurchaseOrder[];
}

type WindowOption = 7 | 14 | 30;
const WINDOW_OPTIONS: { id: WindowOption; label: string }[] = [
  { id: 7, label: '7j' },
  { id: 14, label: '14j' },
  { id: 30, label: '30j' },
];

// Top-corners-only rounded bar (matches the reference chart's bar shape).
const roundedTopBarPath = (x: number, y: number, w: number, h: number, baseline: number): string => {
  const r = Math.min(4, h, w / 2);
  if (h <= 0) return '';
  return `M${x},${y + r} A${r},${r},0,0,1,${x + r},${y} L${x + w - r},${y} A${r},${r},0,0,1,${x + w},${y + r} L${x + w},${baseline} L${x},${baseline} Z`;
};

const formatDT = (v: number): string => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;

export const PurchasesChart: React.FC<PurchasesChartProps> = ({ orders }) => {
  const [windowDays, setWindowDays] = useState<WindowOption>(7);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data: PurchasesDayPoint[] = buildPurchasesDailySeries(orders, windowDays);

  const width = Math.max(700, windowDays * 26 + 100);
  const height = 300;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const baseline = paddingTop + chartHeight;

  const maxVal = Math.max(...data.map((d) => d.amount));
  const roundMax = Math.max(100, Math.ceil((maxVal * 1.15) / 100) * 100);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ value: roundMax * f, label: formatDT(roundMax * f) }));

  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(29, Math.max(8, slotWidth * 0.6));

  return (
    <div id="purchases-chart-card" className="rounded-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-1.5 p-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="tracking-tight text-base font-semibold text-gray-900 dark:text-white">Vue d'ensemble des achats</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Achats journaliers sur les {windowDays} derniers jours</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                id={`purchases-window-${opt.id}`}
                onClick={() => {
                  setWindowDays(opt.id);
                  setHoveredIdx(null);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium shrink-0 transition-all duration-150 cursor-pointer ${
                  windowDays === opt.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="p-2 sm:p-4 pt-4 sm:pt-5">
        <div className="w-full h-[260px] sm:h-[300px] overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-full select-none" style={{ minWidth: width }}>
            {/* Horizontal dashed grid + Y labels */}
            {yTicks.map((tick) => {
              const y = baseline - (tick.value / roundMax) * chartHeight;
              return (
                <g key={tick.value}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" className="text-primary/20" strokeDasharray="3 3" />
                  <text x={paddingLeft - 10} y={y + 3.5} textAnchor="end" className="text-[10px] fill-gray-400 dark:fill-gray-500 font-mono">
                    {tick.label}
                  </text>
                </g>
              );
            })}
            <line x1={paddingLeft} y1={baseline} x2={width - paddingRight} y2={baseline} stroke="currentColor" className="text-primary/40" />

            {/* Bars */}
            {data.map((pt, i) => {
              const slotCenterX = paddingLeft + i * slotWidth + slotWidth / 2;
              const barH = Math.max(2, (pt.amount / roundMax) * chartHeight);
              const barY = baseline - barH;
              const isHovered = hoveredIdx === i;

              return (
                <g key={pt.dateIso} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                  <path
                    d={roundedTopBarPath(slotCenterX - barWidth / 2, barY, barWidth, barH, baseline)}
                    className="fill-primary transition-opacity"
                    fillOpacity={isHovered ? 1 : 0.7}
                  />
                  {pt.amount > 0 && (
                    <text
                      x={slotCenterX}
                      y={barY - 5}
                      textAnchor="middle"
                      className={`text-[10px] font-semibold fill-primary ${windowDays > 14 ? 'hidden xl:block' : ''}`}
                    >
                      {formatDT(pt.amount)}
                    </text>
                  )}
                  <text
                    x={slotCenterX}
                    y={baseline + 18}
                    textAnchor="middle"
                    className={`text-[10px] font-medium transition-colors ${
                      isHovered ? 'fill-primary font-bold' : 'fill-gray-400 dark:fill-gray-500'
                    }`}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
