import React, { useState, useMemo } from 'react';
import { Player, PointHistory, calculatePlayerRanks, getHamaRankConfig } from '../types';
import { fetchPlayerHistory } from '../lib/supabase';
import { HamaRankBadge } from './HamaRankBadge';
import { HamaRankEmblem } from './HamaRankEmblem';
import { HamHistoryChart } from './HamHistoryChart';
import {
  Search,
  Trophy,
  RefreshCw,
  X,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface Props {
  players: Player[];
  isLoadingPlayers?: boolean;
}

export const PlayerSearchSection: React.FC<Props> = ({
  players,
  isLoadingPlayers = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Calculate official ranks map (1-indexed standard competition ranking)
  const ranksMap = useMemo(() => {
    return calculatePlayerRanks(players);
  }, [players]);

  // Filtered players by search query (supports name and 5-digit player_number)
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.player_number && p.player_number.includes(q))
    );
  }, [players, searchQuery]);

  // Load history when a player is selected
  const handleSelectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setIsLoadingHistory(true);
    try {
      const hist = await fetchPlayerHistory(player.id);
      setHistory(hist);
    } catch (err) {
      console.warn('Failed to load player history in PlayerSearch:', err);
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Keep selected player synced with realtime updates from players prop
  const currentSelectedPlayer = useMemo(() => {
    if (!selectedPlayer) return null;
    return players.find((p) => p.id === selectedPlayer.id) || selectedPlayer;
  }, [players, selectedPlayer]);

  const selectedRank = currentSelectedPlayer
    ? ranksMap.get(currentSelectedPlayer.id) || 1
    : null;
  const selectedRankConfig = currentSelectedPlayer
    ? getHamaRankConfig(currentSelectedPlayer.points)
    : null;

  return (
    <div className="w-full space-y-4">
      {/* Search Header and Input */}
      <div className="bg-[#0D0D0D] rounded-2xl border border-white/10 p-5 shadow-xl relative overflow-hidden">
        <div className="text-xs font-mono font-bold tracking-[0.2em] text-[#C5A059] uppercase mb-1">
          PLAYER SEARCH
        </div>
        <p className="text-xs text-gray-300 mb-4">
          プレイヤー名 または <strong className="text-[#C5A059]">5桁の PLAYER NUMBER</strong> で検索できます。
        </p>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="player-search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前 または 5桁ID (例: 58321)..."
            className="w-full h-12 pl-10 pr-10 rounded-xl bg-black/70 border border-white/20 focus:outline-none focus:border-[#C5A059] text-white text-sm placeholder:text-gray-600 font-mono transition-all"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Real-time match count */}
        {searchQuery.trim() && (
          <div className="mt-2 text-[11px] font-mono text-gray-400 flex justify-between px-1">
            <span>
              MATCHES: <strong className="text-[#C5A059]">{filteredPlayers.length}</strong> PLAYERS
            </span>
            <span>TOTAL: {players.length}</span>
          </div>
        )}
      </div>

      {/* SEARCH RESULTS LIST (when no player is selected or when searching) */}
      {!selectedPlayer && searchQuery.trim() && (
        <div className="space-y-2">
          {filteredPlayers.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-[#0D0D0D] border border-white/5 p-6 text-gray-400 text-xs">
              該当するプレイヤーが見つかりませんでした。
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const rank = ranksMap.get(player.id) || 1;
              return (
                <button
                  key={player.id}
                  id={`search-result-${player.id}`}
                  type="button"
                  onClick={() => handleSelectPlayer(player)}
                  className="w-full text-left p-3.5 rounded-xl bg-[#0D0D0D] border border-white/10 hover:border-[#C5A059]/50 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-[#C5A059] bg-black/60 px-2 py-0.5 rounded border border-[#C5A059]/30 shrink-0">
                      #{player.player_number || '-----'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate group-hover:text-[#F5D77F] transition-colors">
                        {player.name}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>総合 #{rank}</span>
                        <span>•</span>
                        <span className="text-[#C5A059] font-bold">
                          {player.points.toLocaleString()} ham
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <HamaRankBadge points={player.points} size="xs" />
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* SELECTED PLAYER PROFILE VIEW */}
      {currentSelectedPlayer && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Back to search list button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>検索結果一覧に戻る</span>
            </button>
            <span className="text-[11px] font-mono text-gray-400">
              PLAYER #{currentSelectedPlayer.player_number}
            </span>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-[#1C150A] via-[#0F0E0E] to-[#0A0A0A] rounded-2xl border-2 border-[#C5A059]/60 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="font-mono text-xs sm:text-sm font-black text-[#F5D77F] bg-black/80 px-3 py-1 rounded-full border border-[#C5A059]/50 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>PLAYER #{currentSelectedPlayer.player_number || '-----'}</span>
                </div>
                <HamaRankBadge points={currentSelectedPlayer.points} size="md" showSubtitle={true} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate mb-4">
                {currentSelectedPlayer.name}
              </h2>

              {/* Points Metric */}
              <div className="w-full bg-black/70 rounded-2xl p-4 sm:p-5 border-2 border-[#C5A059]/40 mb-4 text-center">
                <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-gray-400 uppercase mb-1">
                  CURRENT HAM / 保有残高
                </div>
                <div className="text-3xl sm:text-5xl font-mono text-[#F5D77F] font-black tracking-tight">
                  {currentSelectedPlayer.points.toLocaleString()}{' '}
                  <span className="text-lg sm:text-xl font-serif italic text-gray-300 font-normal">
                    ham
                  </span>
                </div>
              </div>

              {/* Two-Column: Rank and Tier */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-black/60 rounded-xl p-3.5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase">
                      HAMA RANK
                    </div>
                    <div className="text-lg font-serif italic text-white font-black">
                      {selectedRankConfig?.label}
                    </div>
                  </div>
                  <HamaRankEmblem points={currentSelectedPlayer.points} size="sm" />
                </div>

                <div className="bg-black/60 rounded-xl p-3.5 border border-white/10">
                  <div className="text-[10px] font-mono text-gray-400 uppercase">
                    OVERALL RANK
                  </div>
                  <div className="flex items-center gap-1 text-lg font-serif italic text-[#F5D77F] font-black mt-0.5">
                    <Trophy className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>#{selectedRank}</span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">
                    全 {players.length} 名中
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player History Chart */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 px-1">
              HAM HISTORY / 変動グラフ
            </div>
            {isLoadingHistory ? (
              <div className="py-16 flex flex-col items-center justify-center bg-[#0D0D0D] rounded-2xl border border-white/5">
                <RefreshCw className="w-6 h-6 text-[#C5A059] animate-spin mb-2" />
                <span className="text-xs font-mono text-gray-400">
                  履歴を読み込み中...
                </span>
              </div>
            ) : (
              <HamHistoryChart
                history={history}
                currentPoints={currentSelectedPlayer.points}
                playerName={currentSelectedPlayer.name}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
