
export enum Scene {
  MENU = 'MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME = 'GAME',
  SHOP = 'SHOP',
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
  type: 'NORMAL' | 'HARD' | 'EXPLOSIVE' | 'PORTAL';
  color: string;
  hasPowerUp?: boolean;
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

export interface Projectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  color: string;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  type: 'MULTIBALL' | 'FAST_SHOOT';
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
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'SKIN_PADDLE' | 'SKIN_BALL' | 'UPGRADE_WIDTH' | 'UPGRADE_SPEED';
  price: number;
  description: string;
  value?: any; // e.g., color code or stat multiplier
}
