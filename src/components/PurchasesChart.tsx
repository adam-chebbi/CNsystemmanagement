import React, { useState } from 'react';
import { PurchaseSeriesPoint } from '../data/dashboardModel';
import { ShoppingCart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface PurchasesChartProps {
  data: { days: PurchaseSeriesPoint[]; months: PurchaseSeriesPoint[]; years: PurchaseSeriesPoint[] };
  compareWithPrevious?: boolean;
}

export const PurchasesChart: React.FC<PurchasesChartProps> = ({ data: purchasesByPeriod, compareWithPrevious = true }) => {
  const [activeTab, setActiveTab] = useState<'days' | 'months' | 'years'>('days');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = purchasesByPeriod[activeTab];

  const width = 800;
  const height = 270;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.current, d.previous || 0))
  );
  const roundMax = Math.max(100, Math.ceil((maxVal * 1.15) / 100) * 100);

  const yTicks = [
    { label: `${roundMax.toLocaleString()} DT`, value: roundMax },
    { label: `${Math.round(roundMax * 0.75).toLocaleString()} DT`, value: roundMax * 0.75 },
    { label: `${Math.round(roundMax * 0.5).toLocaleString()} DT`, value: roundMax * 0.5 },
    { label: `${Math.round(roundMax * 0.25).toLocaleString()} DT`, value: roundMax * 0.25 },
    { label: '0 DT', value: 0 },
  ];

  const barCount = data.length;
  const slotWidth = chartWidth / barCount;
  const singleBarWidth = Math.min(22, Math.max(8, slotWidth * 0.32));

  const totalCurrent = data.reduce((acc, d) => acc + d.current, 0);
  const totalPrevious = data.reduce((acc, d) => acc + (d.previous || 0), 0);
  const diffPercent = (totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : totalCurrent > 0 ? 100 : 0).toFixed(1);

  return (
    <div
      id="purchases-chart-card"
      className="bg-white dark:bg-[#151D2A] rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 shadow-2xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-50 dark:border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Achats par jours
            </h3>
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                Number(diffPercent) <= 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
              }`}
            >
              {Number(diffPercent) <= 0 ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
              <span>{diffPercent}% vs précédente</span>
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-400">
            Approvisionnements de café, laits et stocks par rapport à la période précédente
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-blue-500" />
              <span>Période en cours</span>
            </span>
            {compareWithPrevious && (
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-300 dark:bg-slate-700" />
                <span>Période précédente</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/60 p-1 rounded-full border border-gray-100 dark:border-gray-700/60">
            {(
              [
                { id: 'days', label: 'Jours' },
                { id: 'months', label: 'Mois' },
                { id: 'years', label: 'Année' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                id={`purchases-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative w-full pt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] overflow-visible select-none"
        >
          {/* Horizontal Grid lines and Y labels */}
          {yTicks.map((tick) => {
            const y = paddingTop + chartHeight - (tick.value / roundMax) * chartHeight;
            return (
              <g key={tick.value}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeOpacity="0.6"
                  strokeDasharray="3 3"
                  className="dark:stroke-gray-800"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400 dark:fill-gray-500 font-mono"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Bars rendering */}
          {data.map((pt, i) => {
            const slotCenterX = paddingLeft + i * slotWidth + slotWidth / 2;
            const barCurrentH = Math.max(3, (pt.current / roundMax) * chartHeight);
            const barPrevH = Math.max(3, ((pt.previous || 0) / roundMax) * chartHeight);

            const isHovered = hoveredIdx === i;

            return (
              <g
                key={pt.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background hover bar highlight */}
                {isHovered && (
                  <rect
                    x={slotCenterX - slotWidth / 2}
                    y={paddingTop}
                    width={slotWidth}
                    height={chartHeight}
                    fill="#3B82F6"
                    fillOpacity="0.06"
                    rx={6}
                  />
                )}

                {/* Previous Period Bar (Muted) */}
                {compareWithPrevious && (
                  <rect
                    x={slotCenterX - singleBarWidth - 1.5}
                    y={paddingTop + chartHeight - barPrevH}
                    width={singleBarWidth}
                    height={barPrevH}
                    rx={3}
                    className="fill-slate-300 dark:fill-slate-700 transition-opacity"
                    fillOpacity={isHovered ? 1 : 0.85}
                  />
                )}

                {/* Current Period Bar (Blue) */}
                <rect
                  x={compareWithPrevious ? slotCenterX + 1.5 : slotCenterX - singleBarWidth / 2}
                  y={paddingTop + chartHeight - barCurrentH}
                  width={compareWithPrevious ? singleBarWidth : singleBarWidth * 1.3}
                  height={barCurrentH}
                  rx={3}
                  className="fill-blue-600 dark:fill-blue-500 transition-opacity"
                  fillOpacity={isHovered ? 1 : 0.9}
                />

                {/* X axis Label */}
                <text
                  x={slotCenterX}
                  y={paddingTop + chartHeight + 20}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                      : 'fill-gray-400 dark:fill-gray-500'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute top-2 right-4 bg-slate-900/90 text-white rounded-xl px-3 py-2 text-xs shadow-lg backdrop-blur-xs border border-slate-800 space-y-1 pointer-events-none animate-in fade-in"
          >
            <div className="font-bold border-b border-slate-700/80 pb-1 text-blue-400 flex items-center justify-between gap-3">
              <span>{data[hoveredIdx].label}</span>
              <span className="text-[10px] font-normal text-slate-300">{data[hoveredIdx].labelDetail}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Achats actuels :</span>
              <span className="font-bold text-white">{data[hoveredIdx].current.toLocaleString()} DT</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Période précédente :</span>
              <span className="text-slate-300">{data[hoveredIdx].previous?.toLocaleString()} DT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
