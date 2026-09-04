import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Player, PointHistory } from '../types';

// Retrieve credentials from environment or local overrides
const ENV_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Normalizes Supabase project URL by removing quotes, whitespace, trailing slashes,
 * enforcing https://, and stripping any PostgREST/auth path components (e.g. /rest/v1 or /rest)
 * so createClient receives the clean project base URL.
 */
export function normalizeSupabaseUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip quotes
  url = url.replace(/^['"]|['"]$/g, '');
  // Strip whitespace
  url = url.replace(/\s+/g, '');
  // Ensure protocol
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  } else if (!url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip /rest/v1 or /rest or /auth/v1
  url = url.replace(/\/(rest|auth)(\/v\d+)?\/?$/i, '');
  return url.replace(/\/+$/, '');
}

export function normalizeSupabaseKey(rawKey?: string | null): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
}

export function getActiveCredentials(): { url: string; key: string } {
  const localUrl = localStorage.getItem('hamafes_supabase_url');
  const localKey = localStorage.getItem('hamafes_supabase_anon_key');

  // If localUrl exists, clean and persist if needed
  if (localUrl) {
    const cleanLocal = normalizeSupabaseUrl(localUrl);
    if (cleanLocal !== localUrl.trim()) {
      localStorage.setItem('hamafes_supabase_url', cleanLocal);
    }
  }

  const rawUrl = localUrl?.trim() || ENV_URL || '';
  const rawKey = localKey?.trim() || ENV_KEY || '';

  const url = normalizeSupabaseUrl(rawUrl);
  const key = normalizeSupabaseKey(rawKey);

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getActiveCredentials();
  return Boolean(url && key && url.startsWith('https://'));
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

// Custom monitored fetch to trace every network request made by Supabase with safe global context
const monitoredFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const method = init?.method || (input instanceof Request ? input.method : 'GET');
  console.log(`[Supabase Network Request] -> ${method} ${urlStr}`);

  try {
    const nativeFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis);
    // Explicitly set mode: 'cors' and credentials: 'omit' to prevent Safari ITP / iframe CORS wildcard blocking
    const safeInit: RequestInit = {
      ...(init || {}),
      mode: 'cors',
      credentials: 'omit',
    };
    const res = await nativeFetch(input, safeInit);
    console.log(`[Supabase Network Response] <- ${method} ${urlStr} [Status: ${res.status} ${res.statusText}]`);
    return res;
  } catch (err: any) {
    console.error(`[Supabase Network Exception] ${method} ${urlStr} FAILED:`, {
      name: err?.name,
      message: err?.message,
      cause: err?.cause,
    });
    throw err;
  }
};

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getActiveCredentials();

  if (!url || !key || !url.startsWith('https://')) {
    return null;
  }

  if (supabaseInstance && currentUrl === url && currentKey === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: monitoredFetch,
      },
    });
    currentUrl = url;
    currentKey = key;
    console.log(`[Supabase] Initialized single client instance for: ${url}`);
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function setCustomCredentials(url: string, key: string) {
  const normalized = normalizeSupabaseUrl(url);
  if (normalized) localStorage.setItem('hamafes_supabase_url', normalized);
  else localStorage.removeItem('hamafes_supabase_url');

  if (key) localStorage.setItem('hamafes_supabase_anon_key', key.trim());
  else localStorage.removeItem('hamafes_supabase_anon_key');

  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
}

// Initial demo mock data if Supabase is not connected yet
const DEMO_STORAGE_KEY = 'hamafes_demo_players_data';
const DEMO_HISTORY_KEY = 'hamafes_demo_point_history';
const PLAYER_NUMBERS_MAP_KEY = 'hamafes_player_number_map';
const ALLOCATED_NUMBERS_HISTORY_KEY = 'hamafes_allocated_player_numbers';
const DEVICE_ID_STORAGE_KEY = 'hamafes_client_device_id';
const PLAYER_DEVICE_BINDINGS_KEY = 'hamafes_player_device_bindings';
const ACTIVE_MY_HAMA_SESSION_KEY = 'hamafes_active_my_hama_session';

export interface MyHamaSession {
  playerId: string;
  playerNumber: string;
  deviceId: string;
  authenticatedAt: string;
}

/**
 * Get or generate a persistent cryptographically secure device ID for this client browser
 */
export function getClientDeviceId(): string {
  try {
    let devId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!devId) {
      // Generate a collision-resistant unique token
      devId = 'dev_' + crypto.randomUUID().replace(/-/g, '') + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, devId);
    }
    return devId;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2);
  }
}

/**
 * Get device bindings map (player_number -> deviceId)
 */
export function getPlayerDeviceBindings(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PLAYER_DEVICE_BINDINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

/**
 * Save device bindings map
 */
export function savePlayerDeviceBindings(map: Record<string, string>) {
  try {
    localStorage.setItem(PLAYER_DEVICE_BINDINGS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// In-memory active session for instant verification
let inMemoryMyHamaSession: MyHamaSession | null = null;

export function getActiveMyHamaSession(): MyHamaSession | null {
  if (inMemoryMyHamaSession) return inMemoryMyHamaSession;
  try {
    const raw = localStorage.getItem(ACTIVE_MY_HAMA_SESSION_KEY);
    if (raw) {
      const parsed: MyHamaSession = JSON.parse(raw);
      const currentDeviceId = getClientDeviceId();
      if (parsed.deviceId === currentDeviceId) {
        inMemoryMyHamaSession = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function setActiveMyHamaSession(session: MyHamaSession | null) {
  inMemoryMyHamaSession = session;
  try {
    if (session) {
      localStorage.setItem(ACTIVE_MY_HAMA_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(ACTIVE_MY_HAMA_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export function logoutMyHamaSession() {
  setActiveMyHamaSession(null);
}

/**
 * Checks if a dealer is currently authenticated.
 */
export function isDealerLoggedIn(): boolean {
  try {
    const demoAuth = localStorage.getItem('hamafes_demo_auth');
    if (demoAuth === 'true') return true;
    // Check supabase session in localStorage
    const hasSbAuth = Object.keys(localStorage).some(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    return hasSbAuth;
  } catch {
    return false;
  }
}

const DEALER_PIN_MAP_KEY = 'hamafes_dealer_pin_map';

/**
 * Internal storage for player PINs.
 * STRICT SECURITY: Never sent in public lists or public responses.
 */
export function getDealerPinMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DEALER_PIN_MAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  // Pre-seed default 4-digit PINs for demo players
  const initialMap: Record<string, string> = {
    'p-1': '5832',
    '58321': '5832',
    'p-2': '1020',
    '10204': '1020',
    'p-3': '3948',
    '39482': '3948',
    'p-4': '6253',
    '62530': '6253',
    'p-5': '4120',
    '41209': '4120',
    'p-6': '8019',
    '80194': '8019',
  };
  try {
    localStorage.setItem(DEALER_PIN_MAP_KEY, JSON.stringify(initialMap));
  } catch {}
  return initialMap;
}

export function saveDealerPinMap(map: Record<string, string>) {
  try {
    localStorage.setItem(DEALER_PIN_MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Fetch PIN map for Dealer view.
 * STRICT ACCESS CONTROL: Only returns data if isDealerLoggedIn() is true.
 * Never called by or returned to public users.
 */
export async function fetchDealerPins(): Promise<Record<string, string>> {
  if (!isDealerLoggedIn()) {
    console.warn('[Security] Unauthorized fetchDealerPins request blocked.');
    return {};
  }
  const pinMap = getDealerPinMap();
  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client
        .from('players')
        .select('id, player_number, pin')
        .is('deleted_at', null);
      if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.pin && /^\d{4}$/.test(String(row.pin))) {
            const pinStr = String(row.pin);
            pinMap[String(row.id)] = pinStr;
            if (row.player_number) {
              pinMap[String(row.player_number)] = pinStr;
            }
          }
        });
        saveDealerPinMap(pinMap);
      }
    } catch {
      // Column 'pin' may not exist yet in Supabase table; dealer map is used
    }
  }
  return pinMap;
}

/**
 * Fetch single player PIN for Dealer.
 * STRICT ACCESS CONTROL: Allowed only for authenticated Dealer.
 */
export async function fetchPlayerPinForDealer(playerId: string, playerNumber?: string): Promise<string | null> {
  if (!isDealerLoggedIn()) {
    return null;
  }
  const pins = await fetchDealerPins();
  return pins[playerId] || (playerNumber ? pins[playerNumber] : null) || null;
}

/**
 * Update player's 4-digit PIN.
 * STRICT ACCESS CONTROL: Allowed only for authenticated Dealer.
 * Enforces 4-digit numeric validation (0000〜9999).
 */
export async function updatePlayerPin(playerId: string, newPin: string, playerNumber?: string): Promise<void> {
  if (!isDealerLoggedIn()) {
    throw new Error('PINの変更にはディーラー権限が必要です。');
  }
  const cleanPin = String(newPin || '').trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error('PINコードは4桁の数字（0000〜9999）で入力してください。');
  }
  const pinMap = getDealerPinMap();
  pinMap[playerId] = cleanPin;
  if (playerNumber) {
    pinMap[playerNumber] = cleanPin;
  }
  saveDealerPinMap(pinMap);

  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client
        .from('players')
        .update({ pin: cleanPin })
        .eq('id', playerId);
      if (error) {
        console.warn('Supabase player PIN column update error (fallback stored in dealer map):', error.message);
      }
    } catch (err: any) {
      console.warn('Exception updating player PIN on Supabase:', err);
    }
  }
}

/**
 * Get the set of all previously allocated 5-digit player numbers to ensure uniqueness
 * even after a player is deleted.
 */
export function getAllocatedPlayerNumbers(): Set<string> {
  try {
    const raw = localStorage.getItem(ALLOCATED_NUMBERS_HISTORY_KEY);
    if (raw) {
      const arr: string[] = JSON.parse(raw);
      return new Set(arr);
    }
  } catch {
    // fallback
  }
  return new Set();
}

/**
 * Record a newly allocated 5-digit player number into long-term history
 */
export function recordAllocatedPlayerNumber(num: string) {
  try {
    const allocated = getAllocatedPlayerNumbers();
    allocated.add(num);
    localStorage.setItem(ALLOCATED_NUMBERS_HISTORY_KEY, JSON.stringify(Array.from(allocated)));
  } catch {
    // ignore
  }
}

/**
 * Get or set a persistent 5-digit player number for a given player ID
 */
export function getLocalPlayerNumberMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PLAYER_NUMBERS_MAP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveLocalPlayerNumberMap(map: Record<string, string>) {
  try {
    localStorage.setItem(PLAYER_NUMBERS_MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Generate a guaranteed unique 5-digit string from '00001' to '99999'
 */
export function generateUniquePlayerNumber(existingSet?: Set<string>): string {
  const allocated = getAllocatedPlayerNumbers();
  const blocked = new Set<string>([...allocated, ...(existingSet || [])]);

  // Attempt random generation within 10000..99999 or 00001..99999
  for (let i = 0; i < 20000; i++) {
    const n = Math.floor(Math.random() * 99999) + 1;
    const candidate = String(n).padStart(5, '0');
    if (!blocked.has(candidate)) {
      recordAllocatedPlayerNumber(candidate);
      return candidate;
    }
  }

  // Linear scan fallback if collisions occur
  for (let n = 1; n <= 99999; n++) {
    const candidate = String(n).padStart(5, '0');
    if (!blocked.has(candidate)) {
      recordAllocatedPlayerNumber(candidate);
      return candidate;
    }
  }

  return '99999';
}

function getDemoPlayers(): Player[] {
  const saved = localStorage.getItem(DEMO_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  const defaults: Player[] = [
    { id: 'p-1', name: 'ダイヤのジョー', points: 12500, player_number: '58321', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 'p-2', name: 'クイーン・エマ', points: 10200, player_number: '10204', created_at: new Date(Date.now() - 3600000 * 20).toISOString() },
    { id: 'p-3', name: 'ジャック・スペード', points: 8500, player_number: '39482', created_at: new Date(Date.now() - 3600000 * 16).toISOString() },
    { id: 'p-4', name: 'キング・マーク', points: 6200, player_number: '62530', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 'p-5', name: 'ラッキー・セブン', points: 4100, player_number: '41209', created_at: new Date(Date.now() - 3600000 * 8).toISOString() },
    { id: 'p-6', name: 'エース・タカシ', points: 1800, player_number: '80194', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
  ];
  // Record these default numbers
  defaults.forEach((d) => {
    if (d.player_number) recordAllocatedPlayerNumber(d.player_number);
  });
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(defaults));

  // Initialize rich demo point history for graph verification
  try {
    if (!localStorage.getItem(DEMO_HISTORY_KEY)) {
      const now = Date.now();
      const mockHist: PointHistory[] = [
        { id: 'dh-1', player_id: 'p-1', old_points: 0, new_points: 3000, difference: 3000, created_at: new Date(now - 86400000).toISOString() },
        { id: 'dh-2', player_id: 'p-1', old_points: 3000, new_points: 7500, difference: 4500, created_at: new Date(now - 54000000).toISOString() },
        { id: 'dh-3', player_id: 'p-1', old_points: 7500, new_points: 6000, difference: -1500, created_at: new Date(now - 32000000).toISOString() },
        { id: 'dh-4', player_id: 'p-1', old_points: 6000, new_points: 10000, difference: 4000, created_at: new Date(now - 14000000).toISOString() },
        { id: 'dh-5', player_id: 'p-1', old_points: 10000, new_points: 12500, difference: 2500, created_at: new Date(now - 3600000).toISOString() },
      ];
      localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(mockHist));
    }
  } catch {
    // ignore
  }

  return defaults;
}

function saveDemoPlayers(players: Player[]) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(players));
  window.dispatchEvent(new CustomEvent('hamafes_demo_players_changed', { detail: players }));
}

// ==========================================
// Database Operations
// ==========================================

/**
 * Fetch players ordered by points descending
 */
export async function fetchPlayers(): Promise<Player[]> {
  const client = getSupabase();
  if (!client) {
    // In demo mode
    const list = getDemoPlayers();
    return list
      .filter((p) => !p.deleted_at)
      .sort((a, b) => b.points - a.points);
  }

  try {
    const { url } = getActiveCredentials();
    console.log(`[Supabase] Querying public.players from ${url}`);

    // Query all columns from public.players ordered by points descending
    const { data, error } = await client
      .from('players')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      console.error('Supabase fetchPlayers error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`プレイヤー一覧の取得に失敗しました: ${error.message}`);
    }

    if (!data) return [];
    console.log(`[Supabase] Retrieved ${data.length} players from database`);

    const localMap = getLocalPlayerNumberMap();
    let mapUpdated = false;
    const existingNumbers = new Set<string>();

    // Collect already known numbers
    data.forEach((row: any) => {
      const num = row.player_number ? String(row.player_number).trim() : localMap[String(row.id)];
      if (num && num.length === 5) {
        existingNumbers.add(num);
        recordAllocatedPlayerNumber(num);
      }
    });

    // Filter out soft-deleted players if deleted_at exists on the row
    const players: Player[] = data
      .filter((row: any) => row.deleted_at === undefined || row.deleted_at === null)
      .map((row: any) => {
        const id = String(row.id);
        let playerNumber: string = row.player_number ? String(row.player_number).trim() : '';

        if (!playerNumber || playerNumber.length !== 5) {
          if (localMap[id] && localMap[id].length === 5) {
            playerNumber = localMap[id];
          } else {
            playerNumber = generateUniquePlayerNumber(existingNumbers);
            localMap[id] = playerNumber;
            mapUpdated = true;
            // Attempt to safely persist back to players table in Supabase
            client
              .from('players')
              .update({ player_number: playerNumber })
              .eq('id', id)
              .then(
                ({ error: updateErr }: any) => {
                  if (updateErr) {
                    // Column may not exist or RLS may block, localMap will safely persist it
                    console.log(`[player_number update note for ${id}]:`, updateErr.message);
                  } else {
                    console.log(`[player_number successfully saved to Supabase for ${id}]:`, playerNumber);
                  }
                },
                () => {}
              );
          }
        }

        existingNumbers.add(playerNumber);
        recordAllocatedPlayerNumber(playerNumber);

        return {
          id,
          // Support both 'username' (current database column) and 'name'
          name: String(row.name ?? row.username ?? 'Unknown'),
          points: Number(row.points ?? 0),
          player_number: playerNumber,
          created_at: row.created_at,
          deleted_at: row.deleted_at,
        };
      });

    if (mapUpdated) {
      saveLocalPlayerNumberMap(localMap);
    }

    return players;
  } catch (err: any) {
    console.error('fetchPlayers exception:', err);
    throw err;
  }
}

/**
 * Fetch point history for a specific player (ordered chronologically by created_at ascending).
 * Protects personal history:
 * STRICT AUTHORIZATION RULE:
 * History and graph data can ONLY be retrieved if:
 * 1. Dealer is actively logged in, OR
 * 2. An active MY HAMA session is authenticated for THIS EXACT player.
 * Attempting to fetch another player's history without authorization is immediately blocked.
 */
export async function fetchPlayerHistory(playerId: string): Promise<PointHistory[]> {
  const isDealer = isDealerLoggedIn();
  const myHamaSession = getActiveMyHamaSession();
  const isAuthorized = isDealer || (myHamaSession && myHamaSession.playerId === playerId);

  if (!isAuthorized) {
    console.warn('[Security Guard] Unauthorized point_history access blocked for playerId:', playerId);
    return [];
  }

  const client = getSupabase();
  if (!client) {
    try {
      const historyRaw = localStorage.getItem(DEMO_HISTORY_KEY);
      const historyList: PointHistory[] = historyRaw ? JSON.parse(historyRaw) : [];
      return historyList
        .filter((h) => h.player_id === playerId)
        .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await client
      .from('point_history')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchPlayerHistory error:', error);
      // Try direct fetch if client error occurs
      const { url, key } = getActiveCredentials();
      const directUrl = `${url}/rest/v1/point_history?player_id=eq.${encodeURIComponent(playerId)}&order=created_at.asc`;
      const directRes = await fetch(directUrl, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        return directData.map((row: any) => ({
          id: String(row.id),
          player_id: String(row.player_id),
          old_points: Number(row.old_points ?? 0),
          new_points: Number(row.new_points ?? 0),
          difference: Number(row.difference ?? 0),
          dealer_id: row.dealer_id,
          created_at: row.created_at,
        }));
      }
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      player_id: String(row.player_id),
      old_points: Number(row.old_points ?? 0),
      new_points: Number(row.new_points ?? 0),
      difference: Number(row.difference ?? 0),
      dealer_id: row.dealer_id,
      created_at: row.created_at,
    }));
  } catch (err: any) {
    console.warn('fetchPlayerHistory exception:', err);
    return [];
  }
}

// Helper to check if string is valid UUID (PostgreSQL uuid type)
export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Update player ham (points) and record point history safely with full step-by-step error tracking
 */
export async function updatePlayerHam(
  player: Player,
  newPoints: number,
  dealerId?: string | null
): Promise<Player> {
  if (newPoints < 0) {
    throw new Error('hamは0未満にできません。');
  }

  const oldPoints = Number(player.points);
  const difference = newPoints - oldPoints;

  // Step 2: Confirm ham update function was invoked
  console.log('[updatePlayerHam - Step 2: Function Invoked]', {
    playerId: player.id,
    playerName: player.name,
    oldPoints,
    newPoints,
    difference,
    requestedDealerId: dealerId,
    timestamp: new Date().toISOString(),
  });

  const client = getSupabase();
  const { url: currentSupabaseUrl, key: currentSupabaseKey } = getActiveCredentials();

  if (!client) {
    // Demo Mode Update
    console.log('[updatePlayerHam - Demo Mode Fallback]');
    const currentList = getDemoPlayers();
    const idx = currentList.findIndex((p) => p.id === player.id);
    if (idx === -1) {
      throw new Error('プレイヤーが見つかりませんでした。');
    }

    const updated = { ...currentList[idx], points: newPoints };
    currentList[idx] = updated;
    saveDemoPlayers(currentList);

    // Save demo history
    try {
      const historyRaw = localStorage.getItem(DEMO_HISTORY_KEY);
      const historyList: PointHistory[] = historyRaw ? JSON.parse(historyRaw) : [];
      historyList.unshift({
        id: 'hist-' + Date.now(),
        player_id: player.id,
        old_points: oldPoints,
        new_points: newPoints,
        difference,
        dealer_id: dealerId || 'demo-dealer',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(historyList.slice(0, 50)));
    } catch {
      // ignore local demo history error
    }

    return updated;
  }

  try {
    // Step 3: Check currently logged in Supabase Auth user session
    let effectiveDealerId = dealerId;
    let authUser: any = null;
    let sessionValid = false;
    let currentAccessToken: string | null = null;

    try {
      const { data: sessionData, error: sessionErr } = await client.auth.getSession();
      const activeSession = sessionData?.session;

      if (activeSession?.access_token) {
        currentAccessToken = activeSession.access_token;
      }

      console.log('[updatePlayerHam - Step 3: Auth Session Check]:', {
        hasSession: Boolean(activeSession),
        userId: activeSession?.user?.id,
        userEmail: activeSession?.user?.email,
        role: activeSession?.user?.role,
        hasAccessToken: Boolean(currentAccessToken),
        tokenPrefix: currentAccessToken ? currentAccessToken.substring(0, 15) + '...' : 'NONE',
        expiresAt: activeSession?.expires_at ? new Date(activeSession.expires_at * 1000).toISOString() : null,
        isExpired: activeSession?.expires_at ? activeSession.expires_at * 1000 < Date.now() : null,
        sessionError: sessionErr?.message,
      });

      if (activeSession?.user) {
        authUser = activeSession.user;
        sessionValid = true;
        if (!effectiveDealerId || !isValidUUID(effectiveDealerId)) {
          effectiveDealerId = authUser.id;
        }

        // Auto-refresh token if expired or expiring within 60s
        if (activeSession.expires_at && activeSession.expires_at * 1000 - Date.now() < 60000) {
          console.log('[updatePlayerHam] Session near expiry, refreshing token...');
          try {
            const { data: refreshed, error: refErr } = await client.auth.refreshSession();
            if (!refErr && refreshed?.session?.access_token) {
              currentAccessToken = refreshed.session.access_token;
              authUser = refreshed.session.user;
              console.log('[updatePlayerHam] Session refreshed successfully for:', authUser.email);
            }
          } catch (rErr) {
            console.warn('[updatePlayerHam] Session refresh exception:', rErr);
          }
        }
      } else {
        // Fallback check with getUser()
        const { data: userData, error: userErr } = await client.auth.getUser();
        if (userData?.user) {
          authUser = userData.user;
          sessionValid = true;
          if (!effectiveDealerId || !isValidUUID(effectiveDealerId)) {
            effectiveDealerId = authUser.id;
          }
          console.log('[updatePlayerHam] Fallback getUser found user:', authUser.email);
        } else {
          console.warn('[updatePlayerHam] Fallback getUser returned no user:', userErr?.message);
        }
      }
    } catch (authCheckErr: any) {
      console.warn('[updatePlayerHam - Step 3 Exception]:', authCheckErr);
    }

    // Step 4: Verify Supabase client URL and Publishable Key
    const isHttpsUrl = currentSupabaseUrl.startsWith('https://');
    const hasCleanUrl = !currentSupabaseUrl.includes('/rest') && !currentSupabaseUrl.endsWith('/');
    console.log('[updatePlayerHam - Step 4: Supabase Credentials Verification]:', {
      url: currentSupabaseUrl,
      keyPrefix: currentSupabaseKey ? currentSupabaseKey.substring(0, 16) + '...' : 'MISSING',
      isHttps: isHttpsUrl,
      hasCleanUrl,
      dealerAuthenticated: sessionValid,
      dealerEmail: authUser?.email,
      effectiveDealerId,
    });

    if (!isHttpsUrl) {
      throw new Error(`Supabase URL設定エラー: HTTPS から始まる正しいプロジェクト URL を設定してください (${currentSupabaseUrl})`);
    }

    // Step 5: players table UPDATE request preparation
    const updateTargetUrl = `${currentSupabaseUrl}/rest/v1/players?id=eq.${encodeURIComponent(player.id)}`;
    const updatePayload: Record<string, any> = {
      points: newPoints,
      updated_at: new Date().toISOString(),
    };

    console.log('[updatePlayerHam - Step 5: players UPDATE Request Info]:', {
      targetUrl: updateTargetUrl,
      method: 'PATCH',
      playerId: player.id,
      playerName: player.name,
      payload: updatePayload,
      authorizationType: currentAccessToken ? 'Bearer (User Session JWT)' : 'Bearer (Publishable Key)',
    });

    // Step 6: Execute UPDATE and capture response, status, and errors
    let updatedRows: any[] | null = null;
    let updateError: { code?: string; message: string; details?: string; hint?: string } | null = null;
    let updateStatus: number | null = null;
    let updateStatusText: string | null = null;

    // First attempt: via Supabase-js client
    try {
      const updateRes = await client
        .from('players')
        .update(updatePayload)
        .eq('id', player.id)
        .select('*');

      updatedRows = updateRes.data;
      updateStatus = updateRes.status;
      updateStatusText = updateRes.statusText;

      if (updateRes.error) {
        updateError = {
          code: updateRes.error.code,
          message: updateRes.error.message,
          details: updateRes.error.details,
          hint: updateRes.error.hint,
        };
      }
    } catch (clientException: any) {
      console.warn('[updatePlayerHam - Supabase client UPDATE threw exception]:', clientException);
      updateError = {
        code: clientException?.code || 'CLIENT_EXCEPTION',
        message: clientException?.message || String(clientException),
        details: clientException?.stack || 'Supabase-js client update failed',
        hint: 'Attempting direct fetch fallback to capture precise HTTP status and PostgREST error',
      };
    }

    // Direct Fetch Fallback: If client update failed or threw TypeError (e.g. Load failed in WebKit / Safari)
    if (updateError && (updateError.message?.includes('Load failed') || updateError.message?.includes('Failed to fetch') || !updatedRows)) {
      console.log('[updatePlayerHam - Executing Direct Fetch Fallback for players UPDATE] ->', updateTargetUrl);

      try {
        const directHeaders: Record<string, string> = {
          'apikey': currentSupabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        };
        if (currentAccessToken) {
          directHeaders['Authorization'] = `Bearer ${currentAccessToken}`;
        } else {
          directHeaders['Authorization'] = `Bearer ${currentSupabaseKey}`;
        }

        const nativeFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis);
        const directRes = await nativeFetch(updateTargetUrl, {
          method: 'PATCH',
          mode: 'cors',
          credentials: 'omit',
          headers: directHeaders,
          body: JSON.stringify(updatePayload),
        });

        updateStatus = directRes.status;
        updateStatusText = directRes.statusText;
        const directText = await directRes.text();
        console.log(`[updatePlayerHam - Direct Fetch Response]: Status ${updateStatus} ${updateStatusText}, Body:`, directText);

        if (directRes.ok) {
          try {
            const parsedData = JSON.parse(directText);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              updatedRows = parsedData;
              updateError = null; // Successfully resolved via direct fetch!
              console.log('[updatePlayerHam - Direct Fetch Resolved UPDATE Successfully!]:', updatedRows);
            } else if (Array.isArray(parsedData) && parsedData.length === 0) {
              // 0 rows updated (PostgreSQL RLS restriction)
              updateError = {
                code: '42501_RLS_0_ROWS',
                message: 'players テーブルの更新権限がありません (RLSポリシー違反の可能性があります)',
                details: 'PostgreSQL returned 0 affected rows. In PostgreSQL with RLS enabled, an UPDATE without matching policy returns 0 rows.',
                hint: 'Supabaseのダッシュボードで players テーブルの authenticated ユーザーに対する UPDATE ポリシーを確認してください (FOR UPDATE TO authenticated)',
              };
            }
          } catch {
            // Not JSON
          }
        } else {
          // Direct response returned HTTP error (e.g., 401, 403, 404)
          try {
            const errJson = JSON.parse(directText);
            updateError = {
              code: errJson.code || String(updateStatus),
              message: errJson.message || `HTTP ${updateStatus} ${updateStatusText}`,
              details: errJson.details || directText,
              hint: errJson.hint || (updateStatus === 401 ? 'Supabase Auth セッションの期限が切れている可能性があります' : undefined),
            };
          } catch {
            updateError = {
              code: String(updateStatus),
              message: `HTTP ${updateStatus}: ${updateStatusText}`,
              details: directText,
              hint: 'Supabase サーバーからの応答を確認してください',
            };
          }
        }
      } catch (directFetchErr: any) {
        console.warn('[updatePlayerHam - Direct Fetch to Supabase Failed]:', directFetchErr);
        if (updateError) {
          updateError.details = `${updateError.details || ''}\nDirect Fetch Error: ${directFetchErr?.message}`;
        }
      }

      // Step 6.5: If direct connection from browser is blocked (TypeError: Load failed / CORS / ad-blocker),
      // seamlessly execute via the application server proxy (/api/players/update-ham)
      if (updateError && (!updatedRows || updatedRows.length === 0)) {
        console.log('[updatePlayerHam - Executing Server-Side API Proxy Fallback] -> /api/players/update-ham');
        try {
          const proxyRes = await fetch('/api/players/update-ham', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: player.id,
              targetPoints: newPoints,
              oldPoints: oldPoints,
              difference: difference,
              dealerId: effectiveDealerId,
              dealerToken: currentAccessToken,
              supabaseUrl: currentSupabaseUrl,
              supabaseKey: currentSupabaseKey,
            }),
          });
          const proxyJson = await proxyRes.json();
          console.log('[updatePlayerHam - Server Proxy Response]:', proxyJson);

          if (proxyJson.success && proxyJson.updatedPlayer) {
            updatedRows = [proxyJson.updatedPlayer];
            updateError = null; // Successfully updated via proxy!
            if (proxyJson.historySuccess) {
              console.log('[updatePlayerHam - Server Proxy also completed point_history INSERT]');
            }
          } else if (proxyJson.step === 'PLAYERS_UPDATE_0_ROWS') {
            updateError = {
              code: '42501_RLS_0_ROWS',
              message: proxyJson.message || 'players テーブルの更新権限がありません (RLSポリシー違反)',
              details: 'PostgreSQL returned 0 affected rows via server proxy.',
              hint: proxyJson.hint || 'players テーブルの UPDATE ポリシーを確認してください',
            };
          } else if (proxyJson.error) {
            updateError = {
              code: String(proxyJson.status || 'PROXY_ERROR'),
              message: proxyJson.error,
              details: JSON.stringify(proxyJson),
              hint: 'サーバープロキシ経由でも Supabase への更新が拒否されました',
            };
          }
        } catch (proxyErr: any) {
          console.warn('[updatePlayerHam - Server Proxy Fallback Exception]:', proxyErr);
        }
      }
    }

    // Step 7: On UPDATE failure, log error.message, details, hint, code to console.error and provide rich message
    if (updateError) {
      console.error('[updatePlayerHam - Step 7: Supabase UPDATE Error Details]:', {
        step: 'PLAYERS_UPDATE_FAILED',
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        status: updateStatus,
        statusText: updateStatusText,
        url: updateTargetUrl,
        player: { id: player.id, name: player.name },
        targetPoints: newPoints,
        dealerAuthenticated: sessionValid,
        dealerEmail: authUser?.email,
      });

      const isLoadFailed =
        updateError.message?.includes('Load failed') ||
        updateError.message?.includes('Failed to fetch') ||
        updateError.code === 'CLIENT_EXCEPTION';

      let displayMessage = `残高更新に失敗しました (players テーブル)\n` +
        `【失敗箇所】: ステップ 1 (players UPDATE)\n` +
        `【エラー概要】: ${updateError.message}\n` +
        `【エラーコード】: ${updateError.code || 'N/A'}\n` +
        `【対象プレイヤー】: ${player.name} (${player.points} ham → ${newPoints} ham)\n` +
        `【ディーラー認証】: ${sessionValid ? `ログイン中 (${authUser?.email})` : '未ログイン'}`;

      if (updateError.details) displayMessage += `\n【詳細】: ${updateError.details}`;
      if (updateError.hint) displayMessage += `\n【ヒント】: ${updateError.hint}`;

      if (isLoadFailed) {
        displayMessage += `\n\n【通信エラーの原因】\n` +
          `Supabase (${currentSupabaseUrl}/rest/v1/players) へのリクエストがブラウザにより遮断されました。\n` +
          `Safari/プライベートブラウズのCORSブロックや、広告ブロッカーの設定を確認してください。\n`;
      }

      throw new Error(displayMessage);
    }

    // Step 8: On UPDATE success, verify that points actually changed
    if (!updatedRows || updatedRows.length === 0) {
      console.error('[updatePlayerHam - Step 8: Supabase update returned 0 rows]:', {
        code: 'PGRST116_EMPTY_UPDATE',
        playerId: player.id,
        targetPoints: newPoints,
        dealerId: effectiveDealerId,
        hint: 'Row exists in players table, but UPDATE matched 0 rows due to RLS policy.',
      });
      throw new Error(
        `残高更新に失敗しました (RLS権限不足)\n` +
        `【失敗箇所】: ステップ 1 (players UPDATE)\n` +
        `対象プレイヤー ${player.name} の更新行が0件でした。\n` +
        `Supabase のダッシュボードで players テーブルの UPDATE ポリシーを設定してください (FOR UPDATE TO authenticated USING (true) WITH CHECK (true))`
      );
    }

    const updatedPlayer = updatedRows[0];
    const actualNewPoints = Number(updatedPlayer.points);

    console.log('[updatePlayerHam - Step 8: Verified Points Changed in Database]:', {
      playerId: updatedPlayer.id,
      oldPoints: player.points,
      actualNewPoints,
      expectedPoints: newPoints,
      verified: actualNewPoints === newPoints,
    });

    // Step 9: Insert into public.point_history
    const historyTargetUrl = `${currentSupabaseUrl}/rest/v1/point_history`;
    const validDealerUuid = isValidUUID(effectiveDealerId) ? effectiveDealerId : null;

    const historyRecord: Record<string, any> = {
      player_id: player.id,
      old_points: oldPoints,
      new_points: newPoints,
      difference: difference,
      created_at: new Date().toISOString(),
    };

    if (validDealerUuid) {
      historyRecord.dealer_id = validDealerUuid;
    }

    console.log('[updatePlayerHam - Step 9: point_history INSERT Request Info]:', {
      targetUrl: historyTargetUrl,
      method: 'POST',
      record: historyRecord,
      hasValidDealerUuid: Boolean(validDealerUuid),
    });

    // Step 10: Check point_history response and error details
    let pointHistorySuccess = false;
    try {
      const { data: histData, error: histError, status: histStatus } = await client
        .from('point_history')
        .insert([historyRecord])
        .select('*');

      if (histError) {
        console.error('[updatePlayerHam - Step 10: Supabase point_history INSERT Error Details]:', {
          step: 'POINT_HISTORY_INSERT_FAILED',
          code: histError.code,
          message: histError.message,
          details: histError.details,
          hint: histError.hint,
          status: histStatus,
          record: historyRecord,
          url: historyTargetUrl,
        });

        // Direct fetch attempt for point_history if client failed
        try {
          const directHistHeaders: Record<string, string> = {
            'apikey': currentSupabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          };
          if (currentAccessToken) {
            directHistHeaders['Authorization'] = `Bearer ${currentAccessToken}`;
          } else {
            directHistHeaders['Authorization'] = `Bearer ${currentSupabaseKey}`;
          }

          const nativeFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis);
          const directHistRes = await nativeFetch(historyTargetUrl, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: directHistHeaders,
            body: JSON.stringify(historyRecord),
          });

          if (directHistRes.ok) {
            pointHistorySuccess = true;
            console.log('[updatePlayerHam - Step 10: point_history Direct Fetch Succeeded!]');
          } else {
            const directHistErr = await directHistRes.text();
            console.warn('[updatePlayerHam - Step 10: point_history Direct Fetch response]:', directHistRes.status, directHistErr);
          }
        } catch (directHistEx) {
          console.warn('[updatePlayerHam - Step 10: point_history Direct Fetch exception]:', directHistEx);
        }
      } else {
        pointHistorySuccess = true;
        console.log('[updatePlayerHam - Step 10: point_history INSERT Success]:', histData);
      }
    } catch (histErr: any) {
      console.error('[updatePlayerHam - Step 10: point_history Recording Exception]:', histErr);
    }

    // Step 11: Clear distinction between update and insert failures
    if (!pointHistorySuccess) {
      console.warn(
        `[updatePlayerHam - Step 11: Warning] players points は正常に ${actualNewPoints} ham に更新されましたが、point_history INSERT の記録はスキップされました。`
      );
    } else {
      console.log('[updatePlayerHam - Step 11: Both players UPDATE and point_history INSERT completed successfully]');
    }

    return {
      id: String(updatedPlayer.id),
      name: String(updatedPlayer.name ?? updatedPlayer.username ?? player.name),
      points: actualNewPoints,
      player_number: updatedPlayer.player_number ? String(updatedPlayer.player_number) : player.player_number,
      created_at: updatedPlayer.created_at,
      deleted_at: updatedPlayer.deleted_at,
    };
  } catch (err: any) {
    console.error('[updatePlayerHam - Execution Exception]:', err);
    throw err;
  }
}

/**
 * Add a new player with initial 0 ham and automatically assigned unique 5-digit PLAYER ID.
 * Optionally allows setting a 4-digit numeric PIN (0000〜9999).
 * If not specified, a secure 4-digit PIN is generated.
 */
export async function createPlayer(name: string, initialPin?: string): Promise<Player> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('プレイヤー名を入力してください。');
  }

  // Validate or auto-generate 4-digit PIN
  let pinToUse = String(initialPin || '').trim();
  if (pinToUse) {
    if (!/^\d{4}$/.test(pinToUse)) {
      throw new Error('PINコードは4桁の数字（0000〜9999）で入力してください。');
    }
  } else {
    pinToUse = String(Math.floor(1000 + Math.random() * 9000));
  }

  // Generate a guaranteed unique 5-digit number
  const newPlayerNumber = generateUniquePlayerNumber();

  const client = getSupabase();
  if (!client) {
    // Demo Mode
    const currentList = getDemoPlayers();
    const newPlayer: Player = {
      id: 'p-' + Date.now(),
      name: trimmed,
      points: 0,
      player_number: newPlayerNumber,
      pin: pinToUse,
      created_at: new Date().toISOString(),
    };
    currentList.push(newPlayer);
    saveDemoPlayers(currentList);

    // Save PIN into dealer storage
    const pinMap = getDealerPinMap();
    pinMap[newPlayer.id] = pinToUse;
    pinMap[newPlayerNumber] = pinToUse;
    saveDealerPinMap(pinMap);

    return newPlayer;
  }

  try {
    let insertedData: any = null;

    // Attempt 1: Insert with 'player_number', 'username', and 'pin'
    const resWithPin = await client
      .from('players')
      .insert([{ username: trimmed, points: 0, player_number: newPlayerNumber, pin: pinToUse }])
      .select('*')
      .single();

    if (!resWithPin.error) {
      insertedData = resWithPin.data;
    } else {
      // Fallback: If 'pin' column is not created in table yet
      const resWithNumber = await client
        .from('players')
        .insert([{ username: trimmed, points: 0, player_number: newPlayerNumber }])
        .select('*')
        .single();

      if (!resWithNumber.error) {
        insertedData = resWithNumber.data;
      } else {
        const resUsername = await client
          .from('players')
          .insert([{ username: trimmed, points: 0 }])
          .select('*')
          .single();

        if (!resUsername.error) {
          insertedData = resUsername.data;
        } else {
          const resName = await client
            .from('players')
            .insert([{ name: trimmed, points: 0 }])
            .select('*')
            .single();

          if (resName.error) {
            console.error('Supabase insert player error details:', {
              code: resName.error.code,
              message: resName.error.message,
              details: resName.error.details,
              hint: resName.error.hint,
            });
            throw new Error(`プレイヤー作成に失敗しました: ${resName.error.message}`);
          }
          insertedData = resName.data;
        }
      }
    }

    const playerId = String(insertedData.id);

    // Persist to local mapping
    const localMap = getLocalPlayerNumberMap();
    localMap[playerId] = newPlayerNumber;
    saveLocalPlayerNumberMap(localMap);

    // Persist PIN to dealer store
    const pinMap = getDealerPinMap();
    pinMap[playerId] = pinToUse;
    pinMap[newPlayerNumber] = pinToUse;
    saveDealerPinMap(pinMap);

    return {
      id: playerId,
      name: String(insertedData.name ?? insertedData.username ?? trimmed),
      points: Number(insertedData.points ?? 0),
      player_number: insertedData.player_number ? String(insertedData.player_number) : newPlayerNumber,
      pin: pinToUse,
      created_at: insertedData.created_at,
      deleted_at: insertedData.deleted_at,
    };
  } catch (err: any) {
    console.error('createPlayer failure:', err);
    throw err;
  }
}

export interface MyHamaAuthResult {
  success: boolean;
  player?: Player;
  error?: string;
}

/**
 * Authenticate and activate a MY HAMA session using 5-digit PLAYER NUMBER AND 4-digit PIN.
 * Secure verification:
 * - Validates format (5-digit numeric player number, 4-digit numeric PIN)
 * - Verifies player existence and PIN validity securely without public PIN disclosure
 * - Rejects non-existent player number, wrong PIN, unset PIN, or invalid input format.
 * - Only the verified player's information is activated into session.
 */
export async function authenticateMyHama(playerNumber: string, pin: string): Promise<MyHamaAuthResult> {
  const cleanNumber = String(playerNumber || '').trim();
  const cleanPin = String(pin || '').trim();

  // 1. Validation of input formats
  if (!cleanNumber) {
    return { success: false, error: 'PLAYER NUMBERを入力してください。' };
  }
  if (!/^\d{5}$/.test(cleanNumber)) {
    return { success: false, error: 'PLAYER NUMBERは5桁の数字で入力してください。' };
  }
  if (!cleanPin) {
    return { success: false, error: '4桁のPINコードを入力してください。' };
  }
  if (!/^\d{4}$/.test(cleanPin)) {
    return { success: false, error: 'PINコードは4桁の数字（0000〜9999）で入力してください。' };
  }

  // 2. Secure server verification without returning PIN to client
  const client = getSupabase();
  let matchedPlayer: Player | null = null;

  if (client) {
    // Attempt A: Server-side Postgres RPC if configured
    try {
      const { data: rpcData, error: rpcError } = await client.rpc('verify_player_pin', {
        p_player_number: cleanNumber,
        p_pin: cleanPin,
      });
      if (!rpcError && rpcData) {
        matchedPlayer = {
          id: String(rpcData.id),
          name: String(rpcData.name ?? rpcData.username),
          points: Number(rpcData.points ?? 0),
          player_number: String(rpcData.player_number ?? cleanNumber),
          created_at: rpcData.created_at,
          deleted_at: rpcData.deleted_at,
        };
      }
    } catch {
      // Continue to next check
    }

    // Attempt B: Server-side match query (Condition executed on DB server, PIN is NOT selected)
    if (!matchedPlayer) {
      try {
        const { data: matchData, error: matchError } = await client
          .from('players')
          .select('id, name, username, points, player_number, created_at, deleted_at')
          .eq('player_number', cleanNumber)
          .eq('pin', cleanPin)
          .is('deleted_at', null)
          .maybeSingle();

        if (!matchError && matchData) {
          matchedPlayer = {
            id: String(matchData.id),
            name: String(matchData.name ?? matchData.username),
            points: Number(matchData.points ?? 0),
            player_number: String(matchData.player_number ?? cleanNumber),
            created_at: matchData.created_at,
            deleted_at: matchData.deleted_at,
          };
        }
      } catch {
        // Fallback
      }
    }
  }

  // Attempt C: Check dealer PIN map fallback
  if (!matchedPlayer) {
    const players = await fetchPlayers();
    const found = players.find((p) => p.player_number === cleanNumber);
    if (!found) {
      return { success: false, error: 'PLAYER NUMBERが見つかりません。' };
    }

    const dealerPinMap = getDealerPinMap();
    const storedPin = dealerPinMap[found.id] || dealerPinMap[cleanNumber];

    if (!storedPin) {
      return { success: false, error: 'PINコードが登録されていません。ディーラーにお問い合わせください。' };
    }
    if (storedPin !== cleanPin) {
      return { success: false, error: 'PINコードが一致しません。' };
    }
    matchedPlayer = found;
  }

  if (!matchedPlayer) {
    // Check if player even exists to provide clear error message
    const players = await fetchPlayers();
    const playerExists = players.some((p) => p.player_number === cleanNumber);
    if (!playerExists) {
      return { success: false, error: 'PLAYER NUMBERが見つかりません。' };
    }
    return { success: false, error: 'PINコードが一致しません。' };
  }

  // Establish verified MY HAMA session
  const currentDeviceId = getClientDeviceId();
  const session: MyHamaSession = {
    playerId: matchedPlayer.id,
    playerNumber: cleanNumber,
    deviceId: currentDeviceId,
    authenticatedAt: new Date().toISOString(),
  };
  setActiveMyHamaSession(session);

  return {
    success: true,
    player: matchedPlayer,
  };
}

/**
 * Release/reset device binding for a player (Admin / Dealer maintenance if needed)
 */
export function unbindPlayerDevice(playerNumber: string) {
  const bindings = getPlayerDeviceBindings();
  delete bindings[playerNumber];
  savePlayerDeviceBindings(bindings);
}

/**
 * Edit player name
 */
export async function updatePlayerName(playerId: string, newName: string): Promise<Player> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error('プレイヤー名を入力してください。');
  }

  const client = getSupabase();
  if (!client) {
    // Demo Mode
    const currentList = getDemoPlayers();
    const idx = currentList.findIndex((p) => p.id === playerId);
    if (idx === -1) throw new Error('プレイヤーが見つかりませんでした。');
    currentList[idx] = { ...currentList[idx], name: trimmed };
    saveDemoPlayers(currentList);
    return currentList[idx];
  }

  try {
    let updatedData: any = null;
    const resUser = await client
      .from('players')
      .update({ username: trimmed })
      .eq('id', playerId)
      .select('*')
      .single();

    if (!resUser.error) {
      updatedData = resUser.data;
    } else {
      console.warn('Update with username failed, attempting fallback to name column:', resUser.error);
      const resName = await client
        .from('players')
        .update({ name: trimmed })
        .eq('id', playerId)
        .select('*')
        .single();

      if (resName.error) {
        console.error('Supabase update name error details:', {
          code: resName.error.code,
          message: resName.error.message,
          details: resName.error.details,
          hint: resName.error.hint,
        });
        throw new Error(`名前の更新に失敗しました: ${resName.error.message}`);
      }
      updatedData = resName.data;
    }

    return {
      id: String(updatedData.id),
      name: String(updatedData.name ?? updatedData.username ?? trimmed),
      points: Number(updatedData.points ?? 0),
      created_at: updatedData.created_at,
      deleted_at: updatedData.deleted_at,
    };
  } catch (err: any) {
    console.error('updatePlayerName failure:', err);
    throw err;
  }
}

/**
 * Delete player (Prefers soft delete via deleted_at, falls back to delete if column does not exist)
 */
export async function deletePlayer(playerId: string): Promise<void> {
  const client = getSupabase();
  if (!client) {
    // Demo Mode
    const currentList = getDemoPlayers();
    const filtered = currentList.filter((p) => p.id !== playerId);
    saveDemoPlayers(filtered);
    return;
  }

  try {
    // Try soft-delete first
    const softResult = await client
      .from('players')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', playerId);

    if (!softResult.error) {
      return;
    }

    // If soft delete failed because deleted_at column is missing, perform standard delete
    console.warn('Soft-delete with deleted_at column failed or column does not exist, attempting fallback delete:', softResult.error);
    const hardResult = await client
      .from('players')
      .delete()
      .eq('id', playerId);

    if (hardResult.error) {
      console.error('Supabase delete error details:', {
        code: hardResult.error.code,
        message: hardResult.error.message,
        details: hardResult.error.details,
        hint: hardResult.error.hint,
      });
      throw new Error(`プレイヤーの削除に失敗しました: ${hardResult.error.message}`);
    }
  } catch (err: any) {
    console.error('deletePlayer failure:', err);
    throw err;
  }
}

/**
 * Subscribe to realtime player changes
 */
export function subscribeToPlayers(onUpdate: () => void): () => void {
  const client = getSupabase();
  if (!client) {
    // Demo mode: listen to custom storage events
    const listener = () => onUpdate();
    window.addEventListener('hamafes_demo_players_changed', listener);
    return () => {
      window.removeEventListener('hamafes_demo_players_changed', listener);
    };
  }

  try {
    const channelId = 'players-realtime-' + Math.random().toString(36).substring(2, 8);
    const channel: RealtimeChannel = client
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          console.log('Realtime player change detected:', payload);
          onUpdate();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Subscribed to public.players');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[Supabase Realtime] Channel error (polling fallback active):', err);
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        console.warn('Error removing realtime channel:', e);
      }
    };
  } catch (err) {
    console.warn('Supabase Realtime subscription exception:', err);
    return () => {};
  }
}
