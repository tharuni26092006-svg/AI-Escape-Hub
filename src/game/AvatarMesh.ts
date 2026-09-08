import * as THREE from 'three';
import { AvatarCustomization } from '../types';

/**
 * 3D Pixel / Voxel Character Mesh with crisp nearest-neighbor textures,
 * dynamic 3D voxel hairstyles, hats, outfits, facial expressions,
 * and back accessories for male, female, and custom characters.
 */
export class AvatarMesh {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public torsoGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;

  private headMesh!: THREE.Mesh;
  private torsoMesh!: THREE.Mesh;
  private leftArmMesh!: THREE.Mesh;
  private rightArmMesh!: THREE.Mesh;
  private leftLegMesh!: THREE.Mesh;
  private rightLegMesh!: THREE.Mesh;

  private hairGroup: THREE.Group;
  private hatGroup: THREE.Group;
  private neckGroup: THREE.Group;
  private shoulderGroup: THREE.Group;
  private skirtGroup: THREE.Group;
  private backGroup: THREE.Group;

  // Pixel Textures
  private faceCanvas: HTMLCanvasElement;
  private faceTexture: THREE.CanvasTexture;

  private torsoCanvas: HTMLCanvasElement;
  private torsoTexture: THREE.CanvasTexture;

  private armCanvas: HTMLCanvasElement;
  private armTexture: THREE.CanvasTexture;

  private legCanvas: HTMLCanvasElement;
  private legTexture: THREE.CanvasTexture;

  // Animation state
  public walkCycle: number = 0;
  public isMoving: boolean = false;
  public isJumping: boolean = false;

  constructor(custom: AvatarCustomization) {
    this.group = new THREE.Group();
    this.group.name = 'PixelBloxAvatar';

    // 1. Create crisp pixel texture canvases
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = 32;
    this.faceCanvas.height = 32;
    this.faceTexture = new THREE.CanvasTexture(this.faceCanvas);
    this.setupPixelTexture(this.faceTexture);

    this.torsoCanvas = document.createElement('canvas');
    this.torsoCanvas.width = 32;
    this.torsoCanvas.height = 32;
    this.torsoTexture = new THREE.CanvasTexture(this.torsoCanvas);
    this.setupPixelTexture(this.torsoTexture);

    this.armCanvas = document.createElement('canvas');
    this.armCanvas.width = 16;
    this.armCanvas.height = 32;
    this.armTexture = new THREE.CanvasTexture(this.armCanvas);
    this.setupPixelTexture(this.armTexture);

    this.legCanvas = document.createElement('canvas');
    this.legCanvas.width = 16;
    this.legCanvas.height = 32;
    this.legTexture = new THREE.CanvasTexture(this.legCanvas);
    this.setupPixelTexture(this.legTexture);

    // Groups
    this.torsoGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.hatGroup = new THREE.Group();
    this.neckGroup = new THREE.Group();
    this.shoulderGroup = new THREE.Group();
    this.skirtGroup = new THREE.Group();
    this.backGroup = new THREE.Group();

    this.buildPixelBody();
    this.updateCustomization(custom);

    // Make avatar compact and proportional to room furniture
    this.group.scale.setScalar(0.42);
  }

  private setupPixelTexture(texture: THREE.CanvasTexture) {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  private buildPixelBody() {
    // 1. Torso: 1.8 wide, 1.8 high, 0.95 deep (Voxel block proportions)
    const torsoGeo = new THREE.BoxGeometry(1.8, 1.8, 0.95);
    const torsoMatSide = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.05 });
    const torsoMatFront = new THREE.MeshStandardMaterial({ map: this.torsoTexture, roughness: 0.8 });

    const torsoMaterials = [
      torsoMatSide,
      torsoMatSide,
      torsoMatSide,
      torsoMatSide,
      torsoMatFront, // Front facing +Z
      torsoMatSide,
    ];

    this.torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterials);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.torsoGroup.position.set(0, 2.7, 0);
    this.torsoGroup.add(this.torsoMesh);

    // 2. Head: 1.3 x 1.3 x 1.3 Pixel cube
    const headGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
    const headMatSide = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const headMatFront = new THREE.MeshStandardMaterial({ map: this.faceTexture, roughness: 0.8 });

    const headMaterials = [
      headMatSide, // +X
      headMatSide, // -X
      headMatSide, // +Y
      headMatSide, // -Y
      headMatFront, // +Z FRONT (Face)
      headMatSide, // -Z
    ];
    this.headMesh = new THREE.Mesh(headGeo, headMaterials);
    this.headMesh.castShadow = true;

    this.headGroup.position.set(0, 1.55, 0);
    this.headGroup.add(this.headMesh);
    this.headGroup.add(this.hairGroup);
    this.headGroup.add(this.hatGroup);
    this.torsoGroup.add(this.headGroup);

    // 3. Left Arm (-X side)
    const armGeo = new THREE.BoxGeometry(0.85, 1.8, 0.85);
    const armMatSide = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const armMatFront = new THREE.MeshStandardMaterial({ map: this.armTexture, roughness: 0.8 });
    const armMaterials = [
      armMatSide,
      armMatSide,
      armMatSide,
      armMatSide,
      armMatFront,
      armMatSide,
    ];

    this.leftArmMesh = new THREE.Mesh(armGeo, armMaterials);
    this.leftArmMesh.position.set(0, -0.8, 0);
    this.leftArmMesh.castShadow = true;
    this.leftArm.position.set(-1.38, 0.8, 0);
    this.leftArm.add(this.leftArmMesh);
    this.torsoGroup.add(this.leftArm);

    // 4. Right Arm (+X side)
    this.rightArmMesh = new THREE.Mesh(armGeo, armMaterials);
    this.rightArmMesh.position.set(0, -0.8, 0);
    this.rightArmMesh.castShadow = true;
    this.rightArm.position.set(1.38, 0.8, 0);
    this.rightArm.add(this.rightArmMesh);
    this.torsoGroup.add(this.rightArm);

    // 5. Left Leg (-X side)
    const legGeo = new THREE.BoxGeometry(0.85, 1.8, 0.85);
    const legMatSide = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const legMatFront = new THREE.MeshStandardMaterial({ map: this.legTexture, roughness: 0.8 });
    const legMaterials = [
      legMatSide,
      legMatSide,
      legMatSide,
      legMatSide,
      legMatFront,
      legMatSide,
    ];

    this.leftLegMesh = new THREE.Mesh(legGeo, legMaterials);
    this.leftLegMesh.position.set(0, -0.9, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLeg.position.set(-0.45, -0.9, 0);
    this.leftLeg.add(this.leftLegMesh);
    this.torsoGroup.add(this.leftLeg);

    // 6. Right Leg (+X side)
    this.rightLegMesh = new THREE.Mesh(legGeo, legMaterials);
    this.rightLegMesh.position.set(0, -0.9, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLeg.position.set(0.45, -0.9, 0);
    this.rightLeg.add(this.rightLegMesh);
    this.torsoGroup.add(this.rightLeg);

    // 7. Neck & Shoulder accessories
    this.neckGroup.position.set(0, 0.95, 0.05);
    this.torsoGroup.add(this.neckGroup);

    this.shoulderGroup.position.set(-1.1, 1.0, 0);
    this.torsoGroup.add(this.shoulderGroup);

    // 8. 3D Skirt / Waist Overlayer
    this.skirtGroup.position.set(0, -0.9, 0);
    this.torsoGroup.add(this.skirtGroup);

    // 9. Back accessories attached to -Z side of torso
    this.backGroup.position.set(0, 0, -0.52);
    this.torsoGroup.add(this.backGroup);

    this.group.add(this.torsoGroup);
  }

  public updateCustomization(custom: AvatarCustomization) {
    const hairColorHex = custom.hairColor || '#18181b';
    this.drawPixelFace(custom.face, custom.skinColor || '#fed7aa', hairColorHex);
    this.drawPixelTorso(custom.torsoColor, custom.shirtPattern || 'pixel_offshoulder_teal', custom.skinColor);
    this.drawPixelArm(custom.torsoColor, custom.skinColor, custom.shirtPattern || 'pixel_offshoulder_teal');
    this.drawPixelLeg(custom.leftLegColor, custom.shoeColor || '#ffffff', custom.pantsPattern || 'pixel_denim_skirt', custom.skinColor);

    // Update body solid materials
    const skinHex = new THREE.Color(custom.skinColor || '#fed7aa');
    const torsoHex = new THREE.Color(custom.torsoColor || '#00E5BC');
    const leftArmHex = new THREE.Color(
      custom.shirtPattern === 'pixel_offshoulder_teal' ? '#ffffff' : (custom.leftArmColor || custom.skinColor || '#fed7aa')
    );
    const rightArmHex = new THREE.Color(
      custom.shirtPattern === 'pixel_offshoulder_teal' ? '#ffffff' : (custom.rightArmColor || custom.skinColor || '#fed7aa')
    );
    const leftLegHex = new THREE.Color(custom.leftLegColor || '#1e293b');
    const rightLegHex = new THREE.Color(custom.rightLegColor || '#1e293b');

    // Apply color tones to mesh sides
    this.updateMaterialColor(this.headMesh, skinHex);
    this.updateMaterialColor(this.torsoMesh, torsoHex);
    this.updateMaterialColor(this.leftArmMesh, leftArmHex);
    this.updateMaterialColor(this.rightArmMesh, rightArmHex);
    this.updateMaterialColor(this.leftLegMesh, leftLegHex);
    this.updateMaterialColor(this.rightLegMesh, rightLegHex);

    // Rebuild 3D Pixel Hair, Hat, Neck, Shoulder, Skirt & Back Accessories
    this.buildPixelHair(custom.hair || 'pixel_side_ponytail', hairColorHex);
    this.buildPixelHat(custom.hat || 'none');
    this.buildPixelNeckItem(custom.neckAccessory || 'none');
    this.buildPixelShoulderPet(custom.shoulderAccessory || 'none');
    this.buildPixelSkirt(custom.pantsPattern || 'pixel_denim_skirt', custom.leftLegColor || '#1e293b');
    this.buildPixelBackItem(custom.accessory || 'none');
  }

  private updateMaterialColor(mesh: THREE.Mesh, color: THREE.Color) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial && !mat.map) {
          mat.color.copy(color);
        }
      });
    }
  }

  // Draw 8-Bit Pixel Face on 32x32 Grid
  private drawPixelFace(faceType: string, skinColorHex: string, hairColorHex: string) {
    const ctx = this.faceCanvas.getContext('2d');
    if (!ctx) return;

    // Fill background with pixel skin color
    ctx.fillStyle = skinColorHex;
    ctx.fillRect(0, 0, 32, 32);

    // Pixel Hairline fringe on top
    ctx.fillStyle = hairColorHex;
    ctx.fillRect(0, 0, 32, 4);
    ctx.fillRect(2, 4, 8, 3);
    ctx.fillRect(14, 4, 6, 2);
    ctx.fillRect(22, 4, 8, 3);

    if (faceType === 'pixel_heroic') {
      // Confident Smirk & Defined Brows (Male Hero)
      ctx.fillStyle = hairColorHex; // Eyebrows
      ctx.fillRect(5, 9, 8, 2);
      ctx.fillRect(19, 10, 8, 2);

      // Heroic Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 12, 6, 6);
      ctx.fillRect(20, 13, 6, 5);
      ctx.fillStyle = '#38bdf8'; // Blue iris
      ctx.fillRect(8, 14, 3, 3);
      ctx.fillRect(22, 14, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 13, 2, 2);
      ctx.fillRect(21, 13, 2, 2);

      // Smirk
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(14, 23, 8, 2);
      ctx.fillRect(22, 22, 2, 2);
    } else if (faceType === 'pixel_detective') {
      // Detective with monocle & focus
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(5, 10, 8, 2);
      ctx.fillRect(19, 10, 8, 2);

      // Left Eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 13, 6, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 14, 2, 2);

      // Right Eye Monocle
      ctx.fillStyle = '#fbbf24'; // Gold rim
      ctx.fillRect(18, 11, 10, 9);
      ctx.fillStyle = '#e0f2fe'; // Glass lens
      ctx.fillRect(20, 13, 6, 5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(22, 14, 3, 3);

      // Mustache
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(10, 22, 12, 3);
      ctx.fillRect(8, 23, 2, 2);
      ctx.fillRect(22, 23, 2, 2);
    } else if (faceType === 'pixel_emerald_eyes') {
      // Striking Emerald Eyes & Glam Lashes (Female)
      ctx.fillStyle = '#09090b'; // Eyelashes
      ctx.fillRect(5, 10, 8, 2);
      ctx.fillRect(4, 9, 2, 2);
      ctx.fillRect(19, 10, 8, 2);
      ctx.fillRect(26, 9, 2, 2);

      // Glowing Emerald Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 12, 8, 7);
      ctx.fillRect(19, 12, 8, 7);
      ctx.fillStyle = '#10b981'; // Emerald
      ctx.fillRect(7, 13, 5, 5);
      ctx.fillRect(21, 13, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 13, 2, 2);
      ctx.fillRect(21, 13, 2, 2);

      // Rosy blush & Red Lips
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(3, 20, 4, 3);
      ctx.fillRect(25, 20, 4, 3);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(13, 24, 6, 2);
    } else if (faceType === 'pixel_cleopatra') {
      // Ancient Egyptian Kohl Winged Eyes
      ctx.fillStyle = '#09090b';
      // Winged eyeliner
      ctx.fillRect(2, 11, 12, 3);
      ctx.fillRect(18, 11, 12, 3);
      ctx.fillRect(0, 9, 4, 2);
      ctx.fillRect(28, 9, 4, 2);

      // Amber eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 13, 7, 5);
      ctx.fillRect(20, 13, 7, 5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(7, 14, 4, 4);
      ctx.fillRect(22, 14, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 14, 2, 2);
      ctx.fillRect(22, 14, 2, 2);

      // Gold Lip Tint
      ctx.fillStyle = '#d97706';
      ctx.fillRect(13, 24, 6, 2);
    } else if (faceType === 'pixel_kawaii') {
      // Big Anime Pixel Eyes with sparkles
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 10, 7, 9);
      ctx.fillRect(19, 10, 7, 9);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(7, 14, 5, 4);
      ctx.fillRect(20, 14, 5, 4);

      // White Sparkles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 11, 3, 3);
      ctx.fillRect(20, 11, 3, 3);
      ctx.fillRect(10, 16, 2, 2);
      ctx.fillRect(23, 16, 2, 2);

      // Pink Blush
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(3, 20, 5, 3);
      ctx.fillRect(24, 20, 5, 3);

      // Cute mouth :3
      ctx.fillStyle = '#881337';
      ctx.fillRect(13, 23, 6, 2);
      ctx.fillRect(15, 25, 2, 2);
    } else if (faceType === 'pixel_cool') {
      // 8-Bit Dark Pixel Sunglasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 12, 24, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 14, 3, 2);
      ctx.fillRect(20, 14, 3, 2);

      // Pixel Smirk
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(16, 24, 7, 2);
      ctx.fillRect(22, 23, 2, 2);
    } else if (faceType === 'pixel_xd') {
      // XD Eyes > <
      ctx.fillStyle = '#111827';
      ctx.fillRect(6, 12, 2, 6);
      ctx.fillRect(8, 14, 2, 2);
      ctx.fillRect(10, 15, 2, 2);
      ctx.fillRect(8, 16, 2, 2);

      ctx.fillRect(24, 12, 2, 6);
      ctx.fillRect(22, 14, 2, 2);
      ctx.fillRect(20, 15, 2, 2);
      ctx.fillRect(22, 16, 2, 2);

      ctx.fillStyle = '#fb7185';
      ctx.fillRect(4, 21, 4, 3);
      ctx.fillRect(24, 21, 4, 3);

      ctx.fillStyle = '#881337';
      ctx.fillRect(11, 22, 10, 6);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(13, 25, 6, 3);
    } else if (faceType === 'pixel_ninja') {
      // Ninja Headband & Mask
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 32, 11);
      ctx.fillRect(0, 19, 32, 13);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(12, 3, 8, 5);

      // Glowing Ninja Eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 13, 6, 3);
      ctx.fillRect(20, 13, 6, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 14, 2, 2);
      ctx.fillRect(23, 14, 2, 2);
    } else if (faceType === 'pixel_cyborg') {
      // Left eye human, right eye Cyber Visor HUD
      ctx.fillStyle = '#111827';
      ctx.fillRect(6, 12, 6, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 13, 2, 2);

      // Right Cyborg Eye
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(18, 10, 11, 10);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(20, 12, 7, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(22, 13, 3, 3);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(18, 22, 12, 3);
      ctx.fillStyle = '#111827';
      ctx.fillRect(8, 24, 8, 2);
    } else {
      // Default: Classic 8-Bit Pixel Smile
      ctx.fillStyle = '#111827';
      ctx.fillRect(6, 11, 6, 7);
      ctx.fillRect(20, 11, 6, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 12, 2, 2);
      ctx.fillRect(21, 12, 2, 2);

      ctx.fillStyle = '#fb7185';
      ctx.fillRect(4, 19, 4, 3);
      ctx.fillRect(24, 19, 4, 3);

      ctx.fillStyle = '#111827';
      ctx.fillRect(10, 22, 12, 2);
      ctx.fillRect(9, 21, 2, 2);
      ctx.fillRect(21, 21, 2, 2);
    }

    this.faceTexture.needsUpdate = true;
  }

  // Draw 8-Bit Pixel Torso Texture
  private drawPixelTorso(shirtColorHex: string, pattern: string, skinColorHex: string = '#fed7aa') {
    const ctx = this.torsoCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = shirtColorHex || '#00E5BC';
    ctx.fillRect(0, 0, 32, 32);

    if (pattern === 'pixel_offshoulder_teal') {
      // Iconic Roblox Teal Off-Shoulder Top & Violet Camisole Strap
      ctx.fillStyle = '#00E5BC';
      ctx.fillRect(0, 0, 32, 32);

      // Exposed shoulder skin on the left side
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 0, 16, 8);
      ctx.fillRect(16, 0, 8, 4);

      // Purple camisole strap across left shoulder
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(6, 0, 4, 8);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(7, 0, 2, 8);

      // Knit vertical ribbed fabric lines
      ctx.fillStyle = '#00cbb4';
      for (let x = 2; x < 30; x += 3) {
        ctx.fillRect(x, 8, 1, 16);
      }

      // Purple bottom underlayer trim
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(0, 24, 32, 3);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(0, 24, 32, 1);

      // Dark denim skirt waistband with brass rivet
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 27, 32, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 27, 32, 1);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(15, 28, 2, 2);
    } else if (pattern === 'pixel_heart') {
      // Collar
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(11, 0, 10, 4);

      // Heart graphic
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(11, 9, 4, 3);
      ctx.fillRect(17, 9, 4, 3);
      ctx.fillRect(9, 12, 14, 4);
      ctx.fillRect(11, 16, 10, 3);
      ctx.fillRect(13, 19, 6, 3);
      ctx.fillRect(15, 22, 2, 2);

      // Belt
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 26, 32, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(12, 26, 8, 5);
    } else if (pattern === 'pixel_detective_vest') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(12, 0, 8, 26);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(14, 4, 4, 4);
      ctx.fillRect(15, 8, 2, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 10, 2, 2);
      ctx.fillRect(8, 16, 2, 2);
      ctx.fillRect(22, 10, 2, 2);
      ctx.fillRect(22, 16, 2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 26, 32, 6);
    } else if (pattern === 'pixel_cyber_armor') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 5, 24, 20);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(12, 9, 8, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(14, 11, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 12, 2, 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(4, 20, 24, 2);
    } else if (pattern === 'pixel_egypt_tunic') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(4, 2, 24, 10);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(6, 4, 4, 4);
      ctx.fillRect(14, 4, 4, 4);
      ctx.fillRect(22, 4, 4, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4, 12, 24, 2);
    } else if (pattern === 'pixel_hoodie') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 3, 2, 8);
      ctx.fillRect(18, 3, 2, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 15, 20, 9);
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 17, 16, 5);
    } else if (pattern === 'pixel_star') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, 7, 4, 14);
      ctx.fillRect(9, 12, 14, 4);
      ctx.fillRect(11, 10, 10, 8);
    } else if (pattern === 'pixel_creeper') {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(8, 8, 16, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 10, 4, 4);
      ctx.fillRect(18, 10, 4, 4);
      ctx.fillRect(13, 13, 6, 6);
      ctx.fillRect(11, 16, 3, 5);
      ctx.fillRect(18, 16, 3, 5);
    } else if (pattern === 'pixel_stripes') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 6, 32, 3);
      ctx.fillRect(0, 13, 32, 3);
      ctx.fillRect(0, 20, 32, 3);
    } else {
      // Plain
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(11, 0, 10, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 26, 32, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(12, 26, 8, 5);
    }

    this.torsoTexture.needsUpdate = true;
  }

  // Draw Pixel Arm Texture (Sleeve + Hand)
  private drawPixelArm(sleeveColorHex: string, skinColorHex: string = '#fed7aa', pattern: string = 'pixel_offshoulder_teal') {
    const ctx = this.armCanvas.getContext('2d');
    if (!ctx) return;

    if (pattern === 'pixel_offshoulder_teal') {
      // Exposed shoulder skin on top
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 0, 16, 6);

      // Oversized white arm warmers / long sleeve cuffs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 6, 16, 21);

      // Subtle sleeve cuff fold shading
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 6, 16, 1);
      ctx.fillRect(0, 26, 16, 1);

      // Iconic orange horizontal badge/patch on the sleeve (from reference)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(3, 13, 10, 4);
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(4, 14, 8, 2);

      // Exposed hand at bottom
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 27, 16, 5);
    } else if (pattern === 'pixel_hoodie') {
      ctx.fillStyle = sleeveColorHex || '#dc2626';
      ctx.fillRect(0, 0, 16, 23);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 21, 16, 3);
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 24, 16, 8);
    } else if (pattern === 'pixel_cyber_armor') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 16, 24);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, 12, 16, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 13, 16, 1);
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 24, 16, 8);
    } else if (pattern === 'pixel_stripes') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 16, 23);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 4, 16, 3);
      ctx.fillRect(0, 11, 16, 3);
      ctx.fillRect(0, 18, 16, 3);
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 24, 16, 8);
    } else {
      // Default Short Sleeve Shirt
      ctx.fillStyle = sleeveColorHex || '#0070FF';
      ctx.fillRect(0, 0, 16, 11);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 10, 16, 1);

      // Bare skin arm & hand
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 11, 16, 21);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(2, 26, 12, 1);
    }

    this.armTexture.needsUpdate = true;
  }

  // Draw Pixel Leg Texture (Pants / Skirt + Thighs + Socks + Sneakers)
  private drawPixelLeg(pantsColorHex: string, shoeColorHex: string = '#ffffff', pantsPattern: string = 'pixel_denim_skirt', skinColorHex: string = '#fed7aa') {
    const ctx = this.legCanvas.getContext('2d');
    if (!ctx) return;

    if (pantsPattern === 'pixel_denim_skirt') {
      // 1. Dark charcoal/black denim skirt hem at top
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 16, 4);

      // 2. Exposed thigh skin
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(0, 4, 16, 6);

      // 3. Black / Charcoal Knee-High / Thigh-High Socks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 10, 16, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 10, 16, 1);
      ctx.fillRect(2, 16, 12, 1);

      // 4. White / Black Platform Sneakers with white sole
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 22, 16, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 23, 10, 2); // White shoe tongue / badge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 28, 16, 4); // Thick white platform sole
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 28, 16, 1);
    } else if (pantsPattern === 'pixel_ripped_jeans') {
      ctx.fillStyle = pantsColorHex || '#1e3a8a';
      ctx.fillRect(0, 0, 16, 23);
      // Ripped knee slits showing skin
      ctx.fillStyle = skinColorHex;
      ctx.fillRect(2, 10, 12, 2);
      ctx.fillRect(3, 14, 10, 1);
      // Platform sneakers
      ctx.fillStyle = shoeColorHex;
      ctx.fillRect(0, 23, 16, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 29, 16, 3);
    } else if (pantsPattern === 'pixel_cargo_black') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 16, 24);
      // Tactical cargo pocket
      ctx.fillStyle = '#27272a';
      ctx.fillRect(2, 8, 12, 8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(5, 9, 6, 2);
      // Boots
      ctx.fillStyle = shoeColorHex || '#09090b';
      ctx.fillRect(0, 24, 16, 8);
    } else if (pantsPattern === 'pixel_cyber_pants') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 16, 24);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(2, 4, 2, 18);
      ctx.fillRect(2, 12, 10, 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, 24, 16, 8);
    } else if (pantsPattern === 'pixel_punk_plaid') {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(0, 0, 16, 23);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 4, 16, 2);
      ctx.fillRect(0, 12, 16, 2);
      ctx.fillRect(4, 0, 2, 23);
      ctx.fillRect(11, 0, 2, 23);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 23, 16, 9);
    } else {
      // Standard pants + shoes
      ctx.fillStyle = pantsColorHex || '#1e293b';
      ctx.fillRect(0, 0, 16, 23);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 11, 10, 2);
      ctx.fillStyle = shoeColorHex || '#dc2626';
      ctx.fillRect(0, 23, 16, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 24, 8, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 29, 16, 3);
    }

    this.legTexture.needsUpdate = true;
  }

  // Rebuild 3D Pixel Hair Styles
  private buildPixelHair(hairStyle: string, hairColorHex: string) {
    while (this.hairGroup.children.length > 0) {
      this.hairGroup.remove(this.hairGroup.children[0]);
    }

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColorHex),
      roughness: 0.8,
    });

    if (hairStyle === 'pixel_side_ponytail' || hairStyle === 'pixel_side_swept') {
      // Iconic Roblox Black / Brunette Side-Swept Ponytail with Volume & Bangs
      // 1. Top hair cap
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.38, 1.44), hairMat);
      topCap.position.set(0, 0.72, 0);

      // 2. Swept side bangs across forehead
      const bangs = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.42, 0.28), hairMat);
      bangs.position.set(-0.12, 0.52, 0.66);
      bangs.rotation.z = -0.15;

      // 3. Back hair volume
      const backHair = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.7, 0.28), hairMat);
      backHair.position.set(0, 0.4, -0.66);

      // 4. Side ponytail tie / bow
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }));
      tie.position.set(0.72, 0.48, -0.25);

      // 5. Flowing ponytail cascading down
      const ponytailUpper = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), hairMat);
      ponytailUpper.position.set(0.82, 0.1, -0.15);
      ponytailUpper.rotation.z = -0.18;
      ponytailUpper.rotation.x = 0.12;

      const ponytailLower = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.75, 0.34), hairMat);
      ponytailLower.position.set(0.88, -0.45, 0.05);
      ponytailLower.rotation.z = -0.1;

      this.hairGroup.add(topCap, bangs, backHair, tie, ponytailUpper, ponytailLower);
    } else if (hairStyle === 'pixel_ponytail') {
      // High Ponytail (Female)
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.35, 1.42), hairMat);
      top.position.set(0, 0.72, 0);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
      tie.position.set(0, 0.65, -0.78);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.1, 0.38), hairMat);
      tail.position.set(0, 0.15, -0.9);
      tail.rotation.x = 0.2;
      this.hairGroup.add(top, tie, tail);
    } else if (hairStyle === 'pixel_braids' || hairStyle === 'pixel_white_braids') {
      // Twin Braids (Female)
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.35, 1.42), hairMat);
      top.position.set(0, 0.72, 0);
      const leftBraid = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 0.3), hairMat);
      leftBraid.position.set(-0.72, 0.05, 0.15);
      const rightBraid = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 0.3), hairMat);
      rightBraid.position.set(0.72, 0.05, 0.15);
      const tieMat = new THREE.MeshStandardMaterial({ color: hairStyle === 'pixel_white_braids' ? 0xdc2626 : 0xec4899 });
      const tieL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), tieMat);
      tieL.position.set(-0.72, -0.4, 0.15);
      const tieR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), tieMat);
      tieR.position.set(0.72, -0.4, 0.15);
      this.hairGroup.add(top, leftBraid, rightBraid, tieL, tieR);
    } else if (hairStyle === 'pixel_twintails_pink') {
      // Y2K Twintails
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.35, 1.42), hairMat);
      top.position.set(0, 0.72, 0);
      const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.3, 0.34), hairMat);
      leftTail.position.set(-0.78, -0.05, -0.2);
      const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.3, 0.34), hairMat);
      rightTail.position.set(0.78, -0.05, -0.2);
      this.hairGroup.add(top, leftTail, rightTail);
    } else if (hairStyle === 'pixel_bob') {
      // Chic Bob Cut
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.35, 1.42), hairMat);
      top.position.set(0, 0.72, 0);
      const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 1.42), hairMat);
      leftSide.position.set(-0.7, 0.3, 0);
      const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 1.42), hairMat);
      rightSide.position.set(0.7, 0.3, 0);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.9, 0.24), hairMat);
      back.position.set(0, 0.3, -0.7);
      this.hairGroup.add(top, leftSide, rightSide, back);
    } else if (hairStyle === 'pixel_wavy_long') {
      // Long Wavy Hair
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.35, 1.42), hairMat);
      top.position.set(0, 0.72, 0);
      const backLong = new THREE.Mesh(new THREE.BoxGeometry(1.44, 1.5, 0.28), hairMat);
      backLong.position.set(0, -0.05, -0.7);
      const leftLong = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.3, 0.55), hairMat);
      leftLong.position.set(-0.7, 0.05, 0.2);
      const rightLong = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.3, 0.55), hairMat);
      rightLong.position.set(0.7, 0.05, 0.2);
      this.hairGroup.add(top, backLong, leftLong, rightLong);
    } else if (hairStyle === 'pixel_short') {
      // Pal Hair / Bacon Hair
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), hairMat);
      top.position.set(0, 0.7, 0);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 0.3), hairMat);
      fringe.position.set(0, 0.55, 0.65);
      const backHair = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.6, 0.2), hairMat);
      backHair.position.set(0, 0.35, -0.65);
      this.hairGroup.add(top, fringe, backHair);
    } else if (hairStyle === 'pixel_messy') {
      // Spiky Anime Messy Hair
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.35, 1.42), hairMat);
      base.position.set(0, 0.7, 0);
      const spike1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.35, 0.38), hairMat);
      spike1.position.set(-0.35, 0.95, 0.2);
      const spike2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.42), hairMat);
      spike2.position.set(0.2, 0.98, -0.1);
      const spike3 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.38), hairMat);
      spike3.position.set(-0.1, 0.92, -0.35);
      this.hairGroup.add(base, spike1, spike2, spike3);
    } else if (hairStyle === 'pixel_sidepart') {
      // Gentleman Neat Side Part
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.32, 1.42), hairMat);
      top.position.set(0, 0.7, 0);
      const sideSwoop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 1.42), hairMat);
      sideSwoop.position.set(0.68, 0.45, 0);
      this.hairGroup.add(top, sideSwoop);
    } else if (hairStyle === 'pixel_mohawk') {
      // Cyber Mohawk
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.6, 1.42), hairMat);
      strip.position.set(0, 0.88, 0);
      this.hairGroup.add(strip);
    } else if (hairStyle === 'pixel_afro') {
      // Rounded Afro
      const afro = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.95, 1.68), hairMat);
      afro.position.set(0, 0.78, -0.05);
      this.hairGroup.add(afro);
    }
  }

  // Rebuild 3D Pixel Voxel Hats & Headwear
  private buildPixelHat(hatId: string) {
    while (this.hatGroup.children.length > 0) {
      this.hatGroup.remove(this.hatGroup.children[0]);
    }

    if (hatId === 'none') return;

    if (hatId === 'pixel_horns') {
      // Sparkle Demon Horns
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.3, emissive: 0x581c87, emissiveIntensity: 0.4 });
      const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.25), hornMat);
      leftHorn.position.set(-0.55, 0.95, 0.15);
      leftHorn.rotation.z = 0.45;
      leftHorn.rotation.x = -0.2;
      const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.25), hornMat);
      rightHorn.position.set(0.55, 0.95, 0.15);
      rightHorn.rotation.z = -0.45;
      rightHorn.rotation.x = -0.2;
      this.hatGroup.add(leftHorn, rightHorn);
    } else if (hatId === 'pixel_halo') {
      // Glowing Angelic Halo
      const haloMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.8, roughness: 0.2 });
      const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 12, 32), haloMat);
      haloRing.position.set(0, 1.35, 0);
      haloRing.rotation.x = Math.PI / 2;
      this.hatGroup.add(haloRing);
    } else if (hatId === 'pixel_cap') {
      // 8-Bit Snapback Cap
      const capMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
      const brimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

      const dome = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.4), capMat);
      dome.position.set(0, 0.72, 0);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.7), brimMat);
      brim.position.set(0, 0.55, 0.8);
      this.hatGroup.add(dome, brim);
    } else if (hatId === 'pixel_fedora') {
      // Detective Fedora Hat (Male / Female)
      const fedMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });

      const brim = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 1.85), fedMat);
      brim.position.set(0, 0.65, 0);
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.15, 1.45), bandMat);
      band.position.set(0, 0.75, 0);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.4, 1.42), fedMat);
      crown.position.set(0, 0.95, 0);
      this.hatGroup.add(brim, band, crown);
    } else if (hatId === 'pixel_tiara') {
      // Royal Diamond Tiara (Female)
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.7 });
      const gemMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2 });

      const band = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.15, 1.42), goldMat);
      band.position.set(0, 0.7, 0);
      const peak = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.2), goldMat);
      peak.position.set(0, 0.9, 0.65);
      const jewel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.15), gemMat);
      jewel.position.set(0, 0.9, 0.75);
      this.hatGroup.add(band, peak, jewel);
    } else if (hatId === 'pixel_cat_ears') {
      // Cyber Cat Ears Headband (Female)
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 });
      const earMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.6 });
      const innerMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });

      const band = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.1, 0.2), bandMat);
      band.position.set(0, 0.75, 0);

      // Left Ear
      const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.25), earMat);
      leftEar.position.set(-0.45, 1.0, 0);
      const leftInner = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.1), innerMat);
      leftInner.position.set(-0.45, 0.98, 0.1);

      // Right Ear
      const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.25), earMat);
      rightEar.position.set(0.45, 1.0, 0);
      const rightInner = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.1), innerMat);
      rightInner.position.set(0.45, 0.98, 0.1);

      this.hatGroup.add(band, leftEar, leftInner, rightEar, rightInner);
    } else if (hatId === 'pixel_crown') {
      // 3D Voxel Gold Crown
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.6 });
      const jewelMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.25, 1.45), crownMat);
      base.position.set(0, 0.75, 0);
      this.hatGroup.add(base);

      const spikeGeo = new THREE.BoxGeometry(0.3, 0.45, 0.3);
      const offsets = [
        [-0.55, 0.55],
        [0.55, 0.55],
        [-0.55, -0.55],
        [0.55, -0.55],
      ];
      offsets.forEach(([x, z]) => {
        const spike = new THREE.Mesh(spikeGeo, crownMat);
        spike.position.set(x, 1.0, z);
        this.hatGroup.add(spike);
      });

      const jewel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.15), jewelMat);
      jewel.position.set(0, 0.78, 0.75);
      this.hatGroup.add(jewel);
    } else if (hatId === 'pixel_beanie') {
      // Striped Beanie
      const bMat1 = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.9 });
      const bMat2 = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.9 });

      const ring1 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.3, 1.42), bMat1);
      ring1.position.set(0, 0.68, 0);
      const ring2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 1.3), bMat2);
      ring2.position.set(0, 0.95, 0);
      const pompom = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), bMat1);
      pompom.position.set(0, 1.25, 0);
      this.hatGroup.add(ring1, ring2, pompom);
    } else if (hatId === 'pixel_headset') {
      // Arcade Gamer Headset
      const setMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const padMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });

      const band = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.15, 0.3), setMat);
      band.position.set(0, 0.8, 0);
      const leftCup = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.6), padMat);
      leftCup.position.set(-0.75, 0.2, 0);
      const rightCup = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.6), padMat);
      rightCup.position.set(0.75, 0.2, 0);
      const mic = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), setMat);
      mic.position.set(0.75, 0.05, 0.35);
      this.hatGroup.add(band, leftCup, rightCup, mic);
    } else if (hatId === 'pixel_viking') {
      // Voxel Horned Helmet
      const helmMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });

      const helm = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.45, 1.45), helmMat);
      helm.position.set(0, 0.7, 0);
      const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), hornMat);
      leftHorn.position.set(-0.9, 0.95, 0);
      leftHorn.rotation.z = 0.5;
      const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), hornMat);
      rightHorn.position.set(0.9, 0.95, 0);
      rightHorn.rotation.z = -0.5;
      this.hatGroup.add(helm, leftHorn, rightHorn);
    } else if (hatId === 'pixel_wizard') {
      // 8-Bit Sorcerer Cone
      const wizMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.8 });
      const brim = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.8), wizMat);
      brim.position.set(0, 0.65, 0);
      const cone1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), wizMat);
      cone1.position.set(0, 0.9, 0);
      const cone2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), wizMat);
      cone2.position.set(0, 1.25, 0);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), wizMat);
      tip.position.set(0, 1.55, 0);
      this.hatGroup.add(brim, cone1, cone2, tip);
    }
  }

  // Rebuild 3D Pixel Voxel Back Items (-Z)
  private buildPixelBackItem(accId: string) {
    while (this.backGroup.children.length > 0) {
      this.backGroup.remove(this.backGroup.children[0]);
    }

    if (accId === 'none') return;

    if (accId === 'pixel_sword') {
      // 8-Bit Voxel Diamond Pixel Sword
      const swordGroup = new THREE.Group();
      swordGroup.rotation.z = Math.PI / 4;

      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.3 });
      const guardMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

      for (let i = 0; i < 7; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), bladeMat);
        b.position.set(i * 0.22, i * 0.22, 0);
        swordGroup.add(b);
      }

      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.12), guardMat);
      guard.position.set(-0.1, -0.1, 0);
      guard.rotation.z = -Math.PI / 4;
      swordGroup.add(guard);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.12), guardMat);
      handle.position.set(-0.25, -0.25, 0);
      swordGroup.add(handle);

      this.backGroup.add(swordGroup);
    } else if (accId === 'pixel_cape') {
      // Retro Pixel Cape
      const capeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.9, side: THREE.DoubleSide });
      const capeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.1), capeMat);
      capeMesh.position.set(0, -0.4, -0.15);
      capeMesh.rotation.x = -0.15;
      this.backGroup.add(capeMesh);
    } else if (accId === 'pixel_wings') {
      // Voxel Angel Wings
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.1), wingMat);
      leftWing.position.set(-1.0, 0.3, -0.15);
      leftWing.rotation.y = 0.35;

      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.1), wingMat);
      rightWing.position.set(1.0, 0.3, -0.15);
      rightWing.rotation.y = -0.35;

      this.backGroup.add(leftWing, rightWing);
    } else if (accId === 'pixel_backpack') {
      // Adventure Backpack
      const packMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
      const pouchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

      const mainPack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.6), packMat);
      mainPack.position.set(0, 0, -0.35);

      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.3), pouchMat);
      pouch.position.set(0, -0.25, -0.65);

      this.backGroup.add(mainPack, pouch);
    } else if (accId === 'pixel_dark_wings') {
      // Red & Black Demon / Angel Wings
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
      const redTrim = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 0.1), wingMat);
      leftWing.position.set(-1.05, 0.3, -0.15);
      leftWing.rotation.y = 0.35;
      const leftAccent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.12), redTrim);
      leftAccent.position.set(-1.2, 0.2, -0.16);

      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 0.1), wingMat);
      rightWing.position.set(1.05, 0.3, -0.15);
      rightWing.rotation.y = -0.35;
      const rightAccent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.12), redTrim);
      rightAccent.position.set(1.2, 0.2, -0.16);

      this.backGroup.add(leftWing, leftAccent, rightWing, rightAccent);
    } else if (accId === 'pixel_shield') {
      // Diamond Pixel Crest Shield
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });

      const shield = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.15), shieldMat);
      shield.position.set(0, 0, -0.15);

      const boss = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.22), trimMat);
      boss.position.set(0, 0, -0.18);

      this.backGroup.add(shield, boss);
    }
  }

  // Rebuild 3D Neck Wearables
  private buildPixelNeckItem(neckId: string) {
    while (this.neckGroup.children.length > 0) {
      this.neckGroup.remove(this.neckGroup.children[0]);
    }

    if (!neckId || neckId === 'none') return;

    if (neckId.includes('choker') || neckId === 'pixel_choker') {
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
      const charmMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.8 });
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 1.05), bandMat);
      const charm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), charmMat);
      charm.position.set(0, -0.05, 0.54);
      this.neckGroup.add(band, charm);
    } else if (neckId.includes('chain') || neckId === 'pixel_gold_chain') {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.8 });
      const chain = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.1, 1.08), goldMat);
      const pendant = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.1), goldMat);
      pendant.position.set(0, -0.18, 0.56);
      this.neckGroup.add(chain, pendant);
    } else if (neckId.includes('scarf') || neckId === 'pixel_scarf') {
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.9 });
      const scarf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 1.2), scarfMat);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.15), scarfMat);
      tail.position.set(0.3, -0.35, 0.6);
      this.neckGroup.add(scarf, tail);
    }
  }

  // Rebuild 3D Shoulder Pets & Companions
  private buildPixelShoulderPet(shoulderId: string) {
    while (this.shoulderGroup.children.length > 0) {
      this.shoulderGroup.remove(this.shoulderGroup.children[0]);
    }

    if (!shoulderId || shoulderId === 'none') return;

    if (shoulderId.includes('cat') || shoulderId.includes('kitty')) {
      const furMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
      const earMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.45), furMat);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), furMat);
      head.position.set(0, 0.25, 0.15);

      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), earMat);
      earL.position.set(-0.12, 0.42, 0.15);
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), earMat);
      earR.position.set(0.12, 0.42, 0.15);

      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
      eyeL.position.set(-0.08, 0.25, 0.33);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
      eyeR.position.set(0.08, 0.25, 0.33);

      this.shoulderGroup.add(body, head, earL, earR, eyeL, eyeR);
    } else if (shoulderId.includes('dragon')) {
      const dragMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.45), dragMat);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), wingMat);
      wingL.position.set(-0.25, 0.15, 0);
      wingL.rotation.z = 0.4;
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), wingMat);
      wingR.position.set(0.25, 0.15, 0);
      wingR.rotation.z = -0.4;
      this.shoulderGroup.add(body, wingL, wingR);
    } else if (shoulderId.includes('ghost')) {
      const ghostMat = new THREE.MeshStandardMaterial({ color: 0xe0e7ff, transparent: true, opacity: 0.85 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), ghostMat);
      this.shoulderGroup.add(body);
    }
  }

  // Rebuild 3D Skirt / Waist Overlayer
  private buildPixelSkirt(patternOrSkirtId: string, baseColorHex: string) {
    while (this.skirtGroup.children.length > 0) {
      this.skirtGroup.remove(this.skirtGroup.children[0]);
    }

    if (!patternOrSkirtId || (!patternOrSkirtId.includes('skirt') && !patternOrSkirtId.includes('denim'))) {
      return;
    }

    const skirtMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColorHex || '#1e293b'),
      roughness: 0.85,
    });

    // 3D Flared pleated block skirt over legs
    const skirtGeo = new THREE.BoxGeometry(2.15, 0.65, 1.15);
    const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
    skirtMesh.position.set(0, 0, 0);
    this.skirtGroup.add(skirtMesh);

    // Subtle decorative hem trim
    const trimMat = new THREE.MeshStandardMaterial({
      color: patternOrSkirtId.includes('plaid') ? 0xdc2626 : 0xffffff,
      roughness: 0.8,
    });
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.08, 1.18), trimMat);
    trim.position.set(0, -0.28, 0);
    this.skirtGroup.add(trim);
  }

  // Animation Update
  public updateAnimation(delta: number, isMoving?: boolean, isJumping?: boolean, velocityY: number = 0, landingBounce: number = 0) {
    if (isMoving !== undefined) this.isMoving = isMoving;
    if (isJumping !== undefined) this.isJumping = isJumping;

    if (this.isJumping) {
      if (velocityY > 0.5) {
        // Roblox ascending jump pose: high raised arms, dynamic staggered legs
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -2.7, delta * 20);
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -2.7, delta * 20);
        this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0.45, delta * 15);
        this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -0.45, delta * 15);
      } else {
        // Roblox falling/apex pose: arms angled forward, legs preparing for landing
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -1.3, delta * 15);
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -1.3, delta * 15);
        this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0.15, delta * 12);
        this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -0.15, delta * 12);
      }
      this.torsoGroup.position.y = 2.7;
    } else if (this.isMoving) {
      this.walkCycle += delta * 13;
      const armSwing = Math.sin(this.walkCycle) * 0.75;
      const legSwing = Math.sin(this.walkCycle) * 0.75;

      this.leftArm.rotation.x = armSwing;
      this.rightArm.rotation.x = -armSwing;
      this.leftLeg.rotation.x = -legSwing;
      this.rightLeg.rotation.x = legSwing;
      const baseDip = landingBounce > 0 ? -landingBounce * 0.25 : 0;
      this.torsoGroup.position.y = 2.7 + baseDip + Math.abs(Math.sin(this.walkCycle * 2)) * 0.12;
    } else {
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, delta * 12);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, delta * 12);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, delta * 12);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, delta * 12);
      const baseDip = landingBounce > 0 ? -landingBounce * 0.25 : 0;
      this.torsoGroup.position.y = 2.7 + baseDip;
    }
  }
}
