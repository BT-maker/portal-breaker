import React, { useState, useEffect } from 'react';
import { Scene, SaveData, ShopItem } from '../types';
import { Button } from '../components/Button';
import { SHOP_ITEMS, PADDLE_IMAGES, BALL_IMAGES } from '../constants';

interface ShopSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
  buyItem: (itemId: string, cost: number) => void;
  equipItem: (type: 'paddle' | 'ball', skinId: string) => void;
}

export const ShopScene: React.FC<ShopSceneProps> = ({ changeScene, saveData, buyItem, equipItem }) => {
  
  const isOwned = (id: string) => {
    return saveData.inventory.paddleSkins.includes(id) || 
           saveData.inventory.ballSkins.includes(id) ||
           (id.startsWith('upgrade') && checkUpgradeLevel(id)); 
  };

  const checkUpgradeLevel = (id: string) => {
    if (id === 'upgrade_width_1') return saveData.inventory.upgrades.paddleWidth >= 1;
    if (id === 'upgrade_width_2') return saveData.inventory.upgrades.paddleWidth >= 2;
    if (id === 'upgrade_width_3') return saveData.inventory.upgrades.paddleWidth >= 3;
    if (id === 'upgrade_speed_1') return saveData.inventory.upgrades.ballSpeed >= 1;
    return false;
  };

  const isEquipped = (id: string) => {
    return saveData.equipped.paddleSkin === id || saveData.equipped.ballSkin === id;
  };

  const isLocked = (item: ShopItem) => {
    if (item.id === 'upgrade_width_2' && saveData.inventory.upgrades.paddleWidth < 1) return true;
    if (item.id === 'upgrade_width_3' && saveData.inventory.upgrades.paddleWidth < 2) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8 animate-fade-in bg-gradient-to-b from-[#022c22] to-[#042f2e]">
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-8 z-20 relative">
        <Button onClick={() => changeScene(Scene.MENU)} variant="secondary" size="sm" className="shadow-emerald-900/50">
          <span className="mr-2">←</span> GERİ
        </Button>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <h2 className="text-3xl font-display font-black italic text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-100 to-teal-200 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              MAĞAZA
            </h2>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full mt-1"></div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-900/90 to-teal-950/90 px-6 py-3 rounded-2xl border border-teal-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.15)] flex items-center gap-3 transform hover:scale-105 transition-transform duration-300">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <span className="text-yellow-400 text-xl filter drop-shadow-md">⛃</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-teal-300 font-bold tracking-wider uppercase">Bakiye</span>
              <span className="text-xl font-mono font-bold text-white tracking-wide leading-none">{saveData.currency.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-2 custom-scrollbar pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SHOP_ITEMS.map((item) => (
            <ShopCard 
              key={item.id} 
              item={item} 
              owned={isOwned(item.id)} 
              equipped={isEquipped(item.id)}
              locked={isLocked(item)}
              canAfford={saveData.currency >= item.price}
              onBuy={() => buyItem(item.id, item.price)}
              onEquip={() => equipItem(item.type === 'SKIN_PADDLE' ? 'paddle' : 'ball', item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ShopCardProps { 
  item: ShopItem; 
  owned: boolean; 
  equipped: boolean; 
  locked: boolean; 
  canAfford: boolean; 
  onBuy: () => void; 
  onEquip: () => void; 
}

// Internal Component for the Card
const ShopCard: React.FC<ShopCardProps> = ({ 
  item, owned, equipped, locked, canAfford, onBuy, onEquip 
}) => {
  const [animating, setAnimating] = useState(false);
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);

  const handleAction = () => {
    if (!owned && canAfford && !locked) {
      setAnimating(true);
      onBuy();
      setTimeout(() => setAnimating(false), 600);
    } else if (owned && !equipped) {
      onEquip();
    }
  };

  const isSkin = item.type.includes('SKIN');
  const isPaddle = item.type === 'SKIN_PADDLE';
  
  // Load preview image for skins
  useEffect(() => {
    if (!isSkin) {
      setPreviewImage(null);
      return;
    }

    const getImagePath = () => {
      if (item.id.startsWith('skin_paddle_')) {
        const key = item.id.replace('skin_paddle_', '');
        return PADDLE_IMAGES[key] || null;
      } else if (item.id.startsWith('skin_ball_')) {
        const key = item.id.replace('skin_ball_', '');
        return BALL_IMAGES[key] || null;
      }
      return null;
    };

    const imagePath = getImagePath();
    if (!imagePath) {
      setPreviewImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setPreviewImage(img);
    };
    img.onerror = () => {
      setPreviewImage(null);
    };
    img.src = imagePath;
  }, [item.id, isSkin]);
  
  // Dynamic border/bg colors based on state
  let borderColor = "border-teal-800/50";
  let bgGradient = "from-slate-900/90 to-teal-950/90";
  let glow = "";

  if (equipped) {
    borderColor = "border-emerald-400";
    bgGradient = "from-emerald-900/60 to-teal-900/60";
    glow = "shadow-[0_0_20px_rgba(52,211,153,0.3)]";
  } else if (owned) {
    borderColor = "border-teal-600/50";
    bgGradient = "from-teal-900/40 to-slate-900/80";
  } else if (locked) {
    borderColor = "border-red-900/30";
    bgGradient = "from-gray-900/90 to-gray-950/90";
  }

  return (
    <div className={`
      relative rounded-2xl border-2 p-1 flex flex-col group transition-all duration-300 overflow-hidden
      ${borderColor} ${bgGradient} ${glow}
      ${!locked ? 'hover:-translate-y-1 hover:shadow-xl' : 'opacity-75 grayscale-[0.5]'}
    `}>
      {/* Animation Flash Overlay */}
      {animating && <div className="absolute inset-0 bg-white/20 z-50 animate-pulse rounded-xl pointer-events-none" />}

      <div className="bg-[#031512]/50 rounded-xl p-5 h-full flex flex-col relative z-10 backdrop-blur-sm">
        
        {/* Header: Type Badge & Name */}
        <div className="flex justify-between items-start mb-3">
          <div className={`
            px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border
            ${isSkin 
              ? (isPaddle ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30') 
              : 'bg-orange-500/20 text-orange-300 border-orange-500/30'}
          `}>
            {isSkin ? (isPaddle ? 'Paddle Skin' : 'Ball Skin') : 'Yükseltme'}
          </div>
          {equipped && (
             <div className="bg-emerald-500 text-emerald-950 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
               <span className="animate-pulse">●</span> KUŞANDI
             </div>
          )}
        </div>

        <h3 className="text-xl font-display font-bold text-white mb-2 leading-tight drop-shadow-sm group-hover:text-teal-200 transition-colors">
          {item.name}
        </h3>

        <p className="text-teal-100/60 text-sm leading-relaxed mb-6 font-light">
          {item.description}
        </p>

        {/* Visual Preview - Use image if available, fallback to color */}
        {isSkin && (
            <div className="mb-6 flex items-center justify-center p-4 bg-black/20 rounded-lg inner-shadow group-hover:bg-black/30 transition-colors min-h-[80px]">
              {previewImage && previewImage.complete ? (
                // Show actual image
                <div className="flex items-center justify-center">
                  {isPaddle ? (
                    <img 
                      src={previewImage.src} 
                      alt={item.name}
                      className="h-12 w-auto max-w-[200px] object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
                      style={{ filter: locked ? 'grayscale(0.5) brightness(0.5)' : 'none' }}
                    />
                  ) : (
                    <img 
                      src={previewImage.src} 
                      alt={item.name}
                      className="h-16 w-16 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
                      style={{ filter: locked ? 'grayscale(0.5) brightness(0.5)' : 'none' }}
                    />
                  )}
                </div>
              ) : item.value && typeof item.value === 'string' && item.value.startsWith('#') ? (
                // Fallback to color preview
                isPaddle ? (
                  <div className="w-24 h-4 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110" style={{backgroundColor: item.value, boxShadow: `0 0 15px ${item.value}60`}}></div>
                ) : (
                  <div className="w-8 h-8 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110" style={{backgroundColor: item.value, boxShadow: `0 0 15px ${item.value}60`}}></div>
                )
              ) : null}
            </div>
        )}

        {/* Footer: Price & Action */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              {owned ? (
                  <span className="text-xs text-teal-400/70 font-bold uppercase tracking-wide">Sahip Olundu</span>
              ) : (
                  <>
                  <span className="text-[10px] text-teal-500/70 font-bold uppercase tracking-wide">Ücret</span>
                  <div className={`text-xl font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                    {item.price} <span className="text-sm">⛃</span>
                  </div>
                  </>
              )}
            </div>

            <Button
              onClick={handleAction}
              disabled={locked || ( !owned && !canAfford )}
              variant={owned ? (equipped ? "secondary" : "primary") : (canAfford ? "primary" : "secondary")}
              className={`
                 min-w-[100px] shadow-lg
                 ${equipped ? 'opacity-50 cursor-default' : ''}
                 ${locked ? 'opacity-40 cursor-not-allowed' : ''}
                 ${(!owned && !canAfford) ? 'opacity-50 cursor-not-allowed saturate-0' : ''}
              `}
              size="sm"
            >
              {locked 
                ? 'KİLİTLİ' 
                : (owned 
                    ? (equipped ? 'AKTİF' : 'KUŞAN') 
                    : (animating ? '...' : 'SATIN AL')
                  )
              }
            </Button>
        </div>
      </div>
    </div>
  );
};