import React from 'react';
import { getHamaRankConfig, HamaRankTier, getHamaRankTier } from '../types';
import { HamaRankEmblem } from './HamaRankEmblem';

interface Props {
  points?: number;
  tier?: HamaRankTier;
  showPointsRange?: boolean;
  showSubtitle?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'emblem';
  className?: string;
}

export const HamaRankBadge: React.FC<Props> = ({
  points = 0,
  tier,
  showPointsRange = false,
  showSubtitle = false,
  size = 'md',
  variant = 'badge',
  className = '',
}) => {
  const activeTier: HamaRankTier = tier || getHamaRankTier(points);
  const config = getHamaRankConfig(points || 0);

  // If only emblem is requested
  if (variant === 'emblem') {
    return (
      <HamaRankEmblem
        tier={activeTier}
        size={size}
        className={className}
      />
    );
  }

  // Dimension styling for badges
  const badgeSizeStyles = {
    xs: {
      pill: 'py-0.5 px-2 gap-1.5 rounded-full border text-[10px]',
      emblemSize: 'xs' as const,
      labelFont: 'text-[10px] font-extrabold tracking-wider',
      subtitleFont: 'text-[8px]',
    },
    sm: {
      pill: 'py-1 px-2.5 gap-2 rounded-full border text-xs shadow-sm',
      emblemSize: 'xs' as const,
      labelFont: 'text-xs font-black tracking-widest',
      subtitleFont: 'text-[9px]',
    },
    md: {
      pill: 'py-1.5 px-3.5 gap-2.5 rounded-xl border text-sm shadow-md',
      emblemSize: 'sm' as const,
      labelFont: 'text-sm font-black tracking-widest',
      subtitleFont: 'text-[10px]',
    },
    lg: {
      pill: 'py-2.5 px-4.5 gap-3 rounded-2xl border-2 text-base shadow-xl',
      emblemSize: 'md' as const,
      labelFont: 'text-base font-black tracking-[0.2em]',
      subtitleFont: 'text-xs',
    },
  };

  // Specific bespoke luxury styling per tier
  const tierLuxuryStyles: Record<
    HamaRankTier,
    {
      containerBg: string;
      borderColor: string;
      textStyle: string;
      glowEffect: string;
      accentLine?: string;
    }
  > = {
    BRONZE: {
      containerBg: 'bg-gradient-to-r from-[#211107]/90 via-[#3B1F0E]/90 to-[#211107]/90',
      borderColor: 'border-[#9E653A]/80 hover:border-[#D99B6A]',
      textStyle: 'text-[#E8AF82] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
      glowEffect: 'shadow-[0_2px_10px_rgba(158,101,58,0.25)]',
    },
    SILVER: {
      containerBg: 'bg-gradient-to-r from-[#1E252E]/90 via-[#2E3B4B]/90 to-[#1E252E]/90',
      borderColor: 'border-[#CBD5E1]/80 hover:border-white',
      textStyle: 'text-[#F1F5F9] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]',
      glowEffect: 'shadow-[0_2px_12px_rgba(203,213,225,0.25)]',
    },
    GOLD: {
      containerBg: 'bg-gradient-to-r from-[#2B1E0A]/95 via-[#4A3512]/95 to-[#2B1E0A]/95',
      borderColor: 'border-[#C5A059] hover:border-[#FFE082]',
      textStyle: 'text-[#FDE68A] drop-shadow-[0_1px_4px_rgba(197,160,89,0.5)]',
      glowEffect: 'shadow-[0_2px_16px_rgba(197,160,89,0.35)]',
    },
    PLATINUM: {
      containerBg: 'bg-gradient-to-r from-[#0B2530]/95 via-[#134255]/95 to-[#0B2530]/95',
      borderColor: 'border-[#22D3EE] hover:border-[#67E8F9]',
      textStyle: 'text-[#A5F3FC] drop-shadow-[0_1px_6px_rgba(34,211,238,0.5)]',
      glowEffect: 'shadow-[0_2px_18px_rgba(34,211,238,0.35)]',
    },
    DIAMOND: {
      containerBg: 'bg-gradient-to-r from-[#1A0A2E]/95 via-[#34135E]/95 to-[#1A0A2E]/95',
      borderColor: 'border-[#C084FC] hover:border-[#F5D0FE]',
      textStyle: 'text-[#F5D0FE] drop-shadow-[0_1px_8px_rgba(192,132,252,0.6)]',
      glowEffect: 'shadow-[0_2px_22px_rgba(192,132,252,0.45)]',
    },
    BLACK: {
      containerBg: 'bg-gradient-to-r from-[#040404] via-[#16060A] to-[#040404]',
      borderColor: 'border-[#FF2D55] ring-1 ring-[#FFE082]/60 hover:ring-[#FF2D55]',
      textStyle: 'text-[#FFD700] drop-shadow-[0_1px_10px_rgba(255,45,85,0.7)]',
      glowEffect: 'shadow-[0_2px_25px_rgba(255,45,85,0.5)]',
    },
  };

  const currentSize = badgeSizeStyles[size];
  const luxury = tierLuxuryStyles[activeTier];

  return (
    <div
      className={`inline-flex items-center select-none backdrop-blur-md transition-all duration-200 ${luxury.containerBg} ${luxury.borderColor} ${luxury.glowEffect} ${currentSize.pill} ${className}`}
      title={`${config.label} VIP RANK (${points.toLocaleString()} ham)`}
    >
      {/* Precision Metallic Casino VIP Emblem */}
      <HamaRankEmblem
        tier={activeTier}
        size={currentSize.emblemSize}
        showGlint={true}
      />

      {/* Typography Label */}
      <div className="flex flex-col leading-tight">
        <span className={`font-serif uppercase ${luxury.textStyle} ${currentSize.labelFont} whitespace-nowrap`}>
          {config.label}
        </span>
        {showSubtitle && config.subtitle && (
          <span className={`font-mono text-gray-400 font-semibold tracking-wider uppercase ${currentSize.subtitleFont}`}>
            {config.subtitle}
          </span>
        )}
      </div>

      {/* Optional Range Display */}
      {showPointsRange && config.maxHam && (
        <span className="text-[10px] opacity-70 font-mono font-normal tracking-normal text-gray-300">
          ({config.minHam.toLocaleString()}-{config.maxHam.toLocaleString()})
        </span>
      )}
    </div>
  );
};
