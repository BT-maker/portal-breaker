import React from 'react';
import { Scene } from '../types';
import { Button } from '../components/Button';

interface MenuSceneProps {
  changeScene: (scene: Scene) => void;
  currency: number;
}

export const MenuScene: React.FC<MenuSceneProps> = ({ changeScene, currency }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10 animate-fade-in relative z-10">
      
      {/* Decorative Glow Behind Title */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="text-center space-y-4 relative">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-300 via-emerald-400 to-teal-600 drop-shadow-[0_0_25px_rgba(20,184,166,0.6)]">
          PORTAL BREAKER
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-[2px] w-12 bg-emerald-500/50"></div>
          <p className="text-emerald-200 tracking-[0.6em] text-xs md:text-sm font-bold uppercase">
            Evrenin Sınırlarını Kır
          </p>
          <div className="h-[2px] w-12 bg-emerald-500/50"></div>
        </div>
      </div>

      <div className="flex flex-col space-y-5 w-72">
        <Button onClick={() => changeScene(Scene.LEVEL_SELECT)} size="lg" variant="primary" className="w-full">
          OYNA
        </Button>
        <Button onClick={() => changeScene(Scene.SHOP)} size="md" variant="secondary" className="w-full">
          MAĞAZA
        </Button>
      </div>

      <div className="absolute top-6 right-6 bg-teal-900/40 px-5 py-2.5 rounded-2xl border border-teal-500/30 shadow-lg backdrop-blur-md flex items-center gap-3">
        <span className="text-yellow-400 font-bold text-xl drop-shadow-md">⛃</span>
        <span className="font-mono text-emerald-50 text-xl font-bold tracking-widest">{currency.toLocaleString()}</span>
      </div>
      
      <div className="absolute bottom-6 text-teal-600/60 text-xs font-mono">
        v1.0.1 &bull; React & Canvas
      </div>
    </div>
  );
};