import React, { useState, useEffect } from 'react';
import { Scene, SaveData, Achievement } from './types';
import { DEFAULT_SAVE_DATA, ACHIEVEMENTS } from './constants';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { ShopScene } from './scenes/ShopScene';
import { LevelCompleteModal } from './components/LevelCompleteModal';

const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<Scene>(Scene.MENU);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [saveData, setSaveData] = useState<SaveData>(() => {
    const stored = localStorage.getItem('blockBreakerSave');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Initialize achievements if not present
        if (!parsed.achievements) {
          parsed.achievements = {};
          ACHIEVEMENTS.forEach(ach => {
            parsed.achievements[ach.id] = { ...ach };
          });
        }
        // Initialize stats if not present
        if (!parsed.stats) {
          parsed.stats = DEFAULT_SAVE_DATA.stats;
        }
        return { ...DEFAULT_SAVE_DATA, ...parsed };
      } catch (e) {
        console.error("Save file corrupted");
      }
    }
    // Initialize achievements for new save
    const achievements: Record<string, Achievement> = {};
    ACHIEVEMENTS.forEach(ach => {
      achievements[ach.id] = { ...ach };
    });
    return { ...DEFAULT_SAVE_DATA, achievements, stats: DEFAULT_SAVE_DATA.stats };
  });
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    win: boolean;
    score: number;
    reward?: number;
  }>({
    isOpen: false,
    win: false,
    score: 0,
  });

  // Achievement check function
  const checkAchievements = (stats: SaveData['stats']) => {
    const updatedAchievements = { ...saveData.achievements };
    let unlockedNew = false;
    
    ACHIEVEMENTS.forEach(ach => {
      const current = updatedAchievements[ach.id] || { ...ach };
      if (current.unlocked) return;
      
      let progress = current.progress;
      let unlocked = false;
      
      switch (ach.id) {
        case 'combo_master':
          progress = stats.maxCombo || 0;
          unlocked = progress >= ach.target;
          break;
        case 'power_collector':
          progress = stats.totalPowerUpsCollected || 0;
          unlocked = progress >= ach.target;
          break;
        case 'perfect_level':
          progress = stats.perfectLevels || 0;
          unlocked = progress >= ach.target;
          break;
        case 'speed_demon':
          progress = stats.fastLevels || 0;
          unlocked = progress >= ach.target;
          break;
        case 'block_breaker':
          progress = stats.totalBlocksBroken || 0;
          unlocked = progress >= ach.target;
          break;
      }
      
      if (unlocked && !current.unlocked) {
        unlockedNew = true;
        console.log(`Achievement Unlocked: ${ach.name}!`);
      }
      
      updatedAchievements[ach.id] = { ...current, progress, unlocked };
    });
    
    if (unlockedNew) {
      setSaveData(prev => ({ ...prev, achievements: updatedAchievements }));
    }
  };
  
  const handleStatsUpdate = (stats: SaveData['stats']) => {
    setSaveData(prev => ({ ...prev, stats }));
    checkAchievements(stats);
  };

  // Persist Save
  useEffect(() => {
    localStorage.setItem('blockBreakerSave', JSON.stringify(saveData));
  }, [saveData]);

  const handleLevelComplete = (score: number, win: boolean, lives?: number) => {
    if (win) {
      // Calculate Reward based on level and stars
      const stars = Math.min(3, lives || 1);
      
      // Base rewards for levels 1-10
      const baseRewards = {
        3: 50,  // 3 stars
        2: 30,  // 2 stars
        1: 15   // 1 star
      };
      
      let multiplier = 1;
      if (selectedLevel >= 11 && selectedLevel <= 20) {
        multiplier = 2; // 2x for levels 11-20
      } else if (selectedLevel >= 21 && selectedLevel <= 30) {
        multiplier = 3; // 3x for levels 21-30 (2 * 1.5)
      } else if (selectedLevel >= 31 && selectedLevel <= 40) {
        multiplier = 4.5; // 4.5x for levels 31-40 (3 * 1.5)
      } else if (selectedLevel >= 41 && selectedLevel <= 50) {
        multiplier = 6.75; // 6.75x for levels 41-50 (4.5 * 1.5)
      }
      
      const reward = Math.floor(baseRewards[stars as keyof typeof baseRewards] * multiplier);

      setSaveData(prev => {
        const newUnlocked = Math.max(prev.unlockedLevels, selectedLevel + 1);
        const currentStars = prev.levelStars[selectedLevel] || 0;
        // Star logic: based on remaining lives (3 lives = 3 stars, 2 lives = 2 stars, 1 life = 1 star)
        const newStars = Math.max(currentStars, stars); 
        
        return {
          ...prev,
          currency: prev.currency + reward,
          unlockedLevels: newUnlocked,
          levelStars: {
            ...prev.levelStars,
            [selectedLevel]: newStars
          }
        };
      });
      
      // Show modal instead of alert
      setModalState({
        isOpen: true,
        win: true,
        score,
        reward,
      });
    } else {
      // Show game over modal
      setModalState({
        isOpen: true,
        win: false,
        score,
      });
    }
  };

  const handleModalClose = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setCurrentScene(Scene.LEVEL_SELECT);
  };

  const handleShopBuy = (itemId: string, cost: number) => {
    setSaveData(prev => {
      const newInventory = { ...prev.inventory };
      const newUpgrades = { ...prev.inventory.upgrades };

      if (itemId.startsWith('skin_paddle')) newInventory.paddleSkins.push(itemId);
      if (itemId.startsWith('skin_ball')) newInventory.ballSkins.push(itemId);
      
      if (itemId === 'upgrade_width_1') newUpgrades.paddleWidth = 1;
      if (itemId === 'upgrade_width_2') newUpgrades.paddleWidth = 2;
      if (itemId === 'upgrade_width_3') newUpgrades.paddleWidth = 3;
      
      return {
        ...prev,
        currency: prev.currency - cost,
        inventory: {
          ...newInventory,
          upgrades: newUpgrades
        }
      };
    });
  };

  const handleEquipItem = (type: 'paddle' | 'ball', skinId: string) => {
    setSaveData(prev => ({
      ...prev,
      equipped: {
        ...prev.equipped,
        [type === 'paddle' ? 'paddleSkin' : 'ballSkin']: skinId
      }
    }));
  };

  return (
    <div className="w-full h-screen bg-teal-950 text-white overflow-hidden bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center bg-no-repeat relative">
      {/* Enhanced Dark Teal Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#042f2e]/95 via-[#022c22]/95 to-[#042f2e]/95 backdrop-blur-sm"></div>
      
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 w-full h-full max-w-6xl mx-auto shadow-2xl bg-[#042f2e] border-x border-teal-900/50 overflow-hidden">
        {/* Scene Container with Transition */}
        <div className="relative w-full h-full">
          {currentScene === Scene.MENU && (
            <div className="absolute inset-0 animate-fade-in">
              <MenuScene 
                changeScene={setCurrentScene} 
                currency={saveData.currency} 
              />
            </div>
          )}

          {currentScene === Scene.LEVEL_SELECT && (
            <div className="absolute inset-0 animate-slide-left">
              <LevelSelectScene 
                changeScene={setCurrentScene} 
                unlockedLevels={saveData.unlockedLevels}
                levelStars={saveData.levelStars}
                onSelectLevel={(lvl) => {
                  setSelectedLevel(lvl);
                  setCurrentScene(Scene.GAME);
                }}
              />
            </div>
          )}

          {currentScene === Scene.SHOP && (
            <div className="absolute inset-0 animate-slide-right">
              <ShopScene 
                changeScene={setCurrentScene}
                saveData={saveData}
                buyItem={handleShopBuy}
                equipItem={handleEquipItem}
              />
            </div>
          )}

          {currentScene === Scene.GAME && (
            <div className="absolute inset-0 animate-fade-in">
              <GameScene 
                levelNum={selectedLevel}
                saveData={saveData}
                onGameOver={handleLevelComplete}
                onExit={() => setCurrentScene(Scene.MENU)}
                onStatsUpdate={handleStatsUpdate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Level Complete Modal */}
      <LevelCompleteModal
        isOpen={modalState.isOpen}
        win={modalState.win}
        score={modalState.score}
        reward={modalState.reward}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default App;
