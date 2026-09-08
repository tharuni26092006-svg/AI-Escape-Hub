import React from 'react';
import { AvatarCustomization } from '../types';
import { FACES_CATALOG, HATS_CATALOG, ACCESSORIES_CATALOG, SHOULDER_CATALOG, NECK_CATALOG } from '../game/catalog';

interface AvatarFigurePreviewProps {
  avatar: AvatarCustomization;
  size?: 'icon' | 'mini' | 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export const AvatarFigurePreview: React.FC<AvatarFigurePreviewProps> = ({
  avatar,
  size = 'md',
  className = '',
  animate = false,
}) => {
  const skin = avatar.skinColor || '#FFFFFF';
  const headSkin = avatar.headColor || skin;
  const hairCol = avatar.hairColor || '#18181b';
  const torsoCol = avatar.torsoColor || '#00E5BC';
  const leftArmCol = avatar.leftArmColor || skin;
  const rightArmCol = avatar.rightArmColor || skin;
  const leftLegCol = avatar.leftLegColor || '#262626';
  const rightLegCol = avatar.rightLegColor || '#262626';
  const shoes = avatar.shoeColor || '#18181b';

  // Scales & Framing
  let scaleClass = 'scale-100';
  let containerSize = 'w-32 h-48';
  if (size === 'icon') {
    scaleClass = 'scale-[0.58] translate-y-7';
    containerSize = 'w-9 h-9 overflow-hidden rounded-full bg-blue-50';
  } else if (size === 'mini') {
    scaleClass = 'scale-[0.33]';
    containerSize = 'w-14 h-18 overflow-hidden rounded-xl flex items-center justify-center';
  } else if (size === 'sm') {
    scaleClass = 'scale-[0.65]';
    containerSize = 'w-28 h-40 flex items-center justify-center';
  } else if (size === 'md') {
    scaleClass = 'scale-[0.85]';
    containerSize = 'w-36 h-48 flex items-center justify-center';
  } else if (size === 'lg') {
    scaleClass = 'scale-[1.0]';
    containerSize = 'w-52 h-64 flex items-center justify-center';
  }

  const hatInfo = HATS_CATALOG.find((h) => h.id === avatar.hat);
  const accInfo = ACCESSORIES_CATALOG.find((a) => a.id === avatar.accessory);
  const shoulderInfo = SHOULDER_CATALOG.find((s) => s.id === avatar.shoulderAccessory);
  const neckInfo = NECK_CATALOG.find((n) => n.id === avatar.neckAccessory);

  return (
    <div className={`relative flex items-center justify-center select-none ${containerSize} ${className}`}>
      <div className={`flex flex-col items-center justify-center transform origin-center transition-transform ${scaleClass} ${animate ? 'hover:scale-105 transition-all duration-300' : ''}`}>
        
        {/* Head Top Accessory / Hat Badge */}
        {avatar.hat && avatar.hat !== 'none' && (
          <div className="absolute -top-7 z-30 flex items-center justify-center">
            {avatar.hat === 'pixel_fedora' && (
              <div className="w-16 h-3.5 bg-amber-950 rounded-full border border-amber-900 shadow-md relative flex items-center justify-center">
                <div className="w-10 h-3 bg-amber-900 rounded-t-md -top-2 absolute" />
                <div className="w-10 h-1 bg-red-600 -top-0.5 absolute" />
              </div>
            )}
            {avatar.hat === 'pixel_cap' && (
              <div className="w-16 h-3 bg-red-600 rounded-full border border-red-800 shadow-md relative flex items-center justify-center">
                <div className="w-11 h-3.5 bg-red-600 rounded-t-lg -top-2.5 absolute" />
                <div className="w-5 h-2 bg-red-800 rounded-r-md -right-2 -top-1 absolute" />
              </div>
            )}
            {avatar.hat === 'pixel_crown' && (
              <div className="text-2xl drop-shadow-md -top-3 absolute">👑</div>
            )}
            {avatar.hat === 'pixel_tiara' && (
              <div className="text-2xl drop-shadow-md -top-3 absolute">🪽</div>
            )}
            {avatar.hat === 'pixel_cat_ears' && (
              <div className="text-xl drop-shadow-md -top-2 absolute">🐱</div>
            )}
            {avatar.hat === 'pixel_horns' && (
              <div className="text-2xl drop-shadow-md -top-3 absolute">😈</div>
            )}
            {avatar.hat === 'pixel_halo' && (
              <div className="w-14 h-4 rounded-full border-2 border-amber-300 shadow-[0_0_10px_#fde047] -top-3 absolute bg-yellow-200/20" />
            )}
            {avatar.hat === 'pixel_headset' && (
              <div className="w-18 h-4 flex items-center justify-between relative -top-1">
                <div className="w-3 h-5 bg-cyan-400 rounded-sm shadow-sm border border-slate-900" />
                <div className="w-12 h-1.5 bg-slate-900 rounded-t-sm absolute left-3 top-0" />
                <div className="w-3 h-5 bg-cyan-400 rounded-sm shadow-sm border border-slate-900" />
              </div>
            )}
            {avatar.hat === 'pixel_wizard' && (
              <div className="text-2xl drop-shadow-md -top-4 absolute">🧙</div>
            )}
            {avatar.hat === 'pixel_viking' && (
              <div className="text-2xl drop-shadow-md -top-4 absolute">🛡️</div>
            )}
            {avatar.hat === 'pixel_beanie' && (
              <div className="w-14 h-4 bg-amber-400 rounded-t-xl border border-amber-600 -top-2 absolute shadow-sm" />
            )}
          </div>
        )}

        {/* Roblox Head Cylinder Stud */}
        <div
          className="w-5 h-2 rounded-t-sm border-2 border-b-0 border-slate-800/30 z-20 shadow-inner"
          style={{ backgroundColor: headSkin }}
        />

        {/* Roblox R6 Block Head */}
        <div
          className="w-14 h-14 rounded-md relative shadow-md flex items-center justify-center border-2 border-slate-800/35 overflow-hidden z-20"
          style={{ backgroundColor: headSkin }}
        >
          {/* Hair Mesh Overlay */}
          {avatar.hair && avatar.hair !== 'pixel_none' && (
            <div
              className="absolute -top-1 inset-x-0 h-4 rounded-t-sm opacity-95 shadow-sm"
              style={{ backgroundColor: hairCol }}
            >
              {avatar.hair === 'pixel_side_ponytail' && (
                <>
                  <div
                    className="absolute -bottom-2.5 left-0 w-10 h-3 rounded-br-full rotate-6 shadow-sm"
                    style={{ backgroundColor: hairCol }}
                  />
                  <div
                    className="absolute -top-1 -left-2 w-3.5 h-12 rounded-2xl shadow-md border border-slate-900/20 -rotate-12 z-30"
                    style={{ backgroundColor: hairCol }}
                  />
                </>
              )}
              {avatar.hair === 'pixel_braids' && (
                <div className="absolute top-2 -inset-x-1 flex justify-between">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: hairCol }} />
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: hairCol }} />
                </div>
              )}
              {avatar.hair === 'pixel_white_braids' && (
                <div className="absolute top-1 -inset-x-1 flex justify-between">
                  <div className="w-2 h-8 rounded-full bg-white border border-red-500" />
                  <div className="w-2 h-8 rounded-full bg-white border border-red-500" />
                </div>
              )}
              {avatar.hair === 'pixel_twintails_pink' && (
                <div className="absolute -top-1 -inset-x-2 flex justify-between">
                  <div className="w-3 h-8 rounded-full bg-pink-400 -rotate-12" />
                  <div className="w-3 h-8 rounded-full bg-pink-400 rotate-12" />
                </div>
              )}
              {avatar.hair === 'pixel_ponytail' && (
                <div className="absolute -top-2 right-0 w-2.5 h-6 rounded-full" style={{ backgroundColor: hairCol }} />
              )}
              {avatar.hair === 'pixel_short' && (
                <div className="absolute -bottom-1 inset-x-0 h-2 bg-amber-900/80 rounded-b-xs" />
              )}
              {avatar.hair === 'pixel_messy' && (
                <div className="absolute -top-1.5 inset-x-1 h-2 flex justify-between">
                  <div className="w-2 h-2 bg-inherit rotate-45" />
                  <div className="w-2 h-2 bg-inherit rotate-45" />
                  <div className="w-2 h-2 bg-inherit rotate-45" />
                </div>
              )}
            </div>
          )}

          {/* Makeup Blush / Facial Shimmer */}
          {avatar.makeup === 'makeup_igari' && (
            <div className="absolute inset-x-1 bottom-3 flex justify-between px-1 z-15 pointer-events-none opacity-80">
              <div className="w-3 h-2 bg-rose-400/70 rounded-full blur-[1px]" />
              <div className="w-3 h-2 bg-rose-400/70 rounded-full blur-[1px]" />
            </div>
          )}
          {avatar.makeup === 'makeup_crystal' && (
            <div className="absolute top-2 inset-x-2 flex justify-between z-15 text-[8px]">
              <span>✨</span>
              <span>✨</span>
            </div>
          )}
          {avatar.makeup === 'makeup_rainbow' && (
            <div className="absolute top-3 inset-x-2 flex justify-between z-15 text-[7px]">
              <span>🌈</span>
              <span>⭐</span>
            </div>
          )}

          {/* Classic Roblox Face Decals */}
          <div className="relative z-10 select-none flex flex-col items-center justify-center pt-1.5">
            {avatar.face === 'pixel_smile' ? (
              <div className="flex flex-col items-center">
                <div className="flex gap-3">
                  <div className="w-1.5 h-2.5 bg-slate-900 rounded-full" />
                  <div className="w-1.5 h-2.5 bg-slate-900 rounded-full" />
                </div>
                <div className="w-6 h-3 border-b-2 border-slate-900 rounded-b-full mt-0.5" />
              </div>
            ) : avatar.face === 'pixel_heroic' ? (
              <div className="flex flex-col items-center">
                <div className="flex gap-3 mb-0.5">
                  <div className="w-2 h-0.5 bg-slate-900 -rotate-12" />
                  <div className="w-2 h-0.5 bg-slate-900 rotate-12" />
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-2 bg-slate-900 rounded-sm" />
                  <div className="w-1.5 h-2 bg-slate-900 rounded-sm" />
                </div>
                <div className="w-4 h-2 border-b-2 border-r-2 border-slate-900 rounded-br-md ml-1" />
              </div>
            ) : avatar.face === 'pixel_emerald_eyes' ? (
              <div className="flex flex-col items-center">
                <div className="flex gap-2">
                  <div className="w-2 h-2.5 bg-emerald-600 rounded-full border border-slate-900 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                  <div className="w-2 h-2.5 bg-emerald-600 rounded-full border border-slate-900 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                </div>
                <div className="w-3.5 h-1.5 bg-rose-500 rounded-full mt-1 border border-rose-700" />
              </div>
            ) : avatar.face === 'pixel_kawaii' ? (
              <div className="flex flex-col items-center">
                <div className="flex gap-2.5 text-xs font-black text-slate-900">
                  <span>&gt;</span>
                  <span>&lt;</span>
                </div>
                <div className="w-4 h-2.5 bg-rose-500 rounded-b-full mt-0.5 border border-rose-700" />
              </div>
            ) : avatar.face === 'pixel_cool' ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-3.5 bg-slate-900 rounded-xs flex items-center justify-around px-1 shadow-sm">
                  <div className="w-1.5 h-1 bg-sky-400 rounded-xs" />
                  <div className="w-1.5 h-1 bg-sky-400 rounded-xs" />
                </div>
                <div className="w-4 h-1 bg-slate-900 rounded-full mt-1.5 ml-1" />
              </div>
            ) : (
              <div className="text-xl">
                {FACES_CATALOG.find((f) => f.id === avatar.face)?.icon || '🙂'}
              </div>
            )}
          </div>
        </div>

        {/* Neck Accessory Layer */}
        {avatar.neckAccessory && avatar.neckAccessory !== 'none' && (
          <div className="absolute top-14 z-25">
            {avatar.neckAccessory === 'gold_chain' && (
              <div className="w-10 h-2 bg-amber-400 border border-amber-600 rounded-full shadow-sm" />
            )}
            {avatar.neckAccessory === 'punk_choker' && (
              <div className="w-8 h-1.5 bg-black border border-slate-700 rounded-xs flex justify-around">
                <div className="w-0.5 h-full bg-slate-200" />
                <div className="w-0.5 h-full bg-slate-200" />
              </div>
            )}
            {avatar.neckAccessory === 'silk_scarf' && (
              <div className="w-9 h-2.5 bg-red-600 rounded-sm shadow" />
            )}
          </div>
        )}

        {/* Shoulder Buddy Layer */}
        {avatar.shoulderAccessory && avatar.shoulderAccessory !== 'none' && (
          <div className="absolute top-12 -left-3 z-30 text-base drop-shadow-md">
            {shoulderInfo?.icon || '🐱'}
          </div>
        )}

        {/* Roblox R6 Torso + Block Arms Row */}
        <div className="flex items-start justify-center gap-1 mt-1 z-10">
          {/* Left Arm */}
          <div
            className="w-5 h-18 rounded-sm shadow-sm border-2 border-slate-800/35 overflow-hidden flex flex-col justify-between"
            style={{ backgroundColor: avatar.shirtPattern === 'pixel_offshoulder_teal' ? '#ffffff' : leftArmCol }}
          >
            {avatar.shirtPattern === 'pixel_offshoulder_teal' ? (
              <>
                <div className="w-full h-3" style={{ backgroundColor: skin }} />
                <div className="w-full h-11 bg-white flex flex-col items-center justify-center">
                  <div className="w-3.5 h-1.5 bg-orange-500 rounded-xs shadow-xs" />
                </div>
                <div className="w-full h-3.5" style={{ backgroundColor: skin }} />
              </>
            ) : (
              <>
                <div className="w-full h-8" style={{ backgroundColor: torsoCol }} />
                <div className="w-full h-4 rounded-b-xs" style={{ backgroundColor: skin }} />
              </>
            )}
          </div>

          {/* Main R6 Block Torso */}
          <div
            className="w-14 h-18 rounded-sm shadow-md border-2 border-slate-800/35 relative flex flex-col items-center justify-between p-1 overflow-hidden"
            style={{ backgroundColor: torsoCol }}
          >
            {/* Neckline / Collar / Off-shoulder scoop */}
            {avatar.shirtPattern === 'pixel_offshoulder_teal' ? (
              <div
                className="absolute top-0 left-0 w-8 h-4 rounded-br-xl"
                style={{ backgroundColor: skin }}
              >
                <div className="absolute top-0 left-2.5 w-1.5 h-full bg-purple-600 shadow-xs" />
              </div>
            ) : (
              <div
                className="w-5 h-1.5 rounded-b-sm border border-slate-800/20"
                style={{ backgroundColor: skin }}
              />
            )}

            {/* Shirt Decal / Graphic */}
            <div className="flex-1 flex items-center justify-center my-1">
              {avatar.shirtPattern === 'pixel_offshoulder_teal' && (
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="w-8 h-6 flex justify-around opacity-30">
                    <div className="w-0.5 h-full bg-teal-900" />
                    <div className="w-0.5 h-full bg-teal-900" />
                    <div className="w-0.5 h-full bg-teal-900" />
                  </div>
                </div>
              )}
              {avatar.shirtPattern === 'pixel_heart' && (
                <div className="w-6 h-6 rounded-md bg-white/90 border border-slate-700/20 flex items-center justify-center font-black text-red-600 text-xs shadow-inner">
                  R
                </div>
              )}
              {avatar.shirtPattern === 'pixel_detective_vest' && (
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-6 bg-red-600 rounded-b-xs" />
                </div>
              )}
              {avatar.shirtPattern === 'pixel_hoodie' && (
                <div className="w-7 h-5 rounded-xs bg-slate-900/20 border border-white/30 flex items-center justify-center text-[8px] font-mono text-white">
                  BLOX
                </div>
              )}
              {avatar.shirtPattern === 'pixel_cyber_armor' && (
                <div className="w-6 h-6 border-2 border-cyan-300 rounded-xs flex items-center justify-center text-cyan-300 text-[9px] font-mono">
                  ⚡
                </div>
              )}
              {avatar.shirtPattern === 'pixel_creeper' && (
                <div className="w-6 h-6 bg-green-700 border border-black flex items-center justify-center text-[9px]">
                  🟩
                </div>
              )}
              {avatar.shirtPattern === 'pixel_egypt_tunic' && (
                <div className="w-8 h-4 bg-amber-400 border border-amber-600 rounded-b-md" />
              )}
              {avatar.shirtPattern === 'pixel_star' && (
                <div className="text-xs text-amber-300 drop-shadow">⭐</div>
              )}
              {avatar.shirtPattern === 'pixel_stripes' && (
                <div className="w-full flex flex-col justify-around h-6">
                  <div className="w-full h-1 bg-black" />
                  <div className="w-full h-1 bg-white" />
                  <div className="w-full h-1 bg-black" />
                </div>
              )}
            </div>

            {/* Belt / Underlayer */}
            {avatar.shirtPattern === 'pixel_offshoulder_teal' ? (
              <div className="w-full h-3 bg-purple-600 rounded-xs flex items-center justify-center">
                <div className="w-full h-1 bg-purple-400 opacity-60" />
              </div>
            ) : (
              <div className="w-full h-2.5 bg-slate-900/80 rounded-xs flex items-center justify-center">
                <div className="w-2.5 h-1.5 bg-amber-400 rounded-xs" />
              </div>
            )}
          </div>

          {/* Right Arm */}
          <div
            className="w-5 h-18 rounded-sm shadow-sm border-2 border-slate-800/35 overflow-hidden flex flex-col justify-between"
            style={{ backgroundColor: avatar.shirtPattern === 'pixel_offshoulder_teal' ? '#ffffff' : rightArmCol }}
          >
            {avatar.shirtPattern === 'pixel_offshoulder_teal' ? (
              <>
                <div className="w-full h-3" style={{ backgroundColor: skin }} />
                <div className="w-full h-11 bg-white flex flex-col items-center justify-center">
                  <div className="w-3.5 h-1.5 bg-orange-500 rounded-xs shadow-xs" />
                </div>
                <div className="w-full h-3.5" style={{ backgroundColor: skin }} />
              </>
            ) : (
              <>
                <div className="w-full h-8" style={{ backgroundColor: torsoCol }} />
                <div className="w-full h-4 rounded-b-xs" style={{ backgroundColor: skin }} />
              </>
            )}
          </div>
        </div>

        {/* Roblox R6 Block Legs Row */}
        <div className="flex items-start justify-center gap-1 mt-0.5 z-10">
          {/* Left Leg */}
          <div
            className="w-6.5 h-16 rounded-sm shadow-sm border-2 border-slate-800/35 overflow-hidden flex flex-col justify-between"
            style={{ backgroundColor: leftLegCol }}
          >
            {avatar.pantsPattern === 'pixel_denim_skirt' ? (
              <>
                <div className="w-full h-3 bg-slate-900 border-b border-purple-500" />
                <div className="w-full h-3" style={{ backgroundColor: skin }} />
                <div className="w-full h-6 bg-slate-800" />
                <div className="w-full h-4 bg-zinc-900 border-t-2 border-white flex items-center justify-center">
                  <div className="w-3 h-1 bg-white rounded-full" />
                </div>
              </>
            ) : (
              <>
                {avatar.pantsPattern === 'pixel_ripped_jeans' && (
                  <div className="w-full flex flex-col items-center justify-center my-auto">
                    <div className="w-3 h-0.5 bg-slate-400" />
                  </div>
                )}
                <div className="w-full flex-1" />
                <div className="w-full h-4.5 rounded-b-xs border-t border-slate-800/30" style={{ backgroundColor: shoes }} />
              </>
            )}
          </div>

          {/* Right Leg */}
          <div
            className="w-6.5 h-16 rounded-sm shadow-sm border-2 border-slate-800/35 overflow-hidden flex flex-col justify-between"
            style={{ backgroundColor: rightLegCol }}
          >
            {avatar.pantsPattern === 'pixel_denim_skirt' ? (
              <>
                <div className="w-full h-3 bg-slate-900 border-b border-purple-500" />
                <div className="w-full h-3" style={{ backgroundColor: skin }} />
                <div className="w-full h-6 bg-slate-800" />
                <div className="w-full h-4 bg-zinc-900 border-t-2 border-white flex items-center justify-center">
                  <div className="w-3 h-1 bg-white rounded-full" />
                </div>
              </>
            ) : (
              <>
                {avatar.pantsPattern === 'pixel_ripped_jeans' && (
                  <div className="w-full flex flex-col items-center justify-center my-auto">
                    <div className="w-3 h-0.5 bg-slate-400" />
                  </div>
                )}
                <div className="w-full flex-1" />
                <div className="w-full h-4.5 rounded-b-xs border-t border-slate-800/30" style={{ backgroundColor: shoes }} />
              </>
            )}
          </div>
        </div>

        {/* Back Accessory Icon Preview */}
        {avatar.accessory && avatar.accessory !== 'none' && (
          <div className="absolute -right-3 bottom-12 z-30 text-xl drop-shadow-md">
            {accInfo?.icon || '🎒'}
          </div>
        )}
      </div>
    </div>
  );
};
