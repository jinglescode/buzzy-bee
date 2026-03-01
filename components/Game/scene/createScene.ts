import * as THREE from 'three';
import { COLORS, CAMERA, SCENE } from '../utils/constants';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

/** Creates a vertical gradient sky texture using canvas */
function createSkyGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  // Deep blue at zenith → lighter blue → warm peach at horizon
  const topColor = new THREE.Color(COLORS.SKY_TOP);
  const midColor = new THREE.Color(COLORS.SKY_BOTTOM);
  const horizonColor = new THREE.Color(COLORS.SKY_HORIZON);

  gradient.addColorStop(0, `#${topColor.getHexString()}`);
  gradient.addColorStop(0.55, `#${midColor.getHexString()}`);
  gradient.addColorStop(1.0, `#${horizonColor.getHexString()}`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export function createScene(canvas: HTMLCanvasElement): SceneSetup {
  // Scene
  const scene = new THREE.Scene();

  // Sky gradient background
  const skyTexture = createSkyGradientTexture();
  scene.background = skyTexture;
  scene.fog = new THREE.Fog(COLORS.FOG, SCENE.FOG_NEAR, SCENE.FOG_FAR);

  // Camera — use canvas client dimensions for correct safe-area coverage
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(
    45,  // lower FOV = flatter, less perspective distortion on gaps
    w / h,
    0.1,
    200
  );
  camera.position.set(CAMERA.OFFSET_X, CAMERA.OFFSET_Y + 3, CAMERA.OFFSET_Z);
  camera.lookAt(0, 3, -CAMERA.LOOK_AHEAD);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Lights — warm, natural outdoor feel
  const hemisphereLight = new THREE.HemisphereLight(
    0x87CEEB, // sky color (blue light from above)
    0x4CAF50, // ground color (green bounce from below)
    0.7,
  );
  scene.add(hemisphereLight);

  const ambientLight = new THREE.AmbientLight(0xFFF8E7, 0.35);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xFFF4E0, 0.9);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  return { scene, camera, renderer };
}

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  beeY: number,
  beeZ: number,
  dt: number
): void {
  // Z follows bee exactly
  camera.position.z = beeZ + CAMERA.OFFSET_Z;

  // Y follows bee tightly with exponential damping (frame-rate independent)
  const targetY = beeY + CAMERA.OFFSET_Y;
  const smoothing = 1 - Math.exp(-CAMERA.DAMPING * dt);
  camera.position.y += (targetY - camera.position.y) * smoothing;

  // Look at a point slightly ahead and at the bee's height
  camera.lookAt(
    CAMERA.OFFSET_X,
    beeY,
    beeZ - CAMERA.LOOK_AHEAD
  );
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
