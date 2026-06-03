export type GameMode = 'classic' | 'shield' | 'gravity' | 'hardcore';

export interface Skin {
  id: string;
  name: string;
  description: string;
  price: number;
  pixels: string[]; // Grid representation for drawing (e.g., 16x16 or 20x20)
  duckPixels?: string[]; // Grid for ducking state
  color: string;
}

export interface GameTheme {
  id: string;
  name: string;
  background: string; // Tailwind class or custom hex
  canvasBg: string; // Canvas backgound color hex
  groundColor: string;
  textColor: string;
  accentColor: string;
  obstacleColor: string;
  coinColor: string;
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalDistance: number; // accumulated score
  totalCoins: number;
  jumpsCount: number;
  deathsCount: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}
