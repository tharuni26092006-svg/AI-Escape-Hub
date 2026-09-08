import { AvatarCustomization } from '../types';

export const DEFAULT_AVATAR: AvatarCustomization = {
  gender: 'female',
  skinColor: '#FFFFFF',
  headColor: '#FFFFFF',
  torsoColor: '#00E5BC',
  leftArmColor: '#FFFFFF',
  rightArmColor: '#FFFFFF',
  leftLegColor: '#262626',
  rightLegColor: '#262626',
  hat: 'none',
  face: 'pixel_smile',
  hair: 'pixel_side_ponytail',
  hairColor: '#18181b',
  accessory: 'none',
  shirtPattern: 'pixel_offshoulder_teal',
  shoeColor: '#18181b',
};

// Preset Avatars for Male & Female
export interface AvatarPreset {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unisex';
  icon: string;
  description: string;
  avatar: AvatarCustomization;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // --- FEMALE PRESETS ---
  {
    id: 'female_cyan_aesthetic',
    name: 'Teal Off-Shoulder Aesthetic',
    gender: 'female',
    icon: '🎀',
    description: 'Iconic Roblox off-shoulder cyan sweater with violet strap, side ponytail, and denim skirt.',
    avatar: {
      gender: 'female',
      skinColor: '#FFFFFF',
      headColor: '#FFFFFF',
      torsoColor: '#00E5BC',
      leftArmColor: '#FFFFFF',
      rightArmColor: '#FFFFFF',
      leftLegColor: '#262626',
      rightLegColor: '#262626',
      hat: 'none',
      face: 'pixel_smile',
      hair: 'pixel_side_ponytail',
      hairColor: '#18181b',
      accessory: 'none',
      shirtPattern: 'pixel_offshoulder_teal',
      shoeColor: '#18181b',
    },
  },
  {
    id: 'female_detective',
    name: 'Inspector Scarlett',
    gender: 'female',
    icon: '🕵️‍♀️',
    description: 'Sharp puzzle master with chic auburn hair and classic trench vest.',
    avatar: {
      gender: 'female',
      skinColor: '#fef08a',
      headColor: '#fef08a',
      torsoColor: '#15803d',
      leftArmColor: '#fef08a',
      rightArmColor: '#fef08a',
      leftLegColor: '#14532d',
      rightLegColor: '#14532d',
      hat: 'pixel_fedora',
      face: 'pixel_emerald_eyes',
      hair: 'pixel_bob',
      hairColor: '#b91c1c',
      accessory: 'pixel_backpack',
      shirtPattern: 'pixel_detective_vest',
      shoeColor: '#14532d',
    },
  },
  {
    id: 'female_cyber_valkyrie',
    name: 'Valkyrie Neon',
    gender: 'female',
    icon: '🪽',
    description: 'Futuristic quantum operative with glowing angel wings and cyber visor.',
    avatar: {
      gender: 'female',
      skinColor: '#e0f2fe',
      headColor: '#e0f2fe',
      torsoColor: '#0284c7',
      leftArmColor: '#e0f2fe',
      rightArmColor: '#e0f2fe',
      leftLegColor: '#0f172a',
      rightLegColor: '#0f172a',
      hat: 'pixel_headset',
      face: 'pixel_cyborg',
      hair: 'pixel_ponytail',
      hairColor: '#06b6d4',
      accessory: 'pixel_wings',
      shirtPattern: 'pixel_cyber_armor',
      shoeColor: '#38bdf8',
    },
  },
  {
    id: 'female_pharaoh_queen',
    name: 'Queen of the Nile',
    gender: 'female',
    icon: '👑',
    description: 'Royal Egyptian empress adorned with gold tiara and ruby silk.',
    avatar: {
      gender: 'female',
      skinColor: '#ca8a04',
      headColor: '#ca8a04',
      torsoColor: '#b45309',
      leftArmColor: '#ca8a04',
      rightArmColor: '#ca8a04',
      leftLegColor: '#451a03',
      rightLegColor: '#451a03',
      hat: 'pixel_tiara',
      face: 'pixel_cleopatra',
      hair: 'pixel_braids',
      hairColor: '#09090b',
      accessory: 'pixel_cape',
      shirtPattern: 'pixel_egypt_tunic',
      shoeColor: '#eab308',
    },
  },
  {
    id: 'female_kawaii_gamer',
    name: 'Arcade Starlet',
    gender: 'female',
    icon: '💖',
    description: 'Cute pixel streamer with pastel pink twin braids and cat ears.',
    avatar: {
      gender: 'female',
      skinColor: '#fed7aa',
      headColor: '#fed7aa',
      torsoColor: '#ec4899',
      leftArmColor: '#fed7aa',
      rightArmColor: '#fed7aa',
      leftLegColor: '#831843',
      rightLegColor: '#831843',
      hat: 'pixel_cat_ears',
      face: 'pixel_kawaii',
      hair: 'pixel_braids',
      hairColor: '#f43f5e',
      accessory: 'pixel_wings',
      shirtPattern: 'pixel_heart',
      shoeColor: '#fb7185',
    },
  },
  {
    id: 'female_shadow_ninja',
    name: 'Kunoichi Shadow',
    gender: 'female',
    icon: '🥷',
    description: 'Stealth infiltrator equipped with ninja mask and dual katanas.',
    avatar: {
      gender: 'female',
      skinColor: '#fed7aa',
      headColor: '#fed7aa',
      torsoColor: '#18181b',
      leftArmColor: '#fed7aa',
      rightArmColor: '#fed7aa',
      leftLegColor: '#09090b',
      rightLegColor: '#09090b',
      hat: 'none',
      face: 'pixel_ninja',
      hair: 'pixel_ponytail',
      hairColor: '#18181b',
      accessory: 'pixel_sword',
      shirtPattern: 'pixel_cyber_armor',
      shoeColor: '#e11d48',
    },
  },

  // --- MALE PRESETS ---
  {
    id: 'male_detective',
    name: 'Detective Blackwood',
    gender: 'male',
    icon: '🕵️‍♂️',
    description: 'Classic Victorian investigator with fedora and dapper vest.',
    avatar: {
      gender: 'male',
      skinColor: '#fde047',
      headColor: '#fde047',
      torsoColor: '#451a03',
      leftArmColor: '#fde047',
      rightArmColor: '#fde047',
      leftLegColor: '#1e293b',
      rightLegColor: '#1e293b',
      hat: 'pixel_fedora',
      face: 'pixel_detective',
      hair: 'pixel_short',
      hairColor: '#18181b',
      accessory: 'pixel_backpack',
      shirtPattern: 'pixel_detective_vest',
      shoeColor: '#451a03',
    },
  },
  {
    id: 'male_cyber_runner',
    name: 'Cyber Blade',
    gender: 'male',
    icon: '⚡',
    description: 'Neon hacker equipped with cyber armor, headset, and diamond katana.',
    avatar: {
      gender: 'male',
      skinColor: '#fbcfe8',
      headColor: '#fbcfe8',
      torsoColor: '#06b6d4',
      leftArmColor: '#fbcfe8',
      rightArmColor: '#fbcfe8',
      leftLegColor: '#0f172a',
      rightLegColor: '#0f172a',
      hat: 'pixel_headset',
      face: 'pixel_cyborg',
      hair: 'pixel_mohawk',
      hairColor: '#06b6d4',
      accessory: 'pixel_sword',
      shirtPattern: 'pixel_cyber_armor',
      shoeColor: '#06b6d4',
    },
  },
  {
    id: 'male_arcade_skater',
    name: 'Arcade Street Champ',
    gender: 'male',
    icon: '🛹',
    description: 'Casual streetwear gamer with snapback cap and hoodie.',
    avatar: {
      gender: 'male',
      skinColor: '#fed7aa',
      headColor: '#fed7aa',
      torsoColor: '#dc2626',
      leftArmColor: '#fed7aa',
      rightArmColor: '#fed7aa',
      leftLegColor: '#1e3a8a',
      rightLegColor: '#1e3a8a',
      hat: 'pixel_cap',
      face: 'pixel_cool',
      hair: 'pixel_messy',
      hairColor: '#78350f',
      accessory: 'pixel_backpack',
      shirtPattern: 'pixel_hoodie',
      shoeColor: '#ffffff',
    },
  },
];

export const SKIN_TONES = [
  { id: '#FFFFFF', name: 'Porcelain White (Aesthetic)' },
  { id: '#FFD700', name: 'Classic Noob Gold' },
  { id: '#fed7aa', name: 'Fair Peach' },
  { id: '#fde047', name: 'Sunny Blox' },
  { id: '#ca8a04', name: 'Warm Olive' },
  { id: '#b45309', name: 'Rich Bronze' },
  { id: '#78350f', name: 'Deep Caramel' },
  { id: '#451a03', name: 'Ebony Earth' },
  { id: '#e0f2fe', name: 'Frost Cyber' },
  { id: '#f5d0fe', name: 'Mystic Lilac' },
];

export const HAIR_STYLES = [
  { id: 'pixel_side_ponytail', name: 'Black Side-Swept Ponytail', gender: 'female', icon: '🎀', price: 0, creator: 'Official' },
  { id: 'pixel_ponytail', name: 'Chestnut High Ponytail', gender: 'female', icon: '👱‍♀️', price: 0, creator: 'Official' },
  { id: 'pixel_braids', name: 'Cinnamon Twin Braids', gender: 'female', icon: '👧', price: 20, creator: 'alexis3210404' },
  { id: 'pixel_bob', name: 'Beautiful Hair for Beautiful People', gender: 'female', icon: '💇‍♀️', price: 35, creator: 'cosmicfall' },
  { id: 'pixel_wavy_long', name: 'Long Wavy Locks', gender: 'female', icon: '🌊', price: 30, creator: 'loveanwgel' },
  { id: 'pixel_white_braids', name: 'White & Red Mythic Braids', gender: 'female', icon: '🤍', price: 33, creator: 'cosmicfall' },
  { id: 'pixel_twintails_pink', name: 'Cute Y2K Pink Twintails', gender: 'female', icon: '🌸', price: 38, creator: 'iivRoleBackup' },
  { id: 'pixel_short', name: 'Pal Hair (Bacon Hair)', gender: 'male', icon: '🥓', price: 0, creator: 'Official' },
  { id: 'pixel_messy', name: 'Classic Spiky Anime Hair', gender: 'male', icon: '⚡', price: 25, creator: 'Scorched UGC' },
  { id: 'pixel_sidepart', name: 'The Shaggy Hair', gender: 'male', icon: '💼', price: 20, creator: 'Roblox' },
  { id: 'pixel_mohawk', name: 'Cyber Neon Mohawk', gender: 'male', icon: '🔥', price: 25, creator: 'Xoriu' },
  { id: 'pixel_afro', name: 'Afro Fade Texture', gender: 'unisex', icon: '🧑‍🦱', price: 0, creator: 'Official' },
];

export const HAIR_COLORS = [
  { id: '#18181b', name: 'Obsidian Black' },
  { id: '#451a03', name: 'Chestnut Brown' },
  { id: '#facc15', name: 'Golden Blonde' },
  { id: '#b91c1c', name: 'Auburn Crimson' },
  { id: '#06b6d4', name: 'Neon Cyan' },
  { id: '#f43f5e', name: 'Pastel Rose' },
  { id: '#a855f7', name: 'Arcade Violet' },
  { id: '#e2e8f0', name: 'Platinum Silver' },
  { id: '#ffffff', name: 'Pure White' },
  { id: '#10b981', name: 'Emerald Green' },
];

export const COLOR_PALETTE = [
  '#0070FF', // Retro Blue
  '#DC2626', // Crimson Red
  '#10B981', // Emerald Voxel
  '#9D00FF', // Arcade Purple
  '#EC4899', // Pink Blush
  '#00F0FF', // Cyan Glow
  '#FFD700', // Pixel Gold
  '#FF7700', // Pixel Orange
  '#1E293B', // Slate Navy
  '#111827', // Obsidian Black
  '#FFFFFF', // Pixel White
  '#78350F', // Warm Brown
];

export const HATS_CATALOG = [
  { id: 'none', name: 'No Headwear', icon: '❌', gender: 'unisex', price: 0, creator: 'Official' },
  { id: 'pixel_cap', name: 'Snapback Cap', icon: '🧢', gender: 'male', price: 0, creator: 'Official' },
  { id: 'pixel_fedora', name: 'Classic Fedora', icon: '🕵️', gender: 'male', price: 25, creator: 'Dapper' },
  { id: 'pixel_tiara', name: 'Valkyrie Helm', icon: '👑', gender: 'female', price: 50, creator: 'Roblox' },
  { id: 'pixel_cat_ears', name: 'Cyber Cat Ears', icon: '🐱', gender: 'female', price: 20, creator: 'KawaiiUGC' },
  { id: 'pixel_crown', name: 'Domino Gold Crown', icon: '👑', gender: 'unisex', price: 45, creator: 'Roblox' },
  { id: 'pixel_headset', name: 'Gamer Pro Headset', icon: '🎧', gender: 'unisex', price: 25, creator: 'Cyber' },
  { id: 'pixel_beanie', name: 'Striped Cozy Beanie', icon: '🎿', gender: 'unisex', price: 15, creator: 'CozyBlox' },
  { id: 'pixel_viking', name: 'Horned Viking Helm', icon: '🛡️', gender: 'unisex', price: 30, creator: 'Heroic' },
  { id: 'pixel_wizard', name: 'Sorcerer Hat', icon: '🧙', gender: 'unisex', price: 35, creator: 'Arcane' },
  { id: 'pixel_horns', name: 'Sparkle Demon Horns', icon: '😈', gender: 'unisex', price: 40, creator: 'DarkUGC' },
  { id: 'pixel_halo', name: 'Angelic Glowing Halo', icon: '😇', gender: 'unisex', price: 45, creator: 'Divine' },
];

export const FACES_CATALOG = [
  { id: 'pixel_smile', name: 'Classic Smile (:D)', icon: '🙂', gender: 'unisex', price: 0, creator: 'Official' },
  { id: 'pixel_heroic', name: 'Man Face (Smirk)', icon: '😏', gender: 'male', price: 0, creator: 'Official' },
  { id: 'pixel_detective', name: 'Detective Focus', icon: '🧐', gender: 'male', price: 15, creator: 'Official' },
  { id: 'pixel_emerald_eyes', name: 'Woman Face (Glam)', icon: '👁️', gender: 'female', price: 0, creator: 'Official' },
  { id: 'pixel_kawaii', name: 'Super Happy Face', icon: '✨', gender: 'female', price: 30, creator: 'KawaiiUGC' },
  { id: 'pixel_cleopatra', name: 'Cleopatra Liner', icon: '💄', gender: 'female', price: 25, creator: 'StyleStars' },
  { id: 'pixel_cool', name: 'Chill Face (Shades)', icon: '🕶️', gender: 'unisex', price: 0, creator: 'Official' },
  { id: 'pixel_xd', name: 'XD Laugh Face', icon: '😆', gender: 'unisex', price: 20, creator: 'Official' },
  { id: 'pixel_ninja', name: 'Stealth Ninja Mask', icon: '🥷', gender: 'unisex', price: 25, creator: 'ShadowUGC' },
  { id: 'pixel_cyborg', name: 'Cyborg HUD Visor', icon: '🤖', gender: 'unisex', price: 35, creator: 'Cyber' },
  { id: 'pixel_hollow', name: 'Void Hollow Knight Mask', icon: '🎭', gender: 'unisex', price: 40, creator: 'PerroWorks' },
];

export const ACCESSORIES_CATALOG = [
  { id: 'none', name: 'No Back Gear', icon: '❌', price: 0, creator: 'Official' },
  { id: 'pixel_sword', name: 'Ronin Katana', icon: '⚔️', price: 45, creator: 'Roblox ✓' },
  { id: 'pixel_wings', name: 'Enchanted Fairy Wings', icon: '🪽', price: 73, creator: 'PuffmallowUGC' },
  { id: 'pixel_cape', name: 'Heroic Silk Cape', icon: '🦸', price: 30, creator: 'HeroUGC' },
  { id: 'pixel_backpack', name: 'Explorer Backpack', icon: '🎒', price: 15, creator: 'Adventure' },
  { id: 'pixel_shield', name: 'Diamond Crest Shield', icon: '🛡️', price: 25, creator: 'Classic' },
  { id: 'pixel_dark_wings', name: 'Red & Black Angel Wings', icon: '🦇', price: 73, creator: 'bucket ✓' },
];

export const PANTS_PATTERNS = [
  { id: 'pixel_denim_skirt', name: 'Dark Denim Skirt & Socks', icon: '👗', price: 0, creator: 'Roblox Classic' },
  { id: 'pixel_ripped_jeans', name: 'Y2K Ripped Wash Jeans', icon: '👖', price: 25, creator: 'iivRoleBackup' },
  { id: 'pixel_cargo_black', name: 'Tactical Cargo Pants', icon: '👖', price: 20, creator: 'VoxelApparel' },
  { id: 'pixel_cyber_pants', name: 'Neon Cyber Leggings', icon: '⚡', price: 35, creator: 'CosmicFall' },
  { id: 'pixel_white_sweats', name: 'Baggy Street Sweats', icon: '🤍', price: 15, creator: 'CuteCheapStr' },
  { id: 'pixel_formal_slacks', name: 'Dapper Pressed Slacks', icon: '🎩', price: 0, creator: 'Roblox Classic' },
  { id: 'pixel_punk_plaid', name: 'Red Plaid Grunge Skirt', icon: '🎸', price: 30, creator: 'Winng3587' },
];

export const MAKEUP_LOOKS = [
  { id: 'none', name: 'Natural (No Makeup)', icon: '✨', price: 0, creator: 'Official' },
  { id: 'makeup_igari', name: 'Cute Igari Soft Blush', icon: '🌸', price: 35, creator: 'alexis3210404' },
  { id: 'makeup_crystal', name: 'Crystal Quest Eye Shimmer', icon: '💎', price: 45, creator: 'StyleStars' },
  { id: 'makeup_rainbow', name: 'Rainbow Pastel Stars', icon: '🌈', price: 40, creator: 'KawaiiUGC' },
  { id: 'makeup_goth_lip', name: 'Black Velvet Lipstick & Liner', icon: '🖤', price: 25, creator: 'XotticFaces' },
  { id: 'makeup_anime_lashes', name: 'Anime Doll Flutter Lashes', icon: '👁️', price: 20, creator: 'FaceUp' },
  { id: 'makeup_fairy_sparkle', name: 'Celestial Star Face Paint', icon: '⭐', price: 30, creator: 'Snoopsie' },
];

export const EMOTES_CATALOG = [
  { id: 'wave', name: 'Friendly Wave', icon: '👋', price: 0, creator: 'Official' },
  { id: 'dance', name: 'Hootie Frutti Dance', icon: '💃', price: 25, creator: 'SOFTCHAOS' },
  { id: 'cheer', name: 'Super Cheer & Joy', icon: '🙌', price: 0, creator: 'Official' },
  { id: 'salute', name: 'Agent Hero Salute', icon: '🫡', price: 15, creator: 'LostNFound' },
  { id: 'backflip', name: 'Ninja Acrobat Flip', icon: '🤸', price: 40, creator: 'Ctrlmz' },
  { id: 'levitate', name: 'Endless Aura Float', icon: '✨', price: 50, creator: 'Animations✓' },
];

export const BACKGROUNDS_CATALOG = [
  { id: 'studio', name: 'Roblox Dark Studio', icon: '🎬', gradient: 'from-slate-900 via-[#181a20] to-slate-950', price: 0 },
  { id: 'cyberpunk', name: 'Neon Matrix Grid', icon: '🌆', gradient: 'from-cyan-950 via-slate-900 to-blue-950', price: 25 },
  { id: 'sunset', name: 'Pastel Sunset Clouds', icon: '🌅', gradient: 'from-rose-950 via-amber-950 to-purple-950', price: 20 },
  { id: 'pastel_stars', name: 'Cute Pastel Stars', icon: '✨', gradient: 'from-fuchsia-950 via-indigo-950 to-slate-950', price: 30 },
  { id: 'hacker_green', name: 'Green Matrix Binary', icon: '💻', gradient: 'from-emerald-950 via-slate-950 to-teal-950', price: 25 },
];

export const SHOULDER_CATALOG = [
  { id: 'none', name: 'No Shoulder Buddy', icon: '❌', price: 0 },
  { id: 'pet_cat', name: 'Cat on Shoulder', icon: '🐱', price: 30, creator: 'Orbic' },
  { id: 'pet_dragon', name: 'Baby Fire Dragon', icon: '🐉', price: 45, creator: 'FantasyBlox' },
  { id: 'pet_ghost', name: 'Spooky Cute Ghost', icon: '👻', price: 25, creator: 'SpookyUGC' },
  { id: 'pet_parrot', name: 'Pirate Pixel Parrot', icon: '🦜', price: 20, creator: 'AdventureUGC' },
];

export const NECK_CATALOG = [
  { id: 'none', name: 'No Neckwear', icon: '❌', price: 0 },
  { id: 'gold_chain', name: 'Layered Gold Cuban Chain', icon: '🪙', price: 30, creator: 'Toppligo' },
  { id: 'punk_choker', name: 'Spiked Punk Choker', icon: '🖤', price: 20, creator: 'GothVoxel' },
  { id: 'silk_scarf', name: 'Crimson Silk Scarf', icon: '🧣', price: 15, creator: 'Classic' },
  { id: 'bowtie', name: 'Formal Satin Bowtie', icon: '🎀', price: 10, creator: 'Classic' },
];

export const SHIRT_PATTERNS = [
  { id: 'pixel_offshoulder_teal', name: 'Teal Off-Shoulder Top & Violet Strap', icon: '🩵', price: 0, creator: 'Roblox Classic' },
  { id: 'pixel_heart', name: 'Classic Roblox "R" Graphic Tee', icon: '👕', price: 0, creator: 'Roblox Classic' },
  { id: 'pixel_detective_vest', name: 'Blox Tuxedo & Silk Vest', icon: '🤵', price: 20, creator: 'DapperUGC' },
  { id: 'pixel_cyber_armor', name: 'Cyber Neon Tech Suit', icon: '⚡', price: 35, creator: 'Xoriu' },
  { id: 'pixel_egypt_tunic', name: 'Pharaoh Gold Royal Tunic', icon: '👑', price: 30, creator: 'EgyptBlox' },
  { id: 'pixel_hoodie', name: 'Red Streetwear Gamer Hoodie', icon: '🔥', price: 25, creator: 'NapoleonMyKing' },
  { id: 'pixel_star', name: 'Y2K Grunge Star Sweater', icon: '⭐', price: 25, creator: 'VueUploader7' },
  { id: 'pixel_creeper', name: 'Pizza Delivery Uniform', icon: '🍕', price: 15, creator: 'BloxWorks' },
  { id: 'pixel_stripes', name: 'Black & White Coded Striped Longsleeve', icon: '🦓', price: 20, creator: 'CodedClothing' },
  { id: 'plain', name: 'Solid Minimalist Tee', icon: '⬛', price: 0, creator: 'Official' },
];
