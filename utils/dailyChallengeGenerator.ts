import { LevelData } from '../types';
import { generateLevel } from './levelGenerator';

export interface DailyChallenge {
  id: string;
  date: string;
  type: 'TIME_LIMIT' | 'BLOCK_TYPE_ONLY' | 'NO_POWERUPS' | 'MINIMUM_COMBO';
  description: string;
  target: number;
  reward: number;
  levelData: LevelData;
}

export function generateDailyChallenge(): DailyChallenge {
  const today = new Date();
  const dateStr = today.toDateString();
  const seed = today.getTime();
  
  // Use date as seed for consistent daily challenge
  const challengeTypes: DailyChallenge['type'][] = [
    'TIME_LIMIT',
    'BLOCK_TYPE_ONLY',
    'NO_POWERUPS',
    'MINIMUM_COMBO',
  ];
  
  const typeIndex = Math.floor(seed / 86400000) % challengeTypes.length;
  const type = challengeTypes[typeIndex];
  
  // Generate a level between 5-15 for daily challenge
  const levelNum = 5 + (Math.floor(seed / 86400000) % 11);
  const levelData = generateLevel(levelNum);
  
  let description = '';
  let target = 0;
  let reward = 100;
  
  switch (type) {
    case 'TIME_LIMIT':
      description = `${levelNum}. seviyeyi 60 saniyede tamamla`;
      target = 60;
      reward = 150;
      break;
    case 'BLOCK_TYPE_ONLY':
      description = `${levelNum}. seviyeyi sadece belirli blok tipleriyle tamamla`;
      target = levelData.blocks.length;
      reward = 120;
      break;
    case 'NO_POWERUPS':
      description = `${levelNum}. seviyeyi power-up kullanmadan tamamla`;
      target = 0;
      reward = 130;
      break;
    case 'MINIMUM_COMBO':
      description = `${levelNum}. seviyeyi en az 20 combo ile tamamla`;
      target = 20;
      reward = 140;
      break;
  }
  
  return {
    id: `daily_${dateStr}`,
    date: dateStr,
    type,
    description,
    target,
    reward,
    levelData,
  };
}

export function getDailyChallengeId(): string {
  return `daily_${new Date().toDateString()}`;
}

