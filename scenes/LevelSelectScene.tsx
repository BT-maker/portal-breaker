import React from 'react';
import { Scene } from '../types';
import { Button } from '../components/Button';

interface LevelSelectSceneProps {
  changeScene: (scene: Scene) => void;
  unlockedLevels: number;
  levelStars: Record<number, number>;
  onSelectLevel: (level: number) => void;
}

export const LevelSelectScene: React.FC<LevelSelectSceneProps> = ({ changeScene, unlockedLevels, levelStars, onSelectLevel }) => {
  const levels = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full p-6 md:p-8 relative animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 z-10 animate-slide-down">
        <Button 
          onClick={() => changeScene(Scene.MENU)} 
          variant="secondary" 
          size="sm"
          className="hover-lift ripple"
        >
          <span className="mr-2">←</span> GERİ
        </Button>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-300 to-teal-200 drop-shadow-lg animate-gradient">
            SEVİYE SEÇİMİ
          </h2>
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full mt-2 animate-pulse"></div>
        </div>
        <div className="w-20 md:w-24"></div> {/* Spacer */}
      </div>

      {/* Enhanced Grid with Staggered Animations */}
      <div className="flex-1 overflow-y-auto pr-2 z-10 custom-scrollbar">
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3 md:gap-4">
          {levels.map((level, index) => {
            const isUnlocked = level <= unlockedLevels;
            const stars = levelStars[level] || 0;
            const isCompleted = stars > 0;
            
            return (
              <button
                key={level}
                disabled={!isUnlocked}
                onClick={() => onSelectLevel(level)}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center relative
                  transition-all duration-300 border-2 overflow-hidden group
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-teal-800/90 to-teal-900/90 border-teal-500/60 hover:from-teal-600 hover:to-emerald-700 hover:border-emerald-400 hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-500/40 cursor-pointer text-white hover-lift' 
                    : 'bg-slate-900/60 border-slate-800/50 text-slate-700 cursor-not-allowed opacity-70 grayscale'}
                  ${isCompleted ? 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-teal-950' : ''}
                `}
                style={{
                  animationDelay: `${index * 0.02}s`,
                }}
              >
                {/* Animated Background Glow for Unlocked */}
                {isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-emerald-500/0 group-hover:from-emerald-500/20 group-hover:via-teal-500/20 group-hover:to-emerald-500/20 transition-all duration-500 blur-xl"></div>
                )}

                {/* Level Number with Enhanced Styling */}
                <span className={`relative z-10 text-xl md:text-2xl font-bold font-display transition-all duration-300 ${
                  isUnlocked 
                    ? 'text-teal-50 drop-shadow-lg group-hover:text-yellow-200 group-hover:scale-110' 
                    : 'text-slate-600'
                }`}>
                  {level}
                </span>
                
                {/* Stars Display with Animation */}
                {isUnlocked && (
                  <div className="absolute bottom-2 md:bottom-3 flex gap-0.5 z-10">
                    {[1, 2, 3].map(s => (
                      <span 
                        key={s} 
                        className={`text-[10px] md:text-xs transition-all duration-300 ${
                          s <= stars 
                            ? 'text-yellow-400 drop-shadow-lg scale-110 animate-pulse' 
                            : 'text-teal-900/40'
                        }`}
                        style={{
                          animationDelay: s <= stars ? `${s * 0.1}s` : '0s',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Lock Overlay with Enhanced Effect */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
                    <div className="relative">
                      <span className="text-slate-500/70 text-xl md:text-2xl drop-shadow-lg">🔒</span>
                      <div className="absolute inset-0 text-slate-500/30 blur-md">🔒</div>
                    </div>
                  </div>
                )}

                {/* Shine Effect on Hover */}
                {isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                )}

                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};