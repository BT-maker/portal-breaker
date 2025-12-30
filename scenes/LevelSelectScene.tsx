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
    <div className="flex flex-col h-full p-8 relative">
      <div className="flex items-center justify-between mb-8 z-10">
        <Button onClick={() => changeScene(Scene.MENU)} variant="secondary" size="sm">
          &larr; GERİ
        </Button>
        <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400 drop-shadow-sm">SEVİYE SEÇİMİ</h2>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 z-10 custom-scrollbar">
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {levels.map((level) => {
            const isUnlocked = level <= unlockedLevels;
            const stars = levelStars[level] || 0;
            
            return (
              <button
                key={level}
                disabled={!isUnlocked}
                onClick={() => onSelectLevel(level)}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center relative
                  transition-all duration-300 border
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-teal-800/80 to-teal-900/80 border-teal-600/50 hover:from-teal-600 hover:to-emerald-700 hover:border-teal-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/20 cursor-pointer text-white' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed opacity-60'}
                `}
              >
                <span className={`text-2xl font-bold font-display ${isUnlocked ? 'text-teal-50 drop-shadow' : 'text-slate-600'}`}>
                  {level}
                </span>
                
                {isUnlocked && (
                  <div className="absolute bottom-3 flex gap-0.5">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`text-[10px] drop-shadow-sm ${s <= stars ? 'text-yellow-400' : 'text-teal-900/50'}`}>★</span>
                    ))}
                  </div>
                )}
                
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-[1px]">
                    <span className="text-slate-500/50 text-2xl">🔒</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};