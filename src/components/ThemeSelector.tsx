import { useState } from 'react';
import { Skin, GameTheme } from '../types';
import { SKINS, THEMES } from '../skins';
import { ShoppingBag, Check, Lock, Star, Coins } from 'lucide-react';

interface ThemeSelectorProps {
  currentSkin: Skin;
  setCurrentSkin: (skin: Skin) => void;
  currentTheme: GameTheme;
  setCurrentTheme: (theme: GameTheme) => void;
  coins: number;
  unlockedSkins: string[];
  onUnlockSkin: (skinId: string, price: number) => void;
}

export default function ThemeSelector({
  currentSkin,
  setCurrentSkin,
  currentTheme,
  setCurrentTheme,
  coins,
  unlockedSkins,
  onUnlockSkin,
}: ThemeSelectorProps) {
  const [activeTab, setActiveTab] = useState<'skins' | 'themes'>('skins');

  const handlePurchase = (skin: Skin) => {
    if (coins >= skin.price) {
      onUnlockSkin(skin.id, skin.price);
    } else {
      alert(`Insufficent coins! You need ${skin.price - coins} more coins to unlock ${skin.name}. Play more games to collect them!`);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans border-2 rounded-xl p-5 bg-white/40 dark:bg-black/20" id="theme-shop-pane" style={{ borderColor: 'currentColor' }}>
      {/* Category selector */}
      <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-dashed border-current pb-4">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('skins')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest rounded transition-all border cursor-pointer ${
              activeTab === 'skins'
                ? 'bg-current font-black'
                : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
            style={activeTab === 'skins' ? { backgroundColor: 'currentColor', color: 'var(--canvas-bg, #f7f7f7)' } : undefined}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Skins
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest rounded transition-all border cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-current font-black'
                : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
            style={activeTab === 'themes' ? { backgroundColor: 'currentColor', color: 'var(--canvas-bg, #f7f7f7)' } : undefined}
          >
            <Star className="w-3.5 h-3.5" /> Themes
          </button>
        </div>

        {/* Currency display */}
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border rounded-full select-none" style={{ borderColor: 'currentColor', backgroundColor: `${currentTheme.textColor}10` }}>
          <Coins className="w-3.5 h-3.5" />
          <span className="text-xs font-bold font-mono">{coins}</span>
          <span className="text-[10px] opacity-80 uppercase font-black tracking-widest">Coins</span>
        </div>
      </div>

      {_renderActiveTab()}
    </div>
  );

  function _renderActiveTab() {
    if (activeTab === 'skins') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="skins-grid">
          {SKINS.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isEquipped = currentSkin.id === skin.id;

            return (
              <div
                key={skin.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isEquipped
                    ? 'ring-2 ring-current ring-offset-2 dark:ring-offset-black bg-current/5'
                    : 'bg-white/20 dark:bg-black/10'
                }`}
                style={{ borderColor: 'currentColor' }}
              >
                {/* Visual Pixel Demo Drawing preview */}
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded border bg-black/5 dark:bg-white/5 flex-shrink-0"
                  style={{ imageRendering: 'pixelated', borderColor: 'currentColor' }}
                >
                  <svg viewBox="0 0 20 18" className="w-9 h-9">
                    {skin.pixels.map((row, rIdx) => {
                      return row.split('').map((char, cIdx) => {
                        if (char === ' ') return null;
                        const fill = char === 'E' 
                          ? (currentTheme.textColor === '#535353' ? '#ffffff' : '#000000') 
                          : (char === 'A' ? currentTheme.accentColor : skin.color);
                        return (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width="1.1"
                            height="1.1"
                            fill={fill}
                          />
                        );
                      });
                    })}
                  </svg>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black uppercase truncate text-inherit tracking-wider">
                      {skin.name}
                    </h4>
                    {isEquipped && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black bg-current text-current-invert uppercase rounded">
                        Wearing
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] opacity-70 truncate mt-1 font-bold uppercase tracking-wider">
                    {skin.description}
                  </p>
                </div>

                {/* Sell/Equip Actions button */}
                <div className="flex-shrink-0">
                  {isEquipped ? (
                    <span className="p-1 px-3.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-current bg-current/10 select-none">
                      <Check className="w-3.5 h-3.5" /> Fitted
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => setCurrentSkin(skin)}
                      className="p-1.5 px-4 rounded text-[10px] font-black bg-current text-white cursor-pointer uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
                      style={{ backgroundColor: 'currentColor', color: currentTheme.canvasBg }}
                    >
                      Wear
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(skin)}
                      className="p-1.5 px-3 border border-current hover:bg-current/10 rounded text-[10px] font-black transition-all uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span className="font-mono font-bold">{skin.price}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" id="themes-grid">
        {THEMES.map((theme) => {
          const isActive = currentTheme.id === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setCurrentTheme(theme)}
              className={`p-4 rounded-lg border-2 text-left flex flex-col justify-between aspect-[1.2/1] transition-all cursor-pointer ${
                isActive
                  ? 'ring-4 ring-offset-2 dark:ring-offset-black'
                  : 'hover:opacity-90'
              }`}
              style={{ 
                backgroundColor: theme.canvasBg, 
                borderColor: theme.textColor,
                boxShadow: isActive ? `0 0 0 2px ${theme.textColor}` : undefined
              }}
            >
              <div className="flex justify-between items-start w-full">
                <span 
                  className="text-[10px] font-black uppercase tracking-widest truncate"
                  style={{ color: theme.textColor }}
                >
                  {theme.name}
                </span>
                {isActive && (
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.textColor }} />
                )}
              </div>

              {/* Minature mock game line view */}
              <div className="w-full h-[2px] transition-all" style={{ backgroundColor: theme.groundColor }} />

              <div className="w-full flex justify-between items-center text-[9px] font-black uppercase tracking-widest mt-2" style={{ color: theme.textColor }}>
                <span>Select</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: theme.obstacleColor }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.coinColor }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }
}
