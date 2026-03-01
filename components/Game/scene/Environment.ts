import * as THREE from 'three';
import { COLORS, SCENE, BOUNDS } from '../utils/constants';

// ---------- helpers ----------

function createCloud(): THREE.Group {
  const cloud = new THREE.Group();

  const count = 3 + Math.floor(Math.random() * 3); // 3-5 blobs
  for (let i = 0; i < count; i++) {
    const radius = 0.6 + Math.random() * 1.0;
    const geo = new THREE.SphereGeometry(radius, 7, 5);
    // Per-blob opacity variation for fluffiness
    const opacity = 0.7 + Math.random() * 0.25;
    const mat = new THREE.MeshLambertMaterial({
      color: COLORS.CLOUD,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 2.5,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 1.2,
    );
    cloud.add(mesh);
  }
  return cloud;
}

function createFlower(color: number): THREE.Group {
  const flower = new THREE.Group();

  // stem
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4);
  const stemMat = new THREE.MeshLambertMaterial({ color: COLORS.STEM_GREEN });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.3;
  flower.add(stem);

  // blossom
  const blossomGeo = new THREE.SphereGeometry(0.15, 6, 4);
  const blossomMat = new THREE.MeshLambertMaterial({ color });
  const blossom = new THREE.Mesh(blossomGeo, blossomMat);
  blossom.position.y = 0.65;
  flower.add(blossom);

  // small leaves (two cones)
  const leafGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
  const leafMat = new THREE.MeshLambertMaterial({ color: COLORS.STEM_GREEN });
  for (let side = -1; side <= 1; side += 2) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(side * 0.12, 0.22, 0);
    leaf.rotation.z = side * Math.PI / 4;
    flower.add(leaf);
  }

  return flower;
}

function createHill(radius: number, color: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({ color });
  const hill = new THREE.Mesh(geo, mat);
  return hill;
}

// ---------- sun glow ----------

function createSunGlowSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Radial gradient for soft glow
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const glowColor = new THREE.Color(COLORS.SUN_GLOW);
  const hex = glowColor.getHexString();
  gradient.addColorStop(0, `#${hex}cc`);
  gradient.addColorStop(0.3, `#${hex}66`);
  gradient.addColorStop(0.7, `#${hex}22`);
  gradient.addColorStop(1, `#${hex}00`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(18, 18, 1);
  return sprite;
}

// ---------- pollen particles ----------

const POLLEN_COUNT = 40;
const POLLEN_SPREAD_X = 12;
const POLLEN_SPREAD_Y_MIN = 0;
const POLLEN_SPREAD_Y_MAX = 10;
const POLLEN_SPREAD_Z = 50;

function createPollenParticles(): {
  points: THREE.Points;
  velocities: Float32Array;
} {
  const positions = new Float32Array(POLLEN_COUNT * 3);
  const velocities = new Float32Array(POLLEN_COUNT * 3);
  const sizes = new Float32Array(POLLEN_COUNT);

  for (let i = 0; i < POLLEN_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * POLLEN_SPREAD_X * 2;
    positions[i3 + 1] = POLLEN_SPREAD_Y_MIN + Math.random() * POLLEN_SPREAD_Y_MAX;
    positions[i3 + 2] = -Math.random() * POLLEN_SPREAD_Z;

    // Gentle drift velocities
    velocities[i3] = (Math.random() - 0.5) * 0.5;     // x drift
    velocities[i3 + 1] = 0.2 + Math.random() * 0.4;   // slow upward float
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;  // z drift

    sizes[i] = 2.0 + Math.random() * 3.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create a small circular sprite texture for pollen
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  const pollenColor = new THREE.Color(COLORS.POLLEN);
  const hex = pollenColor.getHexString();
  gradient.addColorStop(0, `#${hex}ff`);
  gradient.addColorStop(0.4, `#${hex}aa`);
  gradient.addColorStop(1, `#${hex}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    map: texture,
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: COLORS.POLLEN,
  });

  const points = new THREE.Points(geometry, material);
  return { points, velocities };
}

// ---------- ground with vertex colors ----------

function createGradientGround(width: number, length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, length, 1, 8);

  // Add vertex colors: lighter near the center path, darker at edges
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const lightColor = new THREE.Color(COLORS.GROUND_LIGHT);
  const darkColor = new THREE.Color(COLORS.GROUND_DARK);

  for (let i = 0; i < geo.attributes.position.count; i++) {
    const x = geo.attributes.position.getX(i);
    const normalizedX = Math.abs(x) / (width / 2);
    const blend = Math.pow(normalizedX, 0.8);
    const c = new THREE.Color().lerpColors(lightColor, darkColor, blend);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

// ---------- main class ----------

const CLOUD_Y_MIN = 8;
const CLOUD_Y_MAX = 15;
const CLOUD_X_RANGE = 10;
const CLOUD_RECYCLE_BEHIND = 30;
const CLOUD_SPAWN_AHEAD = 60;

const DECO_POOL_SIZE = 20;
const DECO_X_MIN = 8;
const DECO_X_MAX = 15;
const DECO_RECYCLE_BEHIND = 20;
const DECO_SPAWN_AHEAD = 50;

const FLOWER_COLORS = [COLORS.FLOWER_PINK, COLORS.FLOWER_ORANGE, COLORS.FLOWER_PURPLE];

const GROUND_SEGMENT_LENGTH = SCENE.GROUND_LENGTH;

export class Environment {
  group: THREE.Group;
  private clouds: THREE.Group[] = [];
  private decorations: THREE.Group[] = [];

  private groundA!: THREE.Mesh;
  private groundB!: THREE.Mesh;

  private sun!: THREE.Mesh;
  private sunGlow!: THREE.Sprite;
  private hillGroup!: THREE.Group;

  private pollenPoints!: THREE.Points;
  private pollenVelocities!: Float32Array;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.createGround();
    this.createHills();
    this.createSun();
    this.createClouds();
    this.createDecorations();
    this.createPollen();
  }

  // ---- ground (two leapfrogging segments with vertex color gradient) ----

  private createGround(): void {
    this.groundA = createGradientGround(SCENE.GROUND_WIDTH, GROUND_SEGMENT_LENGTH);
    this.groundA.rotation.x = -Math.PI / 2;
    this.groundA.position.set(0, BOUNDS.FLOOR, -GROUND_SEGMENT_LENGTH / 2);
    this.group.add(this.groundA);

    this.groundB = createGradientGround(SCENE.GROUND_WIDTH, GROUND_SEGMENT_LENGTH);
    this.groundB.rotation.x = -Math.PI / 2;
    this.groundB.position.set(0, BOUNDS.FLOOR, -GROUND_SEGMENT_LENGTH / 2 - GROUND_SEGMENT_LENGTH);
    this.group.add(this.groundB);
  }

  // ---- hills ----

  private createHills(): void {
    this.hillGroup = new THREE.Group();
    this.group.add(this.hillGroup);

    const hillConfigs = [
      { x: -8, z: -30, r: 4, color: COLORS.GROUND_DARK },
      { x: 10, z: -60, r: 5, color: COLORS.GROUND_DARK },
      { x: -5, z: -100, r: 3.5, color: COLORS.GROUND_DARK },
      { x: 12, z: -140, r: 4.5, color: COLORS.GROUND_DARK },
      { x: -10, z: -170, r: 3, color: COLORS.GROUND_DARK },
    ];

    for (const cfg of hillConfigs) {
      const hill = createHill(cfg.r, cfg.color);
      hill.position.set(cfg.x, BOUNDS.FLOOR, cfg.z);
      this.hillGroup.add(hill);
    }
  }

  // ---- sun with glow ----

  private createSun(): void {
    const geo = new THREE.SphereGeometry(3, 16, 12);
    const mat = new THREE.MeshBasicMaterial({ color: COLORS.SUN });
    this.sun = new THREE.Mesh(geo, mat);
    this.sun.position.set(15, 20, -50);
    this.group.add(this.sun);

    // Soft glow sprite behind the sun
    this.sunGlow = createSunGlowSprite();
    this.sunGlow.position.copy(this.sun.position);
    this.group.add(this.sunGlow);
  }

  // ---- clouds ----

  private createClouds(): void {
    for (let i = 0; i < SCENE.CLOUD_COUNT; i++) {
      const cloud = createCloud();
      this.positionCloudInitial(cloud, i);
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private positionCloudInitial(cloud: THREE.Group, index: number): void {
    const spacing = CLOUD_SPAWN_AHEAD / SCENE.CLOUD_COUNT;
    cloud.position.set(
      (Math.random() - 0.5) * CLOUD_X_RANGE * 2,
      CLOUD_Y_MIN + Math.random() * (CLOUD_Y_MAX - CLOUD_Y_MIN),
      -(index * spacing + Math.random() * spacing),
    );
    cloud.userData['driftX'] = (Math.random() - 0.5) * 0.4;
  }

  private recycleCloud(cloud: THREE.Group, beeZ: number): void {
    cloud.position.set(
      (Math.random() - 0.5) * CLOUD_X_RANGE * 2,
      CLOUD_Y_MIN + Math.random() * (CLOUD_Y_MAX - CLOUD_Y_MIN),
      beeZ - CLOUD_SPAWN_AHEAD - Math.random() * 20,
    );
    cloud.userData['driftX'] = (Math.random() - 0.5) * 0.4;
  }

  // ---- decorations (flowers/bushes) ----

  private createDecorations(): void {
    for (let i = 0; i < DECO_POOL_SIZE; i++) {
      const color = FLOWER_COLORS[i % FLOWER_COLORS.length];
      const flower = createFlower(color);
      this.positionDecoInitial(flower, i);
      this.group.add(flower);
      this.decorations.push(flower);
    }
  }

  private positionDecoInitial(deco: THREE.Group, index: number): void {
    const side = index % 2 === 0 ? 1 : -1;
    const x = side * (DECO_X_MIN + Math.random() * (DECO_X_MAX - DECO_X_MIN));
    const spacing = DECO_SPAWN_AHEAD / (DECO_POOL_SIZE / 2);
    const z = -(index * spacing * 0.5 + Math.random() * spacing);
    deco.position.set(x, BOUNDS.FLOOR, z);
    deco.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.6;
    deco.scale.setScalar(scale);
  }

  private recycleDeco(deco: THREE.Group, beeZ: number): void {
    const side = Math.random() < 0.5 ? 1 : -1;
    const x = side * (DECO_X_MIN + Math.random() * (DECO_X_MAX - DECO_X_MIN));
    deco.position.set(
      x,
      BOUNDS.FLOOR,
      beeZ - DECO_SPAWN_AHEAD - Math.random() * 15,
    );
    deco.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.6;
    deco.scale.setScalar(scale);
  }

  // ---- pollen particles ----

  private createPollen(): void {
    const { points, velocities } = createPollenParticles();
    this.pollenPoints = points;
    this.pollenVelocities = velocities;
    this.group.add(this.pollenPoints);
  }

  // ---- update ----

  update(beeZ: number, dt: number): void {
    // Sun follows bee on Z (far away so feels fixed)
    this.sun.position.z = beeZ - 50;
    this.sunGlow.position.z = beeZ - 50;

    // Subtle sun glow pulse
    const glowScale = 18 + Math.sin(Date.now() * 0.001) * 1.5;
    this.sunGlow.scale.set(glowScale, glowScale, 1);

    // Hills follow bee loosely (parallax effect)
    const hillBaseZ = beeZ;
    for (const hill of this.hillGroup.children) {
      if (hill.position.z > hillBaseZ + 30) {
        hill.position.z -= GROUND_SEGMENT_LENGTH;
      }
    }

    // Leapfrog ground segments
    const frontEdgeA = this.groundA.position.z - GROUND_SEGMENT_LENGTH / 2;
    const frontEdgeB = this.groundB.position.z - GROUND_SEGMENT_LENGTH / 2;

    if (beeZ < frontEdgeA - 20 && this.groundA.position.z > this.groundB.position.z) {
      this.groundA.position.z = this.groundB.position.z - GROUND_SEGMENT_LENGTH;
    }
    if (beeZ < frontEdgeB - 20 && this.groundB.position.z > this.groundA.position.z) {
      this.groundB.position.z = this.groundA.position.z - GROUND_SEGMENT_LENGTH;
    }

    // Update clouds
    for (const cloud of this.clouds) {
      const drift = (cloud.userData['driftX'] as number) || 0;
      cloud.position.x += drift * dt;
      if (cloud.position.x > CLOUD_X_RANGE) cloud.position.x = -CLOUD_X_RANGE;
      if (cloud.position.x < -CLOUD_X_RANGE) cloud.position.x = CLOUD_X_RANGE;

      if (cloud.position.z > beeZ + CLOUD_RECYCLE_BEHIND) {
        this.recycleCloud(cloud, beeZ);
      }
    }

    // Update decorations
    for (const deco of this.decorations) {
      if (deco.position.z > beeZ + DECO_RECYCLE_BEHIND) {
        this.recycleDeco(deco, beeZ);
      }
    }

    // Update pollen particles
    this.updatePollen(beeZ, dt);
  }

  private updatePollen(beeZ: number, dt: number): void {
    const positions = this.pollenPoints.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;

    for (let i = 0; i < POLLEN_COUNT; i++) {
      const i3 = i * 3;

      // Apply velocity with gentle sine wobble
      const wobble = Math.sin(Date.now() * 0.002 + i) * 0.3;
      posArray[i3] += (this.pollenVelocities[i3] + wobble) * dt;
      posArray[i3 + 1] += this.pollenVelocities[i3 + 1] * dt;
      posArray[i3 + 2] += this.pollenVelocities[i3 + 2] * dt;

      // Recycle particles that drift too far
      const relativeZ = posArray[i3 + 2] - beeZ;
      if (
        relativeZ > POLLEN_SPREAD_Z * 0.5 ||
        relativeZ < -POLLEN_SPREAD_Z ||
        posArray[i3 + 1] > POLLEN_SPREAD_Y_MAX + 2 ||
        Math.abs(posArray[i3]) > POLLEN_SPREAD_X
      ) {
        posArray[i3] = (Math.random() - 0.5) * POLLEN_SPREAD_X * 2;
        posArray[i3 + 1] = POLLEN_SPREAD_Y_MIN + Math.random() * POLLEN_SPREAD_Y_MAX;
        posArray[i3 + 2] = beeZ - Math.random() * POLLEN_SPREAD_Z;
      }
    }

    positions.needsUpdate = true;
  }

  // ---- reset ----

  reset(): void {
    // Reposition ground
    this.groundA.position.z = -GROUND_SEGMENT_LENGTH / 2;
    this.groundB.position.z = -GROUND_SEGMENT_LENGTH / 2 - GROUND_SEGMENT_LENGTH;

    // Reposition clouds
    this.clouds.forEach((cloud, i) => this.positionCloudInitial(cloud, i));

    // Reposition decorations
    this.decorations.forEach((deco, i) => this.positionDecoInitial(deco, i));

    // Reset sun
    this.sun.position.set(15, 20, -50);
    this.sunGlow.position.set(15, 20, -50);

    // Reset hills
    const hillConfigs = [
      { x: -8, z: -30 },
      { x: 10, z: -60 },
      { x: -5, z: -100 },
      { x: 12, z: -140 },
      { x: -10, z: -170 },
    ];
    this.hillGroup.children.forEach((hill, i) => {
      if (hillConfigs[i]) {
        hill.position.set(hillConfigs[i].x, BOUNDS.FLOOR, hillConfigs[i].z);
      }
    });

    // Reset pollen positions
    const positions = this.pollenPoints.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    for (let i = 0; i < POLLEN_COUNT; i++) {
      const i3 = i * 3;
      posArray[i3] = (Math.random() - 0.5) * POLLEN_SPREAD_X * 2;
      posArray[i3 + 1] = POLLEN_SPREAD_Y_MIN + Math.random() * POLLEN_SPREAD_Y_MAX;
      posArray[i3 + 2] = -Math.random() * POLLEN_SPREAD_Z;
    }
    positions.needsUpdate = true;
  }
}
