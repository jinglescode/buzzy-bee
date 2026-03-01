import * as THREE from 'three';

const _beeBox = new THREE.Box3();
const _obstacleBox = new THREE.Box3();

export interface Collidable {
  group: THREE.Group;
  topColumn: THREE.Mesh;
  bottomColumn: THREE.Mesh;
}

export function checkCollision(beeBBox: THREE.Box3, obstacles: Collidable[]): boolean {
  for (const obstacle of obstacles) {
    // Check top column
    _obstacleBox.setFromObject(obstacle.topColumn);
    if (beeBBox.intersectsBox(_obstacleBox)) {
      return true;
    }

    // Check bottom column
    _obstacleBox.setFromObject(obstacle.bottomColumn);
    if (beeBBox.intersectsBox(_obstacleBox)) {
      return true;
    }
  }
  return false;
}
