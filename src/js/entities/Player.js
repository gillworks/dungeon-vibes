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
    this.cameraOffset = new THREE.Vector3(0, 1.6, 0);
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
    // Handle player rotation from mouse movement
    this.handleRotation(inputHandler);

    // Handle player movement from keyboard input
    this.handleMovement(deltaTime, inputHandler);

    // Handle jumping
    this.handleJumping(deltaTime, inputHandler);

    // Handle attacking
    this.handleAttacking(deltaTime, inputHandler);

    // Update camera position to follow player
    this.updateCamera();

    // Update collider position
    this.collider.center.copy(this.position);
  }

  handleRotation(inputHandler) {
    if (inputHandler.isPointerLocked) {
      const mouseSensitivity = 0.002;
      const mouseMovement = inputHandler.getMouseMovement();

      // Update rotation based on mouse movement
      this.rotation.y -= mouseMovement.x * mouseSensitivity;
      this.rotation.x -= mouseMovement.y * mouseSensitivity;

      // Clamp vertical rotation to avoid flipping
      this.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.rotation.x)
      );

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

    // Forward/backward movement (in the direction the player is facing)
    if (direction.z !== 0) {
      movement.z = direction.z;
    }

    // Left/right movement (perpendicular to the direction the player is facing)
    if (direction.x !== 0) {
      movement.x = direction.x;
    }

    // Apply rotation to movement vector
    movement.applyEuler(new THREE.Euler(0, this.rotation.y, 0));

    // Scale by speed and delta time
    movement.multiplyScalar(moveSpeed * deltaTime);

    // Apply movement to position
    this.position.add(movement);

    // Update mesh position
    this.mesh.position.copy(this.position);
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
    // Position camera relative to player
    this.camera.position.copy(this.position).add(this.cameraOffset);

    // Set camera rotation to match player rotation
    this.camera.rotation.copy(this.rotation);
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
