import React, { useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, ArrowLeft, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
  onLoginSuccess: () => void;
}

export const DealerLogin: React.FC<Props> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('dealer@hamafes.com');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if session already exists
  useEffect(() => {
    const checkSession = async () => {
      const client = getSupabase();
      if (client) {
        try {
          const { data } = await client.auth.getSession();
          if (data?.session?.user) {
            console.log('Existing dealer session found, redirecting to dashboard');
            onLoginSuccess();
          }
        } catch (err) {
          console.warn('Session check warning:', err);
        }
      } else {
        // Demo mode session check
        const demoAuth = localStorage.getItem('hamafes_demo_auth');
        if (demoAuth === 'true') {
          onLoginSuccess();
        }
      }
    };
    checkSession();
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const client = getSupabase();
    if (!client) {
      // Demo Mode login
      setTimeout(() => {
        setIsLoading(false);
        if (!password.trim()) {
          setErrorMessage('パスワードを入力してください。');
          return;
        }
        // Save demo session
        localStorage.setItem('hamafes_demo_auth', 'true');
        localStorage.setItem('hamafes_demo_dealer_email', email);
        onLoginSuccess();
      }, 500);
      return;
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('Supabase auth signIn error:', error);
        let userMsg = 'ログインに失敗しました。認証情報を確認してください。';
        if (error.message.includes('Invalid login credentials')) {
          userMsg = 'メールアドレスまたはパスワードが正しくありません。';
        } else if (error.message.includes('Email not confirmed')) {
          userMsg = 'メールアドレスの認証が完了していません。';
        }
        setErrorMessage(userMsg);
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        console.log('Dealer successfully authenticated:', data.session.user.email);
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setErrorMessage(
        err.message || 'ログイン中に予期せぬエラーが発生しました。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-4 py-8 selection:bg-[#C5A059]/30 font-sans">
      {/* Back button */}
      <div className="w-full max-w-sm mb-4">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded border border-white/10 hover:bg-white/10 text-gray-300 font-mono transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>PUBLIC RANKING</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm rounded-xl bg-black/60 border border-white/10 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle watermarks */}
        <span className="suit-bg top-[-15px] left-[-15px] select-none text-5xl">♠</span>
        <span className="suit-bg bottom-[-15px] right-[-15px] select-none text-5xl">♦</span>

        {/* Logo / Badge */}
        <div className="text-center space-y-1 mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#C5A059]/50 text-[#C5A059] mb-2 shadow-lg shadow-black">
            <Lock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="text-[10px] font-serif italic tracking-[0.2em] text-[#C5A059] font-medium uppercase">
            HAMA FES 2026
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            <span className="neon-red-text tracking-tighter">DEALER LOGIN</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            ディーラー専用管理画面 (ham操作)
          </p>
        </div>

        {/* Notice for Demo Mode if not configured yet */}
        {!configured && (
          <div className="mb-4 p-3 rounded-lg bg-amber-950/30 border border-amber-600/30 text-amber-200 text-[11px] leading-relaxed relative z-10">
            <div className="font-bold flex items-center gap-1 text-amber-300 mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span>デモモードで動作中</span>
            </div>
            Supabase 未接続時は任意のパスワードで管理画面へログインできます。
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-700/60 text-red-200 text-xs flex items-start gap-2 relative z-10">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 font-mono">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                id="dealer-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dealer@hamafes.com"
                className="w-full h-11 pl-9 pr-3 rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#FF2D55] text-white text-sm outline-none transition-all placeholder:text-white/25"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 font-mono">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                id="dealer-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-9 pr-3 rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#FF2D55] text-white text-sm outline-none transition-all placeholder:text-white/25"
              />
            </div>
          </div>

          <button
            type="submit"
            id="dealer-submit-button"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-xl gold-gradient text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_4px_15px_rgba(197,160,89,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            {isLoading ? '認証中...' : 'AUTHENTICATE'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1 font-mono">
          <Lock className="w-3 h-3 text-[#C5A059]/60" />
          <span>256-BIT ENCRYPTED DEALER SESSION</span>
        </div>
      </div>
    </div>
  );
};
