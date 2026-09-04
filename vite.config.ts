import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function supabaseProxyPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (req.url === '/api/players/update-ham' && req.method === 'POST') {
      let rawBody = '';
      req.on('data', (chunk: any) => { rawBody += chunk; });
      req.on('end', async () => {
        try {
          const body = JSON.parse(rawBody || '{}');
          const {
            playerId,
            targetPoints,
            oldPoints,
            difference,
            dealerId,
            dealerToken,
            supabaseUrl,
            supabaseKey,
          } = body;

          const rawUrl = supabaseUrl || process.env.VITE_SUPABASE_URL || '';
          const cleanUrl = rawUrl
            .trim()
            .replace(/\/+$/, '')
            .replace(/\/(rest|auth)(\/v\d+)?\/?$/i, '')
            .replace(/\/+$/, '');
          const cleanKey = (supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

          console.log('[API Proxy /api/players/update-ham] Invoked for playerId:', playerId, 'targetPoints:', targetPoints);

          // 1. Update players
          const updateUrl = `${cleanUrl}/rest/v1/players?id=eq.${encodeURIComponent(playerId)}`;
          const headers: Record<string, string> = {
            'apikey': cleanKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          };
          if (dealerToken) {
            headers['Authorization'] = `Bearer ${dealerToken}`;
          } else {
            headers['Authorization'] = `Bearer ${cleanKey}`;
          }

          const updateRes = await fetch(updateUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              points: targetPoints,
              updated_at: new Date().toISOString(),
            }),
          });

          const updateStatus = updateRes.status;
          const updateText = await updateRes.text();
          console.log(`[API Proxy] players UPDATE status: ${updateStatus}, body:`, updateText);

          if (!updateRes.ok) {
            res.statusCode = updateStatus;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              step: 'PLAYERS_UPDATE_FAILED',
              status: updateStatus,
              error: updateText,
            }));
            return;
          }

          let updatedRows: any[] = [];
          try {
            updatedRows = JSON.parse(updateText);
          } catch {
            // Ignore parse error
          }

          if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              step: 'PLAYERS_UPDATE_0_ROWS',
              status: 403,
              message: 'players テーブルの更新権限がありません (RLSポリシー違反の可能性があります)',
              hint: 'Supabaseのダッシュボードで players テーブルの UPDATE ポリシーを確認してください',
            }));
            return;
          }

          // 2. Insert point_history
          let historySuccess = false;
          let historyErrorText: string | null = null;
          try {
            const histUrl = `${cleanUrl}/rest/v1/point_history`;
            const histBody: Record<string, any> = {
              player_id: playerId,
              old_points: oldPoints,
              new_points: targetPoints,
              difference: difference,
              created_at: new Date().toISOString(),
            };
            if (dealerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealerId)) {
              histBody.dealer_id = dealerId;
            }

            const histRes = await fetch(histUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(histBody),
            });
            if (histRes.ok) {
              historySuccess = true;
              console.log('[API Proxy] point_history INSERT succeeded');
            } else {
              historyErrorText = await histRes.text();
              console.warn('[API Proxy] point_history INSERT returned error:', histRes.status, historyErrorText);
            }
          } catch (histEx: any) {
            historyErrorText = histEx.message;
            console.warn('[API Proxy] point_history INSERT threw exception:', histEx);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            updatedPlayer: updatedRows[0],
            historySuccess,
            historyError: historyErrorText,
          }));
        } catch (err: any) {
          console.error('[API Proxy] Internal error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
    next();
  };

  return {
    name: 'supabase-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), supabaseProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
