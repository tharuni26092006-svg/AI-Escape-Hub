import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { TopBar } from './components/TopBar';
import { InventoryBar } from './components/InventoryBar';
import { InteractPrompt } from './components/InteractPrompt';
import { PuzzleModal } from './components/PuzzleModal';
import { MobileControls } from './components/MobileControls';
import { ControlsHelp } from './components/ControlsHelp';
import { VictoryModal } from './components/VictoryModal';
import { AuthView } from './components/AuthView';
import { HomeHub } from './components/HomeHub';
import { AvatarCustomizer } from './components/AvatarCustomizer';
import { authService } from './services/authService';
import { sound } from './services/soundEngine';
import { LEVELS_DATA } from './game/levelsData';
import { SearchMazeHUD } from './components/SearchMazeHUD';
import { HeuristicChamberHUD } from './components/HeuristicChamberHUD';
import {
  BfsStepState,
  generateBfsSteps,
  LEVEL1_GRAPH,
  LEVEL2_GRAPH,
  LEVEL3_DECISION_STAGES,
  LEVEL4_DECISION_STAGES,
  LEVEL4_DEAD_ENDS,
  LEVEL5_DECISION_STAGES,
  LEVEL5_MAZE_GRID,
  LEVEL5_START_CELL,
  LEVEL5_TARGET_CELL,
  executeGridBFS,
} from './game/searchMazeLogic';
import {
  AppPage,
  AvatarCustomization,
  GameId,
  InteractiveObjectData,
  InventoryItem,
  ItemId,
  LevelId,
  UserAccount,
} from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Authentication & Navigation State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return authService.getCurrentUser();
  });
  const [page, setPage] = useState<AppPage>(() => (authService.getCurrentUser() ? 'home' : 'auth'));
  const [showInGameAvatarStudio, setShowInGameAvatarStudio] = useState<boolean>(false);

  // Active Level & Active Game
  const [currentGame, setCurrentGame] = useState<GameId>('agent_academy');
  const [currentLevel, setCurrentLevel] = useState<LevelId>(1);

  // Game Timer & Progression
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isEscaped, setIsEscaped] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(null);

  // Solved Puzzles Map (Dynamic for all 3 levels)
  const [solvedPuzzles, setSolvedPuzzles] = useState<Record<string, boolean>>({});

  // Active Interactive Object near Player
  const [nearbyObject, setNearbyObject] = useState<InteractiveObjectData | null>(null);

  // Modals & UI States
  const [activePuzzle, setActivePuzzle] = useState<InteractiveObjectData | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);

  // Search Maze (Level 1 BFS State)
  const [bfsSteps, setBfsSteps] = useState<BfsStepState[]>([]);
  const [currentBfsStepIndex, setCurrentBfsStepIndex] = useState<number>(-1);
  const [isBfsSearching, setIsBfsSearching] = useState<boolean>(false);
  const [isBfsTargetFound, setIsBfsTargetFound] = useState<boolean>(false);
  const [isTargetReached, setIsTargetReached] = useState<boolean>(false);
  const [isLevelExitCrossed, setIsLevelExitCrossed] = useState<boolean>(false);
  const [level3StageIndex, setLevel3StageIndex] = useState<number>(0);
  const [level3Feedback, setLevel3Feedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [level3RuleReminder, setLevel3RuleReminder] = useState<boolean>(false);
  const level3StageIndexRef = useRef<number>(0);
  const handleLevel3CircleStepRef = useRef<(nodeId: string) => void>(() => {});
  const [playerTransform, setPlayerTransform] = useState<{
    x: number;
    y: number;
    z: number;
    yaw: number;
    avatarRotationY: number;
  }>({ x: -4, y: 0, z: 4, yaw: 0, avatarRotationY: 0 });
  const bfsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; icon?: string } | null>(null);

  const showToast = (text: string, icon: string = '💡') => {
    setToastMessage({ text, icon });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Level 3, Level 4 & Level 5 BFS Step-In Decision Handler (uses ref to prevent stale closures)
  const handleLevel3CircleStep = (nodeId: string) => {
    if (currentGame !== 'search_maze' || (currentLevel !== 3 && currentLevel !== 4 && currentLevel !== 5)) return;
    const stageIdx = level3StageIndexRef.current;
    const stages = currentLevel === 5 ? LEVEL5_DECISION_STAGES : (currentLevel === 4 ? LEVEL4_DECISION_STAGES : LEVEL3_DECISION_STAGES);

    // If player is at Target stage (all decision stages solved)
    if (stageIdx >= stages.length) {
      if (nodeId === 'TARGET' || nodeId === 'TARGET_A') {
        sound.playAccessGranted();
        if (engineRef.current) {
          engineRef.current.isTargetReached = true;
          engineRef.current.setNodeFeedbackVisual('TARGET', 'correct');
          engineRef.current.openVault();
          if (currentLevel === 5) {
            engineRef.current.showShortestPath(['S', 'A', 'E', 'L', 'Q', 'TARGET']);
          }
        }
        setIsTargetReached(true);
        setLevel3Feedback({
          message: currentLevel === 5
            ? `TARGET FOUND ✓\nSHORTEST PATH DISCOVERED\n\nEast exit door is now UNLOCKED! Walk through the doorway to complete Level 5.`
            : `✓ RED TARGET REACHED!\nEast exit doors are unlocked. Head through the doorway to complete Level ${currentLevel}!`,
          isError: false,
        });
        showToast(currentLevel === 5 ? 'TARGET FOUND ✓ — SHORTEST PATH DISCOVERED!' : `LEVEL ${currentLevel} BFS SOLVED! East exit gateway is open!`, '⭐');
        sound.playVictory();
        if (currentUser) {
          currentUser.coins += currentLevel === 5 ? 300 : (currentLevel === 4 ? 200 : 150);
          currentUser.xp += currentLevel === 5 ? 100 : (currentLevel === 4 ? 75 : 50);
          authService.saveUser(currentUser);
          setCurrentUser({ ...currentUser });
        }
      } else if (nodeId === 'EXIT' || nodeId === 'DOOR') {
        setIsTargetReached(true);
        setIsLevelExitCrossed(true);
        if (engineRef.current) {
          engineRef.current.isTargetReached = true;
          engineRef.current.isLevelExitCrossed = true;
          engineRef.current.openVault();
        }
        sound.playVictory();
        showToast(`Level ${currentLevel} Exit Doorway Crossed! Victory!`, '🎉');
      }
      return;
    }

    const currentStage = stages[stageIdx];
    if (!currentStage) return;

    if (nodeId === currentStage.correctNode) {
      sound.playAccessGranted();
      if (engineRef.current) {
        engineRef.current.setNodeFeedbackVisual(nodeId, 'correct');
      }

      const nextStageIndex = stageIdx + 1;
      level3StageIndexRef.current = nextStageIndex;
      setLevel3StageIndex(nextStageIndex);

      if (nextStageIndex === 1 && currentLevel === 3) {
        // Show Rule Reminder for Stage 2 in Level 3
        setLevel3RuleReminder(true);
      }

      if (nextStageIndex < stages.length) {
        const nextStage = stages[nextStageIndex];
        setLevel3Feedback({
          message: currentStage.successMessage || `Correct! Dequeued [${nodeId}]. Queue updated to: [${nextStage.queue.join(', ')}].`,
          isError: false,
        });
        showToast(`Correct! Stage ${nextStageIndex} of ${stages.length} Solved (+50 🪙)`, '✅');
        if (currentUser) {
          currentUser.coins += 50;
          currentUser.xp += 15;
          authService.saveUser(currentUser);
          setCurrentUser({ ...currentUser });
        }
        if (engineRef.current) {
          engineRef.current.updateLevel3Terminal(
            nextStage.stageNumber,
            nextStage.visited,
            nextStage.queue,
            nextStage.question
          );
        }
      } else {
        // All stages solved -> BFS reaches target
        setLevel3Feedback({
          message: currentLevel === 5
            ? `TARGET FOUND ✓\nSHORTEST PATH DISCOVERED\n\nWalk into the RED TARGET circle to unlock the East Exit door.`
            : `${currentStage.successMessage}\n\n🎯 TARGET DISCOVERED!\nFollow the path and walk into the RED TARGET circle to unlock the East Exit door.`,
          isError: false,
        });
        setIsBfsTargetFound(true);
        showToast(currentLevel === 5 ? 'TARGET FOUND ✓ — SHORTEST PATH DISCOVERED!' : 'TARGET DISCOVERED! Walk into the RED TARGET circle.', '🎯');
        sound.playKeypad();
        if (engineRef.current) {
          if (currentLevel === 5) {
            engineRef.current.showShortestPath(['S', 'A', 'E', 'L', 'Q', 'TARGET']);
            engineRef.current.updateLevel3Terminal(
              5,
              ['START', 'A', 'E', 'L', 'Q'],
              ['TARGET'],
              'TARGET FOUND ✓ — SHORTEST PATH DISCOVERED: S → A → E → L → Q → TARGET (5 steps).'
            );
          } else if (currentLevel === 4) {
            engineRef.current.showShortestPath(['S', 'A', 'E', 'TARGET']);
            engineRef.current.updateLevel3Terminal(
              6,
              ['START', 'A', 'B', 'C', 'D', 'X1', 'E'],
              ['TARGET'],
              'TARGET DISCOVERED! Walk into the RED TARGET circle to unlock the East Exit.'
            );
          } else {
            engineRef.current.showShortestPath(['S', 'A', 'B', 'E', 'TARGET']);
            engineRef.current.updateLevel3Terminal(
              4,
              ['S', 'A', 'B', 'C', 'D', 'E'],
              ['TARGET'],
              'TARGET DISCOVERED! Walk into the RED TARGET circle.'
            );
          }
        }
      }
    } else {
      // Incorrect node stepped on
      sound.playAccessDenied();
      if (engineRef.current) {
        engineRef.current.setNodeFeedbackVisual(nodeId, 'wrong');
      }
      const frontNode = currentStage.queue[0];
      const isDeadEnd = currentLevel === 4 && LEVEL4_DEAD_ENDS.includes(nodeId);
      const LEVEL5_LONGER_ROUTES = ['B', 'C', 'G', 'N', 'R', 'U', 'I', 'P', 'T', 'V', 'W'];

      if (currentLevel === 5 && LEVEL5_LONGER_ROUTES.includes(nodeId)) {
        setLevel3Feedback({
          message: 'PATH CONTINUES...\nCheck the BFS search order.',
          isError: true,
        });
        showToast('PATH CONTINUES... Check the BFS search order.', '⚠');
      } else if (currentLevel === 5) {
        setLevel3Feedback({
          message: '✕ WRONG PATH\nCheck the BFS search order.',
          isError: true,
        });
        showToast('✕ WRONG PATH: Check the BFS search order.', '❌');
      } else if (isDeadEnd) {
        setLevel3Feedback({
          message: 'DEAD END\nThis branch has no unexplored path.',
          isError: true,
        });
        showToast('DEAD END: This branch has no unexplored path.', '⚠');
      } else if (currentLevel === 4) {
        setLevel3Feedback({
          message: `✕ WRONG BFS CHOICE\nCheck the FRONT of the queue. Node [${frontNode}] must be explored first.`,
          isError: true,
        });
        showToast(`✕ WRONG BFS CHOICE: Check the FRONT of the queue [${frontNode}].`, '❌');
      } else {
        setLevel3Feedback({
          message: currentStage.wrongMessage || `✕ NOT YET\nNode [${nodeId}] violates BFS FIFO order. Next node to explore is [${frontNode}] from front of queue.`,
          isError: true,
        });
        showToast(`Invalid Choice! BFS FIFO explores [${frontNode}] next.`, '❌');
      }
    }
  };

  handleLevel3CircleStepRef.current = handleLevel3CircleStep;

  // Heuristic Chamber Level 1 State & Handlers
  const [heuristicStage, setHeuristicStage] = useState<number>(0);
  const [heuristicFeedback, setHeuristicFeedback] = useState<{ isError: boolean; title: string; explanation: string } | null>(null);
  const heuristicStageRef = useRef<number>(0);
  heuristicStageRef.current = heuristicStage;
  const handleHeuristicCircleStepRef = useRef<(nodeId: string) => void>(() => {});

  const handleBeginHeuristicSearch = () => {
    sound.playAccessGranted();
    setHeuristicStage(1);
    setHeuristicFeedback(null);
    if (engineRef.current) {
      engineRef.current.updateHeuristicChamberStage(1);
    }
  };

  const handleDismissHeuristicTeaching = () => {
    sound.playAccessGranted();
    setHeuristicStage(5);
    setHeuristicFeedback(null);
    if (engineRef.current) {
      engineRef.current.updateHeuristicChamberStage(5);
    }
    showToast('TARGET LOCATED! Walk to the RED TARGET node.', '🎯');
  };

  const handleHeuristicExitCrossed = () => {
    if (heuristicStageRef.current < 6) return;
    setHeuristicStage(7);
    sound.playVictory();
    showToast('HEURISTIC CHAMBER LEVEL 1 COMPLETE!', '🏆');
    if (currentUser) {
      currentUser.coins += 250;
      currentUser.xp += 80;
      authService.saveUser(currentUser);
      setCurrentUser({ ...currentUser });
    }
  };

  const handleRestartHeuristicChamber = () => {
    sound.playUiClick();
    setHeuristicStage(0);
    setHeuristicFeedback(null);
    if (engineRef.current) {
      engineRef.current.loadLevel(1, 'heuristic_chamber');
    }
  };

  const handleHeuristicCircleStep = (nodeId: string) => {
    if (currentGame !== 'heuristic_chamber') return;
    const stage = heuristicStageRef.current;

    // Stage 1: Candidates B, C, D -> C is correct
    if (stage === 1) {
      if (nodeId === 'C') {
        sound.playAccessGranted();
        if (engineRef.current) {
          engineRef.current.setNodeFeedbackVisual('C', 'correct');
        }
        setHeuristicFeedback({
          isError: false,
          title: '✓ CORRECT',
          explanation: 'A* selected the node with the lowest f(n).\n\nC:\ng = 4\nh = 3\n\nf = 4 + 3 = 7',
        });
        setTimeout(() => {
          setHeuristicStage(2);
          setHeuristicFeedback(null);
          if (engineRef.current) {
            engineRef.current.updateHeuristicChamberStage(2);
          }
        }, 2200);
      } else if (nodeId === 'B' || nodeId === 'D') {
        sound.playKeypad();
        if (engineRef.current) {
          engineRef.current.setNodeFeedbackVisual(nodeId, 'wrong');
        }
        setHeuristicFeedback({
          isError: true,
          title: '✕ NOT THE BEST CHOICE',
          explanation: 'Compare the f(n) values.\n\nf(n) = g(n) + h(n)\n\nB: 2 + 6 = 8\nC: 4 + 3 = 7\nD: 3 + 7 = 10',
        });
      }
      return;
    }

    // Stage 2: Candidates E, F, G -> F is correct
    if (stage === 2) {
      if (nodeId === 'F') {
        sound.playAccessGranted();
        if (engineRef.current) {
          engineRef.current.setNodeFeedbackVisual('F', 'correct');
        }
        setHeuristicFeedback({
          isError: false,
          title: '✓ CORRECT',
          explanation: 'A* selected the node with the lowest f(n).\n\nF:\ng = 6\nh = 2\n\nf = 6 + 2 = 8',
        });
        setTimeout(() => {
          setHeuristicStage(3);
          setHeuristicFeedback(null);
          if (engineRef.current) {
            engineRef.current.updateHeuristicChamberStage(3);
          }
        }, 2200);
      } else if (nodeId === 'E' || nodeId === 'G') {
        sound.playKeypad();
        if (engineRef.current) {
          engineRef.current.setNodeFeedbackVisual(nodeId, 'wrong');
        }
        setHeuristicFeedback({
          isError: true,
          title: '✕ NOT THE BEST CHOICE',
          explanation: 'Compare the f(n) values.\n\nf(n) = g(n) + h(n)\n\nE: 5 + 4 = 9\nF: 6 + 2 = 8\nG: 4 + 6 = 10',
        });
      }
      return;
    }

    // Stage 3: Candidates H, I, J, K -> J is correct
    if (stage === 3) {
      if (nodeId === 'J') {
        sound.playAccessGranted();
        if (engineRef.current) {
          engineRef.current.setNodeFeedbackVisual('J', 'correct');
        }
        setHeuristicFeedback({
          isError: false,
          title: '✓ CORRECT',
          explanation: 'Node J selected! Even though node I had h=1, its cost travelled was g=11 (f=12).\nNode J achieves the lowest total f(n) = 7 + 3 = 10!',
        });
        setTimeout(() => {
          setHeuristicStage(4);
          setHeuristicFeedback(null);
        }, 2200);
      } else if (nodeId === 'H' || nodeId === 'I' || nodeId === 'K') {
        sound.playKeypad();
        if (engineRef.current) {
          engineRef.current.setNodeFeedbackVisual(nodeId, 'wrong');
        }
        setHeuristicFeedback({
          isError: true,
          title: '✕ NOT THE BEST CHOICE',
          explanation: 'Compare total f(n) = g(n) + h(n).\nNotice node I has h=1, but g=11 so f=12!\n\nH: 8 + 4 = 12\nI: 11 + 1 = 12\nJ: 7 + 3 = 10\nK: 9 + 5 = 14',
        });
      }
      return;
    }

    // Stage 5: Target Located -> Step into TARGET
    if (stage === 5 && (nodeId === 'TARGET' || nodeId === 'heuristic_node_TARGET')) {
      sound.playAccessGranted();
      if (engineRef.current) {
        engineRef.current.setNodeFeedbackVisual('TARGET', 'correct');
        engineRef.current.openVault();
      }
      setHeuristicStage(6);
      showToast('TARGET REACHED! East exit door unlocked. Walk through to complete!', '🏆');
      return;
    }

    // Stage 6: Step through exit
    if (stage === 6 && (nodeId === 'EXIT' || nodeId === 'DOOR' || nodeId === 'heuristic_exit_door')) {
      handleHeuristicExitCrossed();
      return;
    }
  };

  handleHeuristicCircleStepRef.current = handleHeuristicCircleStep;

  // 1. Initialize Game Engine when page switches to 'game'
  useEffect(() => {
    if (page !== 'game') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!containerRef.current || !currentUser) return;

    try {
      const engine = new GameEngine(containerRef.current, currentUser.avatar, currentLevel, currentGame);
      engineRef.current = engine;

      // Engine Callbacks
      engine.onNearbyObjectChange = (obj) => {
        setNearbyObject(obj);
      };

      engine.onTriggerInteract = (obj) => {
        handleTriggerInteract(obj);
      };

      engine.onDecisionCircleStep = (nodeId) => {
        if (engine.currentGame === 'heuristic_chamber') {
          handleHeuristicCircleStepRef.current?.(nodeId);
        } else {
          handleLevel3CircleStepRef.current?.(nodeId);
        }
      };

      engine.onLaserTripped = (laserName) => {
        showToast(`Security Alert! ${laserName || 'Laser beam'} tripped. Reset to checkpoint.`, '⚡');
      };

      engine.onTargetReached = () => {
        setIsTargetReached(true);
        if (engine.currentLevel === 5) {
          showToast('LEVEL 5 COMPLETE! Shortest Path Reached. East Exit Door Unlocked!', '⭐');
        } else if (engine.currentLevel === 4) {
          showToast('LEVEL 4 COMPLETE! Target Reached. East Exit Door Unlocked!', '⭐');
        } else if (engine.currentLevel === 3) {
          showToast('LEVEL 3 COMPLETE! Target Reached. East Exit Door Unlocked!', '⭐');
        } else if (engine.currentLevel === 2) {
          showToast('LEVEL 2 COMPLETE! Target Reached. East Exit Door Unlocked!', '⭐');
        } else {
          showToast('LEVEL 1 COMPLETE! Target Reached. North Exit Door Unlocked!', '⭐');
        }
      };

      let lastCompassUpdate = 0;
      engine.onPlayerPositionChange = (data) => {
        const now = performance.now();
        if (now - lastCompassUpdate > 16) {
          lastCompassUpdate = now;
          setPlayerTransform(data);
        }
      };

      engine.onWinReached = () => {
        if (currentGame === 'heuristic_chamber') {
          handleHeuristicExitCrossed();
        } else if (currentGame === 'search_maze') {
          setIsLevelExitCrossed(true);
          sound.playVictory();
        } else {
          if (!isEscaped) {
            setIsEscaped(true);
            setIsVictoryOpen(true);
            const updated = authService.recordEscapeWin(currentLevel, 500, 100);
            if (updated) {
              setCurrentUser({ ...updated });
            }
            sound.playWin();
          }
        }
      };
    } catch (err) {
      console.error('Failed to initialize 3D room engine:', err);
    }

    // Audio gesture startup
    const startAudioOnGesture = () => {
      sound.init();
      if (!isMuted) {
        sound.startBGM();
      }
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
    window.addEventListener('click', startAudioOnGesture);
    window.addEventListener('keydown', startAudioOnGesture);

    return () => {
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [page, currentLevel, currentGame]);

  // 2. Room Timer (Only when in active game)
  useEffect(() => {
    if (page !== 'game' || isEscaped) return;
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [page, isEscaped]);

  // Synchronize controls lock with modal visibility
  useEffect(() => {
    if (!engineRef.current) return;
    const shouldLock = Boolean(activePuzzle || isHelpOpen || isVictoryOpen);
    engineRef.current.isControlsLocked = shouldLock;
  }, [activePuzzle, isHelpOpen, isVictoryOpen]);

  // Level Switch Handler
  const handleSelectLevel = (levelId: LevelId) => {
    setCurrentLevel(levelId);
    setTimeElapsed(0);
    setHintsUsed(0);
    setIsEscaped(false);
    setIsVictoryOpen(false);
    setInventory([]);
    setSelectedItem(null);
    setSolvedPuzzles({});
    setActivePuzzle(null);
    setNearbyObject(null);
    setIsBfsSearching(false);
    setIsBfsTargetFound(false);
    setIsTargetReached(false);
    setIsLevelExitCrossed(false);
    setCurrentBfsStepIndex(-1);
    level3StageIndexRef.current = 0;
    setLevel3StageIndex(0);
    setLevel3RuleReminder(false);
    setLevel3Feedback(null);
    if (bfsIntervalRef.current) {
      clearInterval(bfsIntervalRef.current);
    }

    if (engineRef.current) {
      engineRef.current.loadLevel(levelId, currentGame);
    }
    const levelName = currentGame === 'heuristic_chamber'
      ? 'Heuristic Chamber Level 1: First Heuristic'
      : currentGame === 'search_maze'
      ? `Search Maze Level ${levelId}`
      : `Level ${levelId}: ${LEVELS_DATA[levelId]?.name || ''}`;
    showToast(`Loaded ${levelName}`, currentGame === 'heuristic_chamber' ? '🗺️' : currentGame === 'search_maze' ? '🧭' : LEVELS_DATA[levelId]?.icon || '🗝️');
  };

  // Launch Game from Home Hub
  const handleStartGameFromHub = (levelId: LevelId, gameId?: GameId) => {
    const activeGame = gameId || 'agent_academy';
    setCurrentGame(activeGame);
    setCurrentLevel(levelId);
    setTimeElapsed(0);
    setHintsUsed(0);
    setIsEscaped(false);
    setIsVictoryOpen(false);
    setInventory([]);
    setSelectedItem(null);
    setSolvedPuzzles({});
    setActivePuzzle(null);
    setNearbyObject(null);
    setIsBfsSearching(false);
    setIsBfsTargetFound(false);
    setIsTargetReached(false);
    setIsLevelExitCrossed(false);
    setCurrentBfsStepIndex(-1);
    level3StageIndexRef.current = 0;
    setLevel3StageIndex(0);
    setLevel3RuleReminder(false);
    setLevel3Feedback(null);
    setHeuristicStage(0);
    setHeuristicFeedback(null);
    heuristicStageRef.current = 0;
    setPage('game');
  };

  // BFS Search Handlers for Search Maze
  const handleStartBfs = () => {
    if (isBfsSearching) return;
    if (bfsIntervalRef.current) {
      clearInterval(bfsIntervalRef.current);
    }

    let steps: BfsStepState[];
    let stepIntervalMs = 1300;

    if (currentLevel === 5) {
      const gridResult = executeGridBFS(LEVEL5_START_CELL, LEVEL5_TARGET_CELL, LEVEL5_MAZE_GRID);
      const shortestPathKeys = (gridResult.shortestPath || []).map(([c, r]) => `${c},${r}`);
      steps = gridResult.steps.map((st) => ({
        activeNode: `${st.currentCell[0]},${st.currentCell[1]}`,
        visited: st.visited,
        queue: st.queue.map(([qc, qr]) => `${qc},${qr}`),
        layer: st.frontierDepth,
        isTargetFound: st.isTargetFound,
        shortestPath: shortestPathKeys,
        description: st.description,
      }));
      stepIntervalMs = 260; // Fast dynamic exploration of 19x13 maze labyrinth
    } else {
      const graph = currentLevel === 2 ? LEVEL2_GRAPH : LEVEL1_GRAPH;
      steps = generateBfsSteps(graph, 'S', 'G');
    }

    setBfsSteps(steps);
    setIsBfsSearching(true);
    setIsBfsTargetFound(false);
    setCurrentBfsStepIndex(0);
    sound.playKeypad();

    // Visually highlight first node
    if (engineRef.current && steps.length > 0) {
      engineRef.current.highlightBfsStep(
        steps[0].activeNode,
        steps[0].visited,
        steps[0].queue,
        steps[0].isTargetFound
      );
    }

    let stepIdx = 0;
    bfsIntervalRef.current = setInterval(() => {
      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        setCurrentBfsStepIndex(stepIdx);
        if (engineRef.current) {
          engineRef.current.highlightBfsStep(
            step.activeNode,
            step.visited,
            step.queue,
            step.isTargetFound
          );
        }
        sound.playBeep();

        if (step.isTargetFound) {
          if (bfsIntervalRef.current) clearInterval(bfsIntervalRef.current);
          setIsBfsSearching(false);
          setIsBfsTargetFound(true);
          sound.playAccessGranted();
          if (engineRef.current) {
            engineRef.current.showShortestPath(step.shortestPath);
          }
          showToast('TARGET FOUND! BFS solved the 29-step shortest maze path.', '🎯');
        }
        stepIdx++;
      } else {
        if (bfsIntervalRef.current) clearInterval(bfsIntervalRef.current);
        setIsBfsSearching(false);
      }
    }, stepIntervalMs);
  };

  const handleResetBfs = () => {
    if (bfsIntervalRef.current) {
      clearInterval(bfsIntervalRef.current);
    }
    setIsBfsSearching(false);
    setIsBfsTargetFound(false);
    setCurrentBfsStepIndex(-1);
    if (engineRef.current) {
      engineRef.current.isBfsTargetDiscovered = false;
      engineRef.current.isTargetReached = false;
      engineRef.current.isLevelExitCrossed = false;
      if (engineRef.current.roomEnv.shortestPathBeams) {
        engineRef.current.roomEnv.shortestPathBeams.visible = false;
      }
      if (currentLevel === 5 && engineRef.current.roomEnv.maze5FloorTiles) {
        engineRef.current.roomEnv.maze5FloorTiles.forEach((tile) => {
          const mat = tile.material as any;
          if (mat && mat.emissive) {
            mat.emissive.setHex(0x0284c7);
            mat.emissiveIntensity = 0.04;
          }
        });
      }
      engineRef.current.highlightBfsStep('S', [], ['S'], false);
    }
  };

  const handleRestartSearchMaze = () => {
    handleResetBfs();
    setIsTargetReached(false);
    setIsLevelExitCrossed(false);
    level3StageIndexRef.current = 0;
    setLevel3StageIndex(0);
    setLevel3RuleReminder(false);
    setLevel3Feedback(null);
    if (engineRef.current) {
      engineRef.current.loadLevel(currentLevel, 'search_maze');
      if (currentLevel === 3 || currentLevel === 4 || currentLevel === 5) {
        engineRef.current.resetLevel3NodesVisual();
      }
    }
    showToast(`Search Maze Level ${currentLevel} Reloaded.`, '🧭');
  };

  // Handle Object Interaction
  const handleTriggerInteract = (obj: InteractiveObjectData) => {
    // Search Maze Specific Triggers
    if (obj.id === 'search_maze_terminal_3' || obj.id === 'search_maze_terminal_4' || obj.id === 'search_maze_terminal_5') {
      showToast('Terminal displays the BFS queue. Physically walk into the circle matching the FIFO front!', '🧠');
      return;
    }

    // Heuristic Chamber interactions
    if (currentGame === 'heuristic_chamber') {
      if (obj.id === 'heuristic_console') {
        showToast('A* Navigation Console: f(n) = g(n) + h(n). Walk into the candidate circle with the lowest f(n)!', '🗺️');
        return;
      }
      if (obj.id === 'heuristic_node_TARGET') {
        handleHeuristicCircleStep('TARGET');
        return;
      }
      if (obj.id.startsWith('heuristic_node_')) {
        const nodeId = obj.id.replace('heuristic_node_', '');
        handleHeuristicCircleStep(nodeId);
        return;
      }
      if (obj.id === 'heuristic_exit_door') {
        if (heuristicStageRef.current >= 6) {
          handleHeuristicExitCrossed();
        } else {
          showToast('Exit Doorway is locked! Reach the Red Target first using A* Search.', '🔒');
        }
        return;
      }
    }

    if (obj.id.startsWith('search_maze_node_')) {
      return;
    }

    if (obj.id === 'search_maze_start_terminal' || obj.id === 'bfs_start_terminal') {
      handleStartBfs();
      return;
    }

    if (obj.id === 'search_maze_target_node' || obj.id === 'bfs_target_node') {
      if (!isBfsTargetFound) {
        showToast('First run the BFS Search at the Start Terminal to discover the target!', '🧭');
      } else {
        const pathStr = currentLevel === 2 ? 'S → A → B → E → G (4 moves)' : 'S → N1 → N4 → G (3 moves)';
        showToast(`Red Target Node reached! Shortest Path: ${pathStr}.`, '🎯');
      }
      return;
    }

    if (obj.id === 'search_maze_exit_door' || obj.id === 'bfs_exit_door') {
      if (currentLevel === 3 || currentLevel === 4 || currentLevel === 5) {
        const stagesCount = currentLevel === 5 ? LEVEL5_DECISION_STAGES.length : (currentLevel === 4 ? LEVEL4_DECISION_STAGES.length : LEVEL3_DECISION_STAGES.length);
        if (isTargetReached || isBfsTargetFound || level3StageIndexRef.current >= stagesCount) {
          setIsTargetReached(true);
          setIsLevelExitCrossed(true);
          if (engineRef.current) {
            engineRef.current.isTargetReached = true;
            engineRef.current.isLevelExitCrossed = true;
            engineRef.current.openVault();
          }
          sound.playVictory();
          showToast(`East Exit Gateway Crossed! Level ${currentLevel} Complete!`, '🎉');
          return;
        } else {
          showToast('East Gateway is locked! Complete BFS queue decisions to unlock.', '🔒');
          return;
        }
      }

      if (isTargetReached) {
        setIsLevelExitCrossed(true);
        if (engineRef.current) {
          engineRef.current.isLevelExitCrossed = true;
        }
        sound.playVictory();
      } else {
        const wallStr = currentLevel === 2 ? 'EAST WALL' : 'NORTH WALL';
        showToast(`Exit Door is at the ${wallStr}. Reach Red Target [G] first to unlock!`, '🔒');
      }
      return;
    }

    // Collectible Pickups (Coins, Gems, Rubies)
    if (obj.type === 'coin_pickup' || obj.type === 'cryo_gem' || obj.type === 'egypt_ruby') {
      if (engineRef.current) {
        engineRef.current.removeCollectible(obj.id);
      }
      const reward = obj.type === 'coin_pickup' ? 50 : 100;
      if (currentUser) {
        currentUser.coins += reward;
        currentUser.xp += 10;
        authService.saveUser(currentUser);
        setCurrentUser({ ...currentUser });
      }
      showToast(`Collected Secret Treasure! (+${reward} 🪙)`, '🪙');
      return;
    }

    // Open specific Puzzle modal
    setActivePuzzle(obj);
    if (engineRef.current) {
      engineRef.current.isControlsLocked = true;
    }
  };

  // Close Puzzle Modal
  const handleClosePuzzle = () => {
    setActivePuzzle(null);
    if (engineRef.current) {
      engineRef.current.isControlsLocked = false;
    }
  };

  // Solve Puzzle Step Callback
  const handleSolvePuzzle = (
    puzzleKey: string,
    unlockedItem?: InventoryItem,
    rewardCoins: number = 100
  ) => {
    setSolvedPuzzles((prev) => ({ ...prev, [puzzleKey]: true }));
    if (currentUser) {
      currentUser.coins += rewardCoins;
      currentUser.xp += 25;
      authService.saveUser(currentUser);
      setCurrentUser({ ...currentUser });
    }

    if (unlockedItem) {
      setInventory((prev) => {
        if (prev.some((i) => i.id === unlockedItem.id)) return prev;
        return [...prev, unlockedItem];
      });
      showToast(`Acquired: ${unlockedItem.name}!`, unlockedItem.icon);
    }

    // Level 1: Agent Academy (The Four-Digit Lock)
    if (puzzleKey === 'securityConsoleCracked' && engineRef.current) {
      showToast('Access Code 7416 Verified! Access Key Dispensed.', '🔑');
    }
    if ((puzzleKey === 'level2DoorOpened' || puzzleKey === 'vaultOpened') && engineRef.current) {
      engineRef.current.openVault();
      showToast('Level 2 Security Door Unlatched! Physically walk through the doorway to complete Level 1.', '🔓');
    }

    // Legacy / Level 1 compatibility
    if (puzzleKey === 'powerRestored' && engineRef.current) {
      engineRef.current.restorePower();
      showToast('Power Restored! Mainframe Terminal is now Online.', '⚡');
    }
    if (puzzleKey === 'terminalSolved' && engineRef.current) {
      engineRef.current.deactivateLasers();
      showToast('Lasers Deactivated! Master Keycard Dispensed.', '💳');
    }

    // Level 2: The Pattern Lab (Agent Academy Level 2)
    if (puzzleKey === 'patternPanel1Solved') {
      showToast('Panel 1 Solved! Pattern Core Alpha [ △ ] Acquired.', '🔺');
    }
    if (puzzleKey === 'patternPanel2Solved') {
      showToast('Panel 2 Solved! Pattern Core Beta [ ⬡ ] Acquired.', '🔷');
    }
    if (puzzleKey === 'patternPanel3Solved') {
      showToast('Panel 3 Solved! Pattern Core Gamma [ ◁ ] Acquired.', '💠');
    }
    if (puzzleKey === 'masterPatternConsoleSolved') {
      showToast('Visual Pattern Deduction Complete! Pattern Key Dispensed.', '🔑');
    }
    if ((puzzleKey === 'level3DoorOpened' || puzzleKey === 'cyberAirlockOpened' || puzzleKey === 'airlockOpened') && engineRef.current) {
      engineRef.current.openVault();
      showToast('Level 3 Security Door Unlatched! Walk through the portal to complete Level 2.', '🔓');
    }

    // Level 3: The Memory Chamber (Agent Academy Level 3)
    if (puzzleKey === 'memoryChamberSolved') {
      showToast('Master Memory Challenge Complete! Master Access Code 8392 Decrypted.', '🔑');
    }
    if ((puzzleKey === 'level4DoorOpened' || puzzleKey === 'memoryDoorOpened') && engineRef.current) {
      engineRef.current.openVault();
      showToast('Level 4 Security Blast Door Unlocked! Step through the portal to complete Level 3.', '🔓');
    }

    // Level 4: The Evidence Room (Agent Academy Level 4 Detective Challenge)
    if (puzzleKey === 'evidenceCaseSolved' || puzzleKey === 'suspectIdentified') {
      showToast('Case Closed! Suspect Identified. Evidence Drawer Unlocked.', '📂');
    }
    if (puzzleKey === 'evidenceDrawerOpened') {
      showToast('Evidence Drawer Opened! Heavy Archive Key Acquired.', '🔑');
    }
    if ((puzzleKey === 'level5DoorOpened' || puzzleKey === 'archiveDoorOpened') && engineRef.current) {
      engineRef.current.openVault();
      showToast('Level 5 Archive Blast Doors Unbolted! Walk through the doorway to complete Level 4.', '🔓');
    }

    // Level 5: The Laser Corridor (Movement & Timing)
    if (puzzleKey === 'checkpointASaved') {
      showToast('Sector A Checkpoint Saved! Respawn coordinates linked.', '🟢');
    }
    if (puzzleKey === 'checkpointBSaved') {
      showToast('Sector B Checkpoint Saved! Frequency Override Card Acquired.', '💳');
    }
    if (puzzleKey === 'laserMasterDisabled' && engineRef.current) {
      engineRef.current.deactivateLasers();
      engineRef.current.openVault();
      showToast('Master Security Grid Deactivated! Level 6 Protocol Vault Unlatched.', '⚡');
    }
    if (puzzleKey === 'level6DoorOpened') {
      if (engineRef.current) {
        engineRef.current.openVault();
      }
      setIsEscaped(true);
      setIsVictoryOpen(true);
      const updated = authService.recordEscapeWin(currentLevel, 500, 100);
      if (updated) {
        setCurrentUser({ ...updated });
      }
      sound.playWin();
      showToast('Level 5 Conquered! Level 6 Protocol Gateway Transcended.', '🎉');
    }

    // Level 3 specific triggers
    if (puzzleKey === 'dialAligned' && engineRef.current) {
      showToast('Celestial Alignment Complete! Sacred Hieroglyphs Illuminated.', '☀️');
    }
    if (puzzleKey === 'portalOpened' && engineRef.current) {
      engineRef.current.openVault();
      showToast('Ancient Stone Portal Opened! Walk through to escape.', '🏛️');
    }

    // Search Maze: Level 1 (BFS First Search)
    if (puzzleKey === 'bfsTargetFound') {
      if (engineRef.current) {
        engineRef.current.openVault();
      }
      showToast('TARGET FOUND! BFS explored 8 nodes. Shortest path: 4 moves.', '🧭');
    }
    if (puzzleKey === 'searchMazeLevel1Solved') {
      if (engineRef.current) {
        engineRef.current.openVault();
      }
      setIsEscaped(true);
      setIsVictoryOpen(true);
      const updated = authService.recordEscapeWin(currentLevel, 500, 100);
      if (updated) {
        setCurrentUser({ ...updated });
      }
      sound.playWin();
      showToast('Search Maze Level 1 Complete! Red Target reached.', '🏆');
    }

    if (
      puzzleKey === 'level2DoorOpened' ||
      puzzleKey === 'level3DoorOpened' ||
      puzzleKey === 'level4DoorOpened' ||
      puzzleKey === 'level5DoorOpened' ||
      puzzleKey === 'level6DoorOpened' ||
      puzzleKey === 'portalOpened' ||
      puzzleKey === 'vaultOpened' ||
      puzzleKey === 'cyberAirlockOpened' ||
      puzzleKey === 'searchMazeLevel1Solved'
    ) {
      handleClosePuzzle();
    }
  };

  // Cryptic Hint Generator (Level and Game Aware)
  const handleGetHint = () => {
    setHintsUsed((prev) => prev + 1);
    sound.playGem();

    if (currentGame === 'heuristic_chamber') {
      const hcHints = [
        'A* balances past cost g(n) and future estimate h(n): f(n) = g(n) + h(n). Choose the node with the lowest f(n)!',
        'Stage 1: Evaluate candidate nodes B (f=8), C (f=7), and D (f=10). Walk physically into Node C (f=7)!',
        'Stage 2: Evaluate candidate nodes E (f=9), F (f=8), and G (f=10). Walk physically into Node F (f=8)!',
        'Stage 3: Node I looks closest because h=1, but its past cost is high (g=11, f=12). Node J has the lowest total cost (f=10)!',
        'Target Located! Follow the glowing cyan conduits directly into the Red Target beacon.',
        'The East Exit Door is unlatched! Walk through the doorway to complete Level 1.',
      ];
      const hintIdx = Math.min(heuristicStageRef.current, hcHints.length - 1);
      showToast(`Hint: ${hcHints[hintIdx]}`, '🗺️');
      return;
    }

    if (currentGame === 'search_maze') {
      const smHints = [
        'Locate the BFS Command Terminal at the west console to initiate graph traversal.',
        'Run BFS to expand the FIFO frontier queue layer-by-layer toward the Red Target [G].',
        'Step through the 3 depth layers until BFS discovers Target [G] in 4 shortest-path moves.',
        'Once target is found, walk through the North Quantum Transit Gateway to enter Level 2.',
      ];
      const hintIdx = solvedPuzzles.bfsTargetFound ? 3 : solvedPuzzles.bfsExploredCount ? 2 : 1;
      showToast(`Hint: ${smHints[hintIdx]}`, '🧭');
      return;
    }

    const hints = LEVELS_DATA[currentLevel].hints;
    let givenHint = hints[hints.length - 1];

    if (currentLevel === 1) {
      if (!solvedPuzzles.fragmentAExamined) givenHint = hints[0];
      else if (!solvedPuzzles.fragmentBExamined) givenHint = hints[1];
      else if (!solvedPuzzles.fragmentCExamined) givenHint = hints[2];
      else if (!solvedPuzzles.fragmentDExamined) givenHint = hints[3];
      else if (!solvedPuzzles.securityConsoleCracked) givenHint = hints[4];
      else if (!solvedPuzzles.level2DoorOpened) givenHint = hints[5];
    } else if (currentLevel === 2) {
      if (!solvedPuzzles.patternPanel1Solved) givenHint = hints[0];
      else if (!solvedPuzzles.patternPanel2Solved) givenHint = hints[1];
      else if (!solvedPuzzles.patternPanel3Solved) givenHint = hints[2];
      else if (!solvedPuzzles.masterPatternConsoleSolved) givenHint = hints[3];
      else if (!solvedPuzzles.level3DoorOpened) givenHint = hints[4];
    } else if (currentLevel === 3) {
      if (!solvedPuzzles.memoryChamberSolved) givenHint = hints[1];
      else if (!solvedPuzzles.level4DoorOpened) givenHint = hints[3];
      else givenHint = hints[4];
    } else if (currentLevel === 4) {
      if (!solvedPuzzles.securityTerminalChecked) givenHint = hints[0];
      else if (!solvedPuzzles.badgeLogChecked) givenHint = hints[1];
      else if (!solvedPuzzles.cctvChecked) givenHint = hints[2];
      else if (!solvedPuzzles.forensicChecked) givenHint = hints[3];
      else if (!solvedPuzzles.suspectIdentified) givenHint = hints[4];
      else if (!solvedPuzzles.level5DoorOpened) givenHint = hints[5];
      else givenHint = hints[4];
    } else if (currentLevel === 5) {
      if (!solvedPuzzles.checkpointASaved) givenHint = hints[0];
      else if (!solvedPuzzles.checkpointBSaved) givenHint = hints[1];
      else if (!solvedPuzzles.laserMasterDisabled) givenHint = hints[2];
      else if (!solvedPuzzles.level6DoorOpened) givenHint = hints[3];
      else givenHint = hints[4];
    }

    showToast(`Hint: ${givenHint}`, '💡');
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      sound.setVolumes(0, 0);
      sound.stopBGM();
    } else {
      sound.setVolumes(0.7, 0.4);
      sound.startBGM();
    }
  };

  // Reset / Restart Level
  const handleResetGame = () => {
    handleSelectLevel(currentLevel);
  };

  // Advance to Next Level
  const handleNextLevel = () => {
    const maxLevel = currentGame === 'search_maze' ? 5 : 5;
    if (currentLevel < maxLevel) {
      handleSelectLevel((currentLevel + 1) as LevelId);
    }
  };

  // Avatar Live & Save Update Handlers
  const handleLiveAvatarChange = (newAvatar: AvatarCustomization) => {
    if (engineRef.current) {
      engineRef.current.updateAvatar(newAvatar);
    }
  };

  const handleSaveAvatar = (newAvatar: AvatarCustomization) => {
    const updated = authService.updateAvatar(newAvatar);
    if (updated) {
      setCurrentUser({ ...updated });
    }
    if (engineRef.current) {
      engineRef.current.updateAvatar(newAvatar);
    }
    showToast('Avatar style updated!', '🎨');
  };

  // --- PAGE 1: AUTHENTICATION (Sign In / Sign Up) ---
  if (page === 'auth' || !currentUser) {
    return (
      <AuthView
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setPage('home');
        }}
        onContinueAsGuest={() => {
          const guest = authService.guestLogin('female');
          setCurrentUser(guest);
          setPage('home');
        }}
      />
    );
  }

  // --- PAGE 2: HOME GAME HUB ---
  if (page === 'home') {
    return (
      <HomeHub
        user={currentUser}
        onStartGame={handleStartGameFromHub}
        onOpenAvatarStudio={() => setPage('avatar_studio')}
        onSignOut={() => {
          authService.signOut();
          setCurrentUser(null);
          setPage('auth');
        }}
        onUserUpdated={(updated) => {
          setCurrentUser({ ...updated });
        }}
      />
    );
  }

  // --- PAGE 3: FULLSCREEN AVATAR STUDIO ---
  if (page === 'avatar_studio') {
    return (
      <AvatarCustomizer
        initialAvatar={currentUser.avatar}
        username={currentUser.username}
        userCoins={currentUser.coins}
        onChange={handleLiveAvatarChange}
        onSave={(newAvatar) => {
          handleSaveAvatar(newAvatar);
          setPage('home');
        }}
        onClose={() => setPage('home')}
      />
    );
  }

  // --- PAGE 4: ACTIVE 3D ESCAPE ROOM GAME ---
  return (
    <div id="game-app-root" className="fixed inset-0 w-full h-full overflow-hidden select-none bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div
        id="game-canvas-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-amber-400/40 shadow-2xl z-40 pointer-events-none animate-fadeIn flex items-center gap-2 max-w-md text-center">
          <span className="text-base">{toastMessage.icon}</span>
          <span className="text-slate-100 font-bold text-xs">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Bar Navigation & Level Selector */}
      <TopBar
        currentGame={currentGame}
        currentLevel={currentLevel}
        coins={currentUser.coins}
        timeElapsed={timeElapsed}
        isMuted={isMuted}
        onSelectLevel={handleSelectLevel}
        onToggleSound={handleToggleSound}
        onOpenHelp={() => {
          if (engineRef.current) engineRef.current.isControlsLocked = true;
          setIsHelpOpen(true);
        }}
        onGetHint={handleGetHint}
        onResetGame={handleResetGame}
        onExitToHome={() => {
          sound.playUiClick();
          setPage('home');
        }}
        onOpenAvatarCustomizer={() => {
          sound.playUiClick();
          if (engineRef.current) engineRef.current.isControlsLocked = true;
          setShowInGameAvatarStudio(true);
        }}
      />

      {/* Proximity Interaction Prompt */}
      {nearbyObject && !activePuzzle && (
        <InteractPrompt
          objectData={nearbyObject}
          onInteract={() => handleTriggerInteract(nearbyObject)}
        />
      )}

      {/* Search Maze Dedicated HUD (Only for Search Maze) */}
      {currentGame === 'search_maze' && (
        <SearchMazeHUD
          bfsSteps={bfsSteps}
          currentStepIndex={currentBfsStepIndex}
          isSearching={isBfsSearching}
          targetFound={isBfsTargetFound}
          targetReached={isTargetReached}
          levelExitCrossed={isLevelExitCrossed}
          currentLevel={currentLevel}
          playerTransform={playerTransform}
          level3StageIndex={level3StageIndex}
          level3Feedback={level3Feedback}
          level3RuleReminder={level3RuleReminder}
          onDismissRuleReminder={() => setLevel3RuleReminder(false)}
          onCircleClick={handleLevel3CircleStep}
          onStartBfs={handleStartBfs}
          onResetBfs={handleResetBfs}
          onRestartLevel={handleRestartSearchMaze}
          onNextLevel={handleNextLevel}
        />
      )}

      {/* Heuristic Chamber Dedicated HUD (Only for Heuristic Chamber) */}
      {currentGame === 'heuristic_chamber' && (
        <HeuristicChamberHUD
          stageIndex={heuristicStage}
          feedback={heuristicFeedback}
          playerTransform={playerTransform}
          onBeginSearch={handleBeginHeuristicSearch}
          onDismissTeaching={handleDismissHeuristicTeaching}
          onStepCandidate={handleHeuristicCircleStep}
          onRestartLevel={handleRestartHeuristicChamber}
          onReturnToHub={() => {
            sound.playUiClick();
            setPage('home');
          }}
          onExitToHome={() => {
            sound.playUiClick();
            setPage('home');
          }}
        />
      )}

      {/* Bottom Inventory Bar (Only for Agent Academy) */}
      {currentGame !== 'search_maze' && currentGame !== 'heuristic_chamber' && (
        <InventoryBar
          items={inventory}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
        />
      )}

      {/* Virtual D-Pad & Action Controls */}
      <MobileControls
        onMove={(x, z) => engineRef.current?.setVirtualMovement(x, z)}
        onJump={() => engineRef.current?.jump()}
        onInteract={() => engineRef.current?.interactCurrent()}
        hasInteractable={!!nearbyObject}
      />

      {/* Active Puzzle Inspection Modal */}
      {activePuzzle && (
        <PuzzleModal
          currentLevel={currentLevel}
          objectData={activePuzzle}
          inventory={inventory}
          solvedPuzzles={solvedPuzzles}
          selectedItem={selectedItem}
          onSolvePuzzle={handleSolvePuzzle}
          onUseItem={(itemId) => setSelectedItem(itemId)}
          onSetCheckpoint={(pos) => engineRef.current?.setCheckpoint(pos)}
          onClose={handleClosePuzzle}
        />
      )}

      {/* In-Game Avatar Customizer Modal */}
      {showInGameAvatarStudio && (
        <AvatarCustomizer
          isModal={true}
          initialAvatar={currentUser.avatar}
          username={currentUser.username}
          userCoins={currentUser.coins}
          onChange={handleLiveAvatarChange}
          onSave={(newAvatar) => {
            handleSaveAvatar(newAvatar);
            if (engineRef.current) engineRef.current.isControlsLocked = false;
            setShowInGameAvatarStudio(false);
          }}
          onClose={() => {
            if (engineRef.current) engineRef.current.isControlsLocked = false;
            setShowInGameAvatarStudio(false);
          }}
        />
      )}

      {/* Controls & Escape Guide Modal */}
      {isHelpOpen && (
        <ControlsHelp
          onClose={() => {
            if (engineRef.current) engineRef.current.isControlsLocked = false;
            setIsHelpOpen(false);
          }}
        />
      )}

      {/* Victory Celebration Modal */}
      {isVictoryOpen && (
        <VictoryModal
          currentGame={currentGame}
          currentLevel={currentLevel}
          timeElapsed={timeElapsed}
          hintsUsed={hintsUsed}
          coinsEarned={500}
          onPlayAgain={handleResetGame}
          onNextLevel={handleNextLevel}
          onReturnHome={() => {
            if (engineRef.current) engineRef.current.isControlsLocked = false;
            setIsVictoryOpen(false);
            setPage('home');
          }}
          onContinue={() => {
            if (engineRef.current) engineRef.current.isControlsLocked = false;
            setIsVictoryOpen(false);
            setPage('home');
          }}
        />
      )}
    </div>
  );
}
