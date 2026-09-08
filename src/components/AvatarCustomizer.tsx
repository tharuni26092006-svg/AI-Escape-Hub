import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Sparkles,
  Check,
  Search,
  Sliders,
  ShoppingBag,
  User,
  Palette,
  Camera,
  Shirt,
  Scissors,
  Smile,
  Shield,
  Layers,
  Sparkle,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { sound } from '../services/soundEngine';
import { AvatarCustomization } from '../types';
import { AvatarFigurePreview } from './AvatarFigurePreview';
import { Avatar3DViewport } from './Avatar3DViewport';
import {
  AVATAR_PRESETS,
  COLOR_PALETTE,
  FACES_CATALOG,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS_CATALOG,
  ACCESSORIES_CATALOG,
  SHIRT_PATTERNS,
  PANTS_PATTERNS,
  MAKEUP_LOOKS,
  EMOTES_CATALOG,
  BACKGROUNDS_CATALOG,
  SHOULDER_CATALOG,
  NECK_CATALOG,
  SKIN_TONES,
} from '../game/catalog';

interface AvatarCustomizerProps {
  initialAvatar: AvatarCustomization;
  username?: string;
  userCoins?: number;
  onSave: (avatar: AvatarCustomization) => void;
  onChange?: (avatar: AvatarCustomization) => void;
  onClose?: () => void;
  isModal?: boolean;
}

type MainCategory = 'all' | 'avatars' | 'body' | 'backgrounds' | 'clothing' | 'accessories' | 'animations' | 'makeup';
type BodySubCategory = 'hair' | 'heads_faces' | 'skin_tone' | 'proportions' | 'full_bodies';
type ClothingSubCategory = 'tops' | 'pants' | 'shoes';
type AccessoriesSubCategory = 'hats' | 'neck' | 'shoulder' | 'back';
type LimbTarget = 'all' | 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  initialAvatar,
  username = 'tharu',
  userCoins = 100,
  onSave,
  onChange,
  onClose,
  isModal = false,
}) => {
  // Avatar state
  const [avatar, setAvatar] = useState<AvatarCustomization>(() => ({
    ...initialAvatar,
    bodyShape: initialAvatar.bodyShape || 'classic',
    height: initialAvatar.height || 'standard',
    width: initialAvatar.width || 'standard',
    headScale: initialAvatar.headScale || 'standard',
    background: initialAvatar.background || 'studio',
    makeup: initialAvatar.makeup || 'none',
    pantsPattern: initialAvatar.pantsPattern || 'pixel_denim_skirt',
    neckAccessory: initialAvatar.neckAccessory || 'none',
    shoulderAccessory: initialAvatar.shoulderAccessory || 'none',
  }));

  // Safe updater that updates local state and notifies live listeners without loops
  const updateAvatarState = (updater: (prev: AvatarCustomization) => AvatarCustomization) => {
    setAvatar((prev) => {
      const next = updater(prev);
      onChange?.(next);
      return next;
    });
  };

  // Navigation & Mode
  const [mode, setMode] = useState<'customize' | 'marketplace'>('customize');
  const [mainCategory, setMainCategory] = useState<MainCategory>('all');
  const [bodySub, setBodySub] = useState<BodySubCategory>('hair');
  const [clothingSub, setClothingSub] = useState<ClothingSubCategory>('tops');
  const [accessoriesSub, setAccessoriesSub] = useState<AccessoriesSubCategory>('hats');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLimb, setSelectedLimb] = useState<LimbTarget>('all');

  // Interactive 3D Viewport Controls
  const [avatarRotation, setAvatarRotation] = useState<number>(0);
  const [cameraFocus, setCameraFocus] = useState<'body' | 'head'>('body');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [activeEmoteAnim, setActiveEmoteAnim] = useState<string | null>(null);

  // Coins & Inventory tracking
  const [ownedItems, setOwnedItems] = useState<Set<string>>(() => {
    return new Set<string>([
      'pixel_side_ponytail',
      'pixel_ponytail',
      'pixel_short',
      'pixel_afro',
      'pixel_smile',
      'pixel_heroic',
      'pixel_emerald_eyes',
      'pixel_cool',
      'pixel_offshoulder_teal',
      'pixel_heart',
      'plain',
      'pixel_denim_skirt',
      'pixel_formal_slacks',
      'none',
      'wave',
      'cheer',
      'studio',
    ]);
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Rotation handlers
  const handleRotateLeft = () => {
    sound.playUiClick();
    setAvatarRotation((prev) => prev - 45);
  };

  const handleRotateRight = () => {
    sound.playUiClick();
    setAvatarRotation((prev) => prev + 45);
  };

  const handleResetRotation = () => {
    sound.playUiClick();
    setAvatarRotation(0);
  };

  // Drag-to-rotate in 3D
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX;
    setAvatarRotation((prev) => prev + delta * 0.8);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Trigger Emote
  const handleTriggerEmote = (emoteId: string) => {
    sound.playGem();
    setActiveEmoteAnim(emoteId);
    updateAvatarState((prev) => ({ ...prev, activeEmote: emoteId }));
    showFeedback(`Playing Emote: ${EMOTES_CATALOG.find((e) => e.id === emoteId)?.name || emoteId}!`);
    setTimeout(() => {
      setActiveEmoteAnim(null);
    }, 2800);
  };

  // Purchase or Equip item
  const handleItemClick = (
    category: 'hair' | 'hat' | 'face' | 'shirt' | 'pants' | 'accessory' | 'shoulder' | 'neck' | 'makeup' | 'background' | 'preset',
    itemId: string,
    price: number = 0,
    presetAvatar?: AvatarCustomization
  ) => {
    sound.playUiClick();

    if (category === 'preset' && presetAvatar) {
      updateAvatarState((prev) => ({
        ...presetAvatar,
        background: prev.background,
      }));
      showFeedback('Applied Avatar Outfit Preset!');
      return;
    }

    // Check if free or owned or needs purchase
    if (price > 0 && !ownedItems.has(itemId) && mode === 'marketplace') {
      if (userCoins >= price) {
        sound.playGem();
        setOwnedItems((prev) => new Set(prev).add(itemId));
        showFeedback(`Unlocked for 🪙 ${price} Coins!`);
      } else {
        sound.playAccessDenied();
        showFeedback('Not enough coins! Earn more by escaping rooms.');
        return;
      }
    }

    // Apply item to character
    if (category === 'hair') updateAvatarState((prev) => ({ ...prev, hair: itemId }));
    if (category === 'hat') updateAvatarState((prev) => ({ ...prev, hat: itemId }));
    if (category === 'face') updateAvatarState((prev) => ({ ...prev, face: itemId }));
    if (category === 'shirt') updateAvatarState((prev) => ({ ...prev, shirtPattern: itemId }));
    if (category === 'pants') updateAvatarState((prev) => ({ ...prev, pantsPattern: itemId }));
    if (category === 'accessory') updateAvatarState((prev) => ({ ...prev, accessory: itemId }));
    if (category === 'shoulder') updateAvatarState((prev) => ({ ...prev, shoulderAccessory: itemId }));
    if (category === 'neck') updateAvatarState((prev) => ({ ...prev, neckAccessory: itemId }));
    if (category === 'makeup') updateAvatarState((prev) => ({ ...prev, makeup: itemId }));
    if (category === 'background') updateAvatarState((prev) => ({ ...prev, background: itemId }));
  };

  // Advanced Skin Tone Tinting
  const handleApplySkinTone = (colorHex: string) => {
    sound.playUiClick();
    if (selectedLimb === 'all') {
      updateAvatarState((prev) => ({
        ...prev,
        skinColor: colorHex,
        headColor: colorHex,
        leftArmColor: colorHex,
        rightArmColor: colorHex,
      }));
    } else if (selectedLimb === 'head') {
      updateAvatarState((prev) => ({ ...prev, headColor: colorHex, skinColor: colorHex }));
    } else if (selectedLimb === 'torso') {
      updateAvatarState((prev) => ({ ...prev, torsoColor: colorHex }));
    } else if (selectedLimb === 'leftArm') {
      updateAvatarState((prev) => ({ ...prev, leftArmColor: colorHex }));
    } else if (selectedLimb === 'rightArm') {
      updateAvatarState((prev) => ({ ...prev, rightArmColor: colorHex }));
    } else if (selectedLimb === 'leftLeg') {
      updateAvatarState((prev) => ({ ...prev, leftLegColor: colorHex }));
    } else if (selectedLimb === 'rightLeg') {
      updateAvatarState((prev) => ({ ...prev, rightLegColor: colorHex }));
    }
  };

  const handleSave = () => {
    sound.playKeyPickup();
    onSave(avatar);
    if (onClose) onClose();
  };

  // Selected Background Gradient
  const currentBgGradient =
    BACKGROUNDS_CATALOG.find((b) => b.id === avatar.background)?.gradient ||
    'from-slate-900 via-[#181a20] to-slate-950';

  return (
    <div
      id="roblox-avatar-studio"
      className="fixed inset-0 w-full h-full bg-[#111216] text-[#e3e5e8] flex flex-col font-sans select-none z-50 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/95 border border-cyan-500/50 rounded-full shadow-2xl z-50 text-xs font-bold text-cyan-300 flex items-center gap-2 animate-fadeIn pointer-events-none">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Back Arrow | [Marketplace | Customize] | Search & Coins */}
      <header className="h-14 bg-[#181a1f] border-b border-[#23252b] px-4 flex items-center justify-between shrink-0 z-40">
        {/* Left: Back Arrow */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              if (onClose) onClose();
            }}
            className="w-9 h-9 rounded-full bg-[#23252b] hover:bg-[#2e313a] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Back to Game"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="font-black text-sm text-slate-100 hidden sm:inline-block">
            {username}’s Studio
          </span>
        </div>

        {/* Center: Segmented Toggle Pill [ Marketplace | Customize ] */}
        <div className="flex items-center bg-[#111216] p-1 rounded-full border border-[#2e313a] shadow-inner">
          <button
            onClick={() => {
              sound.playUiClick();
              setMode('marketplace');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
              mode === 'marketplace'
                ? 'bg-[#2b2d35] text-white shadow-md border border-[#3f424e]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setMode('customize');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
              mode === 'customize'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        </div>

        {/* Right: Balance Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#23252b] border border-[#343741] rounded-full text-xs font-bold text-amber-400 shadow-xs">
            <span>🪙</span>
            <span>{userCoins}</span>
          </div>

          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </header>

      {/* MAIN STUDIO SPLIT: Upper 3D Avatar Viewport & Lower Category Browser */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ============================================================ */}
        {/* 1. 3D INTERACTIVE AVATAR VIEWPORT (Top on Mobile, Left on Desktop) */}
        {/* ============================================================ */}
        <div
          className={`relative md:w-5/12 lg:w-4/12 h-72 sm:h-80 md:h-full bg-gradient-to-b ${currentBgGradient} border-b md:border-b-0 md:border-r border-[#23252b] overflow-hidden select-none`}
        >
          <Avatar3DViewport
            avatar={avatar}
            cameraFocus={cameraFocus}
            activeEmote={activeEmoteAnim}
            onFocusToggle={() => setCameraFocus((prev) => (prev === 'body' ? 'head' : 'body'))}
          />
        </div>

        {/* ============================================================ */}
        {/* 2. CUSTOMIZE & MARKETPLACE CATALOG (Scrollable Tabs & Grid) */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col bg-[#16171d] overflow-hidden">
          {/* PRIMARY CATEGORY HORIZONTAL BAR (Matching Roblox App) */}
          <div className="bg-[#181a20] border-b border-[#23252b] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {(
              [
                { id: 'all', label: 'All', icon: Sparkle },
                { id: 'avatars', label: 'Avatars', icon: User },
                { id: 'body', label: 'Body', icon: Scissors },
                { id: 'clothing', label: 'Clothing', icon: Shirt },
                { id: 'accessories', label: 'Accessories', icon: Shield },
                { id: 'makeup', label: 'Makeup', icon: Eye },
                { id: 'animations', label: 'Animations', icon: Layers },
                { id: 'backgrounds', label: 'Backgrounds', icon: Palette },
              ] as const
            ).map((cat) => {
              const IconComp = cat.icon;
              const isActive = mainCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playUiClick();
                    setMainCategory(cat.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-md scale-100'
                      : 'bg-[#20222a] text-slate-300 hover:bg-[#282a34] hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* SECONDARY CONTEXTUAL SUB-CATEGORY PILLS */}
          {mainCategory === 'body' && (
            <div className="bg-[#1c1e26] border-b border-[#262832] px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
              {[
                { id: 'hair' as BodySubCategory, label: 'Hair' },
                { id: 'heads_faces' as BodySubCategory, label: 'Heads & Faces' },
                { id: 'skin_tone' as BodySubCategory, label: 'Skin Tone' },
                { id: 'proportions' as BodySubCategory, label: 'Scale & Shape' },
                { id: 'full_bodies' as BodySubCategory, label: 'Full Bodies' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    sound.playUiClick();
                    setBodySub(sub.id);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    bodySub === sub.id
                      ? 'bg-blue-600 text-white font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {mainCategory === 'clothing' && (
            <div className="bg-[#1c1e26] border-b border-[#262832] px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
              {[
                { id: 'tops' as ClothingSubCategory, label: 'Tops & Shirts' },
                { id: 'pants' as ClothingSubCategory, label: 'Pants & Skirts' },
                { id: 'shoes' as ClothingSubCategory, label: 'Shoes' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    sound.playUiClick();
                    setClothingSub(sub.id);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    clothingSub === sub.id
                      ? 'bg-blue-600 text-white font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {mainCategory === 'accessories' && (
            <div className="bg-[#1c1e26] border-b border-[#262832] px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
              {[
                { id: 'hats' as AccessoriesSubCategory, label: 'Hats & Head' },
                { id: 'neck' as AccessoriesSubCategory, label: 'Neckwear' },
                { id: 'shoulder' as AccessoriesSubCategory, label: 'Shoulder Buddies' },
                { id: 'back' as AccessoriesSubCategory, label: 'Back Gear & Wings' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    sound.playUiClick();
                    setAccessoriesSub(sub.id);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    accessoriesSub === sub.id
                      ? 'bg-blue-600 text-white font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* ITEM GRID & CONTENT AREA */}
          <div className="flex-1 p-4 overflow-y-auto space-y-5">
            {/* ------------------------------------------------------------ */}
            {/* 1. ALL / TRENDING TAB */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'all' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-white tracking-wide">Featured Outfits</h3>
                    <span className="text-[11px] text-blue-400 font-bold hover:underline cursor-pointer">
                      Explore All
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AVATAR_PRESETS.slice(0, 6).map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleItemClick('preset', preset.id, 0, preset.avatar)}
                        className="p-3 bg-[#1e2029] hover:bg-[#262834] rounded-2xl border border-[#2b2e3b] hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="h-28 flex items-center justify-center bg-[#13141a] rounded-xl mb-2 overflow-hidden relative">
                          <AvatarFigurePreview avatar={preset.avatar} size="mini" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white truncate">{preset.name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">@RobloxStudio</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-black text-emerald-400">Free</span>
                            <span className="text-[10px] bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                              Try On
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending UGC Accessories */}
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide mb-3">Trending UGC Accessories</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {ACCESSORIES_CATALOG.concat(HATS_CATALOG as any)
                      .filter((item) => item.id !== 'none')
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick('accessory', item.id, item.price)}
                          className="p-3 bg-[#1e2029] hover:bg-[#262834] rounded-2xl border border-[#2b2e3b] hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {item.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400">@{item.creator || 'UGC'}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {item.price > 0 ? `🪙 ${item.price}` : 'Free'}
                            </span>
                            {avatar.accessory === item.id && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 2. AVATARS (PRESETS) TAB */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'avatars' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVATAR_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleItemClick('preset', preset.id, 0, preset.avatar)}
                    className="p-3 bg-[#1e2029] hover:bg-[#262834] rounded-2xl border border-[#2b2e3b] hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="h-32 flex items-center justify-center bg-[#13141a] rounded-xl mb-2 relative">
                      <AvatarFigurePreview avatar={preset.avatar} size="mini" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white truncate">{preset.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{preset.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-400">Free</span>
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black">
                          Equip
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 3. BODY (Hair, Heads/Faces, Skin Tone, Proportions) */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'body' && (
              <div className="space-y-5">
                {/* 3A. Hair Style & Hair Color */}
                {bodySub === 'hair' && (
                  <div className="space-y-4">
                    {/* Hair Color Palette */}
                    <div>
                      <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                        Hair Color
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {HAIR_COLORS.map((hc) => (
                          <button
                            key={hc.id}
                            onClick={() => {
                              sound.playUiClick();
                              updateAvatarState((prev) => ({ ...prev, hairColor: hc.id }));
                            }}
                            className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                              avatar.hairColor === hc.id
                                ? 'border-cyan-400 scale-110 shadow-lg'
                                : 'border-slate-700 hover:scale-105'
                            }`}
                            style={{ backgroundColor: hc.id }}
                            title={hc.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Hair Styles Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {HAIR_STYLES.map((style) => {
                        const isEquipped = avatar.hair === style.id;
                        return (
                          <div
                            key={style.id}
                            onClick={() => handleItemClick('hair', style.id, style.price)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isEquipped
                                ? 'bg-blue-950/40 border-blue-500 shadow-md'
                                : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                            }`}
                          >
                            <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                              {style.icon}
                            </div>
                            <span className="text-xs font-bold text-white truncate">{style.name}</span>
                            <span className="text-[10px] text-slate-400">@{style.creator}</span>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs font-black text-amber-400">
                                {style.price > 0 ? `🪙 ${style.price}` : 'Free'}
                              </span>
                              {isEquipped && (
                                <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                  Equipped
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3B. Heads & Facial Expressions */}
                {bodySub === 'heads_faces' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FACES_CATALOG.map((face) => {
                      const isEquipped = avatar.face === face.id;
                      return (
                        <div
                          key={face.id}
                          onClick={() => handleItemClick('face', face.id, face.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {face.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{face.name}</span>
                          <span className="text-[10px] text-slate-400">@{face.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {face.price > 0 ? `🪙 ${face.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3C. ADVANCED SKIN TONE (Individual Limb Tinting like Roblox) */}
                {bodySub === 'skin_tone' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#1e2029] rounded-2xl border border-[#2b2e3b] space-y-3">
                      <span className="text-xs font-black text-white uppercase tracking-wider block">
                        Limb Target (Advanced Skin Tone)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'all' as LimbTarget, label: 'All Limbs' },
                          { id: 'head' as LimbTarget, label: 'Head' },
                          { id: 'torso' as LimbTarget, label: 'Torso' },
                          { id: 'leftArm' as LimbTarget, label: 'Left Arm' },
                          { id: 'rightArm' as LimbTarget, label: 'Right Arm' },
                          { id: 'leftLeg' as LimbTarget, label: 'Left Leg' },
                          { id: 'rightLeg' as LimbTarget, label: 'Right Leg' },
                        ].map((limb) => (
                          <button
                            key={limb.id}
                            onClick={() => {
                              sound.playUiClick();
                              setSelectedLimb(limb.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedLimb === limb.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-[#13141a] text-slate-400 hover:text-white'
                            }`}
                          >
                            {limb.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Skin Color Swatches */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                      {SKIN_TONES.concat(
                        COLOR_PALETTE.map((c) => ({ id: c, name: c }))
                      ).map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => handleApplySkinTone(tone.id)}
                          className="h-12 rounded-xl border-2 border-slate-700 hover:border-cyan-400 hover:scale-105 transition-all shadow-md flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: tone.id }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3D. PROPORTIONS & BODY SHAPE */}
                {bodySub === 'proportions' && (
                  <div className="p-4 bg-[#1e2029] rounded-2xl border border-[#2b2e3b] space-y-5">
                    {/* Body Shape Preset */}
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-wider block mb-2">
                        Body Type Architecture
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'classic', label: 'Classic R6 Blocky' },
                          { id: 'slim', label: 'Modern Slim R15' },
                          { id: 'broad', label: 'Heroic Athletic' },
                        ].map((shape) => (
                          <button
                            key={shape.id}
                            onClick={() => {
                              sound.playUiClick();
                              updateAvatarState((prev) => ({ ...prev, bodyShape: shape.id as any }));
                            }}
                            className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              avatar.bodyShape === shape.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-[#13141a] text-slate-400 hover:text-white'
                            }`}
                          >
                            {shape.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Height Scale */}
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-wider block mb-2">
                        Height Scale: {avatar.height?.toUpperCase()}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['short', 'standard', 'tall'].map((h) => (
                          <button
                            key={h}
                            onClick={() => {
                              sound.playUiClick();
                              updateAvatarState((prev) => ({ ...prev, height: h as any }));
                            }}
                            className={`p-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                              avatar.height === h
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-[#13141a] text-slate-400 hover:text-white'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 4. CLOTHING (Tops, Pants, Shoes) */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'clothing' && (
              <div className="space-y-5">
                {clothingSub === 'tops' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SHIRT_PATTERNS.map((shirt) => {
                      const isEquipped = avatar.shirtPattern === shirt.id;
                      return (
                        <div
                          key={shirt.id}
                          onClick={() => handleItemClick('shirt', shirt.id, shirt.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {shirt.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{shirt.name}</span>
                          <span className="text-[10px] text-slate-400">@{shirt.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {shirt.price > 0 ? `🪙 ${shirt.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {clothingSub === 'pants' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PANTS_PATTERNS.map((pants) => {
                      const isEquipped = avatar.pantsPattern === pants.id;
                      return (
                        <div
                          key={pants.id}
                          onClick={() => handleItemClick('pants', pants.id, pants.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {pants.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{pants.name}</span>
                          <span className="text-[10px] text-slate-400">@{pants.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {pants.price > 0 ? `🪙 ${pants.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {clothingSub === 'shoes' && (
                  <div className="p-4 bg-[#1e2029] rounded-2xl border border-[#2b2e3b] space-y-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider block">
                      Shoe Color
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            sound.playUiClick();
                            updateAvatarState((prev) => ({ ...prev, shoeColor: c }));
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                            avatar.shoeColor === c
                              ? 'border-cyan-400 scale-110 shadow-lg'
                              : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 5. ACCESSORIES (Hats, Neck, Shoulder, Back) */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'accessories' && (
              <div className="space-y-5">
                {accessoriesSub === 'hats' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {HATS_CATALOG.map((hat) => {
                      const isEquipped = avatar.hat === hat.id;
                      return (
                        <div
                          key={hat.id}
                          onClick={() => handleItemClick('hat', hat.id, hat.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {hat.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{hat.name}</span>
                          <span className="text-[10px] text-slate-400">@{hat.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {hat.price > 0 ? `🪙 ${hat.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accessoriesSub === 'neck' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {NECK_CATALOG.map((neck) => {
                      const isEquipped = avatar.neckAccessory === neck.id;
                      return (
                        <div
                          key={neck.id}
                          onClick={() => handleItemClick('neck', neck.id, neck.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {neck.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{neck.name}</span>
                          <span className="text-[10px] text-slate-400">@{neck.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {neck.price > 0 ? `🪙 ${neck.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accessoriesSub === 'shoulder' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SHOULDER_CATALOG.map((sh) => {
                      const isEquipped = avatar.shoulderAccessory === sh.id;
                      return (
                        <div
                          key={sh.id}
                          onClick={() => handleItemClick('shoulder', sh.id, sh.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {sh.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{sh.name}</span>
                          <span className="text-[10px] text-slate-400">@{sh.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {sh.price > 0 ? `🪙 ${sh.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {accessoriesSub === 'back' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ACCESSORIES_CATALOG.map((acc) => {
                      const isEquipped = avatar.accessory === acc.id;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => handleItemClick('accessory', acc.id, acc.price)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-blue-950/40 border-blue-500 shadow-md'
                              : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                          }`}
                        >
                          <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                            {acc.icon}
                          </div>
                          <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                          <span className="text-[10px] text-slate-400">@{acc.creator}</span>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              {acc.price > 0 ? `🪙 ${acc.price}` : 'Free'}
                            </span>
                            {isEquipped && (
                              <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                                Equipped
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 6. MAKEUP (Igari, Lashes, Goth Lip, Stars) */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'makeup' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {MAKEUP_LOOKS.map((mu) => {
                  const isEquipped = avatar.makeup === mu.id;
                  return (
                    <div
                      key={mu.id}
                      onClick={() => handleItemClick('makeup', mu.id, mu.price)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-blue-950/40 border-blue-500 shadow-md'
                          : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                      }`}
                    >
                      <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                        {mu.icon}
                      </div>
                      <span className="text-xs font-bold text-white truncate">{mu.name}</span>
                      <span className="text-[10px] text-slate-400">@{mu.creator}</span>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400">
                          {mu.price > 0 ? `🪙 ${mu.price}` : 'Free'}
                        </span>
                        {isEquipped && (
                          <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                            Equipped
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 7. ANIMATIONS & EMOTES */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'animations' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EMOTES_CATALOG.map((emote) => (
                  <div
                    key={emote.id}
                    onClick={() => handleTriggerEmote(emote.id)}
                    className="p-3 bg-[#1e2029] hover:bg-[#262834] rounded-2xl border border-[#2b2e3b] hover:border-cyan-500 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="h-20 flex items-center justify-center text-3xl bg-[#13141a] rounded-xl mb-2">
                      {emote.icon}
                    </div>
                    <span className="text-xs font-bold text-white truncate">{emote.name}</span>
                    <span className="text-[10px] text-slate-400">@{emote.creator}</span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400">
                        {emote.price > 0 ? `🪙 ${emote.price}` : 'Free'}
                      </span>
                      <button className="px-2.5 py-1 bg-cyan-600/30 text-cyan-300 rounded-md text-[10px] font-bold">
                        Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 8. BACKGROUNDS */}
            {/* ------------------------------------------------------------ */}
            {mainCategory === 'backgrounds' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {BACKGROUNDS_CATALOG.map((bg) => {
                  const isEquipped = avatar.background === bg.id;
                  return (
                    <div
                      key={bg.id}
                      onClick={() => handleItemClick('background', bg.id, bg.price)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-blue-950/40 border-blue-500 shadow-md'
                          : 'bg-[#1e2029] hover:bg-[#262834] border-[#2b2e3b]'
                      }`}
                    >
                      <div
                        className={`h-20 rounded-xl mb-2 bg-gradient-to-br ${bg.gradient} flex items-center justify-center text-3xl shadow-inner`}
                      >
                        {bg.icon}
                      </div>
                      <span className="text-xs font-bold text-white truncate">{bg.name}</span>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400">
                          {bg.price > 0 ? `🪙 ${bg.price}` : 'Free'}
                        </span>
                        {isEquipped && (
                          <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
