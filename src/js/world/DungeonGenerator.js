import * as THREE from "three";

export class DungeonGenerator {
  constructor() {
    this.tileSize = 2;
    this.wallHeight = 3;
    this.materials = {
      floor: new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.2,
      }),
      wall: new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.6,
        metalness: 0.1,
        bumpScale: 0.02,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.9,
        metalness: 0.0,
      }),
    };

    // Store wall positions for collision detection
    this.walls = [];
  }

  generateDungeon(width, height) {
    // Create a group to hold all dungeon elements
    const dungeon = new THREE.Group();

    // Generate a simple dungeon layout (2D grid)
    const layout = this.generateLayout(width, height);

    // Create 3D dungeon from layout
    this.createDungeonMesh(dungeon, layout, width, height);

    return dungeon;
  }

  generateLayout(width, height) {
    // 0 = empty, 1 = wall, 2 = floor
    const layout = [];

    // Initialize with walls
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        // Border walls
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          row.push(1); // Wall
        } else {
          row.push(2); // Floor
        }
      }
      layout.push(row);
    }

    // Add some random walls
    const wallCount = Math.floor(width * height * 0.1);
    for (let i = 0; i < wallCount; i++) {
      const x = Math.floor(Math.random() * (width - 2)) + 1;
      const y = Math.floor(Math.random() * (height - 2)) + 1;
      layout[y][x] = 1;
    }

    // Ensure there's a path from the center to the edges
    this.ensurePath(layout, width, height);

    return layout;
  }

  ensurePath(layout, width, height) {
    // Simple implementation: just clear a cross in the middle
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // Horizontal path
    for (let x = 1; x < width - 1; x++) {
      layout[centerY][x] = 2;
    }

    // Vertical path
    for (let y = 1; y < height - 1; y++) {
      layout[y][centerX] = 2;
    }
  }

  createDungeonMesh(dungeon, layout, width, height) {
    // Clear previous walls
    this.walls = [];

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(
      width * this.tileSize,
      height * this.tileSize
    );
    const floor = new THREE.Mesh(floorGeometry, this.materials.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(
      (width * this.tileSize) / 2 - this.tileSize / 2,
      0,
      (height * this.tileSize) / 2 - this.tileSize / 2
    );
    floor.receiveShadow = true;
    dungeon.add(floor);

    // Create ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(
      width * this.tileSize,
      height * this.tileSize
    );
    const ceiling = new THREE.Mesh(ceilingGeometry, this.materials.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(
      (width * this.tileSize) / 2 - this.tileSize / 2,
      this.wallHeight,
      (height * this.tileSize) / 2 - this.tileSize / 2
    );
    dungeon.add(ceiling);

    // Create walls
    const wallGeometry = new THREE.BoxGeometry(
      this.tileSize,
      this.wallHeight,
      this.tileSize
    );

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (layout[y][x] === 1) {
          const wall = new THREE.Mesh(wallGeometry, this.materials.wall);
          wall.position.set(
            x * this.tileSize,
            this.wallHeight / 2,
            y * this.tileSize
          );
          wall.castShadow = true;
          wall.receiveShadow = true;
          dungeon.add(wall);

          // Store wall position for collision detection
          this.walls.push({
            x: x * this.tileSize,
            z: y * this.tileSize,
            size: this.tileSize,
          });
        }
      }
    }

    // Add some decorations
    this.addDecorations(dungeon, layout, width, height);

    return dungeon;
  }

  addDecorations(dungeon, layout, width, height) {
    // Add some torches
    const torchCount = Math.floor(width * height * 0.05);
    const torchGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const torchMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1,
    });

    for (let i = 0; i < torchCount; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Only place torches on walls
      if (layout[y][x] === 1) {
        const torch = new THREE.Mesh(torchGeometry, torchMaterial);
        torch.position.set(
          x * this.tileSize,
          this.wallHeight / 2,
          y * this.tileSize
        );

        // Rotate torch to stick out from wall
        torch.rotation.z = Math.PI / 2;
        torch.position.x += 0.3; // Offset from wall

        dungeon.add(torch);

        // Add torch light
        const torchLight = new THREE.PointLight(0xff6600, 1, 5);
        torchLight.position.set(
          x * this.tileSize + 0.5,
          this.wallHeight / 2,
          y * this.tileSize
        );
        dungeon.add(torchLight);

        // Add flame effect (simple particle)
        const flameGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.8,
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(
          x * this.tileSize + 0.5,
          this.wallHeight / 2 + 0.2,
          y * this.tileSize
        );

        // Animate flame
        const flameAnimation = () => {
          flame.scale.x = 0.8 + Math.random() * 0.4;
          flame.scale.y = 0.8 + Math.random() * 0.4;
          flame.scale.z = 0.8 + Math.random() * 0.4;

          requestAnimationFrame(flameAnimation);
        };
        flameAnimation();

        dungeon.add(flame);
      }
    }
  }

  // Check if a position collides with any wall
  checkWallCollision(position, radius) {
    for (const wall of this.walls) {
      // Calculate the closest point on the wall to the position
      const closestX = Math.max(
        wall.x - wall.size / 2,
        Math.min(position.x, wall.x + wall.size / 2)
      );
      const closestZ = Math.max(
        wall.z - wall.size / 2,
        Math.min(position.z, wall.z + wall.size / 2)
      );

      // Calculate the distance between the closest point and the position
      const distance = Math.sqrt(
        (closestX - position.x) * (closestX - position.x) +
          (closestZ - position.z) * (closestZ - position.z)
      );

      // If the distance is less than the radius, there is a collision
      if (distance < radius) {
        return true;
      }
    }

    return false;
  }

  // Get a safe position away from walls
  getValidPosition(position, radius) {
    // If there's no collision, return the original position
    if (!this.checkWallCollision(position, radius)) {
      return position.clone();
    }

    // Try to find a safe position by moving away from walls
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(1, 0, 1).normalize(),
      new THREE.Vector3(1, 0, -1).normalize(),
      new THREE.Vector3(-1, 0, 1).normalize(),
      new THREE.Vector3(-1, 0, -1).normalize(),
    ];

    for (const direction of directions) {
      for (let distance = 0.1; distance <= radius * 2; distance += 0.1) {
        const testPosition = position
          .clone()
          .add(direction.clone().multiplyScalar(distance));
        if (!this.checkWallCollision(testPosition, radius)) {
          return testPosition;
        }
      }
    }

    // If no safe position is found, return the original position
    return position.clone();
  }
}
