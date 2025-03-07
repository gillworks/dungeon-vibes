import * as THREE from "three";
import { Player } from "./entities/Player.js";
import { DungeonGenerator } from "./world/DungeonGenerator.js";
import { InputHandler } from "./utils/InputHandler.js";
import { Enemy } from "./entities/Enemy.js";

export class GameEngine {
  constructor() {
    // Game properties
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.entities = [];
    this.player = null;
    this.health = 100;
    this.level = 1;

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Game systems
    this.inputHandler = null;
    this.dungeonGenerator = null;

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.fog = new THREE.FogExp2(0x111111, 0.05);

    // Create camera for third-person view
    this.camera = new THREE.PerspectiveCamera(
      60, // Wider field of view for third-person
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Initial camera position will be set by the player
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initialize input handler
    this.inputHandler = new InputHandler(this.camera);

    // Initialize dungeon generator
    this.dungeonGenerator = new DungeonGenerator();
    const dungeon = this.dungeonGenerator.generateDungeon(10, 10);
    this.scene.add(dungeon);

    // Add lighting
    this.addLighting();

    // Create player
    this.player = new Player(this.camera);
    // Connect player to dungeon generator for collision detection
    this.player.setDungeonGenerator(this.dungeonGenerator);
    this.entities.push(this.player);
    this.scene.add(this.player.mesh);

    // Add some enemies
    this.addEnemies(5);

    // Update UI
    this.updateUI();

    // Add debug info
    this.addDebugInfo();
  }

  addLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0xff6600, 1, 10);
    pointLight1.position.set(5, 2, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0066ff, 1, 10);
    pointLight2.position.set(-5, 2, -5);
    this.scene.add(pointLight2);
  }

  addEnemies(count) {
    for (let i = 0; i < count; i++) {
      // Generate random positions for enemies
      const x = Math.random() * 20 - 10;
      const z = Math.random() * 20 - 10;

      // Create enemy at position
      const enemy = new Enemy(x, 1, z);

      // Check if enemy position is valid (not inside a wall)
      if (
        this.dungeonGenerator.checkWallCollision(
          enemy.position,
          enemy.collider.radius
        )
      ) {
        // If enemy is inside a wall, find a valid position
        const validPosition = this.dungeonGenerator.getValidPosition(
          enemy.position,
          enemy.collider.radius
        );
        enemy.position.copy(validPosition);
        enemy.mesh.position.copy(validPosition);
      }

      this.entities.push(enemy);
      this.scene.add(enemy.mesh);
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.clock.start();
      this.gameLoop();
    }
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.gameLoop);

    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
    this.render();
  }

  update(deltaTime) {
    // Update input handler
    this.inputHandler.update(deltaTime);

    // Update all entities
    for (const entity of this.entities) {
      entity.update(deltaTime, this.inputHandler);

      // Check for collisions with player
      if (entity !== this.player && this.player.checkCollision(entity)) {
        // Handle collision (e.g., take damage)
        this.health -= 5;
        this.updateUI();

        // Game over check
        if (this.health <= 0) {
          alert("Game Over! Refresh to restart.");
          this.stop();
        }
      }
    }

    // Handle player attacks
    if (this.inputHandler.isAttacking() && this.player.attackCooldown <= 0) {
      // Check for enemies in attack range
      for (const entity of this.entities) {
        if (
          entity !== this.player &&
          entity instanceof Enemy &&
          !entity.isDead
        ) {
          if (this.player.isInAttackRange(entity)) {
            // Apply damage to enemy
            entity.takeDamage(this.player.attackDamage);

            // Visual feedback for attack
            this.createAttackEffect(entity.position);
          }
        }
      }
    }

    // Update debug info
    this.updateDebugInfo();
  }

  createAttackEffect(position) {
    // Create a simple visual effect for attacks
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });

    const effect = new THREE.Mesh(geometry, material);
    effect.position.copy(position);
    effect.position.y += 1; // Position above the ground

    this.scene.add(effect);

    // Animate the effect
    const startTime = Date.now();
    const duration = 300; // milliseconds

    const animateEffect = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        effect.scale.set(1 + progress, 1 + progress, 1 + progress);
        effect.material.opacity = 0.8 * (1 - progress);

        requestAnimationFrame(animateEffect);
      } else {
        this.scene.remove(effect);
      }
    };

    animateEffect();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  updateUI() {
    // Update health bar
    const healthFill = document.getElementById("health-fill");
    healthFill.style.width = `${this.health}%`;

    // Update stats
    document.getElementById("health-value").textContent = this.health;
    document.getElementById("level-value").textContent = this.level;
  }

  addDebugInfo() {
    // Create debug container
    const debugContainer = document.createElement("div");
    debugContainer.id = "debug-container";
    debugContainer.style.position = "absolute";
    debugContainer.style.bottom = "10px";
    debugContainer.style.left = "10px";
    debugContainer.style.color = "white";
    debugContainer.style.fontFamily = "monospace";
    debugContainer.style.fontSize = "12px";
    debugContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    debugContainer.style.padding = "5px";
    debugContainer.style.borderRadius = "5px";
    debugContainer.style.pointerEvents = "none";

    // Add debug text
    const debugText = document.createElement("div");
    debugText.id = "debug-text";
    debugContainer.appendChild(debugText);

    document.body.appendChild(debugContainer);
  }

  updateDebugInfo() {
    const debugText = document.getElementById("debug-text");
    if (debugText) {
      // Count active enemies
      const activeEnemies = this.entities.filter(
        (entity) => entity instanceof Enemy && !entity.isDead
      ).length;

      // Update debug text
      debugText.innerHTML = `
        FPS: ${Math.round(1 / this.clock.getDelta())}<br>
        Player Position: ${this.player.position.x.toFixed(
          2
        )}, ${this.player.position.y.toFixed(
        2
      )}, ${this.player.position.z.toFixed(2)}<br>
        Active Enemies: ${activeEnemies}<br>
        Attack Cooldown: ${this.player.attackCooldown.toFixed(2)}<br>
        Controls: WASD to move, Space to jump, Left Click to attack
      `;
    }
  }
}
