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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in"
      style={{
        pointerEvents: 'auto',
        touchAction: 'auto',
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Prevent closing on backdrop click for mobile
        e.stopPropagation();
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              win ? 'bg-emerald-400/30' : 'bg-red-400/30'
            } animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div 
        className="relative glass-strong rounded-3xl shadow-2xl border-2 p-6 md:p-8 max-w-md w-full mx-4 animate-bounce-in overflow-hidden"
        style={{
          borderColor: win ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 10000,
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevent event bubbling
          e.stopPropagation();
        }}
      >
        {/* Enhanced Glow Effect */}
        <div 
          className={`absolute inset-0 rounded-3xl blur-2xl -z-10 ${
            win 
              ? 'bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-emerald-500/30 animate-pulse-glow' 
              : 'bg-gradient-to-br from-red-500/30 via-orange-500/20 to-red-500/30 animate-pulse'
          }`}
        ></div>
        
        {/* Content */}
        <div className="text-center space-y-6 relative z-10">
          {/* Enhanced Icon with Multiple Layers */}
          <div className="flex justify-center animate-slide-down">
            {win ? (
              <div className="relative">
                {/* Outer Glow Rings */}
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                <div className="absolute inset-0 bg-emerald-300 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                {/* Main Icon */}
                <div className="relative text-7xl md:text-8xl animate-bounce" style={{ animationDuration: '1s' }}>
                  🎉
                </div>
                {/* Sparkle Effects */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                    style={{
                      top: `${50 + 30 * Math.cos((i * Math.PI * 2) / 8)}%`,
                      left: `${50 + 30 * Math.sin((i * Math.PI * 2) / 8)}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                <div className="relative text-7xl md:text-8xl animate-bounce-in">💀</div>
              </div>
            )}
          </div>

          {/* Enhanced Title */}
          <div className="animate-slide-up">
            <h2 className={`text-3xl md:text-4xl font-black mb-2 ${
              win 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400 animate-gradient' 
                : 'text-red-400'
            }`}>
              {win ? 'TEBRİKLER!' : 'OYUN BİTTİ!'}
            </h2>
            <p className="text-teal-200/90 text-base md:text-lg font-semibold">
              {win ? 'Seviye Tamamlandı' : 'Tekrar Deneyin'}
            </p>
          </div>

          {/* Enhanced Stats Card */}
          <div className="glass rounded-2xl p-5 md:p-6 space-y-4 border border-teal-800/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <span className="text-teal-300 font-bold flex items-center gap-2">
                <span className="text-lg">📊</span>
                Skor:
              </span>
              <span className="text-white text-xl md:text-2xl font-mono font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
                {score.toLocaleString()}
              </span>
            </div>
            
            {win && reward && (
              <div className="flex items-center justify-between pt-4 border-t border-teal-800/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <span className="text-yellow-300 font-bold flex items-center gap-2">
                  <span className="text-2xl animate-pulse">⛃</span>
                  <span className="hidden md:inline">Kazanılan Para:</span>
                  <span className="md:hidden">Para:</span>
                </span>
                <span className="text-yellow-400 text-2xl md:text-3xl font-mono font-bold flex items-center gap-1">
                  <span className="animate-bounce">+</span>
                  {reward}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Button */}
          <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.3s', pointerEvents: 'auto', position: 'relative', zIndex: 10001 }}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              variant={win ? "success" : "primary"}
              size="lg"
              className="w-full text-base md:text-lg py-4 shadow-2xl hover:shadow-3xl transition-all ripple"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10002,
              }}
            >
              {win ? '✨ Devam Et' : '🔄 Tekrar Dene'}
            </Button>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className={`absolute top-4 right-4 w-20 h-20 rounded-full blur-2xl animate-pulse ${
          win ? 'bg-emerald-500/20' : 'bg-red-500/20'
        }`}></div>
        <div className={`absolute bottom-4 left-4 w-16 h-16 rounded-full blur-xl animate-pulse ${
          win ? 'bg-teal-500/20' : 'bg-orange-500/20'
        }`} style={{ animationDelay: '0.5s' }}></div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none"></div>
      </div>
    </div>
  );
};

