// ============================================================================
// SEARCH MAZE — LEVEL 1: BREADTH-FIRST SEARCH (BFS) ENGINE
// ============================================================================

export interface SearchMazeNode {
  id: string;
  name: string;
  label: string;
  x: number;
  z: number;
  depth: number;
  neighbors: string[];
}

export const LEVEL1_GRAPH: Record<string, SearchMazeNode> = {
  S: {
    id: 'S',
    name: 'START [S]',
    label: 'START',
    x: -4,
    z: 4,
    depth: 0,
    neighbors: ['N1', 'N2'],
  },
  N1: {
    id: 'N1',
    name: 'Node 1 [N1]',
    label: 'N1',
    x: 0,
    z: 4,
    depth: 1,
    neighbors: ['S', 'N3', 'N4'],
  },
  N2: {
    id: 'N2',
    name: 'Node 2 [N2]',
    label: 'N2',
    x: -4,
    z: 0,
    depth: 1,
    neighbors: ['S', 'N4', 'N5'],
  },
  N3: {
    id: 'N3',
    name: 'Node 3 [N3]',
    label: 'N3',
    x: 4,
    z: 4,
    depth: 2,
    neighbors: ['N1', 'G'],
  },
  N4: {
    id: 'N4',
    name: 'Node 4 [N4]',
    label: 'N4',
    x: 0,
    z: 0,
    depth: 2,
    neighbors: ['N1', 'N2', 'G', 'N6'],
  },
  N5: {
    id: 'N5',
    name: 'Node 5 [N5]',
    label: 'N5',
    x: -4,
    z: -4,
    depth: 2,
    neighbors: ['N2', 'N6'],
  },
  N6: {
    id: 'N6',
    name: 'Node 6 [N6]',
    label: 'N6',
    x: 0,
    z: -4,
    depth: 3,
    neighbors: ['N4', 'N5', 'N7'],
  },
  N7: {
    id: 'N7',
    name: 'Node 7 [N7]',
    label: 'N7',
    x: 4,
    z: -4,
    depth: 4,
    neighbors: ['N6', 'G'],
  },
  G: {
    id: 'G',
    name: 'TARGET [G]',
    label: 'TARGET',
    x: 4,
    z: 0,
    depth: 3,
    neighbors: ['N3', 'N4', 'N7'],
  },
};

export const LEVEL2_GRAPH: Record<string, SearchMazeNode> = {
  S: {
    id: 'S',
    name: 'START [S]',
    label: 'START',
    x: -8,
    z: 0,
    depth: 0,
    neighbors: ['A'],
  },
  A: {
    id: 'A',
    name: 'Node A [A]',
    label: 'Node A',
    x: -4,
    z: 0,
    depth: 1,
    neighbors: ['S', 'B', 'C'],
  },
  B: {
    id: 'B',
    name: 'Node B [B]',
    label: 'Node B',
    x: 0,
    z: -4,
    depth: 2,
    neighbors: ['A', 'E'],
  },
  C: {
    id: 'C',
    name: 'Node C [C]',
    label: 'Node C',
    x: 0,
    z: 4,
    depth: 2,
    neighbors: ['A', 'D'],
  },
  E: {
    id: 'E',
    name: 'Node E [E]',
    label: 'Node E',
    x: 4,
    z: -4,
    depth: 3,
    neighbors: ['B', 'G'],
  },
  D: {
    id: 'D',
    name: 'Node D [D]',
    label: 'Node D',
    x: 4,
    z: 4,
    depth: 3,
    neighbors: ['C', 'G'],
  },
  G: {
    id: 'G',
    name: 'TARGET [G]',
    label: 'TARGET',
    x: 8,
    z: 0,
    depth: 4,
    neighbors: ['E', 'D'],
  },
};

export const LEVEL3_GRAPH: Record<string, SearchMazeNode> = {
  S: {
    id: 'S',
    name: 'START [S]',
    label: 'START',
    x: -13,
    z: 0,
    depth: 0,
    neighbors: ['A'],
  },
  A: {
    id: 'A',
    name: 'Node A [A]',
    label: 'A',
    x: -9,
    z: 0,
    depth: 1,
    neighbors: ['S', 'B', 'C', 'D'],
  },
  B: {
    id: 'B',
    name: 'Node B [B]',
    label: 'B',
    x: -5.5,
    z: -4,
    depth: 2,
    neighbors: ['A', 'E', 'F'],
  },
  C: {
    id: 'C',
    name: 'Node C [C]',
    label: 'C',
    x: -3.5,
    z: 0,
    depth: 2,
    neighbors: ['A', 'G'],
  },
  D: {
    id: 'D',
    name: 'Node D [D]',
    label: 'D',
    x: -4.0,
    z: 5,
    depth: 2,
    neighbors: ['A', 'H'],
  },
  E: {
    id: 'E',
    name: 'Node E [E]',
    label: 'E',
    x: 2.5,
    z: -6.5,
    depth: 3,
    neighbors: ['B', 'TARGET'],
  },
  F: {
    id: 'F',
    name: 'Node F [F]',
    label: 'F',
    x: 1.5,
    z: -2.5,
    depth: 3,
    neighbors: ['B'],
  },
  G: {
    id: 'G',
    name: 'Node G [G]',
    label: 'G',
    x: 2.5,
    z: 1.0,
    depth: 3,
    neighbors: ['C'],
  },
  H: {
    id: 'H',
    name: 'Node H [H]',
    label: 'H',
    x: 2.5,
    z: 5.5,
    depth: 3,
    neighbors: ['D'],
  },
  TARGET: {
    id: 'TARGET',
    name: 'RED TARGET',
    label: 'TARGET',
    x: 9,
    z: -6,
    depth: 4,
    neighbors: ['E'],
  },
};

export interface BfsDecisionStage {
  stageNumber: number;
  stageTitle: string;
  visited: string[];
  oldQueue?: string[];
  queue: string[];
  question: string;
  candidateNodes: string[];
  correctNode: string;
  successMessage: string;
  wrongMessage: string;
}

export const LEVEL3_DECISION_STAGES: BfsDecisionStage[] = [
  {
    stageNumber: 1,
    stageTitle: 'STAGE 1: Teach BFS First',
    visited: ['START', 'A'],
    queue: ['B', 'C', 'D'],
    question: 'Which node should BFS explore NEXT?',
    candidateNodes: ['B', 'C', 'D'],
    correctNode: 'B',
    successMessage: '✓ CORRECT\n"B is the next BFS node."',
    wrongMessage: '✕ NOT YET\n"Check the FRONT of the BFS queue."',
  },
  {
    stageNumber: 2,
    stageTitle: 'STAGE 2: Queue Order vs Branching',
    visited: ['START', 'A', 'B'],
    oldQueue: ['B', 'C', 'D'],
    queue: ['C', 'D', 'E', 'F'],
    question: 'B branched to E and F. Which node will BFS explore NEXT?',
    candidateNodes: ['C', 'D', 'E', 'F'],
    correctNode: 'C',
    successMessage: '✓ CORRECT\n"Newly discovered nodes (E, F) go to the BACK of the queue. C was queued first!"',
    wrongMessage: '✕ NOT YET\n"Check the FRONT of the BFS queue. Complete current level before moving deeper."',
  },
  {
    stageNumber: 3,
    stageTitle: 'STAGE 3: Queue Order vs Distance',
    visited: ['START', 'A', 'B', 'C'],
    oldQueue: ['C', 'D', 'E', 'F'],
    queue: ['D', 'E', 'F', 'G'],
    question: 'C branched to G. Which node will BFS explore NEXT?',
    candidateNodes: ['D', 'E', 'F', 'G'],
    correctNode: 'D',
    successMessage: '✓ CORRECT\n"BFS follows FIFO queue order, not physical distance!"',
    wrongMessage: '✕ NOT YET\n"BFS follows QUEUE ORDER, not physical distance. Check the FRONT of the queue."',
  },
  {
    stageNumber: 4,
    stageTitle: 'STAGE 4: Final Challenge',
    visited: ['START', 'A', 'B', 'C', 'D'],
    oldQueue: ['D', 'E', 'F', 'G'],
    queue: ['E', 'F', 'G', 'H'],
    question: 'Depth-2 nodes finished! Which node will BFS explore NEXT?',
    candidateNodes: ['E', 'F', 'G', 'H'],
    correctNode: 'E',
    successMessage: '✓ CORRECT\n"E is at the front of the queue and discovers the RED TARGET!"',
    wrongMessage: '✕ NOT YET\n"Check the FRONT of the BFS queue."',
  },
];

export const LEVEL4_GRAPH: Record<string, SearchMazeNode> = {
  S: {
    id: 'S',
    name: 'START [S]',
    label: 'START',
    x: -16,
    z: 0,
    depth: 0,
    neighbors: ['A', 'B', 'C', 'D'],
  },
  A: {
    id: 'A',
    name: 'Node A [A]',
    label: 'A',
    x: -11,
    z: -7,
    depth: 1,
    neighbors: ['S', 'E', 'X1'],
  },
  B: {
    id: 'B',
    name: 'Node B [B]',
    label: 'B',
    x: -11,
    z: -2.5,
    depth: 1,
    neighbors: ['S', 'F', 'X2'],
  },
  C: {
    id: 'C',
    name: 'Node C [C]',
    label: 'C',
    x: -11,
    z: 2.5,
    depth: 1,
    neighbors: ['S', 'G', 'X3'],
  },
  D: {
    id: 'D',
    name: 'Node D [D]',
    label: 'D',
    x: -11,
    z: 7,
    depth: 1,
    neighbors: ['S', 'H'],
  },
  X1: {
    id: 'X1',
    name: 'Node X1 [DEAD END]',
    label: 'X1 (DEAD END)',
    x: -6,
    z: -10,
    depth: 2,
    neighbors: ['A'],
  },
  E: {
    id: 'E',
    name: 'Node E [E]',
    label: 'E',
    x: -5.5,
    z: -5.5,
    depth: 2,
    neighbors: ['A', 'TARGET'],
  },
  X2: {
    id: 'X2',
    name: 'Node X2 [DEAD END]',
    label: 'X2 (DEAD END)',
    x: -6,
    z: -1.5,
    depth: 2,
    neighbors: ['B'],
  },
  F: {
    id: 'F',
    name: 'Node F [F]',
    label: 'F',
    x: -0.5,
    z: -2.5,
    depth: 2,
    neighbors: ['B', 'K'],
  },
  G: {
    id: 'G',
    name: 'Node G [G]',
    label: 'G',
    x: -0.5,
    z: 2.5,
    depth: 2,
    neighbors: ['C', 'L'],
  },
  X3: {
    id: 'X3',
    name: 'Node X3 [DEAD END]',
    label: 'X3 (DEAD END)',
    x: -6,
    z: 8,
    depth: 2,
    neighbors: ['C'],
  },
  H: {
    id: 'H',
    name: 'Node H [H]',
    label: 'H',
    x: -5.5,
    z: 5.5,
    depth: 2,
    neighbors: ['D'],
  },
  K: {
    id: 'K',
    name: 'Node K [K]',
    label: 'K',
    x: 5.5,
    z: -2.5,
    depth: 3,
    neighbors: ['F'],
  },
  L: {
    id: 'L',
    name: 'Node L [L]',
    label: 'L',
    x: 5.5,
    z: 2.5,
    depth: 3,
    neighbors: ['G'],
  },
  TARGET: {
    id: 'TARGET',
    name: 'RED TARGET',
    label: 'TARGET',
    x: 11.5,
    z: -5.5,
    depth: 3,
    neighbors: ['E'],
  },
};

export const LEVEL4_DEAD_ENDS = ['X1', 'X2', 'X3'];

export const LEVEL4_DECISION_STAGES: BfsDecisionStage[] = [
  {
    stageNumber: 1,
    stageTitle: 'DECISION 1: 4-Way Junction',
    visited: ['START'],
    queue: ['A', 'B', 'C', 'D'],
    question: 'START connects to 4 branches (A, B, C, D). Which node does BFS explore FIRST?',
    candidateNodes: ['A', 'B', 'C', 'D'],
    correctNode: 'A',
    successMessage: '✓ CORRECT\n"Node A is at the FRONT of the queue. In BFS, FIFO processes nodes strictly in the order they were queued."',
    wrongMessage: '✕ WRONG BFS CHOICE\n"Check the FRONT of the queue. Node A was queued first."',
  },
  {
    stageNumber: 2,
    stageTitle: 'DECISION 2: Dead-End Discovery',
    visited: ['START', 'A'],
    oldQueue: ['A', 'B', 'C', 'D'],
    queue: ['B', 'C', 'D', 'X1', 'E'],
    question: 'Node A discovered dead-end X1 and forward node E. Which node will BFS explore NEXT?',
    candidateNodes: ['B', 'C', 'D', 'X1', 'E'],
    correctNode: 'B',
    successMessage: '✓ CORRECT\n"Newly discovered nodes (X1, E) are pushed to the BACK of the FIFO queue. Node B is at the FRONT!"',
    wrongMessage: '✕ WRONG BFS CHOICE\n"Check the FRONT of the queue. Complete the rest of Depth 1 before moving deeper."',
  },
  {
    stageNumber: 3,
    stageTitle: 'DECISION 3: Misleading Corridor vs FIFO',
    visited: ['START', 'A', 'B'],
    oldQueue: ['B', 'C', 'D', 'X1', 'E'],
    queue: ['C', 'D', 'X1', 'E', 'X2', 'F'],
    question: 'Node B branched to dead-end X2 and corridor F. E & F look closer to exit! Which node will BFS explore NEXT?',
    candidateNodes: ['C', 'D', 'E', 'F', 'X1', 'X2'],
    correctNode: 'C',
    successMessage: '✓ CORRECT\n"BFS does not jump forward based on visual proximity! Node C is at the FRONT of the queue."',
    wrongMessage: '✕ WRONG BFS CHOICE\n"Visual distance is misleading! BFS processes nodes in strict FIFO queue arrival order."',
  },
  {
    stageNumber: 4,
    stageTitle: 'DECISION 4: Completing Depth 1',
    visited: ['START', 'A', 'B', 'C'],
    oldQueue: ['C', 'D', 'X1', 'E', 'X2', 'F'],
    queue: ['D', 'X1', 'E', 'X2', 'F', 'X3', 'G'],
    question: 'Node C queued X3 and G. Which node sits at the FRONT to complete Depth 1?',
    candidateNodes: ['D', 'E', 'F', 'G', 'X1', 'X2', 'X3'],
    correctNode: 'D',
    successMessage: '✓ CORRECT\n"Node D finishes Depth 1! Notice that all 4 initial branches from START are now fully processed."',
    wrongMessage: '✕ WRONG BFS CHOICE\n"Check the FRONT of the queue. Node D must be explored to complete Depth 1."',
  },
  {
    stageNumber: 5,
    stageTitle: 'DECISION 5: The Dead-End Trap Dilemma',
    visited: ['START', 'A', 'B', 'C', 'D'],
    oldQueue: ['D', 'X1', 'E', 'X2', 'F', 'X3', 'G'],
    queue: ['X1', 'E', 'X2', 'F', 'X3', 'G', 'H'],
    question: 'Depth 1 is complete! Dead-end [X1] is at the FRONT of the queue. Which node MUST BFS evaluate next?',
    candidateNodes: ['X1', 'E', 'X2', 'F', 'H'],
    correctNode: 'X1',
    successMessage: '✓ DEAD-END MASTERED!\n"BFS cannot skip queued nodes! It pops X1, discovers 0 unexplored paths, and dequeues it safely without queueing any dead branches!"',
    wrongMessage: '✕ WRONG BFS CHOICE\n"BFS CANNOT skip queued nodes! Even dead-end branches must be popped from the front of the queue."',
  },
  {
    stageNumber: 6,
    stageTitle: 'DECISION 6: Target Breakthrough',
    visited: ['START', 'A', 'B', 'C', 'D', 'X1'],
    oldQueue: ['X1', 'E', 'X2', 'F', 'X3', 'G', 'H'],
    queue: ['E', 'X2', 'F', 'X3', 'G', 'H'],
    question: 'Dead-end X1 was dequeued. Which node sits at the FRONT of the queue now?',
    candidateNodes: ['E', 'X2', 'F', 'G', 'H', 'X3'],
    correctNode: 'E',
    successMessage: '✓ TARGET DISCOVERED!\n"Node E is processed and directly discovers the RED TARGET! Shortest BFS path: S → A → E → TARGET (3 moves)."',
    wrongMessage: '✕ WRONG BFS CHOICE\n"Check the FRONT of the queue. Node E is next in line to be explored."',
  },
];

// ============================================================================
// SEARCH MAZE — LEVEL 5: REAL 3D LABYRINTH / SEARCH MAZE ENGINE (GRID BFS)
// ============================================================================

export const LEVEL5_GRID_COLS = 19;
export const LEVEL5_GRID_ROWS = 13;
export const LEVEL5_CELL_SIZE = 2.1;
export const LEVEL5_START_CELL: [number, number] = [1, 6];
export const LEVEL5_TARGET_CELL: [number, number] = [16, 6];
export const LEVEL5_EXIT_CELL: [number, number] = [18, 6];

/**
 * 19 x 13 Real Maze Matrix:
 * 1 = Solid Cyber Wall Barrier (with collision)
 * 0 = Open Corridor Pathway
 */
export const LEVEL5_MAZE_GRID: number[][] = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 0
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1], // Row 1
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1], // Row 2
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1], // Row 3
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1], // Row 4
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // Row 5
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0], // Row 6 (S=[1,6]; Target=[16,6]; Exit=[18,6])
  [1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // Row 7
  [1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1], // Row 8
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // Row 9
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1], // Row 10
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // Row 11
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 12
];

export function grid5ToWorld(col: number, row: number): { x: number; z: number } {
  return {
    x: (col - 9) * LEVEL5_CELL_SIZE,
    z: (row - 6) * LEVEL5_CELL_SIZE,
  };
}

export function worldToGrid5(x: number, z: number): { col: number; row: number } {
  return {
    col: Math.max(0, Math.min(LEVEL5_GRID_COLS - 1, Math.round(x / LEVEL5_CELL_SIZE + 9))),
    row: Math.max(0, Math.min(LEVEL5_GRID_ROWS - 1, Math.round(z / LEVEL5_CELL_SIZE + 6))),
  };
}

export interface GridBFSStep {
  stepIndex: number;
  currentCell: [number, number];
  queue: [number, number][];
  visited: string[];
  frontierDepth: number;
  description: string;
  isTargetFound: boolean;
  shortestPath?: [number, number][];
}

export interface GridBFSResult {
  steps: GridBFSStep[];
  exploredOrder: [number, number][];
  shortestPath: [number, number][];
  visitedCount: number;
  movesCount: number;
  targetFound: boolean;
}

/**
 * Pure Grid Breadth-First Search (BFS) Solver
 * Evaluates orthogonal corridor neighbors (N, S, W, E) with a FIFO queue.
 */
export function executeGridBFS(
  startCell: [number, number] = LEVEL5_START_CELL,
  targetCell: [number, number] = LEVEL5_TARGET_CELL,
  grid: number[][] = LEVEL5_MAZE_GRID
): GridBFSResult {
  const [startC, startR] = startCell;
  const [targetC, targetR] = targetCell;

  const startKey = `${startC},${startR}`;
  const targetKey = `${targetC},${targetR}`;

  const queue: [number, number][] = [[startC, startR]];
  const visited = new Set<string>([startKey]);
  const parent = new Map<string, [number, number] | null>();
  parent.set(startKey, null);
  const distance = new Map<string, number>();
  distance.set(startKey, 0);

  const exploredOrder: [number, number][] = [];
  const steps: GridBFSStep[] = [];

  steps.push({
    stepIndex: 0,
    currentCell: [startC, startR],
    queue: [[startC, startR]],
    visited: Array.from(visited),
    frontierDepth: 0,
    description: `BFS begins at green START [${startC}, ${startR}]. Added to FIFO queue.`,
    isTargetFound: false,
  });

  let targetFound = false;
  let stepCount = 1;

  // Standard orthogonal directions: North, South, West, East
  const dirs = [
    [0, -1], // North
    [0, 1],  // South
    [-1, 0], // West
    [1, 0],  // East
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const [c, r] = current;
    exploredOrder.push(current);

    if (c === targetC && r === targetR) {
      targetFound = true;
      break;
    }

    const currentKey = `${c},${r}`;
    const currDist = distance.get(currentKey) || 0;
    const newNeighbors: [number, number][] = [];

    for (const [dc, dr] of dirs) {
      const nc = c + dc;
      const nr = r + dr;

      if (
        nc >= 0 &&
        nc < LEVEL5_GRID_COLS &&
        nr >= 0 &&
        nr < LEVEL5_GRID_ROWS &&
        grid[nr][nc] === 0
      ) {
        const nKey = `${nc},${nr}`;
        if (!visited.has(nKey)) {
          visited.add(nKey);
          parent.set(nKey, current);
          distance.set(nKey, currDist + 1);
          queue.push([nc, nr]);
          newNeighbors.push([nc, nr]);
        }
      }
    }

    const isTargetInQueue = queue.some(([qc, qr]) => qc === targetC && qr === targetR);

    steps.push({
      stepIndex: stepCount++,
      currentCell: current,
      queue: [...queue],
      visited: Array.from(visited),
      frontierDepth: currDist + 1,
      description: `Exploring (${c}, ${r}) at Depth ${currDist}. Expanded ${newNeighbors.length} unvisited corridor cells. Queue size: ${queue.length}.`,
      isTargetFound: isTargetInQueue,
    });
  }

  // Reconstruct Shortest Path from Target back to Start
  const shortestPath: [number, number][] = [];
  let curr: [number, number] | null = [targetC, targetR];
  while (curr !== null) {
    shortestPath.unshift(curr);
    const key = `${curr[0]},${curr[1]}`;
    curr = parent.get(key) || null;
  }

  // Final step: Target Located
  steps.push({
    stepIndex: stepCount,
    currentCell: [targetC, targetR],
    queue: [],
    visited: Array.from(visited),
    frontierDepth: distance.get(targetKey) || shortestPath.length - 1,
    description: `RED TARGET LOCATED! Shortest route: ${shortestPath.length - 1} steps. East Exit Gateway Unlocked!`,
    isTargetFound: true,
    shortestPath,
  });

  return {
    steps,
    exploredOrder,
    shortestPath,
    visitedCount: visited.size,
    movesCount: shortestPath.length - 1,
    targetFound,
  };
}

export const LEVEL5_GRID_RESULT = executeGridBFS(LEVEL5_START_CELL, LEVEL5_TARGET_CELL, LEVEL5_MAZE_GRID);
export const LEVEL5_SHORTEST_PATH_COORDS: [number, number][] = LEVEL5_GRID_RESULT.shortestPath;

export const LEVEL5_GRAPH: Record<string, SearchMazeNode> = {
  S: {
    id: 'S',
    name: 'START [S]',
    label: 'START',
    x: -16.8,
    z: 0,
    depth: 0,
    neighbors: ['A'],
  },
  A: {
    id: 'A',
    name: 'Corridor A',
    label: 'A',
    x: -14.7,
    z: 0,
    depth: 1,
    neighbors: ['S', 'TARGET'],
  },
  TARGET: {
    id: 'TARGET',
    name: 'RED TARGET [G]',
    label: 'TARGET',
    x: 14.7,
    z: 0,
    depth: 29,
    neighbors: ['A'],
  },
};
export const LEVEL5_DECISION_STAGES: BfsDecisionStage[] = [];

export function getGraphForLevel(level: number): Record<string, SearchMazeNode> {
  if (level === 5) return LEVEL5_GRAPH;
  if (level === 4) return LEVEL4_GRAPH;
  if (level === 3) return LEVEL3_GRAPH;
  if (level === 2) return LEVEL2_GRAPH;
  return LEVEL1_GRAPH;
}

export interface BFSStep {
  stepIndex: number;
  currentActive: string;
  queue: string[];
  visited: string[];
  frontierLayer: number;
  layerNodes: string[];
  description: string;
  isTargetFound: boolean;
  shortestPath?: string[];
}

/**
 * Pure Breadth-First Search (BFS) Algorithm
 * Uses a FIFO queue to systematically explore node neighbors layer-by-layer.
 */
export function executeBFS(
  startId: string = 'S',
  targetId: string = 'G',
  graph: Record<string, SearchMazeNode> = LEVEL1_GRAPH
) {
  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const parent: Record<string, string | null> = { [startId]: null };
  const distance: Record<string, number> = { [startId]: 0 };
  const exploredOrder: string[] = [];
  const steps: BFSStep[] = [];

  // Step 0: Initial state
  steps.push({
    stepIndex: 0,
    currentActive: startId,
    queue: [...queue],
    visited: Array.from(visited),
    frontierLayer: 0,
    layerNodes: [startId],
    description: `BFS begins at Green START [${startId}] at Depth 0. Added to queue.`,
    isTargetFound: false,
  });

  let targetFound = false;
  let stepCount = 1;

  while (queue.length > 0) {
    const current = queue.shift()!;
    exploredOrder.push(current);

    if (current === targetId) {
      targetFound = true;
      break;
    }

    const currNode = graph[current] || LEVEL1_GRAPH[current];
    const newNeighbors: string[] = [];

    if (currNode) {
      for (const neighborId of currNode.neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parent[neighborId] = current;
          distance[neighborId] = (distance[current] || 0) + 1;
          queue.push(neighborId);
          newNeighbors.push(neighborId);
        }
      }
    }

    const currentDist = distance[current] || 0;
    const isTargetInQueue = queue.includes(targetId);

    const layerNodeLabels = newNeighbors.length > 0 ? newNeighbors.map((n) => graph[n]?.label || n).join(', ') : 'None';
    steps.push({
      stepIndex: stepCount++,
      currentActive: current,
      queue: [...queue],
      visited: Array.from(visited),
      frontierLayer: currentDist + 1,
      layerNodes: newNeighbors,
      description: `Processing [${currNode?.label || current}]. Discovered unvisited neighbours: ${layerNodeLabels}. Queue now: [ ${queue.join(', ')} ].`,
      isTargetFound: isTargetInQueue,
    });
  }

  // Reconstruct shortest path by following parent pointers from target to start
  const shortestPath: string[] = [];
  let curr: string | null = targetId;
  while (curr !== null) {
    shortestPath.unshift(curr);
    curr = parent[curr] || null;
  }

  // Final Target Found Step
  steps.push({
    stepIndex: stepCount,
    currentActive: targetId,
    queue: [],
    visited: Array.from(visited),
    frontierLayer: distance[targetId] || 4,
    layerNodes: [targetId],
    description: `TARGET FOUND! BFS completed the search. Shortest route: ${shortestPath.join(' → ')}. FOLLOW HIGHLIGHTED PATH → EXIT.`,
    isTargetFound: true,
    shortestPath,
  });

  return {
    steps,
    exploredOrder,
    shortestPath,
    totalExplored: visited.size,
    movesCount: shortestPath.length - 1,
    targetFound,
  };
}

export interface BfsStepState {
  activeNode: string;
  visited: string[];
  queue: string[];
  layer: number;
  isTargetFound: boolean;
  shortestPath: string[];
  description: string;
}

export function generateBfsSteps(
  graph: Record<string, SearchMazeNode> = LEVEL1_GRAPH,
  startId: string = 'S',
  targetId: string = 'G'
): BfsStepState[] {
  const result = executeBFS(startId, targetId, graph);
  return result.steps.map((s) => ({
    activeNode: s.currentActive,
    visited: s.visited,
    queue: s.queue,
    layer: s.frontierLayer,
    isTargetFound: s.isTargetFound,
    shortestPath: result.shortestPath,
    description: s.description,
  }));
}

