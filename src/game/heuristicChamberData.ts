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

// ============================================================================
// HEURISTIC CHAMBER — LEVEL 2: HEURISTIC TRAP (A* SEARCH)
// ============================================================================

export const HEURISTIC_LEVEL2_STAGES: HeuristicDecisionStage[] = [
  // STAGE 1 (DECISION 1 - The Heuristic Trap: Current Node A)
  {
    stageNumber: 1,
    stageTitle: 'A* DECISION 1: The Heuristic Trap',
    currentNode: 'A',
    question: 'Compare total f(n). Do NOT choose based on lowest h(n) alone!',
    formulaNote: 'f(n) = g(n) + h(n)',
    candidates: [
      {
        id: 'B',
        name: 'NODE B',
        g: 2,
        h: 9,
        f: 11,
        x: -7.0,
        z: 6.0,
        description: 'g = 2, h = 9',
      },
      {
        id: 'C',
        name: 'NODE C',
        g: 7,
        h: 2,
        f: 9,
        x: -7.0,
        z: 2.0,
        description: 'g = 7, h = 2 (Trap: lowest h)',
      },
      {
        id: 'D',
        name: 'NODE D',
        g: 4,
        h: 4,
        f: 8,
        x: -7.0,
        z: -2.0,
        description: 'g = 4, h = 4 (Lowest f)',
      },
      {
        id: 'E',
        name: 'NODE E',
        g: 3,
        h: 7,
        f: 10,
        x: -7.0,
        z: -6.0,
        description: 'g = 3, h = 7',
      },
    ],
    correctNodeId: 'D',
    successTitle: '✓ CORRECT A* CHOICE',
    successExplanation:
      'NODE D has the lowest total f(n)!\n\ng(n) = 4, h(n) = 4\nf(n) = 4 + 4 = 8\n\nNotice: Node C looked tempting with lowest h=2, but high actual cost g=7 made f=9. D (f=8) is the true optimal choice!',
    wrongTitle: '✕ NOT THE BEST CHOICE',
    wrongExplanation:
      'Compare total f(n) = g(n) + h(n):\n\nB: 2 + 9 = 11\nC: 7 + 2 = 9 (Heuristic Trap!)\nD: 4 + 4 = 8\nE: 3 + 7 = 10',
  },

  // STAGE 2 (DECISION 2 - Frontier Expansion from Node D)
  {
    stageNumber: 2,
    stageTitle: 'A* DECISION 2: Frontier Expansion',
    currentNode: 'D',
    question: 'Current node is D (f=8). Which frontier candidate has the lowest total f(n)?',
    formulaNote: 'f(n) = g(n) + h(n)',
    candidates: [
      {
        id: 'F',
        name: 'NODE F',
        g: 7,
        h: 3,
        f: 10,
        x: 0.0,
        z: 6.0,
        description: 'g = 7, h = 3 (Trap: lowest h)',
      },
      {
        id: 'G',
        name: 'NODE G',
        g: 4,
        h: 7,
        f: 11,
        x: 0.0,
        z: 2.0,
        description: 'g = 4, h = 7',
      },
      {
        id: 'H',
        name: 'NODE H',
        g: 3,
        h: 5,
        f: 8,
        x: 0.0,
        z: -2.0,
        description: 'g = 3, h = 5 (Optimal)',
      },
      {
        id: 'I',
        name: 'NODE I',
        g: 8,
        h: 4,
        f: 12,
        x: 0.0,
        z: -6.0,
        description: 'g = 8, h = 4',
      },
    ],
    correctNodeId: 'H',
    successTitle: '✓ CORRECT A* CHOICE',
    successExplanation:
      'NODE H has the lowest total f(n) = 8!\n\ng(n) = 3, h(n) = 5\nf(n) = 3 + 5 = 8\n\nEven though Node F had lower remaining estimate (h=3), accrued cost g=7 made f=10. H is optimal!',
    wrongTitle: '✕ NOT THE BEST CHOICE',
    wrongExplanation:
      'Calculate and compare all f(n) totals:\n\nF: 7 + 3 = 10 (Trap!)\nG: 4 + 7 = 11\nH: 3 + 5 = 8\nI: 8 + 4 = 12',
  },

  // STAGE 3 (DECISION 3 - Mental Calculation & Tie-Breaking from Node H)
  {
    stageNumber: 3,
    stageTitle: 'A* DECISION 3: Tie-Breaking Resolution',
    currentNode: 'H',
    question: 'Calculate total f(n). When f(n) values tie, apply standard A* tie-breaking!',
    formulaNote: 'Rule: When f(n) ties, choose the node with LOWER h(n)',
    candidates: [
      {
        id: 'J',
        name: 'NODE J',
        g: 8,
        h: 3,
        f: 11,
        x: 7.0,
        z: 6.0,
        description: 'g = 8, h = 3',
      },
      {
        id: 'K',
        name: 'NODE K',
        g: 4,
        h: 6,
        f: 10,
        x: 7.0,
        z: 2.0,
        description: 'g = 4, h = 6 (Tied f=10, h=6)',
      },
      {
        id: 'L',
        name: 'NODE L',
        g: 5,
        h: 5,
        f: 10,
        x: 7.0,
        z: -2.0,
        description: 'g = 5, h = 5 (Tied f=10, h=5 wins!)',
      },
      {
        id: 'M',
        name: 'NODE M',
        g: 2,
        h: 9,
        f: 11,
        x: 7.0,
        z: -6.0,
        description: 'g = 2, h = 9',
      },
    ],
    correctNodeId: 'L',
    successTitle: '✓ CORRECT A* CHOICE (TIE BROKEN)',
    successExplanation:
      'NODE L selected via A* tie-breaking!\n\nBoth K and L have f(n) = 10:\nNODE K: g=4 + h=6 = 10\nNODE L: g=5 + h=5 = 10\n\nA* Tie-Breaking Rule: In a tie, prioritize the node with lower h(n). Node L has h=5 < h=6, so A* explores L first!',
    wrongTitle: '✕ NOT THE OPTIMAL CHOICE',
    wrongExplanation:
      'Nodes K and L tie at f=10 (4+6=10, 5+5=10).\nBy A* tie-breaking rules, prefer the node with lower h(n) (Node L has h=5 vs Node K has h=6).',
  },

  // STAGE 4 (DECISION 4 - Final Route Comparison from Node L to TARGET)
  {
    stageNumber: 4,
    stageTitle: 'A* DECISION 4: Final Route Comparison',
    currentNode: 'L',
    question: 'Route Alpha (Node N) vs Route Beta (Node P): Which path does A* prioritize?',
    formulaNote: 'Compare total accrued cost + remaining distance',
    candidates: [
      {
        id: 'P',
        name: 'NODE P (Route Beta)',
        g: 11,
        h: 1,
        f: 12,
        x: 13.5,
        z: 3.5,
        description: 'g = 11, h = 1 -> f = 12 (Detour trap)',
      },
      {
        id: 'N',
        name: 'NODE N (Route Alpha)',
        g: 8,
        h: 2,
        f: 10,
        x: 13.5,
        z: -3.5,
        description: 'g = 8, h = 2 -> f = 10 (Optimal route)',
      },
    ],
    correctNodeId: 'N',
    successTitle: '✓ OPTIMAL ROUTE CONFIRMED',
    successExplanation:
      'Route Alpha via NODE N is optimal!\n\nNODE N: g=8 + h=2 = 10\nNODE P: g=11 + h=1 = 12\n\nEven though Node P is only 1 step away (h=1), Route Beta accrued heavy traversal cost (g=11). Total f(N)=10 wins!',
    wrongTitle: '✕ ROUTE BETA IS SUBOPTIMAL',
    wrongExplanation:
      'Node P seems 1 step away (h=1), but Route Beta already cost g=11, making total f=12. Route Alpha with Node N has f=10!',
  },
];

export const HEURISTIC_LEVEL2_PATH = ['START', 'A', 'D', 'H', 'L', 'N', 'TARGET'];

export const HEURISTIC_LEVEL2_META = {
  id: 2,
  gameId: 'heuristic_chamber',
  name: 'Heuristic Trap',
  title: 'HEURISTIC CHAMBER',
  levelLabel: 'LEVEL 2',
  aiConcept: 'A* SEARCH',
  algorithm: 'A* ONLY',
  difficulty: 'MEDIUM → MEDIUM-HARD',
  description:
    'Do not choose a node just because it has the lowest h(n). Calculate and compare complete f(n) = g(n) + h(n) values to avoid the heuristic trap.',
};

