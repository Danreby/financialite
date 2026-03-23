import React, { useMemo } from 'react';

const VIEW_SIZE = 120;
const RADIUS = 50;
const STROKE = 9;
const CENTER = VIEW_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FaturaProgressRing({
	totalSpent = 0,
	totalPaid = 0,
	isPaid = false,
	size = 140,
	children,
}) {
	const progress = useMemo(() => {
		if (!totalSpent || totalSpent <= 0) return 0;
		return Math.min(Math.max(totalPaid / totalSpent, 0), 1);
	}, [totalSpent, totalPaid]);

	const dashOffset = useMemo(() => CIRCUMFERENCE * (1 - progress), [progress]);

	return (
		<div className="relative shrink-0 inline-flex items-center justify-center" style={{ width: size, height: size }}>
			<svg
				viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
				width={size}
				height={size}
				className="absolute inset-0 -rotate-90"
				aria-hidden="true"
			>
				<circle
					cx={CENTER}
					cy={CENTER}
					r={RADIUS}
					fill="none"
					strokeWidth={STROKE}
					className="stroke-gray-100 dark:stroke-gray-800"
				/>
				{totalSpent > 0 && (
					<circle
						cx={CENTER}
						cy={CENTER}
						r={RADIUS}
						fill="none"
						strokeWidth={STROKE}
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={dashOffset}
						strokeLinecap="round"
						className={
							isPaid
								? 'stroke-emerald-500 dark:stroke-emerald-400'
								: 'stroke-[var(--theme-accent)]'
						}
						style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
					/>
				)}
			</svg>

			<div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
				{children}
			</div>
		</div>
	);
}
