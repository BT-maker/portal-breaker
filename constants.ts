import { ShopItem } from "./types";

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PADDLE_HEIGHT = 20;
export const BALL_RADIUS = 8;
export const BASE_BALL_SPEED = 5;
export const BLOCK_PADDING = 5;
export const PORTAL_RADIUS = 25;

export const INITIAL_LIVES = 3;

// Skins Palette (Fallback colors if images not found)
export const SKINS = {
  PADDLE: {
    DEFAULT: '#3b82f6', // Blue
    CRIMSON: '#ef4444', // Red
    GOLD: '#eab308', // Gold
    NEON: '#10b981', // Emerald
    ICE: '#06b6d4', // Cyan
    VOID: '#581c87', // Dark Purple
  },
  BALL: {
    DEFAULT: '#ffffff',
    PLASMA: '#a855f7', // Purple
    FIRE: '#f97316', // Orange
    ICE: '#06b6d4', // Cyan
    TOXIC: '#84cc16', // Lime
    GHOST: '#94a3b8', // Slate
  }
};

// Image paths for skins
export const PADDLE_IMAGES: Record<string, string> = {
  default: '/assets/paddles/default.png',
  crimson: '/assets/paddles/crimson.png',
  neon: '/assets/paddles/neon.png',
  gold: '/assets/paddles/gold.png',
  ice: '/assets/paddles/ice.png',
  void: '/assets/paddles/void.png',
};

export const BALL_IMAGES: Record<string, string> = {
  default: '/assets/balls/default.png',
  fire: '/assets/balls/fire.png',
  plasma: '/assets/balls/plasma.png',
  ice: '/assets/balls/ice.png',
  toxic: '/assets/balls/toxic.png',
  ghost: '/assets/balls/ghost.png',
};

export const SHOP_ITEMS: ShopItem[] = [
  // Upgrades
  { id: 'upgrade_width_1', name: 'Geniş Paddle I', type: 'UPGRADE_WIDTH', price: 200, description: 'Paddle genişliğini %10 artırır.' },
  { id: 'upgrade_width_2', name: 'Geniş Paddle II', type: 'UPGRADE_WIDTH', price: 500, description: 'Paddle genişliğini %20 artırır.' },
  { id: 'upgrade_width_3', name: 'Geniş Paddle III', type: 'UPGRADE_WIDTH', price: 1000, description: 'Maksimum paddle genişliği.' },
  
  { id: 'upgrade_speed_1', name: 'Hızlı Top I', type: 'UPGRADE_SPEED', price: 300, description: 'Topun başlangıç hızını artırır.' },

  // Paddle Skins
  { id: 'skin_paddle_crimson', name: 'Kızıl Muhafız', type: 'SKIN_PADDLE', price: 300, description: 'Yoğun ateş efektli paddle.', value: SKINS.PADDLE.CRIMSON },
  { id: 'skin_paddle_neon', name: 'Siber Neon', type: 'SKIN_PADDLE', price: 600, description: 'Dijital matris efektli paddle.', value: SKINS.PADDLE.NEON },
  { id: 'skin_paddle_gold', name: 'Altın Kral', type: 'SKIN_PADDLE', price: 1000, description: 'Saf altın ve ışıltı saçar.', value: SKINS.PADDLE.GOLD },
  { id: 'skin_paddle_ice', name: 'Buzul Devi', type: 'SKIN_PADDLE', price: 800, description: 'Soğuk buhar ve kar taneleri.', value: SKINS.PADDLE.ICE },
  { id: 'skin_paddle_void', name: 'Karanlık Madde', type: 'SKIN_PADDLE', price: 1500, description: 'Evrenin derinliklerinden gelen güç.', value: SKINS.PADDLE.VOID },
  
  // Ball Skins
  { id: 'skin_ball_fire', name: 'Alev Topu', type: 'SKIN_BALL', price: 400, description: 'Arkasında duman bırakır.', value: SKINS.BALL.FIRE },
  { id: 'skin_ball_plasma', name: 'Plazma Topu', type: 'SKIN_BALL', price: 400, description: 'Enerji dalgaları yayar.', value: SKINS.BALL.PLASMA },
  { id: 'skin_ball_ice', name: 'Kristal Top', type: 'SKIN_BALL', price: 500, description: 'Buz parçacıkları bırakır.', value: SKINS.BALL.ICE },
  { id: 'skin_ball_toxic', name: 'Asit Topu', type: 'SKIN_BALL', price: 600, description: 'Eriyen asit izi bırakır.', value: SKINS.BALL.TOXIC },
  { id: 'skin_ball_ghost', name: 'Hayalet Küre', type: 'SKIN_BALL', price: 750, description: 'Yarı saydam ruhani iz.', value: SKINS.BALL.GHOST },
];

export const DEFAULT_SAVE_DATA = {
  currency: 10000,
  unlockedLevels: 1,
  levelStars: {},
  inventory: {
    paddleSkins: ['default'],
    ballSkins: ['default'],
    upgrades: {
      paddleWidth: 0,
      ballSpeed: 0,
    },
  },
  equipped: {
    paddleSkin: 'default',
    ballSkin: 'default',
  },
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.5,
  },
};