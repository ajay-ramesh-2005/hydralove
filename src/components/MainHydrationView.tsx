import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile, HydrationEntry, EmotionState } from '../types';
import { KawaiiGarden } from './KawaiiGarden';
import { formatMlToLiters } from '../utils/hydrationGoal';
import { getRandomMotivationalMessage, getEmotionMessage } from '../utils/motivationalMessages';
import { playSplashSound, playTapSound, playMilestoneSound, playCelebrationSound } from '../utils/soundEffects';
import { Heart, Settings, Plus, Trash2, History, Sparkles, Droplets } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MainHydrationViewProps {
  activeProfile: UserProfile;
  allProfiles: UserProfile[];
  myUserId: string;
  entries: HydrationEntry[];
  onAddWater: (amountMl: number) => void;
  onDeleteEntry: (entryId: string) => void;
  onSwitchProfile: (userId: string) => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onSendHeartNotification: (targetUserId: string, message: string) => Promise<boolean>;
  onOpenTogetherCelebration: () => void;
  partnerProfile?: UserProfile;
  partnerTodayMl?: number;
}

export const MainHydrationView: React.FC<MainHydrationViewProps> = ({
  activeProfile,
  allProfiles,
  myUserId,
  entries,
  onAddWater,
  onDeleteEntry,
  onSwitchProfile,
  onOpenSettings,
  onOpenAdmin,
  onSendHeartNotification,
  onOpenTogetherCelebration,
  partnerProfile,
  partnerTodayMl = 0,
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isAddingWater, setIsAddingWater] = useState<boolean>(false);
  const [justDrank, setJustDrank] = useState<boolean>(false);
  const [lastAddedAmount, setLastAddedAmount] = useState<number | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string>('');
  
  const [dropletTapCount, setDropletTapCount] = useState<number>(0);
  const [dropletTapTimer, setDropletTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [heartToast, setHeartToast] = useState<string>('');

  const isViewOnly = activeProfile.id !== myUserId;

  const todayTotalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);
  const percentage = Math.round((todayTotalMl / (activeProfile.dailyGoalMl || 3000)) * 100);

  const getEmotionState = (pct: number): EmotionState => {
    if (pct === 0) return 'sleepy';
    if (pct < 20) return 'tired';
    if (pct < 35) return 'okay';
    if (pct < 50) return 'better';
    if (pct < 70) return 'happy';
    if (pct < 90) return 'excited';
    if (pct < 100) return 'almost_there';
    if (pct === 100) return 'super_happy';
    return 'proud';
  };

  const emotion = getEmotionState(percentage);

  useEffect(() => {
    if (percentage >= 100) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF9EAA', '#74D4FF', '#FFD166', '#A8E6CF'],
      });
    }
  }, [percentage]);

  const handleDropletTap = () => {
    playTapSound();
    const newCount = dropletTapCount + 1;
    setDropletTapCount(newCount);

    if (dropletTapTimer) clearTimeout(dropletTapTimer);

    if (newCount >= 15) {
      setDropletTapCount(0);
      playCelebrationSound();
      onOpenAdmin();
    } else {
      const timer = setTimeout(() => {
        setDropletTapCount(0);
      }, 5000);
      setDropletTapTimer(timer);
    }
  };

  const handleHeartClick = async () => {
    playTapSound();
    if (partnerProfile) {
      const msg = getRandomMotivationalMessage();
      onSendHeartNotification(partnerProfile.id, msg);
      setHeartToast(`Sent reminder to ${partnerProfile.name}! 💕`);
      setTimeout(() => setHeartToast(''), 3000);
    } else {
      setHeartToast('Notification sent! 💕');
      setTimeout(() => setHeartToast(''), 3000);
    }
  };

  const handleAddWaterClick = (amount: number) => {
    if (isViewOnly) {
      return;
    }

    playSplashSound();
    setIsAddingWater(true);
    setJustDrank(true);
    setLastAddedAmount(amount);

    onAddWater(amount);

    const newTotal = todayTotalMl + amount;
    const newPct = Math.round((newTotal / activeProfile.dailyGoalMl) * 100);

    if (newPct >= 100 && percentage < 100) {
      playCelebrationSound();
    } else if (newPct >= 50 && percentage < 50) {
      playMilestoneSound();
    }

    setToastMessage(getEmotionMessage(emotion, activeProfile.name, true));

    setTimeout(() => {
      setIsAddingWater(false);
    }, 1200);

    setTimeout(() => {
      setJustDrank(false);
    }, 8000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const partnerPct = partnerProfile ? Math.round((partnerTodayMl / partnerProfile.dailyGoalMl) * 100) : 0;
  const showTogetherBanner = percentage >= 100 && partnerPct >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-sky-50 to-pink-100 flex flex-col justify-between p-4 max-w-md mx-auto select-none">
      <header className="flex items-center justify-between py-2 px-1">
        {/* Profile Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs p-1 rounded-full border border-pink-200 shadow-xs">
          {allProfiles.map((p) => {
            const isActive = p.id === activeProfile.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  playTapSound();
                  onSwitchProfile(p.id);
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-pink-400 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHeartClick}
            title="Send Water Reminder 💕"
            className="p-2 rounded-full bg-pink-100 border-2 border-pink-300 text-pink-500 hover:scale-110 active:scale-95 transition-all shadow-xs relative"
          >
            <Heart className="w-4 h-4 fill-pink-500" />
          </button>

          <button
            onClick={() => {
              playTapSound();
              onOpenSettings();
            }}
            className="p-2 rounded-full bg-white/80 border border-pink-200 text-slate-600 hover:scale-110 active:scale-95 transition-all shadow-xs"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {heartToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs font-bold text-pink-700 bg-pink-200/90 px-4 py-1.5 rounded-full border border-pink-300 shadow-sm max-w-xs mx-auto"
          >
            {heartToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center my-1">
        <h2 className="text-sm font-semibold text-slate-500">
          {getGreeting()}, <span className="font-bold text-slate-800">{activeProfile.name}</span> 💕
        </h2>
      </div>

      <main className="my-auto space-y-3">
        <KawaiiGarden
          percentage={percentage}
          emotion={emotion}
          isAddingWater={isAddingWater}
          justDrank={justDrank}
          addingAmount={lastAddedAmount}
          onDropletClick={handleDropletTap}
          dropletTapCount={dropletTapCount}
        />

        <div className="text-center space-y-1 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-pink-100 shadow-xs max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Droplets className="w-5 h-5 text-sky-400" />
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {(todayTotalMl / 1000).toFixed(2)} / {formatMlToLiters(activeProfile.dailyGoalMl)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-full max-w-[140px] bg-slate-200/80 h-3 rounded-full overflow-hidden border border-slate-300/40">
              <div
                className="bg-gradient-to-r from-sky-300 via-sky-400 to-pink-400 h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-pink-500">{percentage}%</span>
          </div>

          <p className="text-xs font-semibold text-slate-600 italic pt-1">
            "{getEmotionMessage(emotion, activeProfile.name, justDrank)}"
          </p>
        </div>

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs font-bold text-pink-600 bg-pink-100/90 px-3 py-1.5 rounded-full border border-pink-200 shadow-2xs max-w-xs mx-auto"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {showTogetherBanner && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onOpenTogetherCelebration}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-400 via-purple-300 to-sky-300 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 animate-pulse"
          >
            <Sparkles className="w-4 h-4" />
            <span>Together Celebration Unlocked! Tap to celebrate 💕</span>
          </motion.button>
        )}

        {/* Quick Add Buttons */}
        <div className={`grid grid-cols-4 gap-2 pt-1 ${isViewOnly ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            onClick={() => handleAddWaterClick(100)}
            disabled={isViewOnly}
            className="py-3 px-2 rounded-2xl bg-white hover:bg-sky-50 border-2 border-sky-200 text-sky-600 font-bold text-sm shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <span>+100 ml</span>
            <span className="text-[10px] text-sky-400 font-normal">Sip 💧</span>
          </button>

          <button
            onClick={() => handleAddWaterClick(250)}
            disabled={isViewOnly}
            className="py-3 px-2 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <span>+250 ml</span>
            <span className="text-[10px] text-sky-100 font-normal">Glass 🥛</span>
          </button>

          <button
            onClick={() => handleAddWaterClick(500)}
            disabled={isViewOnly}
            className="py-3 px-2 rounded-2xl bg-white hover:bg-sky-50 border-2 border-sky-200 text-sky-600 font-bold text-sm shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <span>+500 ml</span>
            <span className="text-[10px] text-sky-400 font-normal">Bottle 🍾</span>
          </button>

          <button
            onClick={() => {
              if (isViewOnly) return;
              playTapSound();
              setShowCustomModal(true);
            }}
            disabled={isViewOnly}
            className="py-3 px-2 rounded-2xl bg-pink-100 hover:bg-pink-200 border-2 border-pink-200 text-pink-600 font-bold text-xs shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Custom</span>
          </button>
        </div>
      </main>

      <footer className="flex items-center justify-between pt-3 border-t border-pink-200/60 mt-2">
        <button
          onClick={() => {
            playTapSound();
            setShowHistoryModal(true);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/80 px-3.5 py-2 rounded-full border border-pink-200 shadow-2xs hover:bg-pink-50"
        >
          <History className="w-3.5 h-3.5 text-pink-400" />
          <span>Today's Drinks ({entries.length})</span>
        </button>

        {partnerProfile && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold block">{partnerProfile.name}</span>
            <span className="text-xs font-bold text-slate-700">
              {((partnerTodayMl || 0) / 1000).toFixed(2)} L ({partnerPct}%)
            </span>
          </div>
        )}
      </footer>

      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border-2 border-pink-200 space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Enter Custom Water Amount 💧
              </h3>
              <div className="relative">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 350"
                  autoFocus
                  className="w-full text-center text-2xl font-bold py-3 px-4 rounded-2xl border-2 border-sky-200 focus:border-sky-400 focus:outline-none bg-sky-50/50"
                />
                <span className="absolute right-4 top-4 font-semibold text-slate-400">ml</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amt = parseInt(customAmount);
                    if (amt && amt > 0) {
                      handleAddWaterClick(amt);
                      setCustomAmount('');
                      setShowCustomModal(false);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-pink-400 text-white font-bold text-sm shadow-md"
                >
                  Add Water
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl border-t-2 sm:border-2 border-pink-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-pink-400" />
                  <span>{activeProfile.name}'s Log</span>
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No drinks logged today yet. 💧
                  </div>
                ) : (
                  entries.map((entry) => {
                    const timeStr = new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/70 border border-sky-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-200/70 flex items-center justify-center text-sky-600 font-bold text-xs">
                            💧
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">
                              +{entry.amountMl} ml
                            </span>
                            <span className="text-[11px] text-slate-400">{timeStr}</span>
                          </div>
                        </div>

                        {!isViewOnly ? (
                          <button
                            onClick={() => {
                              playTapSound();
                              onDeleteEntry(entry.id);
                            }}
                            title="Undo drink"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic px-2">Log</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Total Drank Today:</span>
                <span className="text-pink-500 text-sm">{((todayTotalMl) / 1000).toFixed(2)} L</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
