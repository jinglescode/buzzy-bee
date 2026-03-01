import type { GameState } from '../utils/constants';

export interface GameStateData {
  state: GameState;
  score: number;
  highScore: number;
}

const HIGH_SCORE_KEY = 'buzzy-bee-high-score';

export function createGameState(): GameStateData {
  return {
    state: 'menu',
    score: 0,
    highScore: loadHighScore(),
  };
}

export function startGame(gs: GameStateData): void {
  gs.state = 'playing';
  gs.score = 0;
}

export function scorePoint(gs: GameStateData): void {
  gs.score += 1;
}

export function endGame(gs: GameStateData): void {
  gs.state = 'dead';
  if (gs.score > gs.highScore) {
    gs.highScore = gs.score;
    saveHighScore(gs.highScore);
  }
}

export function restartGame(gs: GameStateData): void {
  gs.state = 'playing';
  gs.score = 0;
}

function loadHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // localStorage might be unavailable
  }
}
