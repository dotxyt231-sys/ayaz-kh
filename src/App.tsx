import { useState, useEffect } from 'react';
import DinoGame from './components/DinoGame';
import ThemeSelector from './components/ThemeSelector';
import StatsPanel from './components/StatsPanel';
import HowToPlay from './components/HowToPlay';
import { GameMode, GameTheme, Skin, GameStats } from './types';
import { SKINS, THEMES } from './skins';
import { toggleMute, isMuted as checkIsMuted } from './audio';
import { Award, Sparkles, Volume2, VolumeX, Shield, Play } from 'lucide-react';

export default function App() {
  // Persistence state
  const [coins, setCoins] = useState<number>(0);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['classic']);
  const [currentSkin, setCurrentSkin] = useState<Skin>(SKINS[0]);
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(THEMES[0]);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalGames: 0,
    totalDistance: 0,
    totalCoins: 0,
    jumpsCount: 0,
    deathsCount: 0
  });

  // Load persistence configurations from localStorage
  useEffect(() => {
    // Coins
    const savedCoins = localStorage.getItem('dino_runner_coins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    }

    // Unlocked skins
    const savedSkins = localStorage.getItem('dino_runner_unlocked_skins');
    if (savedSkins) {
      try {
        setUnlockedSkins(JSON.parse(savedSkins));
      } catch (err) {
        console.error('Error parsing unlocked skins:', err);
      }
    }

    // Equipped skin
    const savedEquippedSkin = localStorage.getItem('dino_runner_equipped_skin');
    if (savedEquippedSkin) {
      const found = SKINS.find(s => s.id === savedEquippedSkin);
      if (found) setCurrentSkin(found);
    }

    // Equipped theme
    const savedEquippedTheme = localStorage.getItem('dino_runner_equipped_theme');
    if (savedEquippedTheme) {
      const found = THEMES.find(t => t.id === savedEquippedTheme);
      if (found) setCurrentTheme(found);
    }

    // High Score and overall Stats
    const savedStats = localStorage.getItem('dino_runner_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (err) {
        console.error('Failed to parse logs:', err);
      }
    } else {
      // Legacy compatibility check for high score
      const legacyHighScore = localStorage.getItem('dino_runner_highscore');
      if (legacyHighScore) {
        setStats(prev => ({
          ...prev,
          highScore: parseInt(legacyHighScore, 10)
        }));
      }
    }

    // Muted status
    setIsMuted(checkIsMuted());
  }, []);

  // Update equipped skin/theme in LocalStorage
  const handleSetSkin = (skin: Skin) => {
    setCurrentSkin(skin);
    localStorage.setItem('dino_runner_equipped_skin', skin.id);
  };

  const handleSetTheme = (theme: GameTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('dino_runner_equipped_theme', theme.id);
  };

  // Sync statistics & game over summaries
  const handleCoinsEarned = (earnedThisRun: number) => {
    const updatedCoins = coins + earnedThisRun;
    setCoins(updatedCoins);
    localStorage.setItem('dino_runner_coins', updatedCoins.toString());

    // Sync stats records
    setStats(prev => {
      const uStats = {
        ...prev,
        totalCoins: prev.totalCoins + earnedThisRun,
      };
      localStorage.setItem('dino_runner_stats', JSON.stringify(uStats));
      return uStats;
    });
  };

  const handleGameOver = (finalScore: number) => {
    setStats(prev => {
      const best = Math.max(prev.highScore, finalScore);
      const uStats = {
        ...prev,
        highScore: best,
        totalGames: prev.totalGames + 1,
        totalDistance: prev.totalDistance + finalScore,
        deathsCount: prev.deathsCount + 1,
      };
      localStorage.setItem('dino_runner_stats', JSON.stringify(uStats));
      localStorage.setItem('dino_runner_highscore', best.toString());
      return uStats;
    });
  };

  // Safe skin unlock handler
  const handleUnlockSkin = (skinId: string, price: number) => {
    if (coins >= price && !unlockedSkins.includes(skinId)) {
      const remCoins = coins - price;
      const nextUnlocked = [...unlockedSkins, skinId];
      
      setCoins(remCoins);
      setUnlockedSkins(nextUnlocked);

      localStorage.setItem('dino_runner_coins', remCoins.toString());
      localStorage.setItem('dino_runner_unlocked_skins', JSON.stringify(nextUnlocked));
    }
  };

  // Reset statistical trackers
  const handleResetStats = () => {
    if (window.confirm('Are you absolutely sure you want to clear your high scores and statistics? Your skin purchases will remain safe.')) {
      const cleared = {
        highScore: 0,
        totalGames: 0,
        totalDistance: 0,
        totalCoins: 0,
        jumpsCount: 0,
        deathsCount: 0
      };
      setStats(cleared);
      localStorage.setItem('dino_runner_stats', JSON.stringify(cleared));
      localStorage.setItem('dino_runner_highscore', '0');
    }
  };

  const handleToggleMute = () => {
    const nextMute = toggleMute();
    setIsMuted(nextMute);
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-start p-3 sm:p-6 transition-all duration-500 ease-out md:p-8 ${currentTheme.background}`}
      id="app-root-container"
    >
      {/* Visual background grid pattern for dynamic themes */}
      {currentTheme.id === 'cyberpunk' && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
      )}

      {/* Main Container Dashboard */}
      <div className="w-full max-w-4xl flex flex-col gap-6 z-10" id="main-dashboard-wrap">
        
        {/* Navigation / Brand Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between w-full pb-4 border-b-2" style={{ borderColor: currentTheme.textColor }} id="dino-header-section">
          <div className="flex items-center gap-3">
            {/* Ambient Logo animation */}
            <div 
              className="w-10 h-10 flex items-center justify-center border-2 shadow-sm rounded-md"
              style={{ borderColor: currentTheme.textColor, backgroundColor: currentTheme.canvasBg }}
            >
              <svg viewBox="0 0 20 18" className="w-7 h-7">
                {currentSkin.pixels.map((row, rIdx) => {
                  return row.split('').map((char, cIdx) => {
                    if (char === ' ') return null;
                    const fill = char === 'E' 
                      ? (currentTheme.textColor === '#535353' ? '#ffffff' : '#000000') 
                      : (char === 'A' ? currentTheme.accentColor : currentSkin.color);
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
            
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-widest uppercase transition-colors" style={{ color: currentTheme.textColor }}>
                DINO DASH
              </h1>
              <span className="text-[9px] tracking-[0.2em] font-bold uppercase opacity-60">
                Retro Edition
              </span>
            </div>
          </div>

          {/* Minimalist Navigation Links Row from Graphic Mockup */}
          <nav className="flex space-x-6 sm:space-x-8 text-[11px] font-bold uppercase tracking-[0.15em] opacity-70 my-3 sm:my-0">
            <a href="#stats-section" className="hover:opacity-100 transition-opacity">Stats</a>
            <a href="#shop-section" className="hover:opacity-100 transition-opacity">Skins Store</a>
            <a href="#mechanics-section" className="hover:opacity-100 transition-opacity">Settings</a>
          </nav>

          {/* Quick HUD values */}
          <div className="flex gap-4 items-center">
            {/* Highest best value banner */}
            <div className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold rounded" style={{ backgroundColor: `${currentTheme.textColor}10`, color: currentTheme.textColor, border: `1px solid ${currentTheme.textColor}25` }}>
              <Award className="w-3.5 h-3.5" style={{ color: currentTheme.accentColor }} />
              <span>HI: {stats.highScore.toString().padStart(5, '0')}</span>
            </div>

            {/* Muted switcher buttons */}
            <button
              onClick={handleToggleMute}
              className="p-1.5 border hover:opacity-85 rounded transition-all active:scale-95 cursor-pointer"
              style={{ borderColor: `${currentTheme.textColor}40`, color: currentTheme.textColor }}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </header>

        {/* Primary Interactive Arcade Game Panel */}
        <main 
          className="w-full border-2 rounded-xl overflow-hidden transition-all duration-300 shadow-sm relative"
          style={{ borderColor: currentTheme.textColor, backgroundColor: currentTheme.canvasBg }}
        >
          <DinoGame 
            selectedSkin={currentSkin}
            selectedTheme={currentTheme}
            gameMode={gameMode}
            onCoinsEarned={handleCoinsEarned}
            onGameOver={handleGameOver}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </main>

        {/* Modular Game Statistics Board */}
        <section id="stats-section">
          <StatsPanel 
            stats={stats} 
            onResetStats={handleResetStats} 
            gameMode={gameMode}
            setGameMode={setGameMode}
          />
        </section>

        {/* Multi-Tab Store & Themes Shop */}
        <section id="shop-section">
          <ThemeSelector 
            currentSkin={currentSkin}
            setCurrentSkin={handleSetSkin}
            currentTheme={currentTheme}
            setCurrentTheme={handleSetTheme}
            coins={coins}
            unlockedSkins={unlockedSkins}
            onUnlockSkin={handleUnlockSkin}
          />
        </section>

        {/* Quick Instructions & Helps Guide panel */}
        <section id="mechanics-section">
          <HowToPlay />
        </section>

        {/* Humble retro signature credit */}
        <footer className="text-center font-sans text-[10px] opacity-40 font-semibold tracking-widest uppercase mt-4 mb-2">
          © {new Date().getFullYear()} Chrome Dino Runner • Built with React & Tailwind
        </footer>

      </div>
    </div>
  );
}
