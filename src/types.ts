export interface AvatarCustomization {
  gender?: 'male' | 'female' | 'unisex';
  skinColor: string;
  headColor: string;
  torsoColor: string;
  leftArmColor: string;
  rightArmColor: string;
  leftLegColor: string;
  rightLegColor: string;
  face: string;
  hat: string;
  hair: string;
  hairColor?: string;
  accessory: string;
  shoulderAccessory?: string;
  neckAccessory?: string;
  shirtPattern?: string;
  pantsPattern?: string;
  shoeColor?: string;
  bodyShape?: 'classic' | 'slim' | 'broad' | 'chibi' | 'r15';
  height?: 'short' | 'standard' | 'tall';
  width?: 'skinny' | 'standard' | 'wide';
  headScale?: 'small' | 'standard' | 'big';
  makeup?: string;
  background?: string;
  activeEmote?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  gender: 'male' | 'female' | 'unisex';
  avatar: AvatarCustomization;
  coins: number;
  xp: number;
  level: number;
  escapesCompleted: number;
  levelsCompleted: LevelId[];
  claimedDailyReward?: boolean;
  lastDailyRewardDate?: string;
  lastDailyRewardTimestamp?: number;
  badges: string[];
  soundEffectsEnabled?: boolean;
  ambientSoundEnabled?: boolean;
  theme?: 'light' | 'dark';
  createdAt: number;
  lastPlayed?: number;
}

export type HubTab = 'home' | 'search' | 'achievements' | 'profile' | 'settings';

export interface ArenaItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  level: string;
  mapLevelId: LevelId;
  colorGradient: string;
  iconSymbol: string;
  description: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export type AppPage = 'auth' | 'home' | 'game' | 'avatar_studio';

export type GameId =
  | 'agent_academy'
  | 'search_maze'
  | 'heuristic_chamber'
  | 'constraint_vault'
  | 'strategy_arena'
  | 'logic_archives'
  | 'core_ai_facility';

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface LevelInfo {
  id: LevelId;
  name: string;
  chapter: string;
  themeName: string;
  icon: string;
  badgeColor: string;
  description: string;
  roomSize: { width: number; depth: number; height: number };
}

export type ItemId =
  // Level 1: Agent Academy (Intelligent Agents)
  | 'access_key'
  | 'security_datapad'
  | 'fragment_a_data'
  | 'fragment_b_data'
  | 'fragment_c_data'
  | 'fragment_d_data'
  | 'goal_predicate_chip'
  // Level 2: Search Maze (Uninformed Search / BFS)
  | 'bfs_queue_key'
  | 'frontier_data_core'
  | 'graph_node_token'
  | 'fifo_memory_cell'
  // Level 3: Heuristic Chamber (Informed Search / A*)
  | 'astar_key'
  | 'heuristic_lens'
  | 'manhattan_data_chip'
  | 'optimal_path_token'
  // Level 4: Constraint Vault (CSP / Backtracking)
  | 'csp_key'
  | 'ac3_token'
  | 'domain_cipher_chip'
  | 'backtracking_matrix_key'
  // Level 5: Strategy Arena (Adversarial / Minimax)
  | 'minimax_key'
  | 'alpha_beta_pruner'
  | 'payoff_matrix_chip'
  | 'level6_protocol_key'
  | 'laser_bypass_chip'
  // Level 6: Logic Archives (Knowledge-Based / Chaining)
  | 'chaining_key'
  | 'horn_clause_scroll'
  | 'inference_engine_token'
  | 'fact_base_crystal'
  // Level 7: Core AI Facility (Classical Logic / Propositional & FOL)
  | 'core_ai_key'
  | 'truth_table_core'
  | 'first_order_quantifier_token'
  | 'resolution_proof_crystal'
  // General / Legacy
  | 'cyber_nanoid'
  | 'cryo_fuse'
  | 'pattern_key'
  | 'pattern_core_alpha'
  | 'pattern_core_beta'
  | 'pattern_core_gamma'
  | 'observation_lens'
  | 'memory_access_code'
  | 'memory_cipher_key'
  | 'archive_key'
  | 'frequency_override_card'
  | 'laser_checkpoint_token'
  | 'grid_coolant_cell'
  | 'sensor_probe'
  | 'state_core_fuse'
  | 'sensorium_keycard'
  | 'trajectory_drive'
  | 'drone_guidance_chip'
  | 'graduation_seal';

export interface InventoryItem {
  id: ItemId;
  name: string;
  description: string;
  icon: string;
  usableOn?: string[];
}

export type InteractiveObjectType =
  // Level 1: Agent Academy (Intelligent Agents)
  | 'fragment_a'
  | 'fragment_b'
  | 'fragment_c'
  | 'fragment_d'
  | 'security_console'
  | 'level2_security_door'
  | 'optical_sensor_array'
  | 'state_estimator_terminal'
  // Level 2: Search Maze (Uninformed Search / BFS)
  | 'bfs_queue_console'
  | 'bfs_frontier_terminal'
  | 'graph_node_matrix'
  | 'bfs_clue_board'
  | 'level2_bfs_door'
  | 'pattern_panel_1'
  | 'pattern_panel_2'
  | 'pattern_panel_3'
  | 'pattern_panel_final'
  | 'pattern_observation_station'
  | 'pattern_clue_board_1'
  | 'pattern_clue_board_2'
  | 'level3_pattern_door'
  // Level 3: Heuristic Chamber (Informed Search / A*)
  | 'astar_eval_terminal'
  | 'manhattan_heuristic_pod'
  | 'euclidean_matrix_board'
  | 'priority_queue_dispatcher'
  | 'level3_astar_door'
  | 'memory_central_display'
  | 'memory_button_blue'
  | 'memory_button_red'
  | 'memory_button_green'
  | 'memory_button_yellow'
  | 'memory_exit_door'
  | 'level4_memory_door'
  | 'memory_clue_board'
  // Level 4: Constraint Vault (CSP / Backtracking Search)
  | 'csp_backtrack_console'
  | 'ac3_arc_validator'
  | 'domain_variable_terminal'
  | 'mrv_heuristic_board'
  | 'level4_csp_door'
  | 'evidence_security_terminal'
  | 'evidence_badge_reader_log'
  | 'evidence_cctv_monitor'
  | 'evidence_corkboard'
  | 'evidence_forensic_desk'
  | 'evidence_suspect_dossiers'
  | 'evidence_case_verdict'
  | 'evidence_locked_drawer'
  | 'level5_archive_door'
  // Level 5: Strategy Arena (Adversarial Search / Minimax)
  | 'minimax_eval_console'
  | 'alpha_cutoff_terminal'
  | 'payoff_matrix_board'
  | 'game_tree_simulator'
  | 'level5_minimax_door'
  | 'laser_master_terminal'
  | 'laser_sub_terminal_alpha'
  | 'laser_sub_terminal_beta'
  | 'laser_clue_console'
  | 'laser_safe_beacon'
  | 'laser_vent_access'
  | 'laser_power_relay'
  | 'level6_vault_door'
  // Level 6: Logic Archives (Knowledge-Based / Chaining)
  | 'forward_chain_terminal'
  | 'backward_goal_console'
  | 'horn_clause_archive'
  | 'modus_ponens_board'
  | 'level6_archive_door'
  // Level 7: Core AI Facility (Classical Logic / Propositional & FOL)
  | 'truth_table_terminal'
  | 'quantifier_validator'
  | 'resolution_refutation_console'
  | 'fol_sentence_matrix'
  | 'core_ai_reactor_door'
  // Collectibles & General
  | 'exit_door'
  | 'vault_door'
  | 'evidence_board'
  | 'bfs_target_node'
  | 'heuristic_console'
  | 'heuristic_node'
  | 'heuristic_exit_door'
  | 'coin_pickup'
  | 'gem_pickup'
  | 'sensor_crystal'
  | 'quantum_core_shard'
  | 'cryo_gem'
  | 'egypt_ruby';

export interface InteractiveObjectData {
  id: string;
  type: InteractiveObjectType;
  name: string;
  prompt: string;
  position: [number, number, number];
  isSolved?: boolean;
  isUnlocked?: boolean;
  requiredItem?: ItemId;
  clueText?: string;
}

export interface EscapeGameState {
  currentLevel: LevelId;
  timeElapsed: number; // in seconds
  isEscaped: boolean;
  hintsUsed: number;
  inventory: InventoryItem[];
  selectedItem: ItemId | null;
  solvedPuzzles: Record<string, boolean>;
  coins: number;
}

