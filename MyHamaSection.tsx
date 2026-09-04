import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, PointHistory, calculatePlayerRanks, getHamaRankConfig, HAMA_RANKS } from '../types';
import {
  fetchPlayerHistory,
  authenticateMyHama,
  getActiveMyHamaSession,
  logoutMyHamaSession,
} from '../lib/supabase';
import { HamaRankBadge } from './HamaRankBadge';
import { HamaRankEmblem } from './HamaRankEmblem';
import { HamHistoryChart } from './HamHistoryChart';
import {
  LogIn,
  LogOut,
  Trophy,
  AlertCircle,
  RefreshCw,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Props {
  players: Player[];
  isLoadingPlayers?: boolean;
}

export const MyHamaSection: React.FC<Props> = ({
  players,
  isLoadingPlayers = false,
}) => {
  // Input for 5-digit player number login
  const [playerNumberInput, setPlayerNumberInput] = useState<string>('');
  // Input for 4-digit PIN
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);

  // Active authenticated session number
  const [loggedInNumber, setLoggedInNumber] = useState<string | null>(() => {
    const session = getActiveMyHamaSession();
    return session ? session.playerNumber : null;
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Focus input ref
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Calculate official ranks map (1-indexed standard competition ranking)
  const ranksMap = useMemo(() => {
    return calculatePlayerRanks(players);
  }, [players]);

  // Find the currently logged-in player from the live players list (strictly scoped to authenticated session)
  const currentPlayer = useMemo(() => {
    const session = getActiveMyHamaSession();
    if (!session || !loggedInNumber || session.playerNumber !== loggedInNumber) return null;
    return players.find((p) => p.player_number === loggedInNumber && p.id === session.playerId) || null;
  }, [players, loggedInNumber]);

  // Track previous points to trigger history reload when points change via realtime
  const previousPointsRef = useRef<number | null>(null);

  // Fetch history whenever the authenticated current player changes or their points update
  useEffect(() => {
    if (!currentPlayer) {
      setHistory([]);
      return;
    }

    const pointsChanged = previousPointsRef.current !== currentPlayer.points;
    previousPointsRef.current = currentPlayer.points;

    let isMounted = true;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const hist = await fetchPlayerHistory(currentPlayer.id);
        if (isMounted) {
          setHistory(hist);
        }
      } catch (err) {
        console.warn('Failed to load player history in MyHama:', err);
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [currentPlayer?.id, currentPlayer?.points]);

  // Handle Login submission with strict Device Ownership Binding verification
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNumber = playerNumberInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanNumber) {
      setErrorMessage('5桁の PLAYER NUMBER を入力してください。');
      return;
    }
    if (!/^\d{5}$/.test(cleanNumber)) {
      setErrorMessage('PLAYER NUMBERは5桁の半角数字です (例: 58321)');
      return;
    }
    if (!cleanPin) {
      setErrorMessage('4桁のPINコードを入力してください。');
      return;
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      setErrorMessage('PINコードは4桁の半角数字です (例: 4827)');
      return;
    }

    setIsSubmitting(true);
    try {
      const authResult = await authenticateMyHama(cleanNumber, cleanPin);
      if (!authResult.success) {
        setErrorMessage(authResult.error || '認証に失敗しました。');
        return;
      }
      setLoggedInNumber(cleanNumber);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'ログイン中に予期せぬエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logoutMyHamaSession();
    setLoggedInNumber(null);
    setPlayerNumberInput('');
    setPinInput('');
    setShowPin(false);
    setErrorMessage(null);
    setHistory([]);
  };

  // Rank and Tier calculations for the logged in player
  const currentRank = currentPlayer ? ranksMap.get(currentPlayer.id) || 1 : null;
  const currentRankConfig = currentPlayer ? getHamaRankConfig(currentPlayer.points) : null;

  // Next rank progress calculation
  const nextTierInfo = useMemo(() => {
    if (!currentPlayer) return null;
    const pts = currentPlayer.points;
    const tiers: Array<keyof typeof HAMA_RANKS> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'BLACK'];
    const currentTier = getHamaRankConfig(pts).tier;
    const currentIdx = tiers.indexOf(currentTier);

    if (currentIdx >= tiers.length - 1) {
      return { isMax: true, nextTier: 'BLACK', requiredRemaining: 0, progressPct: 100 };
    }

    const nextTierName = tiers[currentIdx + 1];
    const nextConfig = HAMA_RANKS[nextTierName];
    const currentConfig = HAMA_RANKS[currentTier];

    const range = nextConfig.minHam - currentConfig.minHam;
    const currentProgress = pts - currentConfig.minHam;
    const progressPct = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
    const requiredRemaining = Math.max(0, nextConfig.minHam - pts);

    return {
      isMax: false,
      nextTier: nextConfig.label,
      requiredRemaining,
      progressPct,
      nextMinHam: nextConfig.minHam,
    };
  }, [currentPlayer]);

  //
  // VIEW A: LOGIN SCREEN (When not logged in)
  //
  if (!loggedInNumber || !currentPlayer) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full bg-[#0D0D0D] rounded-2xl border-2 border-[#C5A059]/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle casino watermark accents */}
          <div className="absolute top-2 right-4 text-7xl font-serif text-[#C5A059]/5 select-none pointer-events-none">
            ♠
          </div>
          <div className="absolute bottom-2 left-4 text-6xl font-serif text-[#C5A059]/5 select-none pointer-events-none">
            ♦
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[11px] font-mono tracking-[0.2em] font-bold text-[#F5D77F] uppercase">
                HAMA FES MEMBERS
              </span>
            </div>

            {/* MY HAMA Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              MY <span className="text-[#C5A059] font-serif italic font-normal">HAMA</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-sm mb-6 leading-relaxed">
              ディーラーから発行された <strong className="text-[#C5A059]">5桁の PLAYER NUMBER</strong> と <strong className="text-[#C5A059]">4桁の PINコード</strong> を入力してログインしてください。
            </p>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="w-full max-w-sm flex flex-col items-center space-y-4">
              {/* Field 1: PLAYER NUMBER */}
              <div className="w-full text-left">
                <label
                  htmlFor="my-hama-player-number-input"
                  className="block text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#C5A059] mb-1.5"
                >
                  PLAYER NUMBER (5桁)
                </label>
                
                {/* 5-digit Input Box */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="my-hama-player-number-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    value={playerNumberInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setPlayerNumberInput(val);
                      setErrorMessage(null);
                    }}
                    placeholder="58321"
                    className="w-full h-14 px-4 bg-black/90 rounded-xl border-2 border-[#C5A059]/50 text-center font-mono text-2xl tracking-[0.35em] text-[#F5D77F] placeholder:text-gray-700 placeholder:tracking-[0.2em] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/40 shadow-inner transition-all font-black"
                    autoComplete="off"
                    autoFocus
                  />
                  {playerNumberInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerNumberInput('');
                        setErrorMessage(null);
                      }}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white text-lg font-bold"
                      title="クリア"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="mt-1 flex justify-between items-center text-[10px] font-mono text-gray-400 px-1">
                  <span>半角数字5桁</span>
                  <span>{playerNumberInput.length} / 5</span>
                </div>
              </div>

              {/* Field 2: 4-digit PIN */}
              <div className="w-full text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="my-hama-pin-input"
                    className="block text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#C5A059] flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>PINコード (4桁)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] font-mono text-gray-400 hover:text-[#F5D77F] flex items-center gap-1 transition-colors"
                  >
                    {showPin ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>隠す</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>表示</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* 4-digit PIN Input Box */}
                <div className="relative">
                  <input
                    id="my-hama-pin-input"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPinInput(val);
                      setErrorMessage(null);
                    }}
                    placeholder="4827"
                    className="w-full h-14 px-4 bg-black/90 rounded-xl border-2 border-[#C5A059]/50 text-center font-mono text-2xl tracking-[0.4em] text-[#F5D77F] placeholder:text-gray-700 placeholder:tracking-[0.2em] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/40 shadow-inner transition-all font-black"
                    autoComplete="off"
                  />
                  {pinInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput('');
                        setErrorMessage(null);
                      }}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white text-lg font-bold"
                      title="クリア"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="mt-1 flex justify-between items-center text-[10px] font-mono text-gray-400 px-1">
                  <span>数字4桁 (0000〜9999)</span>
                  <span>{pinInput.length} / 4</span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="w-full p-3.5 rounded-xl bg-red-950/70 border border-red-600/50 text-red-200 text-xs flex items-center gap-2.5 text-left">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Big LOGIN Button */}
              <button
                id="my-hama-login-button"
                type="submit"
                disabled={isLoadingPlayers || isSubmitting}
                className="w-full h-14 rounded-xl gold-gradient text-black font-black text-base uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(197,160,89,0.45)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-black animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-black stroke-[2.5]" />
                    <span>LOGIN</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-[11px] text-gray-400 font-mono">
              ※ PINが分からない場合はDealerにお問い合わせください
            </div>
          </div>
        </div>
      </div>
    );
  }

  //
  // VIEW B: LOGGED-IN PERSONAL PAGE (MY HAMA)
  //
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Top Action Bar: MY HAMA indicator & Logout Button */}
      <div className="w-full flex items-center justify-between bg-black/60 px-4 py-2.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#C5A059] uppercase">
            MY HAMA ログイン中
          </span>
        </div>
        {/* LOGOUT Button */}
        <button
          id="my-hama-logout-button"
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-gray-300 hover:text-white transition-all py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-700/40 hover:border-red-500 cursor-pointer active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main Personal Hero Card */}
      <div className="bg-gradient-to-br from-[#1C150A] via-[#0F0E0E] to-[#0A0A0A] rounded-2xl border-2 border-[#C5A059]/60 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Large Casino Watermark */}
        <div className="absolute top-2 right-4 opacity-10 text-8xl font-serif select-none pointer-events-none">
          {currentRankConfig?.symbol || '♠'}
        </div>

        <div className="relative z-10 flex flex-col">
          {/* Header Title: MY HAMA */}
          <div className="text-xs font-serif italic text-[#C5A059] font-bold tracking-[0.25em] uppercase mb-1">
            MY HAMA
          </div>

          {/* PLAYER NUMBER (e.g. PLAYER 58321) & Prominent Emblem Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="font-mono text-sm sm:text-base font-black text-[#F5D77F] bg-black/80 px-3.5 py-1 rounded-full border border-[#C5A059]/50 shadow-inner flex items-center gap-2">
              <span className="text-[#C5A059] font-serif">♦</span>
              <span>PLAYER {currentPlayer.player_number || '-----'}</span>
            </div>
            <HamaRankBadge points={currentPlayer.points} size="md" showSubtitle={true} />
          </div>

          {/* Player Name */}
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight truncate mb-4">
            {currentPlayer.name}
          </h2>

          {/* Primary Metric: 保有 ham (Most Prominent Display) */}
          <div className="w-full bg-black/70 rounded-2xl p-5 sm:p-6 border-2 border-[#C5A059]/40 mb-4 shadow-xl text-center relative overflow-hidden">
            <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-gray-400 uppercase mb-1">
              CURRENT HAM / 保有残高
            </div>
            <div className="text-4xl sm:text-6xl font-mono text-[#F5D77F] font-black tracking-tight drop-shadow-[0_2px_15px_rgba(245,215,127,0.3)]">
              {currentPlayer.points.toLocaleString()}{' '}
              <span className="text-xl sm:text-2xl font-serif italic text-gray-300 font-normal">
                ham
              </span>
            </div>
          </div>

          {/* Two-Column Grid: 現在の HAMA RANK & 総合順位 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            {/* Rank Card with Live Emblem */}
            <div className="bg-black/60 rounded-xl p-4 border border-white/10 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                  HAMA RANK
                </div>
                <div className="text-xl sm:text-2xl font-serif italic text-white font-black tracking-wide">
                  {currentRankConfig?.label}
                </div>
                <div className="text-[11px] font-mono text-[#C5A059] mt-0.5">
                  {currentRankConfig?.minHam.toLocaleString()} ham〜
                </div>
              </div>
              <div className="shrink-0">
                <HamaRankEmblem points={currentPlayer.points} size="md" />
              </div>
            </div>

            {/* Overall Rank Card */}
            <div className="bg-black/60 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                OVERALL RANK
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <Trophy className="w-4 h-4 text-[#C5A059] inline shrink-0" />
                <span className="text-xl sm:text-2xl font-serif italic text-[#F5D77F] font-black">
                  RANK #{currentRank}
                </span>
              </div>
              <div className="text-[11px] font-mono text-gray-400 mt-1">
                第{currentRank}位 / 全{players.length}名
              </div>
            </div>
          </div>

          {/* Next Rank Information (あと○○ ham) */}
          {nextTierInfo && !nextTierInfo.isMax && (
            <div className="bg-black/50 rounded-xl p-4 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-300 font-medium">
                  NEXT RANK: <strong className="text-white font-bold">{nextTierInfo.nextTier}</strong> まで
                </span>
                <span className="font-mono font-bold text-[#F5D77F] text-xs sm:text-sm">
                  あと <strong className="text-[#C5A059]">{nextTierInfo.requiredRemaining.toLocaleString()}</strong> ham
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full gold-gradient transition-all duration-500 shadow-sm"
                  style={{ width: `${nextTierInfo.progressPct}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>{currentRankConfig?.label} ({currentRankConfig?.minHam.toLocaleString()} ham)</span>
                <span>{nextTierInfo.nextTier} ({nextTierInfo.nextMinHam?.toLocaleString()} ham)</span>
              </div>
            </div>
          )}

          {nextTierInfo?.isMax && (
            <div className="bg-black/50 rounded-xl p-3.5 border border-[#FF2D55]/40 text-xs sm:text-sm text-center font-bold text-[#FFD700] tracking-wider font-serif">
              ★ 最高位 VIP BLACK ランク到達中 ★
            </div>
          )}
        </div>
      </div>

      {/* Time-Series Ham History Graph (推移グラフ) */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
            HAM HISTORY / 変動グラフ
          </span>
          <span className="text-[10px] font-mono text-[#C5A059]">
            PLAYER #{currentPlayer.player_number}
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-16 flex flex-col items-center justify-center bg-[#0D0D0D] rounded-2xl border border-white/5">
            <RefreshCw className="w-6 h-6 text-[#C5A059] animate-spin mb-2" />
            <span className="text-xs font-mono text-gray-400 tracking-wider">
              履歴を読み込み中...
            </span>
          </div>
        ) : (
          <HamHistoryChart
            history={history}
            currentPoints={currentPlayer.points}
            playerName={currentPlayer.name}
          />
        )}
      </div>

      {/* Safety Notice */}
      <div className="text-center text-[11px] text-gray-400 font-mono py-2">
        ※ 画面を閉じても MY HAMA へのログイン状態は保持されます
      </div>
    </div>
  );
};
