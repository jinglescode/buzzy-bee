import * as THREE from 'three';
import { OBSTACLE, COLORS } from '../utils/constants';
import { ObjectPool } from '../utils/objectPool';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ObstaclePair {
  group: THREE.Group;
  topColumn: THREE.Mesh;
  bottomColumn: THREE.Mesh;
  /** Extra decorative meshes (flower heads, honeycomb caps, etc.) */
  decorations: THREE.Object3D[];
  passed: boolean;
  active: boolean;
}

type ObstacleStyle = 'flower' | 'honeycomb';

// ---------------------------------------------------------------------------
// Geometry helpers (created once, shared across all instances)
// ---------------------------------------------------------------------------

const STEM_RADIUS = OBSTACLE.COLUMN_WIDTH * 0.18;
const HEX_RADIUS = OBSTACLE.COLUMN_WIDTH * 0.48;
const HEX_HEIGHT = 0.7;

const stemGeometry = new THREE.CylinderGeometry(STEM_RADIUS, STEM_RADIUS, 1, 8);
const hexGeometry = new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6);
const petalGeometry = new THREE.ConeGeometry(0.6, 1.4, 5);
const flowerCenterGeometry = new THREE.SphereGeometry(0.45, 8, 6);

const FLOWER_COLORS = [COLORS.FLOWER_PINK, COLORS.FLOWER_ORANGE, COLORS.FLOWER_PURPLE];

// Shared materials (saves GPU memory)
const stemMaterial = new THREE.MeshLambertMaterial({ color: COLORS.STEM_GREEN });
const goldMaterial = new THREE.MeshLambertMaterial({ color: COLORS.HONEYCOMB_GOLD });
const amberMaterial = new THREE.MeshLambertMaterial({ color: COLORS.HONEYCOMB_AMBER });

// ---------------------------------------------------------------------------
// Decoration builders
// ---------------------------------------------------------------------------

/** Build a stylized flower head (low-poly petals around a center sphere). */
function buildFlowerHead(color: number, inverted: boolean): THREE.Group {
  const head = new THREE.Group();

  // Center sphere
  const center = new THREE.Mesh(
    flowerCenterGeometry,
    new THREE.MeshLambertMaterial({ color: 0xFFEB3B }),
  );
  head.add(center);

  // Ring of petals
  const petalMat = new THREE.MeshLambertMaterial({ color });
  const petalCount = 6;
  for (let i = 0; i < petalCount; i++) {
    const petal = new THREE.Mesh(petalGeometry, petalMat);
    const angle = (i / petalCount) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7);
    petal.rotation.z = inverted ? Math.PI : 0;
    // Tilt petals outward
    petal.rotation.x = Math.cos(angle) * 0.4;
    petal.rotation.z += Math.sin(angle) * 0.4;
    head.add(petal);
  }

  // Outer ring of smaller petals offset
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 + Math.PI / petalCount;
    const petal = new THREE.Mesh(petalGeometry, petalMat);
    petal.scale.set(0.7, 0.7, 0.7);
    petal.position.set(Math.cos(angle) * 1.0, 0, Math.sin(angle) * 1.0);
    petal.rotation.x = Math.cos(angle) * 0.5;
    petal.rotation.z = (inverted ? Math.PI : 0) + Math.sin(angle) * 0.5;
    head.add(petal);
  }

  if (inverted) {
    head.rotation.x = Math.PI;
  }

  return head;
}

/** Build a honeycomb pillar of stacked hexagonal cells. */
function buildHoneycombColumn(height: number): THREE.Group {
  const col = new THREE.Group();
  const cellCount = Math.max(1, Math.floor(height / HEX_HEIGHT));

  for (let i = 0; i < cellCount; i++) {
    const useAmber = Math.random() < 0.35;
    const hex = new THREE.Mesh(hexGeometry, useAmber ? amberMaterial : goldMaterial);
    hex.position.y = i * HEX_HEIGHT - (cellCount * HEX_HEIGHT) / 2 + HEX_HEIGHT / 2;
    // Slight random rotation per cell for visual variety
    hex.rotation.y = Math.random() * Math.PI / 3;
    col.add(hex);
  }

  return col;
}

// ---------------------------------------------------------------------------
// ObstacleManager
// ---------------------------------------------------------------------------

export class ObstacleManager {
  private scene: THREE.Scene;
  private pool: ObjectPool<ObstaclePair>;
  private activePairs: ObstaclePair[] = [];
  private nextSpawnZ: number = -OBSTACLE.SPAWN_DISTANCE;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.pool = new ObjectPool<ObstaclePair>(
      () => this.createPair(),
      (pair) => this.resetPair(pair),
      OBSTACLE.POOL_SIZE,
    );
  }

  // -----------------------------------------------------------------------
  // Factory / reset
  // -----------------------------------------------------------------------

  private createPair(): ObstaclePair {
    const group = new THREE.Group();
    group.visible = false;

    // Placeholder columns — geometry is rebuilt on spawn
    const topColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 8),
      stemMaterial,
    );
    const bottomColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 8),
      stemMaterial,
    );

    group.add(topColumn);
    group.add(bottomColumn);
    this.scene.add(group);

    return {
      group,
      topColumn,
      bottomColumn,
      decorations: [],
      passed: false,
      active: false,
    };
  }

  private resetPair(pair: ObstaclePair): void {
    pair.group.visible = false;
    pair.passed = false;
    pair.active = false;

    // Remove old decorations
    for (const dec of pair.decorations) {
      pair.group.remove(dec);
    }
    pair.decorations = [];
  }

  // -----------------------------------------------------------------------
  // Spawn
  // -----------------------------------------------------------------------

  spawn(zPosition: number): void {
    const pair = this.pool.get();

    // Random gap parameters
    const gapHeight =
      OBSTACLE.GAP_HEIGHT_MIN +
      Math.random() * (OBSTACLE.GAP_HEIGHT_MAX - OBSTACLE.GAP_HEIGHT_MIN);
    const gapCenter =
      OBSTACLE.GAP_CENTER_MIN +
      Math.random() * (OBSTACLE.GAP_CENTER_MAX - OBSTACLE.GAP_CENTER_MIN);

    const gapBottom = gapCenter - gapHeight / 2;
    const gapTop = gapCenter + gapHeight / 2;

    const bottomStart = -5;
    const topEnd = 15;
    const bottomHeight = gapBottom - bottomStart;
    const topHeight = topEnd - gapTop;

    // Pick a random visual style
    const style: ObstacleStyle = Math.random() < 0.5 ? 'flower' : 'honeycomb';

    // Remove previous decorations (safety)
    for (const dec of pair.decorations) {
      pair.group.remove(dec);
    }
    pair.decorations = [];

    if (style === 'flower') {
      this.buildFlowerPair(pair, bottomHeight, topHeight, gapBottom, gapTop, bottomStart, topEnd);
    } else {
      this.buildHoneycombPair(pair, bottomHeight, topHeight, gapBottom, gapTop, bottomStart, topEnd);
    }

    pair.group.position.set(0, 0, zPosition);
    pair.group.visible = true;
    pair.passed = false;
    pair.active = true;
    this.activePairs.push(pair);
  }

  private buildFlowerPair(
    pair: ObstaclePair,
    bottomHeight: number,
    topHeight: number,
    gapBottom: number,
    gapTop: number,
    bottomStart: number,
    topEnd: number,
  ): void {
    const flowerColor = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

    // Bottom stem
    pair.bottomColumn.geometry.dispose();
    pair.bottomColumn.geometry = new THREE.CylinderGeometry(
      STEM_RADIUS, STEM_RADIUS, Math.max(0.1, bottomHeight), 8,
    );
    pair.bottomColumn.material = stemMaterial;
    pair.bottomColumn.position.set(0, bottomStart + bottomHeight / 2, 0);
    pair.bottomColumn.visible = true; // restore if recycled from honeycomb

    // Top stem (hangs down)
    pair.topColumn.geometry.dispose();
    pair.topColumn.geometry = new THREE.CylinderGeometry(
      STEM_RADIUS, STEM_RADIUS, Math.max(0.1, topHeight), 8,
    );
    pair.topColumn.material = stemMaterial;
    pair.topColumn.position.set(0, gapTop + topHeight / 2, 0);
    pair.topColumn.visible = true; // restore if recycled from honeycomb

    // Bottom flower head (at tip, pointing up)
    const bottomFlower = buildFlowerHead(flowerColor, false);
    bottomFlower.position.set(0, gapBottom - 0.2, 0);
    pair.group.add(bottomFlower);
    pair.decorations.push(bottomFlower);

    // Top flower head (inverted, pointing down)
    const topFlower = buildFlowerHead(flowerColor, true);
    topFlower.position.set(0, gapTop + 0.2, 0);
    pair.group.add(topFlower);
    pair.decorations.push(topFlower);

    // Add a couple of small leaves on the stems
    const leafGeo = new THREE.ConeGeometry(0.4, 0.8, 4);
    const leafMat = new THREE.MeshLambertMaterial({ color: COLORS.STEM_GREEN });
    for (const yOffset of [bottomStart + bottomHeight * 0.3, bottomStart + bottomHeight * 0.6]) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(STEM_RADIUS + 0.2, yOffset, 0);
      leaf.rotation.z = -Math.PI / 4;
      pair.group.add(leaf);
      pair.decorations.push(leaf);
    }
  }

  private buildHoneycombPair(
    pair: ObstaclePair,
    bottomHeight: number,
    topHeight: number,
    gapBottom: number,
    gapTop: number,
    bottomStart: number,
    topEnd: number,
  ): void {
    // Bottom column — stacked hexagons
    const bottomCol = buildHoneycombColumn(bottomHeight);
    bottomCol.position.set(0, bottomStart + bottomHeight / 2, 0);
    pair.group.add(bottomCol);
    pair.decorations.push(bottomCol);

    // Top column — stacked hexagons
    const topCol = buildHoneycombColumn(topHeight);
    topCol.position.set(0, gapTop + topHeight / 2, 0);
    pair.group.add(topCol);
    pair.decorations.push(topCol);

    // Invisible collision cylinders matching honeycomb column size
    pair.bottomColumn.geometry.dispose();
    pair.bottomColumn.geometry = new THREE.CylinderGeometry(
      HEX_RADIUS, HEX_RADIUS, Math.max(0.1, bottomHeight), 6,
    );
    pair.bottomColumn.position.set(0, bottomStart + bottomHeight / 2, 0);
    pair.bottomColumn.visible = false; // honeycomb decorations handle rendering

    pair.topColumn.geometry.dispose();
    pair.topColumn.geometry = new THREE.CylinderGeometry(
      HEX_RADIUS, HEX_RADIUS, Math.max(0.1, topHeight), 6,
    );
    pair.topColumn.position.set(0, gapTop + topHeight / 2, 0);
    pair.topColumn.visible = false; // honeycomb decorations handle rendering
  }

  // -----------------------------------------------------------------------
  // Update
  // -----------------------------------------------------------------------

  update(beeZ: number): void {
    // Despawn obstacles the bee has passed
    for (let i = this.activePairs.length - 1; i >= 0; i--) {
      const pair = this.activePairs[i];
      const obstacleZ = pair.group.position.z;

      // Mark as passed for scoring (bee moves in -Z direction)
      if (!pair.passed && obstacleZ > beeZ) {
        pair.passed = true;
      }

      // Despawn if bee is far past
      if (obstacleZ - beeZ > OBSTACLE.DESPAWN_BEHIND) {
        pair.active = false;
        this.pool.release(pair);
        this.activePairs.splice(i, 1);
      }
    }

    // Spawn new obstacles ahead of the bee
    while (this.nextSpawnZ > beeZ - OBSTACLE.SPAWN_DISTANCE) {
      this.spawn(this.nextSpawnZ);
      const spacing =
        OBSTACLE.SPACING_MIN +
        Math.random() * (OBSTACLE.SPACING_MAX - OBSTACLE.SPACING_MIN);
      this.nextSpawnZ -= spacing;
    }
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getActive(): ObstaclePair[] {
    return this.activePairs;
  }

  getNextSpawnZ(): number {
    return this.nextSpawnZ;
  }

  // -----------------------------------------------------------------------
  // Reset (game restart)
  // -----------------------------------------------------------------------

  reset(): void {
    for (const pair of this.activePairs) {
      pair.active = false;
      this.pool.release(pair);
    }
    this.activePairs = [];
    this.nextSpawnZ = -OBSTACLE.SPAWN_DISTANCE;
  }
}
