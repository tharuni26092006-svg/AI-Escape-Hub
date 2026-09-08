import { LevelId, LevelInfo } from '../types';

export interface LevelMetadata extends LevelInfo {
  difficulty: string;
  hints: string[];
}

export const LEVELS_DATA: Record<LevelId, LevelMetadata> = {
  1: {
    id: 1,
    name: 'Level 1',
    chapter: 'Agent Academy - Level 1',
    themeName: 'Goal-Based Agent Training Facility',
    icon: '🤖',
    difficulty: 'Easy',
    badgeColor: 'from-blue-600 to-indigo-900 border-blue-500/50',
    description:
      'Step into the Agent Academy. Align sensor registers (Sensors Alpha through Delta), formulate goal state predicates, program reflex actions at the Central Security Console, and retrieve the Access Key to unlock the exit door.',
    roomSize: { width: 24, depth: 20, height: 7 },
    hints: [
      'Objective: Align the four sensory and state registers across the Academy to deduce the 4-digit goal passcode.',
      'Sensor Alpha (West Terminal): Align optical percept streams to compute Digit #1.',
      'Sensor Beta (North Node): Formulate state transition predicates to compute Digit #2.',
      'Sensor Gamma (East Pod): Balance utility weights and reward functions to compute Digit #3.',
      'Sensor Delta (South Pad): Verify goal condition assertions to compute Digit #4.',
      'Approach the Central Security Console and enter your deduced 4-digit code to dispense the Access Key.',
      'Take the Access Key to the Level 2 Security Door on the South wall to unlock it, then walk through!',
    ],
  },
  2: {
    id: 2,
    name: 'Level 2',
    chapter: 'Agent Academy - Level 2',
    themeName: 'Breadth First Search (BFS) Labyrinth',
    icon: '🧭',
    difficulty: 'Medium',
    badgeColor: 'from-cyan-600 via-teal-600 to-emerald-900 border-cyan-400/50',
    description:
      'Navigate the BFS search matrix. Expand graph frontiers node by node using FIFO queues, trace the shortest unweighted path across labyrinth junctions, and unlock the Search Maze exit.',
    roomSize: { width: 26, depth: 22, height: 7.5 },
    hints: [
      'FIFO Queue Console (West Bay): Enqueue start node S, dequeue visited neighbors level-by-level, and extract Queue Order Token.',
      'Frontier Expansion Node (North Terminal): Trace the BFS tree expansion across depth layers 0, 1, and 2 to locate the optimal goal node.',
      'Graph Adjacency Matrix (East Chamber): Verify unvisited edges to prevent infinite graph cycles.',
      'Master BFS Dispatcher (Center): Run the complete Breadth-First exploration to forge the BFS Queue Key.',
      'Collect the BFS Queue Key and unlock the Search Maze Security Gate on the South wall to escape!',
    ],
  },
  3: {
    id: 3,
    name: 'Level 3',
    chapter: 'Agent Academy - Level 3',
    themeName: 'A* Search & Evaluation Laboratory',
    icon: '🗺️',
    difficulty: 'Medium',
    badgeColor: 'from-red-600 via-orange-600 to-amber-900 border-orange-500/50',
    description:
      'Master informed heuristic search. Calculate f(n) = g(n) + h(n), evaluate admissible Manhattan and Euclidean distance heuristics, optimize priority queue expansion, and unlock the Heuristic Chamber.',
    roomSize: { width: 26, depth: 24, height: 8 },
    hints: [
      'Evaluation Function Terminal (West): Compute total path cost f(n) = path cost g(n) + heuristic estimate h(n).',
      'Manhattan Heuristic Pod (North): Verify admissible heuristic h(n) <= h*(n) without overestimating remaining distance.',
      'Priority Queue Matrix (East): Dequeue the node with minimal f-cost from the Open List.',
      'Central A* Path Synthesizer (Center): Trace the globally optimal shortest path to unlock the A* Key.',
      'Take the A* Key to the Exit Gate on the South wall to proceed to the next arena!',
    ],
  },
  4: {
    id: 4,
    name: 'Level 4',
    chapter: 'Agent Academy - Level 4',
    themeName: 'Backtracking & Arc Consistency (CSP) Vault',
    icon: '🔓',
    difficulty: 'Hard',
    badgeColor: 'from-emerald-600 via-green-700 to-slate-900 border-emerald-500/50',
    description:
      'Enter the high-security CSP vault. Assign domain variables without conflicts, enforce Arc Consistency (AC-3), prune invalid branches with forward checking, and disengage the Constraint Vault blast doors.',
    roomSize: { width: 28, depth: 24, height: 7.5 },
    hints: [
      'Variable Domain Station (West): Assign discrete domain values {Red, Green, Blue} to neighboring graph regions.',
      'AC-3 Arc Consistency Validator (North): Prune domain values that have no valid support across constrained binary arcs.',
      'MRV & Degree Heuristic Board (East): Select the Most Constrained Variable (Minimum Remaining Values) first.',
      'Backtracking Engine (Center): Execute depth-first backtracking search with forward checking to generate the CSP Key.',
      'Collect the CSP Key and open the heavy Blast Door on the South wall!',
    ],
  },
  5: {
    id: 5,
    name: 'Level 5',
    chapter: 'Agent Academy - Level 5',
    themeName: 'Minimax & Alpha-Beta Game Grid',
    icon: '⚔️',
    difficulty: 'Hard',
    badgeColor: 'from-amber-600 via-orange-600 to-rose-950 border-amber-500/50',
    description:
      'Step into the adversarial arena. Compute Minimax payoff values, trigger Alpha-Beta branch cutoffs (α >= β) to prune suboptimal moves, evade timed defense barriers, and breach the Strategy Arena portal.',
    roomSize: { width: 18, depth: 40, height: 7.5 },
    hints: [
      'Minimax Tree Node (Sector A): Evaluate MAX (player) utility maximization against MIN (adversary) minimization.',
      'Alpha-Beta Pruning Relay (Sector B): Detect when current branch value is worse than guaranteed alternative (α >= β) to trigger early cutoff.',
      'Payoff Matrix Board (East Alcove): Calculate terminal zero-sum utility values.',
      'Master Strategy Terminal (Far End): Solve the 3-ply game tree evaluation to disable the security grid and unlock the vault.',
      'Step through the Level 6 Protocol Gateway to achieve victory!',
    ],
  },
  6: {
    id: 6,
    name: 'Level 6',
    chapter: 'Agent Academy - Level 6',
    themeName: 'Forward & Backward Chaining Vault',
    icon: '📜',
    difficulty: 'Medium',
    badgeColor: 'from-teal-600 via-emerald-700 to-cyan-900 border-teal-400/50',
    description:
      'Explore the ancient digital knowledge archives. Resolve definite Horn clauses, perform data-driven forward chaining to deduce new facts, and execute goal-driven backward chaining to prove the master security theorem.',
    roomSize: { width: 26, depth: 22, height: 7.5 },
    hints: [
      'Fact Base Station (West): Review known atomic percept facts and asserted knowledge base axioms.',
      'Horn Clause Archive (North): Connect implication rules (P ∧ Q ∧ R ⇒ S) using Modus Ponens inference.',
      'Forward Chaining Engine (East): Fire triggered rules sequentially until the target goal token is derived.',
      'Backward Chaining Console (Center): Work backwards from Goal G to find matching premise sub-goals.',
      'Collect the Chaining Key and unlock the Logic Archives Gate on the South wall!',
    ],
  },
  7: {
    id: 7,
    name: 'Level 7',
    chapter: 'Agent Academy - Level 7',
    themeName: 'Propositional & First-Order Logic Facility',
    icon: '⚡',
    difficulty: 'Hard',
    badgeColor: 'from-slate-800 via-indigo-950 to-slate-900 border-indigo-500/50',
    description:
      'The heart of classical artificial intelligence. Verify truth-table satisfiability, resolve First-Order Logic sentences with universal (∀) and existential (∃) quantifiers, execute resolution refutation proofs, and stabilize the Core AI reactor.',
    roomSize: { width: 28, depth: 26, height: 8.0 },
    hints: [
      'Propositional Logic Terminal (West): Construct truth tables for CNF/DNF clauses and identify tautologies vs contradictions.',
      'Quantifier Validator (North): Unify First-Order variables across universal ∀x and existential ∃y predicates.',
      'Resolution Refutation Console (East): Convert sentences to Clausal Normal Form (CNF) and resolve complementary literals (P ∨ Q) ∧ (¬P ∨ R) ⇒ (Q ∨ R) to derive empty clause ⊥.',
      'Core AI Master Console (Center): Insert the Resolution Proof Crystal to stabilize the Quantum AI reactor and complete the master graduation!',
      'Pass through the Core AI Transcendent Gateway to finish all arenas!',
    ],
  },
};

export const LEVELS: LevelInfo[] = Object.values(LEVELS_DATA);
