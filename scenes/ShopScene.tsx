import React, { useState, useEffect } from 'react';
import { Scene, SaveData, ShopItem } from '../types';
import { Button } from '../components/Button';
import { SHOP_ITEMS, PADDLE_IMAGES, BALL_IMAGES } from '../constants';

interface ShopSceneProps {
  changeScene: (scene: Scene) => void;
  saveData: SaveData;
  buyItem: (itemId: string, cost: number) => void;
  equipItem: (type: 'paddle' | 'ball' | 'weapon', skinId: string) => void;
}

export const ShopScene: React.FC<ShopSceneProps> = ({ changeScene, saveData, buyItem, equipItem }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'paddle' | 'ball' | 'weapon' | 'upgrade'>('all');
  
  const isOwned = (id: string) => {
    return saveData.inventory.paddleSkins.includes(id) || 
           saveData.inventory.ballSkins.includes(id) ||
           (saveData.inventory.weaponSkins && saveData.inventory.weaponSkins.includes(id)) ||
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
    return saveData.equipped.paddleSkin === id || saveData.equipped.ballSkin === id || (saveData.equipped.weaponSkin && saveData.equipped.weaponSkin === id);
  };

  const isLocked = (item: ShopItem) => {
    if (item.id === 'upgrade_width_2' && saveData.inventory.upgrades.paddleWidth < 1) return true;
    if (item.id === 'upgrade_width_3' && saveData.inventory.upgrades.paddleWidth < 2) return true;
    return false;
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return SHOP_ITEMS;
    if (selectedCategory === 'paddle') return SHOP_ITEMS.filter(item => item.type === 'SKIN_PADDLE');
    if (selectedCategory === 'ball') return SHOP_ITEMS.filter(item => item.type === 'SKIN_BALL');
    if (selectedCategory === 'weapon') return SHOP_ITEMS.filter(item => item.type === 'SKIN_WEAPON');
    if (selectedCategory === 'upgrade') return SHOP_ITEMS.filter(item => item.type === 'UPGRADE_WIDTH' || item.type === 'UPGRADE_SPEED');
    return SHOP_ITEMS;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="flex flex-col h-full p-6 md:p-8 animate-fade-in relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Header */}
      <div className="flex-none flex items-center justify-between mb-6 md:mb-8 z-20 relative animate-slide-down">
        <Button 
          onClick={() => changeScene(Scene.MENU)} 
          variant="secondary" 
          size="sm" 
          className="shadow-emerald-900/50 hover-lift ripple"
        >
          <span className="mr-2">←</span> GERİ
        </Button>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-center md:text-right">
            <h2 className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-100 to-teal-200 filter drop-shadow-lg animate-gradient">
              MAĞAZA
            </h2>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full mt-1 animate-pulse"></div>
          </div>
          
          <div className="glass-strong px-5 md:px-6 py-3 rounded-2xl shadow-[0_8px_32px_rgba(20,184,166,0.3)] flex items-center gap-3 hover-lift group">
            <div className="bg-yellow-500/20 p-2 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
              <span className="text-yellow-400 text-xl md:text-2xl filter drop-shadow-lg group-hover:scale-110 transition-transform">⛃</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs text-teal-300 font-bold tracking-wider uppercase">Bakiye</span>
              <span className="text-lg md:text-xl font-mono font-bold text-white tracking-wide leading-none group-hover:text-yellow-300 transition-colors">
                {saveData.currency.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Menu */}
      <div className="flex-none mb-6 z-20 relative">
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/50 scale-105'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50 hover:scale-105'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setSelectedCategory('paddle')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${
              selectedCategory === 'paddle'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/50 scale-105'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50 hover:scale-105'
            }`}
          >
            Paddle Skins
          </button>
          <button
            onClick={() => setSelectedCategory('ball')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${
              selectedCategory === 'ball'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/50 scale-105'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50 hover:scale-105'
            }`}
          >
            Ball Skins
          </button>
          <button
            onClick={() => setSelectedCategory('weapon')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${
              selectedCategory === 'weapon'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/50 scale-105'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50 hover:scale-105'
            }`}
          >
            Silah Skins
          </button>
          <button
            onClick={() => setSelectedCategory('upgrade')}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${
              selectedCategory === 'upgrade'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/50 scale-105'
                : 'bg-teal-900/50 text-teal-200 hover:bg-teal-800/50 hover:scale-105'
            }`}
          >
            Upgrades
          </button>
        </div>
      </div>

      {/* Enhanced Content Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-2 custom-scrollbar pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ShopCard 
                item={item} 
                owned={isOwned(item.id)} 
                equipped={isEquipped(item.id)}
                locked={isLocked(item)}
                canAfford={saveData.currency >= item.price}
                onBuy={() => buyItem(item.id, item.price)}
                onEquip={() => equipItem(
                  item.type === 'SKIN_PADDLE' ? 'paddle' : 
                  item.type === 'SKIN_BALL' ? 'ball' : 
                  item.type === 'SKIN_WEAPON' ? 'weapon' : 'paddle', 
                  item.id
                )}
              />
            </div>
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
  const isWeapon = item.type === 'SKIN_WEAPON';
  
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
      } else if (item.id.startsWith('skin_weapon_')) {
        // Weapon skins don't have images, use color preview
        return null;
      }
      return null;
    };

    const imagePath = getImagePath();
    if (!imagePath) {
      // For weapon skins, we don't have images, use color preview
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
      relative rounded-2xl border-2 p-1 flex flex-col group transition-all duration-300 overflow-hidden hover-lift
      ${borderColor} bg-gradient-to-br ${bgGradient} ${glow}
      ${!locked ? 'hover:-translate-y-2 hover:shadow-2xl' : 'opacity-75 grayscale-[0.5]'}
    `}>
      {/* Enhanced Animation Flash Overlay */}
      {animating && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/20 to-white/30 z-50 animate-pulse rounded-xl pointer-events-none" />
      )}

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

      <div className="glass rounded-xl p-5 h-full flex flex-col relative z-10">
        
        {/* Enhanced Header: Type Badge & Name */}
        <div className="flex justify-between items-start mb-3">
          <div className={`
            px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm
            ${isSkin 
              ? (isPaddle ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50 shadow-indigo-500/20' : 'bg-purple-500/30 text-purple-200 border-purple-400/50 shadow-purple-500/20') 
              : 'bg-orange-500/30 text-orange-200 border-orange-400/50 shadow-orange-500/20'}
            shadow-lg
          `}>
            {isSkin ? (isPaddle ? 'Paddle Skin' : 'Ball Skin') : 'Yükseltme'}
          </div>
          {equipped && (
             <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/40 animate-pulse-glow">
               <span className="animate-pulse">●</span> KUŞANDI
             </div>
          )}
        </div>

        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-2 leading-tight drop-shadow-lg group-hover:text-teal-200 transition-colors group-hover:scale-105 transform duration-300">
          {item.name}
        </h3>

        <p className="text-teal-100/70 text-sm leading-relaxed mb-6 font-light">
          {item.description}
        </p>

        {/* Enhanced Visual Preview - Use image if available, fallback to color */}
        {isSkin && (
            <div className="mb-6 flex items-center justify-center p-4 bg-black/30 rounded-xl border border-teal-800/30 group-hover:bg-black/40 group-hover:border-teal-600/50 transition-all duration-300 min-h-[80px] relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-emerald-500/0 to-teal-500/0 group-hover:from-teal-500/10 group-hover:via-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-500 blur-xl"></div>
              
              {previewImage && previewImage.complete ? (
                // Show actual image with enhanced effects
                <div className="flex items-center justify-center relative z-10">
                  {isPaddle ? (
                    <img 
                      src={previewImage.src} 
                      alt={item.name}
                      className="h-20 md:h-24 w-auto max-w-[300px] object-contain transition-all duration-500 group-hover:scale-125 group-hover:rotate-3 drop-shadow-2xl"
                      style={{ 
                        filter: locked ? 'grayscale(0.5) brightness(0.5)' : 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.5))',
                      }}
                    />
                  ) : (
                    <div className="relative">
                      <img 
                        src={previewImage.src} 
                        alt={item.name}
                        className="h-16 md:h-20 w-16 md:w-20 object-contain transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-2xl"
                        style={{ 
                          filter: locked ? 'grayscale(0.5) brightness(0.5)' : 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.5))',
                        }}
                      />
                      {/* Glow ring around ball */}
                      {!locked && (
                        <div className="absolute inset-0 rounded-full bg-teal-400/20 blur-xl group-hover:bg-teal-400/40 transition-all animate-pulse"></div>
                      )}
                    </div>
                  )}
                </div>
              ) : (item.value && typeof item.value === 'string' && item.value.startsWith('#')) || isWeapon ? (
                // Enhanced fallback to color preview
                isPaddle ? (
                  <div 
                    className="w-24 md:w-32 h-4 md:h-5 rounded-full shadow-2xl transition-all duration-500 group-hover:scale-125 group-hover:shadow-[0_0_30px_currentColor] relative z-10" 
                    style={{
                      backgroundColor: item.value, 
                      boxShadow: `0 0 20px ${item.value}80, 0 0 40px ${item.value}40`,
                    }}
                  ></div>
                ) : isWeapon ? (
                  // Weapon preview - gun shape
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="relative">
                      {/* Get weapon color */}
                      {(() => {
                        const weaponColor = item.id.includes('fire') ? '#f97316' :
                                          item.id.includes('plasma') ? '#a855f7' :
                                          item.id.includes('ice') ? '#06b6d4' :
                                          item.id.includes('toxic') ? '#84cc16' :
                                          item.id.includes('ghost') ? '#94a3b8' :
                                          item.id.includes('cristal') ? '#e0e0e0' :
                                          item.id.includes('skull') ? '#1a1a1a' : '#fbbf24';
                        return (
                          <>
                            {/* Gun body */}
                            <div 
                              className="w-24 md:w-32 h-6 md:h-8 rounded-lg shadow-2xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-3 relative"
                              style={{
                                backgroundColor: weaponColor,
                                boxShadow: `0 0 25px ${weaponColor}80, 0 0 50px ${weaponColor}40`,
                              }}
                            >
                              {/* Gun barrel */}
                              <div 
                                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: weaponColor,
                                  boxShadow: `0 0 10px ${weaponColor}80`,
                                }}
                              ></div>
                              {/* Gun grip */}
                              <div 
                                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 rounded-sm"
                                style={{
                                  backgroundColor: weaponColor,
                                  opacity: 0.7,
                                }}
                              ></div>
                            </div>
                            {/* Glow effect */}
                            {!locked && (
                              <div 
                                className="absolute inset-0 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-all"
                                style={{
                                  backgroundColor: weaponColor,
                                }}
                              ></div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10">
                    <div 
                      className="w-12 md:w-16 h-12 md:h-16 rounded-full shadow-2xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12" 
                      style={{
                        backgroundColor: item.value, 
                        boxShadow: `0 0 25px ${item.value}80, 0 0 50px ${item.value}40`,
                      }}
                    ></div>
                    {!locked && (
                      <div 
                        className="absolute inset-0 rounded-full blur-xl animate-pulse" 
                        style={{ backgroundColor: item.value, opacity: 0.3 }}
                      ></div>
                    )}
                  </div>
                )
              ) : null}
            </div>
        )}

        {/* Enhanced Footer: Price & Action */}
        <div className="mt-auto pt-4 border-t border-teal-800/30 flex items-center justify-between">
            <div className="flex flex-col">
              {owned ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wide">✓ Sahip Olundu</span>
                  </div>
              ) : (
                  <>
                  <span className="text-[10px] text-teal-500/70 font-bold uppercase tracking-wide mb-1">Ücret</span>
                  <div className={`text-xl md:text-2xl font-mono font-bold flex items-center gap-1 ${
                    canAfford 
                      ? 'text-yellow-400 drop-shadow-lg' 
                      : 'text-red-400'
                  }`}>
                    <span className={canAfford ? 'animate-pulse' : ''}>{item.price}</span>
                    <span className="text-sm md:text-base">⛃</span>
                  </div>
                  </>
              )}
            </div>

            <Button
              onClick={handleAction}
              disabled={locked || ( !owned && !canAfford )}
              variant={owned ? (equipped ? "secondary" : "primary") : (canAfford ? "primary" : "secondary")}
              className={`
                 min-w-[100px] md:min-w-[120px] shadow-lg ripple
                 ${equipped ? 'opacity-50 cursor-default' : ''}
                 ${locked ? 'opacity-40 cursor-not-allowed' : ''}
                 ${(!owned && !canAfford) ? 'opacity-50 cursor-not-allowed saturate-0' : ''}
              `}
              size="sm"
            >
              {locked 
                ? '🔒 KİLİTLİ' 
                : (owned 
                    ? (equipped ? '✓ AKTİF' : '⚡ KUŞAN') 
                    : (animating ? '⏳' : '💰 SATIN AL')
                  )
              }
            </Button>
        </div>
      </div>
    </div>
  );
};