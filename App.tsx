import React, { useState, useEffect, useCallback } from 'react';
import { Player } from './types';
import {
  fetchPlayers,
  subscribeToPlayers,
  getSupabase,
  isSupabaseConfigured,
} from './lib/supabase';
import { PublicRanking } from './components/PublicRanking';
import { DealerLogin } from './components/DealerLogin';
import { DealerDashboard } from './components/DealerDashboard';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Load players
  const loadPlayersData = useCallback(async () => {
    try {
      const data = await fetchPlayers();
      setPlayers(data);
      return data;
    } catch (err) {
      console.error('Failed to load players in App:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh with visual loading state
  const handleRefreshData = useCallback(async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    try {
      const data = await fetchPlayers();
      setPlayers(data);
    } catch (err) {
      console.error('Failed to refresh players in App:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDisplayTime = Math.max(0, 500 - elapsed);
      setTimeout(() => {
        setIsRefreshing(false);
      }, minDisplayTime);
    }
  }, []);

  // Sync route on popstate and initial load
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial load and Realtime listener
  useEffect(() => {
    loadPlayersData();

    // Subscribe to realtime database changes
    const unsubscribe = subscribeToPlayers(() => {
      console.log('Realtime update detected in App.tsx');
      loadPlayersData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadPlayersData]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleDealerLogout = async () => {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    localStorage.removeItem('hamafes_demo_auth');
    localStorage.removeItem('hamafes_demo_dealer_email');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Route: Dealer Dashboard */}
      {currentPath === '/dealer' && (
        <DealerDashboard
          onNavigate={navigate}
          onLogout={handleDealerLogout}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />
      )}

      {/* Route: Dealer Login */}
      {currentPath === '/dealer/login' && (
        <DealerLogin
          onNavigate={navigate}
          onLoginSuccess={() => navigate('/dealer')}
        />
      )}

      {/* Route: Public Ranking (Default) */}
      {currentPath !== '/dealer' && currentPath !== '/dealer/login' && (
        <PublicRanking
          players={players}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefreshData}
          onNavigate={navigate}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />
      )}

      {/* Supabase Connection Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={() => {
          setIsConfigModalOpen(false);
          loadPlayersData();
        }}
      />
    </div>
  );
}
