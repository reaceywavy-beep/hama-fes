import React, { useState, useMemo, useRef } from 'react';
import { Player, calculatePlayerRanks, HAMA_RANKS, HamaRankTier } from '../types';
import { HamaRankBadge } from './HamaRankBadge';
import { HamaRankEmblem } from './HamaRankEmblem';
import { MyHamaSection } from './MyHamaSection';
import { PlayerSearchSection } from './PlayerSearchSection';
import {
  Trophy,
  Users,
  Search,
  Lock,
  Sparkles,
  Wifi,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Award,
  RefreshCw,
} from 'lucide-react';

interface Props {
  players: Player[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
  onOpenConfig?: () => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const PublicRanking: React.FC<Props> = ({
  players,
  isLoading,
  onNavigate,
  onOpenConfig,
  onRefresh,
  isRefreshing = false,
}) => {
  // Navigation Tabs: 'leaderboard' | 'my_hama' | 'player_search'
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'my_hama' | 'player_search'>('leaderboard');
  const [showRankGuide, setShowRankGuide] = useState<boolean>(false);
  const [isLocalReloading, setIsLocalReloading] = useState<boolean>(false);
  const lastReloadTimeRef = useRef<number>(0);

  const isReloading = isLocalReloading || isRefreshing;

  // Manual reload handler with anti-spam debouncing
  const handleReload = async () => {
    const now = Date.now();
    if (isReloading || now - lastReloadTimeRef.current < 1000) return;
    lastReloadTimeRef.current = now;

    setIsLocalReloading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to reload players:', err);
    } finally {
      setTimeout(() => {
        setIsLocalReloading(false);
      }, 500);
    }
  };

  // Competition Ranks Map
  const ranksMap = useMemo(() => {
    return calculatePlayerRanks(players);
  }, [players]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.points - a.points);
  }, [players]);

  const topThree = useMemo(() => {
    return sortedPlayers.slice(0, 3);
  }, [sortedPlayers]);

  const allRankTiers: HamaRankTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'BLACK'];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center pb-20 selection:bg-[#C5A059]/30 font-sans">
      {/* Top Banner / Casino Atmosphere */}
      <header className="w-full max-w-2xl px-4 pt-6 pb-4 border-b border-white/10 sticky top-0 bg-[#050505]/95 backdrop-blur-md z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#121212] border border-[#C5A059]/40 flex items-center justify-center shadow-lg shadow-black">
              <span className="text-[#C5A059] font-serif text-lg font-bold">♠</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                <span className="neon-red-text tracking-tighter">HAMA FES</span>
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider text-emerald-400 font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                <Wifi className="w-2.5 h-2.5" />
                <span>LIVE</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="ranking-reload-btn"
              onClick={handleReload}
              disabled={isReloading}
              className="h-10 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#2A1D0B] via-[#38260E] to-[#2A1D0B] border border-[#C5A059] hover:border-[#FFE082] text-[#FFE082] hover:text-white text-xs sm:text-sm font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shadow-[0_2px_12px_rgba(197,160,89,0.22)] cursor-pointer select-none"
              title="最新のplayersデータをSupabaseから再取得"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFE082] shrink-0 ${isReloading ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">{isReloading ? '読み込み中…' : '↻ リロード'}</span>
            </button>

            <button
              type="button"
              id="dealer-login-nav-btn"
              onClick={() => onNavigate('/dealer/login')}
              className="h-10 text-[10px] sm:text-xs font-mono uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2.5 sm:px-3 rounded-xl border border-white/10 text-gray-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
              title="ディーラー専用ログイン画面"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>DEALER</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Bar */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-400 px-1 border-t border-white/5 pt-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>TOTAL PLAYERS:</span>
              <strong className="text-white font-bold">{players.length}</strong>
            </div>
            {isReloading && (
              <span className="inline-flex items-center gap-1 text-[#FFE082] text-[10px] animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>データ同期中…</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowRankGuide(!showRankGuide)}
            className="flex items-center gap-1 text-[#C5A059] hover:text-[#FFE082] transition-colors font-bold"
          >
            <Award className="w-3.5 h-3.5" />
            <span>VIP RANK GUIDE</span>
            {showRankGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable VIP Rank Guide Showcase (Ensures all 6 ranks can be verified) */}
        {showRankGuide && (
          <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-b from-[#121212] to-[#0A0A0A] border border-[#C5A059]/40 shadow-2xl animate-in fade-in duration-200">
            <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#C5A059] uppercase mb-2 flex items-center justify-between">
              <span>♠ HAMA RANK CRITERIA / 6段階 VIP 称号 ♠</span>
              <span className="text-[10px] text-gray-400 font-normal">全ランク一覧</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allRankTiers.map((tier) => {
                const cfg = HAMA_RANKS[tier];
                return (
                  <div
                    key={tier}
                    className="p-2.5 rounded-lg bg-black/60 border border-white/10 flex items-center gap-2.5 hover:border-white/30 transition-all"
                  >
                    <HamaRankEmblem tier={tier} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-serif font-black text-white tracking-wide truncate">
                        {cfg.label}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400">
                        {cfg.minHam.toLocaleString()}
                        {cfg.maxHam ? `〜${cfg.maxHam.toLocaleString()}` : '+'} ham
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 Main Tabs: LEADERBOARD, MY HAMA, PLAYER SEARCH */}
        <nav className="mt-3 grid grid-cols-3 gap-1 bg-black/70 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            id="tab-leaderboard"
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 text-xs font-mono font-bold rounded-lg tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'leaderboard'
                ? 'gold-gradient text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>RANKING</span>
          </button>

          <button
            type="button"
            id="tab-my-hama"
            onClick={() => setActiveTab('my_hama')}
            className={`py-2 text-xs font-mono font-bold rounded-lg tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'my_hama'
                ? 'gold-gradient text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>MY HAMA</span>
          </button>

          <button
            type="button"
            id="tab-player-search"
            onClick={() => setActiveTab('player_search')}
            className={`py-2 text-xs font-mono font-bold rounded-lg tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'player_search'
                ? 'gold-gradient text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>SEARCH</span>
          </button>
        </nav>
      </header>

      {/* Main Tab Views */}
      <main className="w-full max-w-2xl px-4 mt-4 flex-1">
        {/* TAB 1: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Top 3 Podium Cards (when at least 3 players exist) */}
            {sortedPlayers.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2 pb-2">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="bg-gradient-to-t from-[#121212] via-[#1E252E] to-[#121212] rounded-xl border border-[#CBD5E1]/40 p-3 flex flex-col items-center text-center shadow-lg relative">
                    <div className="absolute -top-3 w-6 h-6 rounded-full bg-[#CBD5E1] text-black font-black text-xs flex items-center justify-center font-mono shadow-md">
                      2
                    </div>
                    <div className="mt-2 mb-1">
                      <HamaRankEmblem points={topThree[1].points} size="sm" />
                    </div>
                    <div className="text-xs font-bold text-white truncate max-w-full">
                      {topThree[1].name}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 truncate">
                      #{topThree[1].player_number || '-----'}
                    </div>
                    <div className="text-xs font-mono font-black text-[#CBD5E1] mt-1">
                      {topThree[1].points.toLocaleString()}{' '}
                      <span className="text-[9px] font-normal text-gray-400">ham</span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Crown Champion) */}
                {topThree[0] && (
                  <div className="bg-gradient-to-t from-[#161205] via-[#2D2106] to-[#161205] rounded-2xl border-2 border-[#C5A059] p-4 flex flex-col items-center text-center shadow-[0_0_20px_rgba(197,160,89,0.3)] relative -translate-y-2">
                    <div className="absolute -top-4 w-8 h-8 rounded-full gold-gradient text-black font-black text-sm flex items-center justify-center font-mono shadow-lg border border-[#FFE082]">
                      1
                    </div>
                    <div className="mt-2 mb-1">
                      <HamaRankEmblem points={topThree[0].points} size="md" />
                    </div>
                    <div className="text-xs sm:text-sm font-black text-[#FFE082] truncate max-w-full">
                      {topThree[0].name}
                    </div>
                    <div className="text-[10px] font-mono text-gray-300">
                      #{topThree[0].player_number || '-----'}
                    </div>
                    <div className="text-sm sm:text-base font-mono font-black text-[#FFE082] mt-1">
                      {topThree[0].points.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-gray-400">ham</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="bg-gradient-to-t from-[#121212] via-[#21140A] to-[#121212] rounded-xl border border-[#D99B6A]/40 p-3 flex flex-col items-center text-center shadow-lg relative">
                    <div className="absolute -top-3 w-6 h-6 rounded-full bg-[#D99B6A] text-black font-black text-xs flex items-center justify-center font-mono shadow-md">
                      3
                    </div>
                    <div className="mt-2 mb-1">
                      <HamaRankEmblem points={topThree[2].points} size="sm" />
                    </div>
                    <div className="text-xs font-bold text-white truncate max-w-full">
                      {topThree[2].name}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 truncate">
                      #{topThree[2].player_number || '-----'}
                    </div>
                    <div className="text-xs font-mono font-black text-[#D99B6A] mt-1">
                      {topThree[2].points.toLocaleString()}{' '}
                      <span className="text-[9px] font-normal text-gray-400">ham</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Full Leaderboard List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-2 uppercase tracking-wider">
                <span>RANK &amp; PLAYER</span>
                <span>HAMA RANK &amp; BALANCE</span>
              </div>

              {isLoading && (
                <div className="py-20 text-center font-mono text-sm text-[#C5A059] animate-pulse">
                  Loading Leaderboard...
                </div>
              )}

              {!isLoading && sortedPlayers.length === 0 && (
                <div className="py-16 text-center rounded-xl bg-[#0D0D0D] border border-white/5 text-gray-400 text-xs">
                  プレイヤーがまだ登録されていません。
                </div>
              )}

              {!isLoading &&
                sortedPlayers.map((player) => {
                  const rank = ranksMap.get(player.id) || 1;
                  const isTop3 = rank <= 3;

                  return (
                    <div
                      key={player.id}
                      id={`leaderboard-row-${player.id}`}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        rank === 1
                          ? 'bg-gradient-to-r from-[#211A08] to-[#0D0D0D] border-[#C5A059]/60 shadow-[0_2px_12px_rgba(197,160,89,0.15)]'
                          : rank === 2
                          ? 'bg-gradient-to-r from-[#171D24] to-[#0D0D0D] border-[#CBD5E1]/40'
                          : rank === 3
                          ? 'bg-gradient-to-r from-[#1F1208] to-[#0D0D0D] border-[#D99B6A]/40'
                          : 'bg-[#0D0D0D] border-white/5 hover:border-white/15'
                      }`}
                    >
                      {/* Left: Rank number & Name & Player Number */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            rank === 1
                              ? 'gold-gradient text-black shadow'
                              : rank === 2
                              ? 'bg-[#CBD5E1] text-black shadow'
                              : rank === 3
                              ? 'bg-[#D99B6A] text-black shadow'
                              : 'bg-black/60 text-gray-400 border border-white/10'
                          }`}
                        >
                          {rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                              {player.name}
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                            <span className="text-[#C5A059] font-semibold">
                              #{player.player_number || '-----'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: HAMA RANK Badge & Points */}
                      <div className="flex items-center gap-3 shrink-0">
                        <HamaRankBadge points={player.points} size="xs" />
                        <div className="text-right min-w-[76px] sm:min-w-[90px]">
                          <div className="text-sm sm:text-base font-mono font-black text-[#F5D77F] tracking-tight">
                            {player.points.toLocaleString()}
                          </div>
                          <div className="text-[9px] font-mono text-gray-400">ham</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 2: MY HAMA */}
        {activeTab === 'my_hama' && (
          <MyHamaSection players={players} isLoadingPlayers={isLoading} />
        )}

        {/* TAB 3: PLAYER SEARCH */}
        {activeTab === 'player_search' && (
          <PlayerSearchSection players={players} isLoadingPlayers={isLoading} />
        )}
      </main>
    </div>
  );
};
