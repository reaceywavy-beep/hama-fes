import React, { useState } from 'react';
import { getActiveCredentials, setCustomCredentials, isSupabaseConfigured } from '../lib/supabase';
import { Database, Key, Globe, X, Check, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<Props> = ({ isOpen, onClose, onConfigUpdated }) => {
  const current = getActiveCredentials();
  const [url, setUrl] = useState<string>(current.url);
  const [key, setKey] = useState<string>(current.key);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomCredentials(url.trim(), key.trim());
    setSaveStatus('設定を保存しました...');
    setTimeout(() => {
      onConfigUpdated();
      onClose();
      window.location.reload();
    }, 600);
  };

  const handleResetToDemo = () => {
    setCustomCredentials('', '');
    setUrl('');
    setKey('');
    setSaveStatus('デモモードにリセットしました');
    setTimeout(() => {
      onConfigUpdated();
      onClose();
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="w-full max-w-md rounded-xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black/60 border border-[#C5A059]/40 text-[#C5A059] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Supabase 接続設定
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                DATABASE CREDENTIALS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Reminder */}
        <div className="mb-4 p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-gray-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#C5A059] font-bold text-[11px] font-mono">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            <span>REQUIRED FIELDS (PUBLIC ONLY)</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Supabase ダッシュボードの Project Settings &gt; API から <strong className="text-white">Project URL</strong> と <strong className="text-white">anon / publishable key</strong> を入力してください。
            <span className="text-amber-400 block mt-0.5">※ Secret Key / Service Role Key は入力しないでください。</span>
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>SUPABASE PROJECT URL</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full h-10 px-3 rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#FF2D55] text-white text-xs outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1 font-mono">
              <Key className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>ANON KEY / PUBLISHABLE KEY</span>
            </label>
            <input
              type="text"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full h-10 px-3 rounded-lg bg-black/50 border border-white/20 focus:outline-none focus:border-[#FF2D55] text-white text-xs outline-none font-mono"
            />
          </div>

          {saveStatus && (
            <div className="text-xs text-emerald-400 font-bold text-center animate-pulse font-mono">
              {saveStatus}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="flex-1 h-11 rounded-lg gold-gradient text-black font-black text-xs uppercase tracking-[0.15em] shadow-[0_4px_15px_rgba(197,160,89,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>設定を保存</span>
            </button>
            {isSupabaseConfigured() && (
              <button
                type="button"
                onClick={handleResetToDemo}
                className="h-11 px-3 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white text-xs font-mono"
              >
                デモに戻す
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
