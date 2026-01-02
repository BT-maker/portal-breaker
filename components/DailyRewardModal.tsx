import React from 'react';
import { Button } from './Button';

interface DailyRewardModalProps {
  isOpen: boolean;
  reward: {
    day: number;
    amount: number;
    isStreak: boolean;
  } | null;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, reward, onClaim, onClose }) => {
  if (!isOpen || !reward) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-strong rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 border-2 border-yellow-500/40 animate-scale-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎁</div>
          <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 mb-2">
            Günlük Ödül!
          </h2>
          {reward.isStreak && (
            <p className="text-yellow-300 text-sm font-bold">
              🔥 {reward.day} Günlük Seri!
            </p>
          )}
        </div>

        <div className="glass rounded-xl p-6 border border-yellow-500/30 mb-6 text-center">
          <div className="text-4xl mb-2">⛃</div>
          <div className="text-3xl font-bold text-yellow-400 font-mono">
            +{reward.amount}
          </div>
          <p className="text-teal-200/70 text-sm mt-2">
            {reward.day === 7 ? 'Haftalık Bonus!' : `Gün ${reward.day} Ödülü`}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClaim}
            variant="primary"
            size="lg"
            className="flex-1"
          >
            AL
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            KAPAT
          </Button>
        </div>
      </div>
    </div>
  );
};

