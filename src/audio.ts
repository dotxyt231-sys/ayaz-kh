// Web Audio Retro Synth Sound Effects
let audioCtx: AudioContext | null = null;
let isMutedValue = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const toggleMute = () => {
  isMutedValue = !isMutedValue;
  return isMutedValue;
};

export const isMuted = () => isMutedValue;

// Retro sound helper
const playRetroSound = (freqs: number[], durations: number[], type: OscillatorType = 'square', volume = 0.1) => {
  if (isMutedValue) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durations.reduce((a, b) => a + b, 0));
    masterGain.connect(ctx.destination);

    let currentStart = now;
    freqs.forEach((freq, idx) => {
      const duration = durations[idx];
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, currentStart);
      
      // Pitch sweeps
      if (idx === freqs.length - 1 && freqs.length > 1) {
        // Last tone sweeps
      }

      gainNode.gain.setValueAtTime(0.8, currentStart);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentStart + duration);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(currentStart);
      osc.stop(currentStart + duration);

      currentStart += duration * 0.8; // slightly overlap or gap
    });
  } catch (err) {
    console.error('Audio playback failed:', err);
  }
};

export const playJumpSound = () => {
  // Upward sweep
  playRetroSound([150, 300, 600], [0.05, 0.05, 0.1], 'triangle', 0.15);
};

export const playCoinSound = () => {
  // Crystal ring
  playRetroSound([880, 1318], [0.08, 0.15], 'sine', 0.12);
};

export const playMilestoneSound = () => {
  // Chrome original double beep!
  playRetroSound([880, 880], [0.1, 0.1], 'square', 0.1);
};

export const playPowerUpSound = () => {
  // Arpeggio
  playRetroSound([523, 659, 783, 1046], [0.06, 0.06, 0.06, 0.15], 'square', 0.12);
};

export const playHitSound = () => {
  // Low pitch rumble/fuzz
  if (isMutedValue) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.35);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    console.error('Hit sound failed:', err);
  }
};
