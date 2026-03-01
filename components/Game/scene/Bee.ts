import * as THREE from 'three';

type WingMode = 'idle' | 'flap_once' | 'flutter' | 'dying';

export class Bee {
  mesh: THREE.Group;

  private leftWing: THREE.Mesh;
  private rightWing: THREE.Mesh;
  private body: THREE.Mesh;

  private wingMode: WingMode = 'idle';
  private wingTime = 0;
  private flapPhase = 0; // tracks flap-once progress

  private tiltTarget = 0;

  // Death animation state
  private deathTimer = 0;
  private deathStartY = 0;

  constructor() {
    this.mesh = new THREE.Group();

    // ---- Body (elongated ellipsoid) ----
    const bodyGeo = new THREE.SphereGeometry(0.35, 24, 16);
    bodyGeo.scale(1, 0.85, 1.3); // wider along Z for a plump body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      roughness: 0.5,
      metalness: 0.05,
      emissive: 0xffd54f,
      emissiveIntensity: 0.12,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.add(this.body);

    // ---- Stripes (3 dark brown rings) ----
    const stripeColor = 0x3e2723;
    const stripeMat = new THREE.MeshStandardMaterial({
      color: stripeColor,
      roughness: 0.7,
      metalness: 0.0,
    });
    const stripePositions = [-0.08, 0.08, 0.24];
    for (const zPos of stripePositions) {
      const stripeGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.045, 24, 1, true);
      // Scale to match body ellipsoid — wider in Z direction
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = Math.PI / 2; // orient ring around Z axis
      stripe.position.z = zPos;
      // Scale ring to hug the body shape at this Z position
      // Body radius at z: r = 0.35 * sqrt(1 - (z / (0.35*1.3))^2 ) approximately
      const bodyZ = 0.35 * 1.3; // half-length along Z
      const normZ = zPos / bodyZ;
      const rAtZ = 0.35 * Math.sqrt(Math.max(0, 1 - normZ * normZ));
      const rScale = (rAtZ / 0.34) * 1.01; // slightly bigger to sit on surface
      stripe.scale.set(rScale, 1, rScale * 0.85); // match Y squish
      this.mesh.add(stripe);
    }

    // ---- Head ----
    const headGeo = new THREE.SphereGeometry(0.2, 20, 14);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      roughness: 0.55,
      metalness: 0.05,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.z = -0.52; // front of body (negative Z = flying direction)
    head.position.y = 0.04;
    this.mesh.add(head);

    // ---- Eyes ----
    const eyeGeo = new THREE.SphereGeometry(0.045, 12, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.1,
    });
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.08, -0.68);
    this.mesh.add(leftEye);

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.08, -0.68);
    this.mesh.add(rightEye);

    // ---- Eye highlights (small white dots for cuteness) ----
    const highlightGeo = new THREE.SphereGeometry(0.018, 8, 6);
    const highlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
    });
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(-0.08, 0.1, -0.71);
    this.mesh.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    rightHighlight.position.set(0.12, 0.1, -0.71);
    this.mesh.add(rightHighlight);

    // ---- Wings (large, visible, bee-like) ----
    // Elliptical wing shape using a circle geometry scaled into an oval
    const wingGeo = new THREE.CircleGeometry(0.45, 16);
    wingGeo.scale(1, 0.55, 1); // oval shape: wide and shorter
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xe8f4ff,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Left wing — angled outward and forward so visible from behind
    this.leftWing = new THREE.Mesh(wingGeo, wingMat);
    this.leftWing.position.set(-0.25, 0.3, -0.05);
    this.leftWing.rotation.set(
      THREE.MathUtils.degToRad(-15),  // tilt forward slightly
      THREE.MathUtils.degToRad(-20),  // angle so face is partly toward camera
      THREE.MathUtils.degToRad(35),   // spread outward
    );
    this.mesh.add(this.leftWing);

    // Right wing — mirror of left
    this.rightWing = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
    this.rightWing.position.set(0.25, 0.3, -0.05);
    this.rightWing.rotation.set(
      THREE.MathUtils.degToRad(-15),
      THREE.MathUtils.degToRad(20),
      THREE.MathUtils.degToRad(-35),
    );
    this.mesh.add(this.rightWing);

    // ---- Stinger ----
    const stingerGeo = new THREE.ConeGeometry(0.04, 0.15, 8);
    const stingerMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.5,
      metalness: 0.1,
    });
    const stinger = new THREE.Mesh(stingerGeo, stingerMat);
    stinger.rotation.x = THREE.MathUtils.degToRad(-90); // point along +Z
    stinger.position.z = 0.52;
    this.mesh.add(stinger);

    // ---- Antennae (cute thin cylinders) ----
    const antennaGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.18, 6);
    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.6,
    });

    const leftAntenna = new THREE.Mesh(antennaGeo, antennaMat);
    leftAntenna.position.set(-0.07, 0.22, -0.6);
    leftAntenna.rotation.z = THREE.MathUtils.degToRad(20);
    leftAntenna.rotation.x = THREE.MathUtils.degToRad(-20);
    this.mesh.add(leftAntenna);

    const rightAntenna = new THREE.Mesh(antennaGeo, antennaMat);
    rightAntenna.position.set(0.07, 0.22, -0.6);
    rightAntenna.rotation.z = THREE.MathUtils.degToRad(-20);
    rightAntenna.rotation.x = THREE.MathUtils.degToRad(-20);
    this.mesh.add(rightAntenna);

    // Antenna tips (small spheres)
    const tipGeo = new THREE.SphereGeometry(0.025, 8, 6);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.5,
    });

    const leftTip = new THREE.Mesh(tipGeo, tipMat);
    leftTip.position.set(-0.1, 0.31, -0.66);
    this.mesh.add(leftTip);

    const rightTip = new THREE.Mesh(tipGeo, tipMat);
    rightTip.position.set(0.1, 0.31, -0.66);
    this.mesh.add(rightTip);
  }

  /** Single flap: wings rotate down then spring back up over ~0.15s */
  flapOnce(): void {
    this.wingMode = 'flap_once';
    this.flapPhase = 0;
  }

  /** Rapid continuous wing flapping */
  flutterFast(): void {
    this.wingMode = 'flutter';
  }

  /** Slow gentle wing oscillation */
  idle(): void {
    this.wingMode = 'idle';
  }

  /** Cute cartoon death: tumble spin, wings droop, gentle fall (1 second) */
  playDeath(): void {
    this.wingMode = 'dying';
    this.deathTimer = 0;
    this.deathStartY = this.mesh.position.y;
  }

  /** Reset all rotation and animation state after death */
  reset(): void {
    this.mesh.rotation.set(0, 0, 0);
    this.tiltTarget = 0;
    this.deathTimer = 0;
    this.wingTime = 0;
    this.flapPhase = 0;
    // Wings restored to default spread by flutterFast() call
  }

  /** Set target X-axis tilt in radians, clamped to +/- 30 degrees */
  setTiltTarget(angle: number): void {
    const limit = THREE.MathUtils.degToRad(30);
    this.tiltTarget = THREE.MathUtils.clamp(angle, -limit, limit);
  }

  /** Call each frame with delta time in seconds */
  update(dt: number): void {
    this.wingTime += dt;

    // ---- Wing animation ----
    const baseLeftZ = THREE.MathUtils.degToRad(35);
    const baseRightZ = THREE.MathUtils.degToRad(-35);

    switch (this.wingMode) {
      case 'idle': {
        // Gentle bob: +/- 20 degrees at 4 Hz — clearly visible
        const idleAngle = Math.sin(this.wingTime * 4 * Math.PI * 2) * THREE.MathUtils.degToRad(20);
        this.leftWing.rotation.z = baseLeftZ + idleAngle;
        this.rightWing.rotation.z = baseRightZ - idleAngle;
        break;
      }

      case 'flutter': {
        // Rapid buzzing: +/- 30 degrees at 14 Hz — classic bee buzz
        const flutterAngle = Math.sin(this.wingTime * 14 * Math.PI * 2) * THREE.MathUtils.degToRad(30);
        this.leftWing.rotation.z = baseLeftZ + flutterAngle;
        this.rightWing.rotation.z = baseRightZ - flutterAngle;
        break;
      }

      case 'flap_once': {
        this.flapPhase += dt;
        const flapDuration = 0.18;
        if (this.flapPhase >= flapDuration) {
          // Flap complete, return to flutter (keep buzzing during gameplay)
          this.wingMode = 'flutter';
          this.leftWing.rotation.z = baseLeftZ;
          this.rightWing.rotation.z = baseRightZ;
        } else {
          // Strong downstroke: swing down -50 degrees then spring back
          const t = this.flapPhase / flapDuration;
          const flapAngle = Math.sin(t * Math.PI) * THREE.MathUtils.degToRad(50);
          this.leftWing.rotation.z = baseLeftZ + flapAngle;
          this.rightWing.rotation.z = baseRightZ - flapAngle;
        }
        break;
      }

      case 'dying': {
        this.deathTimer += dt;
        const t = Math.min(this.deathTimer / 1.0, 1); // 0→1 over 1 second
        const easeOut = 1 - (1 - t) * (1 - t); // quadratic ease-out

        // Cartoon tumble — 2 full barrel rolls, decelerating
        this.mesh.rotation.z = easeOut * Math.PI * 4;

        // Nose tilts down as bee falls
        this.mesh.rotation.x = easeOut * THREE.MathUtils.degToRad(60);

        // Gentle fall — drop ~3 units
        this.mesh.position.y = this.deathStartY - easeOut * 3;

        // Wings droop downward — from spread to limp
        const droopAngle = THREE.MathUtils.degToRad(-70) * easeOut;
        this.leftWing.rotation.z = baseLeftZ + droopAngle;
        this.rightWing.rotation.z = baseRightZ - droopAngle;

        break;
      }
    }

    // ---- Tilt lerp (skip during death — death controls rotation directly) ----
    if (this.wingMode !== 'dying') {
      const lerpRate = 5.0;
      const lerpFactor = 1 - Math.exp(-lerpRate * dt);
      this.mesh.rotation.x = THREE.MathUtils.lerp(
        this.mesh.rotation.x,
        this.tiltTarget,
        lerpFactor,
      );
    }
  }

  /** Returns axis-aligned bounding box around the bee body (not wings) for collision detection */
  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    // Compute from the body mesh world coordinates
    this.body.updateWorldMatrix(true, false);
    box.setFromObject(this.body);
    return box;
  }
}
