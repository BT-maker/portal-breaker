import React, { useEffect, useState } from 'react';
import { Scene } from '../types';
import { Button } from '../components/Button';

interface MenuSceneProps {
  changeScene: (scene: Scene) => void;
  currency: number;
}

export const MenuScene: React.FC<MenuSceneProps> = ({ changeScene, currency }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Create floating particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10 animate-fade-in relative z-10 overflow-hidden">
      
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-teal-400/40 rounded-full animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Multiple Glow Layers for Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/15 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-teal-300/25 blur-[80px] rounded-full pointer-events-none"></div>

      {/* Title Section with Enhanced Effects */}
      <div className="text-center space-y-6 relative z-20 animate-slide-down">
        <div className="relative">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 opacity-30 animate-pulse-glow"></div>
          
          {/* Main Title with 3D Effect */}
          <h1 className="relative text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-200 via-emerald-300 to-teal-500 drop-shadow-[0_0_30px_rgba(20,184,166,0.8)] animate-gradient">
            PORTAL BREAKER
          </h1>
          
          {/* Subtle Text Shadow for Depth */}
          <h1 className="absolute inset-0 text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-900/50 via-emerald-900/50 to-teal-900/50 blur-sm -z-10">
            PORTAL BREAKER
          </h1>
        </div>
        
        {/* Subtitle with Animated Lines */}
        <div className="flex items-center justify-center gap-4 animate-slide-up">
          <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-emerald-400 to-emerald-500 animate-pulse"></div>
          <p className="text-emerald-200/90 tracking-[0.6em] text-xs md:text-sm font-bold uppercase drop-shadow-lg">
            Evrenin Sınırlarını Kır
          </p>
          <div className="h-[2px] w-16 bg-gradient-to-l from-transparent via-emerald-400 to-emerald-500 animate-pulse"></div>
        </div>
      </div>

      {/* Buttons with Enhanced Animations */}
      <div className="flex flex-col space-y-5 w-72 z-20 animate-slide-up">
        <Button 
          onClick={() => changeScene(Scene.LEVEL_SELECT)} 
          size="lg" 
          variant="primary" 
          className="w-full hover-lift ripple group relative overflow-hidden"
        >
          <span className="relative z-10">OYNA</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </Button>
        <Button 
          onClick={() => changeScene(Scene.SHOP)} 
          size="md" 
          variant="secondary" 
          className="w-full hover-lift ripple group relative overflow-hidden"
        >
          <span className="relative z-10">MAĞAZA</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </Button>
      </div>

      {/* Enhanced Currency Display */}
      <div className="absolute top-6 right-6 glass-strong px-6 py-3 rounded-2xl shadow-[0_8px_32px_rgba(20,184,166,0.3)] flex items-center gap-3 z-20 hover-lift animate-slide-right group">
        <div className="relative">
          <span className="text-yellow-400 font-bold text-2xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">⛃</span>
          <div className="absolute inset-0 text-yellow-400 blur-md opacity-50 group-hover:opacity-100 transition-opacity">⛃</div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-teal-300/70 font-bold uppercase tracking-wider">Bakiye</span>
          <span className="font-mono text-emerald-50 text-xl font-bold tracking-widest group-hover:text-yellow-300 transition-colors">
            {currency.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Enhanced Footer */}
      <div className="absolute bottom-6 text-teal-600/60 text-xs font-mono animate-fade-in z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span>v1.0.1 &bull; React & Canvas</span>
        </div>
      </div>
    </div>
  );
};