import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { InteractiveObjectData } from '../types';
import { sound } from '../services/soundEngine';

interface InteractPromptProps {
  objectData: InteractiveObjectData | null;
  onInteract: () => void;
}

export const InteractPrompt: React.FC<InteractPromptProps> = ({ objectData, onInteract }) => {
  if (!objectData) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none animate-fadeIn">
      <button
        onClick={() => {
          sound.playUiClick();
          onInteract();
        }}
        className="flex items-center gap-2.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-200 text-slate-950 rounded-2xl shadow-2xl border-2 border-amber-300 font-extrabold text-xs transition-all active:scale-95 group"
      >
        <span className="w-5 h-5 rounded-lg bg-slate-950 text-amber-300 flex items-center justify-center font-mono font-black text-[11px] border border-amber-300/40">
          E
        </span>

        <span className="tracking-tight">{objectData.prompt} ({objectData.name})</span>

        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
