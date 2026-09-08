import { LevelId, LevelInfo } from '../types';

export interface SearchMazeLevelMeta extends LevelInfo {
  missionTitle: string;
  missionObjective: string;
  conceptTitle: string;
  conceptSummary: string;
  nodesCount: number;
  shortestPathLength: number;
}

export const SEARCH_MAZE_LEVELS_DATA: Record<number, SearchMazeLevelMeta> = {
  1: {
    id: 1,
    name: 'Level 1',
    chapter: 'Search Maze - Level 1',
    themeName: 'First Search — Breadth First Search Intro',
    icon: '🧭',
    badgeColor: 'from-teal-500 to-emerald-600',
    description: 'Enter the quantum grid. Execute BFS to explore layer-by-layer neighbours and locate the Red Target node.',
    roomSize: { width: 22, depth: 22, height: 7 },
    missionTitle: 'MISSION 01: FIND THE TARGET',
    missionObjective: 'Reach the red target using the shortest possible route using Breadth-First Search.',
    conceptTitle: 'What is BFS?',
    conceptSummary: 'Breadth-First Search (BFS) is an uninformed search algorithm that systematically visits all nodes at depth d before moving to depth d+1 using a FIFO (First-In, First-Out) queue. It guarantees finding the shortest path in unweighted mazes.',
    nodesCount: 8,
    shortestPathLength: 4,
  },
  2: {
    id: 2,
    name: 'Level 2',
    chapter: 'Search Maze - Level 2',
    themeName: 'Branching Maze — Level-by-Level',
    icon: '🌿',
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'A multi-route branching maze. Watch BFS explore all nodes at the current depth before moving deeper.',
    roomSize: { width: 28, depth: 20, height: 7 },
    missionTitle: 'OBJECTIVE: REACH THE TARGET',
    missionObjective: 'Find the TARGET using Breadth First Search and follow the shortest path it discovers to the exit door.',
    conceptTitle: 'BFS Rule: Layer by Layer',
    conceptSummary: '🔹 Explore nearby nodes first\n🔹 Complete the current level\n🔹 Then move to the next level',
    nodesCount: 7,
    shortestPathLength: 4,
  },
  3: {
    id: 3,
    name: 'Level 3',
    chapter: 'Search Maze - Level 3',
    themeName: 'BFS Decision Path',
    icon: '🧭',
    badgeColor: 'from-amber-500 to-rose-600',
    description: 'Analyse the live BFS queue state and physically walk into the correct floor nodes to guide the search.',
    roomSize: { width: 36, depth: 28, height: 7.5 },
    missionTitle: 'LEVEL 3: BFS DECISION PATH',
    missionObjective: 'Analyse the BFS queue and physically step into the correct floor circle to navigate the maze.',
    conceptTitle: 'FIFO Queue & Layer-by-Layer Priority',
    conceptSummary: 'BFS strictly follows First-In, First-Out (FIFO) queue order, completing all nodes at the current depth before expanding deeper.',
    nodesCount: 13,
    shortestPathLength: 4,
  },
  4: {
    id: 4,
    name: 'Level 4',
    chapter: 'Search Maze - Level 4',
    themeName: 'Dead-End Trap',
    icon: '⚡',
    badgeColor: 'from-purple-600 to-indigo-600',
    description: 'A multi-branch maze filled with misleading paths and dead ends. Analyse the live BFS queue and avoid dead-end traps.',
    roomSize: { width: 44, depth: 34, height: 8 },
    missionTitle: 'BFS DEAD-END TRAP',
    missionObjective: 'Reach the RED TARGET using BFS. Avoid wasting time in dead-end branches and step into the front node of the queue.',
    conceptTitle: 'Dead Ends & Misleading Routes in BFS',
    conceptSummary: 'BFS systematically explores nodes level-by-level using a FIFO queue. The FRONT of the queue is processed first. A path looking short or attractive does NOT mean BFS chooses it. When a branch hits a dead end, BFS pops the next node from the queue without failing.',
    nodesCount: 15,
    shortestPathLength: 4,
  },
  5: {
    id: 5,
    name: 'Level 5',
    chapter: 'Search Maze - Level 5',
    themeName: 'Shortest Path Challenge',
    icon: '⚡',
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'Find the shortest path from START to TARGET using pure Breadth-First Search (BFS). Analyze the search order and step into the correct nodes.',
    roomSize: { width: 48, depth: 34, height: 8 },
    missionTitle: 'SHORTEST PATH CHALLENGE',
    missionObjective: 'Find the shortest path from START to TARGET using BFS. BFS explores level-by-level.',
    conceptTitle: 'Shortest Path with BFS',
    conceptSummary: 'Breadth-First Search systematically explores nodes level-by-level using a FIFO queue. In an unweighted graph, BFS is mathematically guaranteed to discover the shortest path (minimum edge count) because all nodes at depth d are discovered before any nodes at depth d+1.',
    nodesCount: 23,
    shortestPathLength: 5,
  },
};
