'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createScene, updateCamera, handleResize } from './scene/createScene';
import { Bee } from './scene/Bee';
import { ObstacleManager } from './scene/Obstacle';
import { Environment } from './scene/Environment';
import { SoundManager } from './audio/SoundManager';
import {
  createMovementState,
  updateMovement,
  applyTap,
  getTiltAngle,
} from './physics/movement';
import { checkCollision } from './physics/collision';
import {
  createGameState,
  startGame,
  scorePoint,
  endGame,
  restartGame,
  type GameStateData,
} from './state/gameState';
// ObstacleManager handles its own spawning via update()

interface GameProps {
  onStateChange?: (state: GameStateData) => void;
}

export default function Game({ onStateChange }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const notifyState = useCallback(
    (gs: GameStateData) => {
      onStateChange?.({ ...gs });
    },
    [onStateChange]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { scene, camera, renderer } = createScene(canvas);

    const bee = new Bee();
    scene.add(bee.mesh);

    const obstacles = new ObstacleManager(scene);
    const environment = new Environment(scene);
    const sound = new SoundManager();

    const movement = createMovementState();
    const gameState = createGameState();

    bee.mesh.position.set(0, movement.positionY, movement.positionZ);

    let lastTime = 0;
    let animationId = 0;
    let audioInitialized = false;

    notifyState(gameState);

    // ---- Reset helper ----
    const resetScene = () => {
      movement.positionY = 3;
      movement.positionZ = 0;
      movement.velocityY = 0;
      movement.isDead = false;
      movement.isHolding = false;
      obstacles.reset();
      bee.mesh.position.set(0, 3, 0);
      bee.reset();
      camera.position.set(0, 5, 8);
      bee.flutterFast(); // start continuous wing buzzing
      notifyState(gameState);
    };

    // ---- Input ----
    const handleDown = (e: Event) => {
      e.preventDefault();
      if (!audioInitialized) {
        sound.init();
        audioInitialized = true;
      }

      if (gameState.state === 'menu') {
        startGame(gameState);
        resetScene();
      } else if (gameState.state === 'playing') {
        movement.isHolding = true;
        applyTap(movement);
        bee.flapOnce();
        sound.playFlap();
      } else if (gameState.state === 'dead') {
        restartGame(gameState);
        resetScene();
      }
    };

    const handleUp = (e: Event) => {
      e.preventDefault();
      movement.isHolding = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) handleDown(e);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') handleUp(e);
    };

    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchend', handleUp, { passive: false });
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mouseup', handleUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const onResize = () => handleResize(camera, renderer);
    window.addEventListener('resize', onResize);

    // ---- Score popup ----
    const showScorePopup = () => {
      if (!overlayRef.current) return;
      const el = document.createElement('div');
      el.textContent = '+1';
      el.style.cssText = `
        position: absolute; top: 18%; left: 50%;
        transform: translate(-50%, 0) scale(1);
        font-size: clamp(40px, 11vw, 60px); font-weight: bold;
        color: #FFD54F;
        -webkit-text-stroke: 1.5px rgba(0,0,0,0.15);
        text-shadow: 0 2px 12px rgba(255,179,0,0.5), 0 0 30px rgba(255,213,79,0.4);
        font-family: "Fredoka One", "Nunito", system-ui, sans-serif;
        pointer-events: none; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 1; z-index: 25;
        letter-spacing: 2px;
      `;
      overlayRef.current.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = 'translate(-50%, -80px) scale(1.3)';
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 700);
    };

    // ---- Game loop ----
    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate);

      const dt = lastTime === 0 ? 0.016 : Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (gameState.state === 'playing') {
        updateMovement(movement, dt);

        if (movement.isDead) {
          endGame(gameState);
          sound.playBonk();
          bee.playDeath();
          notifyState(gameState);
          return;
        }

        // Update bee
        bee.mesh.position.y = movement.positionY;
        bee.mesh.position.z = movement.positionZ;
        bee.setTiltTarget(getTiltAngle(movement.velocityY));

        // Scoring: check BEFORE update (which marks passed internally)
        // Bee passes obstacle when beeZ < obstacleZ (both negative, bee goes more negative)
        const active = obstacles.getActive();
        for (const obs of active) {
          if (!obs.passed && movement.positionZ < obs.group.position.z) {
            obs.passed = true;
            scorePoint(gameState);
            sound.playChime();
            showScorePopup();
            notifyState(gameState);
          }
        }

        // Collision
        const beeBBox = bee.getBoundingBox();
        if (checkCollision(beeBBox, active)) {
          movement.isDead = true;
          endGame(gameState);
          sound.playBonk();
          bee.playDeath();
          notifyState(gameState);
        }

        // Update obstacles: handles spawning ahead + despawning behind
        obstacles.update(movement.positionZ);
        updateCamera(camera, movement.positionY, movement.positionZ, dt);
      }

      bee.update(dt);
      environment.update(movement.positionZ, dt);
      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchend', handleUp);
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mouseup', handleUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', onResize);
      sound.dispose();
      renderer.dispose();
    };
  }, [notifyState]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
