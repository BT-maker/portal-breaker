import React from 'react';
import { Button } from './Button';

interface LevelStatsModalProps {
  isOpen: boolean;
  level: number;
  stats: {
    bestScore: number;
    bestTime: number;
    bestLives: number;
    timesPlayed: number;
    blocksBroken: number;
    powerUpsCollected: number;
  } | null;
  onClose: () => void;
}

export const LevelStatsModal: React.FC<LevelStatsModalProps> = ({ isOpen, level, stats, onClose }) => {
  if (!isOpen || !stats) return null;

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Henüz yok';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-strong rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 border-2 border-teal-500/40 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-300">
            Seviye {level} İstatistikleri
          </h2>
          <button
            onClick={onClose}
            className="text-teal-400 hover:text-teal-300 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-teal-800/50">
            <div className="flex justify-between items-center">
              <span className="text-teal-300 font-bold">En İyi Skor</span>
              <span className="text-yellow-200 text-xl font-mono font-bold">
                {stats.bestScore > 0 ? stats.bestScore.toLocaleString() : 'Henüz yok'}
              </span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-teal-800/50">
            <div className="flex justify-between items-center">
              <span className="text-teal-300 font-bold">En İyi Süre</span>
              <span className="text-yellow-200 text-xl font-mono font-bold">
                {formatTime(stats.bestTime)}
              </span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-teal-800/50">
            <div className="flex justify-between items-center">
              <span className="text-teal-300 font-bold">En İyi Can</span>
              <span className="text-yellow-200 text-xl font-mono font-bold">
                {stats.bestLives > 0 ? `${stats.bestLives} ❤️` : 'Henüz yok'}
              </span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-teal-800/50">
            <div className="flex justify-between items-center">
              <span className="text-teal-300 font-bold">Oynanma Sayısı</span>
              <span className="text-teal-200 text-lg font-mono">
                {stats.timesPlayed}
              </span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-teal-800/50">
            <div className="flex justify-between items-center">
              <span className="text-teal-300 font-bold">Kırılan Bloklar</span>
              <span className="text-teal-200 text-lg font-mono">
                {stats.blocksBroken}
              </span>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-teal-800/50">
            <div className="flex justify-between items-center">
              <span className="text-teal-300 font-bold">Toplanan Power-up</span>
              <span className="text-teal-200 text-lg font-mono">
                {stats.powerUpsCollected}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={onClose} variant="primary" size="md">
            KAPAT
          </Button>
        </div>
      </div>
    </div>
  );
};

