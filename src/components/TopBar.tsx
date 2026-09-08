import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, RotateCcw, Clock, Lightbulb, ChevronDown, Palette, Home, Compass } from 'lucide-react';
import { sound } from '../services/soundEngine';
import { GameId, LevelId } from '../types';
import { LEVELS_DATA } from '../game/levelsData';
import { SEARCH_MAZE_LEVELS_DATA } from '../game/searchMazeData';

interface TopBarProps {
  currentGame?: GameId;
  currentLevel: LevelId;
  coins: number;
  timeElapsed: number;
  isMuted: boolean;
  onSelectLevel: (levelId: LevelId) => void;
  onToggleSound: () => void;
  onOpenHelp: () => void;
  onGetHint: () => void;
  onResetGame: () => void;
  onOpenAvatarCustomizer?: () => void;
  onExitToHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentGame = 'agent_academy',
  currentLevel,
  coins,
  timeElapsed,
  isMuted,
  onSelectLevel,
  onToggleSound,
  onOpenHelp,
  onGetHint,
  onResetGame,
  onOpenAvatarCustomizer,
  onExitToHome,
}) => {
  const [showLevelMenu, setShowLevelMenu] = useState<boolean>(false);

  const isSearchMaze = currentGame === 'search_maze';
  const isHeuristicChamber = currentGame === 'heuristic_chamber';
  const activeLevelInfo = isHeuristicChamber
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 pointer-events-auto select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Home Hub Button, Level Selector & Timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hub Button */}
          {onExitToHome && (
            <button
              onClick={() => {
                sound.playUiClick();
                onExitToHome();
              }}
              title="Return to Game Hub"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-slate-200 hover:text-amber-400 font-black text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Hub</span>
            </button>
          )}

          {/* Level Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                sound.playUiClick();
                setShowLevelMenu(!showLevelMenu);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-white hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-lg">{activeLevelInfo.icon}</span>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
                    {isHeuristicChamber ? 'Heuristic Chamber' : isSearchMaze ? 'Search Maze' : 'Agent Academy'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLevelMenu ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-xs font-black tracking-tight leading-none text-slate-100">
                  {isHeuristicChamber ? 'Level 1: First Heuristic' : isSearchMaze ? `Level ${currentLevel}: First Search` : `Level ${currentLevel} of 5`}
                </span>
              </div>
            </button>

            {/* Level selection menu */}
            {showLevelMenu && (
              <div className="absolute top-12 left-0 w-72 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 p-2 shadow-2xl space-y-1 text-xs text-slate-200 animate-fadeIn z-40">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  {isHeuristicChamber ? 'Heuristic Chamber' : isSearchMaze ? 'Search Maze Levels' : 'Agent Academy Levels (5 Levels)'}
                </div>
                {isHeuristicChamber ? (
                  <button
                    onClick={() => {
                      sound.playUiClick();
                      setShowLevelMenu(false);
                      onSelectLevel(1);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-pointer"
                  >
                    <span className="text-2xl">🗺️</span>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Level 1: First Heuristic</span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">A* SEARCH</span>
                      </div>
                      <span className="text-[10px] text-slate-400">f(n) = g(n) + h(n) Navigation Laboratory</span>
                    </div>
                  </button>
                ) : isSearchMaze ? (
                  ([1, 2, 3, 4] as LevelId[]).map((lvl) => {
                    const info = SEARCH_MAZE_LEVELS_DATA[lvl] || SEARCH_MAZE_LEVELS_DATA[1];
                    const isSelected = lvl === currentLevel;
                    return (
                      <button
                        key={lvl}
                        onClick={() => {
                          sound.playUiClick();
                          setShowLevelMenu(false);
                          onSelectLevel(lvl);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-2xl">{info.icon}</span>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{info.name}</span>
                            <span className="text-[10px] text-cyan-400/80 font-mono">BFS</span>
                          </div>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{info.themeName}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  ([1, 2, 3, 4, 5] as LevelId[]).map((lvl) => {
                    const info = LEVELS_DATA[lvl];
                    const isSelected = lvl === currentLevel;
                    return (
                      <button
                        key={lvl}
                        onClick={() => {
                          sound.playUiClick();
                          setShowLevelMenu(false);
                          onSelectLevel(lvl);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-2xl">{info.icon}</span>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">Level {lvl}</span>
                            <span className="text-[10px] text-amber-400/80 font-mono">{info.difficulty}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{info.description}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Stopwatch */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-amber-300 font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Right: Hint, Avatar Studio, Coins, Audio & Controls */}
        <div className="flex items-center gap-2">
          {/* Avatar Customizer in-game */}
          {onOpenAvatarCustomizer && (
            <button
              onClick={() => {
                sound.playUiClick();
                onOpenAvatarCustomizer();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 text-slate-200 rounded-2xl shadow-lg border border-slate-700/80 font-bold text-xs transition-all active:scale-95"
              title="Customize Avatar Outfits & Gender"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Avatar</span>
            </button>
          )}

          {/* Cryptic Hint Button */}
          <button
            onClick={() => {
              sound.playUiClick();
              onGetHint();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 rounded-2xl shadow-lg border border-amber-300 font-black text-xs transition-all active:scale-95"
            title="Get Contextual Escape Clue Hint"
          >
            <Lightbulb className="w-3.5 h-3.5 fill-slate-950" />
            <span>Hint</span>
          </button>

          {/* Coins Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-amber-300 font-bold text-xs">
            <span>🪙</span>
            <span>{coins.toLocaleString()}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleSound();
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-slate-300 hover:text-white transition-all active:scale-95"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Help Controls */}
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenHelp();
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-slate-300 hover:text-white transition-all active:scale-95"
            title="Controls & Instructions"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset Room */}
          <button
            onClick={() => {
              sound.playUiClick();
              onResetGame();
            }}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-lg text-slate-300 hover:text-white transition-all active:scale-95"
            title="Restart Level"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
