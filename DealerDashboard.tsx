import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Player, ConfirmAction, calculatePlayerRanks } from '../types';
import { HamaRankBadge } from './HamaRankBadge';
import {
  fetchPlayers,
  updatePlayerHam,
  createPlayer,
  updatePlayerName,
  deletePlayer,
  subscribeToPlayers,
  getSupabase,
  isSupabaseConfigured,
  fetchDealerPins,
  updatePlayerPin,
} from '../lib/supabase';
import { ConfirmationModal } from './ConfirmationModal';
import {
  LogOut,
  Plus,
  Search,
  Edit2,
  Trash2,
  Coins,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  SlidersHorizontal,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onOpenConfig?: () => void;
}

export const DealerDashboard: React.FC<Props> = ({
  onNavigate,
  onLogout,
  onOpenConfig,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Player Form
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerPin, setNewPlayerPin] = useState<string>('');
  const [isAddingPlayer, setIsAddingPlayer] = useState<boolean>(false);

  // PIN Management (Dealer-only)
  const [dealerPins, setDealerPins] = useState<Record<string, string>>({});
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [editingPinMap, setEditingPinMap] = useState<Record<string, string>>({});

  // Per-player custom ham input values & direct edit states
  const [customAmountMap, setCustomAmountMap] = useState<Record<string, string>>({});
  const [directAmountMap, setDirectAmountMap] = useState<Record<string, string>>({});
  const [editingNameMap, setEditingNameMap] = useState<Record<string, string>>({});
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'quick' | 'custom' | 'direct' | 'edit'>>({});

  // Confirmation Modal state
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Toast / Status messages
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentDealerId, setCurrentDealerId] = useState<string | null>(null);

  // Retrieve current dealer user ID
  useEffect(() => {
    const client = getSupabase();
    if (client) {
      // 1. Check getSession first (immediate from memory/localStorage)
      client.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.id) {
          setCurrentDealerId(data.session.user.id);
        }
      });
      // 2. Also check getUser to verify current session
      client.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          setCurrentDealerId(data.user.id);
        }
      });
    } else {
      setCurrentDealerId('demo-dealer-id');
    }
  }, []);

  // Show Toast
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Load players & dealer PINs
  const loadData = useCallback(async () => {
    try {
      const [data, pins] = await Promise.all([
        fetchPlayers(),
        fetchDealerPins(),
      ]);
      setPlayers(data);
      setDealerPins(pins);
    } catch (err: any) {
      console.error('DealerDashboard fetchPlayers error:', err);
      showToast('error', err.message || 'データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [isManualReloading, setIsManualReloading] = useState<boolean>(false);
  const lastDealerReloadRef = useRef<number>(0);

  const handleDealerReload = async () => {
    const now = Date.now();
    if (isManualReloading || now - lastDealerReloadRef.current < 1000) return;
    lastDealerReloadRef.current = now;

    setIsManualReloading(true);
    try {
      await loadData();
      showToast('success', '最新データを取得しました');
    } catch (err: any) {
      console.error('Reload error:', err);
    } finally {
      setTimeout(() => {
        setIsManualReloading(false);
      }, 500);
    }
  };

  const isActionLoadingRef = useRef(false);
  useEffect(() => {
    isActionLoadingRef.current = isActionLoading;
  }, [isActionLoading]);

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToPlayers(() => {
      console.log('Realtime update received in DealerDashboard');
      if (!isActionLoadingRef.current) {
        loadData();
      } else {
        console.log('[DealerDashboard] Skipping background reload during active modal action');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Calculate ranks map using standard competition ranking
  const ranksMap = useMemo(() => {
    return calculatePlayerRanks(players);
  }, [players]);

  // Filtered players by search query (supports name and 5-digit player_number)
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.player_number && p.player_number.includes(q))
    );
  }, [players, searchQuery]);

  // Handle Quick Add (+100, +500, +1000)
  const handleTriggerQuickAdd = (player: Player, diff: number) => {
    const targetPoints = player.points + diff;
    setActionError(null);
    setPendingAction({
      type: 'quick_add',
      player,
      diff,
      targetPoints,
    });
  };

  // Handle Custom Ham Adjust (+ or -)
  const handleTriggerCustomAdjust = (player: Player, isAdd: boolean) => {
    const rawVal = customAmountMap[player.id];
    const amount = parseInt(rawVal, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('error', '正の数値を入力してください。');
      return;
    }
    const diff = isAdd ? amount : -amount;
    const targetPoints = player.points + diff;
    if (targetPoints < 0) {
      showToast('error', 'ham残高は0未満にできません。');
      return;
    }
    setActionError(null);
    setPendingAction({
      type: 'custom_adjust',
      player,
      diff,
      targetPoints,
    });
  };

  // Handle Direct Ham Set
  const handleTriggerDirectSet = (player: Player) => {
    const rawVal = directAmountMap[player.id];
    const targetPoints = parseInt(rawVal, 10);
    if (isNaN(targetPoints)) {
      showToast('error', '有効な数値を入力してください。');
      return;
    }
    if (targetPoints < 0) {
      showToast('error', 'ham残高は0未満にできません。');
      return;
    }
    if (targetPoints === player.points) {
      showToast('error', '現在と同じ数値です。');
      return;
    }
    setActionError(null);
    setPendingAction({
      type: 'direct_set',
      player,
      targetPoints,
    });
  };

  // Handle Edit Player Name trigger
  const handleTriggerEditName = (player: Player) => {
    const newName = (editingNameMap[player.id] ?? player.name).trim();
    if (!newName) {
      showToast('error', 'プレイヤー名を入力してください。');
      return;
    }
    if (newName === player.name) {
      showToast('error', '現在の名前と同じです。');
      return;
    }
    setActionError(null);
    setPendingAction({
      type: 'edit_name',
      player,
      newName,
    });
  };

  // Handle Trigger Change PIN
  const handleTriggerChangePin = (player: Player) => {
    const rawVal = (editingPinMap[player.id] ?? '').trim();
    if (!/^\d{4}$/.test(rawVal)) {
      showToast('error', 'PINコードは4桁の数字（0000〜9999）で入力してください。');
      return;
    }
    setActionError(null);
    setPendingAction({
      type: 'change_pin',
      player,
      newPin: rawVal,
    });
  };

  // Handle Trigger Delete
  const handleTriggerDelete = (player: Player) => {
    setActionError(null);
    setPendingAction({
      type: 'delete',
      player,
    });
  };

  // Trigger Add New Player
  const handleAddNewPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) {
      showToast('error', 'プレイヤー名を入力してください。');
      return;
    }
    const pinInput = newPlayerPin.trim();
    if (pinInput && !/^\d{4}$/.test(pinInput)) {
      showToast('error', 'PINコードは4桁の数字（0000〜9999）で指定してください。');
      return;
    }
    setIsAddingPlayer(true);
    try {
      const created = await createPlayer(trimmedName, pinInput || undefined);
      setNewPlayerName('');
      setNewPlayerPin('');
      const updatedPins = await fetchDealerPins();
      setDealerPins(updatedPins);
      const finalPin = created.pin || updatedPins[created.id] || pinInput || '----';
      showToast(
        'success',
        `プレイヤー「${created.name}」(#${created.player_number}, PIN: ${finalPin}) を登録しました`
      );
      await loadData();
    } catch (err: any) {
      console.error('Failed to add player:', err);
      showToast('error', err.message || 'プレイヤー作成に失敗しました。');
    } finally {
      setIsAddingPlayer(false);
    }
  };

  // Execute Confirmed Modal Action
  const handleExecuteConfirmedAction = async () => {
    if (!pendingAction) return;

    console.log('[DealerDashboard - Step 1: Confirmed Action Triggered]', {
      actionType: pendingAction.type,
      playerId: pendingAction.player.id,
      playerName: pendingAction.player.name,
      targetPoints: (pendingAction as any).targetPoints,
      currentDealerId,
    });

    setIsActionLoading(true);
    setActionError(null);
    setUpdatingPlayerId(pendingAction.player.id);

    try {
      switch (pendingAction.type) {
        case 'quick_add':
        case 'custom_adjust':
        case 'direct_set': {
          const updated = await updatePlayerHam(
            pendingAction.player,
            pendingAction.targetPoints,
            currentDealerId
          );
          console.log('[DealerDashboard - Action Succeeded]:', {
            playerId: updated.id,
            newName: updated.name,
            newPoints: updated.points,
          });
          showToast(
            'success',
            `${updated.name} の残高を ${updated.points.toLocaleString()} ham に更新しました`
          );
          // Clear inputs for this player
          setCustomAmountMap((prev) => ({ ...prev, [pendingAction.player.id]: '' }));
          setDirectAmountMap((prev) => ({ ...prev, [pendingAction.player.id]: '' }));
          break;
        }
        case 'edit_name': {
          const updated = await updatePlayerName(
            pendingAction.player.id,
            pendingAction.newName
          );
          showToast('success', `名前を「${updated.name}」に変更しました`);
          setActiveTabMap((prev) => ({ ...prev, [pendingAction.player.id]: 'quick' }));
          break;
        }
        case 'change_pin': {
          await updatePlayerPin(
            pendingAction.player.id,
            pendingAction.newPin,
            pendingAction.player.player_number
          );
          showToast(
            'success',
            `${pendingAction.player.name} のPINを「${pendingAction.newPin}」に変更しました`
          );
          setEditingPinMap((prev) => ({ ...prev, [pendingAction.player.id]: '' }));
          const updatedPins = await fetchDealerPins();
          setDealerPins(updatedPins);
          break;
        }
        case 'delete': {
          await deletePlayer(pendingAction.player.id);
          showToast('success', `プレイヤー「${pendingAction.player.name}」を削除しました`);
          break;
        }
      }

      // Close modal on success
      setPendingAction(null);
      setActionError(null);

      // Immediately refresh rankings and dealer player list
      await loadData();
    } catch (err: any) {
      console.error('[DealerDashboard - Confirmed Action Execution Failed]:', err);
      const userMessage = err.message || '操作の実行中にエラーが発生しました。';
      showToast('error', userMessage);
      setActionError(userMessage);
    } finally {
      setIsActionLoading(false);
      setUpdatingPlayerId(null);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center pb-16 selection:bg-[#C5A059]/30 font-sans">
      {/* Header */}
      <header className="w-full max-w-xl px-4 pt-5 pb-3 border-b border-white/10 sticky top-0 bg-[#050505]/95 backdrop-blur-md z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-[#C5A059] font-mono tracking-widest font-semibold uppercase">
              <span>♠</span>
              <span>HAMA FES DEALER</span>
              <span>♦</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="neon-red-text tracking-tighter">DEALER CONSOLE</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="dealer-reload-btn"
              onClick={handleDealerReload}
              disabled={isManualReloading}
              className="h-9 px-3 rounded-lg bg-gradient-to-r from-[#2A1D0B] via-[#38260E] to-[#2A1D0B] border border-[#C5A059] hover:border-[#FFE082] text-[#FFE082] text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shadow-sm cursor-pointer select-none"
              title="最新のplayersデータをSupabaseから再取得"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FFE082] shrink-0 ${isManualReloading ? 'animate-spin' : ''}`} />
              <span>{isManualReloading ? '読み込み中…' : '↻ リロード'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded border border-white/10 hover:bg-white/10 text-gray-200 transition-colors font-mono flex items-center gap-1 h-9"
              title="一般ランキング画面を開く"
            >
              <ExternalLink className="w-3 h-3 text-[#C5A059]" />
              <span className="hidden sm:inline">PUBLIC VIEW</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-colors font-mono flex items-center gap-1 h-9"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>

        {/* Demo Mode Notice Banner if unconfigured */}
        {!configured && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Supabase 未接続 (デモモードで動作中)</span>
            </div>
            {onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="text-[10px] font-bold underline text-amber-300 hover:text-white"
              >
                接続設定
              </button>
            )}
          </div>
        )}
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-[70] px-4 w-full max-w-md animate-fadeIn pointer-events-none">
          <div
            className={`pointer-events-auto px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xl border ${
              toastMessage.type === 'success'
                ? 'bg-[#102414] border-emerald-500/70 text-emerald-200 shadow-emerald-950/60'
                : 'bg-[#29070c] border-red-500/70 text-red-200 shadow-red-950/60'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <div className="flex-1 leading-snug">{toastMessage.text}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-xl px-4 mt-4 space-y-4 flex-1">
        {/* NEW PLAYER Section (Matching High Density Player Operations) */}
        <section className="p-4 bg-[#8B0000]/10 border border-[#8B0000]/30 rounded-xl relative overflow-hidden">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#FF2D55] font-bold mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>♠</span>
              <span>Register New Player</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono tracking-normal font-normal">
              Initial: 0 ham
            </span>
          </div>

          <form onSubmit={handleAddNewPlayer} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                id="new-player-name-input"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="プレイヤー名を入力..."
                className="flex-1 h-11 px-3.5 rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#FF2D55] text-sm text-white placeholder:text-white/25 outline-none transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  id="new-player-pin-input"
                  value={newPlayerPin}
                  onChange={(e) => setNewPlayerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="PIN(4桁)"
                  title="4桁の数字PIN（未入力時は自動生成）"
                  className="w-28 h-11 px-3 text-center rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#C5A059] text-sm font-mono tracking-widest text-[#F5D77F] placeholder:text-gray-500 placeholder:tracking-normal placeholder:text-xs outline-none transition-all"
                />
                <button
                  type="submit"
                  id="add-new-player-button"
                  disabled={isAddingPlayer || !newPlayerName.trim()}
                  className="h-11 px-5 rounded-lg gold-gradient text-black font-black text-xs uppercase tracking-[0.15em] shadow-[0_4px_15px_rgba(197,160,89,0.3)] hover:brightness-110 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{isAddingPlayer ? '登録中...' : '登録'}</span>
                </button>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-mono flex flex-wrap items-center justify-between gap-1">
              <span>※ 登録時に一意の5桁 PLAYER ID が自動発行されます</span>
              <span>初期残高: 0 ham</span>
            </div>
          </form>
        </section>

        {/* SEARCH & FILTER Section */}
        <section className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="player-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="プレイヤー名 または PLAYER NUMBER (5桁) で絞り込み..."
              className="w-full h-11 pl-10 pr-10 rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#FF2D55] text-sm text-white placeholder:text-white/25 outline-none transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white text-xs font-mono"
              >
                クリア
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-mono">
            <div>
              RESULTS:{' '}
              <span className="font-bold text-[#C5A059]">
                {filteredPlayers.length}
              </span>{' '}
              / {players.length} PLAYERS
            </div>
            <button
              type="button"
              onClick={handleDealerReload}
              disabled={isManualReloading}
              className="flex items-center gap-1.5 text-[#FFE082] hover:text-white transition-colors font-mono font-bold disabled:opacity-50 text-[11px]"
            >
              <RefreshCw className={`w-3 h-3 ${isManualReloading ? 'animate-spin' : ''}`} />
              <span>{isManualReloading ? '読み込み中…' : '↻ リロード'}</span>
            </button>
          </div>
        </section>

        {/* PLAYER LIST */}
        <section className="space-y-3">
          {isLoading && (
            <div className="py-16 text-center text-[#C5A059] font-mono text-sm animate-pulse">
              Loading Players...
            </div>
          )}

          {!isLoading && filteredPlayers.length === 0 && (
            <div className="py-12 text-center rounded-xl bg-[#1A1A1A] border border-white/10 p-6 text-gray-400 text-xs">
              {searchQuery ? (
                <div>
                  一致するプレイヤーが見つかりません: <span className="text-white font-bold">{searchQuery}</span>
                </div>
              ) : (
                <div>プレイヤーがまだ登録されていません。</div>
              )}
            </div>
          )}

          {!isLoading &&
            filteredPlayers.map((player) => {
              const isUpdating = updatingPlayerId === player.id && isActionLoading;
              const currentActiveTab = activeTabMap[player.id] || 'quick';
              const customVal = customAmountMap[player.id] || '';
              const directVal = directAmountMap[player.id] ?? '';
              const editNameVal = editingNameMap[player.id] ?? player.name;

              // Check if custom reduction would be negative
              const customNum = parseInt(customVal, 10);
              const isSubDisabled =
                isNaN(customNum) || customNum <= 0 || player.points - customNum < 0;

              const currentRank = ranksMap.get(player.id) || 1;

              return (
                <div
                  key={player.id}
                  id={`dealer-player-${player.id}`}
                  className={`p-4 bg-[#1A1A1A] rounded-xl border ${
                    isUpdating ? 'border-[#C5A059] animate-pulse' : 'border-white/5'
                  } shadow-lg transition-all relative overflow-hidden`}
                >
                  {/* Top line of player card: Name, points, edit & delete triggers */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Player ID & Rank Badge Line */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-[#C5A059] bg-black/60 px-2 py-0.5 rounded border border-[#C5A059]/30">
                          #{player.player_number || '-----'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-400">
                          PIN: {player.has_pin ? '設定済' : '登録済'}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">
                          総合第{currentRank}位
                        </span>
                        <HamaRankBadge points={player.points} size="xs" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#FF2D55]">♦</span>
                        <h2 className="text-lg font-bold text-white tracking-wide truncate">
                          {player.name}
                        </h2>
                      </div>

                      <div className="mt-1 text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="font-mono text-[11px] uppercase tracking-wider opacity-60">
                          Balance:
                        </span>
                        <span className="text-[#C5A059] font-mono text-lg font-bold">
                          {player.points.toLocaleString()}
                        </span>
                        <span className="text-[#C5A059] font-mono text-xs">ham</span>
                      </div>
                    </div>

                    {/* Secondary Actions (Edit Name / Delete) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          setActiveTabMap((prev) => ({
                            ...prev,
                            [player.id]: currentActiveTab === 'edit' ? 'quick' : 'edit',
                          }));
                          setEditingNameMap((prev) => ({ ...prev, [player.id]: player.name }));
                        }}
                        className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                          currentActiveTab === 'edit'
                            ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#F1D38A]'
                            : 'bg-black/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                        title="プレイヤー名を変更"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleTriggerDelete(player)}
                        className="p-2 rounded-lg bg-[#4A0404]/50 border border-[#8B0000]/60 text-[#FF2D55] hover:bg-[#8B0000]/60 transition-all text-xs disabled:opacity-40"
                        title="プレイヤーを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dealer-Only PIN Management Panel */}
                  {(() => {
                    const currentPin =
                      dealerPins[player.id] ||
                      (player.player_number ? dealerPins[player.player_number] : '') ||
                      player.pin ||
                      '';
                    const isRevealed = revealedPins[player.id];

                    return (
                      <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-[#C5A059] font-bold">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>PIN確認</span>
                          </div>
                          <div className="font-mono text-sm font-black bg-black/80 px-3 py-1 rounded border border-[#C5A059]/40 min-w-[76px] text-center tracking-[0.25em] text-[#F5D77F] shadow-inner">
                            {isRevealed ? (currentPin || '----') : '••••'}
                          </div>
                          <button
                            type="button"
                            id={`toggle-pin-btn-${player.id}`}
                            onClick={() => {
                              setRevealedPins((prev) => ({
                                ...prev,
                                [player.id]: !prev[player.id],
                              }));
                            }}
                            className="h-7 px-2.5 text-[11px] font-mono text-gray-300 hover:text-white rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1 transition-colors"
                            title={isRevealed ? 'PINを隠す' : 'PINを表示'}
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff className="w-3 h-3 text-gray-400" />
                                <span>隠す</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 text-[#C5A059]" />
                                <span>表示</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <input
                            type="text"
                            maxLength={4}
                            id={`change-pin-input-${player.id}`}
                            value={editingPinMap[player.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setEditingPinMap((prev) => ({ ...prev, [player.id]: val }));
                            }}
                            placeholder="新PIN(4桁)"
                            className="w-24 h-7 px-2 text-xs font-mono text-center rounded bg-[#141414] border border-white/20 focus:border-[#C5A059] text-white outline-none tracking-widest placeholder:tracking-normal placeholder:text-[10px]"
                          />
                          <button
                            type="button"
                            id={`submit-change-pin-btn-${player.id}`}
                            disabled={isUpdating || (editingPinMap[player.id] ?? '').length !== 4}
                            onClick={() => handleTriggerChangePin(player)}
                            className="h-7 px-2.5 rounded bg-[#C5A059]/20 hover:bg-[#C5A059]/30 border border-[#C5A059]/50 text-[#F1D38A] text-[11px] font-mono font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            変更
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mode Navigation Tabs: Quick (+100/500/1000) / Custom (+/- 任意) / Direct (直接設定) */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTabMap((prev) => ({ ...prev, [player.id]: 'quick' }))
                      }
                      className={`h-8 text-[11px] font-bold rounded transition-all font-mono ${
                        currentActiveTab === 'quick'
                          ? 'gold-gradient text-black shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      QUICK
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTabMap((prev) => ({ ...prev, [player.id]: 'custom' }))
                      }
                      className={`h-8 text-[11px] font-bold rounded transition-all font-mono ${
                        currentActiveTab === 'custom'
                          ? 'gold-gradient text-black shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      CUSTOM (+/-)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTabMap((prev) => ({ ...prev, [player.id]: 'direct' }));
                        setDirectAmountMap((prev) => ({
                          ...prev,
                          [player.id]: String(player.points),
                        }));
                      }}
                      className={`h-8 text-[11px] font-bold rounded transition-all font-mono ${
                        currentActiveTab === 'direct'
                          ? 'gold-gradient text-black shadow-sm'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      DIRECT SET
                    </button>
                  </div>

                  {/* TAB 1: QUICK HAM OPERATIONS (+100, +500, +1000) */}
                  {currentActiveTab === 'quick' && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        id={`quick-add-100-${player.id}`}
                        disabled={isUpdating}
                        onClick={() => handleTriggerQuickAdd(player, 100)}
                        className="bg-black border border-white/10 py-2.5 rounded-lg text-xs font-mono font-bold hover:border-[#C5A059] transition-colors text-white flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        <span className="text-[#F1D38A]">+100</span>
                        <span className="text-[10px] text-gray-500">ham</span>
                      </button>
                      <button
                        type="button"
                        id={`quick-add-500-${player.id}`}
                        disabled={isUpdating}
                        onClick={() => handleTriggerQuickAdd(player, 500)}
                        className="bg-black border border-white/10 py-2.5 rounded-lg text-xs font-mono font-bold hover:border-[#C5A059] transition-colors text-white flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        <span className="text-[#F1D38A]">+500</span>
                        <span className="text-[10px] text-gray-500">ham</span>
                      </button>
                      <button
                        type="button"
                        id={`quick-add-1000-${player.id}`}
                        disabled={isUpdating}
                        onClick={() => handleTriggerQuickAdd(player, 1000)}
                        className="bg-black border border-white/10 py-2.5 rounded-lg text-xs font-mono font-bold hover:border-[#C5A059] transition-colors text-white flex items-center justify-center gap-1 disabled:opacity-40"
                      >
                        <span className="text-[#F1D38A]">+1,000</span>
                        <span className="text-[10px] text-gray-500">ham</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 2: CUSTOM HAM (+ / - 任意加算減算) */}
                  {currentActiveTab === 'custom' && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            id={`custom-input-${player.id}`}
                            value={customVal}
                            onChange={(e) =>
                              setCustomAmountMap((prev) => ({
                                ...prev,
                                [player.id]: e.target.value,
                              }))
                            }
                            placeholder="数値を入力 (例: 250)"
                            className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/20 focus:border-[#C5A059] text-white text-sm outline-none font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">
                            ham
                          </span>
                        </div>
                        <button
                          type="button"
                          id={`custom-add-btn-${player.id}`}
                          disabled={isUpdating || !customVal}
                          onClick={() => handleTriggerCustomAdjust(player, true)}
                          className="h-10 px-3.5 rounded-lg bg-[#0D2818] border border-emerald-700/60 text-emerald-400 text-xs font-bold font-mono tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                        >
                          + ADD
                        </button>
                        <button
                          type="button"
                          id={`custom-sub-btn-${player.id}`}
                          disabled={isUpdating || isSubDisabled}
                          onClick={() => handleTriggerCustomAdjust(player, false)}
                          className="h-10 px-3.5 rounded-lg bg-[#4A0404] border border-[#8B0000] text-xs font-bold font-mono tracking-widest text-[#FF2D55] hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                          title={
                            isSubDisabled && customNum > player.points
                              ? 'ham残高がマイナスになるため減算できません'
                              : 'hamを減算'
                          }
                        >
                          - DEDUCT
                        </button>
                      </div>
                      {customNum > player.points && (
                        <div className="text-[11px] text-red-400 flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3 h-3" />
                          <span>0 ham 未満への減算はできません</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: DIRECT HAM SET (直接数値設定) */}
                  {currentActiveTab === 'direct' && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            id={`direct-input-${player.id}`}
                            value={directVal}
                            onChange={(e) =>
                              setDirectAmountMap((prev) => ({
                                ...prev,
                                [player.id]: e.target.value,
                              }))
                            }
                            placeholder="設定後の値を入力 (例: 5000)"
                            className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/20 focus:border-[#C5A059] text-white text-sm outline-none font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">
                            ham
                          </span>
                        </div>
                        <button
                          type="button"
                          id={`direct-submit-btn-${player.id}`}
                          disabled={isUpdating || directVal === ''}
                          onClick={() => handleTriggerDirectSet(player)}
                          className="h-10 px-4 rounded-lg bg-[#1A1A1A] border border-[#C5A059]/40 text-[#C5A059] text-xs font-bold font-mono tracking-widest hover:bg-[#C5A059]/10 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                        >
                          DIRECT SET
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: EDIT PLAYER NAME */}
                  {currentActiveTab === 'edit' && (
                    <div className="mt-3 p-3 rounded-lg bg-black/60 border border-white/10 space-y-2">
                      <div className="text-xs text-gray-300 font-semibold">
                        新しいプレイヤー名
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id={`edit-name-input-${player.id}`}
                          value={editNameVal}
                          onChange={(e) =>
                            setEditingNameMap((prev) => ({
                              ...prev,
                              [player.id]: e.target.value,
                            }))
                          }
                          className="flex-1 h-9 px-3 rounded-lg bg-[#1A1A1A] border border-white/20 text-sm text-white focus:border-[#C5A059] outline-none"
                        />
                        <button
                          type="button"
                          disabled={isUpdating || !editNameVal.trim()}
                          onClick={() => handleTriggerEditName(player)}
                          className="h-9 px-3.5 rounded-lg gold-gradient text-black font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-40"
                        >
                          変更保存
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTabMap((prev) => ({ ...prev, [player.id]: 'quick' }))
                          }
                          className="h-9 px-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs font-mono"
                        >
                          閉じる
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </section>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        action={pendingAction}
        isLoading={isActionLoading}
        errorMessage={actionError}
        onClose={() => {
          if (!isActionLoading) {
            setPendingAction(null);
            setActionError(null);
          }
        }}
        onConfirm={handleExecuteConfirmedAction}
      />
    </div>
  );
};
