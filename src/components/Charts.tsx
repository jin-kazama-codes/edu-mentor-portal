/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for our custom chart propss ..
interface DataPoint {
  [key: string]: string | number;
}

interface CustomChartProps {
  data: DataPoint[];
  xAxisKey: string;
  series: {
    key: string;
    color: string;
    label: string;
    type?: 'line' | 'bar' | 'area';
  }[];
}

export function CustomAreaLineChart({ data, xAxisKey, series }: CustomChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parse dimensions
  const width = 500;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Extract all numeric values to scale the Y axis
  const allValues = data.flatMap((d) =>
    series.map((s) => Number(d[s.key] || 0))
  );
  const maxValue = Math.max(...allValues, 100);
  const minValue = 0;
  const yRange = maxValue - minValue;

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minValue) / yRange) * chartHeight;
  };

  return (
    <div className="relative w-full select-none aspect-[500/240]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Gradients definitions */}
        <defs>
          {series.map((s, idx) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          const val = Math.round(maxValue - ratio * yRange);
          return (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                className="font-mono text-[9px] fill-slate-400 text-right"
                textAnchor="end"
              >
                {val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          const x = getX(idx);
          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              className="font-sans text-[10px] fill-slate-400 font-medium"
              textAnchor="middle"
            >
              {String(d[xAxisKey])}
            </text>
          );
        })}

        {/* Vertical alignment line on Hover */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={paddingTop}
            x2={getX(hoveredIndex)}
            y2={paddingTop + chartHeight}
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="opacity-70"
          />
        )}

        {/* Render area charts first */}
        {series.map((s) => {
          const points = data.map((d, idx) => `${getX(idx)},${getY(Number(d[s.key] || 0))}`);
          const areaPath = `
            M ${getX(0)},${paddingTop + chartHeight}
            L ${points.join(' L ')}
            L ${getX(data.length - 1)},${paddingTop + chartHeight}
            Z
          `;

          return (
            <motion.path
              key={`area-${s.key}`}
              d={areaPath}
              fill={`url(#grad-${s.key})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          );
        })}

        {/* Render Line Paths */}
        {series.map((s) => {
          const points = data.map((d, idx) => `${getX(idx)},${getY(Number(d[s.key] || 0))}`);
          const linePath = `M ${points.join(' L ')}`;

          return (
            <motion.path
              key={`line-${s.key}`}
              d={linePath}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          );
        })}

        {/* Render Dots on hover or points */}
        {series.map((s) => {
          return data.map((d, idx) => {
            const x = getX(idx);
            const y = getY(Number(d[s.key] || 0));
            const isHovered = hoveredIndex === idx;

            return (
              <g key={`dot-${s.key}-${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 3.5}
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer shadow-sm"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          });
        })}

        {/* Catch-all transparent hover bars across X ticks for easier hovering */}
        {data.map((_, idx) => {
          const x = getX(idx);
          const colWidth = chartWidth / (data.length - 1);
          return (
            <rect
              key={`catch-${idx}`}
              x={x - colWidth / 2}
              y={paddingTop}
              width={colWidth}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* Floating HTML HTML Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-md text-white px-3 py-2.5 rounded-lg shadow-xl border border-slate-700/50 z-20 text-xs min-w-[140px] pointer-events-none"
            style={{
              left: `${Math.max(20, Math.min(80, (hoveredIndex / (data.length - 1)) * 100))}%`,
              top: '40px',
            }}
          >
            <div className="font-semibold text-slate-300 mb-1 border-b border-slate-800 pb-1 flex justify-between">
              <span>{String(data[hoveredIndex][xAxisKey])}</span>
              <span className="text-[10px] text-slate-400 font-normal">Report</span>
            </div>
            {series.map((s) => {
              const val = Number(data[hoveredIndex][s.key] || 0);
              const formattedVal = val >= 100000
                ? `₹${val.toLocaleString('en-IN')}`
                : val.toLocaleString();
              return (
                <div key={s.key} className="flex justify-between items-center py-0.5 gap-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                  </div>
                  <span className="font-mono font-medium text-white">{formattedVal}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CustomBarChart({ data, xAxisKey, series }: CustomChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 500;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const allValues = data.flatMap((d) =>
    series.map((s) => Number(d[s.key] || 0))
  );
  const maxValue = Math.max(...allValues, 10);
  const minValue = 0;
  const yRange = maxValue - minValue;

  const getBarX = (index: number) => {
    return paddingLeft + (index / data.length) * chartWidth;
  };

  const getBarWidth = () => {
    return (chartWidth / data.length) * 0.65;
  };

  const getBarHeight = (val: number) => {
    return (val / yRange) * chartHeight;
  };

  return (
    <div className="relative w-full select-none aspect-[500/240]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          const val = Math.round(maxValue - ratio * yRange);
          return (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                className="font-mono text-[9px] fill-slate-400 text-right"
                textAnchor="end"
              >
                {val >= 10000000 ? `₹${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const barGroupX = getBarX(idx);
          const barW = getBarWidth();
          const isGroupHovered = hoveredIndex === idx;

          return series.map((s, sIdx) => {
            const val = Number(d[s.key] || 0);
            const barH = getBarHeight(val);
            const singleBarW = barW / series.length;
            const x = barGroupX + sIdx * singleBarW + (barW * 0.1);
            const y = paddingTop + chartHeight - barH;

            return (
              <g key={`${idx}-${s.key}`}>
                <motion.rect
                  x={x}
                  y={y}
                  width={singleBarW * 0.85}
                  height={barH}
                  fill={s.color}
                  opacity={hoveredIndex === null ? 1 : isGroupHovered ? 1 : 0.45}
                  rx="3"
                  className="transition-all duration-150 cursor-pointer origin-bottom"
                  style={{ originY: 1 }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.03, ease: 'easeOut' }}
                />
              </g>
            );
          });
        })}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          const x = getBarX(idx) + getBarWidth() / 2 + (getBarWidth() * 0.1);
          // Truncate names for x-axis if too long
          const name = String(d[xAxisKey]);
          const displayName = name.length > 8 ? `${name.substring(0, 6)}..` : name;
          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              className="font-sans text-[10px] fill-slate-500 font-medium"
              textAnchor="middle"
            >
              {displayName}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-md text-white px-3 py-2.5 rounded-lg shadow-xl border border-slate-700/50 z-20 text-xs min-w-[150px] pointer-events-none"
            style={{
              left: `${Math.max(15, Math.min(85, (hoveredIndex / data.length) * 100 + 10))}%`,
              top: '40px',
            }}
          >
            <div className="font-semibold text-slate-300 mb-1 border-b border-slate-800 pb-1">
              {String(data[hoveredIndex][xAxisKey])}
            </div>
            {series.map((s) => {
              const val = Number(data[hoveredIndex][s.key] || 0);
              return (
                <div key={s.key} className="flex justify-between items-center py-0.5 gap-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                  </div>
                  <span className="font-mono font-medium text-white">{val.toLocaleString()}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CustomRadarChartProps {
  academic?: number;
  attendance?: number;
  behaviour?: number;
  communication?: number;
}

export function CustomRadarChart({
  academic = 85,
  attendance = 95,
  behaviour = 90,
  communication = 82
}: CustomRadarChartProps) {
  // Map parameters to categories
  const categories = ['Academics', 'Attendance', 'Focus', 'Homework', 'Collaboration', 'Expression'];
  const data = [
    academic,
    attendance,
    behaviour,
    Math.min(100, Math.max(0, Math.round(academic * 0.95))),
    communication,
    Math.min(100, Math.max(0, Math.round(communication * 0.9)))
  ];

  const size = 200;
  const center = size / 2;
  const radius = (size / 2) * 0.75;

  const getCoordinate = (angle: number, value: number) => {
    const r = radius * (value / 100);
    const x = center + r * Math.cos(angle - Math.PI / 2);
    const y = center + r * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Generate web background polygons
  const polygons = [20, 40, 60, 80, 100].map((level) => {
    return categories.map((_, i) => {
      const angle = (i * 2 * Math.PI) / categories.length;
      const r = radius * (level / 100);
      const x = center + r * Math.cos(angle - Math.PI / 2);
      const y = center + r * Math.sin(angle - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  });

  // Active data shape
  const activePoints = categories.map((_, i) => {
    const angle = (i * 2 * Math.PI) / categories.length;
    return getCoordinate(angle, data[i]);
  });
  const dataPath = activePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-100">
      <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Evaluation Profile</h4>
      <div className="relative w-[210px] h-[210px]">
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          {/* Grid levels */}
          {polygons.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1"
              strokeDasharray={idx === 4 ? 'none' : '3 3'}
            />
          ))}

          {/* Web lines */}
          {categories.map((_, i) => {
            const angle = (i * 2 * Math.PI) / categories.length;
            const end = getCoordinate(angle, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Active Evaluation Area */}
          <motion.polygon
            points={dataPath}
            fill="#2563EB"
            fillOpacity="0.18"
            stroke="#2563EB"
            strokeWidth="2"
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Active Data dots */}
          {activePoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#14B8A6"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              className="shadow"
            />
          ))}

          {/* Labels */}
          {categories.map((cat, i) => {
            const angle = (i * 2 * Math.PI) / categories.length;
            const coord = getCoordinate(angle, 118);
            let anchor = 'middle';
            if (coord.x < center - 10) anchor = 'end';
            if (coord.x > center + 10) anchor = 'start';

            return (
              <text
                key={i}
                x={coord.x}
                y={coord.y + 4}
                className="font-sans text-[9px] font-semibold fill-slate-500"
                textAnchor={anchor}
              >
                {cat}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-center gap-4 text-[10px] mt-1 font-sans text-slate-500 font-medium border-t border-slate-50 pt-2 w-full">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" />
          <span>Academic Metrics</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 block" />
          <span>Average: 87.6%</span>
        </div>
      </div>
    </div>
  );
}
