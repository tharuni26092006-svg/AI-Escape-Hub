import * as THREE from 'three';
import { AvatarMesh } from './AvatarMesh';
import { EscapeRoomBuilder, EscapeRoomEnvironment } from './EscapeRoomBuilder';
import { sound } from '../services/soundEngine';
import { AvatarCustomization, GameId, InteractiveObjectData, LevelId } from '../types';

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public roomBuilder: EscapeRoomBuilder;
  public roomEnv: EscapeRoomEnvironment;
  public playerAvatar: AvatarMesh;
  public currentLevel: LevelId = 1;
  public currentGame: GameId = 'agent_academy';

  // Third-person camera orbit
  public cameraTarget: THREE.Vector3 = new THREE.Vector3();
  public cameraDistance: number = 4.8;
  public cameraYaw: number = Math.PI; // Face north (-Z) by default
  public cameraPitch: number = 0.35;
  private isMouseDown: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;

  // Player Physics & Movement
  public playerPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 2);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  public isControlsLocked: boolean = false;
  public playerRadius: number = 0.42;

  // Roblox Physics & Precision Jump Mechanics
  private jumpBufferTimer: number = 0;
  private coyoteTimer: number = 0;
  private landingBounceTimer: number = 0;
  private wasGrounded: boolean = true;

  // Active Nearby Interactive Prop
  public nearbyObject: (InteractiveObjectData & { mesh?: THREE.Object3D; hitRadius: number }) | null = null;

  // Input states
  public keys: { [key: string]: boolean } = {};
  public virtualMovement: { x: number; z: number } = { x: 0, z: 0 };

  // Callbacks to React App
  public onNearbyObjectChange?: (obj: InteractiveObjectData | null) => void;
  public onTriggerInteract?: (obj: InteractiveObjectData) => void;
  public onCoinCollected?: (amount: number) => void;
  public onWinReached?: () => void;
  public onLaserTripped?: (laserName?: string) => void;
  public onTargetReached?: () => void;
  public onDecisionCircleStep?: (nodeId: string) => void;
  public activeEnteredCircleNodeId: string | null = null;
  public onPlayerPositionChange?: (pos: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    avatarRotationY: number;
  }) => void;

  // Search Maze state
  public isBfsTargetDiscovered: boolean = false;
  public isTargetReached: boolean = false;
  public isLevelExitCrossed: boolean = false;

  // Room animation references
  public isVaultOpening: boolean = false;
  public vaultOpenProgress: number = 0;
  public isPowerOn: boolean = false;
  public isLasersDisabled: boolean = false;
  public currentCheckpoint: THREE.Vector3 = new THREE.Vector3(0, 0, 14.0);
  public laserTripCooldown: number = 0;
  private clockTime: number = 0;

  // Particles
  private particleGroup: THREE.Group = new THREE.Group();

  // Animation frame
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    container: HTMLElement,
    customization: AvatarCustomization,
    initialLevel: LevelId = 1,
    initialGame: GameId = 'agent_academy'
  ) {
    this.container = container;
    this.currentLevel = initialLevel;
    this.currentGame = initialGame;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.updateSceneBackground(initialLevel);

    // 2. Camera setup
    const initialWidth = container.clientWidth || window.innerWidth || 800;
    const initialHeight = container.clientHeight || window.innerHeight || 600;
    const aspect = initialWidth / initialHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(initialWidth, initialHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    // 4. Build Escape Room Environment for Level
    this.roomBuilder = new EscapeRoomBuilder(this.scene);
    this.roomEnv = this.roomBuilder.buildGameLevel(this.currentGame, this.currentLevel);

    // Set spawn point based on game & level
    if (this.currentGame === 'heuristic_chamber') {
      this.playerPosition.set(-13.0, 0, 0);
      this.currentCheckpoint.set(-13.0, 0, 0);
      this.cameraYaw = -Math.PI / 2; // Face East (+X) towards the nodes and chamber
      this.cameraPitch = 0.26;
      this.cameraDistance = 4.2;
    } else if (this.currentGame === 'search_maze') {
      if (this.currentLevel === 5) {
        this.playerPosition.set(-16.8, 0, 0);
        this.currentCheckpoint.set(-16.8, 0, 0);
        this.cameraYaw = -Math.PI / 2; // Face East down the labyrinth corridor
        this.cameraPitch = 0.55;
        this.cameraDistance = 4.0;
      } else if (this.currentLevel === 4) {
        this.playerPosition.set(-16, 0, 0);
        this.currentCheckpoint.set(-16, 0, 0);
        this.cameraYaw = -Math.PI / 2; // Face East down the room towards nodes
      } else if (this.currentLevel === 3) {
        this.playerPosition.set(-13, 0, 0);
        this.currentCheckpoint.set(-13, 0, 0);
        this.cameraYaw = -Math.PI / 2; // Face East down the room towards nodes
      } else if (this.currentLevel === 2) {
        this.playerPosition.set(-8, 0, 0);
        this.currentCheckpoint.set(-8, 0, 0);
        this.cameraYaw = -Math.PI / 2; // Face East down the corridor
      } else {
        this.playerPosition.set(-4, 0, 4);
        this.currentCheckpoint.set(-4, 0, 4);
        this.cameraYaw = 0;
      }
    } else if (this.currentLevel === 5) {
      this.playerPosition.set(0, 0, 14.0);
      this.currentCheckpoint.set(0, 0, 14.0);
      this.cameraYaw = 0;
    } else {
      this.playerPosition.set(0, 0, 3.0);
      this.currentCheckpoint.set(0, 0, 3.0);
      this.cameraYaw = Math.PI;
    }

    // 5. Player Avatar (Spawn near center carpet facing north)
    this.playerAvatar = new AvatarMesh(customization);
    this.playerAvatar.group.position.copy(this.playerPosition);
    this.playerAvatar.group.rotation.y = 0;

    // Personal lantern light so the corridor & walking path are always crystal clear
    const avatarLantern = new THREE.PointLight(0xfff7ed, 2.0, 10);
    avatarLantern.position.set(0, 1.8, 0);
    this.playerAvatar.group.add(avatarLantern);

    this.scene.add(this.playerAvatar.group);
    this.scene.add(this.particleGroup);

    // 6. Setup Listeners
    this.setupEventListeners();

    requestAnimationFrame(() => {
      this.handleResize();
    });

    // 7. Start Game Loop
    this.animate();
  }

  private updateSceneBackground(level: LevelId) {
    if (this.currentGame === 'heuristic_chamber') {
      this.scene.background = new THREE.Color(0x070b14);
      return;
    }
    if (this.currentGame === 'search_maze') {
      if (level === 4) {
        this.scene.background = new THREE.Color(0xf8fafc);
      } else {
        this.scene.background = new THREE.Color(0x060c18);
      }
      return;
    }
    if (level === 1) {
      this.scene.background = new THREE.Color(0x0f172a);
    } else if (level === 2) {
      this.scene.background = new THREE.Color(0x030712);
    } else if (level === 3) {
      this.scene.background = new THREE.Color(0x0a1026);
    } else if (level === 4) {
      this.scene.background = new THREE.Color(0x0f172a);
    } else {
      this.scene.background = new THREE.Color(0x090a14);
    }
  }

  public loadLevel(levelId: LevelId, gameId?: GameId) {
    this.currentLevel = levelId;
    if (gameId) {
      this.currentGame = gameId;
    }
    this.isVaultOpening = false;
    this.vaultOpenProgress = 0;
    this.isPowerOn = false;
    this.isLasersDisabled = false;
    this.laserTripCooldown = 0;
    this.nearbyObject = null;
    if (this.onNearbyObjectChange) {
      this.onNearbyObjectChange(null);
    }

    // Clear existing room meshes from scene (except player & particles)
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.children.forEach((child) => {
      if (child !== this.playerAvatar.group && child !== this.particleGroup) {
        objectsToRemove.push(child);
      }
    });

    objectsToRemove.forEach((obj) => {
      this.scene.remove(obj);
    });

    this.updateSceneBackground(levelId);

    // Build new level environment
    this.roomEnv = this.roomBuilder.buildGameLevel(this.currentGame, levelId);

    // Reset player position & camera based on level and game
    if (this.currentGame === 'heuristic_chamber') {
      this.currentCheckpoint.set(-13.0, 0, 0);
      this.playerPosition.set(-13.0, 0, 0);
      this.playerVelocity.set(0, 0, 0);
      this.isGrounded = true;
      this.cameraYaw = -Math.PI / 2; // Face East (+X) towards the nodes and chamber
      this.cameraPitch = 0.26;
      this.cameraDistance = 4.2;
    } else if (this.currentGame === 'search_maze') {
      if (levelId === 5) {
        this.currentCheckpoint.set(-16.8, 0, 0);
        this.playerPosition.set(-16.8, 0, 0);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.cameraYaw = -Math.PI / 2; // Face East (+X) into the labyrinth corridor
        this.cameraPitch = 0.42;
        this.cameraDistance = 4.2;
      } else if (levelId === 4) {
        this.currentCheckpoint.set(-16, 0, 0);
        this.playerPosition.set(-16, 0, 0);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.cameraYaw = -Math.PI / 2; // Face East (+X) down the room towards nodes
        this.cameraPitch = 0.32;
        this.cameraDistance = 4.8;
      } else if (levelId === 3) {
        this.currentCheckpoint.set(-13, 0, 0);
        this.playerPosition.set(-13, 0, 0);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.cameraYaw = -Math.PI / 2; // Face East (+X) down the room towards nodes
        this.cameraPitch = 0.32;
        this.cameraDistance = 4.8;
      } else if (levelId === 2) {
        this.currentCheckpoint.set(-8, 0, 0);
        this.playerPosition.set(-8, 0, 0);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.cameraYaw = -Math.PI / 2; // Face East (+X) down the branching corridor
        this.cameraPitch = 0.32;
        this.cameraDistance = 4.8;
      } else {
        this.currentCheckpoint.set(-4, 0, 4);
        this.playerPosition.set(-4, 0, 4);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.cameraYaw = 0;
        this.cameraPitch = 0.35;
        this.cameraDistance = 4.8;
      }
    } else if (levelId === 5) {
      this.currentCheckpoint.set(0, 0, 14.0);
      this.playerPosition.set(0, 0, 14.0);
      this.playerVelocity.set(0, 0, 0);
      this.isGrounded = true;
      this.cameraYaw = 0; // Face North (-Z) looking down the corridor
      this.cameraPitch = 0.28;
      this.cameraDistance = 4.8;
    } else {
      this.currentCheckpoint.set(0, 0, 3.0);
      this.playerPosition.set(0, 0, 3.0);
      this.playerVelocity.set(0, 0, 0);
      this.isGrounded = true;
      this.cameraYaw = Math.PI;
      this.cameraPitch = 0.35;
      this.cameraDistance = 4.8;
    }

    this.playerAvatar.group.position.copy(this.playerPosition);
    this.playerAvatar.group.rotation.y = levelId === 5 ? Math.PI : 0;
  }

  public setCheckpoint(pos: [number, number, number]) {
    this.currentCheckpoint.set(pos[0], pos[1], pos[2]);
    this.spawnParticles(this.currentCheckpoint.clone(), 0x10b981, 20);
    sound.playAccessGranted();
  }

  // ==========================================
  // 3D COLLISION DETECTION
  // ==========================================
  public checkCollisionAt(x: number, z: number, radius: number = this.playerRadius): boolean {
    const minX = x - radius;
    const maxX = x + radius;
    const minZ = z - radius;
    const maxZ = z + radius;
    const minY = 0.1;
    const maxY = 1.6;

    const playerBox = new THREE.Box3(
      new THREE.Vector3(minX, minY, minZ),
      new THREE.Vector3(maxX, maxY, maxZ)
    );

    // Check intersection with all registered solid colliders (walls, desks, servers, pillars, etc.)
    for (const collider of this.roomEnv.colliders) {
      if (collider.intersectsBox(playerBox)) {
        return true;
      }
    }

    // Heuristic Chamber specific room bounds (Room size: 38m x 22m, X: -16.5 to +21.5, Z: -11 to +11)
    if (this.currentGame === 'heuristic_chamber') {
      const minX = -16.0;
      const maxX = 21.0;
      const minZ = -10.4;
      const maxZ = 10.4;

      if (x < minX) return true;
      if (z < minZ || z > maxZ) return true;

      // East exit doorway at x = 20.4 between z = -2.5 and 2.5
      if (this.isVaultOpening || this.isLevelExitCrossed || this.isTargetReached) {
        if (Math.abs(z) < 2.5) {
          if (x > 26.0) return true;
          return false;
        } else {
          if (x > maxX) return true;
        }
      } else {
        if (x > 20.4) return true;
      }
      return false;
    }

    // Search Maze specific room bounds
    if (this.currentGame === 'search_maze') {
      if (this.currentLevel === 5) {
        // Level 5 bounds: W = 48, D = 34 -> x in [-23.4, 23.4], z in [-15.4, 15.4]
        const minX = -23.4;
        const maxX = 23.4;
        const minZ = -15.4;
        const maxZ = 15.4;

        if (x < minX) return true;
        if (z < minZ || z > maxZ) return true;

        // East exit doorway at x = 20.0+ between z = -2.8 and 2.8
        if (this.isVaultOpening || this.isTargetReached || this.isBfsTargetDiscovered) {
          if (Math.abs(z) < 2.8) {
            if (x > 26.5) return true;
            return false;
          } else {
            if (x > maxX) return true;
          }
        } else {
          if (x > 20.2) return true;
        }
        return false;
      } else if (this.currentLevel === 4) {
        // Level 4 bounds: W = 44, D = 34 -> x in [-21.4, 21.4], z in [-16.4, 16.4]
        const minX = -21.4;
        const maxX = 21.4;
        const minZ = -16.4;
        const maxZ = 16.4;

        if (x < minX) return true;
        if (z < minZ || z > maxZ) return true;

        // East exit doorway at x = 20.0 between z = -2.6 and 2.6
        if (this.isVaultOpening || this.isTargetReached || this.isBfsTargetDiscovered) {
          if (Math.abs(z) < 2.6) {
            if (x > 26.5) return true;
            return false;
          } else {
            if (x > maxX) return true;
          }
        } else {
          if (x > 19.4) return true;
        }
        return false;
      } else if (this.currentLevel === 3) {
        // Level 3 bounds: W = 36, D = 28 -> x in [-17.4, 17.4], z in [-13.4, 13.4]
        const minX = -17.4;
        const maxX = 17.4;
        const minZ = -13.4;
        const maxZ = 13.4;

        if (x < minX) return true;
        if (z < minZ || z > maxZ) return true;

        // East exit doorway at x = 16.5 between z = -2.6 and 2.6
        if (this.isVaultOpening || this.isTargetReached || this.isBfsTargetDiscovered) {
          if (Math.abs(z) < 2.6) {
            if (x > 22.0) return true;
            return false;
          } else {
            if (x > maxX) return true;
          }
        } else {
          if (x > 16.0) return true;
        }
        return false;
      } else if (this.currentLevel === 2) {
        // Level 2 bounds: W = 32, D = 22 -> x in [-15.4, 15.4], z in [-10.4, 10.4]
        const minX = -15.4;
        const maxX = 15.4;
        const minZ = -10.4;
        const maxZ = 10.4;

        if (x < minX) return true;
        if (z < minZ || z > maxZ) return true;

        // East exit doorway at x = 14.5 between z = -2.2 and 2.2
        if (this.isVaultOpening || this.isTargetReached) {
          if (Math.abs(z) < 2.2) {
            if (x > 16.5) return true;
            return false;
          } else {
            if (x > maxX) return true;
          }
        } else {
          if (x > 13.6) return true;
        }
        return false;
      } else {
        const minX = -11.4;
        const maxX = 11.4;
        const maxZ = 11.4;
        if (x < minX || x > maxX) return true;
        if (z > maxZ) return true;

        // North exit threshold at z = -10.8 to -11.5
        if (this.isVaultOpening || this.isTargetReached) {
          // Doorway is open, allow walking straight through gateway doorway between -2.2 and 2.2
          if (Math.abs(x) < 2.2) {
            if (z < -13.0) return true;
            return false;
          } else {
            if (z < -11.4) return true;
          }
        } else {
          // Door is closed: stop in front of doorway
          if (z < -10.8) return true;
        }
        return false;
      }
    }

    // Dynamic Room Wall Boundaries based on current level dimensions
    const roomBounds = {
      1: { minX: -11.4, maxX: 11.4, minZ: -9.4, maxZ: 9.4 },
      2: { minX: -12.4, maxX: 12.4, minZ: -10.4, maxZ: 10.4 },
      3: { minX: -11.4, maxX: 11.4, minZ: -9.4, maxZ: 9.4 },
      4: { minX: -13.4, maxX: 13.4, minZ: -11.4, maxZ: 11.4 },
      5: { minX: -7.5, maxX: 7.5, minZ: -18.8, maxZ: 18.8 },
    }[this.currentLevel] || { minX: -11.4, maxX: 11.4, minZ: -9.4, maxZ: 9.4 };

    if (x < roomBounds.minX || x > roomBounds.maxX) {
      return true;
    }

    // Level 5 specific corridor bounds (North is exit at -18, South is start at +18)
    if (this.currentLevel === 5) {
      if (z > roomBounds.maxZ) return true;
      if (!this.isVaultOpening && z < -17.2) return true;
      if (this.isVaultOpening && z < -19.5) return true;
      return false;
    }

    if (z < roomBounds.minZ) {
      return true;
    }

    // If exit door is closed, don't allow walking past south wall
    if (!this.isVaultOpening && z > roomBounds.maxZ) {
      return true;
    }

    return false;
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.container.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('wheel', this.handleWheel, { passive: true });

    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    window.addEventListener('resize', this.handleResize);

    // Ensure clicking canvas focuses window for keyboard input
    this.container.addEventListener('pointerdown', () => {
      window.focus();
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.isMouseDown = true;
      this.previousMouseX = e.touches[0].clientX;
      this.previousMouseY = e.touches[0].clientY;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isMouseDown || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - this.previousMouseX;
    const deltaY = e.touches[0].clientY - this.previousMouseY;

    this.cameraYaw -= deltaX * 0.007;
    this.cameraPitch += deltaY * 0.007;
    this.cameraPitch = Math.max(0.08, Math.min(Math.PI / 2.2, this.cameraPitch));

    this.previousMouseX = e.touches[0].clientX;
    this.previousMouseY = e.touches[0].clientY;
  };

  private handleTouchEnd = () => {
    this.isMouseDown = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code) this.keys[e.code] = true;
    if (e.key) {
      this.keys[e.key] = true;
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.key.toUpperCase()] = true;
    }

    // Press E / Enter to interact with nearby puzzle object
    const isInteract =
      e.code === 'KeyE' ||
      e.key === 'e' ||
      e.key === 'E' ||
      e.code === 'Enter' ||
      e.key === 'Enter';

    if (isInteract && this.nearbyObject) {
      if (this.onTriggerInteract) {
        this.onTriggerInteract(this.nearbyObject);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code) this.keys[e.code] = false;
    if (e.key) {
      this.keys[e.key] = false;
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.key.toUpperCase()] = false;
    }
  };

  public setVirtualMovement(x: number, z: number) {
    this.virtualMovement.x = x;
    this.virtualMovement.z = z;
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.isMouseDown = true;
    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isMouseDown) return;

    const deltaX = e.clientX - this.previousMouseX;
    const deltaY = e.clientY - this.previousMouseY;

    this.cameraYaw -= deltaX * 0.006;
    this.cameraPitch += deltaY * 0.006;
    this.cameraPitch = Math.max(0.08, Math.min(Math.PI / 2.2, this.cameraPitch));

    this.previousMouseX = e.clientX;
    this.previousMouseY = e.clientY;
  };

  private handleMouseUp = () => {
    this.isMouseDown = false;
  };

  private handleWheel = (e: WheelEvent) => {
    this.cameraDistance += e.deltaY * 0.008;
    this.cameraDistance = Math.max(2.2, Math.min(10.0, this.cameraDistance));
  };

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setCustomization(custom: AvatarCustomization) {
    this.playerAvatar.updateCustomization(custom);
  }

  public jump() {
    if (this.isControlsLocked) return;

    // Roblox Precise Jump Impulse: Snappy upward velocity with coyote time grace period
    if (this.isGrounded || this.coyoteTimer > 0) {
      this.playerVelocity.y = 10.5; // Classic Roblox jump vertical velocity
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      sound.playJump();
      this.spawnParticles(this.playerPosition.clone().add(new THREE.Vector3(0, 0.05, 0)), 0xffffff, 6);
    } else {
      // Buffer the jump command so timing feels 100% responsive and never gets eaten
      this.jumpBufferTimer = 0.16;
    }
  }

  public interactCurrent() {
    if (this.nearbyObject && this.onTriggerInteract) {
      this.onTriggerInteract(this.nearbyObject);
    }
  }

  public removeCollectible(id: string) {
    const idx = this.roomEnv.interactiveObjects.findIndex((o) => o.id === id);
    if (idx !== -1) {
      const obj = this.roomEnv.interactiveObjects[idx];
      this.scene.remove(obj.mesh);
      this.roomEnv.interactiveObjects.splice(idx, 1);
      this.spawnParticles(new THREE.Vector3(...obj.position), 0xfbbf24, 16);
      sound.playCoin();
    }
  }

  public restorePower() {
    this.isPowerOn = true;
    sound.playElectricHum();
    if (this.roomBuilder.breakerGlowLight) {
      this.roomBuilder.breakerGlowLight.color.setHex(0x10b981);
      this.roomBuilder.breakerGlowLight.intensity = 1.5;
    }
  }

  public deactivateLasers() {
    this.isLasersDisabled = true;
    if (this.roomEnv.laserBeams) {
      this.scene.remove(this.roomEnv.laserBeams);
    }
    if (this.roomEnv.dynamicLasers) {
      this.roomEnv.dynamicLasers.forEach((l) => {
        if (l.glowMesh && l.glowMesh.material) {
          (l.glowMesh.material as THREE.MeshStandardMaterial).opacity = 0.05;
          (l.glowMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x10b981);
          (l.glowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        }
      });
    }
    sound.playAccessGranted();
  }

  public openVault() {
    this.isVaultOpening = true;
    this.isTargetReached = true;
    this.isBfsTargetDiscovered = true;
    sound.playVaultDoor();
    this.deactivateLasers();

    // Remove doorway collider so player can step through the opened doorway
    if (this.roomEnv.doorCollider) {
      const idx = this.roomEnv.colliders.indexOf(this.roomEnv.doorCollider);
      if (idx !== -1) {
        this.roomEnv.colliders.splice(idx, 1);
      }
    }

    // Ensure doorway passage is 100% unobstructed across all colliders
    if (this.currentGame === 'search_maze') {
      this.roomEnv.colliders = this.roomEnv.colliders.filter((c) => {
        const center = new THREE.Vector3();
        c.getCenter(center);
        if (this.currentLevel === 5) {
          // Clear East doorway colliders (around x = 22.0, z = 0)
          return !(center.x >= 20.0 && Math.abs(center.z) < 2.8);
        } else if (this.currentLevel === 4) {
          // Clear East doorway colliders (around x = 20.0, z = 0)
          return !(center.x >= 18.0 && Math.abs(center.z) < 2.8);
        } else if (this.currentLevel === 3) {
          // Clear East doorway colliders (around x = 16.5, z = 0)
          return !(center.x >= 14.5 && Math.abs(center.z) < 2.8);
        } else if (this.currentLevel === 2) {
          // Clear East doorway colliders (around x = 14.5, z = 0)
          return !(center.x >= 13.0 && Math.abs(center.z) < 2.5);
        }
        return !(center.z <= -10.5 && Math.abs(center.x) < 2.5);
      });
    } else if (this.currentLevel === 5) {
      this.roomEnv.colliders = this.roomEnv.colliders.filter((c) => {
        const center = new THREE.Vector3();
        c.getCenter(center);
        // Keep everything except anything directly blocking the central doorway
        return !(center.z <= -18.0 && Math.abs(center.x) < 2.2);
      });
    }
  }

  public highlightBfsStep(
    activeNodeId: string,
    visitedNodeIds: string[],
    frontierNodeIds: string[],
    isTargetFound: boolean
  ) {
    if (!this.roomEnv.mazeNodesMap) return;

    this.roomEnv.mazeNodesMap.forEach((nodeRef, id) => {
      const isStart = id === 'S';
      const isTarget = id === 'G';
      const isActive = id === activeNodeId;
      const isVisited = visitedNodeIds.includes(id);
      const isFrontier = frontierNodeIds.includes(id);

      if (isTarget) {
        if (isTargetFound) {
          const markerMat = nodeRef.markerMesh?.material as THREE.MeshStandardMaterial;
          if (markerMat) {
            markerMat.color.setHex(0x10b981);
            markerMat.emissive.setHex(0x059669);
            markerMat.emissiveIntensity = 2.0;
          }
          const ringMat = nodeRef.ringMesh.material as THREE.MeshBasicMaterial;
          if (ringMat) ringMat.color.setHex(0x10b981);
          if (nodeRef.haloLight) {
            nodeRef.haloLight.color.setHex(0x10b981);
            nodeRef.haloLight.intensity = 3.5;
          }
        }
      } else if (!isStart) {
        const tileMat = nodeRef.tileMesh.material as THREE.MeshStandardMaterial;
        const ringMat = nodeRef.ringMesh.material as THREE.MeshBasicMaterial;
        const markerMat = nodeRef.markerMesh?.material as THREE.MeshStandardMaterial;

        if (isActive) {
          if (tileMat) {
            tileMat.emissive.setHex(0xf59e0b);
            tileMat.emissiveIntensity = 1.2;
          }
          if (ringMat) ringMat.color.setHex(0xfbbf24);
          if (markerMat) {
            markerMat.emissive.setHex(0xf59e0b);
            markerMat.emissiveIntensity = 1.4;
          }
          if (nodeRef.haloLight) {
            nodeRef.haloLight.color.setHex(0xfbbf24);
            nodeRef.haloLight.intensity = 2.2;
          }
        } else if (isVisited) {
          if (tileMat) {
            tileMat.emissive.setHex(0x0284c7);
            tileMat.emissiveIntensity = 0.9;
          }
          if (ringMat) ringMat.color.setHex(0x38bdf8);
          if (markerMat) {
            markerMat.emissive.setHex(0x0284c7);
            markerMat.emissiveIntensity = 1.0;
          }
          if (nodeRef.haloLight) {
            nodeRef.haloLight.color.setHex(0x38bdf8);
            nodeRef.haloLight.intensity = 1.4;
          }
        } else if (isFrontier) {
          if (tileMat) {
            tileMat.emissive.setHex(0x06b6d4);
            tileMat.emissiveIntensity = 0.6;
          }
          if (ringMat) ringMat.color.setHex(0x22d3ee);
          if (markerMat) {
            markerMat.emissive.setHex(0x06b6d4);
            markerMat.emissiveIntensity = 0.8;
          }
        }
      }
    });

    // Sparkle effect at active node
    const activeNode = this.roomEnv.mazeNodesMap.get(activeNodeId);
    if (activeNode) {
      this.spawnParticles(
        activeNode.tileMesh.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
        isTargetFound ? 0x10b981 : 0x38bdf8,
        14
      );
    }

    // In Level 5, also illuminate real 3D maze corridor floor tiles
    if (this.currentLevel === 5 && this.roomEnv.maze5FloorTiles) {
      if (activeNodeId) {
        const activeTile = this.roomEnv.maze5FloorTiles.get(activeNodeId);
        if (activeTile) {
          const mat = activeTile.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissive.setHex(0xf59e0b);
            mat.emissiveIntensity = 1.4;
          }
          this.spawnParticles(
            activeTile.position.clone().add(new THREE.Vector3(0, 0.3, 0)),
            isTargetFound ? 0x10b981 : 0xf59e0b,
            12
          );
        }
      }

      visitedNodeIds.forEach((key) => {
        const tile = this.roomEnv.maze5FloorTiles?.get(key);
        if (tile && key !== activeNodeId) {
          const mat = tile.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissive.setHex(0x0284c7);
            mat.emissiveIntensity = 0.85;
          }
        }
      });

      frontierNodeIds.forEach((key) => {
        const tile = this.roomEnv.maze5FloorTiles?.get(key);
        if (tile && key !== activeNodeId && !visitedNodeIds.includes(key)) {
          const mat = tile.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissive.setHex(0x06b6d4);
            mat.emissiveIntensity = 0.5;
          }
        }
      });

      if (isTargetFound) {
        const targetNode = this.roomEnv.mazeNodesMap?.get('TARGET');
        if (targetNode) {
          const markerMat = targetNode.markerMesh?.material as THREE.MeshStandardMaterial;
          if (markerMat) {
            markerMat.color.setHex(0x10b981);
            markerMat.emissive.setHex(0x10b981);
            markerMat.emissiveIntensity = 3.0;
          }
          if (targetNode.haloLight) {
            targetNode.haloLight.color.setHex(0x10b981);
            targetNode.haloLight.intensity = 4.0;
          }
        }
        this.openVault();
      }
    }
  }

  public showShortestPath(pathNodeIds: string[]) {
    if (this.roomEnv.shortestPathBeams) {
      this.roomEnv.shortestPathBeams.visible = true;
    }
    this.isBfsTargetDiscovered = true;

    if (this.currentLevel === 5 && this.roomEnv.maze5FloorTiles) {
      pathNodeIds.forEach((key) => {
        const tile = this.roomEnv.maze5FloorTiles?.get(key);
        if (tile) {
          const mat = tile.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissive.setHex(0x10b981);
            mat.emissiveIntensity = 1.8;
          }
        }
      });
      this.openVault();
    }

    if (this.roomEnv.mazeNodesMap) {
      pathNodeIds.forEach((id) => {
        const node = this.roomEnv.mazeNodesMap?.get(id);
        if (node && id !== 'S' && id !== 'G') {
          const tileMat = node.tileMesh.material as THREE.MeshStandardMaterial;
          const ringMat = node.ringMesh.material as THREE.MeshBasicMaterial;
          if (tileMat) {
            tileMat.emissive.setHex(0x10b981);
            tileMat.emissiveIntensity = 1.2;
          }
          if (ringMat) ringMat.color.setHex(0x34d399);
          if (node.haloLight) {
            node.haloLight.color.setHex(0x10b981);
            node.haloLight.intensity = 2.2;
          }
        }
      });
    }
  }

  public updateLevel3Terminal(stageNumber: number, visited: string[], queue: string[], question: string) {
    const screenMesh = (this.scene.getObjectByName('searchMazeTerminalScreen5') ||
      this.scene.getObjectByName('searchMazeTerminalScreen4') ||
      this.scene.getObjectByName('searchMazeTerminalScreen3')) as THREE.Mesh;
    if (screenMesh && this.roomBuilder) {
      const newTex =
        this.currentLevel === 5
          ? this.roomBuilder.createTerminalTexture5(stageNumber, visited, queue, question)
          : this.currentLevel === 4
          ? this.roomBuilder.createTerminalTexture4(stageNumber, visited, queue, question)
          : this.roomBuilder.createTerminalTexture3(stageNumber, visited, queue, question);
      (screenMesh.material as THREE.MeshStandardMaterial).map = newTex;
      (screenMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }
  }

  public setNodeFeedbackVisual(nodeId: string, status: 'correct' | 'wrong' | 'visited' | 'candidate' | 'target') {
    const nodeRef = this.roomEnv.mazeNodesMap?.get(nodeId);
    if (!nodeRef) return;

    let color = 0x0c2340;
    let emissive = 0x38bdf8;
    let lightColor = 0x38bdf8;
    let lightIntensity = 1.2;

    if (status === 'correct' || status === 'visited') {
      color = 0x064e3b;
      emissive = 0x10b981;
      lightColor = 0x10b981;
      lightIntensity = 2.8;
      this.spawnParticles(new THREE.Vector3(nodeRef.tileMesh.position.x, 0.8, nodeRef.tileMesh.position.z), 0x10b981, 25);
    } else if (status === 'wrong') {
      color = 0x7f1d1d;
      emissive = 0xef4444;
      lightColor = 0xef4444;
      lightIntensity = 3.2;
      this.spawnParticles(new THREE.Vector3(nodeRef.tileMesh.position.x, 0.8, nodeRef.tileMesh.position.z), 0xef4444, 30);
      setTimeout(() => {
        if (this.currentLevel === 3 || this.currentLevel === 4 || this.currentLevel === 5 || this.currentGame === 'heuristic_chamber') {
          this.setNodeFeedbackVisual(nodeId, 'candidate');
        }
      }, 1500);
    } else if (status === 'candidate') {
      color = 0x1e293b;
      emissive = 0xf59e0b;
      lightColor = 0xf59e0b;
      lightIntensity = 1.6;
    } else if (status === 'target') {
      color = 0x450a0a;
      emissive = 0xef4444;
      lightColor = 0xef4444;
      lightIntensity = 2.0;
    }

    const tileMat = nodeRef.tileMesh.material as THREE.MeshStandardMaterial;
    tileMat.color.setHex(color);
    tileMat.emissive.setHex(emissive);
    tileMat.emissiveIntensity = status === 'wrong' ? 1.0 : (status === 'correct' ? 0.8 : 0.35);

    const ringMat = nodeRef.ringMesh.material as THREE.MeshBasicMaterial;
    ringMat.color.setHex(emissive);

    if (nodeRef.haloLight) {
      nodeRef.haloLight.color.setHex(lightColor);
      nodeRef.haloLight.intensity = lightIntensity;
    }
  }

  public resetLevel3NodesVisual() {
    if (!this.roomEnv.mazeNodesMap) return;
    this.roomEnv.mazeNodesMap.forEach((nodeRef, id) => {
      if (id === 'S') return;
      const isTarget = id.startsWith('TARGET');
      const isA = id === 'A';
      const color = isTarget ? 0x450a0a : (isA ? 0x064e3b : 0x0c2340);
      const emissive = isTarget ? 0xef4444 : (isA ? 0x10b981 : 0x38bdf8);
      const lightColor = emissive;
      const lightIntensity = isTarget ? 1.8 : 1.2;

      const tileMat = nodeRef.tileMesh.material as THREE.MeshStandardMaterial;
      tileMat.color.setHex(color);
      tileMat.emissive.setHex(emissive);
      tileMat.emissiveIntensity = 0.35;

      const ringMat = nodeRef.ringMesh.material as THREE.MeshBasicMaterial;
      ringMat.color.setHex(emissive);

      if (nodeRef.haloLight) {
        nodeRef.haloLight.color.setHex(lightColor);
        nodeRef.haloLight.intensity = lightIntensity;
      }
    });
  }

  public updateHeuristicConsole(stageNumber: number) {
    const screenMesh = this.scene.getObjectByName('heuristicConsoleScreen') as THREE.Mesh;
    if (screenMesh && this.roomBuilder) {
      const newTex = this.roomBuilder.createHeuristicConsoleTexture(stageNumber);
      (screenMesh.material as THREE.MeshStandardMaterial).map = newTex;
      (screenMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }
  }

  public updateHeuristicChamberStage(stageNumber: number) {
    this.updateHeuristicConsole(stageNumber);

    if (this.roomEnv.heuristicStageGroups) {
      const g1 = this.roomEnv.heuristicStageGroups.get(1);
      const g2 = this.roomEnv.heuristicStageGroups.get(2);
      const g3 = this.roomEnv.heuristicStageGroups.get(3);

      if (stageNumber === 1) {
        if (g1) g1.visible = true;
        if (g2) g2.visible = false;
        if (g3) g3.visible = false;
        if (this.roomEnv.shortestPathBeams) this.roomEnv.shortestPathBeams.visible = false;
      } else if (stageNumber === 2) {
        if (g1) {
          const badgeB = this.scene.getObjectByName('heuristicBadge_B');
          const badgeD = this.scene.getObjectByName('heuristicBadge_D');
          if (badgeB) badgeB.visible = false;
          if (badgeD) badgeD.visible = false;
        }
        if (g2) g2.visible = true;
        if (g3) g3.visible = false;
      } else if (stageNumber === 3) {
        if (g2) {
          const badgeE = this.scene.getObjectByName('heuristicBadge_E');
          const badgeG = this.scene.getObjectByName('heuristicBadge_G');
          if (badgeE) badgeE.visible = false;
          if (badgeG) badgeG.visible = false;
        }
        if (g3) g3.visible = true;
      } else if (stageNumber >= 5) {
        this.revealHeuristicTargetAndPath();
      }
    }
  }

  public revealHeuristicTargetAndPath() {
    if (this.roomEnv.shortestPathBeams) {
      this.roomEnv.shortestPathBeams.visible = true;
    }
    const targetRef = this.roomEnv.mazeNodesMap?.get('TARGET');
    if (targetRef) {
      this.spawnParticles(new THREE.Vector3(targetRef.tileMesh.position.x, 1.2, targetRef.tileMesh.position.z), 0xef4444, 40);
      if (targetRef.haloLight) {
        targetRef.haloLight.intensity = 3.0;
        targetRef.haloLight.color.setHex(0xef4444);
      }
      const tileMat = targetRef.tileMesh.material as THREE.MeshStandardMaterial;
      tileMat.color.setHex(0x500a0a);
      tileMat.emissive.setHex(0xef4444);
      tileMat.emissiveIntensity = 0.9;
      const ringMat = targetRef.ringMesh.material as THREE.MeshBasicMaterial;
      ringMat.color.setHex(0xef4444);
    }
  }

  private spawnParticles(pos: THREE.Vector3, color: number, count: number = 15) {
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );
      p.userData = { vel, life: 1.0 };
      this.particleGroup.add(p);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particleGroup.children.length - 1; i >= 0; i--) {
      const p = this.particleGroup.children[i] as THREE.Mesh;
      const data = p.userData as { vel: THREE.Vector3; life: number };
      p.position.addScaledVector(data.vel, dt);
      data.vel.y -= 9.8 * dt;
      data.life -= dt * 1.8;
      p.scale.setScalar(Math.max(0, data.life));

      if (data.life <= 0) {
        this.particleGroup.remove(p);
      }
    }
  }

  private checkNearbyInteractables() {
    let closest: (InteractiveObjectData & { mesh?: THREE.Object3D; hitRadius: number }) | null = null;
    let closestDist = Infinity;

    for (const obj of this.roomEnv.interactiveObjects) {
      const objPos = new THREE.Vector3(...obj.position);
      const dist = this.playerPosition.distanceTo(objPos);

      if (dist < obj.hitRadius && dist < closestDist) {
        closestDist = dist;
        closest = obj;
      }
    }

    if (closest !== this.nearbyObject) {
      this.nearbyObject = closest;
      if (this.onNearbyObjectChange) {
        this.onNearbyObjectChange(closest ? {
          id: closest.id,
          type: closest.type,
          name: closest.name,
          prompt: closest.prompt,
          position: closest.position,
          requiredItem: closest.requiredItem,
          clueText: closest.clueText,
        } : null);
      }
    }
  }

  private updatePlayer(dt: number) {
    if (this.isControlsLocked) return;

    // Decrement Roblox jump & landing timers
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.landingBounceTimer > 0) this.landingBounceTimer -= dt * 6;

    // Movement Vector
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

    // Keyboard checks (KeyW, w, W, ArrowUp, etc.)
    const isUp = !!(this.keys['KeyW'] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']);
    const isDown = !!(this.keys['KeyS'] || this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']);
    const isLeft = !!(this.keys['KeyA'] || this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']);
    const isRight = !!(this.keys['KeyD'] || this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']);
    const isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['Shift']);

    if (isUp) moveDir.add(forward);
    if (isDown) moveDir.sub(forward);
    if (isLeft) moveDir.sub(right);
    if (isRight) moveDir.add(right);

    // Virtual D-pad / Joystick contribution (relative to camera forward and right)
    if (Math.abs(this.virtualMovement.x) > 0.05 || Math.abs(this.virtualMovement.z) > 0.05) {
      moveDir.addScaledVector(right, this.virtualMovement.x);
      moveDir.addScaledVector(forward, -this.virtualMovement.z);
    }

    const isMoving = moveDir.lengthSq() > 0.001;

    // Auto-Recovery: if player is currently somehow inside a collider, nudge out to open floor
    if (this.checkCollisionAt(this.playerPosition.x, this.playerPosition.z)) {
      // Find direction toward safe open space (0, 0, 3)
      const toSafe = new THREE.Vector3(0, 0, 3.0).sub(this.playerPosition);
      if (toSafe.lengthSq() > 0.001) {
        toSafe.normalize();
        this.playerPosition.x += toSafe.x * 0.15;
        this.playerPosition.z += toSafe.z * 0.15;
      }
    }

    // Precise Roblox Movement Handling (Full instantaneous responsive steering in air and ground)
    if (isMoving) {
      moveDir.normalize();
      const moveSpeed = isSprinting ? 12.0 : 8.5;

      const stepX = moveDir.x * moveSpeed * dt;
      const stepZ = moveDir.z * moveSpeed * dt;

      const currentX = this.playerPosition.x;
      const currentZ = this.playerPosition.z;

      // Real 3D Collision with slide physics along X and Z axes independently
      const targetX = currentX + stepX;
      if (!this.checkCollisionAt(targetX, currentZ)) {
        this.playerPosition.x = targetX;
      }

      const targetZ = currentZ + stepZ;
      if (!this.checkCollisionAt(this.playerPosition.x, targetZ)) {
        this.playerPosition.z = targetZ;
      }

      // Check if player walked through open exit doorway
      const exitZThreshold =
        this.currentLevel === 1 ? 9.2 :
        this.currentLevel === 2 ? 10.2 :
        this.currentLevel === 3 ? 9.2 :
        this.currentLevel === 4 ? 11.2 : -17.0;

      if (this.isVaultOpening) {
        if (this.currentLevel === 5) {
          if (this.playerPosition.z <= -17.2 && Math.abs(this.playerPosition.x) < 3.8) {
            if (this.onWinReached) {
              this.onWinReached();
            }
          }
        } else {
          if (this.playerPosition.z >= exitZThreshold && Math.abs(this.playerPosition.x) < 3.2) {
            if (this.onWinReached) {
              this.onWinReached();
            }
          }
        }
      }

      // Rotate character to face movement direction smoothly
      const targetRotation = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetRotation - this.playerAvatar.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.playerAvatar.group.rotation.y += diff * 16 * dt;
    }

    // Level 5 Laser Collision Detection
    if (this.laserTripCooldown > 0) {
      this.laserTripCooldown -= dt;
    }

    if (
      this.currentLevel === 5 &&
      !this.isLasersDisabled &&
      this.laserTripCooldown <= 0 &&
      this.roomEnv.dynamicLasers
    ) {
      const px = this.playerPosition.x;
      const py = this.playerPosition.y + 0.6; // player center height
      const pz = this.playerPosition.z;

      for (const laser of this.roomEnv.dynamicLasers) {
        const cycle = (this.clockTime + laser.phaseOffset) % laser.period;
        const isActive = cycle < laser.activeWindow;

        if (isActive) {
          const b = laser.bounds;
          // Check if player overlaps laser collision cylinder / box
          const inX = px >= b.minX - 0.35 && px <= b.maxX + 0.35;
          const inY = py >= b.minY - 0.4 && py <= b.maxY + 0.4;
          const inZ = pz >= b.minZ - 0.45 && pz <= b.maxZ + 0.45;

          if (inX && inY && inZ) {
            // Tripped!
            this.laserTripCooldown = 1.0;
            sound.playLaserTrip();
            this.spawnParticles(this.playerPosition.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xff0033, 25);
            this.playerPosition.copy(this.currentCheckpoint);
            this.playerAvatar.group.position.copy(this.playerPosition);
            if (this.onLaserTripped) {
              this.onLaserTripped(laser.name);
            }
            break;
          }
        }
      }
    }

    // Roblox Precise Jump & Gravity Physics
    const isJumpPressed = !!(this.keys['Space'] || this.keys[' ']);
    if (isJumpPressed) {
      this.jump();
    }

    // Buffered jump consumption
    if (this.isGrounded && this.jumpBufferTimer > 0) {
      this.jump();
    }

    if (!this.isGrounded) {
      // Snappy Roblox gravity arc: 27.0 m/s^2
      this.playerVelocity.y -= 27.0 * dt;
      this.playerPosition.y += this.playerVelocity.y * dt;

      if (this.playerPosition.y <= 0) {
        this.playerPosition.y = 0;
        this.playerVelocity.y = 0;
        this.isGrounded = true;

        // Satisfying Landing Impact
        if (!this.wasGrounded) {
          sound.playLanding();
          this.landingBounceTimer = 1.0;
          this.spawnParticles(this.playerPosition.clone().add(new THREE.Vector3(0, 0.05, 0)), 0xe2e8f0, 8);
        }
      }
    } else {
      // Track coyote time if walking off an elevated surface/platform
      if (this.playerPosition.y > 0.05) {
        this.isGrounded = false;
        this.coyoteTimer = 0.12;
      }
    }

    this.wasGrounded = this.isGrounded;

    // Update Avatar Mesh position & animations with Roblox jump posture and landing compression
    this.playerAvatar.group.position.copy(this.playerPosition);
    this.playerAvatar.updateAnimation(
      dt,
      isMoving,
      !this.isGrounded,
      this.playerVelocity.y,
      Math.max(0, this.landingBounceTimer)
    );

    // Check nearby interactables
    this.checkNearbyInteractables();

    // Search Maze: Check if player reached the Red Target node
    if (this.currentGame === 'search_maze') {
      if (this.currentLevel === 3 || this.currentLevel === 4 || this.currentLevel === 5) {
        // Physical circle step-in detection for Level 3, Level 4 & Level 5
        let insideAnyNode: string | null = null;
        if (this.roomEnv.mazeNodesMap) {
          for (const [id, nodeRef] of this.roomEnv.mazeNodesMap.entries()) {
            if (id === 'S') continue;
            const tilePos = nodeRef.tileMesh.position;
            const dist = Math.sqrt((this.playerPosition.x - tilePos.x) ** 2 + (this.playerPosition.z - tilePos.z) ** 2);
            if (dist < 1.6) {
              insideAnyNode = id;
              break;
            }
          }
        }
        if (insideAnyNode && insideAnyNode !== this.activeEnteredCircleNodeId) {
          this.activeEnteredCircleNodeId = insideAnyNode;
          if (this.currentLevel === 5 && insideAnyNode === 'TARGET' && !this.isTargetReached) {
            this.isTargetReached = true;
            this.isBfsTargetDiscovered = true;
            sound.playAccessGranted();
            this.spawnParticles(new THREE.Vector3(14.7, 1.2, 0), 0x10b981, 35);
            if (this.roomEnv.shortestPathBeams) {
              this.roomEnv.shortestPathBeams.visible = true;
            }
            if (this.onTargetReached) {
              this.onTargetReached();
            }
            this.openVault();
          }
          if (this.onDecisionCircleStep) {
            this.onDecisionCircleStep(insideAnyNode);
          }
        } else if (!insideAnyNode) {
          this.activeEnteredCircleNodeId = null;
        }

        // Check if player walked through open exit doorway
        if ((this.isTargetReached || this.isVaultOpening) && !this.isLevelExitCrossed) {
          const exitDoorX = this.currentLevel === 5 ? 20.0 : this.currentLevel === 4 ? 18.5 : 15.0;
          const hasCrossed = this.playerPosition.x >= exitDoorX && Math.abs(this.playerPosition.z) < 2.8;
          if (hasCrossed) {
            this.isLevelExitCrossed = true;
            sound.playVictory();
            if (this.onWinReached) {
              this.onWinReached();
            }
          }
        }
      } else {
        const targetX = this.currentLevel === 2 ? 8 : 4;
        const targetZ = 0;

        if (this.isBfsTargetDiscovered && !this.isTargetReached) {
          const distToTarget = Math.sqrt((this.playerPosition.x - targetX) ** 2 + (this.playerPosition.z - targetZ) ** 2);
          if (distToTarget < 2.2) {
            this.isTargetReached = true;
            sound.playAccessGranted();
            this.spawnParticles(new THREE.Vector3(targetX, 1.2, targetZ), 0x10b981, 35);
            if (this.onTargetReached) {
              this.onTargetReached();
            }
            this.openVault();
          }
        }

        // Check if player physically walked through the open exit door
        if (this.isTargetReached && !this.isLevelExitCrossed && this.vaultOpenProgress > 0.25) {
          const hasCrossed =
            this.currentLevel === 2
              ? (this.playerPosition.x >= 13.5 && Math.abs(this.playerPosition.z) < 2.5)
              : (this.playerPosition.z <= -10.2 && Math.abs(this.playerPosition.x) < 2.5);

          if (hasCrossed) {
            this.isLevelExitCrossed = true;
            sound.playVictory();
            if (this.onWinReached) {
              this.onWinReached();
            }
          }
        }
      }
    }

    // Heuristic Chamber: Physical circle step-in & door exit detection
    if (this.currentGame === 'heuristic_chamber') {
      let insideAnyNode: string | null = null;
      if (this.roomEnv.mazeNodesMap) {
        for (const [id, nodeRef] of this.roomEnv.mazeNodesMap.entries()) {
          if (id === 'START') continue;
          const tilePos = nodeRef.tileMesh.position;
          const dist = Math.sqrt((this.playerPosition.x - tilePos.x) ** 2 + (this.playerPosition.z - tilePos.z) ** 2);
          if (dist < 1.8) {
            insideAnyNode = id;
            break;
          }
        }
      }
      if (insideAnyNode && insideAnyNode !== this.activeEnteredCircleNodeId) {
        this.activeEnteredCircleNodeId = insideAnyNode;
        if (insideAnyNode === 'TARGET' && !this.isTargetReached) {
          // In heuristic chamber, Target is only activatable after the A* route is unlocked
          if (this.roomEnv.shortestPathBeams && this.roomEnv.shortestPathBeams.visible) {
            this.isTargetReached = true;
            sound.playAccessGranted();
            this.spawnParticles(new THREE.Vector3(14.5, 1.2, 0), 0x10b981, 40);
            if (this.onTargetReached) {
              this.onTargetReached();
            }
            this.openVault();
          }
        }
        if (this.onDecisionCircleStep) {
          this.onDecisionCircleStep(insideAnyNode);
        }
      } else if (!insideAnyNode) {
        this.activeEnteredCircleNodeId = null;
      }

      // Check if player walked through open exit doorway
      if ((this.isTargetReached || this.isVaultOpening) && !this.isLevelExitCrossed) {
        const exitDoorX = 20.0;
        const hasCrossed = this.playerPosition.x >= exitDoorX && Math.abs(this.playerPosition.z) < 3.0;
        if (hasCrossed) {
          this.isLevelExitCrossed = true;
          sound.playVictory();
          if (this.onWinReached) {
            this.onWinReached();
          }
        }
      }
    }
  }

  private updateVaultAnimation(dt: number) {
    if (!this.isVaultOpening || !this.roomBuilder.vaultDoorGroup) return;

    if (this.vaultOpenProgress < 1.0) {
      this.vaultOpenProgress += dt * 0.6;
      const leftDoor = this.roomBuilder.vaultDoorGroup.getObjectByName('vaultDoorLeft');
      const rightDoor = this.roomBuilder.vaultDoorGroup.getObjectByName('vaultDoorRight');
      const wheel = this.roomBuilder.vaultDoorGroup.getObjectByName('vaultWheel');
      const led = this.roomBuilder.vaultDoorGroup.getObjectByName('scannerLed') as THREE.Mesh;
      const statusLight = this.roomBuilder.vaultDoorGroup.getObjectByName('exitDoorStatusLight') as THREE.PointLight;

      if (this.currentGame === 'heuristic_chamber') {
        if (leftDoor) leftDoor.position.z = 1.25 + this.vaultOpenProgress * 2.2;
        if (rightDoor) rightDoor.position.z = -1.25 - this.vaultOpenProgress * 2.2;
        if (statusLight) {
          statusLight.color.setHex(0x10b981);
          statusLight.intensity = 2.5;
        }
      } else {
        if (leftDoor) leftDoor.position.x = -0.9 - this.vaultOpenProgress * 2.5;
        if (rightDoor) rightDoor.position.x = 0.9 + this.vaultOpenProgress * 2.5;
        if (wheel) wheel.rotation.z += dt * 5;
        if (led && (led.material as THREE.MeshBasicMaterial).color) {
          (led.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        }
      }
    }
  }

  private updateCamera() {
    this.cameraTarget.copy(this.playerPosition).add(new THREE.Vector3(0, 0.85, 0));

    // For Level 5 Search Maze, maintain optimal tactical perspective so walls never obscure the screen
    if (this.currentGame === 'search_maze' && this.currentLevel === 5) {
      this.cameraPitch = Math.max(0.48, Math.min(Math.PI / 2.3, this.cameraPitch));
      this.cameraDistance = Math.max(2.8, Math.min(6.2, this.cameraDistance));
    }

    const cx = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch);
    let cy = this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraPitch);
    const cz = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch);

    if (this.currentGame === 'search_maze' && this.currentLevel === 5) {
      cy = Math.max(cy, 2.5); // Elevated vantage over 1.4m partitions for crisp, unobstructed visibility
    }

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.cameraTarget);
  }

  private animate = () => {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.clockTime += dt;

    // Dynamic Lasers Animation (Timing Rhythms, Movement Sweeps, Visual Glows)
    if (this.currentLevel === 5 && this.roomEnv.dynamicLasers) {
      this.roomEnv.dynamicLasers.forEach((laser) => {
        if (this.isLasersDisabled) {
          laser.coreMesh.visible = false;
          if (laser.glowMesh && laser.glowMesh.material) {
            const mat = laser.glowMesh.material as THREE.MeshStandardMaterial;
            mat.opacity = 0.05;
            mat.emissive.setHex(0x10b981);
            mat.emissiveIntensity = 0.1;
          }
          return;
        }

        const cycle = (this.clockTime + laser.phaseOffset) % laser.period;
        const isActive = cycle < laser.activeWindow;
        const isWarning =
          !isActive &&
          cycle >= laser.period - laser.warningWindow;

        // Dynamic Position Updates
        if (laser.type === 'horizontal_sweep' && laser.sweepYRange) {
          const sy =
            (laser.baseY || 0.8) +
            Math.sin(this.clockTime * (laser.sweepSpeed || 2.0)) * laser.sweepYRange;
          laser.group.position.y = sy;
          laser.bounds.minY = sy - 0.25;
          laser.bounds.maxY = sy + 0.25;
        }

        if (laser.type === 'oscillating_z' && laser.sweepZRange) {
          const sz =
            (laser.baseZ || 0) +
            Math.sin(this.clockTime * (laser.sweepSpeed || 1.8)) * laser.sweepZRange;
          laser.group.position.z = sz;
          laser.bounds.minZ = sz - 0.35;
          laser.bounds.maxZ = sz + 0.35;
        }

        // Visual Material Glow Updates
        if (laser.glowMesh && laser.glowMesh.material) {
          const mat = laser.glowMesh.material as THREE.MeshStandardMaterial;
          if (isActive) {
            laser.coreMesh.visible = true;
            mat.opacity = 0.95;
            mat.emissive.setHex(0xff0033);
            mat.color.setHex(0xff0033);
            mat.emissiveIntensity = 2.4 + Math.sin(this.clockTime * 15) * 0.6;
          } else if (isWarning) {
            laser.coreMesh.visible = true;
            mat.opacity = 0.55;
            mat.emissive.setHex(0xf59e0b);
            mat.color.setHex(0xf59e0b);
            mat.emissiveIntensity = 1.4 + Math.sin(this.clockTime * 35) * 0.9;
          } else {
            laser.coreMesh.visible = false;
            mat.opacity = 0.08;
            mat.emissiveIntensity = 0.1;
          }
        }
      });
    }

    // Animate collectibles & props (spinning coins, bobbing shards, glowing cores)
    if (this.roomEnv.animatedMeshes) {
      this.roomEnv.animatedMeshes.forEach((mesh, index) => {
        mesh.rotation.y += dt * 2.0;
        if (mesh.position.y > 0.3) {
          mesh.position.y += Math.sin(this.clockTime * 4 + index) * 0.002;
        }
      });
    }

    // Pendulum swing
    if (this.roomEnv.clockPendulum) {
      this.roomEnv.clockPendulum.rotation.z = Math.sin(this.clockTime * 3.0) * 0.25;
    }

    this.updatePlayer(dt);
    this.updateVaultAnimation(dt);
    this.updateParticles(dt);
    this.updateCamera();

    if (this.onPlayerPositionChange) {
      this.onPlayerPositionChange({
        x: this.playerPosition.x,
        y: this.playerPosition.y,
        z: this.playerPosition.z,
        yaw: this.cameraYaw,
        avatarRotationY: this.playerAvatar ? this.playerAvatar.group.rotation.y : 0,
      });
    }

    this.renderer.render(this.scene, this.camera);
  };

  public updateAvatar(custom: AvatarCustomization) {
    if (this.playerAvatar) {
      this.playerAvatar.updateCustomization(custom);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.container.removeEventListener('wheel', this.handleWheel);

    this.container.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('resize', this.handleResize);

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
