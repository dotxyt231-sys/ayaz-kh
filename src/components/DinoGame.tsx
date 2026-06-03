import React, { useEffect, useRef, useState } from 'react';
import { GameMode, GameTheme, Skin, Particle } from '../types';
import { playJumpSound, playCoinSound, playHitSound, playMilestoneSound, playPowerUpSound } from '../audio';
import { Volume2, VolumeX, Shield, RefreshCw, Zap, Award } from 'lucide-react';

interface DinoGameProps {
  selectedSkin: Skin;
  selectedTheme: GameTheme;
  gameMode: GameMode;
  onCoinsEarned: (count: number) => void;
  onGameOver: (score: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function DinoGame({
  selectedSkin,
  selectedTheme,
  gameMode,
  onCoinsEarned,
  onGameOver,
  isMuted,
  onToggleMute
}: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollectedThisRun, setCoinsCollectedThisRun] = useState(0);
  const [currentHighScore, setCurrentHighScore] = useState(0);

  // Core physics / variables refs to avoid re-renders during 60FPS loop
  const stateRef = useRef({
    isPlaying: false,
    score: 0,
    coinsCollected: 0,
    speed: 6,
    maxSpeed: 14,
    distanceRun: 0,
    lastMilestone: 0,
    
    // Dino state
    dinoY: 166, // (Ground Y is 210, Dino Height is 44, so 210 - 44 = 166)
    dinoVelocityY: 0,
    isJumping: false,
    isDucking: false,
    gravity: 0.6,
    jumpPower: -11.5,
    isGravityFlipped: false, // For gravity mode
    shieldTimer: 0, // Shield invincibility frame count

    // Frame tracks
    legFrame: 0,
    tickCount: 0,
    cloudSpawnTimer: 0,
    obstacleSpawnTimer: 0,
    coinSpawnTimer: 0,
    shieldSpawnTimer: 0,

    // Collections
    obstacles: [] as any[],
    coins: [] as any[],
    shields: [] as any[],
    clouds: [] as any[],
    particles: [] as Particle[],
  });

  // Load High Score on mount
  useEffect(() => {
    const saved = localStorage.getItem('dino_runner_highscore');
    if (saved) {
      setCurrentHighScore(parseInt(saved, 10));
    }
  }, []);

  // Update refs when interactive props change
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    if (gameMode === 'hardcore') {
      stateRef.current.speed = 9;
      stateRef.current.maxSpeed = 20;
    } else {
      stateRef.current.speed = 6.2;
      stateRef.current.maxSpeed = 15;
    }
  }, [isPlaying, gameMode]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
      }

      if (!isPlaying) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          startGame();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        triggerJump();
      } else if (e.code === 'ArrowDown') {
        triggerDuck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        triggerDuck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  const triggerJump = () => {
    const s = stateRef.current;
    if (gameMode === 'gravity') {
      // Flip gravity directly!
      s.isGravityFlipped = !s.isGravityFlipped;
      playJumpSound();
      
      // Spawn elegant flip dust lines
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          x: 100,
          y: s.dinoY + 20,
          vx: (Math.random() - 0.5) * 4,
          vy: (s.isGravityFlipped ? -2 : 2) * Math.random(),
          color: selectedTheme.accentColor,
          size: Math.random() * 3 + 2,
          alpha: 1,
          decay: 0.05
        });
      }
      return;
    }

    if (!s.isJumping && !s.isDucking) {
      s.dinoVelocityY = s.jumpPower;
      s.isJumping = true;
      playJumpSound();
    }
  };

  const triggerDuck = (isDucking: boolean) => {
    const s = stateRef.current;
    if (gameMode === 'gravity') return; // No ducking in gravity twist

    s.isDucking = isDucking;
    if (isDucking && !s.isJumping) {
      s.dinoY = 210 - 28; // Lower height block center
    } else if (!isDucking && !s.isJumping) {
      s.dinoY = 210 - 44; // Normal height
    }
  };

  const startGame = () => {
    if (isGameOverState) {
      resetGameData();
    }
    setIsPlaying(true);
    setIsGameOverState(false);
    setScore(0);
    setCoinsCollectedThisRun(0);
    
    // Quick starter launch burst
    const s = stateRef.current;
    s.obstacles = [];
    s.coins = [];
    s.shields = [];
    s.particles = [];
    s.score = 0;
    s.coinsCollected = 0;
    s.distanceRun = 0;
    s.lastMilestone = 0;
    s.dinoY = 210 - 44;
    s.dinoVelocityY = 0;
    s.isJumping = false;
    s.isDucking = false;
    s.isGravityFlipped = false;
    s.shieldTimer = gameMode === 'shield' ? 180 : 0; // Shield mode starts you with a 3sec shield!
    s.obstacleSpawnTimer = 80;
    s.coinSpawnTimer = 40;
    s.shieldSpawnTimer = 240;

    // Background stars/clouds setup
    s.clouds = [
      { x: 200, y: 50, speed: 0.5, scale: 0.8 },
      { x: 500, y: 80, speed: 0.3, scale: 1.1 },
      { x: 750, y: 40, speed: 0.6, scale: 0.9 },
    ];
  };

  const resetGameData = () => {
    const s = stateRef.current;
    s.score = 0;
    s.coinsCollected = 0;
    s.distanceRun = 0;
    s.lastMilestone = 0;
    s.obstacles = [];
    s.coins = [];
    s.shields = [];
    s.particles = [];
  };

  const triggerGameOver = () => {
    setIsPlaying(false);
    setIsGameOverState(true);
    playHitSound();

    const finalScore = Math.floor(stateRef.current.score);
    const finalCoins = stateRef.current.coinsCollected;

    // Check high score
    if (finalScore > currentHighScore) {
      setCurrentHighScore(finalScore);
      localStorage.setItem('dino_runner_highscore', finalScore.toString());
    }

    // Report outcomes to parent module
    onCoinsEarned(finalCoins);
    onGameOver(finalScore);

    // Explosion particle display
    const s = stateRef.current;
    for (let i = 0; i < 24; i++) {
      s.particles.push({
        x: 100,
        y: s.dinoY + 22,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: selectedSkin.color,
        size: Math.random() * 5 + 3,
        alpha: 1,
        decay: 0.02
      });
    }

    // Spawn some obstacle debris particles
    for (let i = 0; i < 12; i++) {
      s.particles.push({
        x: 120,
        y: s.dinoY + 22,
        vx: Math.random() * 5 + 1,
        vy: (Math.random() - 0.5) * 5,
        color: selectedTheme.obstacleColor,
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: 0.03
      });
    }
  };

  // The main Game Loop running at 60 FPS via requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localLegCount = 0;

    const render = () => {
      const s = stateRef.current;
      const vWidth = 800;
      const vHeight = 250;
      const groundY = 210;

      // Clear Screen
      ctx.fillStyle = selectedTheme.canvasBg;
      ctx.fillRect(0, 0, vWidth, vHeight);

      // --- GAMEPLAY UPDATE SECTION ---
      if (isPlaying) {
        s.tickCount++;
        s.distanceRun += s.speed * 0.05;
        s.score = s.distanceRun;

        // Acceleration over run distance
        s.speed = Math.min(s.maxSpeed, (gameMode === 'hardcore' ? 9 : 6.2) + s.distanceRun * 0.0031);

        // Milestone audio alarm
        if (Math.floor(s.score) > 0 && Math.floor(s.score) % 100 === 0 && Math.floor(s.score) !== s.lastMilestone) {
          playMilestoneSound();
          s.lastMilestone = Math.floor(s.score);
          
          // Flash impact feedback around the score
          for (let i = 0; i < 15; i++) {
            s.particles.push({
              x: 750 + (Math.random() - 0.5) * 60,
              y: 25 + (Math.random() - 0.5) * 15,
              vx: (Math.random() - 0.5) * 3,
              vy: Math.random() * -2 - 1,
              color: selectedTheme.textColor,
              size: Math.random() * 2 + 1,
              alpha: 1,
              decay: 0.05
            });
          }
        }

        // Shield countdown
        if (s.shieldTimer > 0) {
          s.shieldTimer--;
        }

        // Leg step cycle
        localLegCount++;
        if (localLegCount % 6 === 0) {
          s.legFrame = (s.legFrame + 1) % 2;
        }

        // Physics implementation
        if (gameMode === 'gravity') {
          const gravityForce = s.isGravityFlipped ? -s.gravity : s.gravity;
          s.dinoVelocityY += gravityForce;
          s.dinoY += s.dinoVelocityY;

          // Constraints
          if (s.isGravityFlipped) {
            const ceilingY = 40; // Floor line for upside down
            if (s.dinoY <= ceilingY) {
              s.dinoY = ceilingY;
              s.dinoVelocityY = 0;
            }
          } else {
            if (s.dinoY >= groundY - 44) {
              s.dinoY = groundY - 44;
              s.dinoVelocityY = 0;
            }
          }
        } else {
          // Regular physics
          if (s.isJumping) {
            s.dinoVelocityY += s.gravity;
            s.dinoY += s.dinoVelocityY;

            if (s.dinoY >= groundY - 44) {
              s.dinoY = groundY - 44;
              s.dinoVelocityY = 0;
              s.isJumping = false;
            }
          }
        }

        // Particle effect generator for skin boosters
        if (selectedSkin.id === 'dragon' && (s.isJumping || Math.random() < 0.15)) {
          // Fire spark tail!
          s.particles.push({
            x: 80 + (s.isDucking ? 10 : 0),
            y: s.dinoY + (s.isDucking ? 20 : 30),
            vx: (Math.random() - 1.2) * s.speed * 0.3,
            vy: (Math.random() - 0.5) * 2,
            color: '#f97316', // bright orange spark
            size: Math.random() * 3.5 + 1.5,
            alpha: 1,
            decay: 0.04
          });
        }

        if (selectedSkin.id === 'mech' && Math.random() < 0.08) {
          // Electric spark particles
          s.particles.push({
            x: 95,
            y: s.dinoY + 12,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            color: '#00f0ff',
            size: Math.random() * 2 + 1,
            alpha: 1,
            decay: 0.1
          });
        }

        // Emit leg dust particles
        if (!s.isJumping && !s.isDucking && Math.random() < 0.2) {
          s.particles.push({
            x: 85,
            y: groundY - 2,
            vx: -s.speed * 0.4 - Math.random(),
            vy: -Math.random() * 1.5,
            color: selectedTheme.groundColor,
            size: Math.random() * 3 + 1,
            alpha: 0.8,
            decay: 0.04
          });
        }

        // SPAWNING ALGORITHMS
        // 1. Spawning Clouds
        s.cloudSpawnTimer--;
        if (s.cloudSpawnTimer <= 0) {
          s.clouds.push({
            x: vWidth + 50,
            y: Math.random() * 90 + 20,
            speed: Math.random() * 0.4 + 0.2,
            scale: Math.random() * 0.5 + 0.7
          });
          s.cloudSpawnTimer = Math.random() * 180 + 120;
        }

        // 2. Spawning Obstacles (cacti, pterodactyl flying birds)
        s.obstacleSpawnTimer--;
        if (s.obstacleSpawnTimer <= 0) {
          const rand = Math.random();
          let type = 'cactus_single';
          let width = 18;
          let height = 36;
          let y = groundY - height;

          if (gameMode === 'hardcore' && rand < 0.3) {
            // Flying Pterodactyl Bird
            type = 'bird';
            width = 30;
            height = 22;
            // Bird height: High (dino jumps under / must duck depending on height)
            const birdHeights = [groundY - 60, groundY - 35, groundY - 15]; // sky levels
            y = birdHeights[Math.floor(Math.random() * birdHeights.length)];
          } else if (rand < 0.6) {
            // Double mini / multi cactus group
            type = 'cactus_double';
            width = 34;
            height = 38;
            y = groundY - height;
          } else {
            // Standard single tall cactus
            type = 'cactus_single';
            width = 20;
            height = 42;
            y = groundY - height;
          }

          // Adjust bird heights if gravity flip mode is active so playing is reasonable
          if (gameMode === 'gravity') {
            type = 'cactus_single'; // Cacti are perfectly fair for gravity flip
            width = 18;
            height = 40;
            y = Math.random() < 0.5 ? groundY - height : 40; // Spawns from ceiling is awesome!
          }

          s.obstacles.push({
            id: Date.now() + Math.random(),
            x: vWidth + 50,
            y,
            type,
            width,
            height,
            isCeiling: (gameMode === 'gravity' && y === 40)
          });

          // Dynamic spawn frequency based on running speed
          s.obstacleSpawnTimer = Math.random() * 100 + (160 - s.speed * 8);
          // Set minimum threshold to avoid overlay obstacles
          if (s.obstacleSpawnTimer < 52) s.obstacleSpawnTimer = 52;
        }

        // 3. Spawning Gold Coins
        s.coinSpawnTimer--;
        if (s.coinSpawnTimer <= 0) {
          // Spawn single coin or tiny visual arc chain of coins
          const arcCoinsCount = Math.random() < 0.4 ? 3 : 1;
          const randomBaseY = groundY - (Math.random() * 65 + 40);
          
          for (let i = 0; i < arcCoinsCount; i++) {
            s.coins.push({
              id: Date.now() + i + Math.random(),
              x: vWidth + 50 + (i * 26),
              y: arcCoinsCount > 1 ? randomBaseY - Math.sin((i / (arcCoinsCount - 1)) * Math.PI) * 25 : randomBaseY,
              collected: false,
              pulseFrame: Math.random() * Math.PI
            });
          }

          s.coinSpawnTimer = Math.random() * 90 + 60;
        }

        // 4. Spawning Shields (Only in shield mod or low rate in other modes)
        s.shieldSpawnTimer--;
        if (s.shieldSpawnTimer <= 0) {
          if (gameMode === 'shield' || Math.random() < 0.25) {
            s.shields.push({
              id: Date.now(),
              x: vWidth + 50,
              y: groundY - 65,
              collected: false
            });
          }
          s.shieldSpawnTimer = Math.random() * 400 + 300;
        }

        // --- POSITION UPDATES & COLLISIONS CARRIED OUT ---
        
        // Clouds update
        s.clouds.forEach(cloud => {
          cloud.x -= cloud.speed * (s.speed * 0.15 + 1);
        });
        s.clouds = s.clouds.filter(c => c.x > -100);

        // Obstacles collision check
        s.obstacles.forEach(obs => {
          obs.x -= s.speed;

          // Hitbox calculation
          // Shrink slightly for nice forgiving collider feel
          const shrinkW = obs.type === 'bird' ? 3 : 4;
          const shrinkH = 4;
          
          const dinoX = 80 + shrinkW;
          const dinoW = (s.isDucking ? 44 : 32) - (shrinkW * 2);
          const dinoH = (s.isDucking ? 28 : 44) - shrinkH;
          const dinoCurrentY = s.dinoY + (shrinkH / 2);

          const obsX = obs.x + shrinkW;
          const obsW = obs.width - (shrinkW * 2);
          const obsH = obs.height - shrinkH;
          const obsY = obs.y + (shrinkH / 2);

          // Standard AABB collision
          if (
            dinoX < obsX + obsW &&
            dinoX + dinoW > obsX &&
            dinoCurrentY < obsY + obsH &&
            dinoCurrentY + dinoH > obsY
          ) {
            if (s.shieldTimer > 0) {
              // Destroy obstacle with particles!
              s.obstacles = s.obstacles.filter(o => o.id !== obs.id);
              playPowerUpSound(); // play sonic crush sounds
              
              // Sparkles!
              for (let i = 0; i < 15; i++) {
                s.particles.push({
                  x: obs.x + obs.width / 2,
                  y: obs.y + obs.height / 2,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: selectedTheme.accentColor,
                  size: Math.random() * 4 + 1.5,
                  alpha: 1,
                  decay: 0.05
                });
              }
            } else {
              triggerGameOver();
            }
          }
        });
        s.obstacles = s.obstacles.filter(o => o.x > -50);

        // Coins collection check
        s.coins.forEach(coin => {
          coin.x -= s.speed;
          coin.pulseFrame += 0.15;

          // Quick distance checks for collection
          const dx = coin.x - 100; // Center approximation
          const dy = coin.y - (s.dinoY + 22);
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Collide radius check
          if (distance < 30 && !coin.collected) {
            coin.collected = true;
            s.coinsCollected++;
            setCoinsCollectedThisRun(s.coinsCollected);
            playCoinSound();

            // Collect glints
            for (let i = 0; i < 6; i++) {
              s.particles.push({
                x: coin.x,
                y: coin.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: selectedTheme.coinColor,
                size: Math.random() * 2 + 1.5,
                alpha: 1,
                decay: 0.08
              });
            }
          }
        });
        s.coins = s.coins.filter(c => c.x > -50 && !c.collected);

        // Shields collection check
        s.shields.forEach(shield => {
          shield.x -= s.speed;

          const dx = shield.x - 100;
          const dy = shield.y - (s.dinoY + 22);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 30 && !shield.collected) {
            shield.collected = true;
            s.shieldTimer = 300; // 5 full seconds of invincibility!
            playPowerUpSound();

            // Bubble particles
            for (let i = 0; i < 12; i++) {
              s.particles.push({
                x: shield.x,
                y: shield.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: selectedTheme.accentColor,
                size: Math.random() * 3.5 + 2,
                alpha: 1,
                decay: 0.04
              });
            }
          }
        });
        s.shields = s.shields.filter(sld => sld.x > -50 && !sld.collected);

        // Particles decay
        s.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
        });
        s.particles = s.particles.filter(p => p.alpha > 0);

        // Sync score reactively and speed up
        setScore(Math.floor(s.score));
      }

      // --- RENDERING ARTWORK IN PORTABLE WINDOWS ---

      // Render Clouds
      ctx.fillStyle = selectedTheme.textColor === '#535353' ? 'rgba(211, 211, 211, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      s.clouds.forEach(cloud => {
        const cx = cloud.x;
        const cy = cloud.y;
        const sc = cloud.scale;

        // Draw cute cloud pixel blocks
        ctx.fillRect(cx, cy, 30 * sc, 10 * sc);
        ctx.fillRect(cx + 8 * sc, cy - 6 * sc, 14 * sc, 6 * sc);
        ctx.fillRect(cx + 14 * sc, cy - 10 * sc, 8 * sc, 4 * sc);
      });

      // Render Ground with custom patterns/accents
      ctx.strokeStyle = selectedTheme.groundColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(vWidth, groundY);
      ctx.stroke();

      // Upside down ceiling line if in gravity mode
      if (gameMode === 'gravity') {
        ctx.strokeStyle = selectedTheme.groundColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(vWidth, 40);
        ctx.stroke();
      }

      // Minor details on ground to feel motion (pebbles/grit lines)
      ctx.fillStyle = selectedTheme.groundColor;
      const groundOffset = (s.distanceRun * 20) % 120;
      for (let i = 0; i < vWidth + 120; i += 120) {
        ctx.fillRect(i - groundOffset + 20, groundY + 5, 8, 2);
        ctx.fillRect(i - groundOffset + 65, groundY + 14, 15, 2);
        ctx.fillRect(i - groundOffset + 105, groundY + 8, 4, 2);

        if (gameMode === 'gravity') {
          // Ceiling pebbles
          ctx.fillRect(i - groundOffset + 30, 40 - 7, 8, 2);
          ctx.fillRect(i - groundOffset + 80, 40 - 15, 12, 2);
        }
      }

      // Render Coins
      s.coins.forEach(coin => {
        const radius = 6;
        const scaleX = Math.abs(Math.sin(coin.pulseFrame)); // Gold spin effect
        
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.scale(scaleX, 1);
        ctx.fillStyle = selectedTheme.coinColor;
        ctx.shadowColor = selectedTheme.coinColor;
        ctx.shadowBlur = selectedTheme.textColor !== '#535353' ? 8 : 0;
        
        // Spin circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner detail ring
        ctx.strokeStyle = selectedTheme.textColor === '#535353' ? '#ffffff' : '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // Render Shield Power-up items
      s.shields.forEach(sld => {
        ctx.save();
        ctx.translate(sld.x, sld.y);
        
        // Shield badge shape
        ctx.fillStyle = selectedTheme.accentColor;
        ctx.shadowColor = selectedTheme.accentColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(8, -5);
        ctx.lineTo(8, 2);
        ctx.lineTo(0, 9);
        ctx.lineTo(-8, 2);
        ctx.lineTo(-8, -5);
        ctx.closePath();
        ctx.fill();
        
        // Inner white plus mark
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -4, 2, 8);
        ctx.fillRect(-4, -1, 8, 2);

        ctx.restore();
      });

      // Render Obstacles (single cactus, double cactus, bird flap frames)
      s.obstacles.forEach(obs => {
        ctx.fillStyle = selectedTheme.obstacleColor;
        ctx.shadowBlur = selectedTheme.textColor !== '#535353' ? 4 : 0;
        ctx.shadowColor = selectedTheme.obstacleColor;

        if (obs.type === 'cactus_single') {
          const ox = obs.x;
          const oy = obs.y;
          const ow = obs.width;
          const oh = obs.height;

          // Cute procedural pixel cactus drawing
          // Main core
          ctx.fillRect(ox + ow / 3, oy, ow / 3, oh);
          // Left branch
          ctx.fillRect(ox, oy + oh / 3, ow / 3, oh / 4);
          ctx.fillRect(ox, oy + oh / 6, ow / 3, oh / 5);
          // Right branch
          ctx.fillRect(ox + (ow * 2) / 3, oy + oh / 2.5, ow / 3, oh / 4);
          ctx.fillRect(ox + (ow * 2) / 3, oy + oh / 3.4, ow / 3, oh / 4);
        } else if (obs.type === 'cactus_double') {
          const ox = obs.x;
          const oy = obs.y;
          const ow = obs.width;
          const oh = obs.height;

          // Double clump cactus
          // First Cactus
          ctx.fillRect(ox + 4, oy + 4, 6, oh - 4);
          ctx.fillRect(ox + 1, oy + oh / 3, 3, oh / 3);
          ctx.fillRect(ox + 10, oy + oh / 2, 2, oh / 3);

          // Second Cactus (Slightly shorter)
          ctx.fillRect(ox + 18, oy + 12, 6, oh - 12);
          ctx.fillRect(ox + 14, oy + oh / 2.2, 4, oh / 3.5);
          ctx.fillRect(ox + 24, oy + oh / 1.8, 3, oh / 4);
        } else if (obs.type === 'bird') {
          // Bird flapping animation frames based on s.tickCount
          const ox = obs.x;
          const oy = obs.y;
          const ow = obs.width;
          const oh = obs.height;
          const isWingUp = Math.floor(s.tickCount / 10) % 2 === 0;

          // Body
          ctx.fillRect(ox + 6, oy + 6, 16, 8);
          // Beak
          ctx.fillRect(ox, oy + 8, 6, 4);
          // Eye
          ctx.fillStyle = selectedTheme.canvasBg;
          ctx.fillRect(ox + 12, oy + 8, 2, 2);
          ctx.fillStyle = selectedTheme.obstacleColor;

          // Tail wing
          ctx.fillRect(ox + 22, oy + 8, 4, 3);

          // Wings
          if (isWingUp) {
            ctx.fillRect(ox + 10, oy, 4, 6); // Upwardwing
          } else {
            ctx.fillRect(ox + 10, oy + 14, 4, 8); // Downwardwing
          }
        }
      });

      // Render Dino (Skins pixel matrix decoder drawer!)
      const activeLegFrame = s.legFrame;
      const isDead = isGameOverState;
      const pixelSource = (s.isDucking && selectedSkin.duckPixels) ? selectedSkin.duckPixels : selectedSkin.pixels;
      
      const pixelSize = 2.2; // Grid pixel draw scale
      const dX = 80;
      const dY = s.dinoY;

      // Draw Dino Matrix Pixels
      ctx.save();
      // Rotate 180deg if gravity state flipped
      if (s.isGravityFlipped) {
        ctx.translate(dX + 20, dY + 22);
        ctx.scale(1, -1);
        ctx.translate(-(dX + 20), -(dY + 22));
      }

      pixelSource.forEach((row, rIdx) => {
        for (let cIdx = 0; cIdx < row.length; cIdx++) {
          const char = row[cIdx];
          if (char === ' ') continue;

          // Resolve color
          let color = selectedSkin.color;
          if (char === 'E') {
            color = isDead ? selectedTheme.textColor : (selectedTheme.textColor === '#535353' ? '#ffffff' : '#000000');
          } else if (char === 'A') {
            color = selectedTheme.accentColor;
          }

          // Leg alternates for motion running feel!
          if (!s.isJumping && !s.isDucking && rIdx >= pixelSource.length - 4) {
            // Foot alternate frame filter check keys
            const isLeftLeg = cIdx < row.length / 2;
            if (activeLegFrame === 0 && isLeftLeg && rIdx >= pixelSource.length - 2) {
              continue; // Skip left leg draw to hide frame
            }
            if (activeLegFrame === 1 && !isLeftLeg && rIdx >= pixelSource.length - 2) {
              continue; // Skip right leg draw
            }
          }

          ctx.fillStyle = color;
          // Soft bloom glow for sleek modern skin colors
          if (selectedTheme.textColor !== '#535353') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
          }
          
          ctx.fillRect(dX + (cIdx * pixelSize), dY + (rIdx * pixelSize), pixelSize + 0.2, pixelSize + 0.2);
        }
      });
      ctx.restore();

      // Render Dino Invincibility Power Shield circle
      if (s.shieldTimer > 0) {
        ctx.save();
        ctx.strokeStyle = selectedTheme.accentColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = selectedTheme.accentColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        // Pulsate radius
        const radiusPulse = 28 + Math.sin(s.tickCount * 0.2) * 3;
        ctx.arc(dX + 20, dY + 22, radiusPulse, 0, Math.PI * 2);
        ctx.stroke();

        // Little floating orbits surrounding the shield
        const orbitAngle = s.tickCount * 0.05;
        const ox = dX + 20 + Math.cos(orbitAngle) * radiusPulse;
        const oy = dY + 22 + Math.sin(orbitAngle) * radiusPulse;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Score / Game Over graphics on screen
      s.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      // Frame continuation loop
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, isGameOverState, selectedSkin, selectedTheme, gameMode]);

  // Touch handlers for responsive phone plays
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isPlaying) {
      startGame();
      return;
    }
    triggerJump();
  };

  return (
    <div className="flex flex-col items-center w-full" id="dino-game-root">
      {/* Game Window Header Actions Panel */}
      <div className="flex justify-between items-center w-full px-4 py-2 border-b border-inherit font-sans" id="game-stats-hud">
        {/* Lives / Mode indicators */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase font-semibold bg-white/10 rounded-full border border-white/5 shadow-inner">
            <Zap className="w-3 H-3 text-amber-500 animate-pulse" />
            Mode: <span className="text-amber-500 font-bold">{gameMode}</span>
          </span>
          {gameMode === 'shield' && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 border border-cyan-500/20 text-cyan-400 bg-cyan-950/20 rounded">
              <Shield className="w-3 h-3" /> Shield Ready
            </span>
          )}
        </div>

        {/* Realtime Scores */}
        <div className="flex items-center gap-6 font-mono text-sm tracking-widest">
          {/* Best Highscore */}
          <div className="flex items-center gap-1.5 opacity-60">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>HI</span>
            <span className="font-bold">{currentHighScore.toString().padStart(5, '0')}</span>
          </div>

          {/* Current Run Coins */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            <span className="opacity-60 text-xs text-amber-500 font-sans font-bold uppercase">Coins</span>
            <span className="text-amber-500 font-bold">{coinsCollectedThisRun.toString().padStart(3, '0')}</span>
          </div>

          {/* Core Score */}
          <div className="flex items-center gap-1.5 font-bold text-lg text-inherit">
            <span className="opacity-50 text-xs font-sans font-semibold uppercase">Score</span>
            <span className="text-xl">{score.toString().padStart(5, '0')}</span>
          </div>
        </div>
      </div>

      {/* Primary Canvas Container Box */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        className="relative w-full aspect-[800/250] overflow-hidden select-none cursor-pointer group"
        id="canvas-gesture-wrapper"
      >
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={250}
          className="w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Game Idle Welcoming State */}
        {!isPlaying && !isGameOverState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] text-white p-6 transition-all duration-300 animate-fade-in text-center">
            <h3 className="text-2xl font-black uppercase text-amber-400 tracking-wider mb-2 drop-shadow-md">
              Chrome Dino Runner
            </h3>
            <p className="text-sm text-gray-200 font-sans max-w-sm mb-5 text-center leading-relaxed font-medium">
              Press <span className="px-2 py-0.5 mx-1 font-mono text-xs bg-slate-800 border border-slate-600 rounded shadow">SPACE</span> or Tap the Screen to launch your Dinosaur jogger!
            </p>
            <button 
              onClick={startGame}
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 font-sans font-bold text-slate-900 shadow-xl shadow-amber-500/10 hover:shadow-amber-400/20 active:scale-95 transition-all text-sm uppercase tracking-wide cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-900" /> Start Runner
            </button>
          </div>
        )}

        {/* Game Crash / Lost State overlay */}
        {isGameOverState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white p-6 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center animate-bounce mb-3">
              <span className="w-4 h-4 rounded-full bg-rose-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-rose-500 mb-1">
              Game Over
            </h2>
            <p className="text-sm font-semibold text-gray-300 font-sans mb-1">
              Final Score: <span className="text-amber-400 font-bold text-base">{score}</span>
            </p>
            <p className="text-xs text-amber-500 font-bold tracking-wide uppercase mb-5">
              +{coinsCollectedThisRun} Coins Deposited!
            </p>
            
            <button 
              onClick={startGame}
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-black flex items-center gap-2 uppercase tracking-wider text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Restart Run
            </button>
          </div>
        )}

        {/* Swipe Instructions Widget floating on Hover */}
        {isPlaying && (
          <div className="absolute bottom-3 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 text-white font-sans text-[10px] px-2 py-1 rounded select-none pointer-events-none">
            ⌨️ UP/SPACE = Jump | DOWN = Duck
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="w-full flex justify-between items-center py-3 px-4 border-t border-inherit font-sans" id="game-controls-bar">
        <div className="text-[11px] opacity-60">
          🎮 Tap context window or use <span className="font-semibold text-inherit border border-slate-600/25 px-1 rounded mx-0.5 shadow-sm">Space</span>
        </div>
        
        {/* Sound toggle controls */}
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-inherit transition-all active:scale-90 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 opacity-80 text-rose-500" />
              <span>Unmute Synth</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 opacity-80 text-emerald-500 animate-pulse" />
              <span>Mute Synth</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
