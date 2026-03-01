'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { GameStateData } from '@/components/Game/state/gameState';
import { useIsStandalone } from '@/hooks/useIsStandalone';

const Game = dynamic(() => import('@/components/Game/Game'), { ssr: false });

const FONT_STACK =
  '"Fredoka One", "Fredoka", "Nunito", "Comic Sans MS", "Apple Color Emoji", system-ui, -apple-system, sans-serif';

// Medal thresholds
const MEDAL_BRONZE = 5;
const MEDAL_SILVER = 15;
const MEDAL_GOLD = 30;

function getMedal(score: number) {
  if (score >= MEDAL_GOLD)
    return {
      tier: 'Gold',
      gradient: 'linear-gradient(135deg, #FFD700, #FFA000, #FFD700)',
      emoji: '\uD83C\uDFC6',
      glow: 'rgba(255, 215, 0, 0.4)',
    };
  if (score >= MEDAL_SILVER)
    return {
      tier: 'Silver',
      gradient: 'linear-gradient(135deg, #E8E8E8, #A0A0A0, #E8E8E8)',
      emoji: '\uD83E\uDD48',
      glow: 'rgba(192, 192, 192, 0.4)',
    };
  if (score >= MEDAL_BRONZE)
    return {
      tier: 'Bronze',
      gradient: 'linear-gradient(135deg, #CD7F32, #8B4513, #CD7F32)',
      emoji: '\uD83E\uDD49',
      glow: 'rgba(205, 127, 50, 0.4)',
    };
  return null;
}

// ---------- Honey particles for menu ----------

const HONEY_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 7.3 + 13) % 84)}%`,
  size: 4 + ((i * 3.7) % 8),
  delay: (i * 0.5) % 6,
  duration: 4 + ((i * 1.3) % 4),
  opacity: 0.15 + ((i * 0.07) % 0.25),
}));

function HoneyParticles() {
  return (
    <>
      {HONEY_PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255, 213, 79, 0.8), rgba(255, 179, 0, 0.3))',
            opacity: p.opacity,
            animation: `honeyFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

// ---------- CSS Animated Bee ----------

function AnimatedBee() {
  return (
    <div
      style={{
        position: 'relative',
        width: 52,
        height: 40,
        animation: 'beeFloat 2s ease-in-out infinite',
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
      }}
    >
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 10,
          width: 34,
          height: 22,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #FFD54F, #FFC107)',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Stripes */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 0,
            width: 4,
            height: '100%',
            background: '#3E2723',
            borderRadius: 2,
            opacity: 0.8,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 17,
            top: 0,
            width: 4,
            height: '100%',
            background: '#3E2723',
            borderRadius: 2,
            opacity: 0.8,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: 0,
            width: 3,
            height: '100%',
            background: '#3E2723',
            borderRadius: 2,
            opacity: 0.6,
          }}
        />
      </div>
      {/* Left Wing */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          top: 0,
          width: 16,
          height: 12,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          transformOrigin: 'bottom center',
          animation: 'wingBuzz 0.08s ease-in-out infinite alternate',
        }}
      />
      {/* Right Wing */}
      <div
        style={{
          position: 'absolute',
          left: 26,
          top: 0,
          width: 16,
          height: 12,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          transformOrigin: 'bottom center',
          animation: 'wingBuzz 0.08s ease-in-out infinite alternate-reverse',
        }}
      />
      {/* Eye */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: 15,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#111',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 1,
            top: 1,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      </div>
      {/* Stinger */}
      <div
        style={{
          position: 'absolute',
          right: -4,
          top: 17,
          width: 0,
          height: 0,
          borderLeft: '6px solid #3E2723',
          borderTop: '3px solid transparent',
          borderBottom: '3px solid transparent',
        }}
      />
    </div>
  );
}

// ---------- Milestone confetti ----------

const CONFETTI_COLORS = ['#FFD54F', '#FFB300', '#FF8F00', '#FFF176', '#FFFFFF'];
const CONFETTI_PIECES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${10 + ((i * 4.2 + 7) % 80)}%`,
  top: `${10 + ((i * 2.8 + 3) % 40)}%`,
  size: 6 + ((i * 1.7) % 8),
  round: i % 2 === 0,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 0.8 + ((i * 0.05) % 0.7),
  delay: (i * 0.015) % 0.3,
}));

// ---------- Main component ----------

export default function Home() {
  const [gameState, setGameState] = useState<GameStateData>({
    state: 'menu',
    score: 0,
    highScore: 0,
  });
  const [prevScore, setPrevScore] = useState(0);
  const [scoreKey, setScoreKey] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const prevStateRef = useRef('menu');

  const isStandalone = useIsStandalone();
  const showInstallPrompt = isStandalone === false;
  const isNewHighScore =
    gameState.score >= gameState.highScore && gameState.score > 0;

  const handleStateChange = useCallback((newState: GameStateData) => {
    setGameState(newState);
  }, []);

  // Screen shake on death
  useEffect(() => {
    if (gameState.state === 'dead' && prevStateRef.current !== 'dead') {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(t);
    }
    prevStateRef.current = gameState.state;
  }, [gameState.state]);

  // Golden flash + score bounce on score change
  useEffect(() => {
    if (gameState.score > prevScore && gameState.score > 0) {
      setScoreKey((k) => k + 1);
      setShowFlash(true);
      const t1 = setTimeout(() => setShowFlash(false), 300);

      // Milestone check
      let t2: ReturnType<typeof setTimeout> | undefined;
      if (gameState.score % 10 === 0) {
        setShowMilestone(true);
        t2 = setTimeout(() => setShowMilestone(false), 1500);
      }

      setPrevScore(gameState.score);
      return () => {
        clearTimeout(t1);
        if (t2) clearTimeout(t2);
      };
    }
    setPrevScore(gameState.score);
  }, [gameState.score, prevScore]);

  // Score counting animation on game over
  useEffect(() => {
    if (gameState.state === 'dead') {
      const target = gameState.score;
      if (target === 0) {
        setDisplayScore(0);
        return;
      }
      let current = 0;
      const step = Math.max(1, Math.floor(target / 20));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        setDisplayScore(current);
      }, 40);
      return () => clearInterval(interval);
    } else {
      setDisplayScore(0);
    }
  }, [gameState.state, gameState.score]);

  const medal = gameState.state === 'dead' ? getMedal(gameState.score) : null;

  // Shared styles
  const textShadowHeavy =
    '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 2px rgba(0, 0, 0, 0.8)';
  const textShadowMedium = '0 2px 6px rgba(0, 0, 0, 0.4)';
  const textShadowLight = '0 1px 4px rgba(0, 0, 0, 0.3)';

  const glassPanel: React.CSSProperties = {
    background: 'rgba(255, 248, 225, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 213, 79, 0.2)',
    borderRadius: 28,
    padding: '36px 32px',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
  };

  const pillButton: React.CSSProperties = {
    background: 'linear-gradient(135deg, #FFD54F 0%, #FFB300 100%)',
    borderRadius: 50,
    padding: '14px 36px',
    fontSize: 'clamp(16px, 4.5vw, 22px)',
    fontWeight: 'bold',
    color: '#3E2723',
    fontFamily: FONT_STACK,
    border: 'none',
    boxShadow:
      '0 0 24px rgba(255, 179, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    letterSpacing: '0.5px',
    textShadow: '0 1px 0 rgba(255, 255, 255, 0.3)',
    animation: 'buttonGlow 2.5s ease-in-out infinite',
    pointerEvents: 'none' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        animation: isShaking
          ? 'screenShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)'
          : 'none',
      }}
    >
      <Game onStateChange={handleStateChange} />

      {/* Golden flash overlay on score */}
      {showFlash && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(circle at 50% 20%, rgba(255, 213, 79, 0.25), transparent 60%)',
            pointerEvents: 'none',
            zIndex: 15,
            animation: 'flashFade 0.3s ease-out forwards',
          }}
        />
      )}

      {/* Milestone celebration */}
      {showMilestone && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 30,
          }}
        >
          {CONFETTI_PIECES.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                borderRadius: p.round ? '50%' : '2px',
                background: p.color,
                animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* HUD: Score during gameplay */}
      {gameState.state === 'playing' && (
        <div
          key={scoreKey}
          aria-live="polite"
          aria-label={`Score: ${gameState.score}`}
          style={{
            position: 'absolute',
            top: 'max(env(safe-area-inset-top, 0px), 24px)',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(48px, 14vw, 72px)',
            fontWeight: 'bold',
            color: '#fff',
            WebkitTextStroke: '2px rgba(0, 0, 0, 0.3)',
            textShadow: textShadowHeavy,
            fontFamily: FONT_STACK,
            pointerEvents: 'none',
            zIndex: 20,
            letterSpacing: '2px',
            lineHeight: 1,
            padding: '8px 0',
            animation:
              gameState.score > 0
                ? 'scoreBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                : 'none',
          }}
        >
          {gameState.score}
        </div>
      )}

      {/* Menu Screen */}
      {gameState.state === 'menu' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <HoneyParticles />

          <div
            style={{
              ...glassPanel,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 'min(280px, 85vw)',
              animation:
                'panelAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(44px, 11vw, 72px)',
                fontWeight: 'bold',
                background:
                  'linear-gradient(180deg, #FFF176 0%, #FFD54F 40%, #FFB300 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter:
                  'drop-shadow(0 3px 6px rgba(62, 39, 35, 0.4))',
                fontFamily: FONT_STACK,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '1px',
              }}
            >
              Buzzy Bee
            </h1>

            <div style={{ marginTop: 16 }}>
              <AnimatedBee />
            </div>

            <div style={{ ...pillButton, marginTop: 32 }}>
              Tap to Play
            </div>

            {gameState.highScore > 0 && (
              <div
                style={{
                  fontSize: 'clamp(14px, 3.5vw, 17px)',
                  marginTop: 20,
                  color: 'rgba(255, 255, 255, 0.85)',
                  textShadow: textShadowLight,
                  fontFamily: FONT_STACK,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ opacity: 0.7 }}>{'\uD83D\uDC51'}</span>{' '}
                Best: {gameState.highScore}
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {showInstallPrompt && (
              <div
                style={{
                  fontSize: 'clamp(13px, 3.5vw, 16px)',
                  color: '#fff',
                  textShadow: textShadowLight,
                  fontFamily: FONT_STACK,
                  opacity: 0.65,
                }}
              >
                Add to Home Screen for quick access
              </div>
            )}
            <a
              href="https://jingles.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 'clamp(11px, 3vw, 13px)',
                color: '#fff',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                fontFamily: FONT_STACK,
                opacity: 0.45,
                textDecoration: 'none',
                pointerEvents: 'auto',
              }}
            >
              Made by Jingles.dev
            </a>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.state === 'dead' && (
        <div
          role="dialog"
          aria-label="Game Over"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            pointerEvents: 'none',
            zIndex: 20,
            animation:
              'overlayFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              ...glassPanel,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 'min(300px, 85vw)',
              animation:
                'panelAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow:
                '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 40px rgba(255, 179, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(32px, 9vw, 48px)',
                fontWeight: 'bold',
                color: '#FF6B6B',
                WebkitTextStroke: '1px rgba(0, 0, 0, 0.15)',
                textShadow:
                  '0 3px 10px rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 107, 107, 0.2)',
                fontFamily: FONT_STACK,
                margin: 0,
                animation:
                  'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Game Over
            </h2>

            {/* Medal */}
            {medal && (
              <div
                style={{
                  marginTop: 16,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: medal.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px ${medal.glow}`,
                  animation:
                    'medalPop 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                {medal.emoji}
              </div>
            )}

            {/* Score with counting animation */}
            <div
              style={{
                fontSize: 'clamp(44px, 13vw, 72px)',
                fontWeight: 'bold',
                background:
                  'linear-gradient(180deg, #FFF176 0%, #FFD54F 40%, #FFB300 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter:
                  'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))',
                fontFamily: FONT_STACK,
                marginTop: medal ? 12 : 16,
                animation:
                  'scoreReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                letterSpacing: '3px',
              }}
              aria-label={`Your score: ${gameState.score}`}
            >
              {displayScore}
            </div>

            {/* Best score + New badge */}
            <div
              style={{
                fontSize: 'clamp(14px, 3.5vw, 18px)',
                color: 'rgba(255, 255, 255, 0.85)',
                fontFamily: FONT_STACK,
                marginTop: 6,
                textShadow: textShadowMedium,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation:
                  'fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span>Best: {gameState.highScore}</span>
              {isNewHighScore && (
                <span
                  style={{
                    display: 'inline-block',
                    background:
                      'linear-gradient(135deg, #FFD54F, #FFB300)',
                    color: '#3E2723',
                    fontSize: '0.65em',
                    fontWeight: 'bold',
                    padding: '3px 10px',
                    borderRadius: 20,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    boxShadow:
                      '0 2px 8px rgba(255, 179, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    animation:
                      'badgePop 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    textShadow: 'none',
                    WebkitTextStroke: '0px transparent',
                    WebkitTextFillColor: '#3E2723',
                  }}
                >
                  New!
                </span>
              )}
            </div>

            {/* Retry button */}
            <div
              style={{
                ...pillButton,
                marginTop: 28,
                opacity: 0,
                animation:
                  'buttonAppear 0.5s ease 0.8s forwards, buttonGlow 2.5s ease-in-out 1.3s infinite',
              }}
            >
              Tap to Retry
            </div>
          </div>

          {showInstallPrompt && (
            <div
              style={{
                position: 'absolute',
                bottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
                fontSize: 'clamp(13px, 3.5vw, 16px)',
                color: '#fff',
                textShadow: textShadowLight,
                fontFamily: FONT_STACK,
                opacity: 0,
                animation: 'fadeInUp 0.6s ease 1.2s forwards',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Enjoying Buzzy Bee? Add to Home Screen!
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.97);
          }
        }

        @keyframes beeFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(-3deg);
          }
          25% {
            transform: translateY(-6px) rotate(1deg);
          }
          50% {
            transform: translateY(-2px) rotate(3deg);
          }
          75% {
            transform: translateY(-8px) rotate(-1deg);
          }
        }

        @keyframes wingBuzz {
          from {
            transform: rotate(-15deg) scaleY(0.8);
          }
          to {
            transform: rotate(15deg) scaleY(1);
          }
        }

        @keyframes overlayFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
        }

        @keyframes panelAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes scoreReveal {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 0.9;
            transform: translateY(0);
          }
        }

        @keyframes badgePop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          60% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scoreBounce {
          0% {
            transform: translateX(-50%) scale(1);
          }
          30% {
            transform: translateX(-50%) scale(1.25);
          }
          60% {
            transform: translateX(-50%) scale(0.95);
          }
          100% {
            transform: translateX(-50%) scale(1);
          }
        }

        @keyframes buttonGlow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(255, 179, 0, 0.3),
              0 4px 12px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 32px rgba(255, 179, 0, 0.5),
              0 4px 12px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes buttonAppear {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes flashFade {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes screenShake {
          0%,
          100% {
            transform: translate(0, 0);
          }
          10% {
            transform: translate(-4px, 2px);
          }
          20% {
            transform: translate(4px, -2px);
          }
          30% {
            transform: translate(-3px, -1px);
          }
          40% {
            transform: translate(3px, 1px);
          }
          50% {
            transform: translate(-2px, 2px);
          }
          60% {
            transform: translate(2px, -1px);
          }
          70% {
            transform: translate(-1px, 1px);
          }
          80% {
            transform: translate(1px, -1px);
          }
          90% {
            transform: translate(0, 1px);
          }
        }

        @keyframes medalPop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          60% {
            transform: scale(1.15) rotate(10deg);
          }
          80% {
            transform: scale(0.95) rotate(-5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes honeyFloat {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(60px) rotate(360deg) scale(0.3);
          }
        }
      `}</style>
    </div>
  );
}
