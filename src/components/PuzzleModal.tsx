import React, { useState } from 'react';
import {
  X,
  Key,
  Zap,
  Lock,
  Unlock,
  ShieldAlert,
  Cpu,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Flame,
  Sun,
  Sparkles,
  Search,
  FileText,
  Camera,
  Fingerprint,
  UserCheck,
  FolderOpen,
  ShieldCheck,
  HelpCircle,
  Layers,
  Radio,
  FileSpreadsheet,
  Activity,
  Sliders,
  Shield,
  Terminal,
  Wifi,
  ZapOff,
  Navigation,
  Compass,
} from 'lucide-react';
import { InteractiveObjectData, InventoryItem, ItemId, LevelId } from '../types';
import { sound } from '../services/soundEngine';

interface PuzzleModalProps {
  currentLevel: LevelId;
  objectData: InteractiveObjectData;
  inventory: InventoryItem[];
  solvedPuzzles?: Record<string, boolean>;
  selectedItem: ItemId | null;
  onSolvePuzzle: (puzzleId: string, unlockedItem?: InventoryItem, rewardCoins?: number) => void;
  onUseItem: (itemId: ItemId) => void;
  onSetCheckpoint?: (pos: [number, number, number]) => void;
  onClose: () => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  currentLevel,
  objectData,
  inventory,
  solvedPuzzles = {},
  selectedItem,
  onSolvePuzzle,
  onUseItem,
  onSetCheckpoint,
  onClose,
}) => {
  const hasItem = (id: ItemId) => inventory.some((i) => i.id === id);

  // ==========================================
  // LEVEL 5: THE LASER CORRIDOR (MOVEMENT & TIMING) STATES
  // ==========================================
  const [checkpointASaved, setCheckpointASaved] = useState<boolean>(() => !!solvedPuzzles['checkpointASaved']);
  const [checkpointBSaved, setCheckpointBSaved] = useState<boolean>(() => !!solvedPuzzles['checkpointBSaved']);
  const [sectorAFrequencyDial, setSectorAFrequencyDial] = useState<number>(380);

  // Master Terminal 3-Phase Security Shutdown States
  const [masterFreq, setMasterFreq] = useState<number>(380); // Target: 432 MHz
  const [masterWaveform, setMasterWaveform] = useState<'sine' | 'square' | 'triangle' | 'sawtooth'>('sawtooth'); // Target: 'sine'
  const [masterPulseDelay, setMasterPulseDelay] = useState<number>(0.5); // Target: 1.3s
  const [masterPasscode, setMasterPasscode] = useState<string>(''); // Target: 8942
  const [masterTerminalSolved, setMasterTerminalSolved] = useState<boolean>(
    () => !!solvedPuzzles['laserMasterDisabled'] || !!solvedPuzzles['level6DoorOpened']
  );
  const [masterTerminalError, setMasterTerminalError] = useState<string | null>(null);

  const handleSaveCheckpointA = () => {
    sound.playAccessGranted();
    setCheckpointASaved(true);
    if (onSetCheckpoint) {
      onSetCheckpoint([-6.0, 0, 7.5]);
    }
    onSolvePuzzle(
      'checkpointASaved',
      {
        id: 'laser_checkpoint_token',
        name: 'Sector A Security Token',
        description: 'Authorized checkpoint beacon linked at Sector A Left Alcove.',
        icon: '🟢',
      },
      50
    );
  };

  const handleSaveCheckpointB = () => {
    sound.playAccessGranted();
    setCheckpointBSaved(true);
    if (onSetCheckpoint) {
      onSetCheckpoint([6.0, 0, -1.0]);
    }
    onSolvePuzzle(
      'checkpointBSaved',
      {
        id: 'frequency_override_card',
        name: 'Frequency Override Keycard',
        description: 'Cryptographic keycard downloaded from Sector B Relay Console.',
        icon: '💳',
      },
      50
    );
  };

  const handleMasterKeypadDigit = (digit: string) => {
    if (masterPasscode.length < 4) {
      sound.playKeypadBeep(700 + masterPasscode.length * 100);
      setMasterPasscode((prev) => prev + digit);
      setMasterTerminalError(null);
    }
  };

  const handleMasterKeypadClear = () => {
    sound.playUiClick();
    setMasterPasscode('');
    setMasterTerminalError(null);
  };

  const handleExecuteMasterShutdown = () => {
    sound.playKeypadBeep(900);
    const isFreqCorrect = masterFreq >= 430 && masterFreq <= 434;
    const isWaveCorrect = masterWaveform === 'sine';
    const isDelayCorrect = Math.abs(masterPulseDelay - 1.3) < 0.08;
    const isPasscodeCorrect = masterPasscode === '8942';

    if (!isFreqCorrect || !isWaveCorrect) {
      sound.playAccessDenied();
      setMasterTerminalError('Phase 1 Error: Carrier frequency must be harmonized to 432 MHz with SINE waveform.');
      return;
    }

    if (!isDelayCorrect) {
      sound.playAccessDenied();
      setMasterTerminalError('Phase 2 Error: Synchronization pulse delay must match Sector B offset (1.3s).');
      return;
    }

    if (!isPasscodeCorrect) {
      sound.playAccessDenied();
      setMasterTerminalError('Phase 3 Error: Invalid Master Protocol Code. Enter the 4-digit code (8942).');
      return;
    }

    // All correct!
    sound.playAccessGranted();
    sound.playUnlock();
    sound.playDoorOpen();
    setMasterTerminalSolved(true);
    setMasterTerminalError(null);
    onSolvePuzzle(
      'laserMasterDisabled',
      {
        id: 'level6_protocol_key',
        name: 'Level 6 Protocol Master Key',
        description: 'Master authorization key extracted from the deactivated corridor terminal.',
        icon: '⚡',
      },
      300
    );
    onSolvePuzzle('level6DoorOpened', undefined, 200);
  };

  // ==========================================
  // LEVEL 1: AGENT ACADEMY (THE FOUR-DIGIT LOCK) STATES & PUZZLES
  // ==========================================
  // Station A: Binary / Pattern Logic (Bits: 0, 1, 1, 1 = 7)
  const [stationABits, setStationABits] = useState<[boolean, boolean, boolean, boolean]>([false, false, false, false]);
  const [stationAUnlocked, setStationAUnlocked] = useState<boolean>(() => !!solvedPuzzles['stationASolved']);
  const [stationAError, setStationAError] = useState<boolean>(false);

  // Station B: Arithmetic Circuit Logic Grid (3x3 Grid Target: (3 * 2) - 2 = 4)
  const [stationBEquation, setStationBEquation] = useState<string>('');
  const [stationBUnlocked, setStationBUnlocked] = useState<boolean>(() => !!solvedPuzzles['stationBSolved']);

  // Station C: Prime Frequency Multiplier / Dial (Dial 1..9, target = 1)
  const [stationCSelected, setStationCSelected] = useState<number | null>(null);
  const [stationCUnlocked, setStationCUnlocked] = useState<boolean>(() => !!solvedPuzzles['stationCSolved']);

  // Station D: Laser Wavelength Deflector / Parity (3 switches: sum = 6)
  const [stationDSwitches, setStationDSwitches] = useState<{ s1: boolean; s2: boolean; s3: boolean }>({
    s1: false,
    s2: false,
    s3: false,
  });
  const [stationDUnlocked, setStationDUnlocked] = useState<boolean>(() => !!solvedPuzzles['stationDSolved']);

  // Master Central Keypad & Fragment Receptacle Slots
  const [consoleCode, setConsoleCode] = useState<string>('');
  const [consoleError, setConsoleError] = useState<boolean>(false);
  const [consoleSuccess, setConsoleSuccess] = useState<boolean>(() => !!solvedPuzzles['securityConsoleCracked'] || hasItem('access_key'));
  const [consoleSlots, setConsoleSlots] = useState<[ItemId | null, ItemId | null, ItemId | null, ItemId | null]>([
    null,
    null,
    null,
    null,
  ]);

  // ==========================================
  // LEVEL 2: THE PATTERN LAB (OBSERVATION & LOGICAL REASONING) STATES
  // ==========================================
  const [panel1Selected, setPanel1Selected] = useState<string | null>(null);
  const [panel1Unlocked, setPanel1Unlocked] = useState<boolean>(() => !!solvedPuzzles['patternPanel1Solved'] || hasItem('pattern_core_alpha'));

  const [panel2Selected, setPanel2Selected] = useState<string | null>(null);
  const [panel2Unlocked, setPanel2Unlocked] = useState<boolean>(() => !!solvedPuzzles['patternPanel2Solved'] || hasItem('pattern_core_beta'));

  const [panel3Selected, setPanel3Selected] = useState<string | null>(null);
  const [panel3Unlocked, setPanel3Unlocked] = useState<boolean>(() => !!solvedPuzzles['patternPanel3Solved'] || hasItem('pattern_core_gamma'));

  const [finalPatternSymbol, setFinalPatternSymbol] = useState<string | null>(null);
  const [finalPatternSlots, setFinalPatternSlots] = useState<[ItemId | null, ItemId | null, ItemId | null]>([
    null,
    null,
    null,
  ]);
  const [finalMasterSuccess, setFinalMasterSuccess] = useState<boolean>(() => !!solvedPuzzles['masterPatternConsoleSolved'] || hasItem('pattern_key'));
  const [finalMasterError, setFinalMasterError] = useState<boolean>(false);

  // Legacy Level 2 Compatibility
  const [coolantPressure, setCoolantPressure] = useState<number>(30);
  const [holoNodes, setHoloNodes] = useState<number[]>([1, 0, 1, 0]);
  const [serverBypassed, setServerBypassed] = useState<boolean>(() => !!solvedPuzzles['serverBypassed']);

  // ==========================================
  // SEARCH MAZE: LEVEL 1 — FIRST SEARCH (BFS) STATES
  // ==========================================
  const [bfsCurrentStep, setBfsCurrentStep] = useState<number>(0);
  const [bfsIsRunning, setBfsIsRunning] = useState<boolean>(false);
  const [bfsTargetFound, setBfsTargetFound] = useState<boolean>(
    () => !!solvedPuzzles['bfsTargetFound'] || !!solvedPuzzles['searchMazeLevel1Solved']
  );
  const [bfsExploredCount, setBfsExploredCount] = useState<number>(() =>
    solvedPuzzles['bfsTargetFound'] || solvedPuzzles['searchMazeLevel1Solved'] ? 8 : 1
  );
  const [bfsShortestMoves, setBfsShortestMoves] = useState<number>(() =>
    solvedPuzzles['bfsTargetFound'] || solvedPuzzles['searchMazeLevel1Solved'] ? 4 : 0
  );

  // ==========================================
  // LEVEL 3: THE MEMORY CHAMBER (AGENT ACADEMY) STATES
  // ==========================================
  const [memoryRound, setMemoryRound] = useState<number>(1);
  const [memoryPhase, setMemoryPhase] = useState<'idle' | 'flashing' | 'input' | 'success' | 'failed'>('idle');
  const [flashingIndex, setFlashingIndex] = useState<number>(-1);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [memorySolved, setMemorySolved] = useState<boolean>(() => !!solvedPuzzles['memoryChamberSolved'] || hasItem('memory_access_code'));
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [keypadError, setKeypadError] = useState<boolean>(false);
  const [keypadUnlocked, setKeypadUnlocked] = useState<boolean>(() => !!solvedPuzzles['level4DoorOpened'] || !!solvedPuzzles['memoryDoorOpened']);

  const ROUND_SEQUENCES: Record<number, string[]> = {
    1: ['BLUE', 'RED', 'GREEN'],
    2: ['GREEN', 'YELLOW', 'BLUE', 'RED'],
    3: ['RED', 'BLUE', 'YELLOW', 'GREEN', 'BLUE'],
  };

  // ==========================================
  // LEVEL 4: THE EVIDENCE ROOM (DETECTIVE CHALLENGE) STATES
  // ==========================================
  const [cctvActiveCam, setCctvActiveCam] = useState<'cam1' | 'cam4' | 'cam7' | 'cam9'>('cam4');
  const [selectedSuspect, setSelectedSuspect] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [selectedContradiction, setSelectedContradiction] = useState<string | null>(null);
  const [selectedEvidenceProof, setSelectedEvidenceProof] = useState<string | null>(null);
  const [verdictSubmitted, setVerdictSubmitted] = useState<boolean>(() => !!solvedPuzzles['suspectIdentified'] || !!solvedPuzzles['evidenceCaseSolved']);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [verdictSuccess, setVerdictSuccess] = useState<boolean>(() => !!solvedPuzzles['suspectIdentified'] || !!solvedPuzzles['evidenceCaseSolved']);
  const [drawerOpened, setDrawerOpened] = useState<boolean>(() => !!solvedPuzzles['evidenceDrawerOpened'] || hasItem('archive_key'));
  const [archiveDoorUnlocked, setArchiveDoorUnlocked] = useState<boolean>(() => !!solvedPuzzles['level5DoorOpened'] || !!solvedPuzzles['archiveDoorOpened']);

  // Level 4 Handlers
  const handleSelectSuspect = (s: 'A' | 'B' | 'C' | 'D') => {
    sound.playUiClick();
    setSelectedSuspect(s);
    setVerdictError(null);
  };

  const handleSelectContradiction = (c: string) => {
    sound.playUiClick();
    setSelectedContradiction(c);
    setVerdictError(null);
  };

  const handleSelectEvidenceProof = (p: string) => {
    sound.playUiClick();
    setSelectedEvidenceProof(p);
    setVerdictError(null);
  };

  const handleSubmitVerdict = () => {
    sound.playKeypadBeep(800);
    setVerdictSubmitted(true);

    if (!selectedSuspect || !selectedContradiction || !selectedEvidenceProof) {
      sound.playAccessDenied();
      setVerdictError('Incomplete Case: Select the Prime Suspect, the Core Contradiction, and Physical Proof.');
      return;
    }

    // Correct Solution:
    // Suspect: C (Agent Elena)
    // Contradiction: Cyrus had an airtight alibi (CCTV Cam 04 in Cafeteria 18:35–18:45) when his badge was used at 18:40
    // Proof: Server Room Coolant SR-9 residue on Archive handle & fingerprint on cutoff relay
    const isSuspectCorrect = selectedSuspect === 'C';
    const isContradictionCorrect = selectedContradiction === 'cyrus_alibi';
    const isProofCorrect = selectedEvidenceProof === 'coolant_residue';

    if (isSuspectCorrect && isContradictionCorrect && isProofCorrect) {
      sound.playAccessGranted();
      sound.playUnlock();
      setVerdictSuccess(true);
      setVerdictError(null);
      onSolvePuzzle('suspectIdentified', undefined, 250);
    } else {
      sound.playAccessDenied();
      if (!isSuspectCorrect) {
        setVerdictError('Incorrect Suspect: Review the timeline and physical coolant evidence carefully.');
      } else if (!isContradictionCorrect) {
        setVerdictError('Flawed Contradiction: Examine CCTV Camera 04 in the Cafeteria vs Badge Logs.');
      } else {
        setVerdictError('Insufficient Physical Proof: Inspect the Forensic Lab residue test on the Archive door handle.');
      }
    }
  };

  const handleOpenEvidenceDrawer = () => {
    sound.playUnlock();
    sound.playAccessGranted();
    setDrawerOpened(true);
    onSolvePuzzle(
      'evidenceDrawerOpened',
      {
        id: 'archive_key',
        name: 'Classified Archive Key',
        description: 'Heavy titanium key recovered from the Evidence Drawer. Opens Level 5 Blast Doors.',
        icon: '🔑',
      },
      150
    );
  };

  const handleUnlockArchiveDoor = () => {
    if (hasItem('archive_key') || selectedItem === 'archive_key') {
      sound.playUnlock();
      sound.playAccessGranted();
      sound.playDoorOpen();
      setArchiveDoorUnlocked(true);
      onSolvePuzzle('level5DoorOpened', undefined, 300);
    } else {
      sound.playAccessDenied();
    }
  };

  // ==========================================
  // LEVEL 1: THE FOUR-DIGIT LOCK THINKING PUZZLE HANDLERS
  // ==========================================
  // Station A: 4-bit Binary Register. Target = 7 (Binary: 0 1 1 1 -> 4 + 2 + 1 = 7)
  const handleToggleStationABit = (index: number) => {
    sound.playUiClick();
    const updated = [...stationABits] as [boolean, boolean, boolean, boolean];
    updated[index] = !updated[index];
    setStationABits(updated);
    setStationAError(false);

    const val = (updated[0] ? 8 : 0) + (updated[1] ? 4 : 0) + (updated[2] ? 2 : 0) + (updated[3] ? 1 : 0);
    if (val === 7) {
      sound.playAccessGranted();
      setStationAUnlocked(true);
      onSolvePuzzle(
        'fragmentAExamined',
        {
          id: 'fragment_a_data',
          name: 'Decrypted Fragment A: [ 7 ]',
          description: 'Position 1 = 7 (Derived from 4-bit register 0111: 4 + 2 + 1)',
          icon: '💎',
        },
        50
      );
    }
  };

  // Station B: Arithmetic Grid Target: 4. The user selects the formula or calculates result
  const handleSolveStationB = (answer: string) => {
    sound.playKeypadBeep(700);
    if (answer === '4') {
      sound.playAccessGranted();
      setStationBUnlocked(true);
      onSolvePuzzle(
        'fragmentBExamined',
        {
          id: 'fragment_b_data',
          name: 'Decrypted Fragment B: [ 4 ]',
          description: 'Position 2 = 4 (Solved from Node Logic matrix)',
          icon: '⚡',
        },
        50
      );
    } else {
      sound.playAccessDenied();
    }
  };

  // Station C: Prime Frequency Multiplier Riddle (Target = 1: "Smallest positive odd integer / non-composite baseline")
  const handleSolveStationC = (val: number) => {
    sound.playKeypadBeep(850);
    setStationCSelected(val);
    if (val === 1) {
      sound.playAccessGranted();
      setStationCUnlocked(true);
      onSolvePuzzle(
        'fragmentCExamined',
        {
          id: 'fragment_c_data',
          name: 'Decrypted Fragment C: [ 1 ]',
          description: 'Position 3 = 1 (Derived from optical sensor baseline)',
          icon: '🔋',
        },
        50
      );
    } else {
      sound.playAccessDenied();
    }
  };

  // Station D: Laser deflector switches: S1 (value 3), S2 (value 2), S3 (value 1) -> all on = 6
  const handleToggleStationDSwitch = (key: 's1' | 's2' | 's3') => {
    sound.playUiClick();
    const next = { ...stationDSwitches, [key]: !stationDSwitches[key] };
    setStationDSwitches(next);

    const sum = (next.s1 ? 3 : 0) + (next.s2 ? 2 : 0) + (next.s3 ? 1 : 0);
    if (sum === 6) {
      sound.playAccessGranted();
      setStationDUnlocked(true);
      onSolvePuzzle(
        'fragmentDExamined',
        {
          id: 'fragment_d_data',
          name: 'Decrypted Fragment D: [ 6 ]',
          description: 'Position 4 = 6 (Calculated from deflector sum 3 + 2 + 1)',
          icon: '📟',
        },
        50
      );
    }
  };

  const handleConsoleDigit = (digit: string) => {
    if (consoleCode.length >= 4) return;
    sound.playKeypadBeep(750 + consoleCode.length * 90);
    const next = consoleCode + digit;
    setConsoleCode(next);
    setConsoleError(false);

    if (next.length === 4) {
      // Passcode is 7416 (from Station A=7, B=4, C=1, D=6)
      if (next === '7416') {
        sound.playAccessGranted();
        setConsoleSuccess(true);
        onSolvePuzzle(
          'securityConsoleCracked',
          {
            id: 'access_key',
            name: 'Access Key',
            description: 'High-clearance security key unlocked from the 4-digit console. Use at the Level 2 Security Door.',
            icon: '🔑',
          },
          100
        );
      } else {
        sound.playAccessDenied();
        setConsoleError(true);
        setTimeout(() => {
          setConsoleCode('');
          setConsoleError(false);
        }, 900);
      }
    }
  };

  const handleInsertFragmentToSlot = (slotIdx: number, itemId: ItemId) => {
    sound.playUiClick();
    const newSlots = [...consoleSlots] as [ItemId | null, ItemId | null, ItemId | null, ItemId | null];
    newSlots[slotIdx] = itemId;
    setConsoleSlots(newSlots);

    // Check if all 4 slots are filled
    if (newSlots[0] && newSlots[1] && newSlots[2] && newSlots[3]) {
      const isCorrect =
        newSlots[0] === 'fragment_a_data' &&
        newSlots[1] === 'fragment_b_data' &&
        newSlots[2] === 'fragment_c_data' &&
        newSlots[3] === 'fragment_d_data';

      if (isCorrect) {
        sound.playAccessGranted();
        setConsoleSuccess(true);
        setConsoleCode('7416');
        onSolvePuzzle(
          'securityConsoleCracked',
          {
            id: 'access_key',
            name: 'Access Key',
            description: 'High-clearance security key unlocked by placing all 4 fragments. Use at the Level 2 Security Door.',
            icon: '🔑',
          },
          150
        );
      } else {
        sound.playAccessDenied();
        setConsoleError(true);
        setTimeout(() => {
          setConsoleError(false);
        }, 1200);
      }
    }
  };

  const handleRemoveFragmentFromSlot = (slotIdx: number) => {
    sound.playUiClick();
    const newSlots = [...consoleSlots] as [ItemId | null, ItemId | null, ItemId | null, ItemId | null];
    newSlots[slotIdx] = null;
    setConsoleSlots(newSlots);
  };

  const handleOpenLevel2Door = () => {
    if (!hasItem('access_key')) {
      sound.playAccessDenied();
      return;
    }
    sound.playAccessGranted();
    sound.playUnlock();
    onSolvePuzzle('level2DoorOpened', undefined, 200);
  };

  // ==========================================
  // LEVEL 2: THE PATTERN LAB (ADVANCED VISUAL DEDUCTION) HANDLERS
  // ==========================================
  // Panel 1: Compound Tri-Attribute Sequence (Shape + Dots + Orientation)
  // △(3, 1 dot, 0°) -> ◻(4, 2 dots, 90°) -> ⬠(5, 3 dots, 180°) -> ⬡(6, 4 dots, 270°) -> [ ✦ (7, 5 dots, 0°) ]
  const handleSolvePatternPanel1 = (symbolKey: string) => {
    sound.playKeypadBeep(750);
    setPanel1Selected(symbolKey);
    if (symbolKey === 'heptagram_5dots_up') {
      sound.playAccessGranted();
      setPanel1Unlocked(true);
      onSolvePuzzle(
        'patternPanel1Solved',
        {
          id: 'pattern_core_alpha',
          name: 'Pattern Core Alpha [ ✦₅ ]',
          description: 'Synthesized from the 3-variable morphing cycle (7 vertices, 5 core dots, 0° North). Value = 5.',
          icon: '🔺',
        },
        100
      );
    } else {
      sound.playAccessDenied();
    }
  };

  // Panel 2: 3x3 Raven-Style Superposition Matrix (▢ ⊕ ◇ = ◈)
  const handleSolvePatternPanel2 = (symbolKey: string) => {
    sound.playKeypadBeep(850);
    setPanel2Selected(symbolKey);
    if (symbolKey === 'nested_diamond_matrix') {
      sound.playAccessGranted();
      setPanel2Unlocked(true);
      onSolvePuzzle(
        'patternPanel2Solved',
        {
          id: 'pattern_core_beta',
          name: 'Pattern Core Beta [ ◈ ]',
          description: 'Decoded from 3x3 Raven Superposition Matrix (Square ⊕ Diamond = Nested Matrix). Layers = 2.',
          icon: '🔷',
        },
        100
      );
    } else {
      sound.playAccessDenied();
    }
  };

  // Panel 3: Dual-Axis Rotational Cycloid & Spectral Wave (North + Amethyst + Solid Core)
  const handleSolvePatternPanel3 = (symbolKey: string) => {
    sound.playKeypadBeep(920);
    setPanel3Selected(symbolKey);
    if (symbolKey === 'north_amethyst_solid') {
      sound.playAccessGranted();
      setPanel3Unlocked(true);
      onSolvePuzzle(
        'patternPanel3Solved',
        {
          id: 'pattern_core_gamma',
          name: 'Pattern Core Gamma [ ▲ᵥ ]',
          description: 'Decoded from rotational quadrant + violet wave frequency (0° North, 400nm Violet, Solid Core). Vector = 1.',
          icon: '💠',
        },
        100
      );
    } else {
      sound.playAccessDenied();
    }
  };

  // Master Console Fragment Insertion & Grand Harmonic Equation
  const handleInsertPatternCore = (slotIdx: number, itemId: ItemId) => {
    sound.playUiClick();
    const newSlots = [...finalPatternSlots] as [ItemId | null, ItemId | null, ItemId | null];
    newSlots[slotIdx] = itemId;
    setFinalPatternSlots(newSlots);
  };

  const handleSolveMasterFinalSymbol = (symbolKey: string) => {
    sound.playKeypadBeep(980);
    setFinalPatternSymbol(symbolKey);
    // Grand Harmonic Parity calculation: (Alpha #5 * Beta #2) - Gamma #1 = 9 (Radiant Octagram / Nonagram ✺)
    if (symbolKey === 'radiant_octagram_9' || symbolKey === '✺') {
      sound.playAccessGranted();
      setFinalMasterSuccess(true);
      onSolvePuzzle(
        'masterPatternConsoleSolved',
        {
          id: 'pattern_key',
          name: 'Pattern Key',
          description: 'The master ornate pattern key forged from deep visual deduction. Unlocks the Level 3 door.',
          icon: '🔑',
        },
        250
      );
    } else {
      sound.playAccessDenied();
      setFinalMasterError(true);
      setTimeout(() => setFinalMasterError(false), 1200);
    }
  };

  const handleOpenLevel3Door = () => {
    if (!hasItem('pattern_key')) {
      sound.playAccessDenied();
      return;
    }
    sound.playAccessGranted();
    sound.playUnlock();
    onSolvePuzzle('level3DoorOpened', undefined, 300);
  };

  // ==========================================
  // LEGACY COMPATIBILITY HANDLERS
  // ==========================================
  const handleBypassServer = () => {
    sound.playElectricHum();
    sound.playAccessGranted();
    setServerBypassed(true);
    onSolvePuzzle(
      'serverBypassed',
      {
        id: 'cryo_fuse',
        name: 'Cryo Cooling Fuse',
        description: 'Superconducting fuse required to operate the cryo-coolant console.',
        icon: '❄️',
      },
      100
    );
  };

  const handleAdjustPressure = (delta: number) => {
    sound.playKeypadBeep(600 + coolantPressure * 5);
    const next = Math.max(0, Math.min(100, coolantPressure + delta));
    setCoolantPressure(next);

    if (next === 50) {
      sound.playAccessGranted();
      onSolvePuzzle('coolantStabilized', undefined, 120);
    }
  };

  const handleOpenCryoPod = () => {
    sound.playUnlock();
    onSolvePuzzle(
      'cryoPodOpened',
      {
        id: 'cyber_nanoid',
        name: 'Nano-ID Cleared Chip',
        description: 'Biometric authorization chip with override clearance for the cyber airlock.',
        icon: '💾',
      },
      150
    );
  };

  const handleToggleHoloNode = (index: number) => {
    sound.playUiClick();
    const next = [...holoNodes];
    next[index] = next[index] === 1 ? 0 : 1;
    setHoloNodes(next);

    // Target solution: [1, 1, 0, 1]
    if (next[0] === 1 && next[1] === 1 && next[2] === 0 && next[3] === 1) {
      sound.playAccessGranted();
      onSolvePuzzle('holoCipherSolved', undefined, 150);
    }
  };

  const handleOpenCyberAirlock = () => {
    if (!hasItem('cyber_nanoid')) {
      sound.playAccessDenied();
      return;
    }
    sound.playAccessGranted();
    sound.playUnlock();
    onSolvePuzzle('cyberAirlockOpened', undefined, 300);
  };

  // ==========================================
  // LEVEL 3: THE MEMORY CHAMBER HANDLERS
  // ==========================================
  const handleStartPlayback = (roundNum = memoryRound) => {
    const seq = ROUND_SEQUENCES[roundNum] || ROUND_SEQUENCES[1];
    setMemoryPhase('flashing');
    setPlayerSequence([]);
    setFlashingIndex(-1);

    let currentIdx = 0;
    setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIdx < seq.length) {
          const color = seq[currentIdx];
          setFlashingIndex(currentIdx);
          sound.playColorTone(color);
          currentIdx++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setFlashingIndex(-1);
            setMemoryPhase('input');
          }, 600);
        }
      }, 900);
    }, 300);
  };

  const handleInputColor = (color: string) => {
    if (memoryPhase !== 'input') return;
    sound.playColorTone(color);

    const seq = ROUND_SEQUENCES[memoryRound];
    const newPlayerSeq = [...playerSequence, color];
    const currentStep = newPlayerSeq.length - 1;

    if (seq[currentStep] !== color) {
      sound.playAccessDenied();
      setMemoryPhase('failed');
      setPlayerSequence([]);
      return;
    }

    setPlayerSequence(newPlayerSeq);

    // If current round completed
    if (newPlayerSeq.length === seq.length) {
      if (memoryRound < 3) {
        sound.playMemoryRoundPass();
        const nextRound = memoryRound + 1;
        setMemoryRound(nextRound);
        setPlayerSequence([]);
        setMemoryPhase('idle');
        setTimeout(() => {
          handleStartPlayback(nextRound);
        }, 1200);
      } else {
        // Master Memory Challenge Solved!
        sound.playAccessGranted();
        sound.playUnlock();
        setMemorySolved(true);
        setMemoryPhase('success');
        onSolvePuzzle(
          'memoryChamberSolved',
          {
            id: 'memory_access_code',
            name: 'Master Access Code: 8392',
            description: 'Decrypted 4-digit master code to open the Level 4 Security Exit Door: 8392',
            icon: '🔑',
          },
          250
        );
      }
    }
  };

  const handleKeypadPress = (digit: string) => {
    sound.playKeypadBeep(750);
    setKeypadError(false);
    if (keypadInput.length < 4) {
      setKeypadInput(keypadInput + digit);
    }
  };

  const handleKeypadClear = () => {
    sound.playUiClick();
    setKeypadInput('');
    setKeypadError(false);
  };

  const handleKeypadSubmit = () => {
    if (keypadInput === '8392') {
      sound.playAccessGranted();
      sound.playDoorOpen();
      setKeypadUnlocked(true);
      onSolvePuzzle('level4DoorOpened', undefined, 200);
    } else {
      sound.playAccessDenied();
      setKeypadError(true);
    }
  };

  const handleAutoFillKeypad = () => {
    sound.playKeypadBeep(880);
    setKeypadInput('8392');
    setKeypadError(false);
  };

  // Header helper
  const renderHeader = (title: string, subtitle: string, iconBg: string) => (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-white shadow-xs`}>
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={() => {
          sound.playUiClick();
          onClose();
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* ========================================================================= */}
        {/* LEVEL 1: AGENT ACADEMY — THE FOUR-DIGIT LOCK (THINKING PUZZLES) */}
        {/* ========================================================================= */}
        {objectData.type === 'fragment_a' && (
          <div>
            {renderHeader('Security Fragment A', 'Archive Pod (West Bay) — 4-Bit Binary Register', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The holographic archive is encrypted with a 4-bit binary switch register. You must configure the active bits to produce a decimal total of <span className="font-bold text-cyan-500 font-mono">7</span> to unlock the 1st Security Digit.
              </p>

              <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-mono border-b border-slate-800 pb-2">
                  <span>BINARY REGISTER [ 8 • 4 • 2 • 1 ]</span>
                  <span className="font-bold">
                    CURRENT VALUE = {(stationABits[0] ? 8 : 0) + (stationABits[1] ? 4 : 0) + (stationABits[2] ? 2 : 0) + (stationABits[3] ? 1 : 0)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Bit 3 (Val: 8)', val: 8, idx: 0 },
                    { label: 'Bit 2 (Val: 4)', val: 4, idx: 1 },
                    { label: 'Bit 1 (Val: 2)', val: 2, idx: 2 },
                    { label: 'Bit 0 (Val: 1)', val: 1, idx: 3 },
                  ].map((bit) => {
                    const active = stationABits[bit.idx];
                    return (
                      <button
                        key={bit.idx}
                        onClick={() => handleToggleStationABit(bit.idx)}
                        className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-semibold">{bit.label}</span>
                        <span className="font-mono font-black text-lg">{active ? '1 (ON)' : '0 (OFF)'}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Hint: Set 4 + 2 + 1 to ON (Binary: 0 1 1 1) to equal 7.
                </p>
              </div>

              {(stationAUnlocked || hasItem('fragment_a_data')) ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      DECRYPTED DIGIT #1 = 7
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Saved to Mission Log: [ 7 _ _ _ ]
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-center text-xs text-cyan-300 font-mono">
                  Toggle switches to reach target value 7
                </div>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'fragment_b' && (
          <div>
            {renderHeader('Security Fragment B', 'Maintenance Node (North Wall) — Logic Grid', 'bg-amber-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The node terminal displays a logic pattern circuit. Solve the sequence equation to deduce the 2nd Security Digit:
              </p>

              <div className="p-4 bg-slate-950/80 border border-amber-500/40 rounded-xl space-y-3">
                <div className="text-center font-mono text-base font-black text-amber-400 p-3 bg-slate-900 rounded-lg border border-slate-800 tracking-wider">
                  [ 12 ÷ 3 ] = ? &nbsp;&nbsp;|&nbsp;&nbsp; [ √16 ] = ? &nbsp;&nbsp;|&nbsp;&nbsp; [ (2 × 3) - 2 ] = ?
                </div>
                <p className="text-xs text-amber-200/80 text-center font-medium">
                  What single integer satisfies all three expressions above?
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {['2', '3', '4', '6'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSolveStationB(opt)}
                      className={`py-2.5 rounded-xl border font-mono font-bold text-sm cursor-pointer transition-all ${
                        (stationBUnlocked || hasItem('fragment_b_data')) && opt === '4'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-amber-950/40 hover:border-amber-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {(stationBUnlocked || hasItem('fragment_b_data')) ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      DECRYPTED DIGIT #2 = 4
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Saved to Mission Log: [ _ 4 _ _ ]
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300 font-mono">
                  Select the correct deduced integer
                </div>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'fragment_c' && (
          <div>
            {renderHeader('Security Fragment C', 'Diagnostic Pod (East Bay) — Optical Riddle', 'bg-emerald-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The optical sensor asks a foundational mathematical riddle to calibrate its laser:
              </p>

              <div className="p-4 bg-slate-950/80 border border-emerald-500/40 rounded-xl space-y-3">
                <blockquote className="text-xs italic text-emerald-300 leading-relaxed border-l-2 border-emerald-500 pl-3">
                  "I am neither composite nor prime. Multiplied by any number, I leave it unchanged. What digit am I?"
                </blockquote>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[0, 1, 2, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleSolveStationC(num)}
                      className={`py-2.5 rounded-xl border font-mono font-bold text-sm cursor-pointer transition-all ${
                        (stationCUnlocked || hasItem('fragment_c_data')) && num === 1
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-emerald-950/40 hover:border-emerald-500'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {(stationCUnlocked || hasItem('fragment_c_data')) ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      DECRYPTED DIGIT #3 = 1
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Saved to Mission Log: [ _ _ 1 _ ]
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-mono">
                  Identify the mathematical identity number
                </div>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'fragment_d' && (
          <div>
            {renderHeader('Security Fragment D', 'Research Datapad (South Bay) — Laser Deflector', 'bg-purple-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The telemetry datapad’s wavelength deflector must be aligned. Activate the switch relays to combine their values into a sum of <span className="font-bold text-purple-400 font-mono">6</span>:
              </p>

              <div className="p-4 bg-slate-950/80 border border-purple-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-purple-300 font-mono border-b border-slate-800 pb-2">
                  <span>WAVELENGTH COILS</span>
                  <span className="font-bold">
                    ACTIVE SUM = {(stationDSwitches.s1 ? 3 : 0) + (stationDSwitches.s2 ? 2 : 0) + (stationDSwitches.s3 ? 1 : 0)} / 6
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 's1' as const, label: 'Coil Alpha (Value: +3)', active: stationDSwitches.s1 },
                    { key: 's2' as const, label: 'Coil Beta (Value: +2)', active: stationDSwitches.s2 },
                    { key: 's3' as const, label: 'Coil Gamma (Value: +1)', active: stationDSwitches.s3 },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleToggleStationDSwitch(s.key)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs cursor-pointer transition-all ${
                        s.active
                          ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className="font-bold uppercase">{s.active ? 'ENGAGED' : 'DISENGAGED'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(stationDUnlocked || hasItem('fragment_d_data')) ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      DECRYPTED DIGIT #4 = 6
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Saved to Mission Log: [ _ _ _ 6 ]
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-center text-xs text-purple-300 font-mono">
                  Engage all coils to reach target sum 6
                </div>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'security_console' && (
          <div>
            {renderHeader('Central Security Console', 'Fragment Receptacle Console', 'bg-blue-600')}
            <div className="space-y-5">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Insert the four decrypted security fragments from your inventory into their sequential slots (1st: Fragment A → 2nd: Fragment B → 3rd: Fragment C → 4th: Fragment D) to authenticate and dispense the Level 2 Access Key.
              </p>

              {/* 4 Interactive Fragment Receptacle Slots */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-mono border-b border-slate-800 pb-2">
                  <span className="font-bold uppercase tracking-wider">Security Keypad Receptacle</span>
                  <span className="bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    {consoleSlots.filter(Boolean).length} / 4 Slots Filled
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { idx: 0, label: '1st Digit', fragmentId: 'fragment_a_data' as ItemId, name: 'Fragment A', digit: '7', color: 'border-cyan-500 text-cyan-300 bg-cyan-950/60 shadow-cyan-500/20' },
                    { idx: 1, label: '2nd Digit', fragmentId: 'fragment_b_data' as ItemId, name: 'Fragment B', digit: '4', color: 'border-amber-500 text-amber-300 bg-amber-950/60 shadow-amber-500/20' },
                    { idx: 2, label: '3rd Digit', fragmentId: 'fragment_c_data' as ItemId, name: 'Fragment C', digit: '1', color: 'border-emerald-500 text-emerald-300 bg-emerald-950/60 shadow-emerald-500/20' },
                    { idx: 3, label: '4th Digit', fragmentId: 'fragment_d_data' as ItemId, name: 'Fragment D', digit: '6', color: 'border-purple-500 text-purple-300 bg-purple-950/60 shadow-purple-500/20' },
                  ].map((slot) => {
                    const isFilled = consoleSlots[slot.idx] === slot.fragmentId;
                    const isOwned = hasItem(slot.fragmentId);

                    return (
                      <div
                        key={slot.idx}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-between min-h-[110px] transition-all text-center ${
                          isFilled
                            ? `${slot.color} shadow-md`
                            : isOwned
                            ? 'bg-slate-900 border-dashed border-cyan-500/60 text-slate-300 hover:border-cyan-400 cursor-pointer'
                            : 'bg-slate-900/60 border-dashed border-slate-800 text-slate-600'
                        }`}
                        onClick={() => {
                          if (!isFilled && isOwned) {
                            handleInsertFragmentToSlot(slot.idx, slot.fragmentId);
                          }
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {slot.label}
                        </span>

                        {isFilled ? (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-2xl tracking-wider">{slot.digit}</span>
                            <span className="text-[10px] opacity-80 mt-0.5">{slot.name}</span>
                            {!hasItem('access_key') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFragmentFromSlot(slot.idx);
                                }}
                                className="mt-1 text-[9px] text-red-400 hover:text-red-300 underline cursor-pointer"
                              >
                                Eject
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 my-auto">
                            <span className="text-xl opacity-60">📥</span>
                            <span className="text-[10px] font-medium leading-tight">
                              {isOwned ? (
                                <span className="text-cyan-400 font-bold">Click to Place</span>
                              ) : (
                                <span className="text-slate-500">Missing {slot.name}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Digital readout bar */}
                <div
                  className={`p-3 rounded-xl border text-center font-mono font-black text-xl tracking-widest flex items-center justify-center gap-4 ${
                    hasItem('access_key') || consoleSuccess || (consoleSlots[0] && consoleSlots[1] && consoleSlots[2] && consoleSlots[3])
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-900 border-slate-800 text-cyan-300'
                  }`}
                >
                  <span>{consoleSlots[0] ? '7' : '•'}</span>
                  <span>{consoleSlots[1] ? '4' : '•'}</span>
                  <span>{consoleSlots[2] ? '1' : '•'}</span>
                  <span>{consoleSlots[3] ? '6' : '•'}</span>
                </div>
              </div>

              {/* Inventory Fragments Bar (Click to insert) */}
              {!hasItem('access_key') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Available Fragments in Inventory (Click to Place):
                    </span>
                    {hasItem('fragment_a_data') && hasItem('fragment_b_data') && hasItem('fragment_c_data') && hasItem('fragment_d_data') && (
                      <button
                        onClick={() => {
                          handleInsertFragmentToSlot(0, 'fragment_a_data');
                          handleInsertFragmentToSlot(1, 'fragment_b_data');
                          handleInsertFragmentToSlot(2, 'fragment_c_data');
                          handleInsertFragmentToSlot(3, 'fragment_d_data');
                        }}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        Place All 4 Fragments
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'fragment_a_data' as ItemId, slotIdx: 0, name: 'Fragment A: [ 7 ]', icon: '💎', slotName: '1st Slot' },
                      { id: 'fragment_b_data' as ItemId, slotIdx: 1, name: 'Fragment B: [ 4 ]', icon: '⚡', slotName: '2nd Slot' },
                      { id: 'fragment_c_data' as ItemId, slotIdx: 2, name: 'Fragment C: [ 1 ]', icon: '🔋', slotName: '3rd Slot' },
                      { id: 'fragment_d_data' as ItemId, slotIdx: 3, name: 'Fragment D: [ 6 ]', icon: '📟', slotName: '4th Slot' },
                    ].map((frag) => {
                      const owned = hasItem(frag.id);
                      const isPlaced = consoleSlots[frag.slotIdx] === frag.id;

                      return (
                        <button
                          key={frag.id}
                          disabled={!owned || isPlaced}
                          onClick={() => handleInsertFragmentToSlot(frag.slotIdx, frag.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                            isPlaced
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 opacity-90 cursor-default'
                              : owned
                              ? 'bg-slate-900 hover:bg-cyan-950/50 border-slate-700 hover:border-cyan-500 text-slate-100 cursor-pointer shadow-xs active:scale-95'
                              : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{frag.icon}</span>
                            <span>{frag.name}</span>
                          </div>
                          {isPlaced ? (
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Placed
                            </span>
                          ) : owned ? (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              ➔ {frag.slotName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Locked
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Access Granted Confirmation */}
              {hasItem('access_key') && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 rounded-xl flex items-center gap-3 animate-pulse">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 block">
                      AUTHENTICATION VERIFIED — Access Key Dispensed!
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      All 4 security fragments aligned [ 7 4 1 6 ]. Take the Access Key to the Level 2 Security Door on the South wall to escape.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'level2_security_door' && (
          <div>
            {renderHeader('Level 2 Security Door', 'Academy Transition Gate', 'bg-blue-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                A heavy pressurized blast door leads into Level 2 of the Agent Academy. It requires the high-clearance Access Key.
              </p>
              {hasItem('access_key') ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      Access Key Authenticated! Authorization Confirmed.
                    </span>
                  </div>
                  <button
                    onClick={handleOpenLevel2Door}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" /> Insert Access Key & Open Level 2 Door
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Door Locked. Access Key required. Find the four fragments (A, B, C, D) and enter 7416 at the Central Security Console.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: THE PATTERN LAB (ADVANCED VISUAL DEDUCTION) */}
        {/* ========================================================================= */}
        {/* Pattern Panel 1 (West Bay): Compound Tri-Attribute Sequence */}
        {objectData.type === 'pattern_panel_1' && (
          <div>
            {renderHeader('Pattern Panel 1', 'West Bay — Tri-Attribute Morphing Sequence', 'bg-pink-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Observe the 3 simultaneous variables in sequence: <strong className="text-pink-400">Vertex Count</strong> (+1), <strong className="text-pink-400">Core Dot Count</strong> (+1), and <strong className="text-pink-400">Orientation</strong> (90° CW rotation):
              </p>

              <div className="p-4 bg-slate-950/90 border border-pink-500/40 rounded-xl space-y-4">
                {/* Visual Sequence Display */}
                <div className="grid grid-cols-5 gap-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center font-mono">
                  {/* Step 1: Triangle */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-pink-950/50 border border-pink-500/40">
                    <div className="text-2xl text-pink-400 font-black">△</div>
                    <div className="text-[10px] text-pink-300 font-bold mt-1">1 dot •</div>
                    <div className="text-[9px] text-slate-400">3v | 0° N</div>
                  </div>

                  {/* Step 2: Square */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-pink-950/50 border border-pink-500/40">
                    <div className="text-2xl text-pink-400 font-black rotate-90">◻</div>
                    <div className="text-[10px] text-pink-300 font-bold mt-1">2 dots ••</div>
                    <div className="text-[9px] text-slate-400">4v | 90° E</div>
                  </div>

                  {/* Step 3: Pentagon */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-pink-950/50 border border-pink-500/40">
                    <div className="text-2xl text-pink-400 font-black rotate-180">⬠</div>
                    <div className="text-[10px] text-pink-300 font-bold mt-1">3 dots •••</div>
                    <div className="text-[9px] text-slate-400">5v | 180° S</div>
                  </div>

                  {/* Step 4: Hexagon */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-pink-950/50 border border-pink-500/40">
                    <div className="text-2xl text-pink-400 font-black -rotate-90">⬡</div>
                    <div className="text-[10px] text-pink-300 font-bold mt-1">4 dots ••••</div>
                    <div className="text-[9px] text-slate-400">6v | 270° W</div>
                  </div>

                  {/* Step 5: Missing ? */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-pink-500/20 border-2 border-dashed border-pink-400 animate-pulse">
                    <div className="text-2xl text-pink-300 font-black">
                      {panel1Selected === 'heptagram_5dots_up' ? '✦₅' : '?'}
                    </div>
                    <div className="text-[10px] text-pink-300 font-bold mt-1">Step #5</div>
                    <div className="text-[9px] text-pink-200">Solve 3 Vars</div>
                  </div>
                </div>

                <p className="text-xs text-pink-300/90 text-center font-medium">
                  Which figure mathematically fulfills: <span className="font-bold text-white">7 vertices + 5 core dots + 360°/0° North</span>?
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    {
                      key: 'heptagram_5dots_up',
                      sym: '✦',
                      dots: '5 dots (•••••)',
                      dir: '0° North',
                      desc: '7-Pt Star + 5 Dots (0° N)',
                      correct: true,
                    },
                    {
                      key: 'hexagon_5dots_up',
                      sym: '⬡',
                      dots: '5 dots (•••••)',
                      dir: '0° North',
                      desc: '6-Pt Hexagon (Wrong Vertices)',
                      correct: false,
                    },
                    {
                      key: 'heptagram_4dots_east',
                      sym: '✦',
                      dots: '4 dots (••••)',
                      dir: '90° East',
                      desc: '7-Pt Star (Wrong Dots & Dir)',
                      correct: false,
                    },
                    {
                      key: 'pentagon_5dots_down',
                      sym: '⬠',
                      dots: '5 dots (•••••)',
                      dir: '180° South',
                      desc: '5-Pt Pentagon (Wrong Shape)',
                      correct: false,
                    },
                    {
                      key: 'heptagram_6dots_up',
                      sym: '✦',
                      dots: '6 dots (••••••)',
                      dir: '0° North',
                      desc: '7-Pt Star (Wrong Dot Count)',
                      correct: false,
                    },
                    {
                      key: 'circle_5dots',
                      sym: '○',
                      dots: '5 dots (•••••)',
                      dir: 'Non-Oriented',
                      desc: 'Circle (0 Vertices)',
                      correct: false,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSolvePatternPanel1(item.key)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        (panel1Unlocked || hasItem('pattern_core_alpha')) && item.correct
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 hover:bg-pink-950/40 hover:border-pink-500 text-slate-200'
                      }`}
                    >
                      <span className="text-2xl font-black text-pink-400">{item.sym}</span>
                      <span className="text-[11px] font-bold text-white">{item.dots}</span>
                      <span className="text-[9px] text-slate-400 text-center leading-tight">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(panel1Unlocked || hasItem('pattern_core_alpha')) ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      PATTERN CORE ALPHA DECRYPTED [ ✦₅ ]
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Morphing cycle solved! Pattern Core Alpha stored in inventory (Charge = 5).
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-pink-950/30 border border-pink-500/30 rounded-xl text-center text-xs text-pink-300 font-mono">
                  Inspect the West Wall Chart for Axiom 1 (Tri-Attribute Morphing)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pattern Panel 2 (North Terminal): 3x3 Raven-Style Progressive Superposition Matrix */}
        {objectData.type === 'pattern_panel_2' && (
          <div>
            {renderHeader('Pattern Panel 2', 'North Terminal — 3x3 Progressive Superposition Matrix', 'bg-sky-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Apply the <strong className="text-sky-400">Superposition Law (Shape A ⊕ Shape B = Composite Shape C)</strong> across each row to deduce the missing matrix cell:
              </p>

              <div className="p-4 bg-slate-950/90 border border-sky-500/40 rounded-xl space-y-4">
                {/* 3x3 Visual Logic Matrix */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                  {/* Row 1 */}
                  <div className="flex items-center justify-center gap-2 font-mono text-base font-bold">
                    <span className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">│</span>
                    <span className="text-slate-500">⊕</span>
                    <span className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">─</span>
                    <span className="text-slate-500">=</span>
                    <span className="w-10 h-10 rounded-lg bg-sky-900/80 border border-sky-400 flex items-center justify-center text-sky-300 font-black">┼</span>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center justify-center gap-2 font-mono text-base font-bold">
                    <span className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">╱</span>
                    <span className="text-slate-500">⊕</span>
                    <span className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">╲</span>
                    <span className="text-slate-500">=</span>
                    <span className="w-10 h-10 rounded-lg bg-sky-900/80 border border-sky-400 flex items-center justify-center text-sky-300 font-black">╳</span>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center justify-center gap-2 font-mono text-base font-bold">
                    <span className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">▢</span>
                    <span className="text-slate-500">⊕</span>
                    <span className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">◇</span>
                    <span className="text-slate-500">=</span>
                    <span className="w-10 h-10 rounded-lg bg-sky-500/20 border-2 border-dashed border-sky-400 flex items-center justify-center text-sky-300 font-black animate-pulse">
                      {panel2Selected === 'nested_diamond_matrix' ? '◈' : '?'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-sky-300/90 text-center font-medium">
                  Select the resulting composite matrix cell:
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { key: 'nested_diamond_matrix', sym: '◈', label: 'Nested Frame (◈)', desc: 'Square ⊕ Diamond (Correct)', correct: true },
                    { key: 'solid_diamond', sym: '◆', label: 'Solid Diamond (◆)', desc: 'Missing outer frame', correct: false },
                    { key: 'crossed_box', sym: '☒', label: 'Crossed Box (☒)', desc: 'Incorrect superposition', correct: false },
                    { key: 'empty_square', sym: '▢', label: 'Empty Square (▢)', desc: 'Missing diamond overlay', correct: false },
                    { key: 'circle_in_square', sym: '▣', label: 'Circle Matrix (▣)', desc: 'Invalid geometry', correct: false },
                    { key: 'split_triangle', sym: '◬', label: 'Inlaid Triangle (◬)', desc: 'Irrelevant geometry', correct: false },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSolvePatternPanel2(item.key)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        (panel2Unlocked || hasItem('pattern_core_beta')) && item.correct
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 hover:bg-sky-950/40 hover:border-sky-500 text-slate-200'
                      }`}
                    >
                      <span className="text-2xl font-black text-sky-400">{item.sym}</span>
                      <span className="text-xs font-bold text-white">{item.label}</span>
                      <span className="text-[9px] text-slate-400 text-center">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(panel2Unlocked || hasItem('pattern_core_beta')) ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      PATTERN CORE BETA DECRYPTED [ ◈ ]
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Raven Superposition Matrix solved! Pattern Core Beta acquired (Layers = 2).
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-sky-950/30 border border-sky-500/30 rounded-xl text-center text-xs text-sky-300 font-mono">
                  Inspect the West Wall Archive for Superposition Laws
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pattern Panel 3 (East Chamber): Dual-Axis Rotational Cycloid & Spectral Wave */}
        {objectData.type === 'pattern_panel_3' && (
          <div>
            {renderHeader('Pattern Panel 3', 'East Chamber — Rotational Cycloid & Spectral Wave', 'bg-purple-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Synthesize 3 harmonic vectors: <strong className="text-purple-400">Pointer Angle</strong> (+90° CW), <strong className="text-purple-400">Spectral Band</strong> (Red ➔ Amber ➔ Emerald ➔ Cyan ➔ Violet), and <strong className="text-purple-400">Core Lensing</strong> (Solid ➔ Open ➔ Solid ➔ Open ➔ Solid):
              </p>

              <div className="p-4 bg-slate-950/90 border border-purple-500/40 rounded-xl space-y-4">
                {/* Visual Sequence Display */}
                <div className="grid grid-cols-5 gap-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center font-mono">
                  {/* Step 1: North Red Solid */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-red-950/40 border border-red-500/40">
                    <span className="text-2xl font-black text-red-400">▲</span>
                    <span className="text-[10px] text-red-300 font-bold mt-1">Solid ●</span>
                    <span className="text-[9px] text-slate-400">North | Red</span>
                  </div>

                  {/* Step 2: East Amber Open */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-amber-950/40 border border-amber-500/40">
                    <span className="text-2xl font-black text-amber-400">▷</span>
                    <span className="text-[10px] text-amber-300 font-bold mt-1">Open ◎</span>
                    <span className="text-[9px] text-slate-400">East | Amber</span>
                  </div>

                  {/* Step 3: South Emerald Solid */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                    <span className="text-2xl font-black text-emerald-400">▼</span>
                    <span className="text-[10px] text-emerald-300 font-bold mt-1">Solid ●</span>
                    <span className="text-[9px] text-slate-400">South | Emerald</span>
                  </div>

                  {/* Step 4: West Cyan Open */}
                  <div className="flex flex-col items-center p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                    <span className="text-2xl font-black text-cyan-400">◁</span>
                    <span className="text-[10px] text-cyan-300 font-bold mt-1">Open ◎</span>
                    <span className="text-[9px] text-slate-400">West | Cyan</span>
                  </div>

                  {/* Step 5: Missing ? */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-500/20 border-2 border-dashed border-purple-400 animate-pulse">
                    <span className="text-2xl font-black text-purple-300">
                      {panel3Selected === 'north_amethyst_solid' ? '▲ᵥ' : '?'}
                    </span>
                    <span className="text-[10px] text-purple-300 font-bold mt-1">Step #5</span>
                    <span className="text-[9px] text-purple-200">Solve 3 Waves</span>
                  </div>
                </div>

                <p className="text-xs text-purple-300/90 text-center font-medium">
                  Select the harmonic cycloid pointer for Step #5:
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {[
                    {
                      key: 'north_amethyst_solid',
                      sym: '▲',
                      color: 'text-purple-400',
                      label: 'North (▲) | Amethyst Violet | Solid Core ●',
                      desc: 'Correct (360° North, 400nm Violet, Solid Phase)',
                      correct: true,
                    },
                    {
                      key: 'east_amethyst_ring',
                      sym: '▷',
                      color: 'text-purple-400',
                      label: 'East (▷) | Amethyst Violet | Open Ring ◎',
                      desc: 'Wrong Angle & Phase',
                      correct: false,
                    },
                    {
                      key: 'north_cyan_solid',
                      sym: '▲',
                      color: 'text-cyan-400',
                      label: 'North (▲) | Cyan Wave | Solid Core ●',
                      desc: 'Wrong Spectral Band',
                      correct: false,
                    },
                    {
                      key: 'south_emerald_solid',
                      sym: '▼',
                      color: 'text-emerald-400',
                      label: 'South (▼) | Emerald Wave | Solid Core ●',
                      desc: 'Wrong Angle & Spectrum',
                      correct: false,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSolvePatternPanel3(item.key)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                        (panel3Unlocked || hasItem('pattern_core_gamma')) && item.correct
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 hover:bg-purple-950/40 hover:border-purple-500 text-slate-200'
                      }`}
                    >
                      <span className={`text-3xl font-black ${item.color}`}>{item.sym}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {(panel3Unlocked || hasItem('pattern_core_gamma')) ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                      PATTERN CORE GAMMA DECRYPTED [ ▲ᵥ ]
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Rotational cycloid aligned! Pattern Core Gamma acquired (Vector = 1).
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-center text-xs text-purple-300 font-mono">
                  Inspect the East Wall Table for Rotational & Spectral rules
                </div>
              )}
            </div>
          </div>
        )}

        {/* Master Pattern Synthesizer (Center of Room) */}
        {objectData.type === 'pattern_panel_final' && (
          <div>
            {renderHeader('Master Pattern Synthesizer', 'Central Matrix — Grand Harmonic Fusion', 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Align all 3 decrypted Pattern Cores, then solve the <strong className="text-pink-400">Grand Harmonic Parity Equation</strong> to forge the <span className="font-bold text-amber-400">🔑 Pattern Key</span>:
              </p>

              {/* 3 Core Alignment Sockets */}
              <div className="p-4 bg-slate-950/90 border border-purple-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Core Alignment Sockets:
                  </span>
                  {!hasItem('pattern_key') && hasItem('pattern_core_alpha') && hasItem('pattern_core_beta') && hasItem('pattern_core_gamma') && (
                    <button
                      onClick={() => {
                        handleInsertPatternCore(0, 'pattern_core_alpha');
                        handleInsertPatternCore(1, 'pattern_core_beta');
                        handleInsertPatternCore(2, 'pattern_core_gamma');
                      }}
                      className="text-[11px] font-bold text-pink-400 hover:text-pink-300 underline cursor-pointer"
                    >
                      Insert All 3 Cores
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { idx: 0, id: 'pattern_core_alpha' as ItemId, name: 'Core Alpha', sym: '✦₅', val: 'Charge: 5', color: 'border-pink-500 text-pink-400' },
                    { idx: 1, id: 'pattern_core_beta' as ItemId, name: 'Core Beta', sym: '◈', val: 'Layers: 2', color: 'border-sky-500 text-sky-400' },
                    { idx: 2, id: 'pattern_core_gamma' as ItemId, name: 'Core Gamma', sym: '▲ᵥ', val: 'Vector: 1', color: 'border-purple-500 text-purple-400' },
                  ].map((slot) => {
                    const isPlaced = finalPatternSlots[slot.idx] === slot.id || hasItem('pattern_key');
                    const owned = hasItem(slot.id);

                    return (
                      <div
                        key={slot.idx}
                        onClick={() => {
                          if (!isPlaced && owned) {
                            handleInsertPatternCore(slot.idx, slot.id);
                          }
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isPlaced
                            ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-md'
                            : owned
                            ? 'bg-slate-900 border-dashed border-pink-500/60 text-slate-300 hover:border-pink-400 cursor-pointer'
                            : 'bg-slate-900/60 border-dashed border-slate-800 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {slot.name}
                        </span>
                        {isPlaced ? (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-2xl tracking-wider text-white">{slot.sym}</span>
                            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {slot.val}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5 my-1">
                            <span className="text-lg opacity-60">📥</span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {owned ? 'Click to Place' : 'Missing'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grand Harmonic Parity Equation */}
              <div className="p-4 bg-slate-950/90 border border-pink-500/40 rounded-xl space-y-3">
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wider block text-center">
                  Grand Harmonic Parity Equation:
                </span>

                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center font-mono space-y-1">
                  <div className="text-sm text-purple-300 font-bold">
                    (Core Alpha Charge [5] × Core Beta Layers [2]) - Core Gamma Vector [1] = ?
                  </div>
                  <div className="text-xs text-slate-400">
                    Calculation: (5 × 2) - 1 = <strong className="text-amber-400">9 Harmonic Rays</strong>
                  </div>
                </div>

                <p className="text-xs text-center text-slate-300">
                  Select the 9-Ray Radiant Star glyph (✺) to ignite the forge:
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { key: 'radiant_octagram_9', sym: '✺', label: 'Radiant Star (9)', color: 'text-amber-400', correct: true },
                    { key: 'empty_star_6', sym: '✧', label: '6-Pt Star (6)', color: 'text-sky-400', correct: false },
                    { key: 'solid_diamond_4', sym: '◆', label: 'Diamond (4)', color: 'text-pink-400', correct: false },
                    { key: 'triangle_3', sym: '△', label: 'Triangle (3)', color: 'text-purple-400', correct: false },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSolveMasterFinalSymbol(item.key)}
                      className={`py-3 px-1 rounded-xl border font-mono font-bold text-sm cursor-pointer transition-all flex flex-col items-center gap-1 ${
                        (finalMasterSuccess || hasItem('pattern_key')) && item.correct
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-700 hover:bg-pink-950/40 hover:border-pink-500 text-slate-200'
                      }`}
                    >
                      <span className={`text-2xl ${item.color}`}>{item.sym}</span>
                      <span className="text-[10px] text-slate-300 text-center leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern Key Dispensed Notification */}
              {hasItem('pattern_key') && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 rounded-xl flex items-center gap-3 animate-pulse">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 block">
                      🔑 PATTERN KEY FORGED!
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      Master visual equation synthesized! Approach the Level 3 Security Door on the South wall to unlock it and advance.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clue Board 1 (West Wall): Morphing Laws & Raven Superposition Matrix */}
        {objectData.type === 'pattern_clue_board_1' && (
          <div>
            {renderHeader('Geometric Reference Chart', 'West Wall Observation Archive', 'bg-pink-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                A massive luminescent diagram records the foundational laws of visual deduction:
              </p>

              <div className="p-4 bg-slate-950/90 border border-pink-500/40 rounded-xl space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-pink-300 space-y-1">
                  <span className="font-bold block text-pink-400 uppercase">Axiom 1: Tri-Attribute Morphing</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    "When shapes morph, evaluate: <strong className="text-pink-400">Vertices</strong> (+1), <strong className="text-pink-400">Internal Charge Dots</strong> (+1), and <strong className="text-pink-400">Angular Velocity</strong> (90° CW). A 6-sided hexagon with 4 dots pointing West morphs into a 7-pointed star with 5 dots pointing North."
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-sky-300 space-y-1">
                  <span className="font-bold block text-sky-400 uppercase">Axiom 2: Raven Superposition Law</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    "When shapes merge across a matrix row (Shape A ⊕ Shape B), overlapping outer strokes preserve their boundaries while inner geometric contours nest into a composite matrix cell."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clue Board 2 (East Wall): Rotational Vectors & Parity Equation */}
        {objectData.type === 'pattern_clue_board_2' && (
          <div>
            {renderHeader('Symbolic Frequency Table', 'East Wall Observation Archive', 'bg-purple-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                A holographic frequency table maps rotational coordinates and master harmonic calculations:
              </p>

              <div className="p-4 bg-slate-950/90 border border-purple-500/40 rounded-xl space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-purple-300 space-y-1">
                  <span className="font-bold block text-purple-400 uppercase">Rule 1: Rotational Cycloid & Spectral Wave</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    "A vector undergoing quadrant rotation follows: North (▲) ➔ East (▷) ➔ South (▼) ➔ West (◁) ➔ North (▲). Simultaneously, spectral light shifts from Red (650nm) to Violet (400nm)."
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-amber-300 space-y-1">
                  <span className="font-bold block text-amber-400 uppercase">Rule 2: Grand Harmonic Parity Formula</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    "Multiply Core Alpha Charge (5) by Core Beta Layers (2), then subtract Core Gamma Vector (1): (5 × 2) - 1 = 9 Radiant Rays (✺)."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Level 3 Security Door (South Wall): Requires 🔑 Pattern Key */}
        {objectData.type === 'level3_pattern_door' && (
          <div>
            {renderHeader('Level 3 Security Door', 'Academy Transition Portal', 'bg-gradient-to-r from-purple-600 to-pink-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                A massive geometric blast gate leads into Level 3 of the Agent Academy. It requires the high-clearance <span className="font-bold text-amber-400">🔑 Pattern Key</span>.
              </p>

              {hasItem('pattern_key') ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                        🔑 Pattern Key Authenticated!
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        Visual deduction complete. Authorization verified for Level 3.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenLevel3Door}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer active:scale-95"
                  >
                    <Unlock className="w-4 h-4" /> Insert Pattern Key & Unlock Level 3 Door
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                      Door Locked — Requires 🔑 Pattern Key
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300">
                      Solve the pattern panels across the room (Panel 1, 2, 3), assemble their cores at the Master Pattern Console, and retrieve the Pattern Key.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legacy Fallbacks */}
        {objectData.type === 'server_rack' && (
          <div>
            {renderHeader('Quantum Server Mainframe', 'Hardware Extraction', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The primary data rack is running in emergency diagnostic mode. Bypassing its power bus will release the Cryo Cooling Fuse.
              </p>
              {hasItem('cryo_fuse') ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Cryo Fuse extracted to inventory.
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleBypassServer}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Bypass Server Bus & Extract Cryo Fuse
                </button>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'coolant_console' && (
          <div>
            {renderHeader('Cryo-Coolant Console', 'Pressure Calibration', 'bg-blue-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Calibrate the cryo-chamber pressure to exactly <span className="font-bold text-cyan-500">50 PSI</span> to safely thaw the containment pod.
              </p>

              <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/40 flex items-center justify-between text-white font-mono">
                <span className="text-xs">Current Pressure:</span>
                <span className={`text-xl font-bold ${coolantPressure === 50 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {coolantPressure} PSI
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAdjustPressure(-10)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  -10 PSI
                </button>
                <button
                  onClick={() => handleAdjustPressure(+10)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  +10 PSI
                </button>
              </div>
            </div>
          </div>
        )}

        {objectData.type === 'cryo_pod' && (
          <div>
            {renderHeader('Cryogenic Containment Pod', 'Specimen Extraction', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Inside the glowing glass chamber rests the Nano-ID Cleared Chip required for the biometric airlock.
              </p>
              {hasItem('cyber_nanoid') ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Nano-ID Chip retrieved and ready for authorization.
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleOpenCryoPod}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Unlock className="w-4 h-4" /> Open Thawed Pod & Retrieve Nano-ID Chip
                </button>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'holo_terminal' && (
          <div>
            {renderHeader('Holographic Cipher Terminal', 'Quantum Parity Grid', 'bg-indigo-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Align the quantum harmonic states to match the resonance frequency: [1, 1, 0, 1].
              </p>

              <div className="grid grid-cols-4 gap-2">
                {holoNodes.map((val, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleToggleHoloNode(idx)}
                    className={`py-4 rounded-xl font-mono text-lg font-bold border-2 cursor-pointer transition-all ${
                      val === 1
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {objectData.type === 'bio_scanner' && (
          <div>
            {renderHeader('Biometric Clearance Scanner', 'Identity Verification', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Present your Nano-ID Chip to verify clearance and disable the cyber airlock laser grid.
              </p>
              {hasItem('cyber_nanoid') ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Biometric Cleared! Airlock override is active.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Requires Nano-ID Chip from the Cryo Pod.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {objectData.type === 'cyber_airlock' && (
          <div>
            {renderHeader('Cybernetic Airlock Gate', 'Facility Exit', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                The facility decompression airlock leads out to safety.
              </p>
              {hasItem('cyber_nanoid') ? (
                <button
                  onClick={handleOpenCyberAirlock}
                  className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Unlock className="w-4 h-4" /> Authenticate Nano-ID & Depressurize Airlock
                </button>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Airlock Locked. Complete biometric verification with your Nano-ID Chip.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: THE MEMORY CHAMBER (WATCH -> REMEMBER -> REPRODUCE) */}
        {/* ========================================================================= */}
        {objectData.type === 'memory_central_display' && (
          <div>
            {renderHeader('Central Memory Terminal', 'Cognitive Sequence Matrix', 'bg-cyan-600')}
            <div className="space-y-4">
              {/* Round Progress Tracker */}
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300">Cognitive Progression:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {[
                    { round: 1, label: 'R1 (3 Colors)' },
                    { round: 2, label: 'R2 (4 Colors)' },
                    { round: 3, label: 'R3 (5 Colors)' },
                  ].map((r) => (
                    <span
                      key={r.round}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        memoryRound > r.round || memorySolved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : memoryRound === r.round
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {memoryRound > r.round || memorySolved ? `✓ ${r.label}` : r.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Main Holographic Screen Canvas */}
              <div className="relative min-h-[190px] rounded-2xl bg-slate-950 border-2 border-cyan-500/50 p-6 flex flex-col items-center justify-center text-center overflow-hidden shadow-inner">
                {/* Ambient Grid lines in background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                {memorySolved ? (
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex p-3 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                      <Sparkles className="w-8 h-8 animate-spin" />
                    </div>
                    <h4 className="text-lg font-black text-white tracking-wide">
                      NEURAL COGNITION COMPLETE
                    </h4>
                    <p className="text-xs text-slate-300">
                      Decrypted Master Access Code for Level 4 Exit Keypad:
                    </p>
                    <div className="py-2.5 px-6 bg-slate-900 border-2 border-amber-400 text-amber-300 font-mono text-3xl font-black rounded-xl tracking-widest shadow-lg inline-block">
                      8392
                    </div>
                  </div>
                ) : memoryPhase === 'idle' ? (
                  <div className="relative z-10 space-y-3">
                    <Lightbulb className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">
                        Round {memoryRound} of 3: {ROUND_SEQUENCES[memoryRound].length} Color Sequence
                      </h4>
                      <p className="text-xs text-slate-300 max-w-sm">
                        Watch the screen closely as the color sequence flashes, memorize the order, then reproduce it.
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartPlayback(memoryRound)}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer transform hover:scale-105"
                    >
                      ▶ INITIATE TRANSMISSION (WATCH SEQUENCE)
                    </button>
                  </div>
                ) : memoryPhase === 'flashing' ? (
                  <div className="relative z-10 space-y-3">
                    <div className="text-xs font-mono text-cyan-400 tracking-wider flex items-center justify-center gap-1">
                      <Zap className="w-3.5 h-3.5 animate-pulse" /> TRANSMITTING NEURAL SEQUENCE...
                    </div>
                    {flashingIndex >= 0 && (
                      <div
                        className={`px-8 py-5 rounded-2xl font-black text-2xl tracking-widest shadow-2xl transition-all transform scale-110 ${
                          ROUND_SEQUENCES[memoryRound][flashingIndex] === 'BLUE'
                            ? 'bg-cyan-500 text-white shadow-cyan-500/50 border-2 border-cyan-200'
                            : ROUND_SEQUENCES[memoryRound][flashingIndex] === 'RED'
                            ? 'bg-rose-600 text-white shadow-rose-600/50 border-2 border-rose-200'
                            : ROUND_SEQUENCES[memoryRound][flashingIndex] === 'GREEN'
                            ? 'bg-emerald-500 text-white shadow-emerald-500/50 border-2 border-emerald-200'
                            : 'bg-amber-400 text-slate-950 shadow-amber-400/50 border-2 border-amber-100'
                        }`}
                      >
                        {ROUND_SEQUENCES[memoryRound][flashingIndex]}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {ROUND_SEQUENCES[memoryRound].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            i === flashingIndex ? 'bg-cyan-300 scale-125' : i < flashingIndex ? 'bg-cyan-700' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : memoryPhase === 'failed' ? (
                  <div className="relative z-10 space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-rose-400">SEQUENCE MISMATCH!</h4>
                      <p className="text-xs text-slate-300">
                        Memory buffer lost coherence. Re-synchronize and try again.
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartPlayback(memoryRound)}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      ↺ RETRY SEQUENCE TRANSMISSION
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10 space-y-3 w-full">
                    <div className="text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> REPRODUCE SEQUENCE ({playerSequence.length}/{ROUND_SEQUENCES[memoryRound].length})
                    </div>
                    {/* User Sequence Slots */}
                    <div className="flex justify-center gap-2">
                      {ROUND_SEQUENCES[memoryRound].map((_, idx) => {
                        const entered = playerSequence[idx];
                        return (
                          <div
                            key={idx}
                            className={`w-14 h-10 rounded-lg flex items-center justify-center font-bold text-xs font-mono border-2 transition-all ${
                              entered === 'BLUE'
                                ? 'bg-cyan-500 border-cyan-300 text-white'
                                : entered === 'RED'
                                ? 'bg-rose-600 border-rose-300 text-white'
                                : entered === 'GREEN'
                                ? 'bg-emerald-500 border-emerald-300 text-white'
                                : entered === 'YELLOW'
                                ? 'bg-amber-400 border-amber-200 text-slate-950'
                                : idx === playerSequence.length
                                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-400 animate-pulse'
                                : 'border-slate-800 bg-slate-900 text-slate-600'
                            }`}
                          >
                            {entered ? entered.slice(0, 3) : '?'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Interactive Color Control Pads */}
              {!memorySolved && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { color: 'BLUE', label: 'BLUE [Cyan]', bg: 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600', ring: 'ring-cyan-400' },
                    { color: 'RED', label: 'RED [Crimson]', bg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700', ring: 'ring-rose-400' },
                    { color: 'GREEN', label: 'GREEN [Emerald]', bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700', ring: 'ring-emerald-400' },
                    { color: 'YELLOW', label: 'YELLOW [Amber]', bg: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600', ring: 'ring-amber-400' },
                  ].map((btn) => (
                    <button
                      key={btn.color}
                      disabled={memoryPhase !== 'input'}
                      onClick={() => handleInputColor(btn.color)}
                      className={`py-4 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 ${btn.bg}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white/40" />
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Color Button Terminals (Blue, Red, Green, Yellow) */}
        {(objectData.type === 'memory_button_blue' ||
          objectData.type === 'memory_button_red' ||
          objectData.type === 'memory_button_green' ||
          objectData.type === 'memory_button_yellow') && (
          <div>
            {renderHeader(objectData.name, 'Frequency Resonance Station', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This frequency terminal connects directly to the central memory matrix. You can test its acoustic tone or register this frequency color into your memory challenge.
              </p>

              <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-300">Station Color Identity:</span>
                <span className="font-bold text-sm font-mono text-white">
                  {objectData.type === 'memory_button_blue' && 'CYAN / BLUE (440 Hz)'}
                  {objectData.type === 'memory_button_red' && 'CRIMSON / RED (554 Hz)'}
                  {objectData.type === 'memory_button_green' && 'EMERALD / GREEN (659 Hz)'}
                  {objectData.type === 'memory_button_yellow' && 'AMBER / YELLOW (880 Hz)'}
                </span>
              </div>

              <button
                onClick={() => {
                  const color =
                    objectData.type === 'memory_button_blue'
                      ? 'BLUE'
                      : objectData.type === 'memory_button_red'
                      ? 'RED'
                      : objectData.type === 'memory_button_green'
                      ? 'GREEN'
                      : 'YELLOW';
                  sound.playColorTone(color);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Zap className="w-4 h-4" /> Pulse Frequency Tone (Audio Feedback)
              </button>
            </div>
          </div>
        )}

        {/* Memory Clue Board */}
        {objectData.type === 'memory_clue_board' && (
          <div>
            {renderHeader('Cognitive Memory Protocol', 'Agent Academy Directive', 'bg-indigo-600')}
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
                  <Lightbulb className="w-4 h-4" /> PROTOCOL 03: MEMORY SYNAPSE DRILL
                </div>
                <p>1. Approach the Central Display Console at the middle of the chamber.</p>
                <p>2. Trigger the sequence playback and memorize the illuminated colors and acoustic frequencies:</p>
                <ul className="pl-4 space-y-1 text-cyan-200">
                  <li>• Round 1: 3-Color Pattern</li>
                  <li>• Round 2: 4-Color Pattern</li>
                  <li>• Round 3: 5-Color Pattern</li>
                </ul>
                <p>3. Enter the exact color sequence to pass each round.</p>
                <p className="text-amber-300 font-bold">
                  4. Completing all 3 rounds decrypts and transmits the 4-digit Master Exit Code directly to your security inventory.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Level 4 Security Exit Keypad */}
        {objectData.type === 'level4_memory_door' && (
          <div>
            {renderHeader('Level 4 Security Exit Keypad', 'Chamber Egress Portal', 'bg-cyan-600')}
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Enter the 4-digit master access code generated by completing the Central Memory Challenge to open the blast gate to Level 4.
              </p>

              {/* LCD Display */}
              <div className="p-4 bg-slate-950 rounded-xl border-2 border-cyan-500/50 flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono text-slate-400 tracking-wider mb-1">
                  SECURITY CLEARANCE INPUT
                </span>
                <div
                  className={`font-mono text-3xl font-black tracking-widest ${
                    keypadUnlocked
                      ? 'text-emerald-400'
                      : keypadError
                      ? 'text-rose-500 animate-shake'
                      : 'text-cyan-300'
                  }`}
                >
                  {keypadUnlocked ? 'ACCESS GRANTED' : keypadInput.padEnd(4, '•')}
                </div>
                {keypadError && (
                  <span className="text-xs font-bold text-rose-400 mt-1">INVALID CODE — RE-TRY</span>
                )}
              </div>

              {/* Memory code status */}
              {hasItem('memory_access_code') && !keypadUnlocked ? (
                <button
                  onClick={handleAutoFillKeypad}
                  className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> Auto-Fill Decrypted Master Code (8392)
                </button>
              ) : !keypadUnlocked ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-200">
                    <strong>Code Encrypted:</strong> Solve all 3 rounds at the <strong>Central Memory Terminal</strong> to decrypt your master clearance code.
                  </span>
                </div>
              ) : null}

              {/* 10-Digit Numpad */}
              {!keypadUnlocked ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        onClick={() => handleKeypadPress(digit)}
                        className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      onClick={handleKeypadClear}
                      className="py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      CLEAR
                    </button>
                    <button
                      onClick={() => handleKeypadPress('0')}
                      className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
                    >
                      0
                    </button>
                    <button
                      onClick={handleKeypadSubmit}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      ENTER
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Blast Doors Unlocked!
                    </h5>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Step through the exit gate in the room to proceed to Level 4.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 4: THE EVIDENCE ROOM — INVESTIGATION & DETECTIVE CHALLENGE */}
        {/* ========================================================================= */}

        {/* 1. North Security Terminal - Breach Alert & Incident Timeline */}
        {objectData.type === 'evidence_security_terminal' && (
          <div>
            {renderHeader('Restricted Archive Mainframe', 'Security Incident Report #8042', 'bg-amber-600')}
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/90 border border-amber-500/40 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                    SECURITY BREACH ALERT: RESTRICTED ARCHIVE
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/40">
                    CRITICAL
                  </span>
                </div>

                <div className="space-y-2 text-slate-300 text-[12px] leading-relaxed">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">⏱️ Exact Breach Timestamp:</span>{' '}
                    <span className="text-white font-black bg-amber-500/20 px-1.5 py-0.5 rounded">18:42:00</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-bold">🚪 Door Reader Log:</span> Badge ID #B-7729{' '}
                    <span className="text-rose-400 font-bold">(Registered to: Agent Cyrus / Agent B)</span> badged the
                    Archive Outer Portal at <span className="text-white font-bold">18:40:00</span>.
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold">📹 Anomaly Event:</span> CCTV Camera 07 (Server Room)
                    feed dropped offline unexpectedly at <span className="text-white font-bold">18:40:15</span>.
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">🧪 Chemical Sensor:</span> Archive outer door handle
                    contains traces of synthetic liquid:{' '}
                    <span className="text-cyan-300 font-bold">Fluorescent Glycol Coolant (Type SR-9)</span>.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Detective Directive:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Agent Cyrus is named in the badge log, but check CCTV Video feeds and the forensic coolant evidence to verify if he was actually the person who entered!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Door Badge Reader Station (West Desk) */}
        {objectData.type === 'evidence_badge_reader_log' && (
          <div>
            {renderHeader('Facility Door Badge Access Log', 'Central Gate Timestamp Records (18:30 - 18:50)', 'bg-blue-600')}
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Electronic keycard transactions recorded across all security doors prior to the 18:42 breach:
              </p>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono font-bold rounded">18:35</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Agent Vance (Agent A)</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">North Wing Gate</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-mono font-bold rounded">18:38</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Agent Kaelen (Agent D)</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">Rec Breakroom Door</span>
                </div>

                <div className="p-3 bg-rose-500/10 border-l-4 border-l-rose-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-mono font-bold rounded">18:40</span>
                    <span className="font-bold text-rose-900 dark:text-rose-200">Agent Cyrus (Agent B)</span>
                  </div>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">Restricted Archive Door</span>
                </div>

                <div className="p-3 bg-amber-500/10 border-l-4 border-l-amber-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-mono font-bold rounded">18:41</span>
                    <span className="font-bold text-amber-900 dark:text-amber-200">Agent Elena (Agent C)</span>
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">Quantum Server Room</span>
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-400" /> Badge Reader Key Note:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Notice that Agent Cyrus badged the Archive at 18:40, while Agent Elena entered the Server Room at 18:41 (where the cooling system leaked coolant SR-9).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. CCTV Surveillance Video Player (East Station) */}
        {objectData.type === 'evidence_cctv_monitor' && (
          <div>
            {renderHeader('CCTV Surveillance Video Player', 'Multi-Angle Facility Playback at 18:40', 'bg-cyan-600')}
            <div className="space-y-4">
              {/* Camera Channel Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'cam4', label: 'CAM 04: Cafeteria', status: 'ALIBI PROOF', color: 'emerald' },
                  { id: 'cam1', label: 'CAM 01: North Wing', status: 'Active', color: 'blue' },
                  { id: 'cam7', label: 'CAM 07: Server Room', status: 'OFFLINE', color: 'rose' },
                  { id: 'cam9', label: 'CAM 09: Breakroom', status: 'Active', color: 'amber' },
                ].map((cam) => {
                  const isActive = cctvActiveCam === cam.id;
                  return (
                    <button
                      key={cam.id}
                      onClick={() => {
                        sound.playUiClick();
                        setCctvActiveCam(cam.id as any);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold truncate">{cam.label}</div>
                      <div className="text-[9px] font-mono mt-0.5 text-slate-400">{cam.status}</div>
                    </button>
                  );
                })}
              </div>

              {/* Video Monitor Frame */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden space-y-3 font-mono text-xs">
                {/* Scanline overlay */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    REC FEED // {cctvActiveCam.toUpperCase()}
                  </span>
                  <span>18:35:00 - 18:45:00</span>
                </div>

                {cctvActiveCam === 'cam4' && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-sm">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      AIRTIGHT ALIBI: Agent Cyrus (Agent B)
                    </div>
                    <p className="text-slate-300 text-xs font-sans leading-relaxed">
                      Footage clearly shows <strong className="text-white font-bold">Agent Cyrus (Agent B)</strong> seated at Table 4 in the Cafeteria, drinking coffee in direct conversation with Commander Thorne continuously from <span className="text-emerald-400 font-bold">18:35 to 18:45</span>.
                    </p>
                    <div className="p-2 bg-emerald-900/30 rounded border border-emerald-600/40 text-[11px] text-emerald-200 font-sans">
                      ⚠️ <strong>MAJOR CONTRADICTION:</strong> Cyrus was physically in the cafeteria at 18:40! He could NOT have been at the Archive door. His badge was stolen or duplicated!
                    </div>
                  </div>
                )}

                {cctvActiveCam === 'cam1' && (
                  <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-2 text-slate-300 font-sans text-xs">
                    <div className="text-blue-400 font-bold font-mono">NORTH WING BRIEFING ROOM:</div>
                    <p>Agent Vance (Agent A) is giving a tactical briefing on projector from 18:35 to 18:50 to four cadets.</p>
                  </div>
                )}

                {cctvActiveCam === 'cam7' && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl space-y-2 text-slate-300 font-sans text-xs">
                    <div className="text-rose-400 font-bold font-mono">SERVER ROOM FEED DISRUPTED:</div>
                    <p>Feed cut to static at <strong className="text-white">18:40:15</strong> right after Agent Elena entered. Cutoff switch bypassed manually from the inside.</p>
                  </div>
                )}

                {cctvActiveCam === 'cam9' && (
                  <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-2 text-slate-300 font-sans text-xs">
                    <div className="text-amber-400 font-bold font-mono">RECREATION BREAKROOM:</div>
                    <p>Agent Kaelen (Agent D) is playing a timed chess match with Cadet Miller from 18:38 to 18:48.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Suspect Dossiers (West Desk) */}
        {objectData.type === 'evidence_suspect_dossiers' && (
          <div>
            {renderHeader('Suspect Case Dossiers', 'Personnel Background & Security Clearance', 'bg-indigo-600')}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[
                {
                  code: 'A',
                  name: 'Agent Vance (Agent A)',
                  role: 'Cyber Security Analyst',
                  alibi: 'Briefing cadets in North Wing (Confirmed by CAM 01)',
                  access: 'North Wing, Security Hub',
                  color: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
                },
                {
                  code: 'B',
                  name: 'Agent Cyrus (Agent B)',
                  role: 'Senior Cryptographer',
                  alibi: 'Cafeteria with Commander Thorne 18:35-18:45 (Confirmed by CAM 04)',
                  access: 'Archive Keycard (Card Stolen/Cloned)',
                  color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
                },
                {
                  code: 'C',
                  name: 'Agent Elena (Agent C)',
                  role: 'Quantum Systems Engineer',
                  alibi: 'Badged Server Room at 18:41. Claims server maintenance.',
                  access: 'Server Room, Sub-level conduit, Cloner tool',
                  color: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
                },
                {
                  code: 'D',
                  name: 'Agent Kaelen (Agent D)',
                  role: 'Tactical Recon Officer',
                  alibi: 'Playing chess in breakroom (Confirmed by CAM 09)',
                  access: 'Armory, Breakroom',
                  color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
                },
              ].map((s) => (
                <div key={s.code} className={`p-3 rounded-xl border ${s.color} space-y-1 text-xs`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      [{s.code}] {s.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">{s.role}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    <strong>Alibi:</strong> {s.alibi}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    <strong>Clearance:</strong> {s.access}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Forensic Crime Lab Analysis Desk */}
        {objectData.type === 'evidence_forensic_desk' && (
          <div>
            {renderHeader('Forensic Crime Lab Report', 'Physical Evidence & Chemical Spectroscopy', 'bg-emerald-600')}
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-3 font-mono">
                <div className="text-emerald-400 font-bold border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  SPECTRAL & CHEMICAL ANALYSIS REPORT #409
                </div>

                <div className="space-y-2 text-slate-300 text-[12px] font-sans">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold font-mono">ITEM 1: Archive Door Handle Smudge</span>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Tested positive for <strong className="text-cyan-300">Glycol Coolant SR-9</strong>. This coolant is exclusively utilized in the <strong className="text-white">Quantum Server Room</strong> cooling pipes.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-bold font-mono">ITEM 2: Server Room Camera Cutoff Wire</span>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Micro-latents recovered from the camera manual bypass switch match the biometric glove prints of <strong className="text-rose-300">Agent Elena (Agent C)</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs">
                <strong>Forensic Conclusion:</strong> Whoever entered the Archive was covered in Server Room Coolant and tampered with Camera 07 at 18:40.
              </div>
            </div>
          </div>
        )}

        {/* 6. Cork Evidence Pinboard */}
        {objectData.type === 'evidence_corkboard' && (
          <div>
            {renderHeader('Cork Evidence Board & Case Matrix', 'Interactive Case Clue Correlation', 'bg-amber-700')}
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-950/30 border border-amber-600/40 rounded-xl space-y-3 text-slate-200">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  📌 The Investigation Web
                </h4>
                <div className="space-y-2 text-[12px] leading-relaxed">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-700/40">
                    🔴 <strong>Door Log vs Alibi:</strong> Door says Agent B entered at 18:40, but Camera 04 proves Agent B was drinking coffee with the Commander.
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-700/40">
                    🔴 <strong>Server Room Connection:</strong> Agent C entered Server Room at 18:41. Camera 07 cut off. Archive handle has Server Room Coolant SR-9.
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-700/40">
                    🔴 <strong>Motive & Method:</strong> Agent C cloned Cyrus's badge, cut the server camera, ran through the conduit, and breached the Archive at 18:42!
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Ready to make your accusation? Head to the Central Verdict Table to submit the indictment and unlock the Evidence Drawer.
              </p>
            </div>
          </div>
        )}

        {/* 7. Master Case Verdict & Interrogation Console Table */}
        {objectData.type === 'evidence_case_verdict' && (
          <div>
            {renderHeader('Case Verdict & Indictment Console', 'Submit Final Case Assessment', 'bg-amber-600')}
            <div className="space-y-4">
              {!verdictSuccess ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Compare the security door log, CCTV alibis, and forensic reports to identify the guilty agent who breached the archive.
                  </p>

                  {/* Question 1: Prime Suspect */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>1. Identify Primary Culprit:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { code: 'A', name: 'Agent Vance (A)' },
                        { code: 'B', name: 'Agent Cyrus (B)' },
                        { code: 'C', name: 'Agent Elena (C)' },
                        { code: 'D', name: 'Agent Kaelen (D)' },
                      ].map((s) => (
                        <button
                          key={s.code}
                          onClick={() => handleSelectSuspect(s.code as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                            selectedSuspect === s.code
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question 2: Key Contradiction */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>2. Crucial Timeline Contradiction:</span>
                    </label>
                    <div className="space-y-1.5">
                      {[
                        {
                          id: 'cyrus_alibi',
                          text: 'Agent B was in Cafeteria (CAM 04) continuously 18:35-18:45 when badge was used at 18:40',
                        },
                        {
                          id: 'vance_briefing',
                          text: 'Agent A was giving tactical briefing in North Wing',
                        },
                        {
                          id: 'kaelen_chess',
                          text: 'Agent D was playing chess in the breakroom at 18:38',
                        },
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectContradiction(c.id)}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            selectedContradiction === c.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {c.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question 3: Physical Evidence Proof */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>3. Conclusive Physical Evidence:</span>
                    </label>
                    <div className="space-y-1.5">
                      {[
                        {
                          id: 'coolant_residue',
                          text: 'Server Room Coolant (Type SR-9) residue on Archive door handle & print on Camera 07 cutoff switch',
                        },
                        {
                          id: 'coffee_cup',
                          text: 'Empty coffee cup found in the tactical command lobby',
                        },
                        {
                          id: 'broken_pen',
                          text: 'Broken stylus found near the entrance security pod',
                        },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectEvidenceProof(p.id)}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                            selectedEvidenceProof === p.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {p.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {verdictError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{verdictError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitVerdict}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    Submit Case Indictment
                  </button>
                </>
              ) : (
                <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-2xl">
                    🏆
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white">CASE SOLVED! INDICTMENT ACCEPTED</h4>
                    <p className="text-xs text-emerald-300 leading-relaxed">
                      Agent Elena framed Cyrus with a cloned keycard, disabled the server camera, and breached the Restricted Archive!
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-xs text-slate-200">
                    📂 <strong>The Evidence Drawer is now unlocked!</strong> Open it to retrieve the Archive Key for Level 5.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. Locked Steel Evidence Drawer */}
        {objectData.type === 'evidence_locked_drawer' && (
          <div>
            {renderHeader('Locked Evidence Drawer / Safe', 'High-Security Biometric Evidence Locker', 'bg-slate-700')}
            <div className="space-y-4">
              {!drawerOpened ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    This reinforced drawer contains the Master Archive Key required to open the Level 5 Blast Door. It unlocks only when the Case Verdict has been officially filed.
                  </p>

                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className={`w-8 h-8 ${verdictSuccess ? 'text-emerald-400' : 'text-rose-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {verdictSuccess ? 'Locker Status: UNLATCHED' : 'Locker Status: BIOMETRICALLY LOCKED'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {verdictSuccess ? 'Ready to open' : 'Requires Case Verdict Indictment'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {verdictSuccess ? (
                    <button
                      onClick={handleOpenEvidenceDrawer}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      <span>Open Drawer & Take Archive Key</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                      ⚠️ Go to the Central Verdict Table to submit the correct suspect indictment first!
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Archive Key Acquired!
                    </h5>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Use the Archive Key at the South wall blast door to open Level 5.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. Level 5 Classified Archive Blast Door */}
        {objectData.type === 'level5_archive_door' && (
          <div>
            {renderHeader('Level 5 Classified Archive Blast Door', 'South Wall Heavy Vault Gateway', 'bg-amber-600')}
            <div className="space-y-4">
              {!archiveDoorUnlocked ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The Level 5 Restricted Archive blast door is secured with a heavy mechanical titanium lock. You must insert the <strong className="text-amber-400 font-bold">Classified Archive Key</strong> from the Evidence Drawer.
                  </p>

                  <div className="p-4 bg-slate-950/80 border border-amber-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-8 h-8 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {hasItem('archive_key') ? 'Key Available: Classified Archive Key' : 'Missing Required Key'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {hasItem('archive_key') ? 'Ready to insert key' : 'Recover Archive Key from Evidence Drawer'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUnlockArchiveDoor}
                    disabled={!hasItem('archive_key')}
                    className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                      hasItem('archive_key')
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white cursor-pointer shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Insert Archive Key & Open Blast Door</span>
                  </button>
                </>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Level 5 Blast Doors Unbolted!
                    </h5>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Walk physically through the doorway in the room to finish Level 4!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* LEVEL 5: THE LASER CORRIDOR (MOVEMENT & TIMING) MODAL VIEWS */}
        {/* ================================================================= */}

        {/* 10. Sector A Checkpoint Console & Laser Timing Diagnostics */}
        {objectData.type === 'laser_sub_terminal_alpha' && (
          <div>
            {renderHeader('Sector A Security Console', 'Respawn Beacon & Laser Rhythm Diagnostics', 'bg-emerald-600')}
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Welcome to the <strong>Sector A Safe Alcove</strong>. Linking with this console establishes your safe respawn coordinates in case you trip any downstream laser barriers.
              </p>

              {/* Checkpoint Status Card */}
              <div className="p-4 bg-slate-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checkpointASaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {checkpointASaved ? 'Sector A Checkpoint: LINKED & ACTIVE' : 'Sector A Checkpoint: UNLINKED'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Coordinates: [X: -6.0, Z: +7.5] (Safe Alcove)
                    </div>
                  </div>
                </div>
              </div>

              {!checkpointASaved ? (
                <button
                  onClick={handleSaveCheckpointA}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Activate Sector A Checkpoint (+50 Coins)</span>
                </button>
              ) : (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Checkpoint active. If tripped by a laser, you will respawn at this alcove.</span>
                </div>
              )}

              {/* Live Laser Diagnostic Readout */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Sector A Waveform Diagnostics</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Grid Freq: 432 MHz</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">Laser A1 (Horizontal Y-Sweep)</div>
                      <div className="text-[10px] text-slate-400">Sweeps height 0.4m to 1.4m (3.0s cycle)</div>
                    </div>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 font-mono text-[10px] rounded-lg border border-amber-500/40">
                      T = 3.0s
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">Laser A2 & A3 (Pulse Curtain)</div>
                      <div className="text-[10px] text-slate-400">Phase shift +1.2s delay between beams</div>
                    </div>
                    <span className="px-2 py-1 bg-rose-500/20 text-rose-300 font-mono text-[10px] rounded-lg border border-rose-500/40">
                      Phase: +1.2s
                    </span>
                  </div>
                </div>

                {/* Sub-Frequency Dial Calibration */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Harmonize Sub-Carrier:</span>
                    <span className="font-mono font-bold text-emerald-400">{sectorAFrequencyDial} MHz</span>
                  </div>
                  <input
                    type="range"
                    min="350"
                    max="500"
                    value={sectorAFrequencyDial}
                    onChange={(e) => {
                      sound.playUiClick();
                      setSectorAFrequencyDial(Number(e.target.value));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  {Math.abs(sectorAFrequencyDial - 432) <= 2 ? (
                    <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-[11px] text-emerald-300">
                      ✨ <strong>Harmonized!</strong> Sub-Carrier resonance confirms: Master Carrier = <strong>432 MHz</strong>, Waveform = <strong>SINE</strong>. Master Code Fragment 1: <strong>[ 8 9 _ _ ]</strong>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 text-center">
                      Slide dial to harmonize carrier frequency (~432 MHz) to reveal code fragment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. Sector B Frequency Relay Console & Keycard Download */}
        {objectData.type === 'laser_sub_terminal_beta' && (
          <div>
            {renderHeader('Sector B Relay Console', 'Substation Checkpoint & Phase Calibration', 'bg-blue-600')}
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You have reached the <strong>Sector B Power Substation (East Alcove)</strong>. Sector B features an alternating interlocking grid (Left and Right gates oscillate out-of-phase).
              </p>

              {/* Checkpoint Status Card */}
              <div className="p-4 bg-slate-950/80 border border-blue-500/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checkpointBSaved ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-slate-800 text-slate-400'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {checkpointBSaved ? 'Sector B Checkpoint: LINKED & ACTIVE' : 'Sector B Checkpoint: UNLINKED'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Coordinates: [X: +6.0, Z: -1.0] (East Relay)
                    </div>
                  </div>
                </div>
              </div>

              {!checkpointBSaved ? (
                <button
                  onClick={handleSaveCheckpointB}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Activate Sector B Checkpoint & Download Override Card (+50 Coins)</span>
                </button>
              ) : (
                <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Checkpoint active. Frequency Override Keycard loaded in your toolbelt!</span>
                </div>
              )}

              {/* Sector B Interlocking Rhythm Analysis */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Alternating Grid Phase Breakdown</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">Cycle: 2.6s</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">Gate 1 (Left Channel)</div>
                    <div className="text-emerald-400 font-bold text-xs">Safe: 0.0s – 1.3s</div>
                    <div className="text-rose-400 text-[10px]">Active: 1.3s – 2.6s</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">Gate 2 (Right Channel)</div>
                    <div className="text-rose-400 text-[10px]">Active: 0.0s – 1.3s</div>
                    <div className="text-emerald-400 font-bold text-xs">Safe: 1.3s – 2.6s</div>
                  </div>
                </div>

                <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl text-[11px] text-cyan-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Master Override Code Fragment 2:</span>
                  </div>
                  <p className="text-slate-300">
                    Phase synchronization delay is exactly <strong>1.3s</strong>. Decrypted Suffix: <strong>[ _ _ 4 2 ]</strong>. Full Master Code = <strong className="text-cyan-300">8942</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 12. Security Blueprint & Tactical Map Console */}
        {objectData.type === 'laser_clue_console' && (
          <div>
            {renderHeader('Corridor Security Blueprint', 'Tactical Architecture & Master Code Terminal', 'bg-amber-600')}
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Accessing high-level corridor schematics from the security terminal. Review the 40-meter corridor layout, safe dampeners, vent duct bypass, and master shutdown parameters.
              </p>

              {/* Visual Map Overview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  40M High-Voltage Security Grid Schematic
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                      S1
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">Sector A (Entrance to z = 6m)</div>
                      <div className="text-[11px] text-slate-400">Sweeping vertical Y-barriers and pulsing curtains. Safe alcove at X: -6.0.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                      S2
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">Sector B (z = 4m to z = -4m)</div>
                      <div className="text-[11px] text-slate-400">Interlocking alternating zig-zag gates (1.3s offset). Vent bypass on West side.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                      S3
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">Sector C (z = -5m to z = -13m)</div>
                      <div className="text-[11px] text-slate-400">Dynamic Z-oscillating scanner lasers with center stepping island.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                      ND
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">North Elevated Dais (z = -16m)</div>
                      <div className="text-[11px] text-slate-400">Master Control Console & Level 6 Protocol Heavy Vault Door.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Terminal Override Cheat Sheet */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-1.5 text-xs text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>Master Console Shutdown Blueprint Parameters:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-200">
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-amber-500/20">
                    Carrier: <strong className="text-amber-400">432 MHz (Sine)</strong>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-amber-500/20">
                    Pulse Delay: <strong className="text-amber-400">1.3s</strong>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-amber-500/20 col-span-2 text-center">
                    Master Protocol Code: <strong className="text-amber-400 text-sm">8 9 4 2</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 13. Master Laser Security Shutdown Console (North Dais) */}
        {objectData.type === 'laser_master_terminal' && (
          <div>
            {renderHeader('Master Security Terminal', '3-Phase Grid Deactivation & Level 6 Vault Disengage', 'bg-cyan-600')}
            <div className="space-y-4">
              {!masterTerminalSolved ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    You have breached the entire corridor and reached the North Control Dais! Execute the 3-phase security override sequence to permanently disable all corridor lasers and disengage the Level 6 Protocol Vault Door.
                  </p>

                  {/* Phase 1: Carrier Frequency Harmonization */}
                  <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Phase 1: Carrier Frequency & Waveform</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-200">{masterFreq} MHz</span>
                    </div>

                    <input
                      type="range"
                      min="350"
                      max="500"
                      value={masterFreq}
                      onChange={(e) => {
                        sound.playUiClick();
                        setMasterFreq(Number(e.target.value));
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />

                    {/* Waveform Selector */}
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      {(['sawtooth', 'square', 'triangle', 'sine'] as const).map((wave) => (
                        <button
                          key={wave}
                          onClick={() => {
                            sound.playUiClick();
                            setMasterWaveform(wave);
                          }}
                          className={`py-1.5 px-2 rounded-xl text-center capitalize text-[11px] font-bold transition-all ${
                            masterWaveform === wave
                              ? 'bg-cyan-600 text-white shadow border border-cyan-400'
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {wave}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phase 2: Pulse Delay Synchronization */}
                  <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Phase 2: Phase Delay Offset</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-200">{masterPulseDelay.toFixed(1)}s</span>
                    </div>

                    <input
                      type="range"
                      min="0.1"
                      max="2.5"
                      step="0.1"
                      value={masterPulseDelay}
                      onChange={(e) => {
                        sound.playUiClick();
                        setMasterPulseDelay(Number(e.target.value));
                      }}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Phase 3: Master Protocol Code Keypad */}
                  <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-400 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        <span>Phase 3: Master Protocol Code</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">4-Digit Override</span>
                    </div>

                    {/* Display */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono font-black text-xl tracking-widest text-cyan-300">
                      {masterPasscode.padEnd(4, '•')}
                    </div>

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            if (d === 'C') handleMasterKeypadClear();
                            else if (d === '⌫') {
                              sound.playUiClick();
                              setMasterPasscode((prev) => prev.slice(0, -1));
                            } else {
                              handleMasterKeypadDigit(d);
                            }
                          }}
                          className="py-2.5 bg-slate-950 hover:bg-slate-800 active:bg-cyan-950 text-slate-100 font-mono font-bold text-sm rounded-xl border border-slate-800 shadow transition-all active:scale-95"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {masterTerminalError && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{masterTerminalError}</span>
                    </div>
                  )}

                  {/* Execute Button */}
                  <button
                    onClick={handleExecuteMasterShutdown}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-cyan-500/30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ZapOff className="w-4 h-4" />
                    <span>DEACTIVATE CORRIDOR LASERS & UNLOCK LEVEL 6</span>
                  </button>
                </>
              ) : (
                <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-3xl">
                    ⚡
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white">CORRIDOR SECURITY OVERRIDDEN!</h4>
                    <p className="text-xs text-emerald-300 leading-relaxed">
                      All oscillating high-voltage laser barriers are now neutralized. The Level 6 Protocol Vault Door on the North wall is unlatched!
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 text-xs text-slate-200">
                    🚪 <strong>Walk physically through the Level 6 doorway</strong> behind the dais to complete Level 5!
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 15. Search Maze: Level 1 — BFS Command Terminal */}
        {(objectData.id === 'bfs_console_l1' || objectData.id === 'bfs_target_node') && (
          <div>
            {renderHeader(
              'Search Maze — Level 1: First Search',
              'Breadth-First Search (BFS) Frontier Terminal',
              'bg-cyan-600'
            )}
            <div className="space-y-4">
              {/* Mission Banner */}
              <div className="p-3.5 bg-cyan-950/80 border border-cyan-500/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-xs tracking-wider">
                    <Compass className="w-4 h-4" />
                    <span>MISSION 01: FIND THE TARGET</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    UNINFORMED SEARCH
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                  Reach the <span className="text-rose-400 font-bold">red target [G]</span> using the shortest possible route.
                </p>
              </div>

              {/* Concept Explainer: What is BFS? */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Lightbulb className="w-4 h-4" />
                  <span>Concept: What is BFS?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-cyan-300">Breadth-First Search (BFS)</strong> is an uninformed graph traversal algorithm that explores all neighbor nodes at the current depth level before moving deeper. Using a <strong className="text-emerald-300">First-In, First-Out (FIFO) queue</strong>, BFS guarantees finding the <strong className="text-amber-300">shortest path</strong> in any unweighted maze!
                </p>
              </div>

              {/* Visual Maze Grid Representation */}
              <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>MAZE GRAPH MATRIX</span>
                  <span className="text-cyan-400 font-bold">
                    Layer Depth: {bfsCurrentStep === 0 ? 'Depth 0 (Start)' : bfsCurrentStep === 1 ? 'Depth 1 (Neighbours)' : bfsCurrentStep === 2 ? 'Depth 2 (Frontier)' : 'Depth 3 (Target Found!)'}
                  </span>
                </div>

                {/* 2D ASCII & Interactive Cell Grid */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-center">
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {/* Row 0: S -> N1 -> N3 */}
                    <div
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        bfsCurrentStep >= 0
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="text-[10px] text-cyan-400">START</div>
                      <div>S</div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        bfsCurrentStep >= 1
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="text-[10px] text-amber-400">DEPTH 1</div>
                      <div>□ (N1)</div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        bfsCurrentStep >= 2
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="text-[10px] text-emerald-400">DEPTH 2</div>
                      <div>□ (N3)</div>
                    </div>

                    {/* Row 1: N2 -> N4 -> TARGET G */}
                    <div
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        bfsCurrentStep >= 1
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="text-[10px] text-amber-400">DEPTH 1</div>
                      <div>□ (N2)</div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        bfsCurrentStep >= 2
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="text-[10px] text-emerald-400">DEPTH 2</div>
                      <div>□ (N4)</div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        bfsCurrentStep >= 3
                          ? 'bg-rose-600/40 border-rose-400 text-rose-200 shadow-lg shadow-rose-500/30 animate-pulse ring-2 ring-rose-400'
                          : 'bg-slate-800 border-slate-700 text-rose-400/60'
                      }`}
                    >
                      <div className="text-[10px] text-rose-400">TARGET</div>
                      <div>G (RED)</div>
                    </div>
                  </div>
                </div>

                {/* Live Layer by Layer Expansion Breadcrumb */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 mb-2">BFS EXPLORATION PROGRESSION:</div>
                  <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                    <div className={`flex items-center gap-2 ${bfsCurrentStep >= 0 ? 'text-cyan-300 font-bold' : 'text-slate-600'}`}>
                      <span className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px]">0</span>
                      <span>Start Node [S]</span>
                    </div>
                    <div className={`flex items-center gap-2 ${bfsCurrentStep >= 1 ? 'text-amber-300 font-bold' : 'text-slate-600'}`}>
                      <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px]">1</span>
                      <span>Level 1 neighbours (N1, N2)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${bfsCurrentStep >= 2 ? 'text-emerald-300 font-bold' : 'text-slate-600'}`}>
                      <span className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">2</span>
                      <span>Level 2 neighbours (N3, N4, N5)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${bfsCurrentStep >= 3 ? 'text-rose-300 font-bold animate-bounce' : 'text-slate-600'}`}>
                      <span className="w-5 h-5 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[10px]">3</span>
                      <span>Target Node [G] Reached!</span>
                    </div>
                  </div>
                </div>

                {/* Live FIFO Queue & Visited State Display */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-cyan-400 block font-bold">FIFO QUEUE (Frontier):</span>
                    <span className="text-slate-200 text-[11px]">
                      {bfsCurrentStep === 0 && '[ S ]'}
                      {bfsCurrentStep === 1 && '[ N1, N2 ]'}
                      {bfsCurrentStep === 2 && '[ N3, N4, N5 ]'}
                      {bfsCurrentStep >= 3 && '[ G (Target) ]'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 block font-bold">EXPLORED NODES:</span>
                    <span className="text-emerald-300 font-bold text-[11px]">
                      {bfsCurrentStep === 0 && '1 / 8 nodes'}
                      {bfsCurrentStep === 1 && '3 / 8 nodes'}
                      {bfsCurrentStep === 2 && '6 / 8 nodes'}
                      {bfsCurrentStep >= 3 && '8 / 8 nodes'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Box / Stats */}
              {bfsTargetFound ? (
                <div className="p-4 bg-emerald-950/70 border border-emerald-500 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-emerald-200">TARGET FOUND!</h4>
                      <p className="text-xs text-emerald-300 font-mono">
                        BFS explored <strong>8 nodes</strong>.
                      </p>
                      <p className="text-xs text-emerald-300 font-mono">
                        Shortest path: <strong>4 moves</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-lg border border-emerald-500/40 text-xs font-mono text-emerald-300">
                    <span>Path: S → (0,4) → (0,0) → G</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>The exit opens → Level 2 Gateway Unlocked!</span>
                  </div>
                </div>
              ) : null}

              {/* Interactive Action Controls */}
              <div className="flex items-center gap-2 pt-1">
                {!bfsTargetFound ? (
                  <>
                    <button
                      onClick={() => {
                        if (bfsIsRunning) return;
                        sound.playKeypadBeep(520);
                        setBfsIsRunning(true);

                        let step = bfsCurrentStep;
                        const interval = setInterval(() => {
                          step++;
                          setBfsCurrentStep(step);
                          if (step === 1) {
                            sound.playKeypadBeep(640);
                            setBfsExploredCount(3);
                          } else if (step === 2) {
                            sound.playKeypadBeep(760);
                            setBfsExploredCount(6);
                          } else if (step >= 3) {
                            clearInterval(interval);
                            setBfsIsRunning(false);
                            setBfsTargetFound(true);
                            setBfsExploredCount(8);
                            setBfsShortestMoves(4);
                            sound.playAccessGranted();
                            sound.playUnlock();
                            onSolvePuzzle('bfsTargetFound', {
                              id: 'bfs_queue_key',
                              name: 'FIFO Frontier Clearance Key',
                              description: 'Cryptographic key awarded for finding the Red Target with BFS shortest path.',
                              icon: '🧭',
                              usable: true,
                            }, 100);
                          }
                        }, 700);
                      }}
                      disabled={bfsIsRunning}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{bfsIsRunning ? 'Exploring Layers...' : '▶ Start BFS Search'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (bfsCurrentStep < 3) {
                          const nextStep = bfsCurrentStep + 1;
                          setBfsCurrentStep(nextStep);
                          sound.playKeypadBeep(500 + nextStep * 120);
                          if (nextStep === 1) setBfsExploredCount(3);
                          if (nextStep === 2) setBfsExploredCount(6);
                          if (nextStep === 3) {
                            setBfsTargetFound(true);
                            setBfsExploredCount(8);
                            setBfsShortestMoves(4);
                            sound.playAccessGranted();
                            sound.playUnlock();
                            onSolvePuzzle('bfsTargetFound', {
                              id: 'bfs_queue_key',
                              name: 'FIFO Frontier Clearance Key',
                              description: 'Cryptographic key awarded for finding the Red Target with BFS shortest path.',
                              icon: '🧭',
                              usable: true,
                            }, 100);
                          }
                        }
                      }}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                    >
                      <span>⏭ Step</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playUiClick();
                        setBfsCurrentStep(0);
                        setBfsExploredCount(1);
                      }}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
                      title="Reset BFS"
                    >
                      <span>🔄</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      sound.playDoorOpen();
                      onClose();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
                  >
                    <span>🚪 Proceed to Level 2 Exit Gateway</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 16. Search Maze: Level 1 Exit Door */}
        {objectData.id === 'bfs_exit_door' && (
          <div>
            {renderHeader('Quantum Transit Gateway', 'North Exit to Level 2', 'bg-emerald-600')}
            <div className="space-y-4">
              {!bfsTargetFound ? (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The Quantum Transit Gateway to Level 2 is locked. You must execute Breadth-First Search (BFS) at the Command Terminal to find the <span className="text-rose-400 font-bold">Red Target [G]</span> and calculate the shortest path.
                  </p>

                  <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-8 h-8 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Gateway Status: QUEUE LOCK ACTIVE
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Requires finding Target Node G via BFS
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-xs text-cyan-300">
                    🧭 Head to the BFS Command Terminal at the west console to start BFS layer-by-layer exploration!
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-950/70 border border-emerald-500 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h5 className="text-sm font-bold text-emerald-200">
                        TARGET FOUND! Level 2 Exit Gateway Open!
                      </h5>
                      <p className="text-xs text-emerald-300 font-mono mt-0.5">
                        BFS explored 8 nodes. Shortest path: 4 moves.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playDoorOpen();
                      sound.playAccessGranted();
                      onSolvePuzzle('searchMazeLevel1Solved', undefined, 100);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>🚪 Enter Level 2: Frontier Expansion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 14. Level 6 Protocol Heavy Security Vault Door */}
        {objectData.type === 'level6_vault_door' && (
          <div>
            {renderHeader('Level 6 Protocol Heavy Vault Door', 'North Security Exit Portal', 'bg-red-600')}
            <div className="space-y-4">
              {!masterTerminalSolved ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    The Level 6 Protocol Door is electromagnetically locked. The heavy titanium sliding doors are interlocked with the active corridor laser grid.
                  </p>

                  <div className="p-4 bg-slate-950/80 border border-rose-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-8 h-8 text-rose-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          Door Status: ELECTROMAGNETICALLY LOCKED
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Requires Master Terminal security shutdown at the North Dais
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                    ⚠️ Access the Master Security Terminal directly in front of this door on the dais to execute the 3-phase shutdown!
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                    <div>
                      <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                        Level 6 Protocol Vault Door Unlatched!
                      </h5>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        The heavy blast doors have parted. The green Level 6 Extraction Corridor is wide open.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playDoorOpen();
                      sound.playAccessGranted();
                      onSolvePuzzle('level6DoorOpened', undefined, 100);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>🚪 Step Through Level 6 Gateway</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback for unhandled object types */}
        {![
          'fragment_a', 'fragment_b', 'fragment_c', 'fragment_d', 'security_console', 'level2_security_door',
          'pattern_panel_1', 'pattern_panel_2', 'pattern_panel_3', 'pattern_panel_final', 'level3_pattern_door',
          'memory_central_display', 'level4_memory_door',
          'evidence_security_terminal', 'evidence_badge_reader_log', 'evidence_cctv_monitor', 'evidence_corkboard', 'evidence_forensic_desk', 'evidence_suspect_dossiers', 'evidence_case_verdict', 'level5_door',
          'laser_checkpoint_a', 'laser_checkpoint_b', 'laser_master_terminal', 'laser_protocol_door'
        ].includes(objectData.type as string) && (
          <div>
            {renderHeader(objectData.name || 'Object Info', objectData.prompt || 'Environment Marker', 'bg-slate-700')}
            <div className="space-y-4 py-3">
              <p className="text-sm text-slate-300">
                {objectData.clueText || 'Physical marker in the room. Walk over or step onto it to trigger.'}
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

