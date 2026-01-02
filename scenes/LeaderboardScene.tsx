import React, { useState } from 'react';
import { Scene, SaveData } from '../types';
import { Button } from '../components/Button';

interface LeaderboardSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
}

type LeaderboardCategory = 'scores' | 'combos' | 'speed';

export const LeaderboardScene: React.FC<LeaderboardSceneProps> = ({ changeScene, saveData }) => {
  const [category, setCategory] = useState<LeaderboardCategory>('scores');
  
  const leaderboard = saveData.leaderboard || {
    scores: [],
    combos: [],
    speed: [],
  };
  
  const currentData = leaderboard[category] || [];
  const sortedData = [...currentData].sort((a, b) => {
    if (category === 'scores') {
      return (b as any).score - (a as any).score;
    } else if (category === 'combos') {
      return (b as any).combo - (a as any).combo;
    } else {
      return (a as any).time - (b as any).time;
    }
  }).slice(0, 10);

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
            LİDER TABLOSU
          </h2>
        </div>
        
        <div className="w-20 md:w-24"></div>
      </div>

      {/* Category Tabs */}
      <div className="flex-none mb-6">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setCategory('scores')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              category === 'scores'
                ? 'bg-teal-500 text-white'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50'
            }`}
          >
            Skorlar
          </button>
          <button
            onClick={() => setCategory('combos')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              category === 'combos'
                ? 'bg-teal-500 text-white'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50'
            }`}
          >
            Combo
          </button>
          <button
            onClick={() => setCategory('speed')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              category === 'speed'
                ? 'bg-teal-500 text-white'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50'
            }`}
          >
            Hız
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-2">
          {sortedData.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border-2 border-teal-500/40">
              <p className="text-teal-300/70">Henüz kayıt yok</p>
            </div>
          ) : (
            sortedData.map((entry, index) => (
              <div
                key={index}
                className={`glass rounded-xl p-4 border-2 transition-all ${
                  index === 0
                    ? 'border-yellow-500/60 bg-gradient-to-br from-yellow-900/40 to-teal-900/40'
                    : 'border-teal-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-400' : 'text-teal-300'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-teal-200 font-bold">
                        {(entry as any).playerName || 'Oyuncu'}
                      </p>
                      {category === 'scores' && (
                        <p className="text-teal-300/70 text-sm">
                          Seviye {(entry as any).level} - {((entry as any).score || 0).toLocaleString()} puan
                        </p>
                      )}
                      {category === 'combos' && (
                        <p className="text-teal-300/70 text-sm">
                          {(entry as any).combo || 0} combo
                        </p>
                      )}
                      {category === 'speed' && (
                        <p className="text-teal-300/70 text-sm">
                          Seviye {(entry as any).level} - {((entry as any).time || 0).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="text-2xl">👑</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

