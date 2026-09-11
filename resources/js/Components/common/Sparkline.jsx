import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const WIDTH = 120;
const HEIGHT = 32;
const PAD = 3;

export default function Sparkline({ data = [], color, className = '', strokeWidth = 2 }) {
  const reduceMotion = useReducedMotion();

  const { path, areaPath, trendUp } = useMemo(() => {
    const points = (data || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (points.length < 2) return { path: '', areaPath: '', trendUp: true };

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const step = (WIDTH - PAD * 2) / (points.length - 1);

    const coords = points.map((v, i) => {
      const x = PAD + i * step;
      const y = PAD + (1 - (v - min) / range) * (HEIGHT - PAD * 2);
      return [x, y];
    });

    const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const area = `${linePath} L${coords[coords.length - 1][0].toFixed(2)},${HEIGHT} L${coords[0][0].toFixed(2)},${HEIGHT} Z`;

    return {
      path: linePath,
      areaPath: area,
      trendUp: points[points.length - 1] >= points[0],
    };
  }, [data]);

  if (!path) {
    return <div className={`h-8 w-full ${className}`} aria-hidden="true" />;
  }

  const resolvedColor = color || (trendUp ? 'var(--theme-accent)' : '#ef4444');
  const gradientId = useMemo(() => `spark-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`h-8 w-full overflow-visible ${className}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Tendência de saldo recente"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <motion.path
        d={path}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
