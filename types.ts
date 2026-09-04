export type HamaRankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'BLACK';

export interface HamaRankConfig {
  tier: HamaRankTier;
  label: string;
  minHam: number;
  maxHam?: number;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  symbol: string;
  subtitle?: string;
}

export const HAMA_RANKS: Record<HamaRankTier, HamaRankConfig> = {
  BRONZE: {
    tier: 'BRONZE',
    label: 'BRONZE',
    minHam: 0,
    maxHam: 2499,
    badgeBg: 'bg-gradient-to-r from-[#2A180E] via-[#482816] to-[#2A180E]',
    textColor: 'text-[#D99B6A]',
    borderColor: 'border-[#8B5A2B]/70',
    glowColor: 'shadow-[#8B5A2B]/30',
    symbol: '♠',
    subtitle: 'BRONZE MEDAL',
  },
  SILVER: {
    tier: 'SILVER',
    label: 'SILVER',
    minHam: 2500,
    maxHam: 9999,
    badgeBg: 'bg-gradient-to-r from-[#1E232A] via-[#333E4D] to-[#1E232A]',
    textColor: 'text-[#E2E8F0]',
    borderColor: 'border-[#CBD5E1]/70',
    glowColor: 'shadow-[#CBD5E1]/30',
    symbol: '♣',
    subtitle: 'VIP BADGE',
  },
  GOLD: {
    tier: 'GOLD',
    label: 'GOLD',
    minHam: 10000,
    maxHam: 19999,
    badgeBg: 'bg-gradient-to-r from-[#261B0A] via-[#4D3A13] to-[#261B0A]',
    textColor: 'text-[#F5D77F]',
    borderColor: 'border-[#C5A059]',
    glowColor: 'shadow-[#C5A059]/40',
    symbol: '♦',
    subtitle: 'GOLD VIP',
  },
  PLATINUM: {
    tier: 'PLATINUM',
    label: 'PLATINUM',
    minHam: 20000,
    maxHam: 39999,
    badgeBg: 'bg-gradient-to-r from-[#0C222B] via-[#163D4D] to-[#0C222B]',
    textColor: 'text-[#67E8F9]',
    borderColor: 'border-[#22D3EE]/80',
    glowColor: 'shadow-[#22D3EE]/40',
    symbol: '♥',
    subtitle: 'ELITE CREST',
  },
  DIAMOND: {
    tier: 'DIAMOND',
    label: 'DIAMOND',
    minHam: 40000,
    maxHam: 79999,
    badgeBg: 'bg-gradient-to-r from-[#1A0E2E] via-[#351B5C] to-[#1A0E2E]',
    textColor: 'text-[#E879F9]',
    borderColor: 'border-[#C084FC]',
    glowColor: 'shadow-[#C084FC]/50',
    symbol: '◆',
    subtitle: 'ROYAL BRILLIANT',
  },
  BLACK: {
    tier: 'BLACK',
    label: 'BLACK',
    minHam: 80000,
    badgeBg: 'bg-gradient-to-r from-[#060606] via-[#180A0E] to-[#060606]',
    textColor: 'text-[#FFD700]',
    borderColor: 'border-[#FF2D55]',
    glowColor: 'shadow-[#FF2D55]/60',
    symbol: '♚',
    subtitle: 'SUPREME VIP',
  },
};

export function getHamaRankTier(points: number): HamaRankTier {
  const pts = Math.max(0, Math.floor(points));
  if (pts >= 80000) return 'BLACK';
  if (pts >= 40000) return 'DIAMOND';
  if (pts >= 20000) return 'PLATINUM';
  if (pts >= 10000) return 'GOLD';
  if (pts >= 2500) return 'SILVER';
  return 'BRONZE';
}

export function getHamaRankConfig(points: number): HamaRankConfig {
  const tier = getHamaRankTier(points);
  return HAMA_RANKS[tier];
}

export function calculatePlayerRanks(players: Player[]): Map<string, number> {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  const rankMap = new Map<string, number>();
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].points < sorted[i - 1].points) {
      currentRank = i + 1;
    }
    rankMap.set(sorted[i].id, currentRank);
  }
  return rankMap;
}

export interface Player {
  id: string;
  name: string;
  points: number; // in database it's points, in UI strictly 'ham'
  player_number?: string; // 5-digit string "00001" - "99999"
  pin?: string; // 4-digit PIN (only accessible to authenticated Dealer)
  created_at?: string;
  deleted_at?: string | null;
  has_pin?: boolean;
}

export interface PointHistory {
  id?: string;
  player_id: string;
  old_points: number;
  new_points: number;
  difference: number;
  dealer_id?: string | null;
  created_at?: string;
}

export type ConfirmAction =
  | {
      type: 'quick_add';
      player: Player;
      diff: number;
      targetPoints: number;
    }
  | {
      type: 'custom_adjust';
      player: Player;
      diff: number;
      targetPoints: number;
    }
  | {
      type: 'direct_set';
      player: Player;
      targetPoints: number;
    }
  | {
      type: 'edit_name';
      player: Player;
      newName: string;
    }
  | {
      type: 'change_pin';
      player: Player;
      newPin: string;
    }
  | {
      type: 'delete';
      player: Player;
    };
