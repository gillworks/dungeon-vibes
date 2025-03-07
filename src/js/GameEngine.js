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

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);

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
    this.entities.push(this.player);
    this.scene.add(this.player.mesh);

    // Add some enemies
    this.addEnemies(5);

    // Update UI
    this.updateUI();
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
      const x = Math.random() * 20 - 10;
      const z = Math.random() * 20 - 10;
      const enemy = new Enemy(x, 0, z);
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
}
