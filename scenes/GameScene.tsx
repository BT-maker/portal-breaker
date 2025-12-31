import React, { useEffect, useRef, useState } from 'react';
import { Scene, SaveData, LevelData, Vector2, Portal, Block, Particle, BallEntity, PowerUp, Projectile } from '../types';
import { generateLevel } from '../utils/levelGenerator.ts';
import { Button } from '../components/Button';
import { audioManager } from '../utils/audio';
import { GAME_HEIGHT, GAME_WIDTH, PADDLE_HEIGHT, BALL_RADIUS, INITIAL_LIVES, PORTAL_RADIUS, SKINS, PADDLE_IMAGES, BALL_IMAGES } from '../constants';

interface GameSceneProps {
  levelNum: number;
  saveData: SaveData;
  onGameOver: (score: number, win: boolean) => void;
  onExit: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ levelNum, saveData, onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Image cache for skins
  const imageCacheRef = useRef<{
    paddles: Map<string, HTMLImageElement | null>;
    balls: Map<string, HTMLImageElement | null>;
  }>({
    paddles: new Map(),
    balls: new Map(),
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
    started: false,
    frameCount: 0, // Used for throttling particle emission
    paddleHitEffect: 0, // 0 to 1, animation state for paddle hit
    lastShotTime: 0, // Cooldown for shooting
    rapidFireTimer: 0, // Timer for fast shooting powerup
    isMouseDown: false, // Track mouse button state for continuous fire
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
  }, []);

  // Init Level
  useEffect(() => {
    const levelData = generateLevel(levelNum);
    
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

    // Start Loop
    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelNum]);

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
    if (state.rapidFireTimer > 0) {
        shotConfig.cooldown = 100; // Super fast
        shotConfig.color = '#ffffff'; // White hot
        shotConfig.speed += 4;
    }

    if (now - state.lastShotTime < shotConfig.cooldown) return;
    state.lastShotTime = now;

    // Left Gun
    state.projectiles.push({
      id: Math.random().toString(),
      x: state.paddleX + 2,
      y: GAME_HEIGHT - 35,
      width: shotConfig.width,
      height: shotConfig.height,
      vy: -shotConfig.speed, 
      color: shotConfig.color
    });
    
    // Muzzle Flash Particles Left
    createMuzzleFlash(state.paddleX + 2, GAME_HEIGHT - 40, shotConfig.flashColor, skinId);

    // Right Gun
    state.projectiles.push({
      id: Math.random().toString(),
      x: state.paddleX + state.paddleWidth - 2 - shotConfig.width,
      y: GAME_HEIGHT - 35,
      width: shotConfig.width,
      height: shotConfig.height,
      vy: -shotConfig.speed,
      color: shotConfig.color
    });

    // Muzzle Flash Particles Right
    createMuzzleFlash(state.paddleX + state.paddleWidth - 6, GAME_HEIGHT - 40, shotConfig.flashColor, skinId);

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
      // 600 frames approx 10 seconds at 60fps
      state.rapidFireTimer = 600; 
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

  // Improved Debris for Block Breaking
  const createBlockDebris = (x: number, y: number, color: string, width: number, height: number) => {
    // Break block into 4x2 grid of fragments
    const cols = 4;
    const rows = 2;
    const fragWidth = width / cols;
    const fragHeight = height / rows;

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
            color: color,
            size: fragWidth * 0.8 // Fragments retain some block size
        });
      }
    }

    // Add extra fine dust/sparkles
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
            color: '#ffffff', // White sparks
            size: Math.random() * 2 + 1
        });
    }
  };

  // Specific Visual Effects Logic
  const generateEffects = () => {
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
    state.lastTime = time;

    // --- CONTINUOUS FIRE LOGIC ---
    if (state.started && state.isMouseDown) {
        fireGuns();
    }

    updatePhysics();
    generateEffects(); 
    draw();

    const breakableBlocks = state.blocks.filter(b => b.type !== 'PORTAL');
    if (breakableBlocks.length === 0) {
      audioManager.playLevelComplete();
      onGameOver(state.score, true);
      return; 
    }
    
    if (state.balls.length === 0 && state.started) {
      state.lives--;
      setUiState(s => ({ ...s, lives: state.lives }));
      
      if (state.lives <= 0) {
        audioManager.playGameOver();
        onGameOver(state.score, false);
        return;
      } else {
        resetBall();
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const updatePhysics = () => {
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
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.size *= 0.95; 
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Projectile Physics (Shooting)
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];
      proj.y += proj.vy;

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
            
            // Hit!
            b.hp--;
            createParticles(proj.x, proj.y, proj.color, 3, 0.3, 3);

            if (b.hp <= 0) {
                // Check Powerup
                if (b.hasPowerUp) {
                    state.powerUps.push({
                        id: Math.random().toString(),
                        x: b.x + b.width / 2 - 10,
                        y: b.y,
                        width: 20,
                        height: 20,
                        vy: 3,
                        // Random Powerup type
                        type: Math.random() > 0.5 ? 'MULTIBALL' : 'FAST_SHOOT'
                    });
                }

                createBlockDebris(b.x, b.y, b.color, b.width, b.height);
                state.blocks.splice(bIdx, 1);
                state.score += 5; // Less points for shooting than ball hit
                setUiState(s => ({ ...s, score: state.score }));
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
        p.y += p.vy;

        if (p.y + p.height >= paddleRect.y && 
            p.y <= paddleRect.y + paddleRect.h &&
            p.x + p.width >= paddleRect.x &&
            p.x <= paddleRect.x + paddleRect.w) {
            
            if (p.type === 'MULTIBALL') {
                spawnMultiball();
                audioManager.playPortal(); 
            } else if (p.type === 'FAST_SHOOT') {
                activateRapidFire();
                audioManager.playPortal(); // Reuse sound for now
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

        ball.x += ball.vx;
        ball.y += ball.vy;

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
                    
                    // Normal Collision Logic
                    if (Math.abs(dx) > Math.abs(dy)) {
                        ball.vx *= -1;
                    } else {
                        ball.vy *= -1;
                    }

                    b.hp--;
                    
                    if (b.hp <= 0) {
                        // Check for PowerUp spawn
                        if (b.hasPowerUp) {
                            state.powerUps.push({
                                id: Math.random().toString(),
                                x: b.x + b.width / 2 - 10,
                                y: b.y,
                                width: 20,
                                height: 20,
                                vy: 3,
                                // Random PowerUp
                                type: Math.random() > 0.5 ? 'MULTIBALL' : 'FAST_SHOOT'
                            });
                        }

                        // Improved Block Debris
                        createBlockDebris(b.x, b.y, b.color, b.width, b.height);

                        state.blocks.splice(bIdx, 1);
                        state.combo++;
                        const points = 10 * state.combo;
                        state.score += points;
                        setUiState(s => ({ ...s, score: state.score }));
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

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const state = gameStateRef.current;
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

    // 2. Draw Projectiles
    state.projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        
        // Add Glow effect for projectiles
        ctx.shadowBlur = 15;
        ctx.shadowColor = proj.color;
        
        // Main beam
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        
        // Add a "core" to make it look like a laser/energy bolt
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(proj.x + 1, proj.y + 2, proj.width - 2, proj.height - 4);
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
        
        ctx.globalAlpha = b.hp / b.maxHp;
        
        // --- UPDATED BLOCK DRAWING: Rounded Corners (50% Radius) ---
        ctx.beginPath();
        if (ctx.roundRect) {
            // Using height/2 creates a pill shape (50% radius)
            ctx.roundRect(b.x, b.y, b.width, b.height, b.height/2);
        } else {
            // Fallback for older browsers
            ctx.rect(b.x, b.y, b.width, b.height);
        }
        ctx.fill();
        
        ctx.globalAlpha = 1.0;
      }
      ctx.shadowBlur = 0;
    });

    // 4. Draw PowerUps
    state.powerUps.forEach(p => {
        // Yellow for Multiball, Red for Rapid Fire
        ctx.fillStyle = p.type === 'MULTIBALL' ? '#facc15' : '#ef4444'; 
        ctx.beginPath();
        ctx.arc(p.x + p.width/2, p.y + p.height/2, 12, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px sans-serif';
        const label = p.type === 'MULTIBALL' ? 'x3' : '⚡';
        const offsetX = p.type === 'MULTIBALL' ? 5 : 4;
        ctx.fillText(label, p.x + offsetX, p.y + 14);
    });

    // 5. Draw Paddle (Rounded) with Animation
    const pEffect = state.paddleHitEffect;
    // Compress height, expand width slightly
    const pHeight = PADDLE_HEIGHT * (1 - pEffect * 0.25); 
    const pWidth = state.paddleWidth * (1 + pEffect * 0.05);
    // Keep centered horizontally, align bottom vertically
    const pX = state.paddleX - (pWidth - state.paddleWidth) / 2;
    const pY = (GAME_HEIGHT - 30) + (PADDLE_HEIGHT - pHeight);

    const paddleImage = getPaddleImage();
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
    <div className="relative flex flex-col items-center justify-center h-full bg-teal-950/20">
      {/* HUD */}
      <div className="absolute top-0 w-full max-w-[800px] p-4 flex justify-between items-center z-10 font-mono">
        <div className="flex gap-4">
          <div className="bg-teal-900/80 text-teal-100 px-4 py-2 rounded-lg border border-teal-500/30 backdrop-blur font-bold shadow-lg">
            SEVİYE {levelNum}
          </div>
          <div className="bg-teal-900/80 text-teal-100 px-4 py-2 rounded-lg border border-teal-500/30 backdrop-blur font-bold shadow-lg">
            PUAN: {uiState.score}
          </div>
        </div>
        <div className="flex gap-1 items-center bg-teal-900/40 px-3 py-1 rounded-full border border-teal-500/20">
          {Array.from({length: Math.max(0, uiState.lives)}).map((_, i) => (
            <span key={i} className="text-red-500 text-xl drop-shadow-sm">♥</span>
          ))}
        </div>
        <Button size="sm" variant="danger" onClick={onExit} className="shadow-lg">ÇIKIŞ</Button>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="bg-[#022c22] rounded-xl shadow-[0_0_30px_rgba(20,184,166,0.2)] border-2 border-teal-800 cursor-none max-w-full max-h-[80vh] touch-none"
        style={{ touchAction: 'none', userSelect: 'none' }}
      />
      
      {!gameStateRef.current.started && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-200 pointer-events-none animate-pulse font-display text-xl tracking-widest drop-shadow-md bg-teal-950/50 px-6 py-2 rounded-full border border-teal-500/30">
          BAŞLAMAK İÇİN TIKLA
        </div>
      )}
    </div>
  );
};