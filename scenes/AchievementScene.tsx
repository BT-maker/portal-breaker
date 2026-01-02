import React from 'react';
import { Scene, SaveData } from '../types';
import { Button } from '../components/Button';
import { ACHIEVEMENTS } from '../constants';

interface AchievementSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
}

export const AchievementScene: React.FC<AchievementSceneProps> = ({ changeScene, saveData }) => {
  const achievements = ACHIEVEMENTS.map(ach => {
    const saved = saveData.achievements[ach.id] || ach;
    return { ...ach, ...saved };
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="flex flex-col h-full p-6 md:p-8 animate-fade-in bg-gradient-to-b from-[#022c22] to-[#042f2e] relative overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-6 md:mb-8 z-20 relative">
        <Button 
          onClick={() => changeScene(Scene.MENU)} 
          variant="secondary" 
          size="sm"
          className="hover-lift ripple"
        >
          <span className="mr-2">←</span> GERİ
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-300 to-teal-200 drop-shadow-lg">
            BAŞARILAR
          </h2>
          <p className="text-teal-300/70 text-sm mt-1">
            {unlockedCount} / {totalCount} Açıldı
          </p>
        </div>
        
        <div className="w-20 md:w-24"></div>
      </div>

      {/* Achievements Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => {
            const progressPercent = Math.min(100, (ach.progress / ach.target) * 100);
            
            return (
              <div
                key={ach.id}
                className={`glass rounded-xl p-5 border-2 transition-all duration-300 ${
                  ach.unlocked
                    ? 'border-yellow-500/60 bg-gradient-to-br from-yellow-900/40 to-teal-900/40'
                    : 'border-teal-800/50 bg-gradient-to-br from-slate-900/90 to-teal-950/90 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-4xl ${ach.unlocked ? 'animate-pulse' : 'grayscale opacity-50'}`}>
                    {ach.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-1 ${
                      ach.unlocked ? 'text-yellow-200' : 'text-teal-300/70'
                    }`}>
                      {ach.name}
                      {ach.unlocked && <span className="ml-2 text-yellow-400">✓</span>}
                    </h3>
                    
                    <p className="text-teal-200/70 text-sm mb-3">
                      {ach.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-teal-900/50 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-300 ${
                          ach.unlocked
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                            : 'bg-gradient-to-r from-teal-600 to-teal-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-teal-300/70">
                      <span>
                        {ach.unlocked ? 'Tamamlandı!' : `${ach.progress} / ${ach.target}`}
                      </span>
                      {!ach.unlocked && (
                        <span className="text-teal-500">
                          {Math.round(progressPercent)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

