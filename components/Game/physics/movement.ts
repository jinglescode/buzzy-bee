import { PHYSICS, BOUNDS } from '../utils/constants';

export interface MovementState {
  positionY: number;
  positionZ: number;
  velocityY: number;
  isHolding: boolean;
  isDead: boolean;
}

export function createMovementState(): MovementState {
  return {
    positionY: 3,
    positionZ: 0,
    velocityY: 0,
    isHolding: false,
    isDead: false,
  };
}

export function applyTap(state: MovementState): void {
  // Flappy Bird style: each tap sets velocity directly — discrete flaps
  state.velocityY = PHYSICS.TAP_IMPULSE;
}

export function updateMovement(state: MovementState, dt: number): void {
  if (state.isDead) return;

  // Apply gravity (always active — no hold lift, pure Flappy Bird)
  state.velocityY += PHYSICS.GRAVITY * dt;

  // Clamp velocity
  state.velocityY = Math.max(PHYSICS.MAX_DOWN_VELOCITY, Math.min(PHYSICS.MAX_UP_VELOCITY, state.velocityY));

  // Update positions
  state.positionY += state.velocityY * dt;
  state.positionZ -= PHYSICS.FORWARD_SPEED * dt; // Negative Z = forward (into screen)

  // Check boundaries
  if (state.positionY < BOUNDS.FLOOR || state.positionY > BOUNDS.CEILING) {
    state.isDead = true;
  }
}

export function getTiltAngle(velocityY: number): number {
  // Map velocity to tilt angle: positive velocity = tilt up (negative X rotation)
  const normalized = velocityY / PHYSICS.MAX_UP_VELOCITY;
  return -normalized * PHYSICS.MAX_TILT;
}
