import React, { useMemo, useState } from 'react';
import { PointHistory } from '../types';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

interface Props {
  history: PointHistory[];
  currentPoints: number;
  playerName: string;
}

export const HamHistoryChart: React.FC<Props> = ({
  history,
  currentPoints,
  playerName,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Build time-series points including initial point if available
  const chartPoints = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }

    // Sort chronologically ascending
    const sorted = [...history].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );

    const data: Array<{
      time: string;
      rawDate: Date;
      points: number;
      diff: number;
      label: string;
    }> = [];

    // First initial base point before first recorded change if available
    const first = sorted[0];
    if (first) {
      const firstDate = new Date(first.created_at || Date.now());
      const initialDate = new Date(firstDate.getTime() - 60000);
      data.push({
        time: initialDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        rawDate: initialDate,
        points: Math.max(0, first.old_points),
        diff: 0,
        label: 'START',
      });
    }

    sorted.forEach((h, idx) => {
      const d = new Date(h.created_at || Date.now());
      data.push({
        time: d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        rawDate: d,
        points: h.new_points,
        diff: h.difference,
        label: `#${idx + 1}`,
      });
    });

    return data;
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="w-full py-10 px-4 flex flex-col items-center justify-center text-center bg-black/40 rounded-2xl border border-white/5 space-y-2.5">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059]">
          <Activity className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div className="text-sm font-serif italic text-gray-300 font-bold tracking-wider">
          NO HAM HISTORY RECORDED
        </div>
        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
          ディーラーによる加算・減算が行われると、ここに変動グラフが表示されます。
        </p>
      </div>
    );
  }

  // Calculate SVG dimensions
  const width = 600;
  const height = 220;
  const paddingX = 45;
  const paddingTop = 28;
  const paddingBottom = 40;

  const pointsOnly = chartPoints.map((p) => p.points);
  const minVal = Math.max(0, Math.min(...pointsOnly) * 0.85);
  const maxVal = Math.max(...pointsOnly, 100) * 1.12;
  const valRange = maxVal - minVal || 1;

  const getX = (index: number) => {
    if (chartPoints.length <= 1) return width / 2;
    return paddingX + (index / (chartPoints.length - 1)) * (width - paddingX * 2);
  };

  const getY = (points: number) => {
    return height - paddingBottom - ((points - minVal) / valRange) * (height - paddingTop - paddingBottom);
  };

  // Generate SVG path
  const pathD = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.points).toFixed(1)}`)
    .join(' ');

  // Gradient area path
  const areaD = `${pathD} L ${getX(chartPoints.length - 1).toFixed(1)} ${height - paddingBottom} L ${getX(0).toFixed(1)} ${height - paddingBottom} Z`;

  const hoveredPoint = hoveredIndex !== null ? chartPoints[hoveredIndex] : null;

  return (
    <div className="w-full bg-[#0D0D0D] rounded-2xl border border-[#C5A059]/20 p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C5A059]" />
          <span className="text-xs sm:text-sm font-serif italic text-gray-200 font-bold tracking-wider">
            HAM HISTORY GRAPH
          </span>
          <span className="text-[10px] text-gray-500 font-mono">({history.length} updates)</span>
        </div>
        <div className="text-xs font-mono text-[#C5A059] font-bold">
          CURRENT: {currentPoints.toLocaleString()} ham
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[2.6/1] min-h-[180px] max-h-[260px] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Casino Gold Area Gradient */}
            <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#C5A059" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0.0" />
            </linearGradient>
            {/* Line Gradient */}
            <linearGradient id="goldLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E5C07B" />
              <stop offset="50%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#F5D77F" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
            const val = Math.round(maxVal - ratio * valRange);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#goldAreaGrad)" />

          {/* Golden Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#goldLineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {chartPoints.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.points);
            const isHovered = hoveredIndex === idx;
            const isLatest = idx === chartPoints.length - 1;

            return (
              <g
                key={idx}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(idx)}
              >
                {/* Hit target */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />
                {/* Outer Ring */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? '9' : '7'}
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}
                {/* Main Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '5.5' : isLatest ? '5' : '3.5'}
                  fill={isLatest ? '#FFD700' : '#C5A059'}
                  stroke="#050505"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Hovered / Active Tooltip */}
        {hoveredPoint && hoveredIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-black/90 border border-[#C5A059] px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md transition-all duration-150"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              top: `${(getY(hoveredPoint.points) / height) * 100}%`,
              marginTop: '-12px',
            }}
          >
            <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold whitespace-nowrap">
              <span>{hoveredPoint.points.toLocaleString()} ham</span>
              {hoveredPoint.diff !== 0 && (
                <span
                  className={`text-[10px] font-bold ${
                    hoveredPoint.diff > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  ({hoveredPoint.diff > 0 ? `+${hoveredPoint.diff.toLocaleString()}` : hoveredPoint.diff.toLocaleString()})
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
              {hoveredPoint.time}
            </div>
          </div>
        )}
      </div>

      {/* Recent History Entries Pills */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-1.5">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          直近の変動履歴
        </span>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {[...history]
            .reverse()
            .slice(0, 5)
            .map((h, i) => (
              <div
                key={h.id || i}
                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-white/5 border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center gap-2">
                  {h.difference > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  ) : h.difference < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                  <span className="text-gray-300 font-mono text-[11px]">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleString('ja-JP', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '---'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold ${
                      h.difference > 0
                        ? 'text-green-400'
                        : h.difference < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {h.difference > 0 ? `+${h.difference.toLocaleString()}` : h.difference.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-[10px] font-mono">
                    残高: <strong className="text-[#C5A059]">{h.new_points.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
