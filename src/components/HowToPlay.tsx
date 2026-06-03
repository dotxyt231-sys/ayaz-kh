import { HelpCircle, ChevronRight, Zap, Shield, Sparkles } from 'lucide-react';

export default function HowToPlay() {
  const instructions = [
    {
      title: 'Jump',
      desc: 'Sails over obstacles and gaps.',
      keys: 'Space / ↑',
      icon: <Zap className="w-4 h-4" />
    },
    {
      title: 'Crouch',
      desc: 'Ducks under high-flying predators.',
      keys: '↓ Arrow',
      icon: <Shield className="w-4 h-4" />
    },
    {
      title: 'Power Shield',
      desc: 'Shatters the next hazard on impact.',
      keys: 'Auto-Trigger',
      icon: <Sparkles className="w-4 h-4 animate-pulse" />
    }
  ];

  return (
    <div className="w-full flex flex-col font-sans border-2 rounded-xl p-5 bg-white/40 dark:bg-black/20" id="how-to-play-pane" style={{ borderColor: 'currentColor' }}>
      <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-dashed border-current pb-3 mb-4">
        <HelpCircle className="w-4 h-4" /> Runner Control Layout:
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="instructions-grid">
        {instructions.map((inst, index) => (
          <div key={index} className="flex flex-col gap-2.5 p-3.5 border rounded-lg bg-white/25 dark:bg-black/10" style={{ borderColor: 'currentColor' }}>
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-black">
                Type: {inst.title}
              </span>
              <div className="p-1 px-1.5 border rounded" style={{ borderColor: 'currentColor' }}>
                {inst.icon}
              </div>
            </div>
            
            <p className="text-[10px] opacity-75 leading-relaxed font-bold uppercase tracking-wider">
              {inst.desc}
            </p>

            <div className="mt-auto pt-2 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest opacity-50">Keystroke:</span>
              <span className="px-2.5 py-1 bg-white dark:bg-zinc-900 border text-xs font-bold font-mono tracking-tight rounded shadow-sm" style={{ borderColor: 'currentColor' }}>
                {inst.keys}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-dashed border-current flex flex-wrap gap-x-5 gap-y-2 items-center text-[10px] opacity-65">
        <span className="font-extrabold uppercase tracking-widest text-[#e11d48]">Twist Modifiers:</span>
        <span className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          <span className="font-black">Classic:</span> Retro sprint experience
        </span>
        <span className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          <span className="font-black">Shield:</span> Powerfield loops
        </span>
        <span className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          <span className="font-black">Gravity:</span> Upper surface ceilings
        </span>
        <span className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          <span className="font-black">Hardcore:</span> Saturated velocity + birds
        </span>
      </div>
    </div>
  );
}
