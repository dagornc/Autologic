/**
 * Apple-style H2 Score Radial Gauge
 *
 * Animated SVG gauge that visualizes the critic score (0–1).
 * Red → Orange → Green gradient arc. Apple HIG 2025: clean typography,
 * rounded shapes, subtle shadow.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface H2ScoreGaugeProps {
    score: number;       // 0–1
    size?: number;       // px, default 140
    strokeWidth?: number;
}

function getScoreColor(score: number): string {
    if (score >= 0.8) return '#34C759'; // apple-green
    if (score >= 0.6) return '#FF9500'; // apple-orange
    return '#FF3B30';                   // apple-red
}

function getScoreLabel(score: number, t: (key: string) => string): string {
    if (score >= 0.9) return t('score.excellent');
    if (score >= 0.8) return t('score.veryGood');
    if (score >= 0.6) return t('score.good');
    if (score >= 0.4) return t('score.average');
    return t('score.low');
}

export const H2ScoreGauge: React.FC<H2ScoreGaugeProps> = ({
    score,
    size = 140,
    strokeWidth = 10,
}) => {
    const { t } = useTranslation();
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference * 0.75; // 270° arc
    const filledLength = arcLength * Math.min(Math.max(score, 0), 1);
    const gapLength = arcLength - filledLength;
    const color = getScoreColor(score);
    const label = getScoreLabel(score, t);
    const displayScore = (score * 10).toFixed(1);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
            className="flex flex-col items-center gap-2"
        >
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="transform rotate-[135deg]"
                >
                    {/* Background Arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        className="text-muted/30"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                        strokeLinecap="round"
                    />
                    {/* Filled Arc */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{
                            strokeDasharray: `${filledLength} ${gapLength + (circumference - arcLength)}`,
                        }}
                        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
                    />
                </svg>

                {/* Center Score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className="text-[32px] font-bold text-foreground leading-none tabular-nums"
                        style={{ color }}
                    >
                        {displayScore}
                    </motion.span>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                        /10
                    </span>
                </div>
            </div>

            {/* Label */}
            <div className="text-center space-y-0.5">
                <p className="text-[13px] font-semibold" style={{ color }}>
                    {label}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {t('score.qualityScore')}
                </p>
            </div>
        </motion.div>
    );
};
