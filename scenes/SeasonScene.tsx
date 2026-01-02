import React, { useState, useEffect } from 'react';
import { Scene, SaveData } from '../types';
import { Button } from '../components/Button';

interface SeasonSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
  updateSeason: (progress: number) => void;
}

export const SeasonScene: React.FC<SeasonSceneProps> = ({ changeScene, saveData, updateSeason }) => {
  const season = saveData.season || { currentSeason: 1, seasonProgress: 0, seasonStartDate: new Date().toISOString() };
  const seasonStart = new Date(season.seasonStartDate);
  const seasonEnd = new Date(seasonStart);
  seasonEnd.setDate(seasonEnd.getDate() + 30); // 30 day seasons
  const daysRemaining = Math.max(0, Math.ceil((seasonEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  const seasonRewards = [
    { level: 1, reward: 100, type: 'currency' },
    { level: 5, reward: 200, type: 'currency' },
    { level: 10, reward: 500, type: 'currency' },
    { level: 15, reward: 'skin_season_1', type: 'skin' },
    { level: 20, reward: 1000, type: 'currency' },
    { level: 25, reward: 'skin_season_2', type: 'skin' },
    { level: 30, reward: 2000, type: 'currency' },
  ];

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
            SEZON {season.currentSeason}
          </h2>
          <p className="text-teal-300/70 text-sm mt-1">
            {daysRemaining} gün kaldı
          </p>
        </div>
        
        <div className="w-20 md:w-24"></div>
      </div>

      {/* Season Progress */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Bar */}
          <div className="glass rounded-xl p-6 border-2 border-teal-500/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-teal-200 font-bold">Sezon İlerlemesi</span>
              <span className="text-yellow-200 font-mono font-bold">
                Seviye {Math.floor(season.seasonProgress / 100)}
              </span>
            </div>
            <div className="w-full h-4 bg-teal-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${(season.seasonProgress % 100)}%` }}
              />
            </div>
            <p className="text-teal-300/70 text-xs mt-2">
              {season.seasonProgress} / {seasonRewards[seasonRewards.length - 1].level * 100} XP
            </p>
          </div>

          {/* Rewards List */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-teal-200 mb-4">Sezon Ödülleri</h3>
            {seasonRewards.map((reward, index) => {
              const isUnlocked = season.seasonProgress >= reward.level * 100;
              const isClaimed = false; // TODO: Add claimed tracking
              
              return (
                <div
                  key={index}
                  className={`glass rounded-xl p-4 border-2 transition-all ${
                    isUnlocked
                      ? 'border-yellow-500/60 bg-gradient-to-br from-yellow-900/40 to-teal-900/40'
                      : 'border-teal-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                        {reward.type === 'currency' ? '⛃' : '🎨'}
                      </div>
                      <div>
                        <p className="text-teal-200 font-bold">
                          Seviye {reward.level}
                        </p>
                        <p className="text-teal-300/70 text-sm">
                          {reward.type === 'currency' 
                            ? `${reward.reward} Altın`
                            : 'Özel Skin'}
                        </p>
                      </div>
                    </div>
                    {isUnlocked && (
                      <span className="text-yellow-400 font-bold">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

