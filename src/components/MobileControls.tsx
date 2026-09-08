import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Gamepad2,
} from 'lucide-react';
import { sound } from '../services/soundEngine';

interface MobileControlsProps {
  onMove: (x: number, z: number) => void;
  onJump: () => void;
  onInteract: () => void;
  hasInteractable: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onJump,
  onInteract,
  hasInteractable,
}) => {
  const [activeDirs, setActiveDirs] = useState<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }>({ up: false, down: false, left: false, right: false });

  const [isSprint, setIsSprint] = useState(false);
  const [showOnScreenControls, setShowOnScreenControls] = useState(true);

  // Sync directional state to engine onMove
  const dirsRef = useRef(activeDirs);
  dirsRef.current = activeDirs;

  useEffect(() => {
    let x = 0;
    let z = 0;
    if (activeDirs.left) x -= 1;
    if (activeDirs.right) x += 1;
    if (activeDirs.up) z -= 1;
    if (activeDirs.down) z += 1;

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      x *= 0.7071;
      z *= 0.7071;
    }

    if (isSprint) {
      x *= 1.4;
      z *= 1.4;
    }

    onMove(x, z);
  }, [activeDirs, isSprint, onMove]);

  const setDir = (dir: 'up' | 'down' | 'left' | 'right', state: boolean) => {
    setActiveDirs((prev) => ({ ...prev, [dir]: state }));
  };

  const handlePointerDown = (dir: 'up' | 'down' | 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDir(dir, true);
  };

  const handlePointerUp = (dir: 'up' | 'down' | 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setDir(dir, false);
  };

  return (
    <>
      {/* On-Screen Toggle Pill (Top-Right or Bottom-Bar) */}
      <button
        onClick={() => setShowOnScreenControls((prev) => !prev)}
        className="fixed bottom-24 left-4 z-30 p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700/60 rounded-xl backdrop-blur-md text-[10px] font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer pointer-events-auto"
        title="Toggle On-Screen Touch / Click Controls"
      >
        <Gamepad2 className="w-4 h-4 text-cyan-400" />
        <span className="hidden sm:inline">
          {showOnScreenControls ? 'Hide On-Screen D-Pad' : 'Show On-Screen D-Pad'}
        </span>
      </button>

      {showOnScreenControls && (
        <>
          {/* ========================================================================= */}
          {/* LEFT: VIRTUAL D-PAD (Walk Forward / Back / Left / Right) */}
          {/* ========================================================================= */}
          <div className="fixed bottom-20 left-6 z-30 pointer-events-auto select-none touch-none flex flex-col items-center">
            <div className="relative w-36 h-36 bg-slate-900/75 backdrop-blur-md rounded-full border-2 border-cyan-500/30 p-1.5 shadow-2xl flex items-center justify-center">
              {/* UP / FORWARD */}
              <button
                onPointerDown={handlePointerDown('up')}
                onPointerUp={handlePointerUp('up')}
                onPointerCancel={handlePointerUp('up')}
                className={`absolute top-1.5 w-11 h-11 rounded-t-2xl flex items-center justify-center transition-all cursor-pointer ${
                  activeDirs.up
                    ? 'bg-cyan-500 text-white shadow-lg scale-95 ring-2 ring-cyan-300'
                    : 'bg-slate-800/90 text-cyan-300 active:bg-cyan-600 hover:bg-slate-700'
                }`}
                aria-label="Walk Forward"
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* DOWN / BACKWARD */}
              <button
                onPointerDown={handlePointerDown('down')}
                onPointerUp={handlePointerUp('down')}
                onPointerCancel={handlePointerUp('down')}
                className={`absolute bottom-1.5 w-11 h-11 rounded-b-2xl flex items-center justify-center transition-all cursor-pointer ${
                  activeDirs.down
                    ? 'bg-cyan-500 text-white shadow-lg scale-95 ring-2 ring-cyan-300'
                    : 'bg-slate-800/90 text-cyan-300 active:bg-cyan-600 hover:bg-slate-700'
                }`}
                aria-label="Walk Backward"
              >
                <ArrowDown className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* LEFT */}
              <button
                onPointerDown={handlePointerDown('left')}
                onPointerUp={handlePointerUp('left')}
                onPointerCancel={handlePointerUp('left')}
                className={`absolute left-1.5 w-11 h-11 rounded-l-2xl flex items-center justify-center transition-all cursor-pointer ${
                  activeDirs.left
                    ? 'bg-cyan-500 text-white shadow-lg scale-95 ring-2 ring-cyan-300'
                    : 'bg-slate-800/90 text-cyan-300 active:bg-cyan-600 hover:bg-slate-700'
                }`}
                aria-label="Step Left"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* RIGHT */}
              <button
                onPointerDown={handlePointerDown('right')}
                onPointerUp={handlePointerUp('right')}
                onPointerCancel={handlePointerUp('right')}
                className={`absolute right-1.5 w-11 h-11 rounded-r-2xl flex items-center justify-center transition-all cursor-pointer ${
                  activeDirs.right
                    ? 'bg-cyan-500 text-white shadow-lg scale-95 ring-2 ring-cyan-300'
                    : 'bg-slate-800/90 text-cyan-300 active:bg-cyan-600 hover:bg-slate-700'
                }`}
                aria-label="Step Right"
              >
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* CENTER HUB */}
              <div className="w-8 h-8 rounded-full bg-slate-950/80 border border-cyan-400/40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-60" />
              </div>
            </div>

            <span className="text-[9px] font-mono text-cyan-300/70 mt-1 uppercase font-bold tracking-wider">
              D-PAD / MOVE
            </span>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: ACTION BUTTONS (Examine, Jump, Sprint) */}
          {/* ========================================================================= */}
          <div className="fixed bottom-20 right-6 z-30 pointer-events-auto select-none flex flex-col gap-2.5 items-end">
            {/* EXAMINE / INTERACT BUTTON */}
            {hasInteractable && (
              <button
                onClick={() => {
                  sound.playUiClick();
                  onInteract();
                }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-2xl border-2 border-white/60 active:scale-90 transition-all animate-bounce cursor-pointer"
                title="Interact / Examine (E or Enter)"
              >
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[8px] tracking-wider uppercase font-black">EXAMINE</span>
              </button>
            )}

            {/* SPRINT BUTTON */}
            <button
              onClick={() => setIsSprint((prev) => !prev)}
              className={`w-12 h-12 rounded-2xl font-black flex flex-col items-center justify-center shadow-xl border-2 transition-all cursor-pointer active:scale-95 ${
                isSprint
                  ? 'bg-amber-500 border-amber-300 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-slate-900/85 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Sprint Mode (Shift)"
            >
              <Zap className="w-4 h-4" />
              <span className="text-[8px] tracking-wider uppercase font-bold">SPRINT</span>
            </button>

            {/* JUMP BUTTON */}
            <button
              onClick={() => {
                sound.playJump();
                onJump();
              }}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-cyan-600 text-cyan-300 hover:text-white font-black flex flex-col items-center justify-center shadow-2xl border-2 border-cyan-500/40 active:scale-95 transition-all cursor-pointer"
              title="Jump (Space)"
            >
              <ArrowUp className="w-5 h-5 stroke-[3]" />
              <span className="text-[9px] tracking-wider uppercase font-bold">JUMP</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
