import React, { useState } from 'react';
import {
  BfsStepState,
  LEVEL3_DECISION_STAGES,
  LEVEL4_DECISION_STAGES,
  LEVEL5_DECISION_STAGES,
  LEVEL5_MAZE_GRID,
  LEVEL5_START_CELL,
  LEVEL5_TARGET_CELL,
  LEVEL5_EXIT_CELL,
  LEVEL5_SHORTEST_PATH_COORDS,
} from '../game/searchMazeLogic';
import {
  Compass,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Play,
  Navigation,
  Trophy,
  DoorOpen,
  MapPin,
  Lock,
  Unlock,
  AlertTriangle,
} from 'lucide-react';

interface SearchMazeHUDProps {
  currentLevel?: number;
  bfsSteps: BfsStepState[];
  currentStepIndex: number;
  isSearching: boolean;
  targetFound: boolean;
  targetReached: boolean;
  levelExitCrossed: boolean;
  playerTransform?: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    avatarRotationY: number;
  };
  level3StageIndex?: number;
  level3Feedback?: { message: string; isError: boolean } | null;
  level3RuleReminder?: boolean;
  onDismissRuleReminder?: () => void;
  onCircleClick?: (nodeId: string) => void;
  onStartBfs: () => void;
  onResetBfs: () => void;
  onRestartLevel: () => void;
  onNextLevel?: () => void;
  onOpenLevel3Terminal?: () => void;
}

export const SearchMazeHUD: React.FC<SearchMazeHUDProps> = ({
  currentLevel = 1,
  bfsSteps,
  currentStepIndex,
  isSearching,
  targetFound,
  targetReached,
  levelExitCrossed,
  playerTransform,
  level3StageIndex = 0,
  level3Feedback = null,
  level3RuleReminder = false,
  onDismissRuleReminder,
  onCircleClick,
  onStartBfs,
  onResetBfs,
  onRestartLevel,
  onNextLevel,
  onOpenLevel3Terminal,
}) => {
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);

  const isLevel5 = currentLevel === 5;
  const isLevel4 = currentLevel === 4;
  const isLevel3 = currentLevel === 3;
  const isLevel2 = currentLevel === 2;
  const isDecisionLevel = isLevel3 || isLevel4;
  const decisionStages = isLevel4 ? LEVEL4_DECISION_STAGES : LEVEL3_DECISION_STAGES;

  // Live Player Positioning in Room Space
  // Level 1: [-12, 12] x [-12, 12] (24x24m)
  // Level 2: [-16, 16] x [-11, 11] (32x22m)
  // Level 3: [-18, 18] x [-14, 14] (36x28m)
  // Level 4: [-22, 22] x [-17, 17] (44x34m)
  // Level 5: [-24, 24] x [-17, 17] (19x13 corridor grid)
  const defaultStartX = isLevel5 ? -16.8 : (isLevel4 ? -16.0 : isLevel3 ? -13.0 : isLevel2 ? -8.0 : -4.0);
  const defaultStartZ = 0.0;

  const playerX = playerTransform?.x ?? defaultStartX;
  const playerZ = playerTransform?.z ?? (isLevel5 || isLevel4 || isLevel3 || isLevel2 ? 0.0 : 4.0);
  const playerYaw = playerTransform?.yaw ?? (isLevel5 || isLevel4 || isLevel3 || isLevel2 ? -Math.PI / 2 : 0);

  // Normalized percentages on room floor
  const pCol5 = (playerX / 2.1) + 9;
  const pRow5 = (playerZ / 2.1) + 6;

  const playerLeft = isLevel5
    ? Math.min(Math.max(((pCol5 + 0.5) / 19) * 100, 2), 98)
    : isLevel4
    ? Math.min(Math.max(((playerX + 22) / 44) * 100, 3), 97)
    : isLevel3
    ? Math.min(Math.max(((playerX + 18) / 36) * 100, 3), 97)
    : isLevel2
    ? Math.min(Math.max(((playerX + 16) / 32) * 100, 3), 97)
    : Math.min(Math.max(((playerX + 12) / 24) * 100, 4), 96);

  const playerTop = isLevel5
    ? Math.min(Math.max(((pRow5 + 0.5) / 13) * 100, 2), 98)
    : isLevel4
    ? Math.min(Math.max(((playerZ + 17) / 34) * 100, 4), 96)
    : isLevel3
    ? Math.min(Math.max(((playerZ + 14) / 28) * 100, 4), 96)
    : isLevel2
    ? Math.min(Math.max(((playerZ + 11) / 22) * 100, 4), 96)
    : Math.min(Math.max(((playerZ + 12) / 24) * 100, 4), 96);

  // Player Heading Angle (0° = North, 90° = East, 180° = South, 270° = West)
  const headingDeg = Math.round(((-playerYaw * 180) / Math.PI + 360) % 360);

  const getCardinal = (deg: number) => {
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return cardinals[idx];
  };
  const cardinalText = getCardinal(headingDeg);

  // Live Real-Time Distance & Bearing to Target and Exit Door
  const targetX = isLevel5 ? 14.7 : (isLevel4 ? 11.5 : isLevel3 ? 8 : isLevel2 ? 8 : 4);
  const targetZ = isLevel5 ? 0.0 : (isLevel4 ? -5.5 : isLevel3 ? -6 : 0);
  const exitX = isLevel5 ? 20.4 : (isLevel4 ? 20.0 : isLevel3 ? 16.5 : isLevel2 ? 14.5 : 0);
  const exitZ = 0;

  const distToExit = Math.hypot(playerX - exitX, playerZ - exitZ).toFixed(1);
  const distToTarget = Math.hypot(playerX - targetX, playerZ - targetZ).toFixed(1);

  // Relative heading angle from player to Exit Door
  const dxExit = exitX - playerX;
  const dzExit = exitZ - playerZ;
  const angleToExitWorld = (Math.atan2(dxExit, -dzExit) * 180) / Math.PI;
  const exitBearingWorld = Math.round((angleToExitWorld + 360) % 360);
  const relativeExitAngle = Math.round((angleToExitWorld - headingDeg + 360) % 360);

  // Relative heading angle from player to Target
  const dxTarget = targetX - playerX;
  const dzTarget = targetZ - playerZ;
  const angleToTargetWorld = (Math.atan2(dxTarget, -dzTarget) * 180) / Math.PI;
  const targetBearingWorld = Math.round((angleToTargetWorld + 360) % 360);
  const relativeTargetAngle = Math.round((angleToTargetWorld - headingDeg + 360) % 360);

  // Level 5 integer cell coordinates
  const gridCol5 = Math.min(Math.max(Math.round(pCol5), 0), 18);
  const gridRow5 = Math.min(Math.max(Math.round(pRow5), 0), 12);

  const currentStep: BfsStepState | undefined =
    currentStepIndex >= 0 && currentStepIndex < bfsSteps.length
      ? bfsSteps[currentStepIndex]
      : undefined;

  const queueItems = currentStep ? currentStep.queue : ['S'];
  const visitedItems = currentStep ? currentStep.visited : [];
  const activeNode = currentStep ? currentStep.activeNode : null;
  const currentLayer = currentStep ? currentStep.layer : 0;

  return (
    <div id="search_maze_hud_root" className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden">
      {/* 0. PERSISTENT TOP WAYPOINT & EXIT DOOR DIRECTION BAR */}
      <div className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-2.5 rounded-full border border-emerald-500/50 bg-slate-950/90 px-4 py-1.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <DoorOpen className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>EXIT DOOR:</span>
        </div>
        <span className="text-xs font-semibold text-slate-100 flex items-center gap-1">
          <span className="text-emerald-400 font-black">
            {isLevel5 || isLevel4 || isLevel3 ? '▲ EAST WALL (GATEWAY)' : isLevel2 ? '▲ EAST WALL' : '▲ NORTH WALL'}
          </span>
          <span className="text-slate-400">
            ({distToExit}m away • Heading:{' '}
            <span
              className="inline-block transition-transform duration-75 text-emerald-300 font-bold"
              style={{ transform: `rotate(${relativeExitAngle}deg)` }}
            >
              ▲
            </span>
            )
          </span>
        </span>
        <div className="flex items-center gap-1.5 ml-1">
          {targetReached ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <Unlock className="h-3 w-3" /> UNLOCKED — STEP THROUGH
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
              <Lock className="h-3 w-3" />
              {isDecisionLevel ? 'REACH RED TARGET TO UNLOCK' : 'REACH TARGET [G] TO UNLOCK'}
            </span>
          )}
        </div>
      </div>

      {/* 1. TOP-LEFT MISSION BADGE & OBJECTIVE */}
      <div className="pointer-events-auto absolute left-4 top-16 flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-950/85 px-4 py-2.5 shadow-lg backdrop-blur-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
              {isLevel5
                ? 'LEVEL 5 — SHORTEST PATH CHALLENGE'
                : isLevel4
                ? 'LEVEL 4 — DEAD-END TRAP'
                : isLevel3
                ? 'LEVEL 3 — BFS DECISION PATH'
                : isLevel2
                ? 'LEVEL 2 — BRANCHING MAZE'
                : 'LEVEL 1 — FIRST SEARCH'}
            </div>
            <div className="text-sm font-bold text-white">
              {isLevel5
                ? 'Find Shortest Path by Graph Depth'
                : isLevel4
                ? 'Traverse Branches & Avoid Dead Ends'
                : isLevel3
                ? 'Analyze Queue & Step Into Circles'
                : isLevel2
                ? 'Layer-by-Layer Branch Search'
                : 'Find Target Using BFS'}
            </div>
          </div>
          <button
            onClick={() => setShowInstructions(true)}
            title="View Room & Exit Guide"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 transition hover:border-cyan-400 hover:text-white"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        {/* Current Objective Tip */}
        <div className="max-w-xs rounded-lg border border-slate-800 bg-slate-950/85 px-3 py-2 text-xs text-slate-300 backdrop-blur-sm">
          {isDecisionLevel ? (
            !targetReached ? (
              <span className="text-amber-300">
                Decision Stage {Math.min((level3StageIndex ?? 0) + 1, decisionStages.length)} / {decisionStages.length}:{' '}
                {isLevel5
                  ? 'Analyze graph depth & step into shortest path circle!'
                  : isLevel4
                  ? 'Step into circle matching front of BFS queue!'
                  : 'Step into the circle matching the BFS queue order!'}
              </span>
            ) : (
              <span className="text-emerald-300 font-semibold">
                RED TARGET REACHED! East Exit Gateway is open — step through to finish!
              </span>
            )
          ) : (
            <>
              {!isSearching && !targetFound && (
                <span className="text-emerald-400">
                  Approach the green START terminal and press <span className="font-bold underline">[E]</span> or click <span className="font-bold underline">START BFS</span>.
                </span>
              )}
              {isSearching && !targetFound && (
                <span className="text-cyan-300">
                  {isLevel2
                    ? 'BFS exploring both branches level-by-level before moving deeper...'
                    : 'Breadth-First Search expanding outward layer by layer...'}
                </span>
              )}
              {targetFound && !targetReached && (
                <span className="text-amber-300 font-medium">
                  TARGET FOUND! Follow the glowing path to the RED TARGET [G].
                </span>
              )}
              {targetReached && !levelExitCrossed && (
                <span className="text-emerald-300 font-medium">
                  {isLevel2
                    ? 'Exit Gateway is OPEN! Proceed through the East Gateway.'
                    : 'Exit Door is OPEN! Proceed through the North Gateway into Level 2.'}
                </span>
              )}
            </>
          )}
        </div>

        {/* ALIVE ROOM COMPASS & TACTICAL RADAR */}
        <div className="w-80 rounded-2xl border border-cyan-500/50 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md">
          {/* Compass Header & Live Heading */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
              </div>
              <span className="text-[11px] font-black tracking-wider text-cyan-300">ALIVE ROOM COMPASS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-950/90 border border-cyan-500/60 px-2 py-0.5 font-mono text-[11px] font-black text-cyan-300 shadow">
                {cardinalText} {String(headingDeg).padStart(3, '0')}°
              </span>
              <button
                onClick={() => setShowMiniMap(!showMiniMap)}
                className="text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                {showMiniMap ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* ROTATING COMPASS ROSE (Aviation-Grade Instrument) */}
          <div className="mb-2.5 rounded-xl border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="flex items-center gap-3">
              {/* High-Precision 80px Compass Dial */}
              <div className="relative h-20 w-20 flex-shrink-0">
                {/* Fixed Top Lubber Line (Forward facing index) */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.9)]" />
                </div>

                {/* Target Bearing Bug on Outer Bezel */}
                <div
                  className="absolute inset-0 z-20 pointer-events-none transition-transform duration-100 ease-out"
                  style={{ transform: `rotate(${relativeTargetAngle}deg)` }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5">
                    <div className="h-2 w-2 rotate-45 bg-rose-500 border border-white shadow-[0_0_6px_#f43f5e]" title="Target Bearing" />
                  </div>
                </div>

                {/* Exit Door Bearing Bug on Outer Bezel */}
                <div
                  className="absolute inset-0 z-20 pointer-events-none transition-transform duration-100 ease-out"
                  style={{ transform: `rotate(${relativeExitAngle}deg)` }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                    <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-emerald-400 drop-shadow-[0_0_6px_#10b981]" title="Exit Door Bearing" />
                  </div>
                </div>

                {/* Rotating Compass Card */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-slate-700/80 bg-slate-950 transition-transform duration-100 ease-out shadow-inner overflow-hidden"
                  style={{ transform: `rotate(${-headingDeg}deg)` }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Compass Ticks every 10 degrees */}
                    {Array.from({ length: 36 }).map((_, i) => {
                      const angle = i * 10;
                      const isMajor = angle % 30 === 0;
                      const isCardinal = angle % 90 === 0;
                      const r1 = 48;
                      const r2 = isCardinal ? 38 : isMajor ? 41 : 44;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 50 + r1 * Math.sin(rad);
                      const y1 = 50 - r1 * Math.cos(rad);
                      const x2 = 50 + r2 * Math.sin(rad);
                      const y2 = 50 - r2 * Math.cos(rad);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={isCardinal ? '#38bdf8' : isMajor ? '#94a3b8' : '#475569'}
                          strokeWidth={isCardinal ? 1.8 : isMajor ? 1.2 : 0.8}
                        />
                      );
                    })}

                    {/* Cardinal Labels */}
                    <text x="50" y="24" textAnchor="middle" dominantBaseline="middle" fill="#f43f5e" fontSize="9.5" fontWeight="900" fontFamily="monospace">N</text>
                    <text x="78" y="51" textAnchor="middle" dominantBaseline="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800" fontFamily="monospace">E</text>
                    <text x="50" y="78" textAnchor="middle" dominantBaseline="middle" fill="#f59e0b" fontSize="8.5" fontWeight="800" fontFamily="monospace">S</text>
                    <text x="22" y="51" textAnchor="middle" dominantBaseline="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800" fontFamily="monospace">W</text>

                    {/* Intercardinals */}
                    <text x="70" y="30" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="6" fontWeight="700" fontFamily="monospace">NE</text>
                    <text x="70" y="72" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="6" fontWeight="700" fontFamily="monospace">SE</text>
                    <text x="30" y="72" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="6" fontWeight="700" fontFamily="monospace">SW</text>
                    <text x="30" y="30" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="6" fontWeight="700" fontFamily="monospace">NW</text>

                    {/* Magnetic Needle - North Arrow (Glowing Crimson) */}
                    <polygon
                      points="50,14 54,50 50,47 46,50"
                      fill="#f43f5e"
                      stroke="#ffe4e6"
                      strokeWidth="0.5"
                      filter="drop-shadow(0 0 2px rgba(244,63,94,0.8))"
                    />
                    {/* Magnetic Needle - South Arrow (Metallic Slate) */}
                    <polygon
                      points="50,86 54,50 50,53 46,50"
                      fill="#64748b"
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                    />

                    {/* Center Jewel Pivot */}
                    <circle cx="50" cy="50" r="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.2" />
                    <circle cx="50" cy="50" r="1.2" fill="#38bdf8" />
                  </svg>
                </div>
              </div>

              {/* Precise Bearing Telemetry Details */}
              <div className="flex-1 space-y-1 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-[9px] font-bold tracking-wider text-slate-400">HEADING:</span>
                  <span className="font-mono text-xs font-black text-cyan-300">
                    {String(headingDeg).padStart(3, '0')}° <span className="text-emerald-400 font-bold">[{cardinalText}]</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Target:
                  </span>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="font-bold text-rose-300">{distToTarget}m</span>
                    <span className="text-[9px] text-slate-400">@{String(targetBearingWorld).padStart(3, '0')}°</span>
                    <span
                      className="inline-block text-[9px] text-rose-400 transition-transform duration-75"
                      style={{ transform: `rotate(${relativeTargetAngle}deg)` }}
                    >
                      ▲
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Exit Door:
                  </span>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="font-bold text-emerald-300">{distToExit}m</span>
                    <span className="text-[9px] text-slate-400">@{String(exitBearingWorld).padStart(3, '0')}°</span>
                    <span
                      className="inline-block text-[9px] text-emerald-400 transition-transform duration-75"
                      style={{ transform: `rotate(${relativeExitAngle}deg)` }}
                    >
                      ▲
                    </span>
                  </div>
                </div>

                {/* Grid & World Coordinates */}
                <div className="flex items-center justify-between pt-0.5 text-[9px] font-mono text-slate-400 border-t border-slate-800/80">
                  {isLevel5 ? (
                    <>
                      <span className="font-bold text-cyan-400">GRID: C{gridCol5}, R{gridRow5}</span>
                      <span className="text-slate-300">X:{playerX.toFixed(1)} Z:{playerZ.toFixed(1)}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-cyan-400">COORD:</span>
                      <span className="text-slate-300">X:{playerX.toFixed(1)}m Z:{playerZ.toFixed(1)}m</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showMiniMap && (
            <div>
              {/* 2D Room Radar Stage */}
              <div className="relative aspect-square w-full rounded-xl border border-slate-700/70 bg-slate-900/90 overflow-hidden shadow-inner">
                {/* Background Grid & Radar Rings */}
                <svg className="absolute inset-0 h-full w-full stroke-cyan-500/15" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <line x1="25%" y1="0" x2="25%" y2="100%" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="75%" y1="0" x2="75%" y2="100%" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="25%" x2="100%" y2="25%" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="75%" x2="100%" y2="75%" strokeWidth="1" strokeDasharray="2 2" />
                  {/* Radar Circles */}
                  <circle cx="50%" cy="50%" r="28%" fill="none" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="50%" cy="50%" r="46%" fill="none" strokeWidth="1" />

                  {/* LEVEL 1 CONDUITS */}
                  {!isLevel2 && !isLevel3 && (
                    <>
                      <line x1="33.3%" y1="66.7%" x2="50%" y2="66.7%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="33.3%" y1="66.7%" x2="33.3%" y2="50%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="33.3%" y1="50%" x2="33.3%" y2="33.3%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="50%" y1="66.7%" x2="50%" y2="50%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="50%" y1="50%" x2="66.7%" y2="50%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="50%" y1="50%" x2="50%" y2="33.3%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="50%" y1="33.3%" x2="66.7%" y2="33.3%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="66.7%" y1="33.3%" x2="66.7%" y2="50%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                      <line x1="50%" y1="50%" x2="50%" y2="3%" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.7" />
                    </>
                  )}

                  {/* LEVEL 2 CONDUITS (Branching Graph) */}
                  {isLevel2 && (
                    <>
                      {/* S to A */}
                      <line x1="25%" y1="50%" x2="37.5%" y2="50%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* A to B (Top Branch) */}
                      <line x1="37.5%" y1="50%" x2="50%" y2="31.8%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* A to C (Bottom Branch) */}
                      <line x1="37.5%" y1="50%" x2="50%" y2="68.2%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* B to E */}
                      <line x1="50%" y1="31.8%" x2="62.5%" y2="31.8%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* C to D */}
                      <line x1="50%" y1="68.2%" x2="62.5%" y2="68.2%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* E to G (Target) */}
                      <line x1="62.5%" y1="31.8%" x2="75%" y2="50%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* D to G (Target) */}
                      <line x1="62.5%" y1="68.2%" x2="75%" y2="50%" stroke="#0ea5e9" strokeWidth="2.5" strokeOpacity="0.6" />
                      {/* G to East Exit Door */}
                      <line x1="75%" y1="50%" x2="95%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" />
                    </>
                  )}

                  {/* LEVEL 3 CONDUITS (Decision Network) */}
                  {isLevel3 && (
                    <>
                      <line x1="13.9%" y1="50%" x2="25%" y2="50%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="25%" y1="50%" x2="34.7%" y2="35.7%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="25%" y1="50%" x2="40.3%" y2="50%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="25%" y1="50%" x2="38.9%" y2="67.9%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="34.7%" y1="35.7%" x2="56.9%" y2="26.8%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="34.7%" y1="35.7%" x2="54.2%" y2="41.1%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="40.3%" y1="50%" x2="56.9%" y2="53.6%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="38.9%" y1="67.9%" x2="56.9%" y2="69.6%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="56.9%" y1="26.8%" x2="75%" y2="28.6%" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.8" />
                      <line x1="75%" y1="28.6%" x2="95.8%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" />
                    </>
                  )}

                  {/* LEVEL 5 REAL 19x13 MAZE LABYRINTH MATRIX */}
                  {isLevel5 && (
                    <svg viewBox="0 0 190 130" className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
                      {LEVEL5_MAZE_GRID.map((row, r) =>
                        row.map((cell, c) => {
                          const isWall = cell === 1;
                          const cellKey = `${c},${r}`;
                          const isStart = c === LEVEL5_START_CELL[0] && r === LEVEL5_START_CELL[1];
                          const isTarget = c === LEVEL5_TARGET_CELL[0] && r === LEVEL5_TARGET_CELL[1];
                          const isExit = c === LEVEL5_EXIT_CELL[0] && r === LEVEL5_EXIT_CELL[1];
                          const isActive = activeNode === cellKey;
                          const isVisited = visitedItems.includes(cellKey);
                          const inQueue = queueItems.includes(cellKey);

                          const x = c * 10;
                          const y = r * 10;

                          if (isWall) {
                            return (
                              <rect
                                key={cellKey}
                                x={x}
                                y={y}
                                width={10}
                                height={10}
                                fill="#1e293b"
                                stroke="#0f172a"
                                strokeWidth={0.6}
                                rx={1}
                              />
                            );
                          }

                          let fillColor = '#090d16';
                          let strokeColor = '#1e293b';
                          let strokeWidth = 0.3;

                          if (isTarget) {
                            fillColor = targetFound ? '#10b981' : '#ef4444';
                            strokeColor = '#f43f5e';
                            strokeWidth = 1.0;
                          } else if (isStart) {
                            fillColor = '#059669';
                            strokeColor = '#10b981';
                            strokeWidth = 1.0;
                          } else if (isExit) {
                            fillColor = '#047857';
                          } else if (isActive) {
                            fillColor = '#f59e0b';
                            strokeColor = '#fbbf24';
                            strokeWidth = 0.8;
                          } else if (isVisited) {
                            fillColor = '#0284c7';
                            strokeColor = '#38bdf8';
                            strokeWidth = 0.5;
                          } else if (inQueue) {
                            fillColor = '#083344';
                            strokeColor = '#06b6d4';
                            strokeWidth = 0.4;
                          }

                          return (
                            <rect
                              key={cellKey}
                              x={x}
                              y={y}
                              width={10}
                              height={10}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                            />
                          );
                        })
                      )}

                      {/* Glowing Shortest Path Polyline */}
                      {targetFound && (
                        <>
                          <polyline
                            points={LEVEL5_SHORTEST_PATH_COORDS.map(([c, r]) => `${c * 10 + 5},${r * 10 + 5}`).join(' ')}
                            fill="none"
                            stroke="#047857"
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.7}
                          />
                          <polyline
                            points={LEVEL5_SHORTEST_PATH_COORDS.map(([c, r]) => `${c * 10 + 5},${r * 10 + 5}`).join(' ')}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}
                    </svg>
                  )}

                  {/* LEVEL 4 CONDUITS (Dead-End Trap Network) */}
                  {isLevel4 && (
                    <>
                      {/* S to Layer 1 (A, B, C, D) */}
                      <line x1="13.6%" y1="50%" x2="25%" y2="29.4%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="13.6%" y1="50%" x2="25%" y2="42.6%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="13.6%" y1="50%" x2="25%" y2="57.4%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="13.6%" y1="50%" x2="25%" y2="70.6%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      {/* A to X1 (Dead end), A to E */}
                      <line x1="25%" y1="29.4%" x2="36.4%" y2="20.6%" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.8" />
                      <line x1="25%" y1="29.4%" x2="37.5%" y2="33.8%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      {/* B to X2 (Dead end), B to F */}
                      <line x1="25%" y1="42.6%" x2="36.4%" y2="45.6%" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.8" />
                      <line x1="25%" y1="42.6%" x2="48.9%" y2="42.6%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      {/* C to G */}
                      <line x1="25%" y1="57.4%" x2="48.9%" y2="57.4%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      {/* D to X3 (Dead end), D to H */}
                      <line x1="25%" y1="70.6%" x2="36.4%" y2="73.5%" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.8" />
                      <line x1="25%" y1="70.6%" x2="37.5%" y2="66.2%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      {/* E to TARGET */}
                      <line x1="37.5%" y1="33.8%" x2="76.1%" y2="33.8%" stroke="#f43f5e" strokeWidth="2.5" strokeOpacity="0.8" />
                      {/* F to K, G to L */}
                      <line x1="48.9%" y1="42.6%" x2="62.5%" y2="42.6%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="48.9%" y1="57.4%" x2="62.5%" y2="57.4%" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.6" />
                      {/* TARGET to East Exit Door */}
                      <line x1="76.1%" y1="33.8%" x2="95.5%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.8" />
                    </>
                  )}
                </svg>

                {/* Radar Sweep Light Effect */}
                <div
                  className="absolute inset-0 pointer-events-none origin-center animate-spin"
                  style={{ animationDuration: '4s' }}
                >
                  <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/20 to-transparent" />
                </div>

                {/* Cardinal Labels */}
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-400">
                  N
                </span>
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500">
                  S
                </span>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500">
                  W
                </span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400">
                  E
                </span>

                {/* EXIT DOOR MARKER */}
                {isLevel5 || isLevel4 || isLevel3 || isLevel2 ? (
                  // East Exit Door (x = 24.0, 20.0, 16.5 or 14.5, z = 0) -> right edge
                  <div className="absolute top-1/2 right-[2%] -translate-y-1/2 flex flex-col items-center z-10">
                    <span className="rounded bg-emerald-500 px-1 py-0.5 font-black text-[7px] text-slate-950 shadow-md border border-emerald-300">
                      EXIT ▶
                    </span>
                  </div>
                ) : (
                  // North Exit Door (x = 0, z = -11.5) -> top edge
                  <div className="absolute top-[2%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                    <span className="rounded bg-emerald-500 px-1.5 py-0.2 font-black text-[8px] text-slate-950 shadow-md border border-emerald-300">
                      ▲ EXIT
                    </span>
                  </div>
                )}

                {/* LEVEL 1 NODES */}
                {!isLevel2 && !isLevel3 && !isLevel4 && !isLevel5 && (
                  <>
                    {/* Start Node [S] marker (-4, 4) -> (33.3%, 66.7%) */}
                    <div className="absolute left-[33.3%] top-[66.7%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 font-bold text-[8px] text-slate-950 shadow ring-2 ring-emerald-400/50">
                        S
                      </div>
                    </div>

                    {/* Intermediate Graph Nodes (N1 to N6) */}
                    {[
                      { id: 'N1', left: '50%', top: '66.7%' },
                      { id: 'N2', left: '33.3%', top: '50%' },
                      { id: 'N3', left: '33.3%', top: '33.3%' },
                      { id: 'N4', left: '50%', top: '50%' },
                      { id: 'N5', left: '50%', top: '33.3%' },
                      { id: 'N6', left: '66.7%', top: '33.3%' },
                    ].map((node) => {
                      const isVisited = visitedItems.includes(node.id);
                      const isActive = activeNode === node.id;
                      const inQueue = queueItems.includes(node.id);
                      return (
                        <div
                          key={node.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ left: node.left, top: node.top }}
                        >
                          <div
                            className={`flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-bold transition-all duration-300 ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 scale-125'
                                : isVisited
                                ? 'bg-emerald-400 text-slate-950 ring-1 ring-emerald-300'
                                : inQueue
                                ? 'bg-cyan-500 text-white ring-1 ring-cyan-300'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}
                          >
                            {node.id.replace('N', '')}
                          </div>
                        </div>
                      );
                    })}

                    {/* Target Node [G] marker (4, 0) -> (66.7%, 50%) */}
                    <div className="absolute left-[66.7%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 font-bold text-[8px] text-white shadow ring-2 ring-rose-400/60 animate-pulse">
                        G
                      </div>
                    </div>
                  </>
                )}

                {/* LEVEL 2 NODES (Branching Network) */}
                {isLevel2 && (
                  <>
                    {/* Start Node [S] (-8, 0) -> (25%, 50%) */}
                    <div className="absolute left-[25%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full font-bold text-[8px] shadow ring-2 ring-emerald-400/50 ${
                        activeNode === 'S' ? 'bg-amber-400 text-slate-950 ring-amber-300 scale-125' : 'bg-emerald-500 text-slate-950'
                      }`}>
                        S
                      </div>
                    </div>

                    {/* Branching Nodes: A, B, C, D, E */}
                    {[
                      { id: 'A', left: '37.5%', top: '50%' },
                      { id: 'B', left: '50%', top: '31.8%' },
                      { id: 'C', left: '50%', top: '68.2%' },
                      { id: 'E', left: '62.5%', top: '31.8%' },
                      { id: 'D', left: '62.5%', top: '68.2%' },
                    ].map((node) => {
                      const isVisited = visitedItems.includes(node.id);
                      const isActive = activeNode === node.id;
                      const inQueue = queueItems.includes(node.id);
                      return (
                        <div
                          key={node.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ left: node.left, top: node.top }}
                        >
                          <div
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold transition-all duration-300 ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 scale-125 font-black shadow-lg shadow-amber-400/50'
                                : isVisited
                                ? 'bg-emerald-400 text-slate-950 ring-1 ring-emerald-300'
                                : inQueue
                                ? 'bg-cyan-500 text-white ring-1 ring-cyan-300'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}
                          >
                            {node.id}
                          </div>
                        </div>
                      );
                    })}

                    {/* Target Node [G] (8, 0) -> (75%, 50%) */}
                    <div className="absolute left-[75%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full font-bold text-[8px] text-white shadow ring-2 ring-rose-400/60 ${
                        activeNode === 'G' || targetFound ? 'bg-rose-500 animate-pulse ring-rose-300 scale-125' : 'bg-rose-600/80'
                      }`}>
                        G
                      </div>
                    </div>
                  </>
                )}

                {/* LEVEL 3 NODES (Decision Network) */}
                {isLevel3 && (
                  <>
                    {/* Start Node [S] (-13, 0) -> (13.9%, 50%) */}
                    <div className="absolute left-[13.9%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 font-bold text-[7px] text-slate-950 shadow ring-1 ring-emerald-300">
                        S
                      </div>
                    </div>

                    {/* Level 3 Network Nodes */}
                    {[
                      { id: 'A', left: '25%', top: '50%' },
                      { id: 'B', left: '34.7%', top: '35.7%' },
                      { id: 'C', left: '40.3%', top: '50%' },
                      { id: 'D', left: '38.9%', top: '67.9%' },
                      { id: 'E', left: '56.9%', top: '26.8%' },
                      { id: 'F', left: '54.2%', top: '41.1%' },
                      { id: 'G', left: '56.9%', top: '53.6%' },
                      { id: 'H', left: '56.9%', top: '69.6%' },
                    ].map((node) => {
                      const isCandidate = LEVEL3_DECISION_STAGES[level3StageIndex ?? 0]?.candidateNodes.includes(node.id);
                      return (
                        <div
                          key={node.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ left: node.left, top: node.top }}
                        >
                          <div
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold ${
                              isCandidate
                                ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-200 animate-pulse font-black'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}
                          >
                            {node.id}
                          </div>
                        </div>
                      );
                    })}

                    {/* RED TARGET NODE */}
                    <div className="absolute left-[75%] top-[28.6%] -translate-x-1/2 -translate-y-1/2 z-10">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full font-black text-[6px] text-white shadow ring-2 ring-rose-400 ${
                          targetFound ? 'bg-emerald-500 ring-emerald-300 animate-bounce' : 'bg-rose-500 animate-pulse'
                        }`}
                        title="RED TARGET"
                      >
                        TGT
                      </div>
                    </div>
                  </>
                )}

                {/* LEVEL 4 NODES (Dead-End Trap Network) */}
                {isLevel4 && (
                  <>
                    {/* Start Node [S] (-16, 0) -> (13.6%, 50%) */}
                    <div className="absolute left-[13.6%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 font-bold text-[7px] text-slate-950 shadow ring-1 ring-emerald-300">
                        S
                      </div>
                    </div>

                    {/* Level 4 Nodes */}
                    {[
                      { id: 'A', left: '25.0%', top: '29.4%' },
                      { id: 'B', left: '25.0%', top: '42.6%' },
                      { id: 'C', left: '25.0%', top: '57.4%' },
                      { id: 'D', left: '25.0%', top: '70.6%' },
                      { id: 'X1', left: '36.4%', top: '20.6%', deadEnd: true },
                      { id: 'E', left: '37.5%', top: '33.8%' },
                      { id: 'X2', left: '36.4%', top: '45.6%', deadEnd: true },
                      { id: 'F', left: '48.9%', top: '42.6%' },
                      { id: 'G', left: '48.9%', top: '57.4%' },
                      { id: 'X3', left: '36.4%', top: '73.5%', deadEnd: true },
                      { id: 'H', left: '37.5%', top: '66.2%' },
                      { id: 'K', left: '62.5%', top: '42.6%' },
                      { id: 'L', left: '62.5%', top: '57.4%' },
                    ].map((node) => {
                      const isCandidate = decisionStages[level3StageIndex ?? 0]?.candidateNodes.includes(node.id);
                      return (
                        <div
                          key={node.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ left: node.left, top: node.top }}
                        >
                          <div
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[6px] font-bold ${
                              isCandidate
                                ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-200 animate-pulse font-black'
                                : node.deadEnd
                                ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}
                          >
                            {node.id}
                          </div>
                        </div>
                      );
                    })}

                    {/* RED TARGET NODE (11.5, -5.5) -> (76.1%, 33.8%) */}
                    <div className="absolute left-[76.1%] top-[33.8%] -translate-x-1/2 -translate-y-1/2 z-10">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full font-black text-[6px] text-white shadow ring-2 ring-rose-400 ${
                          targetFound ? 'bg-emerald-500 ring-emerald-300 animate-bounce' : 'bg-rose-500 animate-pulse'
                        }`}
                        title="RED TARGET"
                      >
                        TGT
                      </div>
                    </div>
                  </>
                )}

                {/* LEVEL 5 MAZE MARKERS */}
                {isLevel5 && (
                  <>
                    {/* Start Cell [S] (col 1, row 6) */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                      style={{
                        left: `${((LEVEL5_START_CELL[0] + 0.5) / 19) * 100}%`,
                        top: `${((LEVEL5_START_CELL[1] + 0.5) / 13) * 100}%`,
                      }}
                    >
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 font-bold text-[7px] text-slate-950 shadow ring-1 ring-emerald-300">
                        S
                      </div>
                    </div>

                    {/* RED TARGET CELL (col 16, row 6) */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                      style={{
                        left: `${((LEVEL5_TARGET_CELL[0] + 0.5) / 19) * 100}%`,
                        top: `${((LEVEL5_TARGET_CELL[1] + 0.5) / 13) * 100}%`,
                      }}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full font-black text-[7px] text-white shadow ring-2 ring-rose-400 ${
                          targetFound ? 'bg-emerald-500 ring-emerald-300 animate-bounce' : 'bg-rose-500 animate-pulse'
                        }`}
                        title="RED TARGET"
                      >
                        🎯
                      </div>
                    </div>

                    {/* East Exit Cell (col 18, row 6) */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                      style={{
                        left: `${((LEVEL5_EXIT_CELL[0] + 0.5) / 19) * 100}%`,
                        top: `${((LEVEL5_EXIT_CELL[1] + 0.5) / 13) * 100}%`,
                      }}
                    >
                      <span className="rounded bg-emerald-600 px-1 py-0.2 font-mono font-black text-[6px] text-white shadow">
                        EXIT
                      </span>
                    </div>
                  </>
                )}

                {/* THE ALIVE PLAYER MARKER (Moves and rotates in real-time) */}
                <div
                  className="absolute z-20 pointer-events-none transition-all duration-75 ease-out"
                  style={{
                    left: `${playerLeft}%`,
                    top: `${playerTop}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Pulsing position halo */}
                  <div className="absolute inset-0 -m-1.5 rounded-full bg-cyan-400/30 animate-ping" />

                  {/* Rotatable Direction Pointer & Vision Cone */}
                  <div
                    className="relative flex items-center justify-center transition-transform duration-75"
                    style={{ transform: `rotate(${headingDeg}deg)` }}
                  >
                    {/* Vision cone indicator */}
                    <div
                      className="absolute -top-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]"
                    />
                    {/* Core player dot */}
                    <div className="h-3 w-3 rounded-full bg-cyan-300 border-2 border-slate-950 shadow-md" />
                  </div>

                  {/* YOU Label */}
                  <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded bg-slate-950/90 px-1 py-0.2 text-[7px] font-black text-cyan-300 border border-cyan-500/40 tracking-wider">
                    YOU
                  </span>
                </div>
              </div>

              {/* Real-Time Live Telemetry Display */}
              <div className="mt-2 space-y-1 text-[10px] font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Dist to Exit:</span>
                  <span className={`font-bold ${targetReached ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {distToExit}m ({isLevel2 ? 'East' : 'North'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Dist to Target:</span>
                  <span className={`font-bold ${targetFound ? 'text-amber-300' : 'text-slate-200'}`}>
                    {distToTarget}m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. BFS QUEUE PANEL (TOP RIGHT) */}
      <div className="pointer-events-auto absolute right-4 top-16 w-84 rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md">
        {isDecisionLevel ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-black tracking-widest text-amber-300">
                  {isLevel5 ? 'BFS SHORTEST PATH ENGINE' : isLevel4 ? 'BFS DEAD-END ENGINE' : 'BFS DECISION ENGINE'}
                </span>
              </div>
              <span className="rounded-md bg-amber-950/80 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-800/50">
                {targetReached
                  ? `SOLVED (${decisionStages.length}/${decisionStages.length})`
                  : `STAGE ${Math.min((level3StageIndex ?? 0) + 1, decisionStages.length)} / ${decisionStages.length}`}
              </span>
            </div>

            {/* Active Stage & Question */}
            {(() => {
              const currentStage =
                decisionStages[
                  Math.min(level3StageIndex ?? 0, decisionStages.length - 1)
                ];
              return (
                <div className="mt-3 space-y-2.5">
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-2.5">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {currentStage?.stageTitle}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white leading-snug">
                      {currentStage?.question}
                    </div>
                  </div>

                  {/* Previous Queue if present */}
                  {currentStage?.oldQueue && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-left">
                      <div className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        PREVIOUS QUEUE:
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 font-mono text-xs font-bold text-slate-400 opacity-75">
                        {currentStage.oldQueue.map((node, i) => (
                          <span key={`old-${node}-${i}`} className="inline-flex items-center">
                            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 border border-slate-700">
                              {node}
                            </span>
                            {i < (currentStage.oldQueue?.length ?? 0) - 1 && (
                              <span className="mx-1 text-[10px] text-slate-500">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FIFO Queue */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-cyan-400" />
                        {currentStage?.oldQueue ? 'NEW QUEUE (FIFO):' : 'BFS QUEUE (FIFO):'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">FRONT is explored first</span>
                    </div>
                    <div className="flex min-h-[36px] flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1.5">
                      {currentStage?.queue.map((node, idx) => (
                        <span
                          key={`${node}-${idx}`}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                            idx === 0
                              ? 'border border-amber-400/80 bg-amber-500/30 text-amber-200 ring-1 ring-amber-400/50'
                              : 'border border-cyan-800/60 bg-cyan-950/60 text-cyan-200'
                          }`}
                        >
                          {node}
                          {idx === 0 && <span className="ml-1 text-[8px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black tracking-wider">FRONT</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Floor Circles to Step Into */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1">
                      Candidate Floor Circles:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {currentStage?.candidateNodes.map((c) => (
                        isLevel5 ? (
                          <div
                            key={c}
                            className="rounded-lg border border-cyan-500/50 bg-cyan-950/80 px-2.5 py-1.5 font-mono text-xs font-bold text-cyan-200 shadow flex items-center gap-1"
                          >
                            Floor Circle [ {c} ]
                          </div>
                        ) : (
                          <button
                            key={c}
                            type="button"
                            onClick={() => onCircleClick?.(c)}
                            className="rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 font-mono text-xs font-bold text-white shadow hover:border-cyan-400 hover:bg-slate-800 active:scale-95 transition cursor-pointer flex items-center gap-1"
                            title={`Walk into circle ${c} or click here to submit`}
                          >
                            Circle [ {c} ]
                          </button>
                        )
                      ))}
                    </div>
                    <div className="mt-1.5 text-[10px] text-cyan-300 font-medium">
                      {isLevel5
                        ? 'Physically walk your character into the chosen floor circle.'
                        : 'Physically walk into the circle or click above to submit.'}
                    </div>
                  </div>

                  {/* Live Evaluation Feedback */}
                  {level3Feedback && (
                    <div
                      className={`rounded-xl border p-2.5 text-xs font-semibold whitespace-pre-line leading-relaxed ${
                        level3Feedback.isError
                          ? 'border-rose-500/70 bg-rose-950/60 text-rose-200 shadow-md shadow-rose-950/50'
                          : 'border-emerald-500/70 bg-emerald-950/60 text-emerald-200 shadow-md shadow-emerald-950/50'
                      }`}
                    >
                      {level3Feedback.message}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={onRestartLevel}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {isLevel5 ? 'Restart Shortest Path Challenge' : isLevel4 ? 'Restart Dead-End Trap' : 'Restart Decision Path'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-black tracking-widest text-cyan-300">
                  {isLevel5 ? 'BFS MAZE SOLVER' : 'BFS SEARCH'}
                </span>
              </div>
              <span className="rounded-md bg-cyan-950/80 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800/50">
                {targetFound
                  ? (isLevel5 ? 'MAZE SOLVED (29 STEPS)' : 'TARGET FOUND')
                  : isSearching
                  ? `FRONTIER ${currentLayer}`
                  : 'STANDBY'}
              </span>
            </div>

            {/* Active Node & Layer Info */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
                <div className="text-[10px] text-slate-400">{isLevel5 ? 'CURRENT CELL' : 'CURRENT NODE'}</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-amber-300 truncate">
                  {activeNode ? `[ ${activeNode} ]` : (isLevel5 ? '[1, 6]' : 'None')}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
                <div className="text-[10px] text-slate-400">{isLevel5 ? 'FRONTIER DEPTH' : 'SEARCH LAYER'}</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-cyan-400">
                  {currentLayer}
                </div>
              </div>
            </div>

            {/* BFS Queue Representation */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Queue (FIFO):
                </span>
                <span className="text-[10px] text-cyan-500">{queueItems.length} {isLevel5 ? 'cells' : 'nodes'} pending</span>
              </div>

              <div className="flex min-h-[38px] max-h-[80px] overflow-y-auto flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 custom-scrollbar">
                {queueItems.length > 0 ? (
                  queueItems.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold transition-all ${
                        idx === 0
                          ? 'border border-amber-500/60 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
                          : 'border border-cyan-700/40 bg-cyan-950/60 text-cyan-200'
                      }`}
                    >
                      {item}
                      {idx === 0 && <span className="ml-1 text-[8px] text-amber-400">front</span>}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-500">Queue is empty</span>
                )}
              </div>
            </div>

            {/* Explored Nodes List */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                <span>{isLevel5 ? `Explored Corridors (${visitedItems.length}):` : `Explored Nodes (${visitedItems.length}):`}</span>
              </div>
              <div className="flex min-h-[32px] max-h-[60px] overflow-y-auto flex-wrap items-center gap-1 rounded-lg border border-slate-800/80 bg-slate-900/40 p-1.5 custom-scrollbar">
                {visitedItems.length > 0 ? (
                  visitedItems.map((v) => (
                    <span
                      key={v}
                      className="rounded bg-emerald-950/70 border border-emerald-700/40 px-1 py-0.2 font-mono text-[9px] text-emerald-300"
                    >
                      {v}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-600">No {isLevel5 ? 'cells' : 'nodes'} visited yet</span>
                )}
              </div>
            </div>

            {/* Action Controls */}
            <div className="mt-3.5 flex items-center gap-2 border-t border-slate-800/80 pt-3">
              {!isSearching && !targetFound && (
                <button
                  onClick={onStartBfs}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400 active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {isLevel5 ? 'RUN BFS MAZE SOLVER' : 'START BFS SEARCH'}
                </button>
              )}

              {targetFound && (
                <button
                  onClick={onResetBfs}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 active:scale-95"
                >
                  <RotateCcw className="h-3 w-3" />
                  Re-run BFS
                </button>
              )}
            </div>

            {isLevel5 && (
              <div className="mt-2 text-[10px] text-slate-400 italic">
                Walk the 19×13 corridor maze with WASD or run the auto-solver.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. CENTER TARGET FOUND NOTIFICATION BANNER */}
      {targetFound && !targetReached && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 flex flex-col items-center animate-bounce">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500 bg-slate-950/95 px-6 py-3 shadow-[0_0_30px_rgba(16,185,129,0.5)] backdrop-blur-md">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            <div>
              <div className="text-lg font-black tracking-wider text-emerald-400">TARGET FOUND!</div>
              <div className="text-xs text-slate-200">
                BFS found the shortest path:{' '}
                <span className="font-bold text-cyan-300">
                  {isLevel5
                    ? 'Shortest Maze Path: 29 corridor moves to Target'
                    : isLevel2
                    ? 'S → A → B → E → G (4 moves)'
                    : 'S → N1 → N4 → G (3 moves)'}
                </span>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-emerald-400 animate-pulse ml-2" />
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-300 bg-slate-900/80 px-3 py-1 rounded-full border border-emerald-500/30">
            {isLevel5
              ? 'Follow the illuminated tiles through the labyrinth to the RED TARGET [16, 6]'
              : 'Walk along the glowing path to reach the RED TARGET [G]'}
          </div>
        </div>
      )}

      {/* 4. TARGET REACHED / EXIT UNLOCKED BANNER */}
      {targetReached && !levelExitCrossed && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 flex flex-col items-center z-40">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-cyan-400 bg-slate-950/95 px-6 py-3.5 shadow-[0_0_35px_rgba(6,182,212,0.6)] backdrop-blur-md">
            <Sparkles className="h-7 w-7 text-cyan-400 animate-spin-slow" />
            <div>
              <div className="text-lg font-black tracking-wider text-cyan-300">
                {isLevel5
                  ? 'LEVEL 5 TARGET REACHED!'
                  : isLevel4
                  ? 'LEVEL 4 TARGET REACHED!'
                  : isLevel3
                  ? 'LEVEL 3 TARGET REACHED!'
                  : isLevel2
                  ? 'LEVEL 2 COMPLETE!'
                  : 'LEVEL 1 COMPLETE!'}
              </div>
              <div className="text-xs text-slate-200">
                {isLevel5
                  ? 'RED TARGET REACHED • BFS Shortest Path: 29 moves • East Exit Gateway Opened!'
                  : isLevel4
                  ? 'RED TARGET REACHED • BFS Optimal Path: 3 moves • East Exit Unlocked'
                  : isLevel3
                  ? 'RED TARGET REACHED • BFS Optimal Path: 4 moves • East Exit Unlocked'
                  : isLevel2
                  ? 'BFS EXPLORATION COMPLETE • Shortest Path: 4 moves • Nodes Explored: 7'
                  : 'BFS SEARCH SUCCESSFUL • Shortest Path: 3 moves • Nodes Explored: 7'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs font-bold text-cyan-300 bg-cyan-950/90 px-4 py-1.5 rounded-full border border-cyan-500/50 shadow-lg">
              {isLevel5 || isLevel4 || isLevel3
                ? 'EAST EXIT GATEWAY OPENED — Walk through the doorway'
                : isLevel2
                ? 'EXIT GATEWAY OPENED — Step through the East doorway to complete mission'
                : 'EXIT DOOR OPENED — Walk through the North gateway to enter Level 2'}
            </div>
            {(isLevel4 || isLevel3) && (
              <button
                type="button"
                onClick={() => onCircleClick?.('EXIT')}
                className="pointer-events-auto text-xs font-black text-emerald-300 bg-emerald-950/90 px-4 py-1.5 rounded-full border border-emerald-500/60 shadow-lg hover:bg-emerald-900 active:scale-95 transition cursor-pointer flex items-center gap-1"
              >
                <span>Pass Through Door</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4b. DECISION LEVEL TARGET SEARCH BANNER */}
      {isDecisionLevel && level3StageIndex >= (isLevel5 ? 5 : isLevel4 ? 4 : 4) && !targetReached && (
        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 flex flex-col items-center animate-bounce z-40">
          <div className="flex flex-col items-center text-center rounded-2xl border-2 border-rose-500 bg-slate-950/95 px-6 py-4 shadow-[0_0_35px_rgba(244,63,94,0.6)] backdrop-blur-md space-y-1">
            <div className="text-xs font-black tracking-widest text-rose-400 uppercase">
              {isLevel5 ? 'TARGET FOUND ✓' : 'TARGET SEARCH'}
            </div>
            <div className="text-base font-black text-white">
              {isLevel5 ? 'SHORTEST PATH DISCOVERED' : 'BFS has discovered the target.'}
            </div>
            <div className="text-xs text-rose-200">
              {isLevel5 ? 'Physically walk into the RED TARGET circle to unlock the exit.' : 'Follow the highlighted BFS path to escape the room.'}
            </div>
          </div>
          {!isLevel5 && (
            <button
              type="button"
              onClick={() => onCircleClick?.('TARGET')}
              className="pointer-events-auto mt-2 text-xs font-bold text-cyan-300 bg-slate-900/90 px-4 py-1.5 rounded-full border border-cyan-500/40 shadow hover:bg-slate-800 hover:border-cyan-400 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Walk into or Click:</span>
              <span className="text-rose-400 font-black underline">RED TARGET circle</span>
            </button>
          )}
        </div>
      )}

      {/* 5. INSTRUCTION PANEL MODAL (OPEN AT START) */}
      {showInstructions && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
          {isLevel5 ? (
            <div className="w-full max-w-md rounded-3xl border-2 border-cyan-400 bg-slate-900/95 p-7 shadow-2xl text-center space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Search Maze — Level 5</div>
                <h2 className="text-2xl font-black text-white tracking-wide mt-1">SHORTEST PATH CHALLENGE</h2>
                <div className="text-[11px] font-mono text-cyan-300 mt-1">DIFFICULTY: HARD • BFS GRAPH DEPTH</div>
              </div>

              <div className="space-y-3.5 text-sm text-slate-200 text-center font-medium">
                <p className="text-base text-white font-bold">
                  Use BFS to determine the <span className="text-cyan-400 font-black">SHORTEST PATH</span> from START to TARGET.
                </p>
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs text-cyan-200 text-left space-y-1.5">
                  <div className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-cyan-400" />
                    BFS RULES:
                  </div>
                  <div>• Shortest path is based strictly on <strong>graph depth</strong> (minimum edges).</div>
                  <div>• Do NOT use physical or Euclidean distance.</div>
                  <div>• Physically walk into each selected circle in BFS FIFO order.</div>
                </div>
                <div className="text-amber-300 font-bold bg-amber-950/50 border border-amber-500/40 rounded-xl py-2.5 px-3.5 leading-snug text-xs">
                  The node at the FRONT of the BFS QUEUE is always explored next.
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl shadow-cyan-500/30 active:scale-95 cursor-pointer uppercase tracking-wider border border-cyan-400/40"
              >
                [ START CHALLENGE ]
              </button>
            </div>
          ) : isLevel4 ? (
            <div className="w-full max-w-md rounded-3xl border-2 border-rose-500 bg-slate-900/95 p-7 shadow-2xl text-center space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-xs font-bold tracking-widest text-rose-400 uppercase">Search Maze — Level 4</div>
                <h2 className="text-2xl font-black text-white tracking-wide mt-1">DEAD-END TRAP</h2>
              </div>

              <div className="space-y-3.5 text-sm text-slate-200 text-center font-medium">
                <p className="text-base text-white font-bold">
                  Navigate the branching maze to reach the <span className="text-rose-400 font-black">RED TARGET</span>.
                </p>
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200 text-left space-y-1.5">
                  <div className="font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    DEAD-END WARNING:
                  </div>
                  <div>• This maze contains multiple branches and <strong>dead ends</strong>.</div>
                  <div>• Dead-end nodes add no new neighbors to the queue.</div>
                  <div>• Do not guess! Strictly follow the <strong>BFS FIFO queue</strong> order.</div>
                </div>
                <div className="text-amber-300 font-bold bg-amber-950/50 border border-amber-500/40 rounded-xl py-2.5 px-3.5 leading-snug">
                  The node at the FRONT of the<br />BFS QUEUE is always explored next.
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 via-amber-600 to-cyan-600 hover:from-rose-400 hover:to-cyan-500 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-rose-500/30 active:scale-95 cursor-pointer uppercase tracking-wider border border-rose-400/40"
              >
                [ ENTER DEAD-END TRAP ]
              </button>
            </div>
          ) : isLevel3 ? (
            <div className="w-full max-w-md rounded-3xl border-2 border-cyan-400 bg-slate-900/95 p-7 shadow-2xl text-center space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Search Maze — Level 3</div>
                <h2 className="text-2xl font-black text-white tracking-wide mt-1">BFS PATH DECISION</h2>
              </div>

              <div className="space-y-3.5 text-sm text-slate-200 text-center font-medium">
                <p className="text-base text-white font-bold">
                  Your goal is to reach the <span className="text-rose-400 font-black">RED TARGET</span>.
                </p>
                <p className="text-slate-300">
                  BFS searches nodes <span className="text-cyan-300 font-bold">level-by-level</span>.
                </p>
                <div className="text-amber-300 font-bold bg-amber-950/50 border border-amber-500/40 rounded-xl py-2.5 px-3.5 leading-snug">
                  The node at the FRONT of the<br />BFS QUEUE is always explored next.
                </div>
                <div className="space-y-1 text-slate-300 font-semibold pt-1 text-xs">
                  <div>• Look at the queue.</div>
                  <div>• Find the next node.</div>
                  <div>• Walk into that node's circle.</div>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-cyan-500/30 active:scale-95 cursor-pointer uppercase tracking-wider border border-cyan-400/40"
              >
                [ START LEVEL ]
              </button>
            </div>
          ) : (
            <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">Search Maze</span>
                  <h2 className="text-xl font-black text-white">
                    {isLevel2
                      ? 'LEVEL 2 — Branching Maze'
                      : 'LEVEL 1 — First Search'}
                  </h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Navigation className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-300 max-h-[65vh] overflow-y-auto pr-1">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/40 p-3.5">
                  <div className="text-xs font-bold text-cyan-300">OBJECTIVE:</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {isLevel2
                      ? 'Reach the TARGET by activating BFS and following the shortest path it discovers.'
                      : 'Find the red target using Breadth-First Search.'}
                  </div>
                </div>

                {/* Branching Diagram for Level 2 */}
                {isLevel2 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
                      Room Graph Topology
                    </div>
                    <pre className="font-mono text-[10px] sm:text-xs text-cyan-200 leading-tight select-none">
{`                 ┌── Node B ── Node E ──┐
                 │                       │
🟢 START ── Node A                     🔴 TARGET
                 │                       │
                 └── Node C ── Node D ──┘`}
                    </pre>
                    <p className="mt-2 text-[11px] text-slate-400 italic">
                      BFS explores all nodes at the current depth before moving deeper.
                    </p>
                  </div>
                )}

                {/* Controls */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Controls:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between rounded bg-slate-800/80 px-2.5 py-1.5">
                      <span className="text-slate-400">W / A / S / D</span>
                      <span className="text-white">Walk Around</span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-slate-800/80 px-2.5 py-1.5">
                      <span className="text-slate-400">Mouse Drag</span>
                      <span className="text-white">Look / Turn</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:brightness-110 active:scale-98 cursor-pointer"
                >
                  ENTER CHAMBER & START
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5b. LEVEL 3 STEP 2 RULE REMINDER BANNER */}
      {isLevel3 && level3RuleReminder && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400 bg-slate-900/95 p-6 text-center shadow-2xl space-y-4">
            <div className="text-xs font-black tracking-widest text-amber-400 uppercase">REMEMBER:</div>
            <div className="text-2xl font-black text-white">BFS uses a QUEUE.</div>
            <div className="py-2.5 px-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 font-mono font-black text-base tracking-wider shadow-inner">
              FIRST IN → FIRST OUT
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              The node at the <strong className="text-amber-300">FRONT</strong> is processed first.
            </p>
            <button
              onClick={onDismissRuleReminder}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition shadow cursor-pointer uppercase tracking-wider"
            >
              [ GOT IT — CONTINUE ]
            </button>
          </div>
        </div>
      )}

      {/* 6. LEVEL COMPLETION VICTORY OVERLAY (WHEN PLAYER CROSSES EXIT DOOR) */}
      {levelExitCrossed && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-emerald-500 bg-slate-900/95 p-6 shadow-[0_0_50px_rgba(16,185,129,0.4)] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
              <Trophy className="h-8 w-8 animate-bounce" />
            </div>

            <h1 className="text-2xl font-black tracking-wide text-emerald-400">
              {isLevel5 ? 'LEVEL 5 COMPLETE ✓' : isLevel4 ? 'LEVEL 4 COMPLETE ✓' : isLevel3 ? 'LEVEL 3 COMPLETE ✓' : isLevel2 ? 'LEVEL 2 COMPLETE' : 'LEVEL 1 COMPLETE'}
            </h1>
            <h2 className="mt-1 text-lg font-bold text-cyan-300">
              {isLevel5
                ? 'SHORTEST PATH CHALLENGE MASTERED!'
                : isLevel4
                ? 'DEAD-END TRAP MASTERED!'
                : isLevel3
                ? 'BFS PATH DECISION MASTERED'
                : isLevel2
                ? 'BRANCHING MAZE CONQUERED!'
                : 'LEVEL 2 UNLOCKED'}
            </h2>
            {isLevel4 && (
              <div className="mt-2 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-950/90 via-teal-950/90 to-slate-900 border-2 border-cyan-500/60 text-cyan-300 font-black text-sm tracking-wider shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                <span>🎉 LEVEL 5 UNLOCKED — SHORTEST PATH CHALLENGE</span>
              </div>
            )}
            {isLevel5 && (
              <div className="mt-2 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-cyan-950/90 border-2 border-emerald-500/60 text-emerald-300 font-black text-sm tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                <span>🏆 SEARCH MAZE MASTERED! ALL 5 LEVELS COMPLETE</span>
              </div>
            )}

            <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Algorithm:</span>
                <span className="font-mono font-bold text-cyan-300">Breadth-First Search (BFS)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Core Principle:</span>
                <span className="font-mono font-bold text-white">FIFO Decision-Making & Layer Order</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Stages Solved:</span>
                <span className="font-mono font-bold text-white">{decisionStages.length} Decision Stages Complete</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Shortest Path Length:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {isLevel5 ? '5 moves' : isLevel4 ? '3 moves' : isLevel3 ? '4 moves' : isLevel2 ? '4 moves' : '3 moves'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Optimal Route:</span>
                <span className="font-mono font-bold text-amber-300">
                  {isLevel5
                    ? 'S → A → E → L → Q → RED TARGET'
                    : isLevel4
                    ? 'S → A → E → RED TARGET'
                    : isLevel3
                    ? 'S → A → B → E → RED TARGET'
                    : isLevel2
                    ? 'S → A → B → E → G'
                    : 'S → N1 → N4 → G'}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300">
              {isLevel5
                ? 'Brilliant analysis! You utilized Breadth-First Search to isolate the true shortest path by graph depth, navigating complex branches and rejecting deceptive longer routes.'
                : isLevel4
                ? 'Outstanding work! You navigated complex branches, avoided all dead ends, and proved the power of strict BFS FIFO exploration.'
                : isLevel3
                ? 'Outstanding work! You understood and demonstrated Breadth-First Search queue FIFO ordering at every branching choice.'
                : isLevel2
                ? 'BFS explored all branches depth-by-depth, ensuring the shortest path was found regardless of maze branching!'
                : 'You have mastered Breadth-First Search fundamentals. Proceed to Level 2 to explore branching networks!'}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {!isLevel2 && !isLevel3 && !isLevel4 && !isLevel5 && onNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95"
                >
                  Enter Level 2: Branching Maze ▶
                </button>
              )}
              {isLevel2 && !isLevel3 && !isLevel4 && !isLevel5 && onNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95"
                >
                  Enter Level 3: Decision Path ▶
                </button>
              )}
              {isLevel3 && onNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  Enter Level 4: Dead-End Trap ▶
                </button>
              )}
              {isLevel4 && onNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  Enter Level 5: Shortest Path Challenge ▶
                </button>
              )}
              <button
                onClick={onRestartLevel}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 active:scale-95 cursor-pointer"
              >
                {isLevel5 ? 'Replay Level 5' : isLevel4 ? 'Replay Level 4' : isLevel3 ? 'Replay Level 3' : isLevel2 ? 'Replay Level 2' : 'Replay Level 1'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
