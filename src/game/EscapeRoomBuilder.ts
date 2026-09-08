import * as THREE from 'three';
import { GameId, InteractiveObjectData, LevelId } from '../types';
import {
  LEVEL5_MAZE_GRID,
  LEVEL5_CELL_SIZE,
  LEVEL5_START_CELL,
  LEVEL5_TARGET_CELL,
  LEVEL5_EXIT_CELL,
  grid5ToWorld,
  executeGridBFS,
} from './searchMazeLogic';

export interface DynamicLaserBarrier {
  id: string;
  name?: string;
  type: 'horizontal_sweep' | 'vertical_curtain' | 'oscillating_z' | 'alternating_grid';
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  light?: THREE.PointLight;
  period: number;
  phaseOffset: number;
  activeWindow: number;
  warningWindow: number;
  baseY?: number;
  sweepYRange?: number;
  baseZ?: number;
  sweepZRange?: number;
  sweepSpeed?: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
}

export interface Maze3DNodeRef {
  id: string;
  tileMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  markerMesh?: THREE.Mesh;
  haloLight?: THREE.PointLight;
  billboardMesh?: THREE.Mesh;
}

export interface EscapeRoomEnvironment {
  scene: THREE.Scene;
  colliders: THREE.Box3[];
  interactiveObjects: (InteractiveObjectData & { mesh?: THREE.Object3D; hitRadius: number })[];
  vaultDoorMesh?: THREE.Group;
  doorCollider?: THREE.Box3;
  laserBeams?: THREE.Group;
  dynamicLasers?: DynamicLaserBarrier[];
  clockPendulum?: THREE.Mesh;
  animatedMeshes?: THREE.Object3D[];
  ambientLight?: THREE.AmbientLight;
  mainLight?: THREE.PointLight;
  mazeNodesMap?: Map<string, Maze3DNodeRef>;
  shortestPathBeams?: THREE.Group;
  maze5FloorTiles?: Map<string, THREE.Mesh>;
  maze5TargetMesh?: THREE.Mesh;
  heuristicStageGroups?: Map<number, THREE.Group>;
  heuristicTargetBeacon?: THREE.PointLight;
}

export class EscapeRoomBuilder {
  private scene: THREE.Scene;
  private colliders: THREE.Box3[] = [];
  public interactiveObjects: (InteractiveObjectData & { mesh?: THREE.Object3D; hitRadius: number })[] = [];
  public vaultDoorGroup!: THREE.Group;
  public doorCollider!: THREE.Box3;
  public laserGroup!: THREE.Group;
  public dynamicLasers: DynamicLaserBarrier[] = [];
  public breakerGlowLight!: THREE.PointLight;
  public animatedMeshes: THREE.Object3D[] = [];
  public clockPendulum?: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public addCollider(mesh: THREE.Object3D, padding: number = 0): THREE.Box3 {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    if (padding !== 0) {
      box.expandByScalar(padding);
    }
    this.colliders.push(box);
    return box;
  }

  public addBoxCollider(min: THREE.Vector3, max: THREE.Vector3): THREE.Box3 {
    const box = new THREE.Box3(min, max);
    this.colliders.push(box);
    return box;
  }

  // ==========================================
  // REALISTIC PROCEDURAL FURNITURE BUILDERS
  // ==========================================
  public createRealisticTable(
    width: number,
    depth: number,
    height: number,
    topThickness: number,
    topMat: THREE.Material,
    legMat: THREE.Material,
    legRadius: number = 0.05
  ): THREE.Group {
    const group = new THREE.Group();
    // 1. Tabletop
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, topThickness, depth), topMat);
    top.position.y = height - topThickness / 2;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // 2. 4 Solid Support Legs
    const legH = height - topThickness;
    const legGeo = new THREE.BoxGeometry(legRadius * 2, legH, legRadius * 2);
    const legOffsetX = width / 2 - legRadius * 2;
    const legOffsetZ = depth / 2 - legRadius * 2;
    const legY = legH / 2;

    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-legOffsetX, legY, -legOffsetZ);
    leg1.castShadow = true;
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(legOffsetX, legY, -legOffsetZ);
    leg2.castShadow = true;
    const leg3 = new THREE.Mesh(legGeo, legMat);
    leg3.position.set(-legOffsetX, legY, legOffsetZ);
    leg3.castShadow = true;
    const leg4 = new THREE.Mesh(legGeo, legMat);
    leg4.position.set(legOffsetX, legY, legOffsetZ);
    leg4.castShadow = true;

    // 3. Under-desk crossrails / apron
    const railXGeo = new THREE.BoxGeometry(width - legRadius * 4, 0.08, 0.04);
    const rail1 = new THREE.Mesh(railXGeo, legMat);
    rail1.position.set(0, height - topThickness - 0.04, -legOffsetZ);
    const rail2 = new THREE.Mesh(railXGeo, legMat);
    rail2.position.set(0, height - topThickness - 0.04, legOffsetZ);

    group.add(leg1, leg2, leg3, leg4, rail1, rail2);
    return group;
  }

  public createRealisticChair(
    seatW: number,
    seatD: number,
    seatH: number,
    backH: number,
    cushionMat: THREE.Material,
    frameMat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    // 1. Seat Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(seatW, 0.06, seatD), cushionMat);
    seat.position.y = seatH - 0.03;
    seat.castShadow = true;
    group.add(seat);

    // 2. Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(seatW * 0.9, backH, 0.05), cushionMat);
    back.position.set(0, seatH + backH / 2, -seatD / 2 + 0.03);
    back.castShadow = true;
    group.add(back);

    // 3. Backrest support posts
    const postH = backH + 0.06;
    const postGeo = new THREE.CylinderGeometry(0.02, 0.02, postH, 8);
    const post1 = new THREE.Mesh(postGeo, frameMat);
    post1.position.set(-seatW * 0.35, seatH + backH / 2 - 0.03, -seatD / 2 + 0.02);
    const post2 = new THREE.Mesh(postGeo, frameMat);
    post2.position.set(seatW * 0.35, seatH + backH / 2 - 0.03, -seatD / 2 + 0.02);
    group.add(post1, post2);

    // 4. 4 Chair Legs
    const legH = seatH - 0.06;
    const legGeo = new THREE.CylinderGeometry(0.025, 0.02, legH, 8);
    const lx = seatW / 2 - 0.05;
    const lz = seatD / 2 - 0.05;
    const ly = legH / 2;

    const leg1 = new THREE.Mesh(legGeo, frameMat);
    leg1.position.set(-lx, ly, -lz);
    leg1.castShadow = true;
    const leg2 = new THREE.Mesh(legGeo, frameMat);
    leg2.position.set(lx, ly, -lz);
    leg2.castShadow = true;
    const leg3 = new THREE.Mesh(legGeo, frameMat);
    leg3.position.set(-lx, ly, lz);
    leg3.castShadow = true;
    const leg4 = new THREE.Mesh(legGeo, frameMat);
    leg4.position.set(lx, ly, lz);
    leg4.castShadow = true;

    group.add(leg1, leg2, leg3, leg4);
    return group;
  }

  public createForensicStool(
    radius: number,
    seatH: number,
    cushionMat: THREE.Material,
    frameMat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    // Round seat
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.07, 16), cushionMat);
    seat.position.y = seatH - 0.035;
    seat.castShadow = true;
    group.add(seat);

    // Chrome stem & 4 feet
    const stemH = seatH - 0.07;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, stemH, 12), frameMat);
    stem.position.y = stemH / 2;
    group.add(stem);

    // 4 Star legs on floor
    const legGeo = new THREE.BoxGeometry(radius * 1.8, 0.04, 0.05);
    const legA = new THREE.Mesh(legGeo, frameMat);
    legA.position.y = 0.02;
    const legB = new THREE.Mesh(legGeo, frameMat);
    legB.position.y = 0.02;
    legB.rotation.y = Math.PI / 2;
    group.add(legA, legB);

    return group;
  }

  public buildLevel(levelId: LevelId): EscapeRoomEnvironment {
    return this.buildGameLevel('agent_academy', levelId);
  }

  public buildGameLevel(gameId: GameId, levelId: LevelId): EscapeRoomEnvironment {
    this.colliders = [];
    this.interactiveObjects = [];
    this.animatedMeshes = [];
    this.dynamicLasers = [];
    this.clockPendulum = undefined;

    if (gameId === 'search_maze') {
      if (levelId === 1) {
        return this.buildSearchMazeLevel1();
      } else if (levelId === 2) {
        return this.buildSearchMazeLevel2();
      } else if (levelId === 3) {
        return this.buildSearchMazeLevel3();
      } else if (levelId === 4) {
        return this.buildSearchMazeLevel4();
      } else if (levelId === 5) {
        return this.buildSearchMazeLevel5();
      }
      return this.buildSearchMazeLevel1();
    }

    if (gameId === 'heuristic_chamber') {
      if (levelId === 1) {
        return this.buildHeuristicChamberLevel1();
      }
      return this.buildHeuristicChamberLevel1();
    }

    // Default: Agent Academy levels (untouched)
    if (levelId === 1) {
      return this.buildLevel1DetectiveVault();
    } else if (levelId === 2) {
      return this.buildLevel2CyberpunkLab();
    } else if (levelId === 3) {
      return this.buildLevel3MemoryChamber();
    } else if (levelId === 4) {
      return this.buildLevel4EvidenceRoom();
    } else {
      return this.buildLevel5LaserCorridor();
    }
  }

  // ==========================================
  // TEXTURE GENERATORS (Pixel / Procedural)
  // ==========================================
  private createPixelTexture(
    type:
      | 'wood_floor'
      | 'wood_wall'
      | 'cyber_floor'
      | 'cyber_wall'
      | 'sandstone_floor'
      | 'sandstone_wall'
      | 'carpet'
      | 'hazard_stripe'
      | 'hieroglyph'
      | 'pattern_floor'
      | 'pattern_wall'
      | 'memory_floor'
      | 'memory_wall'
      | 'office_parquet'
      | 'office_wall'
      | 'cork_board'
      | 'laser_floor'
      | 'laser_wall'
      | 'vent_grate'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    if (type === 'laser_floor') {
      // Dark high-tech carbon alloy floor with subtle red grid conduits and caution dots
      ctx.fillStyle = '#090a10';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, 64, 64);

      // Embedded warning red light lines
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, 2, 4, 4);
      ctx.fillRect(58, 2, 4, 4);
      ctx.fillRect(2, 58, 4, 4);
      ctx.fillRect(58, 58, 4, 4);

      // High-tech center runway guide
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(16, 16, 32, 32);
    } else if (type === 'laser_wall') {
      // High-voltage insulated wall panels with warning LED strip
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#171926';
      ctx.fillRect(2, 2, 60, 28);
      ctx.fillRect(2, 34, 60, 28);
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 56, 24);
      ctx.strokeRect(4, 36, 56, 24);

      // Red laser warning line in the center
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(6, 14, 52, 3);
      ctx.fillRect(6, 46, 52, 3);
    } else if (type === 'vent_grate') {
      // Industrial vent mesh
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#0f172a';
      for (let y = 4; y < 60; y += 8) {
        ctx.fillRect(6, y, 52, 4);
      }
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 64, 64);
    } else if (type === 'office_parquet') {
      // Warm, rich oak herringbone parquet
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 0, 30, 14);
      ctx.fillRect(32, 16, 30, 14);
      ctx.fillRect(0, 32, 30, 14);
      ctx.fillRect(32, 48, 30, 14);

      ctx.fillStyle = '#92400e';
      ctx.fillRect(32, 0, 30, 14);
      ctx.fillRect(0, 16, 30, 14);
      ctx.fillRect(32, 32, 30, 14);
      ctx.fillRect(0, 48, 30, 14);

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 64, 64);
    } else if (type === 'office_wall') {
      // Modern intelligence bureau light warm-slate wall with paneling
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(2, 2, 60, 28);
      ctx.fillRect(2, 34, 60, 28);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 56, 24);
      ctx.strokeRect(4, 36, 56, 24);

      // Warm wooden wainscoting line at bottom
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 60, 64, 4);
    } else if (type === 'cork_board') {
      // Authentic cork board texture with pin notes
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#b45309';
      for (let i = 0; i < 30; i++) {
        const rx = (i * 17) % 60;
        const ry = (i * 23) % 60;
        ctx.fillRect(rx, ry, 2, 2);
      }
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 64, 64);
    } else if (type === 'memory_floor') {
      ctx.fillStyle = '#060919';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, 64, 64);

      // Inner memory circuit traces
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, 40, 40);

      // 4-color corner micro-dots
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(4, 4, 6, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(54, 4, 6, 6);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(4, 54, 6, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(54, 54, 6, 6);
    } else if (type === 'memory_wall') {
      ctx.fillStyle = '#080d21';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#0f1738';
      ctx.fillRect(2, 2, 60, 28);
      ctx.fillRect(2, 34, 60, 28);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 56, 24);
      ctx.strokeRect(4, 36, 56, 24);

      // Waveguide indicator
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 14, 52, 4);
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(6, 46, 52, 4);
    } else if (type === 'pattern_floor') {
      ctx.fillStyle = '#0f0c29';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, 64, 64);

      // Geometric inlay patterns (Triangle, Circle, Square)
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(32, 32, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#6366f1';
      ctx.strokeRect(16, 16, 32, 32);

      // Diamond accents
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(32, 8);
      ctx.lineTo(40, 16);
      ctx.lineTo(32, 24);
      ctx.lineTo(24, 16);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'pattern_wall') {
      ctx.fillStyle = '#180b2b';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#241242';
      ctx.fillRect(2, 2, 60, 28);
      ctx.fillRect(2, 34, 60, 28);
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 56, 24);
      ctx.strokeRect(4, 36, 56, 24);

      // Symbols embedded in wall tiles
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.moveTo(32, 10);
      ctx.lineTo(40, 22);
      ctx.lineTo(24, 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(32, 48, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'wood_floor') {
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#3a1e08';
      for (let i = 0; i < 64; i += 16) {
        ctx.fillRect(0, i, 64, 2);
        ctx.fillRect(i, 0, 2, 64);
      }
      ctx.fillStyle = '#5c3316';
      ctx.fillRect(2, 2, 14, 14);
      ctx.fillRect(34, 34, 14, 14);
    } else if (type === 'wood_wall') {
      ctx.fillStyle = '#2b1704';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#3d2208';
      ctx.fillRect(4, 4, 56, 26);
      ctx.fillRect(4, 34, 56, 26);
      ctx.fillStyle = '#1c0f02';
      ctx.strokeRect(4, 4, 56, 26);
      ctx.strokeRect(4, 34, 56, 26);
    } else if (type === 'cyber_floor') {
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 64, 64);
      ctx.fillStyle = '#141e33';
      ctx.fillRect(8, 8, 48, 48);
      ctx.strokeStyle = '#3b82f6';
      ctx.strokeRect(16, 16, 32, 32);
    } else if (type === 'cyber_wall') {
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 2, 60, 28);
      ctx.fillRect(2, 34, 60, 28);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(2, 30, 60, 2);
    } else if (type === 'sandstone_floor') {
      ctx.fillStyle = '#c29b62';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#b38c52';
      for (let i = 0; i < 64; i += 32) {
        for (let j = 0; j < 64; j += 32) {
          ctx.strokeRect(i, j, 32, 32);
          ctx.fillRect(i + 2, j + 2, 28, 28);
        }
      }
      ctx.fillStyle = '#8c6b38';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillRect(38, 38, 4, 4);
    } else if (type === 'sandstone_wall') {
      ctx.fillStyle = '#9e7844';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#826030';
      ctx.fillRect(4, 4, 56, 26);
      ctx.fillRect(4, 34, 56, 26);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(20, 10, 8, 8);
      ctx.fillRect(36, 40, 8, 8);
    } else if (type === 'carpet') {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 56, 56);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(12, 12, 40, 40);
    } else if (type === 'hazard_stripe') {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#0f172a';
      for (let i = -64; i < 128; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 12, 0);
        ctx.lineTo(i + 12 - 64, 64);
        ctx.lineTo(i - 64, 64);
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === 'hieroglyph') {
      ctx.fillStyle = '#8a6534';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(32, 20, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(30, 28, 4, 24);
      ctx.fillRect(20, 36, 24, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  private createSearchMazeFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Clean modern cyber slate base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 128, 128);

    // Inner bevel tile
    ctx.fillStyle = '#273549';
    ctx.fillRect(4, 4, 120, 120);

    // Tech matrix grid lines (bright cyan & neon blue)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 116, 116);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 96, 96);

    // Center illuminated circuit core
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(48, 48, 32, 32);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(56, 56, 16, 16);

    // Corner optical dots
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(8, 8, 6, 6);
    ctx.fillRect(114, 8, 6, 6);
    ctx.fillRect(8, 114, 6, 6);
    ctx.fillRect(114, 114, 6, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createSearchMazeWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Brighter sci-fi architectural paneling
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 128, 128);

    // Upper and lower chamfered wall panels
    ctx.fillStyle = '#475569';
    ctx.fillRect(4, 4, 120, 56);
    ctx.fillRect(4, 68, 120, 56);

    // High-contrast cyber seams
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, 116, 52);
    ctx.strokeRect(6, 70, 116, 52);

    // Luminescent neon cyan data channel running through the center
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 62, 128, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createExitDoorMarqueeTexture(
    title: string = '▲  LEVEL 2 EXIT  ▲',
    subtitle: string = 'NORTH GATEWAY AHEAD'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Glowing green-black cyber border
    ctx.fillStyle = '#022c22';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 492, 108);

    // Chevrons and glowing text
    ctx.fillStyle = '#10b981';
    ctx.font = '900 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 44);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(subtitle, 256, 88);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createBfsRuleWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark sleek high-tech cyber background
    ctx.fillStyle = '#091325';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing cyber borders
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 492);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 472, 472);

    // Header badge
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(40, 36, 432, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BFS RULE', 256, 64);

    // Rule items
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px monospace';

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🔹 Explore nearby nodes first', 48, 170);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🔹 Complete the current level', 48, 250);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🔹 Then move to next level', 48, 330);

    // Decorative divider & bottom note
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 390);
    ctx.lineTo(462, 390);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'italic bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL 2: BRANCHING MAZE', 256, 440);

    return new THREE.CanvasTexture(canvas);
  }

  // ==========================================
  // LEVEL 1: AGENT ACADEMY — THE FOUR-DIGIT LOCK
  // ==========================================
  private buildLevel1DetectiveVault(): EscapeRoomEnvironment {
    const W = 24;
    const D = 20;
    const H = 7;

    // Room boundaries / Colliders
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2));
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, D / 2));
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2));
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1));

    // Floor (High-tech Academy Cyber Grid)
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorTex = this.createPixelTexture('cyber_floor');
    floorTex.repeat.set(6, 5);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.4, metalness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Center Training Hub Carpet / Platform
    const carpetGeo = new THREE.PlaneGeometry(12, 10);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.5,
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.02, 0);
    carpet.receiveShadow = true;
    this.scene.add(carpet);

    // Center illuminated circle
    const centerCircle = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 2.7, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.set(0, 0.03, -2);
    this.scene.add(centerCircle);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    // Walls (High-tech Academy Panels)
    const wallTex = this.createPixelTexture('cyber_wall');
    wallTex.repeat.set(6, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.5, metalness: 0.5 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eastWall.position.set(W / 2, H / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

    // Ambient & Accent Lights — Bright, Lively & High Visibility Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x334155, 0.95);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0x60a5fa, 2.5, 36);
    mainLight.position.set(0, H - 1.5, 0);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // 4 Bright Overhead Recessed Ceiling Lights with Downlights
    const l1CeilingPanels = [
      [-6, -4],
      [6, -4],
      [-6, 4],
      [6, 4],
    ];
    l1CeilingPanels.forEach(([lx, lz]) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1.2 })
      );
      panel.position.set(lx, H - 0.05, lz);
      panel.rotation.x = Math.PI / 2;
      this.scene.add(panel);

      const pLight = new THREE.PointLight(0xe0f2fe, 1.4, 14);
      pLight.position.set(lx, H - 0.6, lz);
      this.scene.add(pLight);
    });

    // Dedicated South Door Floodlight
    const doorLight = new THREE.PointLight(0x38bdf8, 3.2, 18);
    doorLight.position.set(0, 4.5, D / 2 - 2.0);
    this.scene.add(doorLight);

    // Overhead Academy Light Ring
    const ringGeo = new THREE.TorusGeometry(3.5, 0.1, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lightRing = new THREE.Mesh(ringGeo, ringMat);
    lightRing.rotation.x = Math.PI / 2;
    lightRing.position.set(0, H - 0.8, -2);
    this.scene.add(lightRing);

    // ==========================================
    // 1. CENTRAL SECURITY CONSOLE
    // ==========================================
    const consoleGroup = new THREE.Group();
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.1, 1.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    pedestal.position.y = 0.65;

    const screenPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.0, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    screenPillar.position.set(0, 1.6, 0);
    screenPillar.rotation.x = -0.25;

    const terminalDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    terminalDisplay.position.set(0, 1.62, 0.16);
    terminalDisplay.rotation.x = -0.25;

    const keypadLight = new THREE.PointLight(0x38bdf8, 1.2, 6);
    keypadLight.position.set(0, 1.8, 0.4);

    consoleGroup.add(pedestal, screenPillar, terminalDisplay, keypadLight);
    consoleGroup.position.set(0, 0, -2);
    this.scene.add(consoleGroup);
    this.addBoxCollider(new THREE.Vector3(-1.2, 0, -3.0), new THREE.Vector3(1.2, 2.5, -1.0));

    this.interactiveObjects.push({
      id: 'security_console',
      type: 'security_console',
      name: 'Central Security Console',
      prompt: 'Access Security Console (Place Decrypted Fragments)',
      position: [0, 1.5, -2],
      hitRadius: 2.5,
    });

    // ==========================================
    // 2. FRAGMENT A: WEST ARCHIVE STATION (Digit = 7)
    // ==========================================
    const fragAGroup = new THREE.Group();
    const pedestalA = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    pedestalA.position.y = 0.6;

    const crystalA = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.8,
        roughness: 0.1,
      })
    );
    crystalA.position.y = 1.6;
    this.animatedMeshes.push(crystalA);

    const lightA = new THREE.PointLight(0x00f0ff, 1.2, 5);
    lightA.position.set(0, 1.8, 0);

    const bannerA = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    bannerA.position.set(0, 1.2, 0.72);

    fragAGroup.add(pedestalA, crystalA, lightA, bannerA);
    fragAGroup.position.set(-8, 0, -4);
    this.scene.add(fragAGroup);
    this.addBoxCollider(new THREE.Vector3(-8.9, 0, -4.9), new THREE.Vector3(-7.1, 2.5, -3.1));

    this.interactiveObjects.push({
      id: 'fragment_a',
      type: 'fragment_a',
      name: 'Security Fragment A (West Bay)',
      prompt: 'Solve Binary Register (Press E)',
      position: [-8, 1.2, -4],
      hitRadius: 2.5,
      clueText: 'Configure 4-bit switches to reach decimal 7',
    });

    // ==========================================
    // 3. FRAGMENT B: NORTH MAINTENANCE NODE (Digit = 4)
    // ==========================================
    const fragBGroup = new THREE.Group();
    const serverB = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
    );
    serverB.position.y = 1.4;

    const panelB = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.8),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6,
      })
    );
    panelB.position.set(0, 1.5, 0.52);

    const lightB = new THREE.PointLight(0xf59e0b, 1.0, 5);
    lightB.position.set(0, 1.8, 0.8);

    fragBGroup.add(serverB, panelB, lightB);
    fragBGroup.position.set(6, 0, -D / 2 + 1.2);
    this.scene.add(fragBGroup);
    this.addBoxCollider(new THREE.Vector3(5.1, 0, -D / 2 + 0.6), new THREE.Vector3(6.9, 3.0, -D / 2 + 1.8));

    this.interactiveObjects.push({
      id: 'fragment_b',
      type: 'fragment_b',
      name: 'Security Fragment B (North Wall)',
      prompt: 'Solve Logic Matrix (Press E)',
      position: [6, 1.5, -D / 2 + 1.2],
      hitRadius: 2.5,
      clueText: 'Solve sequence equation to find digit 4',
    });

    // ==========================================
    // 4. FRAGMENT C: EAST DIAGNOSTIC POD (Digit = 1)
    // ==========================================
    const fragCGroup = new THREE.Group();
    const podBaseC = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 1.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    podBaseC.position.y = 0.7;

    const podCrystalC = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.8,
      })
    );
    podCrystalC.position.y = 1.7;
    this.animatedMeshes.push(podCrystalC);

    const lightC = new THREE.PointLight(0x10b981, 1.2, 5);
    lightC.position.set(0, 1.9, 0);

    fragCGroup.add(podBaseC, podCrystalC, lightC);
    fragCGroup.position.set(8, 0, 3);
    this.scene.add(fragCGroup);
    this.addBoxCollider(new THREE.Vector3(7.1, 0, 2.1), new THREE.Vector3(8.9, 2.5, 3.9));

    this.interactiveObjects.push({
      id: 'fragment_c',
      type: 'fragment_c',
      name: 'Security Fragment C (East Pod)',
      prompt: 'Solve Optical Identity Riddle (Press E)',
      position: [8, 1.4, 3],
      hitRadius: 2.5,
      clueText: 'Answer mathematical riddle to discover digit 1',
    });

    // ==========================================
    // 5. FRAGMENT D: SOUTH RESEARCH TABLE (Digit = 6)
    // ==========================================
    const fragDGroup = new THREE.Group();
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });

    // Realistic Desk with proper tabletop, 4 support legs, and crossrails
    const researchDesk = this.createRealisticTable(2.6, 1.4, 1.05, 0.08, tableMat, legMat, 0.04);
    fragDGroup.add(researchDesk);

    // Datapad D resting cleanly on top of the desk surface (at y = 1.09)
    const datapadD = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.06, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.7,
      })
    );
    datapadD.position.set(0, 1.08, 0);
    datapadD.rotation.y = 0.2;

    const lightD = new THREE.PointLight(0xa855f7, 1.0, 5);
    lightD.position.set(0, 1.6, 0);

    // Realistic Research Chair sitting naturally in front of the desk (facing North)
    const researchChair = this.createRealisticChair(0.7, 0.7, 0.55, 0.5, chairMat, chromeMat);
    researchChair.position.set(0, 0, 1.3);
    researchChair.rotation.y = 0; // facing desk
    fragDGroup.add(datapadD, lightD, researchChair);

    fragDGroup.position.set(-6, 0, 5);
    this.scene.add(fragDGroup);

    // Exact Box Colliders for Desk and Chair
    this.addBoxCollider(
      new THREE.Vector3(-7.4, 0, 4.2),
      new THREE.Vector3(-4.6, 2.0, 6.8)
    );

    this.interactiveObjects.push({
      id: 'fragment_d',
      type: 'fragment_d',
      name: 'Security Fragment D (Research Pad)',
      prompt: 'Align Laser Deflector Coils (Press E)',
      position: [-6, 1.2, 5],
      hitRadius: 2.5,
      clueText: 'Activate coil switches to reach sum 6',
    });

    // ==========================================
    // 6. LEVEL 2 SECURITY DOOR ON SOUTH WALL
    // ==========================================
    this.vaultDoorGroup = new THREE.Group();
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 5.0, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    doorFrame.position.set(0, 2.5, 0);

    // Left Door Leaf
    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 4.4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    leftDoor.name = 'vaultDoorLeft';
    leftDoor.position.set(-1.1, 2.5, 0.1);

    // Right Door Leaf
    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 4.4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    rightDoor.name = 'vaultDoorRight';
    rightDoor.position.set(1.1, 2.5, 0.1);

    // Door Header Sign "LEVEL 2 SECURITY DOOR"
    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.8 })
    );
    signMesh.position.set(0, 4.8, 0.45);

    // Electronic Scanner Panel beside door
    const scannerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.9, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    scannerBox.position.set(2.8, 2.2, 0.2);

    const scannerLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    scannerLed.name = 'scannerLed';
    scannerLed.position.set(2.8, 2.4, 0.32);

    this.vaultDoorGroup.add(doorFrame, leftDoor, rightDoor, signMesh, scannerBox, scannerLed);
    this.vaultDoorGroup.position.set(0, 0, D / 2 - 0.3);
    this.scene.add(this.vaultDoorGroup);

    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(-2.6, 0, D / 2 - 1.0),
      new THREE.Vector3(2.6, 5.0, D / 2 + 0.5)
    );

    this.interactiveObjects.push({
      id: 'level2_security_door',
      type: 'level2_security_door',
      name: 'Level 2 Security Door',
      prompt: 'Unlock Level 2 Security Door (Requires Access Key)',
      position: [0, 2.0, D / 2 - 1.5],
      hitRadius: 2.8,
      requiredItem: 'access_key',
    });

    // Decorative Training Pods around Room
    const pod1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.7, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    pod1.position.set(-W / 2 + 2, 1.6, D / 2 - 3);
    this.scene.add(pod1);
    this.addBoxCollider(
      new THREE.Vector3(-W / 2 + 1.2, 0, D / 2 - 3.8),
      new THREE.Vector3(-W / 2 + 2.8, 3.4, D / 2 - 2.2)
    );

    const pod2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.7, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    pod2.position.set(W / 2 - 2, 1.6, D / 2 - 3);
    this.scene.add(pod2);
    this.addBoxCollider(
      new THREE.Vector3(W / 2 - 2.8, 0, D / 2 - 3.8),
      new THREE.Vector3(W / 2 - 1.2, 3.4, D / 2 - 2.2)
    );

    // Collectible Coins in Training Room
    const coinGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
    const coinPositions: [number, number, number][] = [
      [6, 0.5, 6],
      [-7, 0.5, 6],
      [-5, 0.5, -7],
      [5, 0.5, -7],
    ];

    coinPositions.forEach((pos, idx) => {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(coin);
      this.animatedMeshes.push(coin);

      this.interactiveObjects.push({
        id: `coin_${idx}`,
        type: 'coin_pickup',
        name: 'Gold Coin',
        prompt: 'Collect Gold Coin (+50 Coins)',
        position: pos,
        hitRadius: 1.6,
      });
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      laserBeams: this.laserGroup,
      clockPendulum: this.clockPendulum,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
    };
  }

  // ==========================================
  // LEVEL 2: THE PATTERN LAB (AGENT ACADEMY LEVEL 2)
  // Theme: Observation & Logical Reasoning with Visual Symbols (△, ○, ◻, ⬡, ✧)
  // ==========================================
  private buildLevel2CyberpunkLab(): EscapeRoomEnvironment {
    const W = 26;
    const D = 22;
    const H = 7.5;

    // Boundaries / Outer Colliders
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2));
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, D / 2));
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2));
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1));

    // Deep Indigo / Neon Violet Floor with Inlaid Geometric Patterns
    const floorTex = this.createPixelTexture('pattern_floor');
    floorTex.repeat.set(8, 6);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.6 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Deep Indigo Cosmic Ceiling with Glowing Starfield Accents
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ color: 0x090514, roughness: 0.9 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    this.scene.add(ceil);

    // Walls with Purple Matrix Patterns & Embedded Geometric Inscriptions
    const wallTex = this.createPixelTexture('pattern_wall');
    wallTex.repeat.set(8, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.45, metalness: 0.5 });

    const nWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    nWall.position.set(0, H / 2, -D / 2);
    this.scene.add(nWall);

    const sWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    sWall.position.set(0, H / 2, D / 2);
    sWall.rotation.y = Math.PI;
    this.scene.add(sWall);

    const wWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    wWall.position.set(-W / 2, H / 2, 0);
    wWall.rotation.y = Math.PI / 2;
    this.scene.add(wWall);

    const eWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eWall.position.set(W / 2, H / 2, 0);
    eWall.rotation.y = -Math.PI / 2;
    this.scene.add(eWall);

    // Ambient & Atmospheric Neon Purple/Pink Lighting — High Clarity & Lively Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xf0abfc, 0x312e81, 0.95);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0xd946ef, 2.5, 36);
    mainLight.position.set(0, H - 1.2, 0);
    this.scene.add(mainLight);

    // 4 Glowing Cyberpunk Recessed Overhead Panels
    const l2CeilingPanels = [
      [-6, -4],
      [6, -4],
      [-6, 4],
      [6, 4],
    ];
    l2CeilingPanels.forEach(([lx, lz]) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe879f9, emissiveIntensity: 1.4 })
      );
      panel.position.set(lx, H - 0.05, lz);
      panel.rotation.x = Math.PI / 2;
      this.scene.add(panel);

      const pLight = new THREE.PointLight(0xfdf4ff, 1.4, 15);
      pLight.position.set(lx, H - 0.6, lz);
      this.scene.add(pLight);
    });

    // Dedicated South Doorway Floodlight
    const doorLight = new THREE.PointLight(0xf472b6, 3.4, 18);
    doorLight.position.set(0, 4.5, D / 2 - 2.0);
    this.scene.add(doorLight);

    // =========================================================================
    // CORNER AMETHYST MONOLITHS & RUNIC BEACONS
    // =========================================================================
    const corners = [
      { x: -W / 2 + 2.5, z: -D / 2 + 2.5 },
      { x: W / 2 - 2.5, z: -D / 2 + 2.5 },
      { x: -W / 2 + 2.5, z: D / 2 - 2.5 },
      { x: W / 2 - 2.5, z: D / 2 - 2.5 },
    ];

    corners.forEach((c) => {
      const obelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.7, 5.0, 4),
        new THREE.MeshStandardMaterial({ color: 0x180b2b, metalness: 0.85, roughness: 0.2 })
      );
      obelisk.position.set(c.x, 2.5, c.z);
      this.scene.add(obelisk);
      this.addBoxCollider(
        new THREE.Vector3(c.x - 0.6, 0, c.z - 0.6),
        new THREE.Vector3(c.x + 0.6, 5.5, c.z + 0.6)
      );

      const crystalCap = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45),
        new THREE.MeshStandardMaterial({ color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 1.0, roughness: 0.1 })
      );
      crystalCap.position.set(c.x, 5.3, c.z);
      this.scene.add(crystalCap);
      this.animatedMeshes.push(crystalCap);

      const beaconLight = new THREE.PointLight(0xd946ef, 0.8, 8);
      beaconLight.position.set(c.x, 5.5, c.z);
      this.scene.add(beaconLight);
    });

    // Overhead Floating Pattern Prisms (△ ○ ◻ ✧) with central gyroscope
    const prismGroup = new THREE.Group();

    // Central Gyroscope Dual Holographic Rings
    const gyroRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.05, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.9 })
    );
    gyroRing1.position.set(0, H - 2.5, -2);
    gyroRing1.rotation.x = Math.PI / 3;
    prismGroup.add(gyroRing1);
    this.animatedMeshes.push(gyroRing1);

    const gyroRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 })
    );
    gyroRing2.position.set(0, H - 2.5, -2);
    gyroRing2.rotation.y = Math.PI / 4;
    prismGroup.add(gyroRing2);
    this.animatedMeshes.push(gyroRing2);

    const triGeo = new THREE.ConeGeometry(0.5, 0.9, 3);
    const triMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.8 });
    const floatTri = new THREE.Mesh(triGeo, triMat);
    floatTri.position.set(-3.5, H - 2.0, -1);
    prismGroup.add(floatTri);
    this.animatedMeshes.push(floatTri);

    const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const floatSphere = new THREE.Mesh(sphereGeo, sphereMat);
    floatSphere.position.set(-1.2, H - 1.8, -2.5);
    prismGroup.add(floatSphere);
    this.animatedMeshes.push(floatSphere);

    const boxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.8 });
    const floatBox = new THREE.Mesh(boxGeo, boxMat);
    floatBox.position.set(1.2, H - 1.8, -2.5);
    prismGroup.add(floatBox);
    this.animatedMeshes.push(floatBox);

    const octaGeo = new THREE.OctahedronGeometry(0.5);
    const octaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.8 });
    const floatOcta = new THREE.Mesh(octaGeo, octaMat);
    floatOcta.position.set(3.5, H - 2.0, -1);
    prismGroup.add(floatOcta);
    this.animatedMeshes.push(floatOcta);

    this.scene.add(prismGroup);

    // =========================================================================
    // 1. MASTER PATTERN CONSOLE (Center of Room: -Z)
    // =========================================================================
    const masterConsoleGroup = new THREE.Group();
    const masterBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.8, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, metalness: 0.85, roughness: 0.25 })
    );
    masterBase.position.y = 0.6;

    const masterHoloRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.08, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0xd946ef })
    );
    masterHoloRing.rotation.x = Math.PI / 2;
    masterHoloRing.position.y = 1.25;

    const masterDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x120726, metalness: 0.9 })
    );
    masterDisplay.position.set(0, 1.8, 0);
    masterDisplay.rotation.x = -0.25;

    const masterScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x9333ea, emissiveIntensity: 0.6 })
    );
    masterScreen.position.set(0, 1.82, 0.16);
    masterScreen.rotation.x = -0.25;

    const masterKeypadLight = new THREE.PointLight(0xd946ef, 1.5, 7);
    masterKeypadLight.position.set(0, 2.2, 0.4);

    masterConsoleGroup.add(masterBase, masterHoloRing, masterDisplay, masterScreen, masterKeypadLight);
    masterConsoleGroup.position.set(0, 0, -2);
    this.scene.add(masterConsoleGroup);
    this.addBoxCollider(new THREE.Vector3(-1.6, 0, -3.2), new THREE.Vector3(1.6, 3.0, -0.8));

    this.interactiveObjects.push({
      id: 'pattern_panel_final',
      type: 'pattern_panel_final',
      name: 'Master Pattern Synthesizer',
      prompt: 'Access Grand Harmonic Terminal (Align Cores & Solve Equation)',
      position: [0, 1.5, -2],
      hitRadius: 2.6,
    });

    // =========================================================================
    // 2. PATTERN PANEL 1: WEST BAY — Compound Tri-Attribute Sequence
    // =========================================================================
    const panel1Group = new THREE.Group();
    const pod1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, metalness: 0.8 })
    );
    pod1.position.y = 0.65;

    const holoPillar1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.8, 3),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.9, wireframe: false })
    );
    holoPillar1.position.y = 1.8;
    this.animatedMeshes.push(holoPillar1);

    const light1 = new THREE.PointLight(0xec4899, 1.3, 6);
    light1.position.set(0, 2.0, 0);

    const sign1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.3, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xdb2777 })
    );
    sign1.position.set(0, 1.3, 0.78);

    panel1Group.add(pod1, holoPillar1, light1, sign1);
    panel1Group.position.set(-8, 0, -4);
    this.scene.add(panel1Group);
    this.addBoxCollider(new THREE.Vector3(-8.9, 0, -4.9), new THREE.Vector3(-7.1, 2.5, -3.1));

    this.interactiveObjects.push({
      id: 'pattern_panel_1',
      type: 'pattern_panel_1',
      name: 'Pattern Panel 1 (West Bay)',
      prompt: 'Solve Tri-Attribute Morphing Sequence (Press E)',
      position: [-8, 1.4, -4],
      hitRadius: 2.5,
      clueText: '△(3v,1•,0°) ➔ ◻(4v,2•,90°) ➔ ⬠(5v,3•,180°) ➔ ⬡(6v,4•,270°) ➔ [ ? ]',
    });

    // =========================================================================
    // 3. PATTERN PANEL 2: NORTH WALL — 3x3 Raven Superposition Matrix
    // =========================================================================
    const panel2Group = new THREE.Group();
    const pod2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.3, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, metalness: 0.8 })
    );
    pod2.position.y = 0.65;

    const holoPillar2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 })
    );
    holoPillar2.position.y = 1.8;
    this.animatedMeshes.push(holoPillar2);

    const light2 = new THREE.PointLight(0x38bdf8, 1.3, 6);
    light2.position.set(0, 2.0, 0);

    panel2Group.add(pod2, holoPillar2, light2);
    panel2Group.position.set(0, 0, -D / 2 + 2);
    this.scene.add(panel2Group);
    this.addBoxCollider(new THREE.Vector3(-0.95, 0, -D / 2 + 1.2), new THREE.Vector3(0.95, 2.5, -D / 2 + 2.8));

    this.interactiveObjects.push({
      id: 'pattern_panel_2',
      type: 'pattern_panel_2',
      name: 'Pattern Panel 2 (North Terminal)',
      prompt: 'Solve Raven Superposition Matrix (Press E)',
      position: [0, 1.4, -D / 2 + 2],
      hitRadius: 2.5,
      clueText: 'Row 3: Outer Square (▢) ⊕ Inlaid Diamond (◇) = Composite Matrix (◈)',
    });

    // =========================================================================
    // 4. PATTERN PANEL 3: EAST BAY — Dual-Axis Cycloid & Spectral Wave
    // =========================================================================
    const panel3Group = new THREE.Group();
    const pod3 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, metalness: 0.8 })
    );
    pod3.position.y = 0.65;

    const holoPillar3 = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.9 })
    );
    holoPillar3.position.y = 1.8;
    this.animatedMeshes.push(holoPillar3);

    const light3 = new THREE.PointLight(0xa855f7, 1.3, 6);
    light3.position.set(0, 2.0, 0);

    panel3Group.add(pod3, holoPillar3, light3);
    panel3Group.position.set(8, 0, -4);
    this.scene.add(panel3Group);
    this.addBoxCollider(new THREE.Vector3(7.1, 0, -4.9), new THREE.Vector3(8.9, 2.5, -3.1));

    this.interactiveObjects.push({
      id: 'pattern_panel_3',
      type: 'pattern_panel_3',
      name: 'Pattern Panel 3 (East Chamber)',
      prompt: 'Solve Rotational & Spectral Cycloid (Press E)',
      position: [8, 1.4, -4],
      hitRadius: 2.5,
      clueText: 'Angle (▲ ▷ ▼ ◁ ▲) + Spectrum (Red ➔ Violet) + Core (● ◎ ● ◎ ●)',
    });

    // =========================================================================
    // 5. OBSERVATION STATIONS & CLUE BOARDS (West Wall & East Wall)
    // =========================================================================
    // Observation Station 1 (West Wall)
    const obsGroup1 = new THREE.Group();
    const obsBoard1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.2, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, roughness: 0.3, metalness: 0.8 })
    );
    obsBoard1.position.set(-W / 2 + 0.3, 2.5, 1);
    const obsScreen1 = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xdb2777, emissive: 0x9d174d, emissiveIntensity: 0.4 })
    );
    obsScreen1.rotation.y = Math.PI / 2;
    obsScreen1.position.set(-W / 2 + 0.42, 2.5, 1);
    obsGroup1.add(obsBoard1, obsScreen1);
    this.scene.add(obsGroup1);
    this.addBoxCollider(
      new THREE.Vector3(-W / 2, 0, -0.6),
      new THREE.Vector3(-W / 2 + 0.6, 4.0, 2.6)
    );

    this.interactiveObjects.push({
      id: 'pattern_clue_board_1',
      type: 'pattern_clue_board_1',
      name: 'Geometric Reference Chart (West Wall)',
      prompt: 'Inspect Visual Axioms (Press E)',
      position: [-W / 2 + 1.2, 2.0, 1],
      hitRadius: 2.5,
    });

    // Observation Station 2 (East Wall)
    const obsGroup2 = new THREE.Group();
    const obsBoard2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.2, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, roughness: 0.3, metalness: 0.8 })
    );
    obsBoard2.position.set(W / 2 - 0.3, 2.5, 1);
    const obsScreen2 = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4 })
    );
    obsScreen2.rotation.y = -Math.PI / 2;
    obsScreen2.position.set(W / 2 - 0.42, 2.5, 1);
    obsGroup2.add(obsBoard2, obsScreen2);
    this.scene.add(obsGroup2);
    this.addBoxCollider(
      new THREE.Vector3(W / 2 - 0.6, 0, -0.6),
      new THREE.Vector3(W / 2, 4.0, 2.6)
    );

    this.interactiveObjects.push({
      id: 'pattern_clue_board_2',
      type: 'pattern_clue_board_2',
      name: 'Symbolic Frequency Table (East Wall)',
      prompt: 'Examine Logic Rules (Press E)',
      position: [W / 2 - 1.2, 2.0, 1],
      hitRadius: 2.5,
    });

    // =========================================================================
    // 6. LEVEL 3 SECURITY DOOR (South Wall) — Requires 🔑 Pattern Key
    // =========================================================================
    this.vaultDoorGroup = new THREE.Group();
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 5.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, metalness: 0.9 })
    );
    doorFrame.position.set(0, 2.7, 0);

    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 4.8, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2e1065, metalness: 0.8, roughness: 0.3 })
    );
    leftDoor.position.set(-1.1, 2.6, 0.1);

    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 4.8, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2e1065, metalness: 0.8, roughness: 0.3 })
    );
    rightDoor.position.set(1.1, 2.6, 0.1);

    // Door Header Sign "LEVEL 3 ACCESS GATE"
    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.9 })
    );
    signMesh.position.set(0, 4.9, 0.45);

    // Electronic Pattern Scanner Lock beside door
    const scannerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.0, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x1e1035, metalness: 0.8 })
    );
    scannerBox.position.set(2.9, 2.2, 0.2);

    const scannerLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 1.0 })
    );
    scannerLed.position.set(2.9, 2.4, 0.32);

    this.vaultDoorGroup.add(doorFrame, leftDoor, rightDoor, signMesh, scannerBox, scannerLed);
    this.vaultDoorGroup.position.set(0, 0, D / 2 - 0.3);
    this.scene.add(this.vaultDoorGroup);

    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(-2.6, 0, D / 2 - 1.0),
      new THREE.Vector3(2.6, 5.0, D / 2 + 0.5)
    );

    this.interactiveObjects.push({
      id: 'level3_pattern_door',
      type: 'level3_pattern_door',
      name: 'Level 3 Security Door',
      prompt: 'Unlock Level 3 Door (Requires 🔑 Pattern Key)',
      position: [0, 2.0, D / 2 - 1.5],
      hitRadius: 2.8,
      requiredItem: 'pattern_key',
    });

    // Decorative Pattern Obelisks
    const obeliskGeo = new THREE.BoxGeometry(0.6, 3.4, 0.6);
    const obeliskMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, metalness: 0.8 });

    const obelisk1 = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk1.position.set(-W / 2 + 2, 1.7, D / 2 - 3);
    this.scene.add(obelisk1);
    this.addBoxCollider(
      new THREE.Vector3(-W / 2 + 1.6, 0, D / 2 - 3.4),
      new THREE.Vector3(-W / 2 + 2.4, 3.6, D / 2 - 2.6)
    );

    const obelisk2 = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk2.position.set(W / 2 - 2, 1.7, D / 2 - 3);
    this.scene.add(obelisk2);
    this.addBoxCollider(
      new THREE.Vector3(W / 2 - 2.4, 0, D / 2 - 3.4),
      new THREE.Vector3(W / 2 - 1.6, 3.6, D / 2 - 2.6)
    );

    // Collectible Pattern Crystals / Gems
    const gemGeo = new THREE.OctahedronGeometry(0.32);
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, metalness: 0.9, roughness: 0.1 });
    const gemPos: [number, number, number][] = [
      [-7, 0.6, 5],
      [7, 0.6, 5],
      [-6, 0.6, -6],
      [6, 0.6, -6],
    ];

    gemPos.forEach((p, idx) => {
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(p[0], p[1], p[2]);
      this.scene.add(gem);
      this.animatedMeshes.push(gem);

      this.interactiveObjects.push({
        id: `gem_${idx}`,
        type: 'cryo_gem',
        name: 'Pattern Crystal',
        prompt: 'Collect Pattern Crystal (+50 Coins)',
        position: p,
        hitRadius: 1.6,
      });
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      laserBeams: this.laserGroup,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
    };
  }

  // ==========================================
  // LEVEL 3: THE MEMORY CHAMBER (Agent Academy)
  // ==========================================
  private buildLevel3MemoryChamber(): EscapeRoomEnvironment {
    const W = 26;
    const D = 24;
    const H = 8;

    // Boundaries / Colliders
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2));
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, D / 2));
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2));
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1));

    // High-Tech Neon Memory Grid Floor
    const floorTex = this.createPixelTexture('memory_floor');
    floorTex.repeat.set(10, 9);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ map: floorTex, metalness: 0.8, roughness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Dark Cyber Ceiling with Inset Neon Blue Panels
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(W, D),
      new THREE.MeshStandardMaterial({ color: 0x050b18, metalness: 0.9, roughness: 0.4 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    this.scene.add(ceil);

    // Memory Waveguide Cyber Walls
    const wallTex = this.createPixelTexture('memory_wall');
    wallTex.repeat.set(8, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, metalness: 0.7, roughness: 0.3 });

    const nWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    nWall.position.set(0, H / 2, -D / 2);
    this.scene.add(nWall);

    const sWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    sWall.position.set(0, H / 2, D / 2);
    sWall.rotation.y = Math.PI;
    this.scene.add(sWall);

    const wWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    wWall.position.set(-W / 2, H / 2, 0);
    wWall.rotation.y = Math.PI / 2;
    this.scene.add(wWall);

    const eWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eWall.position.set(W / 2, H / 2, 0);
    eWall.rotation.y = -Math.PI / 2;
    this.scene.add(eWall);

    // Deep Atmosphere & Cyber Lighting — Crisp, Highly Visible & Lively Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.95);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0x38bdf8, 2.8, 40);
    mainLight.position.set(0, H - 1.2, 0);
    this.scene.add(mainLight);

    // 4 Glowing Cyan Memory Grid Recessed Ceiling Panels
    const l3CeilingPanels = [
      [-6, -4],
      [6, -4],
      [-6, 4],
      [6, 4],
    ];
    l3CeilingPanels.forEach(([lx, lz]) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f0ff, emissiveIntensity: 1.4 })
      );
      panel.position.set(lx, H - 0.05, lz);
      panel.rotation.x = Math.PI / 2;
      this.scene.add(panel);

      const pLight = new THREE.PointLight(0xe0f2fe, 1.4, 15);
      pLight.position.set(lx, H - 0.6, lz);
      this.scene.add(pLight);
    });
    this.scene.add(mainLight);

    // Wall Sconces & Neon Strip Pillars (North, South, East, West)
    const wallNeonColors = [0x00f0ff, 0x38bdf8, 0x06b6d4, 0x3b82f6];
    const wallPositions = [
      { x: -W / 2 + 0.2, y: 3.5, z: -4, rx: 0, ry: Math.PI / 2, rz: 0 },
      { x: -W / 2 + 0.2, y: 3.5, z: 4, rx: 0, ry: Math.PI / 2, rz: 0 },
      { x: W / 2 - 0.2, y: 3.5, z: -4, rx: 0, ry: -Math.PI / 2, rz: 0 },
      { x: W / 2 - 0.2, y: 3.5, z: 4, rx: 0, ry: -Math.PI / 2, rz: 0 },
      { x: -6, y: 3.5, z: -D / 2 + 0.2, rx: 0, ry: 0, rz: 0 },
      { x: 6, y: 3.5, z: -D / 2 + 0.2, rx: 0, ry: 0, rz: 0 },
    ];
    wallPositions.forEach((wp, idx) => {
      const neonStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 4.5, 0.1),
        new THREE.MeshStandardMaterial({
          color: wallNeonColors[idx % wallNeonColors.length],
          emissive: wallNeonColors[idx % wallNeonColors.length],
          emissiveIntensity: 1.6,
        })
      );
      neonStrip.position.set(wp.x, wp.y, wp.z);
      neonStrip.rotation.set(wp.rx, wp.ry, wp.rz);
      this.scene.add(neonStrip);

      const stripLight = new THREE.PointLight(wallNeonColors[idx % wallNeonColors.length], 0.8, 10);
      stripLight.position.set(wp.x, wp.y, wp.z);
      this.scene.add(stripLight);
    });

    // Glowing Floor Runway Guidance Strips (leading straight from dais to the South Exit Door)
    for (let rz = 2.5; rz <= D / 2 - 2.5; rz += 1.8) {
      const runwayStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.25),
        new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00f0ff,
          emissiveIntensity: 1.5,
          side: THREE.DoubleSide,
        })
      );
      runwayStrip.rotation.x = -Math.PI / 2;
      runwayStrip.position.set(0, 0.03, rz);
      this.scene.add(runwayStrip);

      // Flanking floor dots
      const dotL = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.8 })
      );
      dotL.rotation.x = -Math.PI / 2;
      dotL.position.set(-1.4, 0.03, rz);
      this.scene.add(dotL);

      const dotR = dotL.clone();
      dotR.position.set(1.4, 0.03, rz);
      this.scene.add(dotR);
    }

    // =========================================================================
    // 1. GIANT CENTRAL MEMORY DISPLAY & MONOLITHIC CONSOLE
    // =========================================================================
    const centralGroup = new THREE.Group();

    // Stepped Hexagonal / Circular Base Dais
    const daisBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.0, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 })
    );
    daisBase.position.y = 0.2;

    const daisRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.08, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x06b6d4, emissiveIntensity: 0.9 })
    );
    daisRing.rotation.x = Math.PI / 2;
    daisRing.position.y = 0.42;

    // Central Pillar Column
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    );
    column.position.y = 1.2;

    // Massive Holographic Display Screen Frame
    const screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 3.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    screenFrame.position.set(0, 3.5, 0);

    // Glowing Neon Cyan Display Surface
    const screenSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.8),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.85,
        metalness: 0.5,
        roughness: 0.1,
      })
    );
    screenSurface.position.set(0, 3.5, 0.16);

    // 4 Corner Color Emitters on Screen Bezel (Blue, Red, Green, Yellow)
    const emitterBlue = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.0 })
    );
    emitterBlue.position.set(-2.3, 4.8, 0.2);

    const emitterRed = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0xdc2626, emissiveIntensity: 1.0 })
    );
    emitterRed.position.set(2.3, 4.8, 0.2);

    const emitterGreen = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x16a34a, emissiveIntensity: 1.0 })
    );
    emitterGreen.position.set(-2.3, 2.2, 0.2);

    const emitterYellow = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 1.0 })
    );
    emitterYellow.position.set(2.3, 2.2, 0.2);

    // Rotating Holographic Ring around Screen
    const holoRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00f0ff, emissiveIntensity: 0.8 })
    );
    holoRing.position.set(0, 3.5, 0);
    this.animatedMeshes.push(holoRing);

    centralGroup.add(
      daisBase,
      daisRing,
      column,
      screenFrame,
      screenSurface,
      emitterBlue,
      emitterRed,
      emitterGreen,
      emitterYellow,
      holoRing
    );
    centralGroup.position.set(0, 0, -1.5);
    this.scene.add(centralGroup);
    this.addBoxCollider(new THREE.Vector3(-1.6, 0, -2.8), new THREE.Vector3(1.6, 3.5, -0.2));

    this.interactiveObjects.push({
      id: 'memory_central_display',
      type: 'memory_central_display',
      name: 'Central Memory Display & Terminal',
      prompt: 'Access Central Memory Screen (Watch & Reproduce Sequence)',
      position: [0, 1.8, -1.5],
      hitRadius: 3.4,
    });

    // =========================================================================
    // 2. BLUE MEMORY STATION [CYAN] (North-West Bay: [-7, 0, -6])
    // =========================================================================
    const blueGroup = new THREE.Group();
    const bluePed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    bluePed.position.y = 0.7;

    const bluePad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x00f0ff, emissiveIntensity: 1.0 })
    );
    bluePad.position.y = 1.45;

    const blueOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9, metalness: 0.9 })
    );
    blueOrb.position.y = 2.1;
    this.animatedMeshes.push(blueOrb);

    const blueLight = new THREE.PointLight(0x00f0ff, 1.0, 8);
    blueLight.position.set(0, 2.2, 0);

    blueGroup.add(bluePed, bluePad, blueOrb, blueLight);
    blueGroup.position.set(-7, 0, -6);
    this.scene.add(blueGroup);
    this.addBoxCollider(new THREE.Vector3(-8.15, 0, -7.15), new THREE.Vector3(-5.85, 2.5, -4.85));

    this.interactiveObjects.push({
      id: 'memory_button_blue',
      type: 'memory_button_blue',
      name: 'Blue Memory Terminal [Cyan]',
      prompt: 'Activate Blue Frequency Node (Press E)',
      position: [-7, 1.2, -6],
      hitRadius: 2.5,
    });

    // =========================================================================
    // 3. RED MEMORY STATION [CRIMSON] (North-East Bay: [7, 0, -6])
    // =========================================================================
    const redGroup = new THREE.Group();
    const redPed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    redPed.position.y = 0.7;

    const redPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    redPad.position.y = 1.45;

    const redOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0xb91c1c, emissiveIntensity: 0.9, metalness: 0.9 })
    );
    redOrb.position.y = 2.1;
    this.animatedMeshes.push(redOrb);

    const redLight = new THREE.PointLight(0xef4444, 1.0, 8);
    redLight.position.set(0, 2.2, 0);

    redGroup.add(redPed, redPad, redOrb, redLight);
    redGroup.position.set(7, 0, -6);
    this.scene.add(redGroup);
    this.addBoxCollider(new THREE.Vector3(5.85, 0, -7.15), new THREE.Vector3(8.15, 2.5, -4.85));

    this.interactiveObjects.push({
      id: 'memory_button_red',
      type: 'memory_button_red',
      name: 'Red Memory Terminal [Crimson]',
      prompt: 'Activate Red Frequency Node (Press E)',
      position: [7, 1.2, -6],
      hitRadius: 2.5,
    });

    // =========================================================================
    // 4. GREEN MEMORY STATION [EMERALD] (South-West Bay: [-7, 0, 5])
    // =========================================================================
    const greenGroup = new THREE.Group();
    const greenPed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    greenPed.position.y = 0.7;

    const greenPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x047857, emissive: 0x10b981, emissiveIntensity: 1.0 })
    );
    greenPad.position.y = 1.45;

    const greenOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x047857, emissiveIntensity: 0.9, metalness: 0.9 })
    );
    greenOrb.position.y = 2.1;
    this.animatedMeshes.push(greenOrb);

    const greenLight = new THREE.PointLight(0x10b981, 1.0, 8);
    greenLight.position.set(0, 2.2, 0);

    greenGroup.add(greenPed, greenPad, greenOrb, greenLight);
    greenGroup.position.set(-7, 0, 5);
    this.scene.add(greenGroup);
    this.addBoxCollider(new THREE.Vector3(-8.15, 0, 3.85), new THREE.Vector3(-5.85, 2.5, 6.15));

    this.interactiveObjects.push({
      id: 'memory_button_green',
      type: 'memory_button_green',
      name: 'Green Memory Terminal [Emerald]',
      prompt: 'Activate Green Frequency Node (Press E)',
      position: [-7, 1.2, 5],
      hitRadius: 2.5,
    });

    // =========================================================================
    // 5. YELLOW MEMORY STATION [AMBER] (South-East Bay: [7, 0, 5])
    // =========================================================================
    const yellowGroup = new THREE.Group();
    const yellowPed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    yellowPed.position.y = 0.7;

    const yellowPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0xf59e0b, emissiveIntensity: 1.0 })
    );
    yellowPad.position.y = 1.45;

    const yellowOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xb45309, emissiveIntensity: 0.9, metalness: 0.9 })
    );
    yellowOrb.position.y = 2.1;
    this.animatedMeshes.push(yellowOrb);

    const yellowLight = new THREE.PointLight(0xf59e0b, 1.0, 8);
    yellowLight.position.set(0, 2.2, 0);

    yellowGroup.add(yellowPed, yellowPad, yellowOrb, yellowLight);
    yellowGroup.position.set(7, 0, 5);
    this.scene.add(yellowGroup);
    this.addBoxCollider(new THREE.Vector3(5.85, 0, 3.85), new THREE.Vector3(8.15, 2.5, 6.15));

    this.interactiveObjects.push({
      id: 'memory_button_yellow',
      type: 'memory_button_yellow',
      name: 'Yellow Memory Terminal [Amber]',
      prompt: 'Activate Yellow Frequency Node (Press E)',
      position: [7, 1.2, 5],
      hitRadius: 2.5,
    });

    // =========================================================================
    // 6. MEMORY PROTOCOL ARCHIVE BOARD (North Wall)
    // =========================================================================
    const boardGroup = new THREE.Group();
    const boardBack = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 3.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    boardBack.position.y = 3.6;

    const boardScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(6.0, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, emissive: 0x0284c7, emissiveIntensity: 0.7 })
    );
    boardScreen.position.set(0, 3.6, 0.12);

    boardGroup.add(boardBack, boardScreen);
    boardGroup.position.set(0, 0, -D / 2 + 0.3);
    this.scene.add(boardGroup);

    this.interactiveObjects.push({
      id: 'memory_clue_board',
      type: 'memory_clue_board',
      name: 'Memory Protocol Archive',
      prompt: 'Inspect Cognitive Chamber Rules (Press E)',
      position: [0, 2.4, -D / 2 + 1.2],
      hitRadius: 2.5,
      clueText: 'Round 1: 3 Colors | Round 2: 4 Colors | Round 3: 5 Colors -> Generates Master Exit Access Code',
    });

    // =========================================================================
    // 7. LEVEL 4 SECURITY EXIT GATE & KEYPAD PORTAL (South Wall)
    // =========================================================================
    this.vaultDoorGroup = new THREE.Group();

    // Heavy Reinforced Blast Door Frame
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 6.0, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    doorFrame.position.set(0, 3.0, 0);

    // Left and Right Sliding Blast Doors with Glowing Neon Insets
    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 5.0, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.85, roughness: 0.25 })
    );
    leftDoor.position.set(-1.15, 2.7, 0.1);

    const leftDoorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 4.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.0 })
    );
    leftDoorGlow.position.set(-0.2, 2.7, 0.1);

    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 5.0, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.85, roughness: 0.25 })
    );
    rightDoor.position.set(1.15, 2.7, 0.1);

    const rightDoorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 4.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.0 })
    );
    rightDoorGlow.position.set(0.2, 2.7, 0.1);

    // Glowing Neon Archway Border (Cyan Outer Ring)
    const neonTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.22, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.4 })
    );
    neonTop.position.set(0, 5.95, 0.45);

    const neonLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 5.9, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.4 })
    );
    neonLeft.position.set(-2.8, 2.95, 0.45);

    const neonRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 5.9, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.4 })
    );
    neonRight.position.set(2.8, 2.95, 0.45);

    // Illuminated Exit Billboard Header: "EXIT // LEVEL 4 ACCESS"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 })
    );
    signBoard.position.set(0, 5.2, 0.48);

    const signTextGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00f0ff, emissiveIntensity: 2.2 })
    );
    signTextGlow.position.set(0, 5.2, 0.6);

    // Security Clearance Keypad Pedestal & Screen
    const keypadPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    keypadPillar.position.set(3.2, 1.1, 0.4);

    const keypadBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
    );
    keypadBox.position.set(3.2, 2.3, 0.4);

    const keypadScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00f0ff, emissiveIntensity: 2.0 })
    );
    keypadScreen.position.set(3.2, 2.45, 0.56);

    const keypadHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.03, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2.0 })
    );
    keypadHalo.position.set(3.2, 2.3, 0.45);
    this.animatedMeshes.push(keypadHalo);

    this.vaultDoorGroup.add(
      doorFrame,
      leftDoor,
      leftDoorGlow,
      rightDoor,
      rightDoorGlow,
      neonTop,
      neonLeft,
      neonRight,
      signBoard,
      signTextGlow,
      keypadPillar,
      keypadBox,
      keypadScreen,
      keypadHalo
    );
    this.vaultDoorGroup.position.set(0, 0, D / 2 - 0.3);
    this.scene.add(this.vaultDoorGroup);

    // High-Intensity Dedicated Spotlights & Pointlights for South Door (Crisp & Bright)
    const doorFloodLight = new THREE.PointLight(0x00f0ff, 4.0, 18);
    doorFloodLight.position.set(0, 5.5, D / 2 - 2.2);
    this.scene.add(doorFloodLight);

    const doorSpotLight = new THREE.SpotLight(0x38bdf8, 5.0, 22, Math.PI / 3, 0.2);
    doorSpotLight.position.set(0, 6.8, D / 2 - 4.0);
    doorSpotLight.target.position.set(0, 2.5, D / 2);
    this.scene.add(doorSpotLight);
    this.scene.add(doorSpotLight.target);

    // Left and Right Flanking Green Security Beacons
    const beaconL = new THREE.PointLight(0x10b981, 1.8, 8);
    beaconL.position.set(-3.2, 3.2, D / 2 - 0.8);
    this.scene.add(beaconL);

    const beaconR = new THREE.PointLight(0x10b981, 1.8, 8);
    beaconR.position.set(3.2, 3.2, D / 2 - 0.8);
    this.scene.add(beaconR);

    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(-2.8, 0, D / 2 - 1.0),
      new THREE.Vector3(2.8, 5.5, D / 2 + 0.5)
    );

    this.interactiveObjects.push({
      id: 'level4_memory_door',
      type: 'level4_memory_door',
      name: 'Level 4 Security Exit Keypad',
      prompt: 'Enter Access Code at Exit Keypad (Leads to Level 4)',
      position: [0, 2.0, D / 2 - 1.5],
      hitRadius: 3.2,
    });

    // =========================================================================
    // 8. COLLECTIBLE MEMORY CRYSTALS (4 Corners)
    // =========================================================================
    const crystalGeo = new THREE.OctahedronGeometry(0.32);
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 });
    const crystalPos: [number, number, number][] = [
      [-9, 0.6, 7],
      [9, 0.6, 7],
      [-9, 0.6, -7],
      [9, 0.6, -7],
    ];

    crystalPos.forEach((p, idx) => {
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(p[0], p[1], p[2]);
      this.scene.add(crystal);
      this.animatedMeshes.push(crystal);

      this.interactiveObjects.push({
        id: `memory_gem_${idx}`,
        type: 'cryo_gem',
        name: 'Memory Energy Crystal',
        prompt: 'Collect Memory Crystal (+50 Coins)',
        position: p,
        hitRadius: 1.6,
      });
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      laserBeams: this.laserGroup,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
    };
  }

  // =========================================================================
  // LEVEL 4: THE EVIDENCE ROOM — DETECTIVE & INVESTIGATION CHALLENGE
  // =========================================================================
  private buildLevel4EvidenceRoom(): EscapeRoomEnvironment {
    const W = 28;
    const D = 24;
    const H = 7.5;

    // Floor — Rich Warm Parquet Wood Floor
    const floorTex = this.createPixelTexture('office_parquet');
    floorTex.repeat.set(14, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Large Center Investigation Area Rug
    const carpetTex = this.createPixelTexture('carpet');
    carpetTex.repeat.set(6, 5);
    const carpetMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.8, metalness: 0.05 })
    );
    carpetMesh.rotation.x = -Math.PI / 2;
    carpetMesh.position.set(0, 0.01, 0);
    this.scene.add(carpetMesh);

    // Ceiling — Modern Acoustic Grid with Recessed Panel Fixtures
    const ceilTex = this.createPixelTexture('office_wall');
    ceilTex.repeat.set(14, 12);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilTex,
      roughness: 0.8,
      metalness: 0.05,
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
    ceiling.position.y = H;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Walls — Bright Warm Slate Intelligence Agency Bureau Walls
    const wallTex = this.createPixelTexture('office_wall');
    wallTex.repeat.set(14, 4);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.6,
      metalness: 0.1,
    });

    // North Wall
    const nWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    nWall.position.set(0, H / 2, -D / 2);
    this.scene.add(nWall);

    // South Wall
    const sWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    sWall.position.set(0, H / 2, D / 2);
    sWall.rotation.y = Math.PI;
    this.scene.add(sWall);

    // West Wall
    const wWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    wWall.position.set(-W / 2, H / 2, 0);
    wWall.rotation.y = Math.PI / 2;
    this.scene.add(wWall);

    // East Wall
    const eWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eWall.position.set(W / 2, H / 2, 0);
    eWall.rotation.y = -Math.PI / 2;
    this.scene.add(eWall);

    // Boundary Colliders (East, West, North, and South wall corners leaving center doorway [x: -2.8 to +2.8] clear)
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2 - 1), new THREE.Vector3(-W / 2 + 0.5, H, D / 2 + 1));
    this.addBoxCollider(new THREE.Vector3(W / 2 - 0.5, 0, -D / 2 - 1), new THREE.Vector3(W / 2 + 1, H, D / 2 + 1));
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2 - 1), new THREE.Vector3(W / 2 + 1, H, -D / 2 + 0.5));
    // South wall left flank collider
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, D / 2 - 0.5), new THREE.Vector3(-2.8, H, D / 2 + 1));
    // South wall right flank collider
    this.addBoxCollider(new THREE.Vector3(2.8, 0, D / 2 - 0.5), new THREE.Vector3(W / 2 + 1, H, D / 2 + 1));

    // =========================================================================
    // BRIGHT, LIVELY & PROFESSIONAL ARCHITECTURAL LIGHTING
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.95);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 0.85);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0xffedd5, 2.2, 34);
    mainLight.position.set(0, H - 1.2, 0);
    this.scene.add(mainLight);

    // Daylight ceiling light panels
    const ceilingLights = [
      [-6, -4],
      [6, -4],
      [-6, 4],
      [6, 4],
    ];
    ceilingLights.forEach(([lx, lz]) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff7ed, emissiveIntensity: 1.5 })
      );
      panel.position.set(lx, H - 0.05, lz);
      panel.rotation.x = Math.PI / 2;
      this.scene.add(panel);

      const pLight = new THREE.PointLight(0xfffbeb, 1.2, 14);
      pLight.position.set(lx, H - 0.5, lz);
      this.scene.add(pLight);
    });

    // =========================================================================
    // 1. WEST INVESTIGATION STATION: DESK, BADGE LOG & DOSSIERS
    // =========================================================================
    const deskGroup = new THREE.Group();
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.3, metalness: 0.1 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    // Procedural 4-legged realistic office desk
    const westDeskTable = this.createRealisticTable(5.2, 2.2, 1.05, 0.08, deskMat, legMat, 0.05);
    westDeskTable.position.set(0, 0, 0);

    // Dual Monitors on Desk (sitting flush on tabletop y = 1.05)
    const monitorFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const screenMat1 = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 1.2 });
    const mon1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), monitorFrameMat);
    mon1.position.set(-0.8, 1.6, -0.6);
    const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), screenMat1);
    screen1.position.set(-0.8, 1.6, -0.55);

    const screenMat2 = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2 });
    const mon2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), monitorFrameMat);
    mon2.position.set(0.6, 1.6, -0.6);
    mon2.rotation.y = -0.15;
    const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), screenMat2);
    screen2.position.set(0.6, 1.6, -0.55);
    screen2.rotation.y = -0.15;

    // Green Banker Desk Lamp with warm glow (sitting flush on desk)
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85 });
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.06), lampMat);
    lampBase.position.set(-2.0, 1.08, 0.4);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), lampMat);
    lampStem.position.set(-2.0, 1.38, 0.4);
    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x15803d, emissive: 0x16a34a, emissiveIntensity: 0.8 })
    );
    lampShade.position.set(-2.0, 1.68, 0.4);
    lampShade.rotation.x = Math.PI / 8;

    const deskLampLight = new THREE.PointLight(0xfef08a, 1.5, 6);
    deskLampLight.position.set(-2.0, 1.6, 0.4);

    // Case Dossier Binders on Desk
    const binderMatA = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const binderA = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.8), binderMatA);
    binderA.position.set(1.8, 1.09, 0.3);
    binderA.rotation.y = 0.2;

    const binderMatB = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const binderB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.8), binderMatB);
    binderB.position.set(1.85, 1.15, 0.32);
    binderB.rotation.y = 0.35;

    // Coffee Mug & Pens
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    mug.position.set(-1.2, 1.14, 0.5);

    deskGroup.add(
      westDeskTable,
      mon1,
      screen1,
      mon2,
      screen2,
      lampBase,
      lampStem,
      lampShade,
      deskLampLight,
      binderA,
      binderB,
      mug
    );
    deskGroup.position.set(-8, 0, -2.5);
    this.scene.add(deskGroup);

    // Leather Swivel Chair facing desk
    const officeChairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const swivelChair = this.createRealisticChair(0.7, 0.7, 0.52, 0.5, officeChairMat, chromeMat);
    swivelChair.position.set(-8, 0, -0.6);
    swivelChair.rotation.y = 0; // facing North towards desk
    this.scene.add(swivelChair);

    // Solid Box Colliders for West Desk and Swivel Chair
    this.addBoxCollider(
      new THREE.Vector3(-10.8, 0, -3.8),
      new THREE.Vector3(-5.2, 2.5, -1.2)
    );
    this.addBoxCollider(
      new THREE.Vector3(-8.6, 0, -1.2),
      new THREE.Vector3(-7.4, 1.8, 0.0)
    );

    // Interactive West Desk Clues
    this.interactiveObjects.push({
      id: 'evidence_badge_reader_log',
      type: 'evidence_badge_reader_log',
      name: 'Door Badge Access Station',
      prompt: 'Inspect Door Badge Reader Logs (West Desk)',
      position: [-8.8, 1.6, -2.5],
      hitRadius: 2.8,
    });

    this.interactiveObjects.push({
      id: 'evidence_suspect_dossiers',
      type: 'evidence_suspect_dossiers',
      name: 'Suspect Case Dossier Binders',
      prompt: 'Review Suspect Profiles & Clearance Dossiers',
      position: [-6.8, 1.6, -2.2],
      hitRadius: 2.8,
    });

    // =========================================================================
    // 2. NORTH WALL: SECURITY MAINFRAME & INCIDENT BREACH TERMINAL
    // =========================================================================
    const serverGroup = new THREE.Group();
    // Server Tower Cabinets
    const serverMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const serverLeft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.0, 1.4), serverMat);
    serverLeft.position.set(-2.8, 2.5, 0);
    const serverRight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.0, 1.4), serverMat);
    serverRight.position.set(2.8, 2.5, 0);

    // Glowing Server Status Lights
    const serverLedMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.0 });
    for (let sy = 1.0; sy <= 4.5; sy += 0.5) {
      const ledL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.05), serverLedMat);
      ledL.position.set(-2.8, sy, 0.72);
      const ledR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.05), serverLedMat);
      ledR.position.set(2.8, sy, 0.72);
      serverGroup.add(ledL, ledR);
    }

    // Realistic Mainframe Console Table with Tabletop and Sturdy Legs
    const consoleTableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const consoleLegMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const mainConsoleDesk = this.createRealisticTable(3.6, 1.4, 1.05, 0.08, consoleTableMat, consoleLegMat, 0.05);
    mainConsoleDesk.position.set(0, 0, 0.2);

    // Keyboard & Control Datapad resting cleanly on tabletop (y = 1.09)
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.04, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 })
    );
    keyboard.position.set(0, 1.07, 0.45);

    // Giant Curved Security Mainframe Monitor mounted above desk (y = 1.6 to 3.4)
    const curvedScreenGeo = new THREE.CylinderGeometry(3.2, 3.2, 1.8, 32, 1, true, -Math.PI / 4, Math.PI / 2);
    const curvedScreenMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 1.8,
      side: THREE.DoubleSide,
    });
    const curvedScreen = new THREE.Mesh(curvedScreenGeo, curvedScreenMat);
    curvedScreen.position.set(0, 2.5, 1.4);
    curvedScreen.rotation.y = Math.PI;

    // Header Sign: "RESTRICTED ARCHIVE // SECURITY BREACH AT 18:42"
    const breachSign = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xb45309, emissiveIntensity: 1.4 })
    );
    breachSign.position.set(0, 4.8, 0.8);

    const consoleLight = new THREE.PointLight(0x38bdf8, 2.5, 16);
    consoleLight.position.set(0, 3.0, 1.5);

    // High-Tech Workstation Chair positioned naturally in front of console (facing North)
    const mainChairMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const mainframeChair = this.createRealisticChair(0.8, 0.7, 0.55, 0.55, mainChairMat, chromeMat);
    mainframeChair.position.set(0, 0, 1.4);
    mainframeChair.rotation.y = 0;

    serverGroup.add(serverLeft, serverRight, mainConsoleDesk, keyboard, curvedScreen, breachSign, consoleLight, mainframeChair);
    serverGroup.position.set(0, 0, -D / 2 + 1.2);
    this.scene.add(serverGroup);

    // Solid Collider encompassing Server Tower, Console Table, and Chair
    this.addBoxCollider(
      new THREE.Vector3(-3.8, 0, -D / 2),
      new THREE.Vector3(3.8, 5.2, -D / 2 + 2.8)
    );

    this.interactiveObjects.push({
      id: 'evidence_security_terminal',
      type: 'evidence_security_terminal',
      name: 'Mainframe Security Incident Terminal',
      prompt: 'Access Restricted Archive Breach Log (18:42)',
      position: [0, 1.8, -D / 2 + 2.2],
      hitRadius: 3.2,
    });

    // Large Whiteboard next to Mainframe on North Wall (X: 7.5)
    const whiteboard = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 2.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    whiteboard.position.set(7.5, 3.6, -D / 2 + 0.15);
    const whiteboardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 2.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
    );
    whiteboardFrame.position.set(7.5, 3.6, -D / 2 + 0.1);
    this.scene.add(whiteboard, whiteboardFrame);

    // =========================================================================
    // 3. EAST WALL: MASSIVE CORK EVIDENCE PINBOARD & CCTV ANALYSIS
    // =========================================================================
    // Cork Board
    const corkTex = this.createPixelTexture('cork_board');
    corkTex.repeat.set(6, 3);
    const corkBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 3.4, 7.8),
      new THREE.MeshStandardMaterial({ map: corkTex, roughness: 0.9 })
    );
    corkBoard.position.set(W / 2 - 0.12, 3.8, -2.5);

    const corkFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 3.6, 8.0),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    );
    corkFrame.position.set(W / 2 - 0.08, 3.8, -2.5);
    this.scene.add(corkBoard, corkFrame);

    // Pinned Suspect Cards & Polaroids on Cork Board (Agent A, B, C, D)
    const photoMatA = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const photoMatB = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const photoMatC = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const photoMatD = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

    const cardPositions = [-5.2, -3.4, -1.6, 0.2];
    const cardMats = [photoMatA, photoMatB, photoMatC, photoMatD];
    cardPositions.forEach((cz, i) => {
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.7), cardMats[i]);
      card.position.set(W / 2 - 0.2, 4.2, cz);
      this.scene.add(card);

      const redPin = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.1 })
      );
      redPin.position.set(W / 2 - 0.23, 4.6, cz);
      this.scene.add(redPin);
    });

    // Red Connecting String (Yarn lines connecting evidence)
    const yarnGeo = new THREE.CylinderGeometry(0.015, 0.015, 3.2);
    const yarnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 1.0 });
    const yarn1 = new THREE.Mesh(yarnGeo, yarnMat);
    yarn1.position.set(W / 2 - 0.21, 3.6, -3.8);
    yarn1.rotation.x = Math.PI / 4;
    this.scene.add(yarn1);

    const yarn2 = new THREE.Mesh(yarnGeo, yarnMat);
    yarn2.position.set(W / 2 - 0.21, 3.5, -1.8);
    yarn2.rotation.x = -Math.PI / 4;
    this.scene.add(yarn2);

    this.interactiveObjects.push({
      id: 'evidence_corkboard',
      type: 'evidence_corkboard',
      name: 'Cork Evidence Pinboard & Alibi Matrix',
      prompt: 'Examine Suspect Pinboard & Alibi Matrix',
      position: [W / 2 - 1.5, 2.0, -2.5],
      hitRadius: 3.2,
    });

    // East CCTV Multi-Screen Surveillance Terminal
    const cctvGroup = new THREE.Group();
    const cctvDesk = this.createRealisticTable(1.6, 3.8, 1.05, 0.08, consoleTableMat, consoleLegMat, 0.04);
    cctvGroup.add(cctvDesk);

    // 4 Quad CCTV Monitors on Desktop Stands (sitting flush on tabletop surface at y = 1.09)
    const cctvScreens = [
      { y: 1.8, z: -1.0, col: 0x38bdf8 },
      { y: 1.8, z: 1.0, col: 0x0284c7 },
      { y: 2.8, z: -1.0, col: 0x06b6d4 },
      { y: 2.8, z: 1.0, col: 0x64748b }, // Camera 07 static/offline!
    ];
    cctvScreens.forEach((cs) => {
      // Monitor stand on desk
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, cs.y - 1.05, 0.1),
        consoleLegMat
      );
      stand.position.set(0.3, (cs.y + 1.05) / 2, cs.z);
      
      const scr = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.8, 1.4),
        new THREE.MeshStandardMaterial({ color: cs.col, emissive: cs.col, emissiveIntensity: 1.4 })
      );
      scr.position.set(0.3, cs.y, cs.z);
      cctvGroup.add(stand, scr);
    });

    // Surveillance Desk Swivel Chair (facing East towards desk)
    const cctvChair = this.createRealisticChair(0.7, 0.7, 0.55, 0.5, mainChairMat, chromeMat);
    cctvChair.position.set(-1.1, 0, 0);
    cctvChair.rotation.y = -Math.PI / 2; // facing East
    cctvGroup.add(cctvChair);

    cctvGroup.position.set(W / 2 - 2.0, 0, 4.0);
    this.scene.add(cctvGroup);

    // Exact Solid Box Collider for CCTV Station and Chair
    this.addBoxCollider(
      new THREE.Vector3(W / 2 - 3.6, 0, 1.8),
      new THREE.Vector3(W / 2 - 0.8, 3.5, 6.2)
    );

    this.interactiveObjects.push({
      id: 'evidence_cctv_monitor',
      type: 'evidence_cctv_monitor',
      name: 'CCTV Multi-Channel Video Archive',
      prompt: 'Review CCTV Video Timeline & Alibis',
      position: [W / 2 - 2.8, 1.8, 4.0],
      hitRadius: 3.0,
    });

    // =========================================================================
    // 4. SOUTH-WEST: FORENSIC CRIME LAB BENCH & CHEMICAL CLUES
    // =========================================================================
    const labGroup = new THREE.Group();
    // Stainless Steel Table with Tabletop and Legs
    const stainlessMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });
    const labTable = this.createRealisticTable(4.4, 1.8, 1.05, 0.08, stainlessMat, stainlessMat, 0.04);

    // Stainless lower equipment shelf resting above floor at y = 0.25
    const lowerShelf = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.04, 1.5),
      stainlessMat
    );
    lowerShelf.position.set(0, 0.25, 0);
    labGroup.add(labTable, lowerShelf);

    // Digital Microscope resting cleanly on tabletop (y = 1.09)
    const microscopeBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.06, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    microscopeBase.position.set(-1.4, 1.12, 0);
    const microscopeArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 })
    );
    microscopeArm.position.set(-1.4, 1.5, 0.15);
    const microscopeEyepiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    microscopeEyepiece.position.set(-1.4, 1.85, -0.05);
    microscopeEyepiece.rotation.x = -Math.PI / 4;

    // Glowing Test Tube Rack (Server Room Coolant Residue) resting on tabletop (y = 1.09)
    const testRack = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.25, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    testRack.position.set(0.6, 1.21, 0);
    const coolantVial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 2.2 })
    );
    coolantVial.position.set(0.6, 1.5, 0);

    const uvLamp = new THREE.PointLight(0x818cf8, 1.8, 6);
    uvLamp.position.set(-1.4, 2.2, 0);

    // Forensic Lab Stool resting cleanly in front of the lab table (facing North)
    const labStoolMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const labStool = this.createForensicStool(0.3, 0.55, labStoolMat, stainlessMat);
    labStool.position.set(-0.8, 0, -1.2);

    labGroup.add(microscopeBase, microscopeArm, microscopeEyepiece, testRack, coolantVial, uvLamp, labStool);
    labGroup.position.set(-8.5, 0, 6.0);
    this.scene.add(labGroup);

    // Exact Solid Box Collider for Lab Table and Stool
    this.addBoxCollider(
      new THREE.Vector3(-11.0, 0, 4.4),
      new THREE.Vector3(-6.0, 3.2, 7.2)
    );

    this.interactiveObjects.push({
      id: 'evidence_forensic_desk',
      type: 'evidence_forensic_desk',
      name: 'Forensic Crime Lab Station',
      prompt: 'Examine Forensic Coolant Analysis & Fingerprints',
      position: [-8.5, 1.6, 6.0],
      hitRadius: 2.8,
    });

    // =========================================================================
    // 5. CENTER: CASE VERDICT & INTERROGATION INDICTMENT TABLE
    // =========================================================================
    const verdictTableGroup = new THREE.Group();
    // Octagonal Briefing Tabletop
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.9, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 })
    );
    tableTop.position.set(0, 1.0, 0);

    // Central Column Support Base underneath tabletop (from y = 0 to 0.91)
    const tableBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 0.91, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    );
    tableBase.position.set(0, 0.455, 0);

    // Glowing Central Holographic Ring
    const holoRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.05, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.5 })
    );
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, 1.25, 0);
    this.animatedMeshes.push(holoRing);

    // Floating 3D Verdict Seal / Case File Icon
    const caseBadge = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 2.0 })
    );
    caseBadge.position.set(0, 1.9, 0);
    this.animatedMeshes.push(caseBadge);

    const verdictLight = new THREE.PointLight(0xf59e0b, 2.4, 10);
    verdictLight.position.set(0, 2.2, 0);

    // 4 Realistic Briefing Chairs placed naturally around the table (North, South, East, West)
    const chairNorth = this.createRealisticChair(0.65, 0.65, 0.52, 0.48, mainChairMat, chromeMat);
    chairNorth.position.set(0, 0, -1.6);
    chairNorth.rotation.y = Math.PI; // facing South

    const chairSouth = this.createRealisticChair(0.65, 0.65, 0.52, 0.48, mainChairMat, chromeMat);
    chairSouth.position.set(0, 0, 1.6);
    chairSouth.rotation.y = 0; // facing North

    const chairWest = this.createRealisticChair(0.65, 0.65, 0.52, 0.48, mainChairMat, chromeMat);
    chairWest.position.set(-1.6, 0, 0);
    chairWest.rotation.y = Math.PI / 2; // facing East

    const chairEast = this.createRealisticChair(0.65, 0.65, 0.52, 0.48, mainChairMat, chromeMat);
    chairEast.position.set(1.6, 0, 0);
    chairEast.rotation.y = -Math.PI / 2; // facing West

    verdictTableGroup.add(tableTop, tableBase, holoRing, caseBadge, verdictLight, chairNorth, chairSouth, chairWest, chairEast);
    verdictTableGroup.position.set(0, 0, -2.0);
    this.scene.add(verdictTableGroup);

    // Exact Solid Box Collider for Briefing Table and Surrounding Chairs
    this.addBoxCollider(
      new THREE.Vector3(-2.4, 0, -3.9),
      new THREE.Vector3(2.4, 2.5, -0.1)
    );

    this.interactiveObjects.push({
      id: 'evidence_case_verdict',
      type: 'evidence_case_verdict',
      name: 'Case Verdict & Interrogation Console',
      prompt: 'Select Guilty Suspect & Submit Indictment',
      position: [0, 1.6, -2.0],
      hitRadius: 2.8,
    });

    // =========================================================================
    // 6. CENTER-EAST: LOCKED STEEL EVIDENCE DRAWER & SAFE
    // =========================================================================
    const drawerGroup = new THREE.Group();
    const safeCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    safeCabinet.position.set(0, 1.0, 0);

    // Biometric Latch & Safe Dial on front face (z = 0.75)
    const safeDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 })
    );
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(0, 1.2, 0.74);

    const safeLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.0 })
    );
    safeLed.position.set(0.4, 1.5, 0.74);

    // Drawer Sign: "CLASSIFIED EVIDENCE // ARCHIVE KEY"
    const safeSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 1.0 })
    );
    safeSign.position.set(0, 2.1, 0.72);

    drawerGroup.add(safeCabinet, safeDial, safeLed, safeSign);
    drawerGroup.position.set(5.5, 0, 1.8);
    this.scene.add(drawerGroup);

    // Exact Solid Box Collider for Evidence Safe
    this.addBoxCollider(
      new THREE.Vector3(4.5, 0, 1.0),
      new THREE.Vector3(6.5, 2.4, 2.6)
    );

    this.interactiveObjects.push({
      id: 'evidence_locked_drawer',
      type: 'evidence_locked_drawer',
      name: 'Locked Evidence Drawer / Safe',
      prompt: 'Open Evidence Drawer (Contains Archive Key)',
      position: [5.5, 1.4, 1.8],
      hitRadius: 2.8,
    });

    // =========================================================================
    // 7. SOUTH WALL: LEVEL 5 CLASSIFIED ARCHIVE BLAST DOOR (EXIT)
    // =========================================================================
    this.vaultDoorGroup = new THREE.Group();

    // Heavy Reinforced Blast Door Frame
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 6.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    doorFrame.position.set(0, 3.1, 0);

    // Left and Right Sliding Blast Doors with Glowing Neon Insets
    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 5.2, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25 })
    );
    leftDoor.name = 'vaultDoorLeft';
    leftDoor.position.set(-1.2, 2.8, 0.1);

    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 5.2, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25 })
    );
    rightDoor.name = 'vaultDoorRight';
    rightDoor.position.set(1.2, 2.8, 0.1);

    // Glowing Amber & Emerald Archway Border
    const neonTop = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 0.25, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 })
    );
    neonTop.position.set(0, 6.1, 0.5);

    const neonLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 6.0, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 })
    );
    neonLeft.position.set(-2.9, 3.0, 0.5);

    const neonRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 6.0, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.2 })
    );
    neonRight.position.set(2.9, 3.0, 0.5);

    // Illuminated Exit Header Billboard: "LEVEL 5 // RESTRICTED ARCHIVE"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8 })
    );
    signBoard.position.set(0, 5.4, 0.52);

    const signTextGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 2.2 })
    );
    signTextGlow.position.set(0, 5.4, 0.65);

    // Archive Keyhole Pedestal
    const keyholePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    keyholePedestal.position.set(3.4, 1.1, 0.4);

    const keyholeBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.9, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    keyholeBox.position.set(3.4, 2.2, 0.4);

    const keyholeGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2.0 })
    );
    keyholeGlow.position.set(3.4, 2.2, 0.58);
    this.animatedMeshes.push(keyholeGlow);

    this.vaultDoorGroup.add(
      doorFrame,
      leftDoor,
      rightDoor,
      neonTop,
      neonLeft,
      neonRight,
      signBoard,
      signTextGlow,
      keyholePedestal,
      keyholeBox,
      keyholeGlow
    );
    this.vaultDoorGroup.position.set(0, 0, D / 2 - 0.3);
    this.scene.add(this.vaultDoorGroup);

    // High-Intensity Dedicated Spotlights for South Door
    const doorFloodLight = new THREE.PointLight(0xf59e0b, 3.5, 18);
    doorFloodLight.position.set(0, 5.5, D / 2 - 2.0);
    this.scene.add(doorFloodLight);

    const doorSpotLight = new THREE.SpotLight(0x38bdf8, 4.5, 20, Math.PI / 3, 0.2);
    doorSpotLight.position.set(0, 6.8, D / 2 - 4.0);
    doorSpotLight.target.position.set(0, 2.5, D / 2);
    this.scene.add(doorSpotLight);
    this.scene.add(doorSpotLight.target);

    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(-3.0, 0, D / 2 - 1.0),
      new THREE.Vector3(3.0, 6.0, D / 2 + 0.5)
    );

    this.interactiveObjects.push({
      id: 'level5_archive_door',
      type: 'level5_archive_door',
      name: 'Level 5 Archive Blast Door',
      prompt: 'Unlock Level 5 Archive Door (Requires Archive Key)',
      position: [0, 2.0, D / 2 - 1.5],
      hitRadius: 3.2,
    });

    // =========================================================================
    // 8. LIVELY OFFICE DECOR: PLANTS, WATER COOLER, BOOKSHELF
    // =========================================================================
    // Lush Green Potted Plants (4 locations)
    const plantSpots: [number, number][] = [
      [-W / 2 + 2.0, -D / 2 + 2.0],
      [W / 2 - 2.0, -D / 2 + 2.0],
      [-W / 2 + 2.0, D / 2 - 2.0],
      [W / 2 - 2.0, D / 2 - 2.0],
    ];
    plantSpots.forEach(([px, pz]) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.35, 0.9, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      pot.position.set(px, 0.45, pz);
      this.scene.add(pot);

      const plantGeo = new THREE.DodecahedronGeometry(0.7, 1);
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
      const plantLeaves = new THREE.Mesh(plantGeo, plantMat);
      plantLeaves.position.set(px, 1.4, pz);
      plantLeaves.scale.set(1.1, 1.4, 1.1);
      this.scene.add(plantLeaves);

      // Solid Box Collider for Plant Pot
      this.addBoxCollider(
        new THREE.Vector3(px - 0.5, 0, pz - 0.5),
        new THREE.Vector3(px + 0.5, 2.0, pz + 0.5)
      );
    });

    // Water Cooler Station
    const coolerBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9 })
    );
    coolerBase.position.set(-W / 2 + 1.2, 0.8, 1.0);
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, roughness: 0.1 })
    );
    bottle.position.set(-W / 2 + 1.2, 2.0, 1.0);
    this.scene.add(coolerBase, bottle);

    // Solid Box Collider for Water Cooler
    this.addBoxCollider(
      new THREE.Vector3(-W / 2 + 0.7, 0, 0.5),
      new THREE.Vector3(-W / 2 + 1.7, 2.5, 1.5)
    );

    // Detective Manuals Bookshelf (South-East Wall)
    const bookshelfGroup = new THREE.Group();
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const bookshelfFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 4.0, 3.2),
      shelfMat
    );
    bookshelfFrame.position.set(0, 2.0, 0);
    bookshelfGroup.add(bookshelfFrame);

    // Books on shelves
    const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
    for (let sy = 0.8; sy <= 3.2; sy += 0.8) {
      for (let bz = -1.2; bz <= 1.2; bz += 0.3) {
        const bookMat = new THREE.MeshStandardMaterial({ color: bookColors[Math.floor(Math.random() * bookColors.length)] });
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.5, 0.2),
          bookMat
        );
        book.position.set(-0.1, sy, bz);
        bookshelfGroup.add(book);
      }
    }
    bookshelfGroup.position.set(W / 2 - 1.0, 0, 8.0);
    this.scene.add(bookshelfGroup);

    // Solid Box Collider for Bookshelf
    this.addBoxCollider(
      new THREE.Vector3(W / 2 - 1.6, 0, 6.3),
      new THREE.Vector3(W / 2 - 0.4, 4.2, 9.7)
    );

    // =========================================================================
    // 9. COLLECTIBLE DETECTIVE COINS (4 Corners)
    // =========================================================================
    const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const coinPositions: [number, number, number][] = [
      [-10, 0.6, -8],
      [10, 0.6, -8],
      [-10, 0.6, 8],
      [10, 0.6, 8],
    ];

    coinPositions.forEach((p, idx) => {
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(p[0], p[1], p[2]);
      coinMesh.rotation.x = Math.PI / 2;
      this.scene.add(coinMesh);
      this.animatedMeshes.push(coinMesh);

      this.interactiveObjects.push({
        id: `detective_coin_${idx}`,
        type: 'coin_pickup',
        name: 'Detective Academy Gold Coin',
        prompt: 'Collect Secret Detective Coin (+50 Coins)',
        position: p,
        hitRadius: 1.6,
      });
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      laserBeams: this.laserGroup,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
    };
  }

  // =========================================================================
  // LEVEL 5: THE LASER CORRIDOR (MOVEMENT & TIMING)
  // High-Voltage Security Corridor with Dynamic Oscillating Laser Grids,
  // Safe Alcoves, Vent Bypass, Sector Terminals, and Master Override Console
  // =========================================================================
  public buildLevel5LaserCorridor(): EscapeRoomEnvironment {
    const W = 16;
    const D = 40;
    const H = 7;

    // 1. Bright & Lively Architectural Sci-Fi Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x67e8f9, 0x1e1b4b, 0.95);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0xff4466, 2.8, 45);
    mainLight.position.set(0, 5.5, 0);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Cyan North Control Dais Lighting
    const daisLight = new THREE.PointLight(0x06b6d4, 3.4, 28);
    daisLight.position.set(0, 4.5, -15);
    this.scene.add(daisLight);

    // South Entrance Soft Light
    const southLight = new THREE.PointLight(0x10b981, 2.5, 22);
    southLight.position.set(0, 4.0, 14);
    this.scene.add(southLight);

    // Continuous Overhead Ceiling Light Track Panels along 40m Corridor (z = 14 to -16)
    const l5CeilingZ = [14, 8, 2, -4, -10, -16];
    l5CeilingZ.forEach((cz) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(6.0, 1.0),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe0f2fe, emissiveIntensity: 1.6 })
      );
      panel.position.set(0, H - 0.05, cz);
      panel.rotation.x = Math.PI / 2;
      this.scene.add(panel);

      const trackLight = new THREE.PointLight(0xf8fafc, 1.5, 15);
      trackLight.position.set(0, H - 0.6, cz);
      this.scene.add(trackLight);

      // Wall-mounted side sconces for lively cross-lighting
      const sconceL = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.8, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 })
      );
      sconceL.position.set(-W / 2 + 0.1, 3.5, cz);
      this.scene.add(sconceL);

      const sconceR = sconceL.clone();
      sconceR.position.set(W / 2 - 0.1, 3.5, cz);
      this.scene.add(sconceR);
    });

    // 2. Materials
    const floorTexture = this.createPixelTexture('laser_floor');
    floorTexture.repeat.set(8, 20);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.4,
      metalness: 0.7,
    });

    const wallTexture = this.createPixelTexture('laser_wall');
    wallTexture.repeat.set(4, 4);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.3,
      metalness: 0.8,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x070913,
      roughness: 0.9,
      metalness: 0.3,
    });

    const steelGantryMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const cautionYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: 0xca8a04,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    const laserEmitterMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });

    const safePadMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.6,
    });

    // 3. Architecture: Floor, Ceiling, Walls
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    // North Wall with 5.0m Central Doorway for Level 6 Protocol Vault
    const northWallSideW = (W - 5.0) / 2; // 5.5m on left and right
    const northWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(northWallSideW, H), wallMat);
    northWallLeft.position.set(-W / 2 + northWallSideW / 2, H / 2, -D / 2);
    const northWallRight = new THREE.Mesh(new THREE.PlaneGeometry(northWallSideW, H), wallMat);
    northWallRight.position.set(W / 2 - northWallSideW / 2, H / 2, -D / 2);
    const northWallTop = new THREE.Mesh(new THREE.PlaneGeometry(5.0, H - 4.2), wallMat);
    northWallTop.position.set(0, 4.2 + (H - 4.2) / 2, -D / 2);
    this.scene.add(northWallLeft, northWallRight, northWallTop);

    // South Wall (Entrance from Level 4)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eastWall.position.set(W / 2, H / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

    // Boundary Colliders
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2 - 1), new THREE.Vector3(-W / 2, H, D / 2 + 1)); // West
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2 + 1, H, D / 2 + 1)); // East
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1)); // South
    // North Wall split colliders leaving central 4.6m completely open for Level 6 Exit Doorway
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(-2.3, H, -D / 2 + 0.5));
    this.addBoxCollider(new THREE.Vector3(2.3, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2 + 0.5));

    // Center Yellow Runway Warning Guides
    const runwayL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, D), cautionYellowMat);
    runwayL.position.set(-2.8, 0.01, 0);
    const runwayR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, D), cautionYellowMat);
    runwayR.position.set(2.8, 0.01, 0);
    this.scene.add(runwayL, runwayR);

    // 4. Overhead Heavy Steel Gantry Arches with Warning Beacons (z = 14, 8, 2, -4, -10, -15)
    const archPositions = [14, 8, 2, -4, -10, -15];
    archPositions.forEach((az) => {
      const arch = new THREE.Group();
      // Left post
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, 0.8), steelGantryMat);
      postL.position.set(-W / 2 + 0.5, H / 2, 0);
      // Right post
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.8, H, 0.8), steelGantryMat);
      postR.position.set(W / 2 - 0.5, H / 2, 0);
      // Top beam
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.8, 0.8), steelGantryMat);
      topBeam.position.set(0, H - 0.4, 0);

      // Warning Strobe Beacon in center of arch
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xff0033,
        emissiveIntensity: 1.2,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, H - 0.95, 0);

      arch.add(postL, postR, topBeam, beacon);
      arch.position.set(0, 0, az);
      this.scene.add(arch);

      // Colliders for posts
      this.addBoxCollider(
        new THREE.Vector3(-W / 2, 0, az - 0.5),
        new THREE.Vector3(-W / 2 + 1.0, H, az + 0.5)
      );
      this.addBoxCollider(
        new THREE.Vector3(W / 2 - 1.0, 0, az - 0.5),
        new THREE.Vector3(W / 2, H, az + 0.5)
      );
    });

    // 5. Left Vent Bypass Wall & Grate Corridors (x: -5.5, from z: 10 to -8)
    const ventWallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const ventGrateMat = new THREE.MeshStandardMaterial({
      map: this.createPixelTexture('vent_grate'),
      roughness: 0.4,
      metalness: 0.8,
    });

    // Side partition wall creating the Left Vent Duct
    const ventWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 6.0), ventWallMat);
    ventWall1.position.set(-4.5, 2.0, 5.0);
    const ventWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 6.0), ventWallMat);
    ventWall2.position.set(-4.5, 2.0, -2.0);
    this.scene.add(ventWall1, ventWall2);
    this.addBoxCollider(new THREE.Vector3(-4.8, 0, 2.0), new THREE.Vector3(-4.2, 4.0, 8.0));
    this.addBoxCollider(new THREE.Vector3(-4.8, 0, -5.0), new THREE.Vector3(-4.2, 4.0, 1.0));

    // Vent Access Hatch on West Wall
    const ventHatch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 2.2), ventGrateMat);
    ventHatch.position.set(-W / 2 + 0.1, 1.2, 7.5);
    this.scene.add(ventHatch);

    // 6. Safe Zones with Emerald Magnetic Dampeners
    // Safe Pad 1 (Entrance Checkpoint, [0, 0, 14])
    const safePadStart = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.6, 0.08, 16), safePadMat);
    safePadStart.position.set(0, 0.04, 14.5);
    this.scene.add(safePadStart);

    // Safe Pad 2 (Sector A Left Alcove, [-6.0, 0, 7.5])
    const safePadA = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 3.5), safePadMat);
    safePadA.position.set(-6.0, 0.04, 7.5);
    this.scene.add(safePadA);

    // Safe Pad 3 (Sector B Right Relay Alcove, [6.0, 0, -1.0])
    const safePadB = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 3.5), safePadMat);
    safePadB.position.set(6.0, 0.04, -1.0);
    this.scene.add(safePadB);

    // Safe Pad 4 (Sector C Island Stepping Platform, [0, 0, -7.5])
    const safePadC = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.08, 16), safePadMat);
    safePadC.position.set(0, 0.04, -7.5);
    this.scene.add(safePadC);

    // 7. Checkpoint Beacon & Interactive Terminals
    // -------------------------------------------------------------
    // Terminal 1: Sector A Sub-Terminal & Checkpoint (Left Alcove, [-6.0, 0, 7.5])
    const termAGroup = new THREE.Group();
    const termMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const termScreenMatA = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
    });
    const termPedestalA = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), termMat);
    termPedestalA.position.y = 0.55;
    const termScreenA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), termScreenMatA);
    termScreenA.position.set(0, 1.25, 0.3);
    termScreenA.rotation.x = -Math.PI / 6;
    termAGroup.add(termPedestalA, termScreenA);
    termAGroup.position.set(-6.0, 0, 7.5);
    this.scene.add(termAGroup);
    this.addCollider(termPedestalA, 0.3);

    this.interactiveObjects.push({
      id: 'laser_sub_terminal_alpha',
      type: 'laser_sub_terminal_alpha',
      name: 'Sector A Checkpoint Console',
      prompt: 'Access Sector A Console (Save Checkpoint & Read Laser Timing)',
      position: [-6.0, 0.6, 7.5],
      hitRadius: 2.2,
      mesh: termAGroup,
    });

    // Terminal 2: Sector B Frequency Relay Console (Right Alcove, [6.0, 0, -1.0])
    const termBGroup = new THREE.Group();
    const termScreenMatB = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.9,
    });
    const termPedestalB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), termMat);
    termPedestalB.position.y = 0.55;
    const termScreenB = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), termScreenMatB);
    termScreenB.position.set(0, 1.25, -0.3);
    termScreenB.rotation.x = Math.PI / 6;
    termBGroup.add(termPedestalB, termScreenB);
    termBGroup.position.set(6.0, 0, -1.0);
    this.scene.add(termBGroup);
    this.addCollider(termPedestalB, 0.3);

    this.interactiveObjects.push({
      id: 'laser_sub_terminal_beta',
      type: 'laser_sub_terminal_beta',
      name: 'Sector B Frequency Relay Console',
      prompt: 'Access Sector B Console (Save Checkpoint & Diagnostics)',
      position: [6.0, 0.6, -1.0],
      hitRadius: 2.2,
      mesh: termBGroup,
    });

    // Terminal 3: Laser Diagnostics & Architectural Clue Console (Sector C, [-5.5, 0, -9.0])
    const termCGroup = new THREE.Group();
    const termScreenMatC = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
    });
    const termPedestalC = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), termMat);
    termPedestalC.position.y = 0.55;
    const termScreenC = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), termScreenMatC);
    termScreenC.position.set(0, 1.25, 0.3);
    termScreenC.rotation.x = -Math.PI / 6;
    termCGroup.add(termPedestalC, termScreenC);
    termCGroup.position.set(-5.5, 0, -9.0);
    this.scene.add(termCGroup);
    this.addCollider(termPedestalC, 0.3);

    this.interactiveObjects.push({
      id: 'laser_clue_console',
      type: 'laser_clue_console',
      name: 'Corridor Security Blueprint Terminal',
      prompt: 'Inspect Laser Corridor Architecture & Override Code',
      position: [-5.5, 0.6, -9.0],
      hitRadius: 2.2,
      mesh: termCGroup,
    });

    // 8. North Elevated Control Dais & Master Laser Override Terminal
    // -------------------------------------------------------------
    const daisGroup = new THREE.Group();
    const daisPlatformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
    });
    const daisTrimMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
    });

    // Left Platform Wing (x: -5.5 to -2.0)
    const daisWingL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 6.0), daisPlatformMat);
    daisWingL.position.set(-3.8, 0.2, -16.0);
    // Right Platform Wing (x: 2.0 to 5.5)
    const daisWingR = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 6.0), daisPlatformMat);
    daisWingR.position.set(3.8, 0.2, -16.0);

    // Center Illuminated Victory Runway (x: -2.0 to +2.0, completely clear and level!)
    const runwayCenter = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 8.0),
      new THREE.MeshStandardMaterial({
        color: 0x022c22,
        roughness: 0.3,
        metalness: 0.8,
      })
    );
    runwayCenter.rotation.x = -Math.PI / 2;
    runwayCenter.position.set(0, 0.02, -16.0);

    // Glowing Neon Guide Strips along Runway
    const guideStripL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 8.0), daisTrimMat);
    guideStripL.position.set(-1.9, 0.03, -16.0);
    const guideStripR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 8.0), daisTrimMat);
    guideStripR.position.set(1.9, 0.03, -16.0);

    daisGroup.add(daisWingL, daisWingR, runwayCenter, guideStripL, guideStripR);

    // Flanking High-Voltage Superconducting Power Reactors
    const reactorGeo = new THREE.CylinderGeometry(0.7, 0.8, 2.6, 16);
    const reactorMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x4338ca,
      emissiveIntensity: 0.5,
    });
    const reactorL = new THREE.Mesh(reactorGeo, reactorMat);
    reactorL.position.set(-4.2, 1.6, -16.0);
    const reactorR = new THREE.Mesh(reactorGeo, reactorMat);
    reactorR.position.set(4.2, 1.6, -16.0);
    daisGroup.add(reactorL, reactorR);

    // Master Override Control Console (Positioned on Left Control Wing [x: -3.2, z: -15.2])
    const masterConsoleGroup = new THREE.Group();
    const masterDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.9, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 })
    );
    masterDesk.position.set(0, 0.85, 0);

    const masterHoloScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.75, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.4,
      })
    );
    masterHoloScreen.position.set(0, 1.5, -0.15);
    masterHoloScreen.rotation.x = -0.15;
    masterConsoleGroup.add(masterDesk, masterHoloScreen);
    masterConsoleGroup.position.set(-3.0, 0, -15.2);
    daisGroup.add(masterConsoleGroup);

    // Right Side Auxiliary Status Terminal (Right Wing [x: 3.0, z: -15.2])
    const auxConsoleGroup = new THREE.Group();
    const auxDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.9, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 })
    );
    auxDesk.position.set(0, 0.85, 0);
    const auxHoloScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.75, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 1.2,
      })
    );
    auxHoloScreen.position.set(0, 1.5, -0.15);
    auxHoloScreen.rotation.x = -0.15;
    auxConsoleGroup.add(auxDesk, auxHoloScreen);
    auxConsoleGroup.position.set(3.0, 0, -15.2);
    daisGroup.add(auxConsoleGroup);

    this.scene.add(daisGroup);

    // Colliders strictly for Left and Right side platform wings only (Central Walkway x: -2.0 to +2.0 is 100% CLEAR!)
    this.addBoxCollider(new THREE.Vector3(-5.5, 0, -19.4), new THREE.Vector3(-2.1, 3.0, -12.8));
    this.addBoxCollider(new THREE.Vector3(2.1, 0, -19.4), new THREE.Vector3(5.5, 3.0, -12.8));

    this.interactiveObjects.push({
      id: 'laser_master_terminal',
      type: 'laser_master_terminal',
      name: 'Master Laser Control Terminal',
      prompt: 'Access Master Security Terminal (Disable Lasers & Disengage Level 6 Locks)',
      position: [-3.0, 1.0, -15.0],
      hitRadius: 3.4,
      mesh: masterConsoleGroup,
    });

    // 9. Level 6 Protocol Heavy Security Vault Door (North Wall: [0, 0, -19.4])
    // -------------------------------------------------------------
    this.vaultDoorGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25,
    });
    const doorNeonMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0033,
      emissiveIntensity: 1.4,
    });

    // Outer Heavy Frame (5.0m wide)
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.6, 0.6), frameMat);
    frameTop.position.set(0, 4.0, 0);
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 0.6), frameMat);
    frameL.position.set(-2.3, 2.0, 0);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 0.6), frameMat);
    frameR.position.set(2.3, 2.0, 0);

    // Glowing Neon Status Arch on Door Frame (Turns Emerald on Unlock)
    const neonArch = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 0.65), doorNeonMat);
    neonArch.name = 'scannerLed';
    neonArch.position.set(0, 4.2, 0);

    // Sliding Left & Right Vault Doors (Each 2.1m wide, named for animation)
    const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.8, 0.3), doorLeafMat);
    doorLeft.name = 'vaultDoorLeft';
    doorLeft.position.set(-1.05, 2.0, 0);

    const doorRight = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.8, 0.3), doorLeafMat);
    doorRight.name = 'vaultDoorRight';
    doorRight.position.set(1.05, 2.0, 0);

    this.vaultDoorGroup.add(frameTop, frameL, frameR, neonArch, doorLeft, doorRight);
    this.vaultDoorGroup.position.set(0, 0, -19.4);
    this.scene.add(this.vaultDoorGroup);

    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(-2.1, 0, -19.8),
      new THREE.Vector3(2.1, 4.5, -19.0)
    );

    this.interactiveObjects.push({
      id: 'level6_vault_door',
      type: 'level6_vault_door',
      name: 'Level 6 Protocol Vault Door',
      prompt: 'Examine Level 6 Protocol Vault Door (Locked by Master Laser Grid)',
      position: [0, 1.5, -18.5],
      hitRadius: 3.5,
      mesh: this.vaultDoorGroup,
    });

    // -------------------------------------------------------------
    // Level 6 Extraction Gateway & Illuminated Victory Tunnel (z: -19.5 to -28.0)
    // -------------------------------------------------------------
    const tunnelGroup = new THREE.Group();
    const tunnelFloorMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const tunnelFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 9.0), tunnelFloorMat);
    tunnelFloor.rotation.x = -Math.PI / 2;
    tunnelFloor.position.set(0, 0.03, -24.0);

    const tunnelCeil = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 9.0),
      new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.8 })
    );
    tunnelCeil.rotation.x = Math.PI / 2;
    tunnelCeil.position.set(0, 4.5, -24.0);

    // Tunnel Side Walls
    const tunnelWallMat = new THREE.MeshStandardMaterial({ color: 0x065f46, metalness: 0.7, roughness: 0.3 });
    const tunnelWallL = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 4.5), tunnelWallMat);
    tunnelWallL.position.set(-2.2, 2.25, -24.0);
    tunnelWallL.rotation.y = Math.PI / 2;

    const tunnelWallR = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 4.5), tunnelWallMat);
    tunnelWallR.position.set(2.2, 2.25, -24.0);
    tunnelWallR.rotation.y = -Math.PI / 2;

    // Glowing Emerald Victory Portals along the Tunnel (z: -21.5, -24.5, -27.5)
    [-21.5, -24.5, -27.5].forEach((tz) => {
      const archFrame = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.08, 12, 24),
        new THREE.MeshStandardMaterial({
          color: 0x34d399,
          emissive: 0x10b981,
          emissiveIntensity: 2.0,
        })
      );
      archFrame.position.set(0, 2.0, tz);
      tunnelGroup.add(archFrame);
    });

    // Cosmic Victory Teleport Vortex at the End of Tunnel
    const vortexGeo = new THREE.CircleGeometry(1.8, 32);
    const vortexMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x059669,
      emissiveIntensity: 2.5,
      side: THREE.DoubleSide,
    });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    vortex.position.set(0, 2.0, -28.2);
    tunnelGroup.add(vortex);

    const victoryLight = new THREE.PointLight(0x10b981, 3.5, 20);
    victoryLight.position.set(0, 2.5, -24.0);
    tunnelGroup.add(victoryLight);

    tunnelGroup.add(tunnelFloor, tunnelCeil, tunnelWallL, tunnelWallR);
    this.scene.add(tunnelGroup);

    // Colliders for Tunnel Walls (so player stays on runway)
    this.addBoxCollider(new THREE.Vector3(-3.5, 0, -29.0), new THREE.Vector3(-2.2, 5.0, -19.5));
    this.addBoxCollider(new THREE.Vector3(2.2, 0, -29.0), new THREE.Vector3(3.5, 5.0, -19.5));
    this.addBoxCollider(new THREE.Vector3(-2.5, 0, -29.5), new THREE.Vector3(2.5, 5.0, -28.3));

    // 10. DYNAMIC LASER BARRIER SYSTEMS
    // =========================================================================
    const laserCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laserGlowMatRed = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
    });

    this.dynamicLasers = [];

    // Helper to spawn a dynamic laser barrier
    const createLaser = (
      id: string,
      type: 'horizontal_sweep' | 'vertical_curtain' | 'oscillating_z' | 'alternating_grid',
      period: number,
      phaseOffset: number,
      activeWindow: number,
      warningWindow: number,
      startX: number,
      endX: number,
      baseY: number,
      baseZ: number,
      sweepYRange: number = 0,
      sweepZRange: number = 0,
      sweepSpeed: number = 1.0
    ): DynamicLaserBarrier => {
      const group = new THREE.Group();
      const length = Math.abs(endX - startX);
      const centerX = (startX + endX) / 2;

      // Emitter nodes at both wall anchors
      const emitterGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12);
      const emitterL = new THREE.Mesh(emitterGeo, laserEmitterMat);
      emitterL.rotation.z = Math.PI / 2;
      emitterL.position.set(startX, 0, 0);

      const emitterR = new THREE.Mesh(emitterGeo, laserEmitterMat);
      emitterR.rotation.z = -Math.PI / 2;
      emitterR.position.set(endX, 0, 0);

      // Inner intense core beam
      const coreGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
      const coreMesh = new THREE.Mesh(coreGeo, laserCoreMat);
      coreMesh.rotation.z = Math.PI / 2;
      coreMesh.position.set(centerX, 0, 0);

      // Outer neon glow sheath
      const glowGeo = new THREE.CylinderGeometry(0.065, 0.065, length, 8);
      const glowMesh = new THREE.Mesh(glowGeo, laserGlowMatRed.clone());
      glowMesh.rotation.z = Math.PI / 2;
      glowMesh.position.set(centerX, 0, 0);

      group.add(emitterL, emitterR, coreMesh, glowMesh);
      group.position.set(0, baseY, baseZ);
      this.scene.add(group);

      const barrier: DynamicLaserBarrier = {
        id,
        type,
        group,
        coreMesh,
        glowMesh,
        period,
        phaseOffset,
        activeWindow,
        warningWindow,
        baseY,
        sweepYRange,
        baseZ,
        sweepZRange,
        sweepSpeed,
        bounds: {
          minX: Math.min(startX, endX),
          maxX: Math.max(startX, endX),
          minY: baseY - 0.3,
          maxY: baseY + 0.3,
          minZ: baseZ - 0.45,
          maxZ: baseZ + 0.45,
        },
      };

      this.dynamicLasers.push(barrier);
      return barrier;
    };

    // -------------------------------------------------------------------------
    // Sector A Lasers (z: 11 to 5) — Horizontal Sweeps & Timed Pulses
    // -------------------------------------------------------------------------
    // 1. Laser A1: Sweeping vertical Y barrier across runway (z = 10.5)
    createLaser(
      'laser_a1',
      'horizontal_sweep',
      3.0, // 3.0s cycle
      0.0,
      2.0, // active 2.0s
      0.4,
      -3.0,
      3.0,
      0.8,
      10.5,
      0.6, // sweeps Y from 0.4 to 1.4
      0,
      2.0
    );

    // 2. Laser A2: Rapid pulse barrier (z = 8.0)
    createLaser(
      'laser_a2',
      'vertical_curtain',
      2.8,
      1.2,
      1.6,
      0.4,
      -3.0,
      3.0,
      0.7,
      8.0
    );

    // 3. Laser A3: Double beam barrier (z = 5.5)
    createLaser(
      'laser_a3',
      'vertical_curtain',
      3.2,
      0.5,
      1.8,
      0.4,
      -3.0,
      3.0,
      0.9,
      5.5
    );

    // -------------------------------------------------------------------------
    // Sector B Lasers (z: 4 to -4) — Interlocking Alternating Grid
    // -------------------------------------------------------------------------
    // Left Channel Gate (z = 2.5, x: -3.0 to 0.0)
    createLaser(
      'laser_b1_left',
      'alternating_grid',
      2.6,
      0.0,
      1.3,
      0.3,
      -3.0,
      0.2,
      0.8,
      2.5
    );
    // Right Channel Gate (z = 2.5, x: 0.0 to 3.0)
    createLaser(
      'laser_b1_right',
      'alternating_grid',
      2.6,
      1.3, // Out of phase by 1.3s
      1.3,
      0.3,
      -0.2,
      3.0,
      0.8,
      2.5
    );

    // Center Cross Gate (z = 0.0)
    createLaser(
      'laser_b2_left',
      'alternating_grid',
      2.6,
      1.3,
      1.3,
      0.3,
      -3.0,
      0.2,
      0.8,
      0.0
    );
    createLaser(
      'laser_b2_right',
      'alternating_grid',
      2.6,
      0.0,
      1.3,
      0.3,
      -0.2,
      3.0,
      0.8,
      0.0
    );

    // Exit Gate of Sector B (z = -2.5)
    createLaser(
      'laser_b3',
      'vertical_curtain',
      3.0,
      0.8,
      1.7,
      0.4,
      -3.0,
      3.0,
      0.8,
      -2.5
    );

    // -------------------------------------------------------------------------
    // Sector C Lasers (z: -5 to -13) — Dynamic Z-Oscillating Scanner Beams
    // -------------------------------------------------------------------------
    // Laser C1: Traveling Scanner 1 (Sweeps Z from -5.0 to -8.5)
    createLaser(
      'laser_c1',
      'oscillating_z',
      3.4,
      0.0,
      2.6,
      0.4,
      -3.5,
      3.5,
      0.75,
      -6.5,
      0,
      1.8, // sweeps Z +/- 1.8m
      1.8
    );

    // Laser C2: Traveling Scanner 2 (Sweeps Z from -9.0 to -12.5)
    createLaser(
      'laser_c2',
      'oscillating_z',
      3.2,
      1.6,
      2.4,
      0.4,
      -3.5,
      3.5,
      0.85,
      -10.8,
      0,
      1.6,
      2.0
    );

    // 11. Collectible Security Gold Coins (4 Hidden along risks & vents)
    const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const coinPositions: [number, number, number][] = [
      [6.0, 0.6, 7.5], // East Alcove A
      [-6.0, 0.6, 0.0], // Left Vent Duct mid-point
      [6.0, 0.6, -7.5], // East Substation
      [0.0, 0.9, -15.5], // Behind Master Terminal
    ];

    coinPositions.forEach((p, idx) => {
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(p[0], p[1], p[2]);
      coinMesh.rotation.x = Math.PI / 2;
      this.scene.add(coinMesh);
      this.animatedMeshes.push(coinMesh);

      this.interactiveObjects.push({
        id: `laser_coin_${idx}`,
        type: 'coin_pickup',
        name: 'High-Voltage Academy Token',
        prompt: 'Collect Secret Laser Corridor Token (+50 Coins)',
        position: p,
        hitRadius: 1.6,
      });
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      laserBeams: this.laserGroup,
      dynamicLasers: this.dynamicLasers,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
    };
  }

  // =========================================================================
  // SEARCH MAZE: LEVEL 1 — FIRST SEARCH (BREADTH FIRST SEARCH / BFS)
  // =========================================================================
  private buildSearchMazeLevel1(): EscapeRoomEnvironment {
    const W = 24;
    const D = 24;
    const H = 7;

    // 1. Room Boundary Colliders (North wall split around the exit doorway [-2.2, 2.2])
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2)); // West
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, D / 2)); // East
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1)); // South
    // North wall left and right segments leaving door opening at x = [-2.2, 2.2]
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(-2.2, H, -D / 2 + 0.5));
    this.addBoxCollider(new THREE.Vector3(2.2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2 + 0.5));

    // 2. High-Visibility Cyber Matrix Floor & Architectural Walls
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorTex = this.createSearchMazeFloorTexture();
    floorTex.repeat.set(6, 6);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.45,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Well-lit High-tech Ceiling with Overhead Light Troffers
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    // Glowing Ceiling Light Strips that illuminate the entire facility
    const ceilingTrofferMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-6, 0, 6].forEach((cx) => {
      const trofferZ = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 20), ceilingTrofferMat);
      trofferZ.position.set(cx, H - 0.04, 0);
      this.scene.add(trofferZ);
    });
    [-6, 0, 6].forEach((cz) => {
      const trofferX = new THREE.Mesh(new THREE.BoxGeometry(20, 0.08, 0.4), ceilingTrofferMat);
      trofferX.position.set(0, H - 0.04, cz);
      this.scene.add(trofferX);
    });

    // Walls (Quantum Search Matrix Grid Panels)
    const wallTex = this.createSearchMazeWallTexture();
    wallTex.repeat.set(6, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.4, metalness: 0.3 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eastWall.position.set(W / 2, H / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

    // Bright, Clean Cyber Laboratory Lighting (High visibility across all corridors)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.8);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 2.4);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0x38bdf8, 3.8, 40);
    mainLight.position.set(0, 5.8, 0);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Quad Lights ensuring zero dark zones
    const nwLight = new THREE.PointLight(0x38bdf8, 2.6, 22);
    nwLight.position.set(-6, 5.2, -6);
    this.scene.add(nwLight);

    const neLight = new THREE.PointLight(0x38bdf8, 2.6, 22);
    neLight.position.set(6, 5.2, -6);
    this.scene.add(neLight);

    const swLight = new THREE.PointLight(0x10b981, 2.8, 22);
    swLight.position.set(-6, 5.2, 6);
    this.scene.add(swLight);

    const seLight = new THREE.PointLight(0xf59e0b, 2.6, 22);
    seLight.position.set(6, 5.2, 6);
    this.scene.add(seLight);

    const redTargetLight = new THREE.PointLight(0xef4444, 3.5, 16);
    redTargetLight.position.set(4, 3.2, 0);
    this.scene.add(redTargetLight);

    // Dedicated Exit Door Floodlights
    const exitFloodLight1 = new THREE.PointLight(0x10b981, 4.5, 20);
    exitFloodLight1.position.set(-2.4, 5.0, -9.5);
    this.scene.add(exitFloodLight1);

    const exitFloodLight2 = new THREE.PointLight(0x34d399, 4.5, 20);
    exitFloodLight2.position.set(2.4, 5.0, -9.5);
    this.scene.add(exitFloodLight2);

    const exitCenterSpot = new THREE.PointLight(0x38bdf8, 3.2, 16);
    exitCenterSpot.position.set(0, 4.6, -10.0);
    this.scene.add(exitCenterSpot);

    // Floor Runway Chevron Guides leading directly straight to the North Exit Door
    const runwayGroup = new THREE.Group();
    const chevronMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x34d399,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    [2.0, 0.0, -2.0, -4.0, -6.0, -8.0, -9.5, -10.5].forEach((zPos) => {
      // Left chevron wing
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.16), chevronMat);
      leftWing.position.set(-0.28, 0.03, zPos);
      leftWing.rotation.y = Math.PI / 4;

      // Right chevron wing
      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.16), chevronMat);
      rightWing.position.set(0.28, 0.03, zPos);
      rightWing.rotation.y = -Math.PI / 4;

      runwayGroup.add(leftWing, rightWing);
    });
    this.scene.add(runwayGroup);

    // Giant Sky Beacon Pillar visible above all maze walls from anywhere in the room
    const beaconPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, H, 16),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x34d399,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.55,
      })
    );
    beaconPillar.position.set(0, H / 2, -10.5);
    this.scene.add(beaconPillar);

    // Floating pulsing beacon rings stacked vertically
    [1.5, 3.2, 4.8].forEach((ry) => {
      const bRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.07, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x34d399 })
      );
      bRing.rotation.x = Math.PI / 2;
      bRing.position.set(0, ry, -10.5);
      this.scene.add(bRing);
      this.animatedMeshes.push(bRing);
    });

    // -------------------------------------------------------------------------
    // 3. PHYSICAL 3D MAZE GRAPH NODES
    // -------------------------------------------------------------------------
    const mazeNodesMap = new Map<string, Maze3DNodeRef>();

    // A. GREEN START Node [S] at (-4, 0, 4)
    const startTileGeo = new THREE.BoxGeometry(2.8, 0.12, 2.8);
    const startTileMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    });
    const startTile = new THREE.Mesh(startTileGeo, startTileMat);
    startTile.position.set(-4, 0.06, 4);
    startTile.receiveShadow = true;
    this.scene.add(startTile);

    // Glowing Start Rings (Green)
    const startRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    startRing.rotation.x = -Math.PI / 2;
    startRing.position.set(-4, 0.13, 4);
    this.scene.add(startRing);

    // Floating Green Start Marker
    const startTagGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
    const startTagMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.2,
      metalness: 0.8,
    });
    const startTag = new THREE.Mesh(startTagGeo, startTagMat);
    startTag.position.set(-4, 1.2, 4);
    this.scene.add(startTag);
    this.animatedMeshes.push(startTag);

    const startLight = new THREE.PointLight(0x10b981, 1.8, 8);
    startLight.position.set(-4, 2.0, 4);
    this.scene.add(startLight);

    mazeNodesMap.set('S', {
      id: 'S',
      tileMesh: startTile,
      ringMesh: startRing,
      markerMesh: startTag,
      haloLight: startLight,
    });

    // B. START TERMINAL at (-4, 0, 2.4) — directly adjacent to Start Node
    const startTerminalGroup = new THREE.Group();
    startTerminalGroup.position.set(-4, 0, 2.4);

    // Terminal Pedestal
    const termPedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    termPedestal.position.y = 0.55;
    termPedestal.castShadow = true;
    startTerminalGroup.add(termPedestal);

    // Angled Holographic Display Screen
    const termScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.7, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x047857,
        emissive: 0x10b981,
        emissiveIntensity: 1.1,
        roughness: 0.2,
      })
    );
    termScreen.position.set(0, 1.25, 0);
    termScreen.rotation.x = -0.3;
    startTerminalGroup.add(termScreen);

    // Terminal Screen Light
    const termLight = new THREE.PointLight(0x10b981, 2.0, 5);
    termLight.position.set(0, 1.3, 0.2);
    startTerminalGroup.add(termLight);

    this.scene.add(startTerminalGroup);
    this.addBoxCollider(new THREE.Vector3(-4.8, 0, 1.9), new THREE.Vector3(-3.2, 1.6, 2.9));

    // Interactive START TERMINAL: [E] START BFS SEARCH
    this.interactiveObjects.push({
      id: 'search_maze_start_terminal',
      type: 'security_console',
      name: 'BFS START TERMINAL',
      prompt: '[E] START BFS SEARCH',
      position: [-4, 1.1, 2.4],
      hitRadius: 2.4,
      mesh: startTerminalGroup,
    });

    // C. RED TARGET Node [G] at (4, 0, 0) — Radiant Crimson Beacon
    const targetPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.5, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f1d2b, metalness: 0.9, roughness: 0.2 })
    );
    targetPedestal.position.set(4, 0.22, 0);
    this.scene.add(targetPedestal);

    // Target Crimson Core Orb (Spinning Ruby)
    const targetCoreGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const targetCoreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      metalness: 0.6,
      roughness: 0.1,
    });
    const targetCore = new THREE.Mesh(targetCoreGeo, targetCoreMat);
    targetCore.position.set(4, 1.35, 0);
    this.scene.add(targetCore);
    this.animatedMeshes.push(targetCore);

    // Concentric Target Rings on Floor
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(4, 0.05, 0);
    this.scene.add(targetRing);

    mazeNodesMap.set('G', {
      id: 'G',
      tileMesh: targetPedestal,
      ringMesh: targetRing,
      markerMesh: targetCore,
      haloLight: redTargetLight,
    });

    // Interactive Target Node Object
    this.interactiveObjects.push({
      id: 'search_maze_target_node',
      type: 'evidence_corkboard',
      name: 'RED TARGET [G]',
      prompt: 'Red Target Marker [G]',
      position: [4, 1.3, 0],
      hitRadius: 2.3,
      mesh: targetCore,
    });

    // D. BLUE / WHITE Navigation Nodes: N1..N7
    const navNodePositions: [string, number, number][] = [
      ['N1', 0, 4],
      ['N2', -4, 0],
      ['N3', 4, 4],
      ['N4', 0, 0],
      ['N5', -4, -4],
      ['N6', 0, -4],
      ['N7', 4, -4],
    ];

    navNodePositions.forEach(([nodeId, nx, nz]) => {
      // Floor Node Base Pad
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.2, 0.1, 16),
        new THREE.MeshStandardMaterial({
          color: 0x0e2a47,
          metalness: 0.8,
          roughness: 0.3,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3,
        })
      );
      pad.position.set(nx, 0.05, nz);
      this.scene.add(pad);

      // Holographic Ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.05, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(nx, 0.11, nz);
      this.scene.add(ring);

      // Floating Blue/White Node Beacon
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.15, 6),
        new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
          metalness: 0.8,
        })
      );
      beacon.position.set(nx, 0.8, nz);
      this.scene.add(beacon);
      this.animatedMeshes.push(beacon);

      const nodeLight = new THREE.PointLight(0x0284c7, 0.8, 5);
      nodeLight.position.set(nx, 1.4, nz);
      this.scene.add(nodeLight);

      mazeNodesMap.set(nodeId, {
        id: nodeId,
        tileMesh: pad,
        ringMesh: ring,
        markerMesh: beacon,
        haloLight: nodeLight,
      });
    });

    // -------------------------------------------------------------------------
    // 4. CLEAN 3D CORRIDOR WALLS (DEFINING THE MULTI-ROUTE MAZE)
    // -------------------------------------------------------------------------
    const createCorridorWall = (x: number, z: number, w: number, d: number) => {
      const wallMatInterior = new THREE.MeshStandardMaterial({
        color: 0x111e33,
        metalness: 0.7,
        roughness: 0.3,
      });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3.2, d), wallMatInterior);
      wall.position.set(x, 1.6, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);

      // Top glowing cyan LED accent stripe
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.98, 0.1, d * 0.98),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x0284c7, emissiveIntensity: 0.8 })
      );
      strip.position.set(x, 3.25, z);
      this.scene.add(strip);

      this.addBoxCollider(
        new THREE.Vector3(x - w / 2, 0, z - d / 2),
        new THREE.Vector3(x + w / 2, 3.3, z + d / 2)
      );
    };

    // Interior maze walls separating the corridors (leaving wide, clear corridors)
    createCorridorWall(-2, 2, 1.8, 1.8);
    createCorridorWall(2, 2, 1.8, 1.8);
    createCorridorWall(-2, -2, 1.8, 1.8);
    createCorridorWall(2, -2, 1.8, 1.8);
    createCorridorWall(-8.5, 0, 2.0, 8.0);
    createCorridorWall(8.5, 0, 2.0, 8.0);

    // -------------------------------------------------------------------------
    // 5. GRAPH CONDUITS (BASE EDGES & SHORTEST PATH HIGHLIGHT GROUP)
    // -------------------------------------------------------------------------
    const baseConduitsGroup = new THREE.Group();
    const createConduit = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const conduit = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.04, len),
        new THREE.MeshStandardMaterial({
          color: 0x1e3a8a,
          emissive: 0x0284c7,
          emissiveIntensity: 0.4,
        })
      );
      conduit.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2);
      conduit.rotation.y = angle;
      baseConduitsGroup.add(conduit);
    };

    // Connect graph edges
    createConduit(-4, 4, 0, 4);   // S -> N1
    createConduit(-4, 4, -4, 0);  // S -> N2
    createConduit(0, 4, 4, 4);    // N1 -> N3
    createConduit(0, 4, 0, 0);    // N1 -> N4
    createConduit(-4, 0, 0, 0);   // N2 -> N4
    createConduit(-4, 0, -4, -4); // N2 -> N5
    createConduit(4, 4, 4, 0);    // N3 -> G
    createConduit(0, 0, 4, 0);    // N4 -> G
    createConduit(0, 0, 0, -4);   // N4 -> N6
    createConduit(-4, -4, 0, -4); // N5 -> N6
    createConduit(0, -4, 4, -4);  // N6 -> N7
    createConduit(4, -4, 4, 0);   // N7 -> G
    this.scene.add(baseConduitsGroup);

    // Radiant Shortest Path Beams Group (S -> N1 -> N4 -> G)
    const shortestPathBeams = new THREE.Group();
    shortestPathBeams.visible = false;

    const createBeam = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, len),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x34d399,
          emissiveIntensity: 1.6,
        })
      );
      beam.position.set((x1 + x2) / 2, 0.06, (z1 + z2) / 2);
      beam.rotation.y = angle;
      shortestPathBeams.add(beam);
    };

    createBeam(-4, 4, 0, 4);  // S -> N1
    createBeam(0, 4, 0, 0);   // N1 -> N4
    createBeam(0, 0, 4, 0);   // N4 -> G
    this.scene.add(shortestPathBeams);

    // -------------------------------------------------------------------------
    // 6. PHYSICAL EXIT DOOR TO LEVEL 2 (North Blast Door at z = -11.5)
    // -------------------------------------------------------------------------
    this.vaultDoorGroup = new THREE.Group();
    this.vaultDoorGroup.position.set(0, 0, -11.5);

    // Heavy Door Frame with High-Tech Cyan Bevels
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
    });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), frameMat);
    frameLeft.position.set(-2.2, 2.4, 0);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), frameMat);
    frameRight.position.set(2.2, 2.4, 0);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 0.8), frameMat);
    frameTop.position.set(0, 4.75, 0);
    this.vaultDoorGroup.add(frameLeft, frameRight, frameTop);

    // High-tech Gateway Scanner Towers on left and right
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.5,
    });
    const towerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 12), towerMat);
    towerLeft.position.set(-2.8, 2.25, 0.2);
    const towerRight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 12), towerMat);
    towerRight.position.set(2.8, 2.25, 0.2);
    this.vaultDoorGroup.add(towerLeft, towerRight);

    // Sliding Door Leaves
    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x0f233a,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.35,
    });
    const doorLeafLeft = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.35), doorLeafMat);
    doorLeafLeft.name = 'vaultDoorLeft';
    doorLeafLeft.position.set(-0.95, 2.0, 0);
    const doorLeafRight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.35), doorLeafMat);
    doorLeafRight.name = 'vaultDoorRight';
    doorLeafRight.position.set(0.95, 2.0, 0);
    this.vaultDoorGroup.add(doorLeafLeft, doorLeafRight);

    // Giant Exit Marquee Banner Display
    const marqueeTex = this.createExitDoorMarqueeTexture();
    const marqueeMat = new THREE.MeshStandardMaterial({
      map: marqueeTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const marqueeMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), marqueeMat);
    marqueeMesh.position.set(0, 5.0, 0.42);
    this.vaultDoorGroup.add(marqueeMesh);

    // High-visibility Glowing Chevron Light Bar
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x34d399, emissiveIntensity: 1.8 })
    );
    exitSign.position.set(0, 4.15, 0.35);
    this.vaultDoorGroup.add(exitSign);

    this.scene.add(this.vaultDoorGroup);

    // Door physical collider
    this.doorCollider = this.addBoxCollider(new THREE.Vector3(-2.2, 0, -12.2), new THREE.Vector3(2.2, 4.8, -10.9));

    // Interactive Door Object
    this.interactiveObjects.push({
      id: 'search_maze_exit_door',
      type: 'exit_door',
      name: 'Level 2 Exit Gateway',
      prompt: 'Level 2 Gateway (Locked — reach Target [G] to unlock)',
      position: [0, 2.0, -10.8],
      hitRadius: 3.0,
      mesh: this.vaultDoorGroup,
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
      mazeNodesMap,
      shortestPathBeams,
    };
  }

  // =========================================================================
  // SEARCH MAZE: LEVEL 2 — BRANCHING MAZE (LAYER-BY-LAYER BFS)
  // =========================================================================
  private buildSearchMazeLevel2(): EscapeRoomEnvironment {
    const W = 32;
    const D = 22;
    const H = 7;

    // 1. Room Boundary Colliders (East wall split around the exit doorway at z = [-2.2, 2.2])
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2)); // West
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1)); // South
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2)); // North
    // East wall left and right segments leaving door opening at z = [-2.2, 2.2]
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, -2.2));
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, 2.2), new THREE.Vector3(W / 2 + 1, H, D / 2));

    // 2. Floor & Ceiling
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorTex = this.createSearchMazeFloorTexture();
    floorTex.repeat.set(8, 6);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.45,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling with Overhead Light Troffers
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    const ceilingTrofferMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-8, 0, 8].forEach((cx) => {
      const trofferZ = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 18), ceilingTrofferMat);
      trofferZ.position.set(cx, H - 0.04, 0);
      this.scene.add(trofferZ);
    });
    [-4, 4].forEach((cz) => {
      const trofferX = new THREE.Mesh(new THREE.BoxGeometry(26, 0.08, 0.4), ceilingTrofferMat);
      trofferX.position.set(0, H - 0.04, cz);
      this.scene.add(trofferX);
    });

    // Walls (Quantum Search Matrix Grid Panels)
    const wallTex = this.createSearchMazeWallTexture();
    wallTex.repeat.set(8, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.4, metalness: 0.3 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    eastWall.position.set(W / 2, H / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);

    // Lighting (Crisp Laboratory Illuminance)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.9);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 2.5);
    this.scene.add(hemiLight);

    const mainLight = new THREE.PointLight(0x38bdf8, 3.8, 45);
    mainLight.position.set(0, 5.8, 0);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Corner floodlights
    const nwLight = new THREE.PointLight(0x38bdf8, 2.6, 25);
    nwLight.position.set(-8, 5.2, -6);
    this.scene.add(nwLight);

    const swLight = new THREE.PointLight(0x10b981, 2.8, 25);
    swLight.position.set(-8, 5.2, 6);
    this.scene.add(swLight);

    const neLight = new THREE.PointLight(0x38bdf8, 2.6, 25);
    neLight.position.set(8, 5.2, -6);
    this.scene.add(neLight);

    const seLight = new THREE.PointLight(0xf59e0b, 2.6, 25);
    seLight.position.set(8, 5.2, 6);
    this.scene.add(seLight);

    const redTargetLight = new THREE.PointLight(0xef4444, 3.8, 18);
    redTargetLight.position.set(8, 3.2, 0);
    this.scene.add(redTargetLight);

    // East Exit Door Floodlights
    const exitFloodLight1 = new THREE.PointLight(0x10b981, 4.5, 20);
    exitFloodLight1.position.set(13.5, 5.0, -2.4);
    this.scene.add(exitFloodLight1);

    const exitFloodLight2 = new THREE.PointLight(0x34d399, 4.5, 20);
    exitFloodLight2.position.set(13.5, 5.0, 2.4);
    this.scene.add(exitFloodLight2);

    // -------------------------------------------------------------------------
    // BFS RULE WALL DISPLAY (Near START at x = -8, z = -7.5)
    // -------------------------------------------------------------------------
    const ruleBoardGroup = new THREE.Group();
    ruleBoardGroup.position.set(-8, 2.6, -10.85);

    // Backing Board
    const ruleBacking = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 4.0, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    ruleBacking.position.set(0, 0, 0);
    ruleBoardGroup.add(ruleBacking);

    // Holographic Rule Surface Texture
    const ruleTex = this.createBfsRuleWallTexture();
    const rulePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.1, 3.7),
      new THREE.MeshStandardMaterial({
        map: ruleTex,
        roughness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.7,
      })
    );
    rulePlane.position.set(0, 0, 0.12);
    ruleBoardGroup.add(rulePlane);

    // Glow border frame
    const ruleFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.3, 3.9, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.9,
      })
    );
    ruleFrame.position.set(0, 0, 0.08);
    ruleBoardGroup.add(ruleFrame);

    const ruleSpot = new THREE.PointLight(0x38bdf8, 2.0, 8);
    ruleSpot.position.set(0, 1.5, 1.2);
    ruleBoardGroup.add(ruleSpot);

    this.scene.add(ruleBoardGroup);

    // -------------------------------------------------------------------------
    // 3. PHYSICAL 3D MAZE GRAPH NODES (LEVEL 2 TOPOLOGY)
    // -------------------------------------------------------------------------
    const mazeNodesMap = new Map<string, Maze3DNodeRef>();

    // A. GREEN START Node [S] at (-8, 0, 0)
    const startTileGeo = new THREE.BoxGeometry(2.8, 0.12, 2.8);
    const startTileMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    });
    const startTile = new THREE.Mesh(startTileGeo, startTileMat);
    startTile.position.set(-8, 0.06, 0);
    startTile.receiveShadow = true;
    this.scene.add(startTile);

    const startRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    startRing.rotation.x = -Math.PI / 2;
    startRing.position.set(-8, 0.13, 0);
    this.scene.add(startRing);

    const startTagGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
    const startTagMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.2,
      metalness: 0.8,
    });
    const startTag = new THREE.Mesh(startTagGeo, startTagMat);
    startTag.position.set(-8, 1.2, 0);
    this.scene.add(startTag);
    this.animatedMeshes.push(startTag);

    const startLight = new THREE.PointLight(0x10b981, 1.8, 8);
    startLight.position.set(-8, 2.0, 0);
    this.scene.add(startLight);

    mazeNodesMap.set('S', {
      id: 'S',
      tileMesh: startTile,
      ringMesh: startRing,
      markerMesh: startTag,
      haloLight: startLight,
    });

    // B. START TERMINAL at (-8, 0, -2.4)
    const startTerminalGroup = new THREE.Group();
    startTerminalGroup.position.set(-8, 0, -2.4);

    const termPedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    termPedestal.position.y = 0.55;
    termPedestal.castShadow = true;
    startTerminalGroup.add(termPedestal);

    const termScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.7, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x047857,
        emissive: 0x10b981,
        emissiveIntensity: 1.1,
        roughness: 0.2,
      })
    );
    termScreen.position.set(0, 1.25, 0);
    termScreen.rotation.x = 0.3;
    startTerminalGroup.add(termScreen);

    const termLight = new THREE.PointLight(0x10b981, 2.0, 5);
    termLight.position.set(0, 1.3, -0.2);
    startTerminalGroup.add(termLight);

    this.scene.add(startTerminalGroup);
    this.addBoxCollider(new THREE.Vector3(-8.8, 0, -2.9), new THREE.Vector3(-7.2, 1.6, -1.9));

    // Interactive START TERMINAL: [E] START BFS
    this.interactiveObjects.push({
      id: 'search_maze_start_terminal',
      type: 'security_console',
      name: 'BFS CONTROL TERMINAL',
      prompt: '[E] START BFS',
      position: [-8, 1.1, -2.4],
      hitRadius: 2.5,
      mesh: startTerminalGroup,
    });

    // C. RED TARGET Node [G] at (8, 0, 0)
    const targetPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.5, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f1d2b, metalness: 0.9, roughness: 0.2 })
    );
    targetPedestal.position.set(8, 0.22, 0);
    this.scene.add(targetPedestal);

    const targetCoreGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const targetCoreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      metalness: 0.6,
      roughness: 0.1,
    });
    const targetCore = new THREE.Mesh(targetCoreGeo, targetCoreMat);
    targetCore.position.set(8, 1.35, 0);
    this.scene.add(targetCore);
    this.animatedMeshes.push(targetCore);

    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(8, 0.05, 0);
    this.scene.add(targetRing);

    mazeNodesMap.set('G', {
      id: 'G',
      tileMesh: targetPedestal,
      ringMesh: targetRing,
      markerMesh: targetCore,
      haloLight: redTargetLight,
    });

    // Interactive Target Node Object
    this.interactiveObjects.push({
      id: 'search_maze_target_node',
      type: 'evidence_corkboard',
      name: 'RED TARGET [G]',
      prompt: 'Red Target Marker [G]',
      position: [8, 1.3, 0],
      hitRadius: 2.5,
      mesh: targetCore,
    });

    // D. INTERMEDIATE GRAPH NODES: Node A, Node B, Node C, Node E, Node D
    const intermediateNodes: [string, number, number][] = [
      ['A', -4, 0],
      ['B', 0, -4],
      ['C', 0, 4],
      ['E', 4, -4],
      ['D', 4, 4],
    ];

    intermediateNodes.forEach(([nodeId, nx, nz]) => {
      // Floor Node Base Pad
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.2, 0.1, 16),
        new THREE.MeshStandardMaterial({
          color: 0x0e2a47,
          metalness: 0.8,
          roughness: 0.3,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3,
        })
      );
      pad.position.set(nx, 0.05, nz);
      this.scene.add(pad);

      // Holographic Ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.05, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(nx, 0.11, nz);
      this.scene.add(ring);

      // Floating Node Beacon
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.15, 6),
        new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
          metalness: 0.8,
        })
      );
      beacon.position.set(nx, 0.8, nz);
      this.scene.add(beacon);
      this.animatedMeshes.push(beacon);

      const nodeLight = new THREE.PointLight(0x0284c7, 0.9, 6);
      nodeLight.position.set(nx, 1.4, nz);
      this.scene.add(nodeLight);

      mazeNodesMap.set(nodeId, {
        id: nodeId,
        tileMesh: pad,
        ringMesh: ring,
        markerMesh: beacon,
        haloLight: nodeLight,
      });
    });

    // -------------------------------------------------------------------------
    // 4. CLEAN 3D CORRIDOR WALLS (DEFINING THE BRANCHING ARCHITECTURE)
    // -------------------------------------------------------------------------
    const createCorridorWall = (x: number, z: number, w: number, d: number) => {
      const wallMatInterior = new THREE.MeshStandardMaterial({
        color: 0x111e33,
        metalness: 0.7,
        roughness: 0.3,
      });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3.2, d), wallMatInterior);
      wall.position.set(x, 1.6, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);

      // Top glowing cyan LED accent stripe
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.98, 0.1, d * 0.98),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x0284c7, emissiveIntensity: 0.8 })
      );
      strip.position.set(x, 3.25, z);
      this.scene.add(strip);

      this.addBoxCollider(
        new THREE.Vector3(x - w / 2, 0, z - d / 2),
        new THREE.Vector3(x + w / 2, 3.3, z + d / 2)
      );
    };

    // Central Dividing Island separating North corridor (B, E) and South corridor (C, D)
    createCorridorWall(2.0, 0, 7.0, 3.6);
    createCorridorWall(-2.0, 0, 1.8, 3.6);

    // North corridor guide wall & South corridor guide wall
    createCorridorWall(2.0, -7.8, 12.0, 1.8);
    createCorridorWall(2.0, 7.8, 12.0, 1.8);

    // Outer guide walls near Start and East sections
    createCorridorWall(-8.0, -5.5, 2.0, 5.0);
    createCorridorWall(-8.0, 5.5, 2.0, 5.0);

    // -------------------------------------------------------------------------
    // 5. GRAPH CONDUITS (BASE EDGES & SHORTEST PATH HIGHLIGHT GROUP)
    // -------------------------------------------------------------------------
    const baseConduitsGroup = new THREE.Group();
    const createConduit = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const conduit = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.04, len),
        new THREE.MeshStandardMaterial({
          color: 0x1e3a8a,
          emissive: 0x0284c7,
          emissiveIntensity: 0.4,
        })
      );
      conduit.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2);
      conduit.rotation.y = angle;
      baseConduitsGroup.add(conduit);
    };

    // Connect Level 2 graph edges:
    createConduit(-8, 0, -4, 0);  // S -> A
    createConduit(-4, 0, 0, -4);  // A -> B
    createConduit(-4, 0, 0, 4);   // A -> C
    createConduit(0, -4, 4, -4);  // B -> E
    createConduit(0, 4, 4, 4);    // C -> D
    createConduit(4, -4, 8, 0);   // E -> G
    createConduit(4, 4, 8, 0);    // D -> G
    createConduit(8, 0, 13.5, 0); // G -> Exit Door
    this.scene.add(baseConduitsGroup);

    // Radiant Shortest Path Beams Group (S -> A -> B -> E -> G -> Exit Door)
    const shortestPathBeams = new THREE.Group();
    shortestPathBeams.visible = false;

    const createBeam = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, len),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x34d399,
          emissiveIntensity: 1.8,
        })
      );
      beam.position.set((x1 + x2) / 2, 0.06, (z1 + z2) / 2);
      beam.rotation.y = angle;
      shortestPathBeams.add(beam);
    };

    createBeam(-8, 0, -4, 0); // S -> A
    createBeam(-4, 0, 0, -4); // A -> B
    createBeam(0, -4, 4, -4); // B -> E
    createBeam(4, -4, 8, 0);  // E -> G
    createBeam(8, 0, 13.5, 0);// G -> Exit Door
    this.scene.add(shortestPathBeams);

    // Floor Runway Chevron Guides leading directly straight to the East Exit Door
    const runwayGroup = new THREE.Group();
    const chevronMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x34d399,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    [8.8, 9.8, 10.8, 11.8, 12.8, 13.6].forEach((xPos) => {
      const topWing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.65), chevronMat);
      topWing.position.set(xPos, 0.03, -0.28);
      topWing.rotation.y = Math.PI / 4;

      const botWing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.65), chevronMat);
      botWing.position.set(xPos, 0.03, 0.28);
      botWing.rotation.y = -Math.PI / 4;

      runwayGroup.add(topWing, botWing);
    });
    this.scene.add(runwayGroup);

    // Sky Beacon Pillar at the East Exit Gateway
    const beaconPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, H, 16),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x34d399,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.55,
      })
    );
    beaconPillar.position.set(13.8, H / 2, 0);
    this.scene.add(beaconPillar);

    [1.5, 3.2, 4.8].forEach((ry) => {
      const bRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.07, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x34d399 })
      );
      bRing.rotation.x = Math.PI / 2;
      bRing.position.set(13.8, ry, 0);
      this.scene.add(bRing);
      this.animatedMeshes.push(bRing);
    });

    // -------------------------------------------------------------------------
    // 6. PHYSICAL EXIT DOOR TO LEVEL 3 (East Blast Door at x = 14.5, z = 0)
    // -------------------------------------------------------------------------
    this.vaultDoorGroup = new THREE.Group();
    this.vaultDoorGroup.position.set(14.5, 0, 0);
    this.vaultDoorGroup.rotation.y = -Math.PI / 2; // Face West towards the incoming corridors

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
    });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), frameMat);
    frameLeft.position.set(-2.2, 2.4, 0);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), frameMat);
    frameRight.position.set(2.2, 2.4, 0);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 0.8), frameMat);
    frameTop.position.set(0, 4.75, 0);
    this.vaultDoorGroup.add(frameLeft, frameRight, frameTop);

    // High-tech Gateway Scanner Towers
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.5,
    });
    const towerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 12), towerMat);
    towerLeft.position.set(-2.8, 2.25, 0.2);
    const towerRight = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 12), towerMat);
    towerRight.position.set(2.8, 2.25, 0.2);
    this.vaultDoorGroup.add(towerLeft, towerRight);

    // Sliding Door Leaves
    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x0f233a,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.35,
    });
    const doorLeafLeft = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.35), doorLeafMat);
    doorLeafLeft.name = 'vaultDoorLeft';
    doorLeafLeft.position.set(-0.95, 2.0, 0);
    const doorLeafRight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.35), doorLeafMat);
    doorLeafRight.name = 'vaultDoorRight';
    doorLeafRight.position.set(0.95, 2.0, 0);
    this.vaultDoorGroup.add(doorLeafLeft, doorLeafRight);

    // Marquee Banner Display for Level 3
    const marqueeTex = this.createExitDoorMarqueeTexture('▲  LEVEL 3 EXIT  ▲', 'EAST GATEWAY AHEAD');
    const marqueeMat = new THREE.MeshStandardMaterial({
      map: marqueeTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const marqueeMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), marqueeMat);
    marqueeMesh.position.set(0, 5.0, 0.42);
    this.vaultDoorGroup.add(marqueeMesh);

    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x34d399, emissiveIntensity: 1.8 })
    );
    exitSign.position.set(0, 4.15, 0.35);
    this.vaultDoorGroup.add(exitSign);

    this.scene.add(this.vaultDoorGroup);

    // Door physical collider
    this.doorCollider = this.addBoxCollider(new THREE.Vector3(13.5, 0, -2.2), new THREE.Vector3(15.2, 4.8, 2.2));

    // Interactive Door Object
    this.interactiveObjects.push({
      id: 'search_maze_exit_door',
      type: 'exit_door',
      name: 'Level 3 Exit Gateway',
      prompt: 'Level 3 Gateway (Locked — reach Target [G] to unlock)',
      position: [13.5, 2.0, 0],
      hitRadius: 3.0,
      mesh: this.vaultDoorGroup,
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
      mazeNodesMap,
      shortestPathBeams,
    };
  }

  // =========================================================================
  // SEARCH MAZE — LEVEL 3: BFS DECISION PATH (ESCAPE-ROOM FACILITY)
  // =========================================================================
  public createTerminalTexture3(
    stageNumber: number,
    visited: string[],
    queue: string[],
    question: string
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#050c18';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 496);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(8, 8, 496, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BFS SEARCH STATUS', 256, 44);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(stageNumber > 4 ? 'STAGE: TARGET SEARCH' : `SEARCH PROGRESS — STAGE ${stageNumber} / 4`, 24, 96);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('VISITED:', 24, 130);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(visited.join(' → '), 24, 156);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('BFS QUEUE (FIFO):', 24, 196);

    let qX = 24;
    queue.slice(0, 5).forEach((item, idx) => {
      ctx.fillStyle = idx === 0 ? '#b45309' : '#1e3a8a';
      ctx.strokeStyle = idx === 0 ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.fillRect(qX, 212, 74, 46);
      ctx.strokeRect(qX, 212, 74, 46);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.replace('TARGET', 'TGT'), qX + 37, 240);
      if (idx === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('FRONT', qX + 37, 252);
      }
      qX += 82;
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('QUESTION:', 24, 290);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    const words = question.split(' ');
    let line = '';
    let y = 318;
    for (const w of words) {
      if ((line + w).length > 28) {
        ctx.fillText(line, 24, y);
        line = w + ' ';
        y += 26;
      } else {
        line += w + ' ';
      }
    }
    ctx.fillText(line, 24, y);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('REMEMBER: FRONT OF QUEUE = NEXT', 24, 430);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('▶ WALK INTO THE CHOSEN CIRCLE ON FLOOR', 24, 465);

    return new THREE.CanvasTexture(canvas);
  }

  private buildSearchMazeLevel3(): EscapeRoomEnvironment {
    const W = 36;
    const D = 28;
    const H = 7.5;

    // 1. Room Boundary Colliders (East wall split around exit doorway at z = [-2.4, 2.4])
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2)); // West
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1)); // South
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2)); // North
    // East wall left and right segments leaving door opening at z = [-2.4, 2.4]
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, -2.4));
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, 2.4), new THREE.Vector3(W / 2 + 1, H, D / 2));

    // 2. Floor & Ceiling
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorTex = this.createSearchMazeFloorTexture();
    floorTex.repeat.set(10, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.4,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling with Overhead Light Troffers & Cross Beams
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x090f1d, roughness: 0.8 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    const ceilingTrofferMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    [-10, -2, 6, 14].forEach((cx) => {
      const trofferZ = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 22), ceilingTrofferMat);
      trofferZ.position.set(cx, H - 0.04, 0);
      this.scene.add(trofferZ);
    });
    [-8, 0, 8].forEach((cz) => {
      const trofferX = new THREE.Mesh(new THREE.BoxGeometry(30, 0.08, 0.4), ceilingTrofferMat);
      trofferX.position.set(0, H - 0.04, cz);
      this.scene.add(trofferX);
    });

    // Walls (Quantum Search Matrix Grid Panels)
    const wallTex = this.createSearchMazeWallTexture();
    wallTex.repeat.set(10, 2.2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.35, metalness: 0.45 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall (Split into North and South segments + top lintel leaving doorway open at z = [-2.4, 2.4])
    const doorHalfWidth = 2.4;
    const eastSegLen = D / 2 - doorHalfWidth; // 14 - 2.4 = 11.6

    // North segment of East wall
    const eastNorthWall = new THREE.Mesh(new THREE.PlaneGeometry(eastSegLen, H), wallMat);
    eastNorthWall.position.set(W / 2, H / 2, -D / 2 + eastSegLen / 2);
    eastNorthWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastNorthWall);

    // South segment of East wall
    const eastSouthWall = new THREE.Mesh(new THREE.PlaneGeometry(eastSegLen, H), wallMat);
    eastSouthWall.position.set(W / 2, H / 2, D / 2 - eastSegLen / 2);
    eastSouthWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastSouthWall);

    // Lintel above East exit doorway
    const eastLintelH = H - 5.0; // from y = 5.0 to 7.5
    const eastLintel = new THREE.Mesh(new THREE.PlaneGeometry(doorHalfWidth * 2, eastLintelH), wallMat);
    eastLintel.position.set(W / 2, 5.0 + eastLintelH / 2, 0);
    eastLintel.rotation.y = -Math.PI / 2;
    this.scene.add(eastLintel);

    // Illuminated Exit Gateway Corridor extending beyond the door (x = 16.5 to x = 24)
    const corridorFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.8),
      new THREE.MeshStandardMaterial({
        color: 0x064e3b,
        emissive: 0x10b981,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      })
    );
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.set(20.5, 0.02, 0);
    this.scene.add(corridorFloor);

    // Corridor side walls and glowing portal light
    const corridorNorthWall = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x091428, roughness: 0.5 })
    );
    corridorNorthWall.position.set(20.5, 2.5, -2.4);
    this.scene.add(corridorNorthWall);

    const corridorSouthWall = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x091428, roughness: 0.5 })
    );
    corridorSouthWall.position.set(20.5, 2.5, 2.4);
    corridorSouthWall.rotation.y = Math.PI;
    this.scene.add(corridorSouthWall);

    const exitPortalLight = new THREE.PointLight(0x10b981, 2.5, 12);
    exitPortalLight.position.set(19.0, 3.0, 0);
    this.scene.add(exitPortalLight);

    // Atmospheric Lighting (Clean Sci-Fi Laboratory Ambience)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 2.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0x38bdf8, 2.0, 30);
    mainLight.position.set(0, H - 1.2, 0);
    this.scene.add(mainLight);

    // 4 Structural Columns with glowing neon conduits
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const pillarNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    [
      [-10, -9],
      [-10, 9],
      [10, -9],
      [10, 9],
    ].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, H, 1.2), pillarMat);
      col.position.set(px, H / 2, pz);
      col.castShadow = true;
      col.receiveShadow = true;
      this.scene.add(col);
      this.addBoxCollider(new THREE.Vector3(px - 0.7, 0, pz - 0.7), new THREE.Vector3(px + 0.7, H, pz + 0.7));

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, H * 0.9, 1.22), pillarNeonMat);
      stripe.position.set(px, H / 2, pz);
      this.scene.add(stripe);
    });

    // Wall Server Racks along North and South walls
    const createWallUnit = (x: number, z: number, rotY: number) => {
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 3.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x091428, metalness: 0.85, roughness: 0.25 })
      );
      rack.position.set(x, 1.6, z);
      rack.rotation.y = rotY;
      this.scene.add(rack);

      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.6),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
      );
      panel.position.set(x, 1.6, z + (rotY === 0 ? 0.41 : -0.41));
      panel.rotation.y = rotY;
      this.scene.add(panel);

      this.addBoxCollider(new THREE.Vector3(x - 1.5, 0, z - 0.5), new THREE.Vector3(x + 1.5, 3.2, z + 0.5));
    };

    createWallUnit(-5, -D / 2 + 0.5, 0);
    createWallUnit(5, -D / 2 + 0.5, 0);
    createWallUnit(-5, D / 2 - 0.5, Math.PI);
    createWallUnit(5, D / 2 - 0.5, Math.PI);

    // -------------------------------------------------------------------------
    // 3. GRAPH NODES MAP & INTERACTIVE CIRCLES
    // -------------------------------------------------------------------------
    const mazeNodesMap = new Map<string, Maze3DNodeRef>();

    // Helper: Create Floating Node Sprite Marker
    const createNodeSprite = (label: string, colorHex: string = '#38bdf8'): THREE.Sprite => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Glassmorphic dark badge
      ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 112, 22);
      ctx.fill();
      ctx.stroke();

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(label.length > 6 ? 2.8 : 1.5, 0.75, 1.0);
      return sprite;
    };

    // A. GREEN START CIRCLE at (-13, 0)
    const startTile = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.8, roughness: 0.2, emissive: 0x059669, emissiveIntensity: 0.4 })
    );
    startTile.position.set(-13, 0.04, 0);
    this.scene.add(startTile);

    const startRing = new THREE.Mesh(
      new THREE.RingGeometry(1.3, 1.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    startRing.rotation.x = -Math.PI / 2;
    startRing.position.set(-13, 0.09, 0);
    this.scene.add(startRing);

    const startSprite = createNodeSprite('START', '#10b981');
    startSprite.position.set(-13, 2.3, 0);
    this.scene.add(startSprite);
    this.animatedMeshes.push(startSprite);

    const startLight = new THREE.PointLight(0x10b981, 2.2, 8);
    startLight.position.set(-13, 2.0, 0);
    this.scene.add(startLight);

    mazeNodesMap.set('S', {
      id: 'S',
      tileMesh: startTile,
      ringMesh: startRing,
      markerMesh: startTile,
      haloLight: startLight,
    });

    // B. BFS ANALYSIS TERMINAL at (-13, 0, -3.2)
    const termGroup = new THREE.Group();
    termGroup.position.set(-13, 0, -3.2);

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0b1329, metalness: 0.9, roughness: 0.2 })
    );
    pedestal.position.y = 0.6;
    termGroup.add(pedestal);

    // Terminal Screen Mesh with dynamic canvas texture
    const termTex = this.createTerminalTexture3(1, ['START', 'A'], ['B', 'C', 'D'], 'Which node will BFS process next?');
    const screenMat = new THREE.MeshStandardMaterial({
      map: termTex,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const termScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), screenMat);
    termScreen.name = 'searchMazeTerminalScreen3';
    termScreen.position.set(0, 1.45, 0.35);
    termScreen.rotation.x = -0.25;
    termGroup.add(termScreen);

    const termGlow = new THREE.PointLight(0x00f0ff, 2.0, 5);
    termGlow.position.set(0, 1.6, 0.2);
    termGroup.add(termGlow);

    this.scene.add(termGroup);
    this.addBoxCollider(new THREE.Vector3(-14.0, 0, -3.8), new THREE.Vector3(-12.0, 2.0, -2.6));

    // Interactive Terminal
    this.interactiveObjects.push({
      id: 'search_maze_terminal_3',
      type: 'security_console',
      name: 'BFS DECISION TERMINAL',
      prompt: '[E] INSPECT BFS SEARCH QUEUE',
      position: [-13, 1.2, -3.2],
      hitRadius: 2.8,
      mesh: termGroup,
    });

    // C. FLOOR DECISION NODES
    const nodeConfigs: { id: string; label: string; x: number; z: number; isTarget?: boolean }[] = [
      { id: 'A', label: 'A', x: -9, z: 0 },
      { id: 'B', label: 'B', x: -5.5, z: -4 },
      { id: 'C', label: 'C', x: -3.5, z: 0 },
      { id: 'D', label: 'D', x: -4.0, z: 5 },
      { id: 'E', label: 'E', x: 2.5, z: -6.5 },
      { id: 'F', label: 'F', x: 1.5, z: -2.5 },
      { id: 'G', label: 'G', x: 2.5, z: 1.0 },
      { id: 'H', label: 'H', x: 2.5, z: 5.5 },
      { id: 'TARGET', label: 'RED TARGET', x: 9.0, z: -6.0, isTarget: true },
    ];

    nodeConfigs.forEach((cfg) => {
      const isTarget = !!cfg.isTarget;
      const baseColor = isTarget ? 0x450a0a : (cfg.id === 'A' ? 0x064e3b : 0x0c2340);
      const ringColor = isTarget ? 0xef4444 : (cfg.id === 'A' ? 0x10b981 : 0x38bdf8);
      const spriteColorHex = isTarget ? '#ef4444' : (cfg.id === 'A' ? '#10b981' : '#38bdf8');

      // Base Pad
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.08, 32),
        new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.85,
          roughness: 0.25,
          emissive: ringColor,
          emissiveIntensity: 0.35,
        })
      );
      pad.position.set(cfg.x, 0.04, cfg.z);
      this.scene.add(pad);

      // Outer Glowing Ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.45, 32),
        new THREE.MeshBasicMaterial({ color: ringColor, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cfg.x, 0.09, cfg.z);
      this.scene.add(ring);

      // Floating Sprite Tag
      const sprite = createNodeSprite(cfg.label, spriteColorHex);
      sprite.position.set(cfg.x, 2.3, cfg.z);
      this.scene.add(sprite);
      this.animatedMeshes.push(sprite);

      // Node Halo Light
      const haloLight = new THREE.PointLight(ringColor, isTarget ? 1.8 : 1.2, 6.5);
      haloLight.position.set(cfg.x, 1.8, cfg.z);
      this.scene.add(haloLight);

      mazeNodesMap.set(cfg.id, {
        id: cfg.id,
        tileMesh: pad,
        ringMesh: ring,
        markerMesh: pad,
        haloLight: haloLight,
      });
    });

    // -------------------------------------------------------------------------
    // 4. GRAPH EDGES / CONDUITS & SHORTEST PATH HIGHLIGHT
    // -------------------------------------------------------------------------
    const createConduit = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const conduit = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.03, len),
        new THREE.MeshStandardMaterial({
          color: 0x1e3a8a,
          emissive: 0x0284c7,
          emissiveIntensity: 0.3,
          roughness: 0.4,
        })
      );
      conduit.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      conduit.rotation.y = angle;
      this.scene.add(conduit);
    };

    // Connect graph edges
    createConduit(-13, 0, -9, 0); // S -> A
    createConduit(-9, 0, -5.5, -4); // A -> B
    createConduit(-9, 0, -3.5, 0);  // A -> C
    createConduit(-9, 0, -4.0, 5);  // A -> D
    createConduit(-5.5, -4, 2.5, -6.5); // B -> E
    createConduit(-5.5, -4, 1.5, -2.5); // B -> F
    createConduit(-3.5, 0, 2.5, 1.0);   // C -> G
    createConduit(-4.0, 5, 2.5, 5.5);   // D -> H
    createConduit(2.5, -6.5, 9.0, -6.0); // E -> TARGET

    // Shortest Path High-Intensity Beams: S -> A -> B -> E -> TARGET -> East Exit
    const shortestPathBeams = new THREE.Group();
    const createBeamSegment = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.06, len),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x00f0ff,
          emissiveIntensity: 3.2,
          roughness: 0.1,
        })
      );
      beam.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2);
      beam.rotation.y = angle;
      shortestPathBeams.add(beam);
    };

    createBeamSegment(-13, 0, -9, 0);
    createBeamSegment(-9, 0, -5.5, -4);
    createBeamSegment(-5.5, -4, 2.5, -6.5);
    createBeamSegment(2.5, -6.5, 9.0, -6.0);
    createBeamSegment(9.0, -6.0, 16.5, 0); // Leads directly to East Exit Doorway!
    shortestPathBeams.visible = false;
    this.scene.add(shortestPathBeams);

    // -------------------------------------------------------------------------
    // 5. FUTURISTIC EAST EXIT GATEWAY
    // -------------------------------------------------------------------------
    this.vaultDoorGroup = new THREE.Group();
    this.vaultDoorGroup.position.set(16.5, 0, 0);
    this.vaultDoorGroup.rotation.y = -Math.PI / 2; // Facing West toward the room

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0b132b,
      metalness: 0.9,
      roughness: 0.2,
    });

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), frameMat);
    leftPillar.position.set(-2.2, 2.5, 0);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), frameMat);
    rightPillar.position.set(2.2, 2.5, 0);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 0.8), frameMat);
    topLintel.position.set(0, 5.1, 0);
    this.vaultDoorGroup.add(leftPillar, rightPillar, topLintel);

    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x0f233a,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.35,
    });
    const doorLeafLeft = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.2, 0.35), doorLeafMat);
    doorLeafLeft.name = 'vaultDoorLeft';
    doorLeafLeft.position.set(-1.0, 2.1, 0);
    const doorLeafRight = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.2, 0.35), doorLeafMat);
    doorLeafRight.name = 'vaultDoorRight';
    doorLeafRight.position.set(1.0, 2.1, 0);
    this.vaultDoorGroup.add(doorLeafLeft, doorLeafRight);

    // Marquee Banner Display for Level 3
    const marqueeTex = this.createExitDoorMarqueeTexture('▲ LEVEL 3 EXIT GATEWAY ▲', 'PATH TO LEVEL 4');
    const marqueeMat = new THREE.MeshStandardMaterial({
      map: marqueeTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const marqueeMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), marqueeMat);
    marqueeMesh.position.set(0, 5.0, 0.42);
    this.vaultDoorGroup.add(marqueeMesh);

    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x34d399, emissiveIntensity: 1.8 })
    );
    exitSign.position.set(0, 4.15, 0.35);
    this.vaultDoorGroup.add(exitSign);

    this.scene.add(this.vaultDoorGroup);

    // Door physical collider
    this.doorCollider = this.addBoxCollider(new THREE.Vector3(15.5, 0, -2.4), new THREE.Vector3(17.5, 5.0, 2.4));

    // Interactive Door Object
    this.interactiveObjects.push({
      id: 'search_maze_exit_door',
      type: 'exit_door',
      name: 'Level 3 Exit Gateway',
      prompt: 'Level 3 Exit Gateway (Locked — complete BFS decisions to unlock)',
      position: [16.5, 2.0, 0],
      hitRadius: 3.2,
      mesh: this.vaultDoorGroup,
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
      mazeNodesMap,
      shortestPathBeams,
    };
  }

  // =========================================================================
  // SEARCH MAZE — LEVEL 4: BFS DEAD-END TRAP (BRIGHT CLEANROOM LAB)
  // =========================================================================
  public createLevel4CleanroomFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Pristine high-tech laboratory white tile base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // 4 Polished Ceramic Porcelain Slabs
    const tileSize = 256;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const x = c * tileSize;
        const y = r * tileSize;

        // Tile body - subtle luminous gradient
        const grad = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#f8fafc');
        grad.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

        // High-contrast clean silver-slate bevel border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

        // Subtle high-tech geometric diamond grid in crisp cyan/amber
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.lineWidth = 1;
        for (let i = 24; i < tileSize - 24; i += 20) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + 24);
          ctx.lineTo(x + tileSize - 24, y + tileSize - i);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x + 24, y + i);
          ctx.lineTo(x + tileSize - i, y + tileSize - 24);
          ctx.stroke();
        }

        // Clean silver corner rivet anchors
        ctx.fillStyle = '#94a3b8';
        [[x + 14, y + 14], [x + tileSize - 14, y + 14], [x + 14, y + tileSize - 14], [x + tileSize - 14, y + tileSize - 14]].forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    // Glowing Amber & Gold Data Busbars along tile seams
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;

    // Horizontal seam
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();

    // Vertical seam
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Central high-tech power node hub
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(256, 256, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 256, 4, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  public createLevel4CleanroomWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean white enameled composite panel background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Wall panel gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 512, 0);
    wallGrad.addColorStop(0, '#ffffff');
    wallGrad.addColorStop(0.5, '#f1f5f9');
    wallGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(8, 50, 496, 412);

    // Hazard safety diagonal stripes across top trim (y = 0 to 45)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 45);
    ctx.fillStyle = '#f59e0b';
    for (let x = -60; x < 580; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 45);
      ctx.lineTo(x + 18, 45);
      ctx.lineTo(x + 36, 0);
      ctx.lineTo(x + 18, 0);
      ctx.closePath();
      ctx.fill();
    }

    // Hazard safety diagonal stripes across bottom baseboard (y = 467 to 512)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 467, 512, 45);
    ctx.fillStyle = '#f59e0b';
    for (let x = -60; x < 580; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 512);
      ctx.lineTo(x + 18, 512);
      ctx.lineTo(x + 36, 467);
      ctx.lineTo(x + 18, 467);
      ctx.closePath();
      ctx.fill();
    }

    // High-visibility amber and orange power conduit line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(8, 120);
    ctx.lineTo(504, 120);
    ctx.moveTo(8, 380);
    ctx.lineTo(504, 380);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Stenciled Cleanroom Laboratory Labeling (Dark Charcoal on Bright White)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('SECTOR 04 // CLEANROOM LAB', 24, 90);

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('⚠ HIGH HAZARD: MULTIPLE CLOSED CUL-DE-SACS', 24, 170);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('FACILITY: HIGH-ILLUMINATION CLEANROOM', 24, 205);
    ctx.fillText('PROTOCOL: STRICT FIFO QUEUE ORDER (BFS)', 24, 230);
    ctx.fillText('SUB-LEVEL 04 - GRID MATRIX ACTIVE', 24, 255);

    // Hazard Warning Triangle Icon
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(430, 270);
    ctx.lineTo(470, 340);
    ctx.lineTo(390, 340);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', 430, 332);
    ctx.textAlign = 'left';

    // Rivet Seam Pattern
    ctx.fillStyle = '#94a3b8';
    for (let y = 65; y < 450; y += 35) {
      ctx.beginPath();
      ctx.arc(18, y, 3, 0, Math.PI * 2);
      ctx.arc(494, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  public createTerminalTexture4(
    stageNumber: number,
    visited: string[],
    queue: string[],
    question: string
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark industrial volcanic background
    ctx.fillStyle = '#070913';
    ctx.fillRect(0, 0, 512, 512);

    // Border with molten crimson & amber
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 496);

    // Header bar
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(8, 8, 496, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ BFS DEAD-END TRAP — SECTOR 04', 256, 44);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(stageNumber > 6 ? 'STATUS: TARGET UNLOCKED' : `DECISION STAGE ${stageNumber} / 6`, 24, 96);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('VISITED PATH:', 24, 128);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(visited.join(' → '), 24, 154);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('BFS QUEUE (FIFO):', 24, 192);

    let qX = 24;
    queue.slice(0, 5).forEach((item, idx) => {
      const isDeadEnd = item.startsWith('X');
      ctx.fillStyle = idx === 0 ? '#78350f' : (isDeadEnd ? '#450a0a' : '#1e1b4b');
      ctx.strokeStyle = idx === 0 ? '#f59e0b' : (isDeadEnd ? '#ef4444' : '#f97316');
      ctx.lineWidth = idx === 0 ? 3.5 : 2.0;
      ctx.fillRect(qX, 208, 76, 48);
      ctx.strokeRect(qX, 208, 76, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.replace('TARGET', 'TGT'), qX + 38, 235);
      if (idx === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('★ FRONT', qX + 38, 248);
      } else if (isDeadEnd) {
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('⚠ DEAD', qX + 38, 248);
      }
      qX += 84;
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ACTIVE BFS DILEMMA:', 24, 286);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    const words = question.split(' ');
    let line = '';
    let y = 312;
    for (const w of words) {
      if ((line + w).length > 32) {
        ctx.fillText(line, 24, y);
        line = w + ' ';
        y += 24;
      } else {
        line += w + ' ';
      }
    }
    ctx.fillText(line, 24, y);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('⚠ DANGER: DO NOT JUMP TO DEEP NODES', 24, 425);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('RULE: FRONT OF QUEUE HAS ABSOLUTE PRIORITY', 24, 452);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('▶ PHYSICALLY STEP INTO YOUR CHOSEN CIRCLE', 24, 480);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private buildSearchMazeLevel4(): EscapeRoomEnvironment {
    const W = 44;
    const D = 34;
    const H = 8.0;

    // 1. Boundary Colliders (East wall split around doorway at z = [-2.4, 2.4])
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2)); // West
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1)); // South
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2)); // North
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, -2.4)); // East North
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, 2.4), new THREE.Vector3(W / 2 + 1, H, D / 2)); // East South

    // 2. Custom Level 4 Cleanroom Porcelain Floor
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorTex = this.createLevel4CleanroomFloorTexture();
    floorTex.repeat.set(11, 8.5);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.25,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Bright High-Tech Cleanroom Ceiling with Silver Trusses & Daylight LED Troffers
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    // Industrial Ceiling Aluminium Cross-Trusses
    const trussMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.5, roughness: 0.2 });
    [-15, -7, 1, 9, 17].forEach((tx) => {
      const truss = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, D), trussMat);
      truss.position.set(tx, H - 0.35, 0);
      this.scene.add(truss);
    });

    // Luminous Daylight LED Panel Troffers (Bright pure white illumination)
    const ceilingTrofferMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const daylightPanelMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-16, -8, 0, 8, 16].forEach((cx, idx) => {
      const trofferZ = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.08, 28),
        idx % 2 === 0 ? ceilingTrofferMat : daylightPanelMat
      );
      trofferZ.position.set(cx, H - 0.04, 0);
      this.scene.add(trofferZ);
    });

    // Custom Level 4 Cleanroom Wall Panels
    const wallTex = this.createLevel4CleanroomWallTexture();
    wallTex.repeat.set(11, 2.2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.25, metalness: 0.15 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall (Split into North and South segments)
    const doorHalfWidth = 2.4;
    const eastSegLen = D / 2 - doorHalfWidth; // 17 - 2.4 = 14.6
    const eastNorthWall = new THREE.Mesh(new THREE.PlaneGeometry(eastSegLen, H), wallMat);
    eastNorthWall.position.set(W / 2, H / 2, -D / 2 + eastSegLen / 2);
    eastNorthWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastNorthWall);

    const eastSouthWall = new THREE.Mesh(new THREE.PlaneGeometry(eastSegLen, H), wallMat);
    eastSouthWall.position.set(W / 2, H / 2, D / 2 - eastSegLen / 2);
    eastSouthWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastSouthWall);

    // Lintel above East Doorway
    const eastLintelH = H - 5.0;
    const eastLintel = new THREE.Mesh(new THREE.PlaneGeometry(doorHalfWidth * 2, eastLintelH), wallMat);
    eastLintel.position.set(W / 2, 5.0 + eastLintelH / 2, 0);
    eastLintel.rotation.y = -Math.PI / 2;
    this.scene.add(eastLintel);

    // Exit Corridor beyond East door (x = 22 to 29)
    const corridorFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.8),
      new THREE.MeshStandardMaterial({
        color: 0x059669,
        emissive: 0x10b981,
        emissiveIntensity: 0.5,
        roughness: 0.3,
      })
    );
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.set(24.5, 0.02, 0);
    this.scene.add(corridorFloor);

    const corridorNorthWall = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5.0),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
    );
    corridorNorthWall.position.set(24.5, 2.5, -2.4);
    this.scene.add(corridorNorthWall);

    const corridorSouthWall = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5.0),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
    );
    corridorSouthWall.position.set(24.5, 2.5, 2.4);
    corridorSouthWall.rotation.y = Math.PI;
    this.scene.add(corridorSouthWall);

    const exitPortalLight = new THREE.PointLight(0x10b981, 3.2, 16);
    exitPortalLight.position.set(23.5, 3.2, 0);
    this.scene.add(exitPortalLight);

    // High-Illumination Cleanroom Daylight Lighting (Crisp, bright, zero gloom)
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.8);
    this.scene.add(ambientLight);

    const mainDaylight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainDaylight.position.set(5, H + 4, 5);
    this.scene.add(mainDaylight);

    const mainLight = new THREE.PointLight(0xffffff, 3.6, 48);
    mainLight.position.set(0, H - 1.0, 0);
    this.scene.add(mainLight);

    const westFlood = new THREE.PointLight(0xfff7ed, 3.0, 36);
    westFlood.position.set(-13, H - 1.2, 0);
    this.scene.add(westFlood);

    const eastFlood = new THREE.PointLight(0xfff7ed, 3.0, 36);
    eastFlood.position.set(13, H - 1.2, 0);
    this.scene.add(eastFlood);

    const northFlood = new THREE.PointLight(0xffffff, 2.4, 30);
    northFlood.position.set(0, H - 1.2, -10);
    this.scene.add(northFlood);

    const southFlood = new THREE.PointLight(0xffffff, 2.4, 30);
    southFlood.position.set(0, H - 1.2, 10);
    this.scene.add(southFlood);

    // -------------------------------------------------------------------------
    // 3. INTERNAL MAZE PARTITION WALLS & DEAD-END CHAMBERS
    // -------------------------------------------------------------------------
    const mazeWallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.15,
      roughness: 0.25,
    });
    const neonAmberStripeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const hazardStripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const createMazePartition = (x: number, z: number, w: number, d: number, isHazard: boolean = false) => {
      const partH = 4.4;
      const part = new THREE.Mesh(new THREE.BoxGeometry(w, partH, d), mazeWallMat);
      part.position.set(x, partH / 2, z);
      part.castShadow = true;
      part.receiveShadow = true;
      this.scene.add(part);

      // Top glowing hazard strip
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(w > d ? w : 0.24, 0.14, d > w ? d : 0.24),
        isHazard ? hazardStripeMat : neonAmberStripeMat
      );
      stripe.position.set(x, partH + 0.07, z);
      this.scene.add(stripe);

      this.addBoxCollider(
        new THREE.Vector3(x - w / 2 - 0.25, 0, z - d / 2 - 0.25),
        new THREE.Vector3(x + w / 2 + 0.25, partH, z + d / 2 + 0.25)
      );
    };

    // A. Partition between Branch A (North) and Branch B (North-Center)
    createMazePartition(-10.5, -4.8, 7.0, 0.7);

    // B. Partition between Branch C (South-Center) and Branch D (South)
    createMazePartition(-10.5, 4.8, 7.0, 0.7);

    // C. Central spine divider separating North & South branches
    createMazePartition(-6.5, 0, 7.0, 0.7);

    // D. DEAD END 1 (X1) at (-6, -10): Barrier walls forming a closed cul-de-sac
    createMazePartition(-6, -13.0, 6.0, 0.7, true); // North back wall of X1
    createMazePartition(-2.8, -10.0, 0.7, 5.5, true); // East dead-end wall of X1

    // E. DEAD END 2 (X2) at (-6, -1.5): Barrier blocking East passage
    createMazePartition(-3.2, -1.5, 0.7, 2.2, true);

    // F. DEAD END 3 (X3) at (-6, 8): Barrier walls forming a closed cul-de-sac
    createMazePartition(-6, 11.2, 6.0, 0.7, true); // South back wall of X3
    createMazePartition(-2.8, 8.0, 0.7, 5.5, true); // East dead-end wall of X3

    // G. Forward branch barriers (creates corridors between F, G, K, L and Target)
    createMazePartition(2.5, -5.5, 0.7, 4.5);
    createMazePartition(2.5, 5.5, 0.7, 4.5);
    createMazePartition(8.5, 0, 0.7, 8.0);

    // Flashing Dead-End Alarm Strobes in Cul-de-Sacs
    const deadEndPositions = [
      { id: 'X1', x: -6, z: -10 },
      { id: 'X2', x: -6, z: -1.5 },
      { id: 'X3', x: -6, z: 8 },
    ];
    deadEndPositions.forEach((de) => {
      // Alarm siren cage housing
      const sirenHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 })
      );
      sirenHousing.position.set(de.x, 3.8, de.z);
      this.scene.add(sirenHousing);

      // Warning laser bar across dead-end threshold
      const barrierBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 1.8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      barrierBar.position.set(de.x + 0.8, 1.2, de.z);
      this.scene.add(barrierBar);
    });

    // 4 Structural Columns with high-tech cleanroom styling and hazard striping
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.45, roughness: 0.2 });
    [
      [-16, -12],
      [-16, 12],
      [14, -12],
      [14, 12],
    ].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.5, H, 1.5), pillarMat);
      col.position.set(px, H / 2, pz);
      this.scene.add(col);
      this.addBoxCollider(new THREE.Vector3(px - 0.85, 0, pz - 0.85), new THREE.Vector3(px + 0.85, H, pz + 0.85));

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, H * 0.9, 1.54), neonAmberStripeMat);
      stripe.position.set(px, H / 2, pz);
      this.scene.add(stripe);
    });

    // -------------------------------------------------------------------------
    // 4. GRAPH NODES MAP & INTERACTIVE CIRCLES
    // -------------------------------------------------------------------------
    const mazeNodesMap = new Map<string, Maze3DNodeRef>();

    const createNodeSprite = (label: string, colorHex: string = '#2563eb'): THREE.Sprite => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 112, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(label.length > 6 ? 2.8 : 1.5, 0.75, 1.0);
      return sprite;
    };

    // A. GREEN START CIRCLE at (-16, 0)
    const startTile = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 0.08, 32),
      new THREE.MeshStandardMaterial({
        color: 0xd1fae5,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0x10b981,
        emissiveIntensity: 0.5,
      })
    );
    startTile.position.set(-16, 0.04, 0);
    this.scene.add(startTile);

    const startRing = new THREE.Mesh(
      new THREE.RingGeometry(1.3, 1.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide })
    );
    startRing.rotation.x = -Math.PI / 2;
    startRing.position.set(-16, 0.09, 0);
    this.scene.add(startRing);

    const startSprite = createNodeSprite('START', '#059669');
    startSprite.position.set(-16, 2.3, 0);
    this.scene.add(startSprite);
    this.animatedMeshes.push(startSprite);

    const startLight = new THREE.PointLight(0x10b981, 2.4, 9);
    startLight.position.set(-16, 2.0, 0);
    this.scene.add(startLight);

    mazeNodesMap.set('S', {
      id: 'S',
      tileMesh: startTile,
      ringMesh: startRing,
      markerMesh: startTile,
      haloLight: startLight,
    });

    // B. BFS ANALYSIS TERMINAL at (-16, 0, -3.5)
    const termGroup = new THREE.Group();
    termGroup.position.set(-16, 0, -3.5);

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.25 })
    );
    pedestal.position.y = 0.6;
    termGroup.add(pedestal);

    const termTex = this.createTerminalTexture4(
      1,
      ['START'],
      ['A', 'B', 'C', 'D'],
      'START connects to 4 branches (A, B, C, D). Which node does BFS explore FIRST?'
    );
    const screenMat = new THREE.MeshStandardMaterial({
      map: termTex,
      roughness: 0.2,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.35,
    });
    const termScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), screenMat);
    termScreen.name = 'searchMazeTerminalScreen4';
    termScreen.position.set(0, 1.45, 0.35);
    termScreen.rotation.x = -0.25;
    termGroup.add(termScreen);

    const termGlow = new THREE.PointLight(0x0284c7, 2.5, 7);
    termGlow.position.set(0, 1.6, 0.2);
    termGroup.add(termGlow);

    this.scene.add(termGroup);
    this.addBoxCollider(new THREE.Vector3(-17.0, 0, -4.1), new THREE.Vector3(-15.0, 2.0, -2.9));

    this.interactiveObjects.push({
      id: 'search_maze_terminal_4',
      type: 'security_console',
      name: 'BFS DEAD-END TERMINAL',
      prompt: '[E] INSPECT BFS SEARCH QUEUE',
      position: [-16, 1.2, -3.5],
      hitRadius: 2.8,
      mesh: termGroup,
    });

    // C. FLOOR GRAPH NODES (14 nodes)
    const nodeConfigs: { id: string; label: string; x: number; z: number; isDeadEnd?: boolean; isTarget?: boolean }[] = [
      { id: 'A', label: 'A', x: -11, z: -7 },
      { id: 'B', label: 'B', x: -11, z: -2.5 },
      { id: 'C', label: 'C', x: -11, z: 2.5 },
      { id: 'D', label: 'D', x: -11, z: 7 },
      { id: 'X1', label: 'X1', x: -6, z: -10, isDeadEnd: true },
      { id: 'E', label: 'E', x: -5.5, z: -5.5 },
      { id: 'X2', label: 'X2', x: -6, z: -1.5, isDeadEnd: true },
      { id: 'F', label: 'F', x: -0.5, z: -2.5 },
      { id: 'G', label: 'G', x: -0.5, z: 2.5 },
      { id: 'X3', label: 'X3', x: -6, z: 8, isDeadEnd: true },
      { id: 'H', label: 'H', x: -5.5, z: 5.5 },
      { id: 'K', label: 'K', x: 5.5, z: -2.5 },
      { id: 'L', label: 'L', x: 5.5, z: 2.5 },
      { id: 'TARGET', label: 'TARGET', x: 11.5, z: -5.5, isTarget: true },
    ];

    nodeConfigs.forEach((cfg) => {
      const isTarget = !!cfg.isTarget;
      const isDeadEnd = !!cfg.isDeadEnd;
      const baseColor = isTarget ? 0xfee2e2 : (isDeadEnd ? 0xfef3c7 : 0xe0e7ff);
      const ringColor = isTarget ? 0xdc2626 : (isDeadEnd ? 0xd97706 : 0x2563eb);
      const spriteColorHex = isTarget ? '#dc2626' : (isDeadEnd ? '#d97706' : '#2563eb');

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.08, 32),
        new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.35,
          roughness: 0.25,
          emissive: ringColor,
          emissiveIntensity: 0.45,
        })
      );
      pad.position.set(cfg.x, 0.04, cfg.z);
      this.scene.add(pad);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.45, 32),
        new THREE.MeshBasicMaterial({ color: ringColor, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cfg.x, 0.09, cfg.z);
      this.scene.add(ring);

      // Dead End Hazard Decal / Overhead Tag
      if (isDeadEnd) {
        const hazardTag = createNodeSprite('DEAD END', '#dc2626');
        hazardTag.position.set(cfg.x, 3.1, cfg.z);
        hazardTag.scale.set(2.2, 0.6, 1.0);
        this.scene.add(hazardTag);
        this.animatedMeshes.push(hazardTag);

        const beacon = new THREE.PointLight(0xef4444, 2.0, 7.0);
        beacon.position.set(cfg.x, 2.5, cfg.z);
        this.scene.add(beacon);
      }

      const sprite = createNodeSprite(cfg.label, spriteColorHex);
      sprite.position.set(cfg.x, 2.3, cfg.z);
      this.scene.add(sprite);
      this.animatedMeshes.push(sprite);

      const haloLight = new THREE.PointLight(ringColor, isTarget ? 2.4 : 1.4, 7.0);
      haloLight.position.set(cfg.x, 1.8, cfg.z);
      this.scene.add(haloLight);

      mazeNodesMap.set(cfg.id, {
        id: cfg.id,
        tileMesh: pad,
        ringMesh: ring,
        markerMesh: pad,
        haloLight: haloLight,
      });
    });

    // -------------------------------------------------------------------------
    // 5. GRAPH EDGES / CONDUITS & SHORTEST PATH HIGHLIGHT
    // -------------------------------------------------------------------------
    const createConduit = (x1: number, z1: number, x2: number, z2: number, isDeadEnd: boolean = false) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const conduit = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.03, len),
        new THREE.MeshStandardMaterial({
          color: isDeadEnd ? 0xfecaca : 0xdbeafe,
          emissive: isDeadEnd ? 0xdc2626 : 0x2563eb,
          emissiveIntensity: isDeadEnd ? 0.7 : 0.5,
          roughness: 0.3,
        })
      );
      conduit.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      conduit.rotation.y = angle;
      this.scene.add(conduit);
    };

    // Connections from START
    createConduit(-16, 0, -11, -7); // S -> A
    createConduit(-16, 0, -11, -2.5); // S -> B
    createConduit(-16, 0, -11, 2.5); // S -> C
    createConduit(-16, 0, -11, 7); // S -> D

    // Branch A
    createConduit(-11, -7, -5.5, -5.5); // A -> E
    createConduit(-11, -7, -6, -10, true); // A -> X1 (Dead End 1)

    // Branch B
    createConduit(-11, -2.5, -0.5, -2.5); // B -> F
    createConduit(-11, -2.5, -6, -1.5, true); // B -> X2 (Dead End 2)

    // Branch C
    createConduit(-11, 2.5, -0.5, 2.5); // C -> G
    createConduit(-11, 2.5, -6, 8, true); // C -> X3 (Dead End 3)

    // Branch D
    createConduit(-11, 7, -5.5, 5.5); // D -> H

    // Forward to TARGET & deeper branches
    createConduit(-5.5, -5.5, 11.5, -5.5); // E -> TARGET
    createConduit(-0.5, -2.5, 5.5, -2.5); // F -> K
    createConduit(-0.5, 2.5, 5.5, 2.5); // G -> L

    // Shortest Path High-Intensity Beams: S -> A -> E -> TARGET -> East Exit Doorway
    const shortestPathBeams = new THREE.Group();
    const createBeamSegment = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.06, len),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x00f0ff,
          emissiveIntensity: 3.2,
          roughness: 0.1,
        })
      );
      beam.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2);
      beam.rotation.y = angle;
      shortestPathBeams.add(beam);
    };

    createBeamSegment(-16, 0, -11, -7);
    createBeamSegment(-11, -7, -5.5, -5.5);
    createBeamSegment(-5.5, -5.5, 11.5, -5.5);
    createBeamSegment(11.5, -5.5, 20.0, 0); // Leads to East Exit Doorway at x = 20.0, z = 0
    shortestPathBeams.visible = false;
    this.scene.add(shortestPathBeams);

    // -------------------------------------------------------------------------
    // 6. FUTURISTIC EAST EXIT GATEWAY
    // -------------------------------------------------------------------------
    this.vaultDoorGroup = new THREE.Group();
    this.vaultDoorGroup.position.set(20.0, 0, 0);
    this.vaultDoorGroup.rotation.y = -Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x090b1c,
      metalness: 0.9,
      roughness: 0.2,
    });

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), frameMat);
    leftPillar.position.set(-2.2, 2.5, 0);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), frameMat);
    rightPillar.position.set(2.2, 2.5, 0);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 0.8), frameMat);
    topLintel.position.set(0, 5.1, 0);
    this.vaultDoorGroup.add(leftPillar, rightPillar, topLintel);

    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x140b2b,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x9333ea,
      emissiveIntensity: 0.35,
    });
    const doorLeafLeft = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.2, 0.35), doorLeafMat);
    doorLeafLeft.name = 'vaultDoorLeft';
    doorLeafLeft.position.set(-1.0, 2.1, 0);
    const doorLeafRight = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.2, 0.35), doorLeafMat);
    doorLeafRight.name = 'vaultDoorRight';
    doorLeafRight.position.set(1.0, 2.1, 0);
    this.vaultDoorGroup.add(doorLeafLeft, doorLeafRight);

    // Marquee Banner Display for Level 4
    const marqueeTex = this.createExitDoorMarqueeTexture('▲ LEVEL 4 EXIT GATEWAY ▲', 'DEAD-END SEARCH MASTERED');
    const marqueeMat = new THREE.MeshStandardMaterial({
      map: marqueeTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const marqueeMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), marqueeMat);
    marqueeMesh.position.set(0, 5.0, 0.42);
    this.vaultDoorGroup.add(marqueeMesh);

    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x34d399, emissiveIntensity: 1.8 })
    );
    exitSign.position.set(0, 4.15, 0.35);
    this.vaultDoorGroup.add(exitSign);

    this.scene.add(this.vaultDoorGroup);

    // Door physical collider
    this.doorCollider = this.addBoxCollider(new THREE.Vector3(19.0, 0, -2.4), new THREE.Vector3(21.0, 5.0, 2.4));

    // Interactive Door Object
    this.interactiveObjects.push({
      id: 'search_maze_exit_door',
      type: 'exit_door',
      name: 'Level 4 Exit Gateway',
      prompt: 'Level 4 Exit Gateway (Locked — complete BFS decisions to unlock)',
      position: [20.0, 2.0, 0],
      hitRadius: 3.2,
      mesh: this.vaultDoorGroup,
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
      mazeNodesMap,
      shortestPathBeams,
    };
  }

  // ==========================================================================
  // LEVEL 5: QUANTUM GRAPH TEST FACILITY (SHORTEST PATH CHALLENGE)
  // ==========================================================================
  public createLevel5QuantumFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Pristine high-tech laboratory floor (bright off-white / light slate)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle 64x64 porcelain cleanroom grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Glowing cyan quantum circuit trace lines
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(192, 256);
    ctx.lineTo(256, 192);
    ctx.lineTo(512, 192);
    ctx.moveTo(0, 384);
    ctx.lineTo(256, 384);
    ctx.lineTo(384, 512);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Quantum node intersection pads on floor
    ctx.fillStyle = '#0ea5e9';
    [
      [192, 256],
      [256, 192],
      [256, 384],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  public createLevel5QuantumWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ultra-clean sci-fi laboratory wall panel
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 512);

    // Beveled frame
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 504);

    // Dual cyan power rails
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(8, 100);
    ctx.lineTo(504, 100);
    ctx.moveTo(8, 412);
    ctx.lineTo(504, 412);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Stenciled facility typography
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('FACILITY: QUANTUM GRAPH FACILITY', 24, 75);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SECTOR 05 // SHORTEST PATH CHALLENGE', 24, 150);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('ALGORITHM: BREADTH FIRST SEARCH (BFS)', 24, 185);
    ctx.fillText('METRIC: MINIMUM GRAPH DEPTH (EDGES FROM S)', 24, 215);
    ctx.fillText('CRITICAL: EUCLIDEAN DISTANCE IS DECEPTIVE', 24, 245);
    ctx.fillText('PROTOCOL: EXPLORE ALL DEPTH d BEFORE d+1', 24, 275);

    // High-tech quantum circuit emblem
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(430, 310, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BFS', 430, 305);
    ctx.font = 'bold 12px monospace';
    ctx.fillText('DEPTH', 430, 322);
    ctx.textAlign = 'left';

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  public createTerminalTexture5(
    stageNumber: number,
    visited: string[],
    queue: string[],
    question: string,
    depth: number = stageNumber - 1
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean quantum dark terminal screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing cyan cyber border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 496);

    // Header bar
    ctx.fillStyle = '#082f49';
    ctx.fillRect(8, 8, 496, 56);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ BFS QUANTUM ANALYSIS TERMINAL', 256, 44);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(stageNumber > 5 ? 'STATUS: TARGET REACHED' : `DECISION STAGE ${stageNumber} / 5  |  DEPTH: ${depth}`, 24, 94);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('VISITED NODES:', 24, 124);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(visited.join(' → '), 24, 148);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('BFS QUEUE (FIFO ORDER):', 24, 184);

    // Queue boxes with FRONT indicator
    let qX = 24;
    queue.slice(0, 5).forEach((item, idx) => {
      const isFront = idx === 0;
      ctx.fillStyle = isFront ? '#042f2e' : '#0f172a';
      ctx.strokeStyle = isFront ? '#14b8a6' : '#0284c7';
      ctx.lineWidth = isFront ? 3.5 : 2.0;
      ctx.fillRect(qX, 198, 78, 48);
      ctx.strokeRect(qX, 198, 78, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.replace('TARGET', 'TGT'), qX + 39, 226);
      if (isFront) {
        ctx.fillStyle = '#5eead4';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('★ FRONT', qX + 39, 240);
      }
      qX += 86;
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('ACTIVE BFS QUESTION:', 24, 276);

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';
    const words = question.split(' ');
    let line = '';
    let y = 300;
    for (const w of words) {
      if ((line + w).length > 34) {
        ctx.fillText(line, 24, y);
        line = w + ' ';
        y += 22;
      } else {
        line += w + ' ';
      }
    }
    ctx.fillText(line, 24, y);

    // BFS Rules on Terminal
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('• FIFO: Nodes at depth d are explored before depth d+1', 24, 420);
    ctx.fillText('• SHORTEST PATH = Minimum number of edges from START', 24, 444);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('▶ STEP INTO YOUR CHOSEN FLOOR CIRCLE', 24, 478);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private buildSearchMazeLevel5(): EscapeRoomEnvironment {
    const W = 48;
    const D = 34;
    const H = 8.0;

    // 1. Boundary Colliders (East wall split around doorway at z = [-2.5, 2.5])
    this.addBoxCollider(new THREE.Vector3(-W / 2 - 1, 0, -D / 2), new THREE.Vector3(-W / 2, H, D / 2)); // West
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, D / 2), new THREE.Vector3(W / 2, H, D / 2 + 1)); // South
    this.addBoxCollider(new THREE.Vector3(-W / 2, 0, -D / 2 - 1), new THREE.Vector3(W / 2, H, -D / 2)); // North
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, -D / 2), new THREE.Vector3(W / 2 + 1, H, -2.5)); // East North
    this.addBoxCollider(new THREE.Vector3(W / 2, 0, 2.5), new THREE.Vector3(W / 2 + 1, H, D / 2)); // East South

    // 2. Custom Quantum Cleanroom Floor
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorTex = this.createLevel5QuantumFloorTexture();
    floorTex.repeat.set(12, 8.5);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.2,
      metalness: 0.18,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Clean White Laboratory Ceiling with Daylight Troffers
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    // Aluminium Ceiling Cross-Trusses
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.2 });
    [-18, -10, -2, 6, 14, 20].forEach((tx) => {
      const truss = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, D), trussMat);
      truss.position.set(tx, H - 0.35, 0);
      this.scene.add(truss);
    });

    // Luminous Daylight LED Panel Troffers (Bright pure white illumination)
    const trofferMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const daylightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    [-16, -8, 0, 8, 16].forEach((cx, idx) => {
      const troffer = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.08, 28),
        idx % 2 === 0 ? trofferMat : daylightMat
      );
      troffer.position.set(cx, H - 0.04, 0);
      this.scene.add(troffer);
    });

    // Custom Quantum Wall Panels
    const wallTex = this.createLevel5QuantumWallTexture();
    wallTex.repeat.set(12, 2.2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.25, metalness: 0.15 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    northWall.position.set(0, H / 2, -D / 2);
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    southWall.position.set(0, H / 2, D / 2);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.scene.add(westWall);

    // East Wall (Split around door)
    const doorHalfW = 2.5;
    const eastSegLen = D / 2 - doorHalfW; // 17 - 2.5 = 14.5
    const eastNorthWall = new THREE.Mesh(new THREE.PlaneGeometry(eastSegLen, H), wallMat);
    eastNorthWall.position.set(W / 2, H / 2, -D / 2 + eastSegLen / 2);
    eastNorthWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastNorthWall);

    const eastSouthWall = new THREE.Mesh(new THREE.PlaneGeometry(eastSegLen, H), wallMat);
    eastSouthWall.position.set(W / 2, H / 2, D / 2 - eastSegLen / 2);
    eastSouthWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastSouthWall);

    const eastLintelH = H - 5.0;
    const eastLintel = new THREE.Mesh(new THREE.PlaneGeometry(doorHalfW * 2, eastLintelH), wallMat);
    eastLintel.position.set(W / 2, 5.0 + eastLintelH / 2, 0);
    eastLintel.rotation.y = -Math.PI / 2;
    this.scene.add(eastLintel);

    // Exit Corridor beyond East door
    const corridorFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5.0),
      new THREE.MeshStandardMaterial({
        color: 0x059669,
        emissive: 0x10b981,
        emissiveIntensity: 0.5,
        roughness: 0.3,
      })
    );
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.set(W / 2 + 3.0, 0.02, 0);
    this.scene.add(corridorFloor);

    // Lighting (Crisp, high illumination - NO dark rooms!)
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.8);
    this.scene.add(ambientLight);

    const mainDaylight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainDaylight.position.set(5, H + 4, 5);
    this.scene.add(mainDaylight);

    const mainLight = new THREE.PointLight(0x0284c7, 3.5, 52);
    mainLight.position.set(0, H - 1.0, 0);
    this.scene.add(mainLight);

    const westFlood = new THREE.PointLight(0xf0fdf4, 3.0, 40);
    westFlood.position.set(-16, H - 1.2, 0);
    this.scene.add(westFlood);

    const eastFlood = new THREE.PointLight(0xf0fdf4, 3.0, 40);
    eastFlood.position.set(16, H - 1.2, 0);
    this.scene.add(eastFlood);

    const northFlood = new THREE.PointLight(0xffffff, 2.5, 36);
    northFlood.position.set(0, H - 1.2, -10);
    this.scene.add(northFlood);

    const southFlood = new THREE.PointLight(0xffffff, 2.5, 36);
    southFlood.position.set(0, H - 1.2, 10);
    this.scene.add(southFlood);

    // -------------------------------------------------------------------------
    // 3. REAL 19x13 3D MAZE CORRIDOR LABYRINTH & WALLS
    // -------------------------------------------------------------------------
    const maze5FloorTiles = new Map<string, THREE.Mesh>();
    const mazeNodesMap = new Map<string, Maze3DNodeRef>();
    const shortestPathBeams = new THREE.Group();

    const mazeWallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.25,
    });
    const neonCyanStripeMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.4,
      roughness: 0.1,
    });
    const wallBaseMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.8,
      roughness: 0.2,
    });

    const createNodeSprite = (label: string, colorHex: string = '#0284c7'): THREE.Sprite => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 112, 22);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(label.length > 7 ? 3.0 : 1.8, 0.8, 1.0);
      return sprite;
    };

    // Construct 19x13 corridor grid (1.35m tactical partition height so camera has 100% clear view)
    const wallHeight = 1.35;
    for (let r = 0; r < LEVEL5_MAZE_GRID.length; r++) {
      for (let c = 0; c < LEVEL5_MAZE_GRID[r].length; c++) {
        const { x, z } = grid5ToWorld(c, r);
        const isWall = LEVEL5_MAZE_GRID[r][c] === 1;

        if (isWall) {
          // Keep East Exit portal corridor clear at (18, 6)
          if (c === LEVEL5_EXIT_CELL[0] && r === LEVEL5_EXIT_CELL[1]) {
            continue;
          }

          // 3D Solid Wall Block
          const wallBlock = new THREE.Mesh(new THREE.BoxGeometry(2.06, wallHeight, 2.06), mazeWallMat);
          wallBlock.position.set(x, wallHeight / 2, z);
          wallBlock.castShadow = true;
          wallBlock.receiveShadow = true;
          this.scene.add(wallBlock);

          // Glowing top neon runner
          const topStripe = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.08, 2.08), neonCyanStripeMat);
          topStripe.position.set(x, wallHeight + 0.04, z);
          this.scene.add(topStripe);

          // Base trim
          const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.15, 2.08), wallBaseMat);
          baseTrim.position.set(x, 0.075, z);
          this.scene.add(baseTrim);

          // Add physical collision box so player cannot walk through maze walls
          this.addBoxCollider(
            new THREE.Vector3(x - 1.05, 0, z - 1.05),
            new THREE.Vector3(x + 1.05, 2.2, z + 1.05)
          );
        } else {
          // Open Corridor Floor Tile (interactive tile for BFS search lighting)
          const tileMat = new THREE.MeshStandardMaterial({
            color: 0x0a1022,
            metalness: 0.35,
            roughness: 0.25,
            emissive: 0x0284c7,
            emissiveIntensity: 0.04,
          });
          const tile = new THREE.Mesh(new THREE.PlaneGeometry(2.02, 2.02), tileMat);
          tile.rotation.x = -Math.PI / 2;
          tile.position.set(x, 0.02, z);
          tile.receiveShadow = true;
          this.scene.add(tile);

          maze5FloorTiles.set(`${c},${r}`, tile);

          // Corridor tile cyber seam outline
          const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true });
          const wireMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 2.04), wireMat);
          wireMesh.rotation.x = -Math.PI / 2;
          wireMesh.position.set(x, 0.022, z);
          this.scene.add(wireMesh);
        }
      }
    }

    // Overhead corridor pendant lights at key intersections
    const keyJunctions: [number, number][] = [
      [1, 5],
      [5, 5],
      [7, 6],
      [9, 6],
      [11, 7],
      [13, 9],
      [15, 9],
      [17, 7],
      [3, 3],
      [5, 1],
      [9, 1],
      [15, 1],
      [1, 9],
    ];

    keyJunctions.forEach(([jc, jr]) => {
      const { x, z } = grid5ToWorld(jc, jr);
      const lampHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
      );
      lampHousing.position.set(x, 4.2, z);
      this.scene.add(lampHousing);

      const lampLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.34, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      lampLens.rotation.x = Math.PI / 2;
      lampLens.position.set(x, 4.09, z);
      this.scene.add(lampLens);

      const lampLight = new THREE.PointLight(0x38bdf8, 1.8, 8.5);
      lampLight.position.set(x, 3.9, z);
      this.scene.add(lampLight);
    });

    // Dead-end warning signs on termination walls
    const deadEndCells: [number, number][] = [
      [3, 1],
      [1, 11],
      [14, 2],
      [8, 3],
    ];
    deadEndCells.forEach(([dc, dr]) => {
      const { x, z } = grid5ToWorld(dc, dr);
      const sign = createNodeSprite('⚠ DEAD END', '#f59e0b');
      sign.position.set(x, 2.0, z);
      sign.scale.set(2.0, 0.6, 1.0);
      this.scene.add(sign);
      this.animatedMeshes.push(sign);
    });

    // -------------------------------------------------------------------------
    // 4. GREEN START NODE at (1, 6)
    // -------------------------------------------------------------------------
    const startWorld = grid5ToWorld(LEVEL5_START_CELL[0], LEVEL5_START_CELL[1]);
    const startTile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.95, 0.08, 32),
      new THREE.MeshStandardMaterial({
        color: 0xd1fae5,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0x10b981,
        emissiveIntensity: 0.8,
      })
    );
    startTile.position.set(startWorld.x, 0.04, startWorld.z);
    this.scene.add(startTile);

    const startRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.9, 32),
      new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide })
    );
    startRing.rotation.x = -Math.PI / 2;
    startRing.position.set(startWorld.x, 0.09, startWorld.z);
    this.scene.add(startRing);

    const startSprite = createNodeSprite('[S] START', '#059669');
    startSprite.position.set(startWorld.x, 2.3, startWorld.z);
    this.scene.add(startSprite);
    this.animatedMeshes.push(startSprite);

    const startLight = new THREE.PointLight(0x10b981, 2.6, 9.0);
    startLight.position.set(startWorld.x, 1.8, startWorld.z);
    this.scene.add(startLight);

    mazeNodesMap.set('S', {
      id: 'S',
      tileMesh: startTile,
      ringMesh: startRing,
      markerMesh: startTile,
      haloLight: startLight,
    });

    // START BFS TERMINAL at corridor entrance
    const termGroup = new THREE.Group();
    termGroup.position.set(startWorld.x, 0, startWorld.z + 0.85);

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.2 })
    );
    pedestal.position.y = 0.6;
    termGroup.add(pedestal);

    const termTex = this.createTerminalTexture5(
      1,
      ['START [1,6]'],
      ['NORTH [1,5]'],
      'REAL SEARCH MAZE: Execute Breadth-First Search (BFS) to solve the shortest corridor path to the RED TARGET.',
      0
    );
    const screenMat = new THREE.MeshStandardMaterial({
      map: termTex,
      roughness: 0.2,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
    });
    const termScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), screenMat);
    termScreen.name = 'searchMazeTerminalScreen5';
    termScreen.position.set(0, 1.35, 0.18);
    termScreen.rotation.x = -0.25;
    termGroup.add(termScreen);

    const termGlow = new THREE.PointLight(0x06b6d4, 2.2, 6.0);
    termGlow.position.set(0, 1.5, 0.2);
    termGroup.add(termGlow);

    this.scene.add(termGroup);

    this.interactiveObjects.push({
      id: 'search_maze_terminal_5',
      type: 'security_console',
      name: 'BFS SEARCH TERMINAL',
      prompt: '[E] EXECUTE BREADTH-FIRST SEARCH (BFS) MAZE SOLVER',
      position: [startWorld.x, 1.2, startWorld.z + 0.85],
      hitRadius: 2.2,
      mesh: termGroup,
    });

    // -------------------------------------------------------------------------
    // 5. RED TARGET NODE at (16, 6)
    // -------------------------------------------------------------------------
    const targetWorld = grid5ToWorld(LEVEL5_TARGET_CELL[0], LEVEL5_TARGET_CELL[1]);
    const targetTile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.08, 32),
      new THREE.MeshStandardMaterial({
        color: 0xfee2e2,
        metalness: 0.35,
        roughness: 0.25,
        emissive: 0xdc2626,
        emissiveIntensity: 1.0,
      })
    );
    targetTile.position.set(targetWorld.x, 0.04, targetWorld.z);
    this.scene.add(targetTile);

    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.95, 32),
      new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide })
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(targetWorld.x, 0.09, targetWorld.z);
    this.scene.add(targetRing);

    // Floating rotating diamond crystal
    const diamondGeo = new THREE.OctahedronGeometry(0.55, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xef4444,
      emissiveIntensity: 2.4,
      metalness: 0.6,
      roughness: 0.1,
    });
    const targetDiamond = new THREE.Mesh(diamondGeo, diamondMat);
    targetDiamond.position.set(targetWorld.x, 1.4, targetWorld.z);
    this.scene.add(targetDiamond);
    this.animatedMeshes.push(targetDiamond);

    const targetSprite = createNodeSprite('RED TARGET [G]', '#dc2626');
    targetSprite.position.set(targetWorld.x, 2.4, targetWorld.z);
    this.scene.add(targetSprite);
    this.animatedMeshes.push(targetSprite);

    const targetHaloLight = new THREE.PointLight(0xef4444, 3.5, 9.0);
    targetHaloLight.position.set(targetWorld.x, 1.8, targetWorld.z);
    this.scene.add(targetHaloLight);

    mazeNodesMap.set('TARGET', {
      id: 'TARGET',
      tileMesh: targetTile,
      ringMesh: targetRing,
      markerMesh: targetDiamond,
      haloLight: targetHaloLight,
    });

    // -------------------------------------------------------------------------
    // 6. SHORTEST PATH RADIANT RUNWAY (Computed with executeGridBFS)
    // -------------------------------------------------------------------------
    const bfsSolution = executeGridBFS(LEVEL5_START_CELL, LEVEL5_TARGET_CELL, LEVEL5_MAZE_GRID);
    const fullShortestPath = [...bfsSolution.shortestPath, LEVEL5_EXIT_CELL];

    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x00f0ff,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    for (let i = 0; i < fullShortestPath.length - 1; i++) {
      const p1 = grid5ToWorld(fullShortestPath[i][0], fullShortestPath[i][1]);
      const p2 = grid5ToWorld(fullShortestPath[i + 1][0], fullShortestPath[i + 1][1]);
      const len = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, len), beamMat);
      beam.position.set((p1.x + p2.x) / 2, 0.055, (p1.z + p2.z) / 2);
      beam.rotation.y = angle;
      shortestPathBeams.add(beam);
    }
    shortestPathBeams.visible = false;
    this.scene.add(shortestPathBeams);

    // -------------------------------------------------------------------------
    // 7. EAST EXIT GATEWAY
    // -------------------------------------------------------------------------
    const exitWorld = grid5ToWorld(LEVEL5_EXIT_CELL[0], LEVEL5_EXIT_CELL[1]);
    this.vaultDoorGroup = new THREE.Group();
    this.vaultDoorGroup.position.set(exitWorld.x + 1.5, 0, exitWorld.z);
    this.vaultDoorGroup.rotation.y = -Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x090b1c,
      metalness: 0.9,
      roughness: 0.2,
    });

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), frameMat);
    leftPillar.position.set(-2.2, 2.5, 0);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 0.8), frameMat);
    rightPillar.position.set(2.2, 2.5, 0);
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 0.8), frameMat);
    topLintel.position.set(0, 5.1, 0);
    this.vaultDoorGroup.add(leftPillar, rightPillar, topLintel);

    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
    });
    const doorLeafLeft = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.2, 0.35), doorLeafMat);
    doorLeafLeft.name = 'vaultDoorLeft';
    doorLeafLeft.position.set(-1.0, 2.1, 0);
    const doorLeafRight = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.2, 0.35), doorLeafMat);
    doorLeafRight.name = 'vaultDoorRight';
    doorLeafRight.position.set(1.0, 2.1, 0);
    this.vaultDoorGroup.add(doorLeafLeft, doorLeafRight);

    // Marquee Banner Display for Level 5
    const marqueeTex = this.createExitDoorMarqueeTexture('▲ LEVEL 5 EXIT GATEWAY ▲', 'SHORTEST BFS PATH MASTERED');
    const marqueeMat = new THREE.MeshStandardMaterial({
      map: marqueeTex,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const marqueeMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), marqueeMat);
    marqueeMesh.position.set(0, 5.0, 0.42);
    this.vaultDoorGroup.add(marqueeMesh);

    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x34d399, emissiveIntensity: 1.8 })
    );
    exitSign.position.set(0, 4.15, 0.35);
    this.vaultDoorGroup.add(exitSign);

    this.scene.add(this.vaultDoorGroup);

    // Door physical collider
    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(exitWorld.x + 0.5, 0, -2.5),
      new THREE.Vector3(exitWorld.x + 2.5, 5.0, 2.5)
    );

    // Interactive Door Object
    this.interactiveObjects.push({
      id: 'search_maze_exit_door',
      type: 'exit_door',
      name: 'Level 5 Exit Gateway',
      prompt: 'Level 5 Exit Gateway (Locked — reach Red Target or solve BFS to unlock)',
      position: [exitWorld.x + 1.5, 2.0, 0],
      hitRadius: 3.2,
      mesh: this.vaultDoorGroup,
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
      mazeNodesMap,
      shortestPathBeams,
      maze5FloorTiles,
      maze5TargetMesh: targetDiamond,
    };
  }

  // ==========================================================================
  // HEURISTIC CHAMBER — LEVEL 1: A* NAVIGATION LABORATORY
  // ==========================================================================

  public createHeuristicFloorGridTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark titanium / obsidian alloy base
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle dark sub-panel grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Laser-etched primary grid (every 128px)
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // High-tech gold navigation intersections
    ctx.fillStyle = '#f59e0b';
    for (let x = 0; x <= 512; x += 128) {
      for (let y = 0; y <= 512; y += 128) {
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }

    // Central calibration circle with tick marks
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(256, 256, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Coordinate telemetry stamps
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText('A* NAV MATRIX [x:128 z:128]', 12, 24);
    ctx.fillText('HEURISTIC GRID CALIBRATION 1.0', 12, 500);
    ctx.fillText('f(n) = g(n) + h(n)', 360, 500);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 6);
    return tex;
  }

  public createHeuristicWallPanelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark brushed steel / laboratory carbon alloy
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, 512, 512);

    // Modular metallic panels with beveled borders
    ctx.fillStyle = '#111827';
    ctx.fillRect(8, 8, 496, 240);
    ctx.fillRect(8, 264, 496, 240);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 496, 240);
    ctx.strokeRect(8, 264, 496, 240);

    // Amber laser trim conduit running along middle seam
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 252, 512, 8);

    // Cyan circuit traces & data bus conduits
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, 40);
    ctx.lineTo(160, 40);
    ctx.lineTo(200, 80);
    ctx.lineTo(480, 80);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(32, 440);
    ctx.lineTo(220, 440);
    ctx.lineTo(260, 400);
    ctx.lineTo(480, 400);
    ctx.stroke();

    // Ventilation louvers
    ctx.fillStyle = '#030712';
    for (let y = 110; y <= 210; y += 15) {
      ctx.fillRect(40, y, 432, 8);
    }
    for (let y = 300; y <= 370; y += 15) {
      ctx.fillRect(40, y, 432, 8);
    }

    // Hex rivets along panel perimeter
    ctx.fillStyle = '#475569';
    for (let x = 24; x <= 488; x += 64) {
      ctx.fillRect(x, 16, 6, 6);
      ctx.fillRect(x, 236, 6, 6);
      ctx.fillRect(x, 272, 6, 6);
      ctx.fillRect(x, 492, 6, 6);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 2);
    return tex;
  }

  public createHeuristicMainWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // High-tech dark slate carbon plate
    ctx.fillStyle = '#070c18';
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle outer border with corner notches
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 992, 480);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, 976, 464);

    // Title: A* NAVIGATION
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A* NAVIGATION', 512, 110);

    // Accent line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, 135);
    ctx.lineTo(684, 135);
    ctx.stroke();

    // Central Formula Display Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(200, 175, 624, 130);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 175, 624, 130);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 62px monospace';
    ctx.fillText('f(n) = g(n) + h(n)', 512, 260);

    // Core Instruction
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 36px sans-serif';
    ctx.fillText('Choose the node with', 512, 375);
    ctx.fillText('the lowest f(n).', 512, 425);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  public createHeuristicConsoleTexture(stageNumber: number = 1): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark sleek background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, 768, 512);

    // Border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 748, 492);

    // Header bar
    ctx.fillStyle = '#0c1b33';
    ctx.fillRect(16, 16, 736, 60);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A* ANALYSIS TERMINAL', 384, 56);

    ctx.textAlign = 'left';

    if (stageNumber === 1) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('CURRENT NODE: A', 50, 120);

      // Node choices
      const lines = [
        { label: 'NODE B', g: 2, h: 6, f: 8 },
        { label: 'NODE C', g: 4, h: 3, f: 7 },
        { label: 'NODE D', g: 3, h: 7, f: 10 },
      ];

      lines.forEach((item, idx) => {
        const y = 175 + idx * 68;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(50, y - 30, 668, 54);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(50, y - 30, 668, 54);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(item.label, 70, y + 6);

        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`g = ${item.g}`, 260, y + 6);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`h = ${item.h}`, 420, y + 6);

        ctx.fillStyle = '#34d399';
        ctx.fillText(`f = ${item.f}`, 580, y + 6);
      });
    } else if (stageNumber === 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('CURRENT NODE: C', 50, 120);

      const lines = [
        { label: 'NODE E', g: 5, h: 4, f: 9 },
        { label: 'NODE F', g: 6, h: 2, f: 8 },
        { label: 'NODE G', g: 4, h: 6, f: 10 },
      ];

      lines.forEach((item, idx) => {
        const y = 175 + idx * 68;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(50, y - 30, 668, 54);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(50, y - 30, 668, 54);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(item.label, 70, y + 6);

        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`g = ${item.g}`, 260, y + 6);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`h = ${item.h}`, 420, y + 6);

        ctx.fillStyle = '#34d399';
        ctx.fillText(`f = ${item.f}`, 580, y + 6);
      });
    } else if (stageNumber === 3) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('CURRENT NODE: F', 50, 115);

      const lines = [
        { label: 'NODE H', g: 8, h: 4, f: 12 },
        { label: 'NODE I', g: 11, h: 1, f: 12 },
        { label: 'NODE J', g: 7, h: 3, f: 10 },
        { label: 'NODE K', g: 9, h: 5, f: 14 },
      ];

      lines.forEach((item, idx) => {
        const y = 160 + idx * 56;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(50, y - 26, 668, 46);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(50, y - 26, 668, 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 21px monospace';
        ctx.fillText(item.label, 70, y + 6);

        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`g = ${item.g}`, 260, y + 6);

        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`h = ${item.h}`, 420, y + 6);

        ctx.fillStyle = '#34d399';
        ctx.fillText(`f = ${item.f}`, 580, y + 6);
      });
    } else {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('A* SEARCH COMPLETE', 50, 130);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '19px monospace';
      ctx.fillText('OPTIMAL ROUTE DISCOVERED:', 50, 180);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('START ──> C ──> F ──> J ──> TARGET', 50, 230);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Total Evaluation: f(TARGET) = 7 + 3 = 10', 50, 290);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Proceed to the RED TARGET node.', 50, 350);
    }

    // Bottom formula reminder
    ctx.textAlign = 'center';
    ctx.fillStyle = '#052e16';
    ctx.fillRect(50, 420, 668, 60);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 420, 668, 60);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('Choose the node with the lowest f(n).  f(n) = g(n) + h(n)', 384, 456);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  public createHeuristicNodeBadgeTexture(
    nodeName: string,
    g: number,
    h: number,
    f: number,
    status: 'start' | 'target' | 'normal' | 'correct' | 'wrong' = 'normal'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;

    // Clean dark glass surface
    ctx.fillStyle = 'rgba(7, 11, 22, 0.95)';
    ctx.fillRect(0, 0, 512, 180);

    let borderColor = '#0284c7';
    let titleColor = '#ffffff';

    if (status === 'start') {
      borderColor = '#10b981';
      titleColor = '#34d399';
    } else if (status === 'target') {
      borderColor = '#ef4444';
      titleColor = '#f87171';
    } else if (status === 'correct') {
      borderColor = '#10b981';
      titleColor = '#34d399';
    } else if (status === 'wrong') {
      borderColor = '#ef4444';
      titleColor = '#f87171';
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 172);

    ctx.textAlign = 'center';

    if (status === 'start') {
      ctx.fillStyle = titleColor;
      ctx.font = '900 44px monospace';
      ctx.fillText(nodeName, 256, 75);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('START  ·  g = 0', 256, 135);
    } else if (status === 'target') {
      ctx.fillStyle = titleColor;
      ctx.font = '900 44px monospace';
      ctx.fillText(nodeName, 256, 75);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('TARGET  ·  h = 0', 256, 135);
    } else {
      // Node Name Header
      ctx.fillStyle = titleColor;
      ctx.font = '900 38px monospace';
      ctx.fillText(nodeName, 256, 58);

      // Subtle horizontal divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 80);
      ctx.lineTo(480, 80);
      ctx.stroke();

      // Compact g / h / f metrics row
      ctx.font = 'bold 30px monospace';

      // g
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`g ${g}`, 110, 135);

      // divider
      ctx.fillStyle = '#475569';
      ctx.fillText('|', 200, 135);

      // h
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`h ${h}`, 260, 135);

      // divider
      ctx.fillStyle = '#475569';
      ctx.fillText('|', 340, 135);

      // f
      ctx.fillStyle = '#34d399';
      ctx.fillText(`f ${f}`, 410, 135);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // Deprecated alias to maintain compatibility
  public createHeuristicNodeTexture(
    nodeName: string,
    g: number,
    h: number,
    f: number,
    status: 'start' | 'target' | 'normal' | 'correct' | 'wrong' = 'normal'
  ): THREE.CanvasTexture {
    return this.createHeuristicNodeBadgeTexture(nodeName, g, h, f, status);
  }

  public buildHeuristicChamberLevel1(): EscapeRoomEnvironment {
    this.colliders = [];
    this.interactiveObjects = [];
    this.animatedMeshes = [];
    this.dynamicLasers = [];
    this.clockPendulum = undefined;

    const mazeNodesMap = new Map<string, Maze3DNodeRef>();
    const shortestPathBeams = new THREE.Group();
    this.scene.add(shortestPathBeams);

    const stageGroups = new Map<number, THREE.Group>();
    const stage1Group = new THREE.Group();
    const stage2Group = new THREE.Group();
    const stage3Group = new THREE.Group();
    this.scene.add(stage1Group);
    this.scene.add(stage2Group);
    this.scene.add(stage3Group);
    stageGroups.set(1, stage1Group);
    stageGroups.set(2, stage2Group);
    stageGroups.set(3, stage3Group);

    // -------------------------------------------------------------------------
    // 1. RESTRAINED & POLISHED LIGHTING (Futuristic Minimalist Laboratory)
    // -------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.4);
    this.scene.add(ambientLight);

    // Soft architectural downlights
    const downlight1 = new THREE.PointLight(0x38bdf8, 1.8, 26);
    downlight1.position.set(-6, 5.5, 0);
    this.scene.add(downlight1);

    const downlight2 = new THREE.PointLight(0x38bdf8, 1.8, 26);
    downlight2.position.set(8, 5.5, 0);
    this.scene.add(downlight2);

    const mainLight = downlight1;

    // -------------------------------------------------------------------------
    // 2. ROOM ARCHITECTURE (Spacious & Clean: W = 38m, D = 22m, H = 6.5m)
    // -------------------------------------------------------------------------
    const roomWidth = 38;  // X: -16.5 to +21.5
    const roomDepth = 22;  // Z: -11 to +11
    const roomHeight = 6.5;
    const centerX = 2.5;

    // Floor with sleek dark composite grid
    const floorTex = this.createHeuristicFloorGridTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.04,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(centerX, 0, 0);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Floor Collider (Floor plane only, leaving room interior completely clear)
    this.addBoxCollider(new THREE.Vector3(-18, -1, -13), new THREE.Vector3(24, 0, 13));

    // Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x080d18,
      metalness: 0.9,
      roughness: 0.4,
    });
    const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(centerX, roomHeight, 0);
    this.scene.add(ceilingMesh);

    // Outer Laboratory Walls (North, South, West, East)
    const wallTex = this.createHeuristicWallPanelTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      metalness: 0.8,
      roughness: 0.35,
    });

    // North Wall (Z = 11.0)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.8), wallMat);
    northWall.position.set(centerX, roomHeight / 2, 11.4);
    this.scene.add(northWall);
    this.addBoxCollider(new THREE.Vector3(-18, 0, 11.0), new THREE.Vector3(23, roomHeight, 12.0));

    // South Wall (Z = -11.0)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, roomHeight, 0.8), wallMat);
    southWall.position.set(centerX, roomHeight / 2, -11.4);
    this.scene.add(southWall);
    this.addBoxCollider(new THREE.Vector3(-18, 0, -12.0), new THREE.Vector3(23, roomHeight, -11.0));

    // West Wall (X = -16.5)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, roomHeight, roomDepth), wallMat);
    westWall.position.set(-16.9, roomHeight / 2, 0);
    this.scene.add(westWall);
    this.addBoxCollider(new THREE.Vector3(-17.8, 0, -12), new THREE.Vector3(-16.4, roomHeight, 12));

    // East Wall with Exit Doorway (X = +21.0)
    const eastWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.8, roomHeight, 8.2), wallMat);
    eastWallNorth.position.set(21.4, roomHeight / 2, 6.9);
    this.scene.add(eastWallNorth);
    this.addBoxCollider(new THREE.Vector3(20.8, 0, 2.8), new THREE.Vector3(22.0, roomHeight, 12));

    const eastWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.8, roomHeight, 8.2), wallMat);
    eastWallSouth.position.set(21.4, roomHeight / 2, -6.9);
    this.scene.add(eastWallSouth);
    this.addBoxCollider(new THREE.Vector3(20.8, 0, -12), new THREE.Vector3(22.0, roomHeight, -2.8));

    const eastWallLintel = new THREE.Mesh(new THREE.BoxGeometry(0.8, roomHeight - 4.5, 5.6), wallMat);
    eastWallLintel.position.set(21.4, 4.5 + (roomHeight - 4.5) / 2, 0);
    this.scene.add(eastWallLintel);

    // -------------------------------------------------------------------------
    // 3. ONLY ONE MAIN WALL DISPLAY (Mounted flush on North Wall)
    // -------------------------------------------------------------------------
    const mainWallTex = this.createHeuristicMainWallTexture();
    const mainWallMat = new THREE.MeshBasicMaterial({ map: mainWallTex });
    const mainWallScreen = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), mainWallMat);
    mainWallScreen.position.set(0, 3.4, 10.95);
    mainWallScreen.rotation.y = Math.PI; // Faces South toward the room
    this.scene.add(mainWallScreen);

    // Sleek border bezel for the single wall display
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
    const bezelMesh = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.08), bezelMat);
    bezelMesh.position.set(0, 3.4, 11.0);
    this.scene.add(bezelMesh);

    // -------------------------------------------------------------------------
    // 4. ONE INTERACTIVE A* ANALYSIS TERMINAL (Placed beside puzzle at X: -10.5, Z: 5.2)
    // -------------------------------------------------------------------------
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(-10.5, 0, 5.2);
    consoleGroup.rotation.y = -Math.PI / 4; // Angled cleanly toward player entering from -X

    // Compact Pedestal Base
    const consolePedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.1, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0b1329, metalness: 0.9, roughness: 0.2 })
    );
    consolePedestal.position.y = 0.55;
    consoleGroup.add(consolePedestal);

    // Holographic Display Screen (No floating diamond!)
    const consoleTex = this.createHeuristicConsoleTexture(1);
    const consoleScreenMat = new THREE.MeshStandardMaterial({
      map: consoleTex,
      roughness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
    });
    const consoleScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), consoleScreenMat);
    consoleScreen.name = 'heuristicConsoleScreen';
    consoleScreen.position.set(0, 1.45, 0.02);
    consoleScreen.rotation.x = -0.2; // Slight upward tilt for easy reading
    consoleGroup.add(consoleScreen);

    this.scene.add(consoleGroup);
    // Tight collider around only the pedestal base
    this.addBoxCollider(new THREE.Vector3(-11.4, 0, 4.4), new THREE.Vector3(-9.6, 1.6, 6.0));

    this.interactiveObjects.push({
      id: 'heuristic_console',
      type: 'security_console',
      name: 'A* ANALYSIS TERMINAL',
      prompt: '[E] ACCESS A* NAVIGATION SYSTEM',
      position: [-10.5, 1.4, 5.2],
      hitRadius: 2.8,
      mesh: consoleGroup,
    });

    // -------------------------------------------------------------------------
    // 5. CANDIDATE NODES & CLEAN PHYSICAL FLOOR CIRCLES
    // -------------------------------------------------------------------------
    interface NodeSetupDef {
      id: string;
      name: string;
      label: string;
      g: number;
      h: number;
      f: number;
      x: number;
      z: number;
      stage: 0 | 1 | 2 | 3 | 5;
      status: 'start' | 'target' | 'normal';
    }

    const nodeDefs: NodeSetupDef[] = [
      // Start
      { id: 'START', name: 'START', label: 'START', g: 0, h: 7, f: 7, x: -13.0, z: 0.0, stage: 0, status: 'start' },

      // Stage 1 Candidates (C is correct)
      { id: 'B', name: 'NODE B', label: 'B', g: 2, h: 6, f: 8, x: -6.5, z: 3.6, stage: 1, status: 'normal' },
      { id: 'C', name: 'NODE C', label: 'C', g: 4, h: 3, f: 7, x: -6.5, z: 0.0, stage: 1, status: 'normal' },
      { id: 'D', name: 'NODE D', label: 'D', g: 3, h: 7, f: 10, x: -6.5, z: -3.6, stage: 1, status: 'normal' },

      // Stage 2 Candidates (F is correct)
      { id: 'E', name: 'NODE E', label: 'E', g: 5, h: 4, f: 9, x: 0.5, z: 3.6, stage: 2, status: 'normal' },
      { id: 'F', name: 'NODE F', label: 'F', g: 6, h: 2, f: 8, x: 0.5, z: 0.0, stage: 2, status: 'normal' },
      { id: 'G', name: 'NODE G', label: 'G', g: 4, h: 6, f: 10, x: 0.5, z: -3.6, stage: 2, status: 'normal' },

      // Stage 3 Candidates (J is correct)
      { id: 'H', name: 'NODE H', label: 'H', g: 8, h: 4, f: 12, x: 7.5, z: 4.8, stage: 3, status: 'normal' },
      { id: 'I', name: 'NODE I', label: 'I', g: 11, h: 1, f: 12, x: 7.5, z: 1.6, stage: 3, status: 'normal' },
      { id: 'J', name: 'NODE J', label: 'J', g: 7, h: 3, f: 10, x: 7.5, z: -1.6, stage: 3, status: 'normal' },
      { id: 'K', name: 'NODE K', label: 'K', g: 9, h: 5, f: 14, x: 7.5, z: -4.8, stage: 3, status: 'normal' },

      // Destination Target
      { id: 'TARGET', name: 'RED TARGET', label: 'TARGET', g: 10, h: 0, f: 10, x: 14.5, z: 0.0, stage: 5, status: 'target' },
    ];

    nodeDefs.forEach((def) => {
      const isStart = def.status === 'start';
      const isTarget = def.status === 'target';

      const padRadius = isTarget ? 1.7 : 1.45;
      const baseColor = isTarget ? 0x2d0606 : (isStart ? 0x064e3b : 0x081326);
      const ringColor = isTarget ? 0xb91c1c : (isStart ? 0x10b981 : 0x0284c7);
      const emissiveIntensity = isTarget ? 0.3 : (isStart ? 0.6 : 0.25);

      // Low-profile 3D Floor Disc (sits naturally flat on floor, no thick blocks)
      const padMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(padRadius, padRadius, 0.03, 36),
        new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.8,
          roughness: 0.3,
          emissive: ringColor,
          emissiveIntensity,
        })
      );
      padMesh.position.set(def.x, 0.015, def.z);
      padMesh.receiveShadow = true;

      // Outer Glowing Ring on floor
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(padRadius * 0.85, padRadius * 0.98, 36),
        new THREE.MeshBasicMaterial({ color: ringColor, side: THREE.DoubleSide })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(def.x, 0.032, def.z);

      // Compact, sleek informative Badge (Faces West towards approaching player)
      const badgeTex = this.createHeuristicNodeBadgeTexture(
        def.name,
        def.g,
        def.h,
        def.f,
        def.status
      );
      const badgeWidth = 1.3;
      const badgeHeight = 0.46;
      const badgeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(badgeWidth, badgeHeight),
        new THREE.MeshBasicMaterial({
          map: badgeTex,
          transparent: true,
          side: THREE.DoubleSide,
        })
      );
      // Positioned at height 1.15m facing West (-X)
      badgeMesh.position.set(def.x, 1.15, def.z);
      badgeMesh.rotation.y = -Math.PI / 2;
      badgeMesh.name = `heuristicBadge_${def.id}`;

      // Slim floor stanchion supporting the badge
      const stanchion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.95, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
      );
      stanchion.position.set(def.x, 0.5, def.z);

      // Soft halo point light
      const haloLight = new THREE.PointLight(ringColor, isTarget ? 1.0 : (isStart ? 1.5 : 0.8), 5.5);
      haloLight.position.set(def.x, 1.0, def.z);

      // Assemble node group
      const nodeObjGroup = new THREE.Group();
      nodeObjGroup.add(padMesh);
      nodeObjGroup.add(ringMesh);
      nodeObjGroup.add(badgeMesh);
      nodeObjGroup.add(stanchion);
      nodeObjGroup.add(haloLight);

      // Assign to respective stage group for clean dynamic visibility
      if (def.stage === 1) {
        stage1Group.add(nodeObjGroup);
      } else if (def.stage === 2) {
        stage2Group.add(nodeObjGroup);
      } else if (def.stage === 3) {
        stage3Group.add(nodeObjGroup);
      } else {
        this.scene.add(nodeObjGroup);
      }

      mazeNodesMap.set(def.id, {
        id: def.id,
        tileMesh: padMesh,
        ringMesh: ringMesh,
        haloLight: haloLight,
        billboardMesh: badgeMesh,
      });

      // Physical interaction entry
      this.interactiveObjects.push({
        id: `heuristic_node_${def.id}`,
        type: 'heuristic_node',
        name: def.name,
        prompt: isTarget
          ? '[E] ENGAGE RED TARGET BEACON'
          : `[STEP IN] ${def.name}: g=${def.g}, h=${def.h}, f=${def.f}`,
        position: [def.x, 1.0, def.z],
        hitRadius: 2.0,
        mesh: padMesh,
      });
    });

    // -------------------------------------------------------------------------
    // 6. THIN, SUBTLE GRAPH CONNECTIONS (ONLY between actual connected nodes)
    // -------------------------------------------------------------------------
    const addSubtleConduit = (fromId: string, toId: string, parentGroup: THREE.Group) => {
      const fromNode = nodeDefs.find((n) => n.id === fromId)!;
      const toNode = nodeDefs.find((n) => n.id === toId)!;

      const dx = toNode.x - fromNode.x;
      const dz = toNode.z - fromNode.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const lineMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(length, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x071526,
          emissive: 0x0284c7,
          emissiveIntensity: 0.35,
          metalness: 0.9,
          roughness: 0.3,
        })
      );
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.rotation.z = -angle;
      lineMesh.position.set((fromNode.x + toNode.x) / 2, 0.018, (fromNode.z + toNode.z) / 2);
      parentGroup.add(lineMesh);
    };

    // Stage 1 connections (START to B, C, D)
    addSubtleConduit('START', 'B', stage1Group);
    addSubtleConduit('START', 'C', stage1Group);
    addSubtleConduit('START', 'D', stage1Group);

    // Stage 2 connections (C to E, F, G)
    addSubtleConduit('C', 'E', stage2Group);
    addSubtleConduit('C', 'F', stage2Group);
    addSubtleConduit('C', 'G', stage2Group);

    // Stage 3 connections (F to H, I, J, K)
    addSubtleConduit('F', 'H', stage3Group);
    addSubtleConduit('F', 'I', stage3Group);
    addSubtleConduit('F', 'J', stage3Group);
    addSubtleConduit('F', 'K', stage3Group);

    // Initial Stage Visibilities (Stages 2 & 3 hidden initially to eliminate clutter)
    stage1Group.visible = true;
    stage2Group.visible = false;
    stage3Group.visible = false;

    // -------------------------------------------------------------------------
    // 7. OPTIMAL SOLUTION ROUTE (Illuminated gently ONLY upon Stage 5 discovery)
    // -------------------------------------------------------------------------
    const optimalSegments: [string, string][] = [
      ['START', 'C'],
      ['C', 'F'],
      ['F', 'J'],
      ['J', 'TARGET'],
    ];

    optimalSegments.forEach(([fromId, toId]) => {
      const fromNode = nodeDefs.find((n) => n.id === fromId)!;
      const toNode = nodeDefs.find((n) => n.id === toId)!;

      const dx = toNode.x - fromNode.x;
      const dz = toNode.z - fromNode.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(length, 0.22),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.85,
        })
      );
      beam.rotation.x = -Math.PI / 2;
      beam.rotation.z = -angle;
      beam.position.set((fromNode.x + toNode.x) / 2, 0.025, (fromNode.z + toNode.z) / 2);
      shortestPathBeams.add(beam);
    });

    shortestPathBeams.visible = false;

    // -------------------------------------------------------------------------
    // 8. HEURISTIC CHAMBER EXIT DOORWAY (East Wall at X: 21.0, Z: 0.0)
    // -------------------------------------------------------------------------
    const exitDoorGroup = new THREE.Group();
    exitDoorGroup.position.set(21.0, 0, 0);

    // Archway Frame
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.15,
    });
    const archFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.6, 5.8), archMat);
    archFrame.position.y = 2.3;
    exitDoorGroup.add(archFrame);

    // Dual Hydraulic Blast Door Sliders
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15,
    });

    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 2.4), doorMat);
    leftDoor.name = 'vaultDoorLeft';
    leftDoor.position.set(0, 2.1, 1.25);
    exitDoorGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 2.4), doorMat);
    rightDoor.name = 'vaultDoorRight';
    rightDoor.position.set(0, 2.1, -1.25);
    exitDoorGroup.add(rightDoor);

    // Door Status Lamp (Red while locked, green when unlocked)
    const doorLamp = new THREE.PointLight(0xef4444, 2.0, 7);
    doorLamp.name = 'exitDoorStatusLight';
    doorLamp.position.set(-0.5, 4.2, 0);
    exitDoorGroup.add(doorLamp);

    this.scene.add(exitDoorGroup);
    this.vaultDoorGroup = exitDoorGroup;

    // Door Collider (Blocks exit until TARGET reached)
    this.doorCollider = this.addBoxCollider(
      new THREE.Vector3(20.4, 0, -2.6),
      new THREE.Vector3(21.6, 4.5, 2.6)
    );

    this.interactiveObjects.push({
      id: 'heuristic_exit_door',
      type: 'exit_door',
      name: 'HEURISTIC CHAMBER EXIT',
      prompt: 'Heuristic Chamber Exit Gateway (Locked — reach Target to unlock)',
      position: [20.8, 1.8, 0],
      hitRadius: 3.2,
      mesh: exitDoorGroup,
    });

    return {
      scene: this.scene,
      colliders: this.colliders,
      interactiveObjects: this.interactiveObjects,
      vaultDoorMesh: this.vaultDoorGroup,
      doorCollider: this.doorCollider,
      animatedMeshes: this.animatedMeshes,
      ambientLight,
      mainLight,
      mazeNodesMap,
      shortestPathBeams,
      heuristicStageGroups: stageGroups,
    };
  }
}


