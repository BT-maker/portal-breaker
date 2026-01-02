
export enum Scene {
  MENU = 'MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME = 'GAME',
  SHOP = 'SHOP',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  SETTINGS = 'SETTINGS',
  LEADERBOARD = 'LEADERBOARD',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
  SEASON = 'SEASON',
  ENDLESS = 'ENDLESS',
  SPEED_MODE = 'SPEED_MODE',
  LEVEL_EDITOR = 'LEVEL_EDITOR',
  REPLAY = 'REPLAY',
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  type: 'NORMAL' | 'HARD' | 'EXPLOSIVE' | 'PORTAL' | 'ICE' | 'BOUNCY' | 'BOSS';
  color: string;
  hasPowerUp?: boolean;
  vx?: number; // For BOSS blocks movement
  vy?: number; // For BOSS blocks movement
}

export interface Portal {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetId: string; // ID of the exit portal
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface BallEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean; // Is it flying or stuck to paddle?
  color: string;
}

export interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  vx?: number; // Horizontal velocity for multi-shot
  color: string;
  trail?: TrailPoint[]; // Trail noktaları
  particles?: Particle[]; // Mermi etrafındaki partiküller
  glowIntensity?: number; // Glow şiddeti (0-1)
  effectType?: 'normal' | 'rapidfire' | 'explosive' | 'laser'; // Efekt tipi
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  type: 'MULTIBALL' | 'FAST_SHOOT' | 'SHIELD' | 'SLOW_MO' | 'EXPLOSIVE_SHOT' | 'LASER_BEAM' | 'MULTI_SHOT';
}

export interface LevelData {
  levelNumber: number;
  rows: number;
  cols: number;
  blocks: Block[];
  portals: Portal[]; // Deprecated but kept for type compatibility if needed
  speedMultiplier: number;
}

export interface SaveData {
  currency: number;
  unlockedLevels: number; // Max level reached (1-50)
  levelStars: Record<number, number>; // levelNum -> stars (1-3)
  inventory: {
    paddleSkins: string[];
    ballSkins: string[];
    upgrades: {
      paddleWidth: number; // Level 0-3
      ballSpeed: number; // Level 0-3
    };
  };
  equipped: {
    paddleSkin: string;
    ballSkin: string;
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
  };
  achievements: Record<string, Achievement>; // achievementId -> Achievement
  stats: {
    totalBlocksBroken: number;
    totalPowerUpsCollected: number;
    totalCombos: number;
    maxCombo: number;
    perfectLevels: number;
    fastLevels: number;
  };
  levelStats: Record<number, {
    bestScore: number;
    bestTime: number;
    bestLives: number;
    timesPlayed: number;
    blocksBroken: number;
    powerUpsCollected: number;
  }>;
  dailyRewards: {
    lastClaimDate: string;
    streak: number;
    totalDays: number;
  };
  season: {
    currentSeason: number;
    seasonProgress: number;
    seasonStartDate: string;
  };
  leaderboard: {
    scores: Array<{ level: number; score: number; playerName: string; date: string }>;
    combos: Array<{ combo: number; playerName: string; date: string }>;
    speed: Array<{ time: number; level: number; playerName: string; date: string }>;
  };
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';
  playerName: string;
  language: 'TR' | 'EN';
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  fullscreen: boolean;
  customLevels: Array<{ id: string; name: string; data: LevelData }>;
  replays: Array<{ id: string; level: number; score: number; data: any; date: string }>;
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'SKIN_PADDLE' | 'SKIN_BALL' | 'UPGRADE_WIDTH' | 'UPGRADE_SPEED';
  price: number;
  description: string;
  value?: any; // e.g., color code or stat multiplier
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}
