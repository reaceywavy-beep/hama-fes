import React from 'react';
import { ConfirmAction } from '../types';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';

interface Props {
  action: ConfirmAction | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({
  action,
  isLoading,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  if (!action) return null;

  const renderContent = () => {
    switch (action.type) {
      case 'quick_add':
      case 'custom_adjust': {
        const isAddition = action.diff >= 0;
        return (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/50 border border-[#C5A059]/40 text-[#C5A059] mb-1">
              <span className="text-xl font-serif font-bold">♠</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isAddition ? 'ham加算の確認' : 'ham減算の確認'}
            </h3>
            <div className="bg-black/60 border border-white/10 rounded-lg p-4 space-y-2.5 text-sm">
              <div className="text-gray-400 text-xs font-mono">PLAYER</div>
              <div className="text-base font-bold text-white tracking-wide">
                {action.player.name}
              </div>
              <div className="border-t border-white/10 my-2 pt-2 grid grid-cols-3 items-center text-xs font-mono">
                <div>
                  <div className="text-gray-400">現在</div>
                  <div className="font-semibold text-gray-200 mt-0.5">
                    {action.player.points.toLocaleString()} ham
                  </div>
                </div>
                <div className={`font-bold text-base ${isAddition ? 'text-emerald-400' : 'text-[#FF2D55]'}`}>
                  {isAddition ? `+ ${action.diff.toLocaleString()}` : `- ${Math.abs(action.diff).toLocaleString()}`}
                </div>
                <div>
                  <div className="text-gray-400">変更後</div>
                  <div className="font-bold text-[#C5A059] text-sm mt-0.5">
                    {action.targetPoints.toLocaleString()} ham
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'direct_set': {
        return (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/50 border border-[#C5A059]/40 text-[#C5A059] mb-1">
              <span className="text-xl font-serif font-bold">♠</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              ham直接設定の確認
            </h3>
            <div className="bg-black/60 border border-white/10 rounded-lg p-4 space-y-2.5 text-sm">
              <div className="text-gray-400 text-xs font-mono">PLAYER</div>
              <div className="text-base font-bold text-white tracking-wide">
                {action.player.name}
              </div>
              <div className="border-t border-white/10 my-2 pt-2 flex items-center justify-around text-xs font-mono">
                <div>
                  <div className="text-gray-400">現在</div>
                  <div className="font-semibold text-gray-300 mt-0.5">
                    {action.player.points.toLocaleString()} ham
                  </div>
                </div>
                <div className="text-[#C5A059] font-bold text-lg">→</div>
                <div>
                  <div className="text-[#C5A059]">設定値</div>
                  <div className="font-bold text-[#C5A059] text-base mt-0.5">
                    {action.targetPoints.toLocaleString()} ham
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'edit_name': {
        return (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/50 border border-[#C5A059]/40 text-[#C5A059] mb-1">
              <span className="text-xl font-serif font-bold">♠</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              プレイヤー名変更の確認
            </h3>
            <div className="bg-black/60 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
              <div>
                <div className="text-gray-400 text-xs font-mono">BEFORE</div>
                <div className="font-bold text-gray-300 text-sm mt-0.5">
                  {action.player.name}
                </div>
              </div>
              <div className="text-[#C5A059] font-bold text-sm">↓</div>
              <div>
                <div className="text-[#C5A059] text-xs font-mono">AFTER</div>
                <div className="font-bold text-white text-base mt-0.5">
                  {action.newName}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'change_pin': {
        return (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/50 border border-[#C5A059]/40 text-[#C5A059] mb-1">
              <span className="text-xl font-serif font-bold">♠</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              PIN変更の確認
            </h3>
            <div className="bg-black/60 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
              <div className="text-gray-400 text-xs font-mono">PLAYER</div>
              <div className="text-base font-bold text-white">
                {action.player.name}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                #{action.player.player_number || '-----'}
              </div>
              <div className="border-t border-white/10 my-2 pt-2 flex items-center justify-around text-xs font-mono">
                <div>
                  <div className="text-gray-400">新しい PIN</div>
                  <div className="font-bold text-[#F5D77F] text-xl tracking-[0.25em] mt-1">
                    {action.newPin}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'delete': {
        return (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4A0404]/60 border border-[#8B0000] text-[#FF2D55] mb-1 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-red-200 tracking-wide">
              プレイヤー削除の確認
            </h3>
            <div className="bg-black/60 border border-red-900/60 rounded-lg p-4 space-y-2 text-sm">
              <div className="text-gray-400 text-xs font-mono">TARGET PLAYER</div>
              <div className="text-base font-bold text-white">
                {action.player.name}
              </div>
              <div className="text-xs text-red-300 font-mono">
                保有残高: {action.player.points.toLocaleString()} ham
              </div>
              <div className="border-t border-red-900/60 pt-2 text-xs text-red-400 flex items-center justify-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>この操作は取り消せません</span>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  const isDelete = action.type === 'delete';

  return (
    <div
      id="confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        id="confirm-modal-box"
        className={`w-full ${errorMessage ? 'max-w-md' : 'max-w-sm'} rounded-xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-5 relative overflow-hidden transition-all`}
        style={{
          boxShadow: isDelete
            ? '0 0 35px rgba(220, 38, 38, 0.25)'
            : '0 0 35px rgba(197, 160, 89, 0.2)',
        }}
      >
        {renderContent()}

        {/* Error Notification inside modal */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex flex-col gap-1.5 animate-shake">
            <div className="flex items-center gap-1.5 font-bold text-red-300 border-b border-red-500/30 pb-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>エラーが発生しました</span>
            </div>
            <div className="text-[11px] leading-relaxed text-red-200 break-words font-mono whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            id="modal-cancel-button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full h-11 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 active:scale-95 transition-all text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            CANCEL
          </button>
          <button
            type="button"
            id="modal-confirm-button"
            disabled={isLoading}
            onClick={() => {
              console.log('[ConfirmationModal - Step 1: CONFIRM Clicked]', action);
              onConfirm();
            }}
            className={`w-full h-11 flex items-center justify-center gap-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
              isDelete
                ? 'bg-[#4A0404] border border-[#8B0000] text-[#FF2D55] hover:brightness-110'
                : 'gold-gradient text-black hover:brightness-110 shadow-[0_4px_15px_rgba(197,160,89,0.3)]'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isLoading ? 'PROCESSING...' : isDelete ? 'DELETE' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
};
