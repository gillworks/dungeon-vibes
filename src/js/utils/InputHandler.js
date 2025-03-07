import * as THREE from "three";

export class InputHandler {
  constructor(camera) {
    this.camera = camera;
    this.keys = {};
    this.mousePosition = new THREE.Vector2();
    this.isPointerLocked = false;
    this.movementX = 0;
    this.movementY = 0;

    // Initialize event listeners
    this.initKeyboardEvents();
    this.initMouseEvents();

    // For third-person, we don't need pointer lock
    // but we'll keep the code in case we want to switch back
    // this.initPointerLock();
  }

  initKeyboardEvents() {
    // Key down event
    window.addEventListener("keydown", (event) => {
      this.keys[event.code] = true;
    });

    // Key up event
    window.addEventListener("keyup", (event) => {
      this.keys[event.code] = false;
    });
  }

  initMouseEvents() {
    // Mouse move event
    document.addEventListener("mousemove", (event) => {
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

      if (this.isPointerLocked) {
        this.movementX = event.movementX || 0;
        this.movementY = event.movementY || 0;
      }
    });

    // Mouse click event
    document.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.keys["MouseLeft"] = true;
      }
    });

    document.addEventListener("mouseup", (event) => {
      if (event.button === 0) {
        this.keys["MouseLeft"] = false;
      }
    });
  }

  // For third-person, we don't need pointer lock
  // but we'll keep the code in case we want to switch back
  initPointerLock() {
    // Request pointer lock on canvas click
    document.addEventListener("click", () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock();
      }
    });

    // Handle pointer lock change
    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  update(deltaTime) {
    // Reset movement values after each frame
    this.movementX = 0;
    this.movementY = 0;
  }

  isKeyPressed(keyCode) {
    return this.keys[keyCode] === true;
  }

  getMovementDirection() {
    const direction = new THREE.Vector3(0, 0, 0);

    // Forward/backward
    if (this.isKeyPressed("KeyW")) direction.z -= 1;
    if (this.isKeyPressed("KeyS")) direction.z += 1;

    // Left/right
    if (this.isKeyPressed("KeyA")) direction.x -= 1;
    if (this.isKeyPressed("KeyD")) direction.x += 1;

    // Normalize the direction vector
    if (direction.length() > 0) {
      direction.normalize();
    }

    return direction;
  }

  getMouseMovement() {
    return {
      x: this.movementX,
      y: this.movementY,
    };
  }

  isAttacking() {
    return this.isKeyPressed("MouseLeft");
  }

  isJumping() {
    return this.isKeyPressed("Space");
  }

  isSprinting() {
    return this.isKeyPressed("ShiftLeft");
  }

  isInteracting() {
    return this.isKeyPressed("KeyE");
  }
}
