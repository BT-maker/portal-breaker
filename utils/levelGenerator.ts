import { Block, LevelData, Portal } from "../types";
import { GAME_WIDTH, GAME_HEIGHT, BLOCK_PADDING } from "../constants";

// Updated Palette: Removed Pink/Purple tones.
// Focused on Red, Orange, Yellow, Green, Blue spectrum.
const COLORS = [
  '#dc2626', // Red 600
  '#ea580c', // Orange 600
  '#ca8a04', // Yellow 600
  '#16a34a', // Green 600
  '#0d9488', // Teal 600
  '#2563eb', // Blue 600
  '#4f46e5', // Indigo 600 (Dark Blue-ish)
];

export function generateLevel(levelNum: number): LevelData {
  const blocks: Block[] = [];
  
  // Dynamic Grid sizing - Scales proportionally with level number
  // More rows (vertical expansion) - starts smaller and grows to max (32 rows)
  // Available vertical space: ~510px (600 - 30 paddle - 60 startY)
  // Each row: 12px height + 5px padding = 17px, so max ~30 rows comfortably
  // Using 32 max to be safe and leave some space
  const maxRows = Math.floor((GAME_HEIGHT - 90) / (12 + BLOCK_PADDING)); // Calculate safe max rows
  const rows = Math.min(maxRows, 8 + Math.ceil(levelNum * 0.48)); // More aggressive row growth
  const cols = Math.min(34, 10 + Math.ceil(levelNum * 0.48));
  
  const totalBlockWidth = GAME_WIDTH - 60; // 30px padding sides
  const blockWidth = (totalBlockWidth - (cols - 1) * BLOCK_PADDING) / cols;
  const blockHeight = 12; 
  const startX = 30;
  const startY = 60;

  // Pattern Logic based on Level
  const patternType = levelNum % 4; // 0: Standard, 1: Checker, 2: Columns, 3: Pyramid/Scatter

  // Calculate target block count - increases with level
  // More blocks now with more rows: Level 1: ~40 blocks, Level 50: ~600+ blocks
  const targetBlockCount = Math.min(700, 40 + (levelNum * 12));
  let placedBlocks = 0;

  // Hard block probability increases with level
  // Level 1: 5%, Level 50: 40%
  const hardBlockChance = Math.min(0.4, 0.05 + (levelNum * 0.007));
  
  // Explosive block chance (stays low)
  const explosiveChance = 0.02;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // If we've reached target count, stop placing (but always fill top row)
      if (placedBlocks >= targetBlockCount && r > 0) {
        break;
      }

      let shouldPlace = true;

      if (patternType === 1) { // Checkerboard
        if ((r + c) % 2 !== 0) shouldPlace = false;
      } else if (patternType === 2) { // Columns
        if (c % 2 !== 0 && levelNum > 5) shouldPlace = false;
      } else if (patternType === 3) { // Pyramid-ish / Scatter
        if (r > rows / 2 && Math.random() > 0.6) shouldPlace = false;
        if (c < r / 2 || c > cols - (r / 2)) shouldPlace = false;
      }
      
      // Always fill top row for stability
      if (r === 0) shouldPlace = true;

      // Random skip chance - decreases more aggressively as level increases
      // Level 1: 15% skip, Level 10: 8% skip, Level 50: 1% skip (more dense)
      const skipChance = Math.max(0.01, 0.15 - (levelNum * 0.0029));
      if (Math.random() < skipChance && r > 0) shouldPlace = false;

      if (shouldPlace) {
        // HP scales more aggressively with level
        // Level 1: 1-2 HP, Level 50: 1-8 HP
        const baseHp = Math.ceil(Math.random() * (1 + Math.floor(levelNum / 7)));
        const hp = Math.max(1, baseHp);
        
        // Determine block type based on level and chance
        let type: 'NORMAL' | 'HARD' | 'EXPLOSIVE' | 'PORTAL' = 'NORMAL';
        
        if (Math.random() < explosiveChance) {
          type = 'EXPLOSIVE';
        } else if (hp >= 3 || Math.random() < hardBlockChance) {
          type = 'HARD';
        }
        
        blocks.push({
          id: `b_${r}_${c}`,
          x: startX + c * (blockWidth + BLOCK_PADDING),
          y: startY + r * (blockHeight + BLOCK_PADDING),
          width: blockWidth,
          height: blockHeight,
          hp: type === 'EXPLOSIVE' ? 1 : hp,
          maxHp: hp,
          type,
          color: COLORS[(r + c) % COLORS.length],
          // Assign powerup chance during generation (10% chance per block)
          hasPowerUp: Math.random() < 0.1
        });
        
        placedBlocks++;
      }
    }
  }

  // --- PORTAL BLOCK LOGIC ---
  // Find blocks in the lowest row
  if (blocks.length > 0) {
    // Determine the max Y value present
    const maxY = Math.max(...blocks.map(b => b.y));
    
    // Filter blocks that are at the bottom
    const bottomBlocks = blocks.filter(b => Math.abs(b.y - maxY) < 5);
    
    if (bottomBlocks.length > 0) {
      // Pick one random bottom block
      const portalBlock = bottomBlocks[Math.floor(Math.random() * bottomBlocks.length)];
      
      // Convert it to PORTAL
      portalBlock.type = 'PORTAL';
      // Changed to Cyan/Bright Blue to avoid Pink/Purple as requested
      portalBlock.color = '#22d3ee'; 
      portalBlock.hp = 9999; // Indestructible by normal hit
      portalBlock.maxHp = 9999;
      portalBlock.hasPowerUp = false; // Portals don't drop powerups
    }
  }

  return {
    levelNumber: levelNum,
    rows,
    cols,
    blocks,
    portals: [], 
    speedMultiplier: 1 + (levelNum * 0.02)
  };
}