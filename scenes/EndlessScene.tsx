import React, { useState, useEffect } from 'react';
import { Scene, SaveData } from '../types';
import { Button } from '../components/Button';

interface EndlessSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
  onStartEndless: () => void;
}

export const EndlessScene: React.FC<EndlessSceneProps> = ({ changeScene, saveData, onStartEndless }) => {
  const bestScore = saveData.stats?.endlessBestScore || 0;
  const bestWave = saveData.stats?.endlessBestWave || 0;

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
            ENDLESS MOD
          </h2>
        </div>
        
        <div className="w-20 md:w-24"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full border-2 border-teal-500/40">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">∞</div>
            <h3 className="text-2xl font-bold text-teal-200 mb-4">
              Sonsuz Blok Akışı
            </h3>
            <p className="text-teal-300/70 mb-6">
              Zorluk her dalgada artar. Ne kadar dayanabilirsin?
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass rounded-xl p-4 border border-teal-800/50 text-center">
              <p className="text-teal-300/70 text-sm mb-1">En İyi Skor</p>
              <p className="text-yellow-200 text-2xl font-bold font-mono">
                {bestScore.toLocaleString()}
              </p>
            </div>
            <div className="glass rounded-xl p-4 border border-teal-800/50 text-center">
              <p className="text-teal-300/70 text-sm mb-1">En İyi Dalga</p>
              <p className="text-yellow-200 text-2xl font-bold font-mono">
                {bestWave}
              </p>
            </div>
          </div>

          <Button
            onClick={onStartEndless}
            variant="primary"
            size="lg"
            className="w-full"
          >
            BAŞLA
          </Button>
        </div>
      </div>
    </div>
  );
};

