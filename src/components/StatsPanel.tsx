import { GameStats } from '../types';
import { Award, ShieldAlert, Footprints, Coins, RefreshCw, Zap } from 'lucide-react';

interface StatsPanelProps {
  stats: GameStats;
  onResetStats: () => void;
  gameMode: string;
  setGameMode: (mode: any) => void;
}

export default function StatsPanel({ stats, onResetStats, gameMode, setGameMode }: StatsPanelProps) {
  const cards = [
    {
      title: 'High Score',
      value: stats.highScore.toString().padStart(5, '0'),
      icon: <Award className="w-4 h-4 opacity-75" />,
      desc: 'All-time best'
    },
    {
      title: 'Total Sprints',
      value: stats.totalGames,
      icon: <Zap className="w-4 h-4 opacity-75" />,
      desc: 'Runs started'
    },
    {
      title: 'Coins Banked',
      value: stats.totalCoins,
      icon: <Coins className="w-4 h-4 opacity-75" />,
      desc: 'Current cash'
    },
    {
      title: 'Jog Distance',
      value: `${Math.round(stats.totalDistance)}m`,
      icon: <Footprints className="w-4 h-4 opacity-75" />,
      desc: 'Sprinted mileage'
    },
  ];

  return (
    <div className="w-full flex flex-col font-sans border-2 rounded-xl p-5 transition-all duration-300 bg-white/40 dark:bg-black/20" id="game-stats-pane" style={{ borderColor: 'currentColor' }}>
      {/* Set game mode control links */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-dashed border-current">
        <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1">
          Mechanism Configs:
        </span>
        
        <div className="flex gap-1.5 flex-wrap">
          {(['classic', 'shield', 'gravity', 'hardcore'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGameMode(mode)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer rounded ${
                gameMode === mode
                  ? 'bg-current text-current-invert font-black shadow-sm'
                  : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
              }`}
              style={mode === gameMode ? { backgroundColor: 'currentColor', color: 'var(--canvas-bg, #f7f7f7)' } : undefined}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5" id="stats-dashboard-grid">
        {cards.map((c, i) => (
          <div key={i} className="p-4 border rounded-lg bg-white/20 dark:bg-black/10 flex flex-col justify-between transition-all" style={{ borderColor: 'currentColor' }}>
            <div className="flex justify-between items-start gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate">
                {c.title}
              </span>
              {c.icon}
            </div>
            <div className="text-2xl font-black font-mono tracking-tight mt-2 mb-1">
              {c.value}
            </div>
            <span className="text-[9px] opacity-50 font-bold uppercase tracking-wider">
              {c.desc}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-dashed border-current opacity-60">
        <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" /> Auto-saved Browser Sync
        </span>
        <button
          onClick={onResetStats}
          className="hover:text-red-500 font-bold uppercase flex items-center gap-1 cursor-pointer py-1 px-2.5 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-current rounded transition-all"
        >
          <RefreshCw className="w-3 h-3" /> Reset stats record
        </button>
      </div>
    </div>
  );
}
