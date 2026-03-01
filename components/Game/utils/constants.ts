// All tunable game parameters — single source of truth
// All physics values are PER-SECOND rates, multiplied by deltaTime each frame

export const PHYSICS = {
  FORWARD_SPEED: 12,         // units/sec
  GRAVITY: -38,              // units/sec² (heavy — Flappy Bird feel)
  TAP_IMPULSE: 10,           // units/sec (instant velocity set on each tap)
  MAX_UP_VELOCITY: 12,       // units/sec
  MAX_DOWN_VELOCITY: -20,    // units/sec (fast fall)
  TILT_LERP_SPEED: 8.0,      // per sec (snappy tilt)
  MAX_TILT: Math.PI / 4,     // ±45 degrees (dramatic nose-dive)
} as const;

export const CAMERA = {
  OFFSET_X: 0,
  OFFSET_Y: 0.5,             // near bee level — side-on view for gap clarity
  OFFSET_Z: 6,               // closer behind bee — bee is prominent on screen
  LOOK_AHEAD: 5,             // gentle forward angle — less gap foreshortening
  DAMPING: 15.0,             // near-instant vertical follow — precision positioning
} as const;

export const OBSTACLE = {
  COLUMN_WIDTH: 3,
  GAP_HEIGHT_MIN: 4,
  GAP_HEIGHT_MAX: 5,
  GAP_CENTER_MIN: 1,
  GAP_CENTER_MAX: 5,
  SPAWN_DISTANCE: 60,        // ahead of bee
  SPACING_MIN: 18,
  SPACING_MAX: 22,
  DESPAWN_BEHIND: 10,
  POOL_SIZE: 8,
} as const;

export const BOUNDS = {
  FLOOR: -2,
  CEILING: 12,
} as const;

export const COLORS = {
  SKY_TOP: 0x4A90D9,
  SKY_BOTTOM: 0xB8E4F9,
  SKY_HORIZON: 0xFCE4B8,
  GROUND_LIGHT: 0x5BBD3E,
  GROUND_DARK: 0x3A8F2E,
  BEE_BODY: 0xFFD54F,
  BEE_STRIPE: 0x3E2723,
  BEE_WING: 0xFFFFFF,
  BEE_EYE: 0x111111,
  FLOWER_PINK: 0xFF6B9D,
  FLOWER_ORANGE: 0xFFB74D,
  FLOWER_PURPLE: 0xCE93D8,
  HONEYCOMB_GOLD: 0xFFE082,
  HONEYCOMB_AMBER: 0xFFB300,
  STEM_GREEN: 0x66BB6A,
  SUN: 0xFFF176,
  SUN_GLOW: 0xFFECB3,
  CLOUD: 0xFFFDE7,
  FOG: 0xB8E4F9,
  POLLEN: 0xFFE0A0,
} as const;

export const SCENE = {
  FOG_NEAR: 30,
  FOG_FAR: 80,
  CLOUD_COUNT: 5,
  GROUND_WIDTH: 40,
  GROUND_LENGTH: 200,
} as const;

export type GameState = 'menu' | 'playing' | 'dead';
