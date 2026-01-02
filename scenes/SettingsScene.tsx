import React, { useState } from 'react';
import { Scene, SaveData } from '../types';
import { Button } from '../components/Button';

interface SettingsSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
  updateSettings: (settings: Partial<SaveData['settings'] & { fullscreen: boolean; playerName: string }>) => void;
}

export const SettingsScene: React.FC<SettingsSceneProps> = ({ changeScene, saveData, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState({
    musicVolume: saveData.settings.musicVolume,
    sfxVolume: saveData.settings.sfxVolume,
    fullscreen: saveData.fullscreen || false,
    playerName: saveData.playerName || 'Oyuncu',
  });

  const handleSave = () => {
    updateSettings(localSettings);
    changeScene(Scene.MENU);
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8 animate-fade-in bg-gradient-to-b from-[#022c22] to-[#042f2e] relative overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-6 md:mb-8 z-20 relative">
        <Button 
          onClick={() => changeScene(Scene.MENU)} 
          variant="secondary" 
          size="sm"
          className="hover-lift ripple"
        >
          <span className="mr-2">←</span> GERİ
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-300 to-teal-200 drop-shadow-lg">
            AYARLAR
          </h2>
        </div>
        
        <div className="w-20 md:w-24"></div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Player Name */}
          <div className="glass rounded-xl p-5 border-2 border-teal-500/40">
            <label className="block text-teal-200 font-bold mb-2">Oyuncu Adı</label>
            <input
              type="text"
              value={localSettings.playerName}
              onChange={(e) => setLocalSettings({ ...localSettings, playerName: e.target.value })}
              className="w-full px-4 py-2 bg-teal-900/50 border border-teal-600 rounded-lg text-white focus:outline-none focus:border-teal-400"
              maxLength={20}
            />
          </div>

          {/* Music Volume */}
          <div className="glass rounded-xl p-5 border-2 border-teal-500/40">
            <label className="block text-teal-200 font-bold mb-2">
              Müzik Ses Seviyesi: {Math.round(localSettings.musicVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localSettings.musicVolume}
              onChange={(e) => setLocalSettings({ ...localSettings, musicVolume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* SFX Volume */}
          <div className="glass rounded-xl p-5 border-2 border-teal-500/40">
            <label className="block text-teal-200 font-bold mb-2">
              Ses Efekti Seviyesi: {Math.round(localSettings.sfxVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localSettings.sfxVolume}
              onChange={(e) => setLocalSettings({ ...localSettings, sfxVolume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Fullscreen */}
          <div className="glass rounded-xl p-5 border-2 border-teal-500/40">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.fullscreen}
                onChange={(e) => setLocalSettings({ ...localSettings, fullscreen: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-teal-200 font-bold">Tam Ekran</span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              size="lg"
              className="min-w-[200px]"
            >
              KAYDET
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

