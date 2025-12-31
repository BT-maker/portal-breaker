import React from 'react';
import { Button } from './Button';

interface LevelCompleteModalProps {
  isOpen: boolean;
  win: boolean;
  score: number;
  reward?: number;
  onClose: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  win,
  score,
  reward,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{
        animation: 'fadeIn 0.3s ease-out',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
      }}
      onClick={(e) => {
        // Prevent closing on backdrop click for mobile
        e.stopPropagation();
      }}
    >
      <div 
        className="relative bg-gradient-to-br from-teal-900 via-emerald-900 to-teal-950 rounded-3xl shadow-2xl border-2 border-emerald-500/50 p-8 max-w-md w-full mx-4 transform transition-all"
        style={{
          animation: 'scaleIn 0.3s ease-out',
          touchAction: 'auto',
          pointerEvents: 'auto',
        }}
        onClick={(e) => {
          // Prevent event bubbling
          e.stopPropagation();
        }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl -z-10"></div>
        
        {/* Content */}
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {win ? (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative text-7xl animate-bounce">🎉</div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative text-7xl">💀</div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className={`text-4xl font-black mb-2 ${win ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400' : 'text-red-400'}`}>
              {win ? 'TEBRİKLER!' : 'OYUN BİTTİ!'}
            </h2>
            <p className="text-teal-200 text-lg font-semibold">
              {win ? 'Seviye Tamamlandı' : 'Tekrar Deneyin'}
            </p>
          </div>

          {/* Stats */}
          <div className="bg-black/30 rounded-2xl p-6 space-y-4 border border-teal-800/50">
            <div className="flex items-center justify-between">
              <span className="text-teal-300 font-bold">Skor:</span>
              <span className="text-white text-xl font-mono font-bold">{score.toLocaleString()}</span>
            </div>
            
            {win && reward && (
              <div className="flex items-center justify-between pt-4 border-t border-teal-800/50">
                <span className="text-yellow-300 font-bold flex items-center gap-2">
                  <span className="text-2xl">⛃</span>
                  Kazanılan Para:
                </span>
                <span className="text-yellow-400 text-2xl font-mono font-bold">+{reward}</span>
              </div>
            )}
          </div>

          {/* Button */}
          <div className="pt-4">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              variant={win ? "success" : "primary"}
              size="lg"
              className="w-full text-lg py-4 shadow-lg hover:shadow-xl transition-all touch-manipulation"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              {win ? 'Devam Et' : 'Tamam'}
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-teal-500/10 rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

