import * as THREE from "three";

export class Enemy {
  constructor(x, y, z) {
    // Enemy properties
    this.position = new THREE.Vector3(x, 1, z); // Set y to 1 to ensure they're on the floor
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.speed = 2;
    this.health = 100;
    this.damage = 10;
    this.detectionRadius = 10;
    this.attackRadius = 1.5;
    this.state = "idle"; // idle, chase, attack

    // Create enemy mesh
    this.createMesh();

    // Collision properties
    this.collider = new THREE.Sphere(this.position, 0.5);
  }

  createMesh() {
    // Create a simple enemy mesh
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.7,
      metalness: 0.3,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(this.position);

    // Add eyes to make it look more menacing
    this.addEyes();
  }

  addEyes() {
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
    });

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.2, 0.5, -0.3);
    this.mesh.add(leftEye);

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.2, 0.5, -0.3);
    this.mesh.add(rightEye);
  }

  update(deltaTime, inputHandler) {
    // Simple AI behavior
    this.updateAI(deltaTime);

    // Apply gravity
    this.velocity.y -= 9.8 * deltaTime;

    // Check if enemy is on ground
    if (this.position.y <= 1) {
      this.position.y = 1; // Keep at y=1 to stay on the floor
      this.velocity.y = 0;
    }

    // Apply velocity to position
    this.position.y += this.velocity.y * deltaTime;

    // Update mesh position and rotation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);

    // Update collider position
    this.collider.center.copy(this.position);
  }

  updateAI(deltaTime) {
    // In a real game, we would get the player position from the game state
    // For now, we'll just make the enemy move in a circle

    const time = Date.now() * 0.001;
    const radius = 5;

    // Calculate new position in a circle
    const x = Math.cos(time * 0.5) * radius;
    const z = Math.sin(time * 0.5) * radius;

    // Set target position
    const targetPosition = new THREE.Vector3(x, 1, z); // Keep y at 1

    // Calculate direction to target
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.position)
      .normalize();

    // Calculate movement
    const movement = direction.multiplyScalar(this.speed * deltaTime);

    // Apply movement to position (but preserve y)
    const oldY = this.position.y;
    this.position.add(movement);
    this.position.y = oldY; // Preserve y position to prevent falling through floor

    // Calculate rotation to face movement direction
    if (movement.length() > 0) {
      this.rotation.y = Math.atan2(movement.x, movement.z);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    console.log(`Enemy took ${amount} damage! Health: ${this.health}`);

    // Check if enemy is dead
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    // In a real game, we would remove the enemy from the game
    // For now, we'll just hide it
    this.mesh.visible = false;
    this.isDead = true;
    console.log("Enemy defeated!");
  }
}
