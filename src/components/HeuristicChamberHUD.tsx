import React, { useState } from 'react';
import {
  Compass,
  Cpu,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin,
} from 'lucide-react';
import {
  AStarCandidateNode,
  HEURISTIC_LEVEL1_STAGES,
  HEURISTIC_TEACHING_CARD,
  HeuristicDecisionStage,
} from '../game/heuristicChamberData';

interface HeuristicChamberHUDProps {
  stageIndex?: number; // 0: Start Screen, 1: Decision 1, 2: Decision 2, 3: Decision 3, 4: Teaching Moment, 5: Target Located, 6: Target Reached, 7: Level Complete
  stage?: number;
  feedback: {
    isError: boolean;
    title: string;
    explanation: string;
  } | null;
  playerTransform?: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
  onStepCandidate?: (nodeId: string) => void;
  onBeginSearch: () => void;
  onDismissTeaching: () => void;
  onRestartLevel: () => void;
  onReturnToHub?: () => void;
  onExitToHome?: () => void;
}

export const HeuristicChamberHUD: React.FC<HeuristicChamberHUDProps> = ({
  stageIndex,
  stage,
  feedback,
  playerTransform,
  onBeginSearch,
  onDismissTeaching,
  onRestartLevel,
  onReturnToHub,
  onExitToHome,
}) => {
  const currentStage = stageIndex ?? stage ?? 0;
  const pt = playerTransform || { x: -15, y: 0, z: 0, yaw: 0 };
  const handleExit = onReturnToHub || onExitToHome || (() => {});

  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [showTacticalMap, setShowTacticalMap] = useState(true);

  const currentDecisionStage: HeuristicDecisionStage | undefined =
    currentStage >= 1 && currentStage <= 3
      ? HEURISTIC_LEVEL1_STAGES[currentStage - 1]
      : undefined;

  // Heading calculation for high-tech HUD compass
  const headingDeg = Math.round(((-pt.yaw * 180) / Math.PI + 360) % 360);
  const cardinalDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinalIndex = Math.round(headingDeg / 45) % 8;
  const cardinalText = cardinalDirections[cardinalIndex];

  // Target coordinates in Level 1 room (X: 14.0, Z: 0.0)
  const targetX = 14.0;
  const targetZ = 0.0;
  const distToTarget = Math.sqrt(
    (targetX - pt.x) ** 2 + (targetZ - pt.z) ** 2
  ).toFixed(1);

  // Exit door coordinates (X: 18.5, Z: 0.0)
  const exitX = 18.5;
  const exitZ = 0.0;
  const distToExit = Math.sqrt(
    (exitX - pt.x) ** 2 + (exitZ - pt.z) ** 2
  ).toFixed(1);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. START SCREEN MODAL (Initial Entry)                                     */}
      {/* ========================================================================= */}
      {currentStage === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 pointer-events-auto animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl border-2 border-amber-500/50 bg-slate-900/95 p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center text-slate-100 space-y-4">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-widest uppercase">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              HEURISTIC CHAMBER · LEVEL 1
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              FIRST HEURISTIC
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              A navigation system is searching for the <span className="text-rose-400 font-bold">TARGET</span>.
            </p>

            {/* A* Formula Core Box */}
            <div className="rounded-2xl border border-amber-500/40 bg-slate-950/80 p-4 space-y-2 text-left">
              <div className="text-[11px] font-black tracking-wider text-amber-400 uppercase">
                A* COMBINES:
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold text-amber-300">g(n)</span>
                  <span className="text-slate-400">= cost already travelled</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold text-cyan-300">h(n)</span>
                  <span className="text-slate-400">= estimated cost to TARGET</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-white font-bold text-sm">
                  <span className="text-emerald-400 font-black">f(n) = g(n) + h(n)</span>
                  <span className="text-xs text-slate-400 font-normal">total evaluation</span>
                </div>
              </div>
            </div>

            {/* Mission Objective */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <span className="font-bold text-amber-300">Your task: </span>
              Choose the node with the <span className="font-black text-emerald-400">BEST f(n)</span> value.
            </div>

            {/* Begin Button */}
            <button
              onClick={onBeginSearch}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>[ BEGIN SEARCH ]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP HUD: A* FORMULA DISPLAY & STATUS                                   */}
      {/* ========================================================================= */}
      <div className="w-full flex items-start justify-between gap-3 pointer-events-auto">
        {/* Left: Formula & Live Heuristic State */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-slate-950/90 px-3.5 py-2 shadow-xl backdrop-blur-md">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-xs">
              f(n)
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  A* EVALUATION FORMULA
                </span>
                <span className="font-mono text-xs font-black text-white">
                  f(n) = <span className="text-amber-300">g(n)</span> + <span className="text-cyan-300">h(n)</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400">
                Total Estimated Cost = Actual Path Cost + Heuristic Remaining
              </span>
            </div>
          </div>
        </div>

        {/* Right: Restart Level Button & Help */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRestartLevel}
            title="Reload Level 1 Chamber"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTER / FLOATING FEEDBACK NOTIFICATIONS (Correct / Wrong)             */}
      {/* ========================================================================= */}
      {feedback && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-md w-full px-4 animate-fadeIn">
          <div
            className={`rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-md transition-all ${
              feedback.isError
                ? 'border-rose-500/70 bg-slate-950/95 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.35)]'
                : 'border-emerald-500/70 bg-slate-950/95 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback.isError ? (
                <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div
                  className={`text-sm font-black tracking-wide ${
                    feedback.isError ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {feedback.title}
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                  {feedback.explanation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TEACHING MOMENT OVERLAY (After completing all 3 decisions)              */}
      {/* ========================================================================= */}
      {currentStage === 4 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 pointer-events-auto animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl border-2 border-emerald-500/60 bg-slate-900/95 p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] text-center text-slate-100 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {HEURISTIC_TEACHING_CARD.title}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 text-left">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                A* balances:
              </div>

              <div className="space-y-2 font-mono text-sm">
                <div className="rounded-xl bg-slate-900/80 border border-amber-500/30 p-2.5 flex items-center justify-between">
                  <span className="text-amber-400 font-black">{HEURISTIC_TEACHING_CARD.gLabel}</span>
                  <span className="text-xs text-slate-300">{HEURISTIC_TEACHING_CARD.gDesc}</span>
                </div>

                <div className="text-center font-black text-slate-400 text-base">+</div>

                <div className="rounded-xl bg-slate-900/80 border border-cyan-500/30 p-2.5 flex items-center justify-between">
                  <span className="text-cyan-400 font-black">{HEURISTIC_TEACHING_CARD.hLabel}</span>
                  <span className="text-xs text-slate-300">{HEURISTIC_TEACHING_CARD.hDesc}</span>
                </div>

                <div className="text-center font-black text-slate-400 text-base">=</div>

                <div className="rounded-xl bg-slate-900/80 border border-emerald-500/50 p-2.5 flex items-center justify-between shadow">
                  <span className="text-emerald-400 font-black">{HEURISTIC_TEACHING_CARD.fLabel}</span>
                  <span className="text-xs text-emerald-200 font-bold">{HEURISTIC_TEACHING_CARD.fDesc}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-emerald-300 font-bold text-center">
                {HEURISTIC_TEACHING_CARD.rule}
              </div>
            </div>

            <button
              onClick={onDismissTeaching}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>[ PROCEED TO TARGET ]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TARGET ACTIVATION & EXIT BANNER (Stages 5 & 6)                          */}
      {/* ========================================================================= */}
      {currentStage === 5 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4 pointer-events-auto animate-fadeIn">
          <div className="rounded-2xl border-2 border-rose-500/80 bg-slate-950/95 p-4 shadow-[0_0_35px_rgba(244,63,94,0.4)] text-center text-white space-y-1 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-rose-400 uppercase">
              <Target className="w-4 h-4 text-rose-500 animate-pulse" />
              TARGET LOCATED
            </div>
            <div className="text-xs font-medium text-slate-300">
              The A* navigation system has identified the best route.
            </div>
            <div className="pt-1 text-[11px] font-mono text-cyan-300">
              Follow the illuminated cyan energy path directly to the <span className="text-rose-400 font-bold">RED TARGET</span>!
            </div>
          </div>
        </div>
      )}

      {currentStage === 6 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4 pointer-events-auto animate-fadeIn">
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-slate-950/95 p-4 shadow-[0_0_35px_rgba(16,185,129,0.4)] text-center text-white space-y-1 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              TARGET REACHED ✓ · A* ROUTE COMPLETE
            </div>
            <div className="text-xs font-medium text-slate-300">
              East Security Exit Gateway is UNLOCKED!
            </div>
            <div className="pt-1 text-[11px] font-mono text-emerald-300">
              Walk through the open exit door on the East wall to complete Level 1.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LEVEL 1 COMPLETE VICTORY MODAL                                         */}
      {/* ========================================================================= */}
      {currentStage === 7 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 pointer-events-auto animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl border-2 border-emerald-500/80 bg-slate-900/95 p-6 sm:p-7 shadow-[0_0_50px_rgba(16,185,129,0.4)] text-center text-slate-100 space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 text-3xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              🏆
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                LEVEL 1 COMPLETE ✓
              </h2>
              <p className="text-sm font-bold text-emerald-400">
                FIRST HEURISTIC MASTERED
              </p>
              <div className="text-xs text-slate-400 pt-1">
                You successfully guided the A* navigation system by selecting the optimal f(n) nodes.
              </div>
            </div>

            {/* Rewards Banner */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 flex items-center justify-around font-mono text-xs">
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">COINS EARNED</span>
                <span className="text-amber-400 font-bold text-sm">+250 🪙</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">XP EARNED</span>
                <span className="text-cyan-400 font-bold text-sm">+80 XP</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-center">
                <span className="text-slate-400 block text-[10px]">STATUS</span>
                <span className="text-emerald-400 font-bold text-sm">LEVEL 1 MASTERED</span>
              </div>
            </div>

            <button
              onClick={handleExit}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>RETURN TO GAME HUB</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. BOTTOM HUD: ACTIVE A* DECISION PANEL & TACTICAL RADAR                  */}
      {/* ========================================================================= */}
      {currentDecisionStage && currentStage >= 1 && currentStage <= 3 && (
        <div className="w-full flex items-end justify-between gap-4 pointer-events-auto">
          {/* Main Decision Card */}
          <div className="max-w-xl w-full rounded-2xl border border-amber-500/50 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black text-amber-300">
                  STAGE {currentDecisionStage.stageNumber} OF 3
                </span>
                <span className="text-xs font-black tracking-wide text-white">
                  {currentDecisionStage.stageTitle}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-emerald-400">
                f(n) = g(n) + h(n)
              </span>
            </div>

            {/* Question prompt */}
            <div className="text-xs font-bold text-slate-200">
              {currentDecisionStage.question}
            </div>

            {/* Physical candidate nodes preview */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {currentDecisionStage.candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-center space-y-1 hover:border-amber-500/40 transition-colors"
                >
                  <div className="text-xs font-black text-amber-400">{cand.name}</div>
                  <div className="space-y-0.5 font-mono text-[10px]">
                    <div className="text-slate-400">
                      g = <span className="text-white font-bold">{cand.g}</span>
                    </div>
                    <div className="text-slate-400">
                      h = <span className="text-cyan-300 font-bold">{cand.h}</span>
                    </div>
                    <div className="pt-0.5 border-t border-slate-800 text-emerald-400 font-bold">
                      f = {cand.f}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Physical 3D instruction note */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/60 rounded-xl px-3 py-1.5 border border-slate-800/80">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <MapPin className="w-3 h-3 text-amber-400" />
                Physical 3D Choice:
              </span>
              <span>Walk into the glowing floor circle to select your node</span>
            </div>
          </div>

          {/* Tactical Radar / Compass Widget */}
          <div className="hidden sm:flex flex-col w-72 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-cyan-300 uppercase">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                NAVIGATION RADAR
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-300">
                {cardinalText} {String(headingDeg).padStart(3, '0')}°
              </span>
            </div>

            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">POSITION:</span>
                <span>X:{pt.x.toFixed(1)} Z:{pt.z.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-rose-400 font-bold">TARGET DIST:</span>
                <span className="text-rose-300 font-bold">{distToTarget}m</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-emerald-400 font-bold">EXIT DOOR:</span>
                <span className="text-emerald-300 font-bold">{distToExit}m</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
