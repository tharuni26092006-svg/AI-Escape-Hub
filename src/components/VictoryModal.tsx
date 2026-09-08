import React from 'react';
import { Trophy, Clock, Star, Sparkles, RotateCcw, ArrowRight, Play } from 'lucide-react';
import { sound } from '../services/soundEngine';
import { GameId, LevelId } from '../types';
import { LEVELS_DATA } from '../game/levelsData';
import { SEARCH_MAZE_LEVELS_DATA } from '../game/searchMazeData';

interface VictoryModalProps {
  currentGame?: GameId;
  currentLevel: LevelId;
  timeElapsed: number;
  hintsUsed: number;
  coinsEarned: number;
  onPlayAgain: () => void;
  onNextLevel?: () => void;
  onContinue: () => void;
  onReturnHome?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  currentGame = 'agent_academy',
  currentLevel,
  timeElapsed,
  hintsUsed,
  coinsEarned,
  onPlayAgain,
  onNextLevel,
  onContinue,
  onReturnHome,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSearchMaze = currentGame === 'search_maze';
  const isHeuristicChamber = currentGame === 'heuristic_chamber';
  const isSearchMazeLevel3 = isSearchMaze && currentLevel === 3;
  const levelInfo = isHeuristicChamber
    ? {
        id: 1 as LevelId,
        name: 'First Heuristic',
        chapter: 'Heuristic Chamber',
        themeName: 'A* Navigation Laboratory',
        icon: '🗺️',
        difficulty: 'Easy → Medium',
        badgeColor: 'from-amber-600 to-orange-600',
        description: 'Evaluate f(n) = g(n) + h(n), explore candidate nodes, and reach the Target.',
        roomSize: { width: 40, depth: 24, height: 7.5 },
      }
    : isSearchMaze
    ? SEARCH_MAZE_LEVELS_DATA[currentLevel] || SEARCH_MAZE_LEVELS_DATA[1]
    : LEVELS_DATA[currentLevel];
  const hasNextLevel = isHeuristicChamber ? false : isSearchMaze ? currentLevel < 5 : currentLevel < 5;
  const nextLevelInfo = !isHeuristicChamber && hasNextLevel
    ? isSearchMaze
      ? SEARCH_MAZE_LEVELS_DATA[(currentLevel + 1) as LevelId]
      : LEVELS_DATA[(currentLevel + 1) as LevelId]
    : null;

  // Calculate rating
  const stars = timeElapsed < 120 && hintsUsed === 0 ? 3 : timeElapsed < 300 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center space-y-4">
        {/* Trophy Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg shadow-amber-400/20 animate-bounce">
            🏆
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isSearchMazeLevel3
              ? 'LEVEL 3 COMPLETE ✓'
              : isSearchMaze
              ? 'SEARCH MAZE — TARGET FOUND!'
              : `LEVEL ${currentLevel} COMPLETED!`}
          </h2>
          <p className="text-xs text-amber-300 font-bold uppercase tracking-widest">
            {isSearchMazeLevel3
              ? 'BFS PATH DECISION MASTERED'
              : isSearchMaze
              ? 'BFS explored layer by layer. Shortest path found.'
              : `${levelInfo.name} Solved`}
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-1.5 py-1">
          {[1, 2, 3].map((star) => (
            <Star
              key={star}
              className={`w-7 h-7 ${
                star <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow'
                  : 'text-slate-700 fill-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Time</span>
            <span className="font-mono font-black text-amber-300 text-sm mt-0.5">{formatTime(timeElapsed)}</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Hints</span>
            <span className="font-mono font-black text-slate-300 text-sm mt-0.5">{hintsUsed}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Reward</span>
            <span className="font-mono font-black text-emerald-400 text-sm mt-0.5">+{coinsEarned} 🪙</span>
          </div>
        </div>

        {/* Level Status Notice / Next Level Banner */}
        {hasNextLevel && onNextLevel ? (
          <div
            onClick={() => {
              sound.playUiClick();
              onNextLevel();
            }}
            className="w-full p-3.5 bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-slate-900 border-2 border-cyan-500/60 hover:border-cyan-400 rounded-2xl text-center text-xs space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20 group"
          >
            <div className="text-cyan-300 font-black flex items-center justify-center gap-1.5 text-sm">
              <span>🚀 Next: Level {currentLevel + 1} (Exit Gateway Open!)</span>
            </div>
            <p className="text-[11px] text-cyan-200/80">
              {isSearchMaze
                ? 'Proceed to Level 2: Expanded Frontier Queue'
                : `Click here or below to proceed to Level ${currentLevel + 1}!`}
            </p>
          </div>
        ) : isSearchMazeLevel3 ? (
          <div className="w-full p-3.5 bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border-2 border-emerald-500/60 rounded-2xl text-center text-xs space-y-1 shadow-lg shadow-emerald-500/20">
            <div className="text-emerald-300 font-black flex items-center justify-center gap-1.5 text-sm tracking-wider">
              <span>🔓 LEVEL 4 UNLOCKED</span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              BFS PATH DECISION MASTERED • All queue branching challenges solved!
            </p>
          </div>
        ) : (
          <div className="w-full p-3 bg-gradient-to-r from-amber-950/70 via-indigo-950/70 to-slate-900 border border-amber-500/40 rounded-2xl text-center text-xs space-y-1">
            <div className="text-amber-300 font-bold flex items-center justify-center gap-1.5">
              <span>⚡ {isSearchMaze ? 'Search Maze: Level Completed!' : 'Agent Academy: Level 5 Conquered!'}</span>
            </div>
            <p className="text-[11px] text-amber-200/80">
              {isSearchMaze
                ? 'Target located with Breadth-First Search. Shortest path computed in 4 moves!'
                : 'You navigated the dynamic security grid, synchronized system registers, and transcended the Level 6 Protocol Gateway!'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 pt-1">
          {hasNextLevel && onNextLevel && (
            <button
              onClick={() => {
                sound.playUiClick();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/40"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {isSearchMaze
                  ? 'Enter Level 2: Expanded Frontier'
                  : `Enter Level ${currentLevel + 1}: ${nextLevelInfo?.name || 'Next Level'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="w-full flex items-center gap-2">
            <button
              onClick={() => {
                sound.playUiClick();
                onPlayAgain();
              }}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Level</span>
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                if (onReturnHome) {
                  onReturnHome();
                } else {
                  onContinue();
                }
              }}
              className="flex-1 py-2.5 px-3 bg-blue-600/80 hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-blue-400/30"
            >
              <span>Return to Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
