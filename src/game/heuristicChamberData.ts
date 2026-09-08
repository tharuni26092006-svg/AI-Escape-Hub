// ============================================================================
// HEURISTIC CHAMBER — LEVEL 1: FIRST HEURISTIC (A* SEARCH)
// ============================================================================

export interface AStarCandidateNode {
  id: string;
  name: string;
  g: number; // cost already travelled from START
  h: number; // estimated heuristic cost to TARGET
  f: number; // f(n) = g(n) + h(n)
  x: number; // 3D room coordinates
  z: number;
  description?: string;
}

export interface HeuristicDecisionStage {
  stageNumber: number;
  stageTitle: string;
  currentNode: string;
  question: string;
  formulaNote: string;
  candidates: AStarCandidateNode[];
  correctNodeId: string;
  successTitle: string;
  successExplanation: string;
  wrongTitle: string;
  wrongExplanation: string;
}

export const HEURISTIC_LEVEL1_STAGES: HeuristicDecisionStage[] = [
  // STAGE 1 (DECISION 1)
  {
    stageNumber: 1,
    stageTitle: 'A* DECISION 1: Initial Frontier',
    currentNode: 'A',
    question: 'Which node has the LOWEST f(n)?',
    formulaNote: 'f(n) = g(n) + h(n)',
    candidates: [
      {
        id: 'B',
        name: 'NODE B',
        g: 2,
        h: 6,
        f: 8,
        x: -7,
        z: 4.5,
        description: 'g=2 + h=6 = f(8)',
      },
      {
        id: 'C',
        name: 'NODE C',
        g: 4,
        h: 3,
        f: 7,
        x: -7,
        z: 0,
        description: 'g=4 + h=3 = f(7)',
      },
      {
        id: 'D',
        name: 'NODE D',
        g: 3,
        h: 7,
        f: 10,
        x: -7,
        z: -4.5,
        description: 'g=3 + h=7 = f(10)',
      },
    ],
    correctNodeId: 'C',
    successTitle: '✓ CORRECT',
    successExplanation:
      'A* selected the node with the lowest f(n).\n\nC:\ng = 4\nh = 3\n\nf = 4 + 3 = 7',
    wrongTitle: '✕ NOT THE BEST CHOICE',
    wrongExplanation: 'Compare the f(n) values.\n\nf(n) = g(n) + h(n)\n\nB: 2 + 6 = 8\nC: 4 + 3 = 7\nD: 3 + 7 = 10',
  },

  // STAGE 2 (DECISION 2)
  {
    stageNumber: 2,
    stageTitle: 'A* DECISION 2: Expanding Node C',
    currentNode: 'C',
    question: 'Current node is C. Which node should A* explore next?',
    formulaNote: 'f(n) = g(n) + h(n)',
    candidates: [
      {
        id: 'E',
        name: 'NODE E',
        g: 5,
        h: 4,
        f: 9,
        x: 0,
        z: 4.5,
        description: 'g=5 + h=4 = f(9)',
      },
      {
        id: 'F',
        name: 'NODE F',
        g: 6,
        h: 2,
        f: 8,
        x: 0,
        z: 0,
        description: 'g=6 + h=2 = f(8)',
      },
      {
        id: 'G',
        name: 'NODE G',
        g: 4,
        h: 6,
        f: 10,
        x: 0,
        z: -4.5,
        description: 'g=4 + h=6 = f(10)',
      },
    ],
    correctNodeId: 'F',
    successTitle: '✓ CORRECT',
    successExplanation:
      'A* selected the node with the lowest f(n).\n\nF:\ng = 6\nh = 2\n\nf = 6 + 2 = 8',
    wrongTitle: '✕ NOT THE BEST CHOICE',
    wrongExplanation: 'Compare the f(n) values.\n\nf(n) = g(n) + h(n)\n\nE: 5 + 4 = 9\nF: 6 + 2 = 8\nG: 4 + 6 = 10',
  },

  // STAGE 3 (DECISION 3 - FINAL CHALLENGE)
  {
    stageNumber: 3,
    stageTitle: 'A* DECISION 3: The True Cost Balance',
    currentNode: 'F',
    question: 'Current node is F. Which of the 4 nodes has the lowest total f(n)?',
    formulaNote: 'f(n) = g(n) + h(n)',
    candidates: [
      {
        id: 'H',
        name: 'NODE H',
        g: 8,
        h: 4,
        f: 12,
        x: 7,
        z: 5.4,
        description: 'g=8 + h=4 = f(12)',
      },
      {
        id: 'I',
        name: 'NODE I',
        g: 11,
        h: 1,
        f: 12,
        x: 7,
        z: 1.8,
        description: 'g=11 + h=1 = f(12)',
      },
      {
        id: 'J',
        name: 'NODE J',
        g: 7,
        h: 3,
        f: 10,
        x: 7,
        z: -1.8,
        description: 'g=7 + h=3 = f(10)',
      },
      {
        id: 'K',
        name: 'NODE K',
        g: 9,
        h: 5,
        f: 14,
        x: 7,
        z: -5.4,
        description: 'g=9 + h=5 = f(14)',
      },
    ],
    correctNodeId: 'J',
    successTitle: '✓ CORRECT',
    successExplanation:
      'A* selected node J!\n\nNotice: Node I had a tiny heuristic (h=1), but high path cost (g=11) yielding f=12.\nNode J achieves the lowest combined cost:\n\nf = 7 + 3 = 10!',
    wrongTitle: '✕ NOT THE BEST CHOICE',
    wrongExplanation:
      'Compare the total f(n) = g(n) + h(n).\nDo not just pick the smallest h(n)!\n\nH: 8 + 4 = 12\nI: 11 + 1 = 12\nJ: 7 + 3 = 10\nK: 9 + 5 = 14',
  },
];

export const HEURISTIC_TEACHING_CARD = {
  title: 'A* KEY IDEA',
  gLabel: 'g(n)',
  gDesc: 'Cost already travelled',
  hLabel: 'h(n)',
  hDesc: 'Estimated cost remaining',
  fLabel: 'f(n)',
  fDesc: 'Total estimated cost',
  rule: 'A* prefers the node with the lowest f(n).',
};

export const HEURISTIC_LEVEL1_PATH = ['START', 'A', 'C', 'F', 'J', 'TARGET'];

export const HEURISTIC_LEVEL1_META = {
  id: 1,
  gameId: 'heuristic_chamber',
  name: 'First Heuristic',
  title: 'HEURISTIC CHAMBER',
  levelLabel: 'LEVEL 1',
  aiConcept: 'A* SEARCH',
  algorithm: 'A* ONLY',
  difficulty: 'EASY → MEDIUM',
  description:
    'Enter the futuristic A* Navigation Laboratory. Calculate f(n) = g(n) + h(n), evaluate candidate nodes, and guide the system to the target.',
};
