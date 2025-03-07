import * as THREE from "three";

export class Player {
  constructor(camera) {
    // Player properties
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.speed = 5;
    this.jumpForce = 10;
    this.gravity = 20;
    this.isOnGround = true;
    this.camera = camera;

    // Third-person camera settings
    this.cameraOffset = new THREE.Vector3(0, 8, 12); // Position camera above and behind player
    this.cameraLookOffset = new THREE.Vector3(0, 0, -5); // Look ahead of the player
    this.cameraRotation = new THREE.Euler(-Math.PI / 4, 0, 0, "YXZ"); // Look down at an angle

    this.attackCooldown = 0;
    this.attackRate = 0.5; // seconds between attacks

    // Create player mesh
    this.createMesh();

    // Collision properties
    this.collider = new THREE.Sphere(this.position, 0.5);
  }

  createMesh() {
    // Create a simple character mesh
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.7,
      metalness: 0.3,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(this.position);

    // Add a weapon to the player
    this.addWeapon();
  }

  addWeapon() {
    const swordGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
    const swordMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.5,
      metalness: 0.8,
    });

    this.weapon = new THREE.Mesh(swordGeometry, swordMaterial);
    this.weapon.position.set(0.5, 0, 0.5);
    this.weapon.rotation.set(0, 0, -Math.PI / 4);
    this.mesh.add(this.weapon);
  }

  update(deltaTime, inputHandler) {
    // Handle player rotation from keyboard input (not mouse for third-person)
    this.handleRotation(deltaTime, inputHandler);

    // Handle player movement from keyboard input
    this.handleMovement(deltaTime, inputHandler);

    // Handle jumping
    this.handleJumping(deltaTime, inputHandler);

    // Handle attacking
    this.handleAttacking(deltaTime, inputHandler);

    // Update camera position to follow player in third-person
    this.updateCamera();

    // Update collider position
    this.collider.center.copy(this.position);
  }

  handleRotation(deltaTime, inputHandler) {
    // For third-person, we'll rotate the player based on movement direction
    // instead of mouse movement
    const direction = inputHandler.getMovementDirection();

    if (direction.length() > 0) {
      // Calculate the target rotation based on movement direction
      const targetRotation = Math.atan2(direction.x, direction.z);

      // Smoothly rotate towards the target rotation
      const rotationSpeed = 10;
      const angleDiff = targetRotation - this.rotation.y;

      // Normalize angle difference to [-PI, PI]
      const normalizedAngleDiff =
        ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;

      // Apply smooth rotation
      this.rotation.y +=
        normalizedAngleDiff * Math.min(rotationSpeed * deltaTime, 1);

      // Apply rotation to mesh
      this.mesh.rotation.y = this.rotation.y;
    }
  }

  handleMovement(deltaTime, inputHandler) {
    // Get movement direction from input
    const direction = inputHandler.getMovementDirection();

    // Apply movement in the direction the player is facing
    const moveSpeed = inputHandler.isSprinting()
      ? this.speed * 1.5
      : this.speed;

    // Create a movement vector
    const movement = new THREE.Vector3();

    // Forward/backward movement
    if (direction.z !== 0) {
      movement.z = direction.z;
    }

    // Left/right movement
    if (direction.x !== 0) {
      movement.x = direction.x;
    }

    // For third-person, we want to move relative to the camera's orientation
    // Get camera's horizontal rotation (y-axis)
    const cameraYRotation = this.camera.rotation.y;

    // Apply camera rotation to movement vector
    movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYRotation);

    // Scale by speed and delta time
    movement.multiplyScalar(moveSpeed * deltaTime);

    // Apply movement to position
    this.position.add(movement);

    // Update mesh position
    this.mesh.position.copy(this.position);

    // If we're moving, rotate the player to face the movement direction
    if (movement.length() > 0) {
      const targetRotation = Math.atan2(movement.x, movement.z);
      this.rotation.y = targetRotation;
      this.mesh.rotation.y = this.rotation.y;
    }
  }

  handleJumping(deltaTime, inputHandler) {
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;

    // Check if player is on ground
    if (this.position.y <= 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    // Jump if on ground and jump key pressed
    if (this.isOnGround && inputHandler.isJumping()) {
      this.velocity.y = this.jumpForce;
      this.isOnGround = false;
    }

    // Apply velocity to position
    this.position.y += this.velocity.y * deltaTime;

    // Update mesh position
    this.mesh.position.copy(this.position);
  }

  handleAttacking(deltaTime, inputHandler) {
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Check if player is attacking
    if (inputHandler.isAttacking() && this.attackCooldown <= 0) {
      // Perform attack
      this.attack();

      // Reset cooldown
      this.attackCooldown = this.attackRate;
    }
  }

  attack() {
    // Simple attack animation
    const attackAnimation = new THREE.AnimationClip("attack", 0.5, [
      new THREE.VectorKeyframeTrack(
        ".rotation[z]",
        [0, 0.25, 0.5],
        [-Math.PI / 4, Math.PI / 2, -Math.PI / 4]
      ),
    ]);

    // Play attack animation
    const mixer = new THREE.AnimationMixer(this.weapon);
    const action = mixer.clipAction(attackAnimation);
    action.setLoop(THREE.LoopOnce);
    action.play();

    // Update mixer in game loop
    const updateMixer = (deltaTime) => {
      mixer.update(deltaTime);

      if (action.time >= action.getClip().duration) {
        // Animation complete, remove update callback
        this.onUpdate = null;
      }
    };

    // Set update callback
    this.onUpdate = updateMixer;
  }

  updateCamera() {
    // Position camera relative to player for third-person view
    // Calculate camera position based on player position and offset
    const cameraPosition = new THREE.Vector3()
      .copy(this.position)
      .add(this.cameraOffset);

    // Set camera position
    this.camera.position.copy(cameraPosition);

    // Calculate target position (where the camera should look)
    const targetPosition = new THREE.Vector3()
      .copy(this.position)
      .add(this.cameraLookOffset);

    // Make camera look at the player
    this.camera.lookAt(targetPosition);
  }

  checkCollision(entity) {
    // Simple sphere-sphere collision detection
    if (entity.collider) {
      const distance = this.position.distanceTo(entity.position);
      return distance < this.collider.radius + entity.collider.radius;
    }
    return false;
  }
}
