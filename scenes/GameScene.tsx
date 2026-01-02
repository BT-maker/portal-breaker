import React, { useEffect, useRef, useState } from 'react';
import { Scene, SaveData, LevelData, Vector2, Portal, Block, Particle, BallEntity, PowerUp, Projectile } from '../types';
import { generateLevel, generateBossLevel } from '../utils/levelGenerator.ts';
import { Button } from '../components/Button';
import { audioManager } from '../utils/audio';
import { GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, BALL_RADIUS, INITIAL_LIVES, PORTAL_RADIUS, SKINS, PADDLE_IMAGES, BALL_IMAGES, ACHIEVEMENTS } from '../constants';

interface GameSceneProps {
  levelNum: number;
  saveData: SaveData;
  onGameOver: (score: number, win: boolean, lives?: number, levelStats?: {
    time: number;
    blocksBroken: number;
    powerUpsCollected: number;
  }) => void;
  onExit: () => void;
  onGoldCollected?: (amount: number) => void;
  onStatsUpdate?: (stats: SaveData['stats']) => void;
  onAchievementUnlocked?: (achievementId: string) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ levelNum, saveData, onGameOver, onExit, onAchievementUnlocked, onStatsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Image cache for skins
  const imageCacheRef = useRef<{
    paddles: Map<string, HTMLImageElement | null>;
    balls: Map<string, HTMLImageElement | null>;
    korsanPaddle: HTMLImageElement | null;
    korsanBg: HTMLImageElement | null;
    korsanBoss: HTMLImageElement | null;
    korsanBlock: HTMLImageElement | null;
  }>({
    paddles: new Map(),
    balls: new Map(),
    korsanPaddle: null,
    korsanBg: null,
    korsanBoss: null,
    korsanBlock: null,
  });
  
  // Game State Refs
  const gameStateRef = useRef({
    score: 0,
    lives: INITIAL_LIVES,
    paddleX: GAME_WIDTH / 2 - 50,
    prevPaddleX: GAME_WIDTH / 2 - 50, // Track for velocity calculation
    paddleWidth: 100,
    balls: [] as BallEntity[], 
    powerUps: [] as PowerUp[],
    blocks: [] as Block[],
    particles: [] as Particle[],
    projectiles: [] as Projectile[],
    portalCooldown: 0,
    lastTime: 0,
    combo: 0,
    comboMultiplier: 1, // Combo çarpanı
    comboTimer: 0, // Combo zamanlayıcısı (frames)
    maxCombo: 0, // Maksimum combo
    comboHistory: [] as number[], // Combo geçmişi
    started: false,
    frameCount: 0, // Used for throttling particle emission
    paddleHitEffect: 0, // 0 to 1, animation state for paddle hit
    lastShotTime: 0, // Cooldown for shooting
    rapidFireTimer: 0, // Timer for fast shooting powerup
    shieldTimer: 0, // Timer for shield powerup
    slowMoTimer: 0, // Timer for slow-mo powerup
    explosiveShotTimer: 0, // Timer for explosive shot powerup
    laserBeamTimer: 0, // Timer for laser beam powerup
    multiShotTimer: 0, // Timer for multi-shot powerup
    isMouseDown: false, // Track mouse button state for continuous fire
    screenShake: { x: 0, y: 0, intensity: 0, duration: 0 }, // Screen shake state
    screenFlash: { intensity: 0, color: '#ffffff', duration: 0 }, // Screen flash state
    levelStartTime: Date.now(), // Level start time for speed demon achievement
    blocksBrokenThisLevel: 0, // Blocks broken in current level
    powerUpsCollectedThisLevel: 0, // Power-ups collected in current level
    initialLives: INITIAL_LIVES, // Track initial lives for perfect level
    iceSlowTimer: 0, // Timer for ice block slow effect
    magneticBlocks: [] as string[], // IDs of magnetic blocks affecting balls
  });

  // React State for UI overlays
  const [uiState, setUiState] = useState({
    score: 0,
    lives: INITIAL_LIVES,
    isPaused: false,
    started: false,
  });

  // Helper to get ball color
  const getBallColor = () => {
    const skinId = saveData.equipped.ballSkin;
    const skinKey = Object.keys(SKINS.BALL).find(key => 
      `skin_ball_${key.toLowerCase()}` === skinId
    );
    if (skinId === 'default' || !skinKey) return SKINS.BALL.DEFAULT;
    return SKINS.BALL[skinKey as keyof typeof SKINS.BALL];
  };

  // Helper to get paddle color
  const getPaddleColor = () => {
    const skinId = saveData.equipped.paddleSkin;
    const skinKey = Object.keys(SKINS.PADDLE).find(key => 
      `skin_paddle_${key.toLowerCase()}` === skinId
    );
    if (skinId === 'default' || !skinKey) return SKINS.PADDLE.DEFAULT;
    return SKINS.PADDLE[skinKey as keyof typeof SKINS.PADDLE];
  };

  // Helper to get paddle image
  const getPaddleImage = (): HTMLImageElement | null => {
    const skinId = saveData.equipped.paddleSkin;
    let imageKey = 'default';
    
    if (skinId.includes('crimson')) imageKey = 'crimson';
    else if (skinId.includes('neon')) imageKey = 'neon';
    else if (skinId.includes('gold')) imageKey = 'gold';
    else if (skinId.includes('ice')) imageKey = 'ice';
    else if (skinId.includes('void')) imageKey = 'void';
    
    return imageCacheRef.current.paddles.get(imageKey) || null;
  };

  // Helper to get ball image
  const getBallImage = (): HTMLImageElement | null => {
    const skinId = saveData.equipped.ballSkin;
    let imageKey = 'default';
    
    if (skinId.includes('fire')) imageKey = 'fire';
    else if (skinId.includes('plasma')) imageKey = 'plasma';
    else if (skinId.includes('ice')) imageKey = 'ice';
    else if (skinId.includes('toxic')) imageKey = 'toxic';
    else if (skinId.includes('ghost')) imageKey = 'ghost';
    
    return imageCacheRef.current.balls.get(imageKey) || null;
  };

  // Load images on mount
  useEffect(() => {
    const loadImage = (path: string, cache: Map<string, HTMLImageElement | null>, key: string) => {
      const img = new Image();
      img.onload = () => {
        cache.set(key, img);
      };
      img.onerror = () => {
        // Image not found, use fallback (null)
        cache.set(key, null);
      };
      img.src = path;
    };

    // Load paddle images
    Object.entries(PADDLE_IMAGES).forEach(([key, path]) => {
      loadImage(path, imageCacheRef.current.paddles, key);
    });

    // Load ball images
    Object.entries(BALL_IMAGES).forEach(([key, path]) => {
      loadImage(path, imageCacheRef.current.balls, key);
    });

    // Load korsan theme images (for levels 1-10)
    const korsanPaddleImg = new Image();
    korsanPaddleImg.onload = () => {
      imageCacheRef.current.korsanPaddle = korsanPaddleImg;
      console.log('Korsan paddle loaded');
    };
    korsanPaddleImg.onerror = () => {
      imageCacheRef.current.korsanPaddle = null;
      console.error('Failed to load korsan paddle');
    };
    const korsanPaddleUrl = window.location.pathname.includes('/portal-breaker/') 
      ? '/portal-breaker/assets/korsan/korsan-paddle.png'
      : '/assets/korsan/korsan-paddle.png';
    korsanPaddleImg.src = korsanPaddleUrl;

    const korsanBgImg = new Image();
    korsanBgImg.onload = () => {
      imageCacheRef.current.korsanBg = korsanBgImg;
      console.log('Korsan bg loaded');
    };
    korsanBgImg.onerror = () => {
      imageCacheRef.current.korsanBg = null;
      console.error('Failed to load korsan bg');
    };
    const korsanBgUrl = window.location.pathname.includes('/portal-breaker/') 
      ? '/portal-breaker/assets/korsan/korsan-bg.jpeg'
      : '/assets/korsan/korsan-bg.jpeg';
    korsanBgImg.src = korsanBgUrl;

    // Load korsan boss image (for level 10)
    const korsanBossImg = new Image();
    korsanBossImg.onload = () => {
      imageCacheRef.current.korsanBoss = korsanBossImg;
    };
    korsanBossImg.onerror = () => {
      imageCacheRef.current.korsanBoss = null;
    };
    const korsanBossUrl = window.location.pathname.includes('/portal-breaker/') 
      ? '/portal-breaker/assets/korsan/korsan-boss.png'
      : '/assets/korsan/korsan-boss.png';
    korsanBossImg.src = korsanBossUrl;

    // Load korsan block image (for levels 1-10)
    const korsanBlockImg = new Image();
    korsanBlockImg.onload = () => {
      imageCacheRef.current.korsanBlock = korsanBlockImg;
      console.log('Korsan block loaded');
    };
    korsanBlockImg.onerror = () => {
      imageCacheRef.current.korsanBlock = null;
      console.error('Failed to load korsan block');
    };
    const korsanBlockUrl = window.location.pathname.includes('/portal-breaker/') 
      ? '/portal-breaker/assets/korsan/korsan-block.png'
      : '/assets/korsan/korsan-block.png';
    korsanBlockImg.src = korsanBlockUrl;
  }, []);

  // Init Level
  useEffect(() => {
    const isBossLevel = levelNum % 10 === 0 && levelNum > 0;
    const levelData = isBossLevel ? generateBossLevel(levelNum) : generateLevel(levelNum);
    
    // Apply Paddle Upgrade
    const widthUpgrade = saveData.inventory.upgrades.paddleWidth || 0;
    const newPaddleWidth = 100 * (1 + widthUpgrade * 0.1);

    gameStateRef.current.blocks = levelData.blocks;
    gameStateRef.current.paddleWidth = newPaddleWidth;
    gameStateRef.current.paddleX = GAME_WIDTH / 2 - newPaddleWidth / 2;
    gameStateRef.current.prevPaddleX = gameStateRef.current.paddleX;
    gameStateRef.current.powerUps = [];
    gameStateRef.current.projectiles = [];
    gameStateRef.current.started = false;
    gameStateRef.current.paddleHitEffect = 0;
    gameStateRef.current.rapidFireTimer = 0;
    gameStateRef.current.isMouseDown = false;
    
    resetBall(); 
    
    setUiState(s => ({ ...s, started: true }));

    // Start background music
    audioManager.setSFXVolume(saveData.settings.sfxVolume);
    audioManager.setMusicVolume(saveData.settings.musicVolume);
    audioManager.startBackgroundMusic();

    // Start Loop
    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      audioManager.stopBackgroundMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelNum, saveData.settings.sfxVolume, saveData.settings.musicVolume]);

  // Input Handling - Mouse and Touch
  useEffect(() => {
    const updatePaddlePosition = (clientX: number) => {
      if (uiState.isPaused) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      
      let x = (clientX - rect.left) * scaleX - gameStateRef.current.paddleWidth / 2;
      
      // Clamp
      if (x < 0) x = 0;
      if (x + gameStateRef.current.paddleWidth > GAME_WIDTH) x = GAME_WIDTH - gameStateRef.current.paddleWidth;
      
      gameStateRef.current.paddleX = x;

      // Move stuck balls
      gameStateRef.current.balls.forEach(ball => {
        if (!ball.active) {
          ball.x = x + gameStateRef.current.paddleWidth / 2;
        }
      });
    };

    // Track active touch for continuous movement
    let activeTouchId: number | null = null;

    const handleStart = (clientX: number) => {
      if (uiState.isPaused) return;
      
      const state = gameStateRef.current;
      state.isMouseDown = true;

      // Update paddle position immediately on touch/click
      updatePaddlePosition(clientX);

      // If game hasn't started, launch ball
      if (!state.started) {
        let activated = false;
        state.balls.forEach(ball => {
          if (!ball.active) {
            ball.active = true;
            const speedUpgrade = saveData.inventory.upgrades.ballSpeed || 0;
            const speed = 6 * (1 + speedUpgrade * 0.1);
            
            ball.vy = -speed;
            ball.vx = (Math.random() - 0.5) * 4;
            activated = true;
          }
        });
        
        if (activated) {
          state.started = true;
        }
      } 
      // Note: Shooting logic is now handled in gameLoop based on isMouseDown
    };

    const handleEnd = () => {
      gameStateRef.current.isMouseDown = false;
    };

    // Mouse Events
    const handleMouseMove = (e: MouseEvent) => {
      updatePaddlePosition(e.clientX);
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    const handleMouseLeave = () => {
      handleEnd();
    };

    // Touch Events - Mobile Support
    const handleTouchStart = (e: TouchEvent) => {
      // Check if touch is on a modal (check for modal elements)
      const target = e.target as HTMLElement;
      if (target) {
        // Check if target or any parent has high z-index (modal)
        let element: HTMLElement | null = target;
        while (element) {
          const zIndex = window.getComputedStyle(element).zIndex;
          if (zIndex && parseInt(zIndex) >= 9999) {
            return; // Don't handle touch if it's on modal
          }
          element = element.parentElement;
        }
      }
      
      e.preventDefault();
      if (e.touches.length > 0) {
        // Track the first touch
        activeTouchId = e.touches[0].identifier;
        handleStart(e.touches[0].clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      // Find the active touch by identifier
      if (activeTouchId !== null) {
        const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId);
        if (touch) {
          // Keep firing while touching and moving
          gameStateRef.current.isMouseDown = true;
          // Continuously update paddle position as finger moves
          updatePaddlePosition(touch.clientX);
        } else if (e.touches.length > 0) {
          // Fallback: use first touch if identifier not found
          gameStateRef.current.isMouseDown = true;
          updatePaddlePosition(e.touches[0].clientX);
        }
      } else if (e.touches.length > 0) {
        // Fallback: if no active touch tracked, use first touch
        gameStateRef.current.isMouseDown = true;
        updatePaddlePosition(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      // Check if the active touch ended
      if (activeTouchId !== null) {
        const touchStillActive = Array.from(e.changedTouches).some(t => t.identifier === activeTouchId);
        if (!touchStillActive || e.touches.length === 0) {
          activeTouchId = null;
          handleEnd();
        }
      } else {
        handleEnd();
      }
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      activeTouchId = null;
      handleEnd();
    };

    const canvas = canvasRef.current;
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    // Touch events for mobile - Add to both window and canvas for better tracking
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    }
    
    // Also add to window for full screen coverage
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchCancel);
      }
      
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [uiState.isPaused, saveData]);


  const fireGuns = () => {
    const state = gameStateRef.current;
    const now = Date.now();
    const skinId = saveData.equipped.paddleSkin;
    
    // Config based on Skin
    let shotConfig = {
        color: '#fbbf24', // Default Yellow
        flashColor: '#fcd34d',
        speed: 10,
        width: 4,
        height: 12,
        cooldown: 500
    };

    if (skinId.includes('crimson')) {
        // Enhanced Crimson: Faster, bigger, redder
        shotConfig = { color: '#ff0000', flashColor: '#ffcccc', speed: 14, width: 6, height: 20, cooldown: 250 };
    } else if (skinId.includes('neon')) {
        shotConfig = { color: '#10b981', flashColor: '#6ee7b7', speed: 14, width: 3, height: 16, cooldown: 400 };
    } else if (skinId.includes('gold')) {
        shotConfig = { color: '#eab308', flashColor: '#fef08a', speed: 9, width: 6, height: 10, cooldown: 600 };
    } else if (skinId.includes('ice')) {
        shotConfig = { color: '#22d3ee', flashColor: '#a5f3fc', speed: 11, width: 4, height: 14, cooldown: 500 };
    } else if (skinId.includes('void')) {
        shotConfig = { color: '#a855f7', flashColor: '#d8b4fe', speed: 13, width: 5, height: 12, cooldown: 550 };
    }

    // PowerUp Overrides
    const isRapidFire = state.rapidFireTimer > 0;
    const isExplosiveShot = state.explosiveShotTimer > 0;
    const isLaserBeam = state.laserBeamTimer > 0;
    
    if (isRapidFire) {
        shotConfig.cooldown = 100; // Super fast
        shotConfig.color = '#ffffff'; // White hot
        shotConfig.speed += 4;
    }
    
    if (isExplosiveShot) {
        shotConfig.color = '#ff6b00'; // Orange for explosive
        shotConfig.width += 2;
        shotConfig.height += 4;
    }
    
    if (isLaserBeam) {
        shotConfig.color = '#ec4899'; // Pink for laser
        shotConfig.cooldown = 150; // Fast but not as fast as rapid fire
        shotConfig.speed += 2;
    }

    if (now - state.lastShotTime < shotConfig.cooldown) return;
    state.lastShotTime = now;

    // Helper to create projectile with effects
    const createProjectile = (x: number, y: number) => {
      let effectType: 'normal' | 'rapidfire' | 'explosive' | 'laser' = 'normal';
      if (isRapidFire) effectType = 'rapidfire';
      else if (isExplosiveShot) effectType = 'explosive';
      else if (isLaserBeam) effectType = 'laser';
      
      const proj: Projectile = {
        id: Math.random().toString(),
        x,
        y,
        width: shotConfig.width,
        height: shotConfig.height,
        vy: -shotConfig.speed,
        color: shotConfig.color,
        effectType: effectType,
        glowIntensity: isRapidFire ? 1.0 : (isLaserBeam || isExplosiveShot ? 0.8 : 0.5),
        trail: [],
        particles: []
      };
      
      // RapidFire için özel efektler
      if (isRapidFire) {
        // Trail başlangıç noktası
        proj.trail = [{
          x: proj.x + proj.width / 2,
          y: proj.y + proj.height,
          life: 1.0
        }];
        
        // İlk partiküller
        for (let i = 0; i < 3; i++) {
          proj.particles!.push({
            id: Math.random().toString(),
            x: proj.x + proj.width / 2,
            y: proj.y + proj.height / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5,
            maxLife: 0.5,
            color: '#ffffff',
            size: Math.random() * 2 + 1
          });
        }
      }
      
      return proj;
    };

    // Left Gun
    const leftProj = createProjectile(state.paddleX + 2, GAME_HEIGHT - 35);
    state.projectiles.push(leftProj);
    
    // Muzzle Flash Particles Left
    createMuzzleFlash(state.paddleX + 2, GAME_HEIGHT - 40, shotConfig.flashColor, skinId);

    // Right Gun
    const rightProj = createProjectile(state.paddleX + state.paddleWidth - 2 - shotConfig.width, GAME_HEIGHT - 35);
    state.projectiles.push(rightProj);

    // Muzzle Flash Particles Right
    createMuzzleFlash(state.paddleX + state.paddleWidth - 6, GAME_HEIGHT - 40, shotConfig.flashColor, skinId);
    
    // Multi-shot: fire additional projectiles in an arc
    if (state.multiShotTimer > 0) {
        const angles = [-0.3, -0.15, 0.15, 0.3];
        let multiEffectType: 'normal' | 'rapidfire' | 'explosive' | 'laser' = 'normal';
        if (isRapidFire) multiEffectType = 'rapidfire';
        else if (isExplosiveShot) multiEffectType = 'explosive';
        else if (isLaserBeam) multiEffectType = 'laser';
        
        angles.forEach((angle) => {
            const multiProj: Projectile = {
                id: Math.random().toString(),
                x: state.paddleX + state.paddleWidth / 2 - shotConfig.width / 2,
                y: GAME_HEIGHT - 35,
                width: shotConfig.width,
                height: shotConfig.height,
                vy: -shotConfig.speed * Math.cos(angle),
                vx: shotConfig.speed * Math.sin(angle),
                color: shotConfig.color,
                effectType: multiEffectType,
                glowIntensity: isRapidFire ? 1.0 : (isLaserBeam || isExplosiveShot ? 0.8 : 0.6),
            };
            state.projectiles.push(multiProj);
        });
    }

    // Visual Recoil (Simulated by hit effect)
    state.paddleHitEffect = 0.2;

    // Simple shoot sound
    audioManager.playHit();
  };

  const createMuzzleFlash = (x: number, y: number, color: string, skinId: string) => {
    const count = 5;
    for (let i = 0; i < count; i++) {
        let vx = (Math.random() - 0.5) * 3;
        let vy = -Math.random() * 4; // Upward burst
        let size = Math.random() * 3 + 2;

        if (skinId.includes('void')) {
            // Void sucks in slightly or is chaotic
            vx = (Math.random() - 0.5) * 6;
            vy = (Math.random() - 0.5) * 6;
        } else if (skinId.includes('neon')) {
            // Neon is straight and digital
            vx = (Math.random() - 0.5) * 1;
            vy = -Math.random() * 6;
            size = Math.random() * 2 + 1;
        } else if (skinId.includes('crimson')) {
             // Explosive
             size = Math.random() * 5 + 3;
        }

        gameStateRef.current.particles.push({
            id: Math.random().toString(),
            x: x + (Math.random() - 0.5) * 5, 
            y: y,
            vx, 
            vy,
            life: 0.3, // Short life for muzzle flash
            maxLife: 0.3,
            color,
            size
        });
    }
  };


  const resetBall = () => {
    const state = gameStateRef.current;
    state.combo = 0;
    state.started = false;
    state.projectiles = [];
    state.rapidFireTimer = 0;
    state.isMouseDown = false;
    
    state.balls = [{
      id: Math.random().toString(),
      x: state.paddleX + state.paddleWidth / 2,
      y: GAME_HEIGHT - 40,
      vx: 0,
      vy: 0,
      active: false,
      color: getBallColor()
    }];
  };

  const spawnMultiball = () => {
    const state = gameStateRef.current;
    const paddleCenter = state.paddleX + state.paddleWidth / 2;
    const speed = 6 * (1 + (saveData.inventory.upgrades.ballSpeed * 0.1));

    for (let i = 0; i < 2; i++) {
      state.balls.push({
        id: Math.random().toString(),
        x: paddleCenter,
        y: GAME_HEIGHT - 40,
        vx: (Math.random() - 0.5) * 8, 
        vy: -speed, 
        active: true,
        color: getBallColor()
      });
    }
  };

  const activateRapidFire = () => {
      const state = gameStateRef.current;
      // 300 frames = 5 seconds at 60fps
      state.rapidFireTimer = 300; 
  };

  // Generic particle spawner
  const createParticles = (x: number, y: number, color: string, count: number = 8, life: number = 1.0, speed: number = 5) => {
    for (let i = 0; i < count; i++) {
      gameStateRef.current.particles.push({
        id: Math.random().toString(),
        x, y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        life: life,
        maxLife: life,
        color,
        size: Math.random() * 2.5 + 1
      });
    }
  };

  // Improved Debris for Block Breaking - using block.png colors (purple and cyan)
  const createBlockDebris = (x: number, y: number, color: string, width: number, height: number) => {
    // Break block into 4x2 grid of fragments
    const cols = 4;
    const rows = 2;
    const fragWidth = width / cols;
    const fragHeight = height / rows;

    // Block.png colors: purple (#a855f7, #9333ea) and cyan (#06b6d4, #22d3ee)
    const blockColors = ['#a855f7', '#9333ea', '#06b6d4', '#22d3ee', '#8b5cf6', '#06b6d4'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        gameStateRef.current.particles.push({
            id: Math.random().toString(),
            x: x + c * fragWidth + fragWidth/2,
            y: y + r * fragHeight + fragHeight/2,
            // Velocity expands outwards from center
            vx: (c - cols/2 + 0.5) * 2 + (Math.random() - 0.5), 
            vy: (r - rows/2 + 0.5) * 2 + (Math.random() - 0.5),
            life: 0.8 + Math.random() * 0.4,
            maxLife: 1.2,
            color: blockColors[Math.floor(Math.random() * blockColors.length)],
            size: fragWidth * 0.8 // Fragments retain some block size
        });
      }
    }

    // Add extra fine dust/sparkles with block colors (purple and cyan)
    const dustCount = 8;
    for(let i=0; i<dustCount; i++) {
        gameStateRef.current.particles.push({
            id: Math.random().toString(),
            x: x + Math.random() * width,
            y: y + Math.random() * height,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            color: blockColors[Math.floor(Math.random() * blockColors.length)],
            size: Math.random() * 2 + 1
        });
    }
  };

  // Specific Visual Effects Logic
  const generateEffects = (deltaTime: number) => {
    const state = gameStateRef.current;
    state.frameCount++;

    // 1. Ball Aura & Trails
    state.balls.forEach(ball => {
        if (!ball.active) return;
        
        const skinId = saveData.equipped.ballSkin;
        
        // AURA EFFECT: Constant emission around the ball
        const auraCount = 2; 
        for(let i=0; i<auraCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * BALL_RADIUS * 0.6; 
            
            let auraColor = ball.color;
            if (skinId.includes('plasma')) auraColor = '#e9d5ff'; 
            if (skinId.includes('fire')) auraColor = '#fdba74'; 
            if (skinId.includes('toxic')) auraColor = '#bef264';
            if (skinId.includes('ghost')) auraColor = '#cbd5e1';
            
            state.particles.push({
                id: Math.random().toString(),
                x: ball.x + Math.cos(angle) * dist,
                y: ball.y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5,
                life: 0.3,
                maxLife: 0.3,
                color: auraColor,
                size: Math.random() * 3 + 1
            });
        }

        // TRAIL EFFECT
        if (state.frameCount % 2 === 0) {
            if (skinId.includes('fire')) {
                // Smoke (Darker, rises slowly)
                state.particles.push({
                    id: Math.random().toString(),
                    x: ball.x,
                    y: ball.y - 5,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 1.5,
                    life: 0.8,
                    maxLife: 0.8,
                    color: '#525252',
                    size: Math.random() * 3 + 2
                });
                // Fire (Brighter, rises fast)
                state.particles.push({
                    id: Math.random().toString(),
                    x: ball.x + (Math.random() - 0.5) * 4,
                    y: ball.y,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 2, 
                    life: 0.5,
                    maxLife: 0.5,
                    color: Math.random() > 0.5 ? '#f97316' : '#ef4444', 
                    size: Math.random() * 3 + 1
                });
            } else if (skinId.includes('plasma')) {
                // Energy sparks
                state.particles.push({
                    id: Math.random().toString(),
                    x: ball.x,
                    y: ball.y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 0.4,
                    maxLife: 0.4,
                    color: Math.random() > 0.5 ? '#d8b4fe' : '#e879f9',
                    size: Math.random() * 2 + 1
                });
            } else if (skinId.includes('toxic')) {
                // Bubbling green acid
                state.particles.push({
                    id: Math.random().toString(),
                    x: ball.x + (Math.random() - 0.5) * 4,
                    y: ball.y + (Math.random() - 0.5) * 4,
                    vx: 0,
                    vy: Math.random() * 2, // Drips down
                    life: 0.7,
                    maxLife: 0.7,
                    color: Math.random() > 0.5 ? '#84cc16' : '#bef264',
                    size: Math.random() * 4 + 2
                });
            } else if (skinId.includes('ghost')) {
                // Ethereal afterimage
                if (state.frameCount % 4 === 0) {
                    state.particles.push({
                        id: Math.random().toString(),
                        x: ball.x,
                        y: ball.y,
                        vx: 0,
                        vy: 0,
                        life: 0.5,
                        maxLife: 0.5,
                        color: '#cbd5e1', // Slate-300
                        size: BALL_RADIUS
                    });
                }
            } else if (skinId.includes('ice')) {
                 // Ice Shards
                 state.particles.push({
                    id: Math.random().toString(),
                    x: ball.x + (Math.random() - 0.5) * 8,
                    y: ball.y + (Math.random() - 0.5) * 8,
                    vx: 0,
                    vy: 0.5, 
                    life: 0.8,
                    maxLife: 0.8,
                    color: Math.random() > 0.5 ? '#a5f3fc' : '#ffffff',
                    size: Math.random() * 2
                });
            }
        }
    });

    // 2. Paddle Effects
    const paddleSkinId = saveData.equipped.paddleSkin;
    
    // Base inertia allows particles to "drag" behind the paddle
    const inertiaX = (state.paddleX - state.prevPaddleX) * 0.3;

    // --- HIGH QUALITY EFFECTS FOR ALL SKINS ---
    // All skins now generate 3-4 particles PER FRAME for that "dense" look
    
    const count = 4; // High density

    for(let i=0; i<count; i++) {
        const px = state.paddleX + Math.random() * state.paddleWidth;
        const py = GAME_HEIGHT - 30 + Math.random() * PADDLE_HEIGHT;

        if (paddleSkinId.includes('crimson')) {
            // FIRE: Floats UP rapidly, varying reds/oranges
             state.particles.push({
                id: Math.random().toString(),
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 2 + inertiaX, 
                vy: -Math.random() * 2 - 1.5, // Strong upward
                life: 0.5,
                maxLife: 0.5,
                color: Math.random() > 0.6 ? '#f87171' : (Math.random() > 0.5 ? '#fca5a5' : '#ef4444'), 
                size: Math.random() * 4 + 1
            });
        } 
        else if (paddleSkinId.includes('neon')) {
            // NEON: Matrix style, floating UP straight, green/emerald, squares (handled in draw)
            state.particles.push({
                id: Math.random().toString(),
                x: px,
                y: py,
                vx: 0 + inertiaX * 0.5, // Less chaotic, more digital
                vy: -Math.random() * 3 - 1, // Fast upward data stream
                life: 0.4,
                maxLife: 0.4,
                color: Math.random() > 0.5 ? '#34d399' : '#10b981', 
                size: Math.random() * 3 + 2
            });
        }
        else if (paddleSkinId.includes('gold')) {
            // GOLD: Heavy sparkles, some float up, some fall down (heavy gold dust)
             state.particles.push({
                id: Math.random().toString(),
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 1.5 + inertiaX, 
                vy: (Math.random() - 0.5) * 2, // Chaotic vertical
                life: 0.6,
                maxLife: 0.6,
                color: Math.random() > 0.3 ? '#facc15' : '#fef08a', 
                size: Math.random() * 3 + 1
            });
        }
        else if (paddleSkinId.includes('ice')) {
            // ICE: Heavy cold mist, falls DOWN
             state.particles.push({
                id: Math.random().toString(),
                x: px,
                y: py + 5, // Start slightly lower
                vx: (Math.random() - 0.5) * 1 + inertiaX, 
                vy: Math.random() * 2 + 1, // Falls down
                life: 0.7,
                maxLife: 0.7,
                color: Math.random() > 0.5 ? '#bae6fd' : '#e0f2fe', 
                size: Math.random() * 4
            });
        }
        else if (paddleSkinId.includes('void')) {
            // VOID: Sucks INWARDS and Up, dark colors
            const centerX = state.paddleX + state.paddleWidth/2;
            const dirX = (centerX - px) * 0.05; // Pull towards center

             state.particles.push({
                id: Math.random().toString(),
                x: px,
                y: py,
                vx: dirX + inertiaX, 
                vy: -Math.random() * 1.5, // Slow float up
                life: 0.6,
                maxLife: 0.6,
                color: Math.random() > 0.5 ? '#7e22ce' : '#3b0764', 
                size: Math.random() * 5 + 2 // Larger clouds
            });
        }
    }

    state.prevPaddleX = state.paddleX;
  };

  const gameLoop = (time: number) => {
    if (uiState.isPaused) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const state = gameStateRef.current;
    
    // Calculate delta time (time in seconds since last frame)
    const deltaTime = state.lastTime === 0 ? 0.016 : Math.min((time - state.lastTime) / 1000, 0.033); // Cap at ~30 FPS minimum
    state.lastTime = time;
    state.frameCount++;

    // Combo timer update
    if (state.comboTimer > 0) {
      state.comboTimer--;
      if (state.comboTimer === 0) {
        // Combo lost
        if (state.combo > 0) {
          state.combo = 0;
          state.comboMultiplier = 1;
        }
      }
    }

    // Screen shake update
    if (state.screenShake.duration > 0) {
      state.screenShake.duration--;
      const intensity = state.screenShake.intensity * (state.screenShake.duration / 60);
      state.screenShake.x = (Math.random() - 0.5) * intensity;
      state.screenShake.y = (Math.random() - 0.5) * intensity;
      if (state.screenShake.duration <= 0) {
        state.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
      }
    }

    // Screen flash update
    if (state.screenFlash.duration > 0) {
      state.screenFlash.duration--;
      state.screenFlash.intensity *= 0.9;
      if (state.screenFlash.duration <= 0) {
        state.screenFlash = { intensity: 0, color: '#ffffff', duration: 0 };
      }
    }

    // Power-up timers
    if (state.shieldTimer > 0) state.shieldTimer--;
    if (state.slowMoTimer > 0) state.slowMoTimer--;
    if (state.explosiveShotTimer > 0) state.explosiveShotTimer--;
    if (state.laserBeamTimer > 0) state.laserBeamTimer--;
    if (state.multiShotTimer > 0) state.multiShotTimer--;
    if (state.iceSlowTimer > 0) state.iceSlowTimer--;

    // --- CONTINUOUS FIRE LOGIC ---
    if (state.started && state.isMouseDown) {
        // Normal fire logic - works for all power-ups including explosive shot and laser beam
        fireGuns();
    }

    // Slow-mo effect: adjust update rate
    const timeDelta = state.slowMoTimer > 0 ? 0.5 : 1.0;
    
    updatePhysics(deltaTime);
    generateEffects(deltaTime); 
    draw();

    const breakableBlocks = state.blocks.filter(b => b.type !== 'PORTAL' && b.type !== 'IRON');
    if (breakableBlocks.length === 0) {
      audioManager.playLevelComplete();
      
      // Check achievements
      const levelTime = (Date.now() - state.levelStartTime) / 1000; // seconds
      const isPerfect = state.lives >= state.initialLives;
      const isFast = levelTime <= 30;
      
      if (onStatsUpdate) {
        const newStats = {
          ...saveData.stats,
          totalBlocksBroken: (saveData.stats?.totalBlocksBroken || 0) + state.blocksBrokenThisLevel,
          maxCombo: Math.max(saveData.stats?.maxCombo || 0, state.maxCombo),
        };
        
        if (isPerfect) {
          newStats.perfectLevels = (saveData.stats?.perfectLevels || 0) + 1;
        }
        if (isFast) {
          newStats.fastLevels = (saveData.stats?.fastLevels || 0) + 1;
        }
        
        onStatsUpdate(newStats);
      }
      
      // Update leaderboard for combo
      if (state.maxCombo > 0 && onStatsUpdate) {
        // Combo leaderboard will be updated via callback
      }
      
      audioManager.stopBackgroundMusic();
      onGameOver(state.score, true, state.lives, {
        time: levelTime,
        blocksBroken: state.blocksBrokenThisLevel,
        powerUpsCollected: state.powerUpsCollectedThisLevel,
      });
      return; 
    }
    
    if (state.balls.length === 0 && state.started) {
      state.lives--;
      setUiState(s => ({ ...s, lives: state.lives }));
      
      if (state.lives <= 0) {
        audioManager.playGameOver();
        audioManager.stopBackgroundMusic();
        onGameOver(state.score, false);
        return;
      } else {
        resetBall();
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const updatePhysics = (deltaTime: number) => {
    const state = gameStateRef.current;
    
    // Decay hit effect
    if (state.paddleHitEffect > 0) {
        state.paddleHitEffect -= 0.15;
        if (state.paddleHitEffect < 0) state.paddleHitEffect = 0;
    }
    
    // Timer for Rapid Fire
    if (state.rapidFireTimer > 0) {
        state.rapidFireTimer--;
    }

    // Particles Physics
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * deltaTime * 60; // Scale to 60 FPS
      p.y += p.vy * deltaTime * 60; // Scale to 60 FPS
      p.life -= 0.02 * deltaTime * 60; // Scale to 60 FPS
      p.size *= 0.95; 
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Projectile Physics (Shooting)
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];
      const prevY = proj.y;
      proj.y += proj.vy * deltaTime * 60; // Scale to 60 FPS
      if (proj.vx !== undefined) {
        proj.x += proj.vx * deltaTime * 60; // Scale to 60 FPS
        
        // Bounce off walls for multi-shot
        if (proj.x < 0 || proj.x + proj.width > GAME_WIDTH) {
          proj.vx *= -1;
        }
      }

      // Update trail for RapidFire projectiles
      if (proj.effectType === 'rapidfire' && proj.trail) {
        // Add new trail point
        proj.trail.push({
          x: proj.x + proj.width / 2,
          y: proj.y + proj.height / 2,
          life: 1.0
        });
        
        // Update existing trail points
        for (let j = proj.trail.length - 1; j >= 0; j--) {
          proj.trail[j].life -= 0.05;
          if (proj.trail[j].life <= 0) {
            proj.trail.splice(j, 1);
          }
        }
        
        // Limit trail length (max 20 points)
        if (proj.trail.length > 20) {
          proj.trail.shift();
        }
      }

      // Update projectile particles (for RapidFire)
      if (proj.particles) {
        for (let j = proj.particles.length - 1; j >= 0; j--) {
          const part = proj.particles[j];
          part.x += part.vx;
          part.y += part.vy;
          part.life -= 0.03;
          part.size *= 0.98;
          if (part.life <= 0) {
            proj.particles.splice(j, 1);
          }
        }
        
        // Add new particles for RapidFire (continuous emission)
        if (proj.effectType === 'rapidfire' && state.frameCount % 2 === 0) {
          proj.particles.push({
            id: Math.random().toString(),
            x: proj.x + proj.width / 2 + (Math.random() - 0.5) * proj.width,
            y: proj.y + proj.height / 2 + (Math.random() - 0.5) * proj.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 0.4,
            maxLife: 0.4,
            color: Math.random() > 0.5 ? '#ffffff' : '#fbbf24',
            size: Math.random() * 2 + 1
          });
        }
      }

      if (proj.y < 0) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with blocks
      let hit = false;
      for (let bIdx = state.blocks.length - 1; bIdx >= 0; bIdx--) {
        const b = state.blocks[bIdx];
        if (b.type === 'PORTAL') continue; // Bullets don't hit portals

        if (proj.x < b.x + b.width &&
            proj.x + proj.width > b.x &&
            proj.y < b.y + b.height &&
            proj.y + proj.height > b.y) {
            
            // Hit! (Iron blocks are unbreakable)
            if (b.type !== 'IRON') {
              b.hp--;
              createParticles(proj.x, proj.y, proj.color, 3, 0.3, 3);
            } else {
              // Iron block hit effect - just bounce off
              createParticles(proj.x, proj.y, '#525252', 3, 0.3, 3);
              audioManager.playHit();
            }

            if (b.hp <= 0 && b.type !== 'IRON') {
                // Check Powerup
                if (b.hasPowerUp) {
                    const powerUpTypes: PowerUp['type'][] = [
                        'MULTIBALL', 'FAST_SHOOT', 'SHIELD', 'SLOW_MO', 
                        'EXPLOSIVE_SHOT', 'LASER_BEAM', 'MULTI_SHOT'
                    ];
                    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                    
                    state.powerUps.push({
                        id: Math.random().toString(),
                        x: b.x + b.width / 2 - 10,
                        y: b.y,
                        width: 20,
                        height: 20,
                        vy: 3,
                        type: randomType
                    });
                }

                createBlockDebris(b.x, b.y, b.color, b.width, b.height);
                state.blocks.splice(bIdx, 1);
                state.score += 5; // Less points for shooting than ball hit
                setUiState(s => ({ ...s, score: state.score }));
                
                // Explosive shot effect
                if (state.explosiveShotTimer > 0) {
                    const explosionRadius = 60;
                    const explosionX = proj.x + proj.width / 2;
                    const explosionY = proj.y + proj.height / 2;
                    
                    // Create explosion particles
                    for (let i = 0; i < 30; i++) {
                        const angle = (Math.PI * 2 * i) / 30;
                        const speed = 5 + Math.random() * 5;
                        state.particles.push({
                            id: Math.random().toString(),
                            x: explosionX,
                            y: explosionY,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 1.0,
                            maxLife: 1.0,
                            color: Math.random() > 0.5 ? '#ff6b00' : '#ff0000',
                            size: Math.random() * 4 + 2
                        });
                    }
                    
                    // Damage nearby blocks (iron blocks are immune)
                    for (let nearbyIdx = state.blocks.length - 1; nearbyIdx >= 0; nearbyIdx--) {
                        const nearbyBlock = state.blocks[nearbyIdx];
                        const dx = (nearbyBlock.x + nearbyBlock.width / 2) - explosionX;
                        const dy = (nearbyBlock.y + nearbyBlock.height / 2) - explosionY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < explosionRadius && nearbyBlock.type !== 'PORTAL' && nearbyBlock.type !== 'IRON') {
                            nearbyBlock.hp--;
                            if (nearbyBlock.hp <= 0) {
                                createBlockDebris(nearbyBlock.x, nearbyBlock.y, nearbyBlock.color, nearbyBlock.width, nearbyBlock.height);
                                state.blocks.splice(nearbyIdx, 1);
                                state.score += 5;
                            }
                        }
                    }
                    
                    // Screen shake
                    state.screenShake = { x: 0, y: 0, intensity: 5, duration: 15 };
                }
                
                audioManager.playBrickDestroy();
            } else {
                audioManager.playHit();
            }

            hit = true;
            break; // Bullet destroys only one block
        }
      }

      if (hit) {
        state.projectiles.splice(i, 1);
      }
    }

    // PowerUps
    const paddleRect = {
        x: state.paddleX,
        y: GAME_HEIGHT - 30,
        w: state.paddleWidth,
        h: PADDLE_HEIGHT
    };

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const p = state.powerUps[i];
        p.y += p.vy * deltaTime * 60; // Scale to 60 FPS

        if (p.y + p.height >= paddleRect.y && 
            p.y <= paddleRect.y + paddleRect.h &&
            p.x + p.width >= paddleRect.x &&
            p.x <= paddleRect.x + paddleRect.w) {
            
            // Power-up collected effects
            createParticles(p.x + p.width / 2, p.y + p.height / 2, '#ffff00', 15, 1.0, 8);
            state.screenFlash = { intensity: 0.5, color: '#ffff00', duration: 10 };
            state.screenShake = { x: 0, y: 0, intensity: 2, duration: 10 };
            
            if (p.type === 'MULTIBALL') {
                spawnMultiball();
                audioManager.playPortal(); 
            } else if (p.type === 'FAST_SHOOT') {
                activateRapidFire();
                audioManager.playPortal();
            } else if (p.type === 'SHIELD') {
                state.shieldTimer = 300; // 5 seconds
                audioManager.playPortal();
            } else if (p.type === 'SLOW_MO') {
                state.slowMoTimer = 300; // 5 seconds
                audioManager.playPortal();
            } else if (p.type === 'EXPLOSIVE_SHOT') {
                state.explosiveShotTimer = 300; // 5 seconds
                audioManager.playPortal();
            } else if (p.type === 'LASER_BEAM') {
                state.laserBeamTimer = 300; // 5 seconds
                audioManager.playPortal();
            } else if (p.type === 'MULTI_SHOT') {
                state.multiShotTimer = 300; // 5 seconds
                audioManager.playPortal();
            }
            state.powerUps.splice(i, 1);
            continue;
        }

        if (p.y > GAME_HEIGHT) {
            state.powerUps.splice(i, 1);
        }
    }

    // Portal Cooldown
    if (state.portalCooldown > 0) state.portalCooldown--;

    // Balls
    for (let i = state.balls.length - 1; i >= 0; i--) {
        const ball = state.balls[i];

        if (!ball.active) continue;

        // Ice slow effect
        const speedMultiplier = state.iceSlowTimer > 0 ? 0.5 : 1.0;
        
        ball.x += ball.vx * speedMultiplier * deltaTime * 60; // Scale to 60 FPS
        ball.y += ball.vy * speedMultiplier * deltaTime * 60; // Scale to 60 FPS

        // Walls
        if (ball.x < BALL_RADIUS) {
            ball.x = BALL_RADIUS;
            ball.vx *= -1;
        } else if (ball.x > GAME_WIDTH - BALL_RADIUS) {
            ball.x = GAME_WIDTH - BALL_RADIUS;
            ball.vx *= -1;
        }
        if (ball.y < BALL_RADIUS) {
            ball.y = BALL_RADIUS;
            ball.vy *= -1;
        }

        if (ball.y > GAME_HEIGHT) {
            state.balls.splice(i, 1);
            continue;
        }

        // Paddle Collision (Rounded Approximation)
        const paddleTop = GAME_HEIGHT - 30;
        if (ball.y + BALL_RADIUS >= paddleTop && 
            ball.y - BALL_RADIUS <= paddleTop + PADDLE_HEIGHT &&
            ball.x >= state.paddleX && 
            ball.x <= state.paddleX + state.paddleWidth) {
            
            ball.vy = -Math.abs(ball.vy);
            const hitPoint = ball.x - (state.paddleX + state.paddleWidth / 2);
            ball.vx = hitPoint * 0.15; 
            audioManager.playHit();
            state.combo = 0; 

            // Trigger animation
            state.paddleHitEffect = 1.0;
        }

        // Blocks
        if (ball.y < GAME_HEIGHT - 100) { 
            for (let bIdx = state.blocks.length - 1; bIdx >= 0; bIdx--) {
                const b = state.blocks[bIdx];
                const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.width));
                const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.height));
                
                const dx = ball.x - closestX;
                const dy = ball.y - closestY;
                const distance = Math.sqrt(dx*dx + dy*dy);

                if (distance < BALL_RADIUS) {
                    
                    // --- PORTAL BLOCK LOGIC ---
                    if (b.type === 'PORTAL') {
                      audioManager.playPortal();
                      createParticles(b.x + b.width/2, b.y + b.height/2, '#22d3ee', 20, 1.5, 8); 
                      
                      // Teleport Ball to Top
                      ball.y = 40; 
                      ball.vy = Math.abs(ball.vy); 
                      
                      state.blocks.splice(bIdx, 1);
                      break;
                    }
                    
                    // --- BOSS BLOCK LOGIC ---
                    if (b.type === 'BOSS') {
                      // Boss takes 1 damage per hit
                      b.hp--;
                      createParticles(closestX, closestY, '#dc2626', 10, 0.8, 6);
                      audioManager.playHit();
                      
                      if (b.hp <= 0) {
                        // Boss defeated!
                        createParticles(b.x + b.width/2, b.y + b.height/2, '#dc2626', 50, 2.0, 15);
                        state.screenShake = { x: 0, y: 0, intensity: 5, duration: 20 };
                        state.screenFlash = { intensity: 0.8, color: '#dc2626', duration: 15 };
                        audioManager.playLevelComplete();
                        
                        // Boss gives extra reward
                        if (onGoldCollected) {
                          onGoldCollected(100 + (levelNum / 10) * 50);
                        }
                        
                        state.blocks.splice(bIdx, 1);
                        break;
                      }
                      
                      // Bounce ball
                      if (Math.abs(dx) > Math.abs(dy)) {
                        ball.vx *= -1;
                      } else {
                        ball.vy *= -1;
                      }
                      break;
                    }
                    
                    // --- ICE BLOCK LOGIC ---
                    if (b.type === 'ICE') {
                      state.iceSlowTimer = 180; // 3 seconds slow
                      createParticles(b.x + b.width/2, b.y + b.height/2, '#06b6d4', 15, 1.0, 5);
                    }
                    
                    // --- BOUNCY BLOCK LOGIC ---
                    if (b.type === 'BOUNCY') {
                      // Random bounce direction
                      const angle = Math.random() * Math.PI * 2;
                      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                      ball.vx = Math.cos(angle) * speed;
                      ball.vy = Math.sin(angle) * speed;
                      createParticles(b.x + b.width/2, b.y + b.height/2, '#f59e0b', 10, 0.8, 6);
                    }
                    
                    // Normal Collision Logic (skip for bouncy as it's handled above, iron blocks just bounce)
                    if (b.type !== 'BOUNCY' && b.type !== 'IRON') {
                      if (Math.abs(dx) > Math.abs(dy)) {
                          ball.vx *= -1;
                      } else {
                          ball.vy *= -1;
                      }
                    } else if (b.type === 'IRON') {
                      // Iron block - just bounce, no damage
                      if (Math.abs(dx) > Math.abs(dy)) {
                          ball.vx *= -1;
                      } else {
                          ball.vy *= -1;
                      }
                      createParticles(b.x + b.width/2, b.y + b.height/2, '#525252', 5, 0.5, 4);
                      audioManager.playHit();
                    }

                    // Iron blocks are unbreakable
                    if (b.type !== 'IRON') {
                      b.hp--;
                    }
                    
                    if (b.hp <= 0 && b.type !== 'IRON') {
                        // Check for PowerUp spawn
                        if (b.hasPowerUp) {
                            const powerUpTypes: PowerUp['type'][] = [
                                'MULTIBALL', 'FAST_SHOOT', 'SHIELD', 'SLOW_MO', 
                                'EXPLOSIVE_SHOT', 'LASER_BEAM', 'MULTI_SHOT'
                            ];
                            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                            
                            state.powerUps.push({
                                id: Math.random().toString(),
                                x: b.x + b.width / 2 - 10,
                                y: b.y,
                                width: 20,
                                height: 20,
                                vy: 3,
                                type: randomType
                            });
                        }

                        // Improved Block Debris
                        createBlockDebris(b.x, b.y, b.color, b.width, b.height);

                        state.blocks.splice(bIdx, 1);
                        
                        // Combo System
                        state.combo++;
                        state.comboTimer = 180; // 3 seconds at 60fps
                        state.maxCombo = Math.max(state.maxCombo, state.combo);
                        
                        // Combo multiplier calculation
                        if (state.combo >= 50) state.comboMultiplier = 10;
                        else if (state.combo >= 30) state.comboMultiplier = 5;
                        else if (state.combo >= 20) state.comboMultiplier = 3;
                        else if (state.combo >= 10) state.comboMultiplier = 2;
                        else state.comboMultiplier = 1;
                        
                        const basePoints = 10;
                        const points = basePoints * state.combo * state.comboMultiplier;
                        state.score += points;
                        setUiState(s => ({ ...s, score: state.score }));
                        
                        // Screen shake on combo milestones
                        if (state.combo % 10 === 0) {
                            state.screenShake = { x: 0, y: 0, intensity: 3, duration: 10 };
                        }
                        
                        // Flash effect on high combos
                        if (state.combo >= 20) {
                            state.screenFlash = { intensity: 0.3, color: '#ffff00', duration: 5 };
                        }
                        
                        audioManager.playBrickDestroy();
                    } else {
                        // Just a hit
                        createParticles(closestX, closestY, b.color, 4, 0.5, 3);
                        audioManager.playHit();
                    }
                    break;
                }
            }
        }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply screen shake
    const state = gameStateRef.current;
    ctx.save();
    ctx.translate(state.screenShake.x, state.screenShake.y);

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw background for korsan theme (levels 1-10)
    if (levelNum <= 10 && imageCacheRef.current.korsanBg && imageCacheRef.current.korsanBg.complete) {
      ctx.drawImage(imageCacheRef.current.korsanBg, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    const paddleSkinId = saveData.equipped.paddleSkin;

    // 1. Draw Particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      
      // Check for Ghost skin trail (slate color) to ensure it renders as circle
      const isGhostTrail = p.color === '#cbd5e1';
      
      if ((paddleSkinId.includes('neon') && p.color.includes('d399')) || (p.size > 3 && !isGhostTrail)) {
          // Squares for Neon or Debris
          ctx.save();
          ctx.translate(p.x, p.y);
          // Rotate debris for effect
          ctx.rotate(p.life * 10); 
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
          ctx.restore();
      } else {
          // Default round particles (Aura, Fire, Ghost, etc)
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    // 2. Draw Projectiles with Enhanced Effects
    state.projectiles.forEach(proj => {
        const isRapidFire = proj.effectType === 'rapidfire';
        const glowIntensity = proj.glowIntensity || 0.5;
        
        // Draw Trail for RapidFire projectiles
        if (isRapidFire && proj.trail && proj.trail.length > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(proj.trail[0].x, proj.trail[0].y);
            
            // Draw gradient trail
            for (let i = 1; i < proj.trail.length; i++) {
                const point = proj.trail[i];
                const alpha = point.life * 0.6;
                ctx.lineTo(point.x, point.y);
                
                // Draw trail segments with gradient
                if (i > 0) {
                    const prevPoint = proj.trail[i - 1];
                    const gradient = ctx.createLinearGradient(prevPoint.x, prevPoint.y, point.x, point.y);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${prevPoint.life * 0.8})`);
                    gradient.addColorStop(1, `rgba(255, 251, 36, ${alpha})`);
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 3 * point.life;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        
        // Draw projectile particles (sparkles around projectile)
        if (proj.particles && proj.particles.length > 0) {
            proj.particles.forEach(part => {
                ctx.save();
                ctx.globalAlpha = part.life;
                ctx.fillStyle = part.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = part.color;
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
        
        // Multi-layer glow for RapidFire
        if (isRapidFire) {
            // Outer glow
            ctx.shadowBlur = 30 * glowIntensity;
            ctx.shadowColor = proj.color;
            ctx.fillStyle = proj.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(proj.x - 2, proj.y - 2, proj.width + 4, proj.height + 4);
            
            // Middle glow
            ctx.shadowBlur = 20 * glowIntensity;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(proj.x - 1, proj.y - 1, proj.width + 2, proj.height + 2);
        }
        
        // Main projectile body
        ctx.fillStyle = proj.color;
        ctx.shadowBlur = isRapidFire ? 25 * glowIntensity : 15;
        ctx.shadowColor = proj.color;
        ctx.globalAlpha = 1.0;
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        
        // Core (bright center)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = isRapidFire ? 0.9 : 0.7;
        ctx.shadowBlur = 0;
        ctx.fillRect(proj.x + 1, proj.y + 2, proj.width - 2, proj.height - 4);
        
        // Reset
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    });

    // 3. Draw Blocks
    state.blocks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 0;
      
      if (b.type === 'PORTAL') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#22d3ee';
        const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.save();
        ctx.translate(b.x + b.width/2, b.y + b.height/2);
        ctx.scale(scale, scale);
        // Rounded Portal Block
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-b.width/2, -b.height/2, b.width, b.height, b.height/2);
            ctx.fill();
        } else {
            ctx.fillRect(-b.width/2, -b.height/2, b.width, b.height);
        }
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('🌀', -6, 4);
        ctx.restore();
      } else if (b.type === 'BOSS') {
        // Boss block special rendering
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#dc2626';
        ctx.save();
        ctx.translate(b.x + b.width/2, b.y + b.height/2);
        // No pulse animation - boss stays fixed size
        
        // Use korsan boss image for level 10
        const bossImage = (levelNum === 10 && imageCacheRef.current.korsanBoss && imageCacheRef.current.korsanBoss.complete)
          ? imageCacheRef.current.korsanBoss
          : null;
        
        if (bossImage) {
          // Draw korsan boss image - maintain aspect ratio, center it
          const imgAspect = bossImage.naturalWidth / bossImage.naturalHeight;
          const bossAspect = b.width / b.height;
          
          let drawWidth = b.width;
          let drawHeight = b.height;
          let drawX = -b.width/2;
          let drawY = -b.height/2;
          
          // Maintain aspect ratio
          if (imgAspect > bossAspect) {
            // Image is wider, fit to height
            drawHeight = b.height;
            drawWidth = drawHeight * imgAspect;
            drawX = -drawWidth / 2;
          } else {
            // Image is taller, fit to width
            drawWidth = b.width;
            drawHeight = drawWidth / imgAspect;
            drawY = -drawHeight / 2;
          }
          
          ctx.drawImage(bossImage, drawX, drawY, drawWidth, drawHeight);
        } else {
          // Boss block body (fallback)
          ctx.fillStyle = b.color;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-b.width/2, -b.height/2, b.width, b.height, b.height/2);
            ctx.fill();
          } else {
            ctx.fillRect(-b.width/2, -b.height/2, b.width, b.height);
          }
          
          // Boss icon
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('👹', -10, 5);
        }
        
        // Boss HP bar
        const hpPercent = b.hp / b.maxHp;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-b.width/2, -b.height/2 - 8, b.width * hpPercent, 4);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-b.width/2, -b.height/2 - 8, b.width, 4);
        
        ctx.restore();
      } else {
        if (b.type === 'HARD') {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          // Rounded Border
          if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(b.x, b.y, b.width, b.height, b.height/2);
              ctx.stroke();
          } else {
              ctx.strokeRect(b.x, b.y, b.width, b.height);
          }
        }
        if (b.type === 'EXPLOSIVE') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'red';
        }
        if (b.type === 'ICE') {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#06b6d4';
        }
        if (b.type === 'IRON') {
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#404040';
          // Add metallic effect with darker border
          ctx.strokeStyle = '#2a2a2a';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);
          const pulse = Math.sin(Date.now() / 300) * 0.1 + 1;
          ctx.globalAlpha = 0.8 + (b.hp / b.maxHp) * 0.2;
        }
        if (b.type === 'BOUNCY') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f59e0b';
        }
        
        ctx.globalAlpha = b.hp / b.maxHp;
        
        // Use korsan block image for levels 1-10
        const blockImage = (levelNum <= 10 && imageCacheRef.current.korsanBlock && imageCacheRef.current.korsanBlock.complete)
          ? imageCacheRef.current.korsanBlock
          : null;
        
        if (blockImage) {
          // Draw korsan block image - fill block area completely
          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(b.x, b.y, b.width, b.height, b.height/2);
          } else {
            ctx.rect(b.x, b.y, b.width, b.height);
          }
          ctx.clip();
          
          // Draw image to fill entire block area - maintain aspect ratio but scale to cover
          const imgAspect = blockImage.naturalWidth / blockImage.naturalHeight;
          const blockAspect = b.width / b.height;
          
          let drawWidth = b.width;
          let drawHeight = b.height;
          let drawX = b.x;
          let drawY = b.y;
          
          // Scale to cover (fill entire block)
          if (imgAspect > blockAspect) {
            // Image is wider, fit to height and center horizontally
            drawHeight = b.height;
            drawWidth = drawHeight * imgAspect;
            drawX = b.x + (b.width - drawWidth) / 2;
          } else {
            // Image is taller, fit to width and center vertically
            drawWidth = b.width;
            drawHeight = drawWidth / imgAspect;
            drawY = b.y + (b.height - drawHeight) / 2;
          }
          
          ctx.drawImage(blockImage, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        } else {
          // Fallback: draw colored rectangle
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(b.x, b.y, b.width, b.height, b.height/2);
          } else {
            ctx.rect(b.x, b.y, b.width, b.height);
          }
          ctx.fill();
        }
        
        // Special block icons
        if (b.type === 'ICE') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('❄', b.x + b.width/2 - 4, b.y + b.height/2 + 3);
        } else if (b.type === 'BOUNCY') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('⚡', b.x + b.width/2 - 4, b.y + b.height/2 + 3);
        } else if (b.type === 'IRON') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('🛡', b.x + b.width/2 - 4, b.y + b.height/2 + 3);
        }
        
        ctx.globalAlpha = 1.0;
      }
      ctx.shadowBlur = 0;
    });

    // 4. Draw PowerUps with Enhanced Visuals
    state.powerUps.forEach(p => {
        const centerX = p.x + p.width / 2;
        const centerY = p.y + p.height / 2;
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
        const radius = 12 * pulse;
        
        // Power-up colors and icons
        let color = '#facc15';
        let icon = 'x3';
        let glowColor = '#facc15';
        
        switch (p.type) {
            case 'MULTIBALL':
                color = '#facc15';
                glowColor = '#facc15';
                icon = 'x3';
                break;
            case 'FAST_SHOOT':
                color = '#ef4444';
                glowColor = '#ff6b6b';
                icon = '⚡';
                break;
            case 'SHIELD':
                color = '#3b82f6';
                glowColor = '#60a5fa';
                icon = '🛡';
                break;
            case 'SLOW_MO':
                color = '#8b5cf6';
                glowColor = '#a78bfa';
                icon = '⏱';
                break;
            case 'EXPLOSIVE_SHOT':
                color = '#f97316';
                glowColor = '#fb923c';
                icon = '💣';
                break;
            case 'LASER_BEAM':
                color = '#ec4899';
                glowColor = '#f472b6';
                icon = '🔺';
                break;
            case 'MULTI_SHOT':
                color = '#10b981';
                glowColor = '#34d399';
                icon = '➶';
                break;
        }
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Icon
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, centerX, centerY);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    });

    // 5. Draw Paddle (Rounded) with Animation
    const pEffect = state.paddleHitEffect;
    // Compress height, expand width slightly
    const pHeight = PADDLE_HEIGHT * (1 - pEffect * 0.25); 
    const pWidth = state.paddleWidth * (1 + pEffect * 0.05);
    // Keep centered horizontally, align bottom vertically
    const pX = state.paddleX - (pWidth - state.paddleWidth) / 2;
    const pY = (GAME_HEIGHT - 30) + (PADDLE_HEIGHT - pHeight);

    // Use korsan paddle for levels 1-10, otherwise use normal paddle
    let paddleImage: HTMLImageElement | null = null;
    if (levelNum <= 10 && imageCacheRef.current.korsanPaddle && imageCacheRef.current.korsanPaddle.complete) {
      paddleImage = imageCacheRef.current.korsanPaddle;
    } else {
      paddleImage = getPaddleImage();
    }
    const paddleColor = getPaddleColor();
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddleColor;
    
    // Draw Guns for ALL skins
    // Gun Color matches paddle but darker or metallic
    ctx.fillStyle = '#334155'; // Dark Slate for gun body
    // Left Gun
    ctx.fillRect(pX - 4, pY - 8, 8, pHeight + 8);
    // Right Gun
    ctx.fillRect(pX + pWidth - 4, pY - 8, 8, pHeight + 8);
    
    // Draw Paddle Body - Use image if available, otherwise fallback to color
    if (paddleImage && paddleImage.complete && paddleImage.naturalWidth > 0) {
      // Draw image with optimized scaling
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = 1.0;
      
      // Draw image at exact paddle size (no scaling, maintain aspect ratio)
      const imgAspect = paddleImage.naturalWidth / paddleImage.naturalHeight;
      const targetAspect = pWidth / pHeight;
      
      let drawWidth = pWidth;
      let drawHeight = pHeight;
      let drawX = pX;
      let drawY = pY;
      
      // Maintain aspect ratio while fitting to paddle area
      if (imgAspect > targetAspect) {
        // Image is wider, fit to height (keep height, adjust width)
        drawHeight = pHeight;
        drawWidth = drawHeight * imgAspect;
        drawX = pX + (pWidth - drawWidth) / 2;
      } else {
        // Image is taller, fit to width (keep width, adjust height)
        drawWidth = pWidth;
        drawHeight = drawWidth / imgAspect;
        drawY = pY + (pHeight - drawHeight) / 2;
      }
      
      // Draw at exact size (no extra scaling)
      ctx.drawImage(
        paddleImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
      
      // Flash effect overlay
      if (pEffect > 0.1) {
        ctx.globalAlpha = pEffect * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pX, pY, pWidth, pHeight, pHeight / 2);
        } else {
          ctx.rect(pX, pY, pWidth, pHeight);
        }
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Fallback to color fill
      ctx.fillStyle = paddleColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pX, pY, pWidth, pHeight, pHeight / 2);
      } else {
        ctx.rect(pX, pY, pWidth, pHeight);
      }
      ctx.fill();
      
      // Flash effect
      if (pEffect > 0.1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${pEffect * 0.6})`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pX, pY, pWidth, pHeight, pHeight / 2);
        } else {
          ctx.rect(pX, pY, pWidth, pHeight);
        }
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // Draw Shield Effect
    if (state.shieldTimer > 0) {
        const shieldRadius = 40;
        const shieldX = state.paddleX + state.paddleWidth / 2;
        const shieldY = GAME_HEIGHT - 30 + PADDLE_HEIGHT / 2;
        const pulse = Math.sin(Date.now() / 100) * 0.1 + 1;
        
        // Outer shield ring
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#60a5fa';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(shieldX, shieldY, shieldRadius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shield particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Date.now() / 500;
            const px = shieldX + Math.cos(angle) * (shieldRadius * 0.7);
            const py = shieldY + Math.sin(angle) * (shieldRadius * 0.7);
            
            ctx.fillStyle = '#60a5fa';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    // Restore transform (screen shake)
    ctx.restore();

    // 6. Draw Balls
    const ballImage = getBallImage();
    state.balls.forEach(ball => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = ball.color;
        
        const skinId = saveData.equipped.ballSkin;
        if (skinId.includes('plasma')) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#d8b4fe';
        } else if (skinId.includes('fire')) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ef4444';
        }

        // Draw ball image if available, otherwise fallback to color
        if (ballImage && ballImage.complete && ballImage.naturalWidth > 0) {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Use exact ball size (diameter = radius * 2)
          const ballSize = BALL_RADIUS * 2;
          let drawX = ball.x - ballSize / 2;
          let drawY = ball.y - ballSize / 2;
          
          // Maintain aspect ratio
          const imgAspect = ballImage.naturalWidth / ballImage.naturalHeight;
          let drawWidth = ballSize;
          let drawHeight = ballSize;
          
          if (imgAspect > 1) {
            // Image is wider, fit to height
            drawHeight = ballSize;
            drawWidth = drawHeight * imgAspect;
            drawX = ball.x - drawWidth / 2;
          } else {
            // Image is taller, fit to width
            drawWidth = ballSize;
            drawHeight = drawWidth / imgAspect;
            drawY = ball.y - drawHeight / 2;
          }
          
          ctx.drawImage(ballImage, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        } else {
          // Fallback to color circle
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.fill();
          ctx.closePath();
        }
    });
    ctx.shadowBlur = 0;
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-teal-950/20 animate-fade-in">
      {/* Enhanced Modern HUD */}
      <div className="absolute top-0 w-full max-w-[800px] p-3 md:p-4 flex flex-col gap-2 z-10 font-mono animate-slide-down">
        {/* Boss HP Bar */}
        {gameStateRef.current.blocks.some(b => b.type === 'BOSS') && (() => {
          const bossBlock = gameStateRef.current.blocks.find(b => b.type === 'BOSS');
          if (!bossBlock) return null;
          const hpPercent = (bossBlock.hp / bossBlock.maxHp) * 100;
          return (
            <div className="w-full glass-strong px-4 py-2 rounded-xl border-2 border-red-500/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-red-300 text-sm font-bold">👹 BOSS</span>
                <span className="text-red-200 text-sm font-mono">{bossBlock.hp}/{bossBlock.maxHp}</span>
              </div>
              <div className="w-full h-3 bg-red-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          );
        })()}
        
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-3 md:gap-4 flex-wrap">
            {/* Level Badge */}
            <div className="glass-strong text-teal-100 px-4 py-2.5 rounded-xl border-2 border-teal-500/40 font-bold shadow-xl hover-lift group">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300 text-sm">📊</span>
                <span className="text-sm md:text-base">SEVİYE</span>
                <span className="text-emerald-200 text-lg md:text-xl group-hover:scale-110 transition-transform">
                  {levelNum}
                </span>
              </div>
            </div>
            
            {/* Score Badge with Animation */}
            <div className="glass-strong text-teal-100 px-4 py-2.5 rounded-xl border-2 border-teal-500/40 font-bold shadow-xl hover-lift group">
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 text-sm">⭐</span>
                <span className="text-sm md:text-base">PUAN:</span>
                <span className="text-yellow-200 text-lg md:text-xl font-mono group-hover:scale-110 transition-transform">
                  {uiState.score.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Lives with Enhanced Display */}
          <div className="flex gap-2 items-center glass-strong px-4 py-2 rounded-full border-2 border-red-500/40 shadow-xl hover-lift">
            <span className="text-xs text-red-300 font-bold uppercase tracking-wider hidden md:inline">CAN:</span>
            <div className="flex gap-1">
              {Array.from({length: Math.max(0, uiState.lives)}).map((_, i) => (
                <span 
                  key={i} 
                  className="text-red-400 text-xl md:text-2xl drop-shadow-lg animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
          
          {/* Exit Button */}
          <Button 
            size="sm" 
            variant="danger" 
            onClick={() => {
              audioManager.stopBackgroundMusic();
              onExit();
            }} 
            className="shadow-xl hover-lift ripple"
          >
            ✕ ÇIKIŞ
          </Button>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div className="relative">
        {/* Enhanced Game Canvas */}
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="bg-[#022c22] rounded-xl shadow-[0_0_40px_rgba(20,184,166,0.4)] border-2 border-teal-700/50 cursor-none max-w-full max-h-[80vh] touch-none animate-scale-in"
          style={{ touchAction: 'none', userSelect: 'none' }}
        />
        
        {/* Combo Indicator - Vertical on Right Side */}
        {gameStateRef.current.combo > 0 && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full ml-4 z-20">
            <div className="glass-strong text-orange-100 px-3 py-4 rounded-xl border-2 border-orange-500/40 font-bold shadow-xl animate-pulse-glow">
              <div className="flex flex-col items-center gap-2">
                <span className="text-orange-300 text-lg">🔥</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-orange-200 text-[10px] md:text-xs uppercase tracking-widest">C</span>
                  <span className="text-orange-200 text-[10px] md:text-xs uppercase tracking-widest">O</span>
                  <span className="text-orange-200 text-[10px] md:text-xs uppercase tracking-widest">M</span>
                  <span className="text-orange-200 text-[10px] md:text-xs uppercase tracking-widest">B</span>
                  <span className="text-orange-200 text-[10px] md:text-xs uppercase tracking-widest">O</span>
                </div>
                <div className="flex flex-col items-center gap-1 mt-1">
                  <span className="text-orange-200 text-xl md:text-2xl font-mono font-black">
                    {gameStateRef.current.combo}
                  </span>
                  <span className="text-orange-300 text-sm">x</span>
                  <span className="text-orange-200 text-lg md:text-xl font-mono font-black">
                    {gameStateRef.current.comboMultiplier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Start Prompt */}
      {!gameStateRef.current.started && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 animate-bounce-in">
          <div className="glass-strong px-6 md:px-8 py-3 md:py-4 rounded-full border-2 border-emerald-400/50 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl animate-pulse">👆</span>
              <span className="text-emerald-200 font-display text-lg md:text-xl tracking-widest drop-shadow-lg animate-pulse">
                BAŞLAMAK İÇİN TIKLA
              </span>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl -z-10 animate-pulse-glow"></div>
        </div>
      )}
      
      {/* Screen Flash Overlay */}
      {gameStateRef.current.screenFlash.intensity > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            backgroundColor: gameStateRef.current.screenFlash.color,
            opacity: gameStateRef.current.screenFlash.intensity,
            transition: 'opacity 0.1s',
          }}
        />
      )}
      
      {/* Slow-mo Visual Effect */}
      {gameStateRef.current.slowMoTimer > 0 && (
        <div className="absolute inset-0 pointer-events-none z-25 border-4 border-purple-400/50 animate-pulse" 
             style={{ boxShadow: 'inset 0 0 100px rgba(139, 92, 246, 0.3)' }} />
      )}
    </div>
  );
};