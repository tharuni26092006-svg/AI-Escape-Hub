import React from 'react';
import { X, Gamepad2, Sparkles, Key, Eye, HelpCircle } from 'lucide-react';
import { sound } from '../services/soundEngine';

interface ControlsHelpProps {
  onClose: () => void;
}

export const ControlsHelp: React.FC<ControlsHelpProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/90 border-b border-slate-700 text-white">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold tracking-tight">Escape Room Guide & Controls</h2>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="p-1.5 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition-all active:scale-95 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls list */}
        <div className="p-5 space-y-2.5 text-xs text-slate-200">
          <div className="flex items-center justify-between p-2.5 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="font-semibold text-slate-300">Move Character</span>
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg font-mono font-bold text-amber-300 border border-slate-700">
              W A S D / Arrows
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="font-semibold text-slate-300">Interact with Puzzles & Props</span>
            <span className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg font-mono font-black border border-amber-300">
              E / Enter (or Click Prompt)
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="font-semibold text-slate-300">Jump / Climb Props</span>
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg font-mono font-bold text-amber-300 border border-slate-700">
              SPACE
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="font-semibold text-slate-300">Orbit Room Camera</span>
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg font-mono font-bold text-amber-300 border border-slate-700">
              Click & Drag (Touch Drag)
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="font-semibold text-slate-300">Zoom Camera</span>
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg font-mono font-bold text-amber-300 border border-slate-700">
              Mouse Scroll Wheel
            </span>
          </div>

          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-[11px] text-amber-200 leading-relaxed space-y-1">
            <p><strong>🕵️ Escape Objective:</strong></p>
            <p>Explore the chamber, search the furniture for keys, inspect diary notes, crack the safe code, restore power to the mainframe terminal, and swipe the master security keycard to unlatch the vault blast doors!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
