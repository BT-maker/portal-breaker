import React, { useState, useEffect } from 'react';
import { Scene, SaveData } from './types';
import { DEFAULT_SAVE_DATA } from './constants';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { ShopScene } from './scenes/ShopScene';

const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<Scene>(Scene.MENU);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [saveData, setSaveData] = useState<SaveData>(DEFAULT_SAVE_DATA);

  // Load Save
  useEffect(() => {
    const stored = localStorage.getItem('blockBreakerSave');
    if (stored) {
      try {
        setSaveData({ ...DEFAULT_SAVE_DATA, ...JSON.parse(stored) });
      } catch (e) {
        console.error("Save file corrupted");
      }
    }
  }, []);

  // Persist Save
  useEffect(() => {
    localStorage.setItem('blockBreakerSave', JSON.stringify(saveData));
  }, [saveData]);

  const handleLevelComplete = (score: number, win: boolean) => {
    if (win) {
      // Calculate Reward: Fixed 100 Gold per level request
      const reward = 100;

      setSaveData(prev => {
        const newUnlocked = Math.max(prev.unlockedLevels, selectedLevel + 1);
        const currentStars = prev.levelStars[selectedLevel] || 0;
        // Simple star logic: 1 star for win
        const newStars = Math.max(currentStars, 1); 
        
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
      alert(`TEBRİKLER! Seviye Tamamlandı.\nKazanılan Para: ${reward}`);
      setCurrentScene(Scene.LEVEL_SELECT);
    } else {
      alert(`OYUN BİTTİ! Skor: ${score}`);
      setCurrentScene(Scene.LEVEL_SELECT);
    }
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
    <div className="w-full h-screen bg-teal-950 text-white overflow-hidden bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center bg-no-repeat">
      {/* Dark Teal Overlay */}
      <div className="absolute inset-0 bg-[#042f2e]/95 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full h-full max-w-6xl mx-auto shadow-2xl bg-[#042f2e] border-x border-teal-900/50">
        
        {currentScene === Scene.MENU && (
          <MenuScene 
            changeScene={setCurrentScene} 
            currency={saveData.currency} 
          />
        )}

        {currentScene === Scene.LEVEL_SELECT && (
          <LevelSelectScene 
            changeScene={setCurrentScene} 
            unlockedLevels={saveData.unlockedLevels}
            levelStars={saveData.levelStars}
            onSelectLevel={(lvl) => {
              setSelectedLevel(lvl);
              setCurrentScene(Scene.GAME);
            }}
          />
        )}

        {currentScene === Scene.SHOP && (
          <ShopScene 
            changeScene={setCurrentScene}
            saveData={saveData}
            buyItem={handleShopBuy}
            equipItem={handleEquipItem}
          />
        )}

        {currentScene === Scene.GAME && (
          <GameScene 
            levelNum={selectedLevel}
            saveData={saveData}
            onGameOver={handleLevelComplete}
            onExit={() => setCurrentScene(Scene.MENU)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
