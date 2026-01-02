import React, { useState, useEffect } from 'react';
import { Scene, SaveData } from '../types';
import { Button } from '../components/Button';
import { generateDailyChallenge, DailyChallenge, getDailyChallengeId } from '../utils/dailyChallengeGenerator';

interface DailyChallengeSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
  onStartChallenge: (challenge: DailyChallenge) => void;
}

export const DailyChallengeScene: React.FC<DailyChallengeSceneProps> = ({ changeScene, saveData, onStartChallenge }) => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    const todayChallenge = generateDailyChallenge();
    setChallenge(todayChallenge);
    
    // Check if already completed
    const challengeId = getDailyChallengeId();
    const completedChallenges = saveData.dailyRewards?.completedChallenges || [];
    setCompleted(completedChallenges.includes(challengeId));
  }, []);

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-teal-200">Yükleniyor...</div>
      </div>
    );
  }

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
            GÜNLÜK ZORLUK
          </h2>
          <p className="text-teal-300/70 text-sm mt-1">
            {new Date().toLocaleDateString('tr-TR')}
          </p>
        </div>
        
        <div className="w-20 md:w-24"></div>
      </div>

      {/* Challenge Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full border-2 border-teal-500/40">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-teal-200 mb-4">
              {challenge.description}
            </h3>
            
            {challenge.type === 'TIME_LIMIT' && (
              <div className="glass rounded-xl p-4 mb-4">
                <p className="text-teal-300 font-bold">Zaman Limit: {challenge.target} saniye</p>
              </div>
            )}
            
            {challenge.type === 'MINIMUM_COMBO' && (
              <div className="glass rounded-xl p-4 mb-4">
                <p className="text-teal-300 font-bold">Minimum Combo: {challenge.target}</p>
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-6 border border-yellow-500/30 mb-6 text-center">
            <div className="text-3xl mb-2">⛃</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">
              +{challenge.reward} Altın
            </div>
            <p className="text-teal-200/70 text-sm mt-2">
              Ödül
            </p>
          </div>

          {completed && (
            <div className="glass rounded-xl p-4 mb-6 border-2 border-green-500/50 text-center">
              <p className="text-green-300 font-bold">✓ Bu zorluk tamamlandı!</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => onStartChallenge(challenge)}
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={completed}
            >
              {completed ? 'TAMAMLANDI' : 'BAŞLA'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

