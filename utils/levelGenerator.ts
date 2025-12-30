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
  // Starts smaller (e.g., 6x10) and grows to max (24x34)
  const rows = Math.min(24, 6 + Math.ceil(levelNum * 0.36));
  const cols = Math.min(34, 10 + Math.ceil(levelNum * 0.48));
  
  const totalBlockWidth = GAME_WIDTH - 60; // 30px padding sides
  const blockWidth = (totalBlockWidth - (cols - 1) * BLOCK_PADDING) / cols;
  const blockHeight = 12; 
  const startX = 30;
  const startY = 60;

  // Pattern Logic based on Level
  const patternType = levelNum % 4; // 0: Standard, 1: Checker, 2: Columns, 3: Pyramid/Scatter

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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

      // Random skip chance decreases as level increases (Higher levels = denser blocks)
      // Level 1: High skip chance. Level 50: Very low skip chance.
      const skipChance = Math.max(0.05, 0.3 - (levelNum * 0.005));
      if (Math.random() < skipChance) shouldPlace = false;

      if (shouldPlace) {
        // HP scales with level
        const hp = Math.ceil(Math.random() * (1 + levelNum / 8));
        const type = Math.random() > 0.96 ? 'EXPLOSIVE' : (hp > 2 ? 'HARD' : 'NORMAL');
        
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