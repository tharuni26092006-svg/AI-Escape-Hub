import React, { useState } from 'react';
import {
  Home,
  Search,
  Trophy,
  User as UserIcon,
  Settings,
  Play,
  Gift,
  Check,
  Palette,
  Volume2,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Shirt,
  Sparkle,
  Trash2,
} from 'lucide-react';
import { sound } from '../services/soundEngine';
import { authService } from '../services/authService';
import { UserAccount, LevelId, HubTab, ArenaItem, GameId } from '../types';
import { ARENAS_DATA, BADGES_DATA } from '../game/arenasData';
import { AvatarFigurePreview } from './AvatarFigurePreview';
import { HAIR_STYLES, FACES_CATALOG, SHIRT_PATTERNS, PANTS_PATTERNS, HATS_CATALOG } from '../game/catalog';

interface HomeHubProps {
  user: UserAccount;
  onStartGame: (levelId: LevelId, gameId?: GameId) => void;
  onOpenAvatarStudio: () => void;
  onSignOut: () => void;
  onUserUpdated: (user: UserAccount) => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  user,
  onStartGame,
  onOpenAvatarStudio,
  onSignOut,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [achievementSubTab, setAchievementSubTab] = useState<'leaderboard' | 'badges'>('leaderboard');
  const [claimedReward, setClaimedReward] = useState<boolean>(user.claimedDailyReward || false);
  const [timeUntilNextReward, setTimeUntilNextReward] = useState<string>('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(user.theme || 'light');
  const [soundEffects, setSoundEffects] = useState<boolean>(user.soundEffectsEnabled ?? true);
  const [ambientSound, setAmbientSound] = useState<boolean>(user.ambientSoundEnabled ?? true);

  // 24-Hour countdown effect
  React.useEffect(() => {
    const updateCountdown = () => {
      if (!user.lastDailyRewardTimestamp) {
        setTimeUntilNextReward('');
        return;
      }
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - user.lastDailyRewardTimestamp;
      if (elapsed >= TWENTY_FOUR_HOURS_MS) {
        setClaimedReward(false);
        setTimeUntilNextReward('');
      } else {
        setClaimedReward(true);
        const remMs = TWENTY_FOUR_HOURS_MS - elapsed;
        const hours = Math.floor(remMs / (1000 * 60 * 60));
        const mins = Math.floor((remMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remMs % (1000 * 60)) / 1000);
        setTimeUntilNextReward(`${hours}h ${mins}m ${secs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user.lastDailyRewardTimestamp]);

  const handleClaimReward = () => {
    sound.playGem();
    const res = authService.claimDailyReward();
    if (res.success && res.user) {
      setClaimedReward(true);
      onUserUpdated({ ...res.user });
    }
  };

  const handleLaunchArena = (arena: ArenaItem) => {
    sound.playKeyPickup();
    const gameId = arena.id as GameId;
    if (gameId === 'search_maze') {
      onStartGame(1, 'search_maze');
    } else if (gameId === 'heuristic_chamber') {
      onStartGame(1, 'heuristic_chamber');
    } else {
      onStartGame(arena.mapLevelId, 'agent_academy');
    }
  };

  const filteredArenas = ARENAS_DATA.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q) ||
      a.tag.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-200 select-none pb-20 ${
      themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* 1. TOP HEADER BAR */}
      <header className={`sticky top-0 z-30 px-4 sm:px-8 py-3.5 border-b backdrop-blur-md transition-colors ${
        themeMode === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md font-black text-sm">
              AI
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              AI Escape Hub
            </h1>
          </div>

          {/* User Currency & Profile Pills */}
          <div className="flex items-center gap-2.5">
            {/* Coins pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100/90 text-amber-900 rounded-full font-bold text-xs shadow-sm border border-amber-200">
              <span>🪙</span>
              <span>{user.coins} Coins</span>
            </div>

            {/* Profile Avatar Button, Settings & Quick Sign Out */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('profile');
                }}
                className="w-9 h-9 rounded-full bg-slate-100 border-2 border-blue-500 overflow-hidden flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                title={`Profile (${user.username})`}
              >
                <AvatarFigurePreview avatar={user.avatar} size="icon" />
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('settings');
                }}
                className={`p-2 rounded-xl border transition-all ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
                }`}
                title="Settings (Audio, Theme, & Account)"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  onSignOut();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN TAB CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* --- TAB: HOME --- */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search input bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Arenas, Units, or Algorithms..."
                className={`w-full px-5 py-3.5 pl-11 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Greeting Card with Mini Avatar */}
            <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm flex items-center justify-between flex-wrap gap-4 ${
              themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
            }`}>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => {
                    sound.playUiClick();
                    setActiveTab('profile');
                  }}
                  className="w-16 h-20 rounded-2xl bg-gradient-to-b from-blue-50/90 to-indigo-50/70 border-2 border-blue-200/80 flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 transition-transform overflow-hidden relative group p-1 shrink-0"
                  title="Profile"
                >
                  <AvatarFigurePreview avatar={user.avatar} size="mini" />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Hello, {user.name || user.username}!
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-200/80">
                      <span>🪙</span>
                      <span>{user.coins} Coins</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMMENDED FOR YOU Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl">
              {/* Background Shapes */}
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-8xl opacity-20 pointer-events-none hidden md:block">
                📡
              </div>

              <div className="relative z-10 max-w-xl space-y-3">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-wider uppercase text-white">
                  RECOMMENDED FOR YOU
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Agent Academy
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-blue-100">
                  Goal-Based Intelligent Agent
                </p>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Step into the Academy and align sensor registers to escape using reflex goal predicates.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => handleLaunchArena(ARENAS_DATA[0])}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Play Now</span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Reward Banner with 24-hr status */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 border border-amber-300/80 shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/80 flex items-center justify-center text-xl shadow-inner">
                  🎁
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-950">Daily Reward (Every 24 Hours)</h4>
                  <p className="text-[11px] sm:text-xs text-amber-900 font-medium">
                    {claimedReward && timeUntilNextReward
                      ? `Claimed! Next reward available in ${timeUntilNextReward}`
                      : 'Claim your +50 Coins today!'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClaimReward}
                disabled={claimedReward}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 ${
                  claimedReward
                    ? 'bg-amber-800/80 text-amber-100 cursor-not-allowed border border-amber-700/50'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white active:scale-95 cursor-pointer'
                }`}
              >
                {claimedReward ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{timeUntilNextReward ? `Available in ${timeUntilNextReward}` : 'Claimed (24h)'}</span>
                  </>
                ) : (
                  <span>Claim +50 Coins</span>
                )}
              </button>
            </div>

            {/* Featured Arenas Section */}
            <div className="space-y-3">
              <h3 className={`text-base font-black tracking-tight ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Featured Arenas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredArenas.map((arena) => (
                  <ArenaCard key={arena.id} arena={arena} onPlay={() => handleLaunchArena(arena)} themeMode={themeMode} />
                ))}
              </div>
            </div>

            {/* Trending Arenas Section */}
            <div className="space-y-3 pt-2">
              <h3 className={`text-base font-black tracking-tight ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Trending Arenas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredArenas.slice(1, 5).map((arena) => (
                  <ArenaCard key={`trending_${arena.id}`} arena={arena} onPlay={() => handleLaunchArena(arena)} themeMode={themeMode} />
                ))}
              </div>
            </div>

            {/* Recommended Games Section */}
            <div className="space-y-3 pt-2">
              <h3 className={`text-base font-black tracking-tight ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Recommended Games
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[filteredArenas[0], filteredArenas[5], filteredArenas[6], filteredArenas[4]].filter(Boolean).map((arena) => (
                  <ArenaCard key={`rec_${arena.id}`} arena={arena} onPlay={() => handleLaunchArena(arena)} themeMode={themeMode} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: SEARCH --- */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter games search bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter games..."
                autoFocus
                className={`w-full px-5 py-3.5 pl-11 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArenas.map((arena) => (
                <ArenaCard key={`search_${arena.id}`} arena={arena} onPlay={() => handleLaunchArena(arena)} themeMode={themeMode} />
              ))}
            </div>

            {filteredArenas.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                No escape arenas matched "{searchQuery}". Try another keyword!
              </div>
            )}
          </div>
        )}

        {/* --- TAB: ACHIEVEMENTS & LEADERBOARD --- */}
        {activeTab === 'achievements' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Leaderboard & Badges</h2>
            </div>

            {/* Sub-tab pills: Global Rankings | Your Badges */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setAchievementSubTab('leaderboard');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  achievementSubTab === 'leaderboard'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Global Rankings
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  setAchievementSubTab('badges');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  achievementSubTab === 'badges'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Your Badges
              </button>
            </div>

            {achievementSubTab === 'leaderboard' && (
              <div className={`rounded-3xl border shadow-sm overflow-hidden ${
                themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">RANK</th>
                      <th className="py-3 px-4">PLAYER</th>
                      <th className="py-3 px-4">LEVEL</th>
                      <th className="py-3 px-4">XP</th>
                      <th className="py-3 px-4">CLEARED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 font-bold text-slate-800">
                      <td className="py-3.5 px-4 text-blue-600 font-black">#1</td>
                      <td className="py-3.5 px-4 flex items-center gap-2">
                        <span>{user.gender === 'female' ? '👩' : '👨'}</span>
                        <span>{user.username}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-mono">
                          YOU
                        </span>
                      </td>
                      <td className="py-3.5 px-4">LV {user.level}</td>
                      <td className="py-3.5 px-4">{user.xp} XP</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {user.levelsCompleted.length} {user.levelsCompleted.length === 1 ? 'Arena' : 'Arenas'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 text-slate-700">
                      <td className="py-3.5 px-4 font-black">#2</td>
                      <td className="py-3.5 px-4 flex items-center gap-2">
                        <span>👨</span>
                        <span>Alex_Explorer</span>
                      </td>
                      <td className="py-3.5 px-4">LV 1</td>
                      <td className="py-3.5 px-4">0 XP</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">0 Arenas</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 text-slate-700">
                      <td className="py-3.5 px-4 font-black">#3</td>
                      <td className="py-3.5 px-4 flex items-center gap-2">
                        <span>🤖</span>
                        <span>Bot_Escapee</span>
                      </td>
                      <td className="py-3.5 px-4">LV 1</td>
                      <td className="py-3.5 px-4">0 XP</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">0 Arenas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {achievementSubTab === 'badges' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BADGES_DATA.map((b) => {
                  const isUnlocked = user.badges?.includes(b.id) || user.badges?.includes(b.name);
                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                        isUnlocked
                          ? 'bg-white border-blue-300 shadow-md ring-1 ring-blue-400/30'
                          : 'bg-slate-100/80 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="text-3xl">{b.icon}</div>
                      <div className="text-xs font-black text-slate-800 flex items-center justify-center gap-1">
                        <span>{b.name}</span>
                        {!isUnlocked && <span className="text-[10px] text-slate-400">🔒</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">{b.description}</div>
                      <div className="pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isUnlocked
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isUnlocked ? '✓ Unlocked' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: PROFILE --- */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            {/* User Profile Card with Real Avatar Figure */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6 ${
              themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {/* Full Interactive Avatar Display Card */}
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => {
                    sound.playUiClick();
                    onOpenAvatarStudio();
                  }}
                  className="w-32 h-44 rounded-3xl bg-gradient-to-b from-blue-50/80 via-indigo-50/50 to-slate-100 border-2 border-blue-400/40 flex items-center justify-center shadow-lg relative group cursor-pointer overflow-hidden p-2"
                  title="Click to Open Avatar Studio"
                >
                  <AvatarFigurePreview avatar={user.avatar} size="sm" animate={true} />
                  
                  <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-2">
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-black shadow-md flex items-center gap-1">
                      <Palette className="w-2.5 h-2.5" /> Edit
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {user.avatar.gender === 'female' ? 'Female Avatar' : 'Male Avatar'}
                </span>
              </div>

              <div className="flex-1 text-center md:text-left space-y-3 w-full">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {user.name || user.username}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-black border border-blue-200">
                      Explorer #{user.id.slice(0, 4)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    Level {user.level} Escape Master & Room Solver
                  </p>
                </div>

                {/* Equipped Cosmetics Summary */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200/80">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: user.avatar.skinColor || '#FFFFFF' }} />
                    Skin: {user.avatar.skinColor === '#FFFFFF' ? 'Porcelain' : user.avatar.skinColor === '#FFD700' ? 'Classic Gold' : 'Tone'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200/80">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: user.avatar.hairColor || '#18181b' }} />
                    Hair: {HAIR_STYLES.find((h) => h.id === user.avatar.hair)?.name || 'Custom'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200/80">
                    <Shirt className="w-3 h-3 text-teal-600" />
                    Top: {SHIRT_PATTERNS.find((s) => s.id === user.avatar.shirtPattern)?.name || 'Custom'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200/80">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Bottom: {PANTS_PATTERNS.find((p) => p.id === user.avatar.pantsPattern)?.name || 'Custom'}
                  </span>
                  {user.avatar.hat && user.avatar.hat !== 'none' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-bold border border-amber-200/80">
                      Hat: {HATS_CATALOG.find((h) => h.id === user.avatar.hat)?.name || 'Gear'}
                    </span>
                  )}
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>XP Progress:</span>
                    <span>{user.xp} / 100 XP</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (user.xp / 100) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <button
                    onClick={() => {
                      sound.playUiClick();
                      onOpenAvatarStudio();
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Customize Avatar & Gear</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playUiClick();
                      setActiveTab('settings');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playUiClick();
                      onSignOut();
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-xl font-black text-xs border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                      {user.levelsCompleted.length} Levels Cleared
                    </span>
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
                      🪙 {user.coins} Coins
                    </span>
                    <span className="px-3 py-1.5 bg-purple-50 text-purple-900 rounded-xl border border-purple-200">
                      🏆 {user.badges?.length || 0} Badges
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Character Inventory section */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Character Inventory
              </h3>

              {user.levelsCompleted.length === 0 ? (
                <div className={`p-8 rounded-3xl border border-dashed text-center space-y-3 ${
                  themeMode === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="text-4xl">🎒</div>
                  <h4 className="text-sm font-black text-slate-800">Your Inventory is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't collected any escape artifacts yet. Complete AI Escape Arenas to discover rare Master Keys, UV Torches, and Quantum Cores!
                  </p>
                  <button
                    onClick={() => {
                      sound.playUiClick();
                      setActiveTab('home');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95"
                  >
                    Explore Arenas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {user.levelsCompleted.includes(1) && (
                    <div className="p-4 rounded-2xl border bg-white border-slate-200 text-center space-y-1 shadow-sm">
                      <div className="text-3xl">🔑</div>
                      <div className="text-xs font-black text-slate-800">Brass Master Key</div>
                      <div className="text-[10px] text-slate-500">Agent Academy</div>
                    </div>
                  )}
                  {user.levelsCompleted.includes(2) && (
                    <>
                      <div className="p-4 rounded-2xl border bg-white border-slate-200 text-center space-y-1 shadow-sm">
                        <div className="text-3xl">🔦</div>
                        <div className="text-xs font-black text-slate-800">UV Luminescence Torch</div>
                        <div className="text-[10px] text-slate-500">Search Maze</div>
                      </div>
                      <div className="p-4 rounded-2xl border bg-white border-slate-200 text-center space-y-1 shadow-sm">
                        <div className="text-3xl">⚡</div>
                        <div className="text-xs font-black text-slate-800">Quantum Cryo Fuse</div>
                        <div className="text-[10px] text-slate-500">Cyber Facility</div>
                      </div>
                    </>
                  )}
                  {user.levelsCompleted.includes(3) && (
                    <div className="p-4 rounded-2xl border bg-white border-slate-200 text-center space-y-1 shadow-sm">
                      <div className="text-3xl">🏺</div>
                      <div className="text-xs font-black text-slate-800">Scarab Sun Sigil</div>
                      <div className="text-[10px] text-slate-500">Heuristic Chamber</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn max-w-xl mx-auto">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Settings</h2>
            </div>

            <div className={`p-6 rounded-3xl border shadow-sm space-y-6 ${
              themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {/* Sound Effects toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Sound Effects</h4>
                  <p className="text-[11px] text-slate-500">Play SFX when unlocking panels and completing levels</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundEffects;
                    setSoundEffects(next);
                    sound.setVolumes(next ? 0.7 : 0, ambientSound ? 0.4 : 0);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    soundEffects ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                      soundEffects ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Ambient Soundtracks toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Ambient Soundtracks</h4>
                  <p className="text-[11px] text-slate-500">Synthesizer-generated background mood tracks</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !ambientSound;
                    setAmbientSound(next);
                    if (next) sound.startBGM();
                    else sound.stopBGM();
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    ambientSound ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                      ambientSound ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Visual theme segmented toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Visual theme</h4>
                  <p className="text-[11px] text-slate-500">Switch between light and dark UI modes</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                      themeMode === 'light'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                      themeMode === 'dark'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Log Out & Clear Database buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    sound.playUiClick();
                    onSignOut();
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                <button
                  onClick={() => {
                    sound.playUiClick();
                    authService.clearAllData();
                    onSignOut();
                  }}
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-xl border border-red-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  title="Clear all stored registered accounts and reset completely"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Clear All DB / Reset App</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM NAVIGATION BAR */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t py-2 px-4 backdrop-blur-lg shadow-2xl transition-colors ${
        themeMode === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-lg mx-auto flex items-center justify-between text-xs font-bold px-2">
          {/* 1. Home */}
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('home');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-blue-600 scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* 2. Search */}
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('search');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'text-blue-600 scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Discover</span>
          </button>

          {/* 3. Center Avatar Customizer Button (Roblox Style) */}
          <button
            onClick={() => {
              sound.playKeyPickup();
              onOpenAvatarStudio();
            }}
            className="flex flex-col items-center gap-0.5 py-0.5 px-3 rounded-2xl bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition-all cursor-pointer active:scale-95 -mt-3 shadow-md border border-blue-500/30"
          >
            <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-600 overflow-hidden flex items-center justify-center shadow-sm">
              <AvatarFigurePreview avatar={user.avatar} size="icon" />
            </div>
            <span className="text-[10px] font-black">Avatar</span>
          </button>

          {/* 5. Badges */}
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('achievements');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'text-blue-600 scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">Badges</span>
          </button>

          {/* 6. Settings */}
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('settings');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-blue-600 scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>

          {/* 7. Profile */}
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-blue-600 scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Sub-component for Arena Cards matching video frame 00:30 - 00:40
interface ArenaCardProps {
  arena: ArenaItem;
  onPlay: () => void;
  themeMode: 'light' | 'dark';
}

const ArenaCard: React.FC<ArenaCardProps> = ({ arena, onPlay, themeMode }) => {
  return (
    <div
      className={`rounded-3xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 ${
        themeMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header Visual Box with Icon Glow */}
      <div
        className={`h-28 sm:h-32 bg-gradient-to-br ${arena.colorGradient} flex items-center justify-center text-white relative overflow-hidden p-4`}
      >
        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
          <span className="text-2xl sm:text-3xl drop-shadow-md">{arena.iconSymbol}</span>
        </div>
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            {arena.tag}
          </span>
          <h4
            className={`text-sm sm:text-base font-black tracking-tight leading-tight ${
              themeMode === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            {arena.title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 font-medium">
            {arena.subtitle}
          </p>
        </div>

        {/* Level and Difficulty Badge with Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-0.5 rounded-md font-black text-[10px] ${
                arena.difficulty === 'EASY'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : arena.difficulty === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {arena.difficulty}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {arena.level}
            </span>
          </div>
          {/* Progress track */}
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-[10%]" />
          </div>
        </div>

        {/* Play Button */}
        <div className="pt-2">
          <button
            onClick={onPlay}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>Play</span>
            <Play className="w-3 h-3 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
