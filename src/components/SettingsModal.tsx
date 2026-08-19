import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile, ReminderSettings } from '../types';
import { calculateDailyGoalMl, formatMlToLiters } from '../utils/hydrationGoal';
import { Settings, Bell, Volume2, VolumeX, Download, Trash2, X, RefreshCcw, User, Heart, Smartphone } from 'lucide-react';
import { playTapSound } from '../utils/soundEffects';

interface SettingsModalProps {
  activeProfile: UserProfile;
  allProfiles: UserProfile[];
  myUserId: string;
  reminderSettings: ReminderSettings;
  soundEnabled: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveMyUserId: (userId: string) => void;
  onSaveReminders: (reminders: ReminderSettings) => void;
  onToggleSound: (enabled: boolean) => void;
  onResetToday: () => void;
  onResetAll: () => void;
  onOpenInstallGuide: () => void;
  onRequestPushPermission: () => Promise<boolean>;
  pushSubscribed: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  activeProfile,
  allProfiles,
  myUserId,
  reminderSettings,
  soundEnabled,
  onClose,
  onSaveProfile,
  onSaveMyUserId,
  onSaveReminders,
  onToggleSound,
  onResetToday,
  onResetAll,
  onOpenInstallGuide,
  onRequestPushPermission,
  pushSubscribed,
}) => {
  const [name, setName] = useState(activeProfile.name);
  const [weightKg, setWeightKg] = useState(String(activeProfile.weightKg));
  const [selectedMyUserId, setSelectedMyUserId] = useState(myUserId);
  const [remindersEnabled, setRemindersEnabled] = useState(reminderSettings.enabled);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  const goalMl = calculateDailyGoalMl(parseFloat(weightKg) || 60);

  const handleSaveProfile = () => {
    playTapSound();
    onSaveProfile({
      ...activeProfile,
      name: name.trim() || activeProfile.name,
      weightKg: parseFloat(weightKg) || activeProfile.weightKg,
      dailyGoalMl: goalMl,
    });
    if (selectedMyUserId !== myUserId) {
      onSaveMyUserId(selectedMyUserId);
    }
  };

  const handleToggleReminders = () => {
    playTapSound();
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    onSaveReminders({
      ...reminderSettings,
      enabled: next,
    });
  };

  const handlePushToggle = async () => {
    playTapSound();
    setIsSubscribingPush(true);
    await onRequestPushPermission();
    setIsSubscribingPush(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border-4 border-pink-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-pink-100 p-4 border-b border-pink-200 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-pink-500" />
            <span>HydraLove Settings</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Device Owner Selector */}
          <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-purple-500" />
              <span>Who is using this phone?</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {allProfiles.map((p) => {
                const isSelected = selectedMyUserId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      playTapSound();
                      setSelectedMyUserId(p.id);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-purple-500 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-600 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-pink-400" />
              <span>Edit {activeProfile.name}'s Profile</span>
            </h4>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Calculated Goal:</span>
                <span className="text-pink-600 text-sm">{formatMlToLiters(goalMl)}</span>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2 rounded-xl bg-pink-400 hover:bg-pink-500 text-white font-bold text-xs shadow-xs"
              >
                Save Profile & Device Preference
              </button>
            </div>
          </div>

          <div className="bg-sky-50/60 p-3.5 rounded-2xl border border-sky-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-sky-400" />
              <span>Reminders & Notifications</span>
            </h4>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Offline Hydration Reminders</span>
                <span className="text-[10px] text-slate-400 block">Hourly reminder alerts</span>
              </div>
              <button
                onClick={handleToggleReminders}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  remindersEnabled ? 'bg-sky-400' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Web Push Notifications</span>
                <span className="text-[10px] text-slate-400 block">For partner custom alerts</span>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={isSubscribingPush}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  pushSubscribed
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-sky-400 text-white border-sky-400 hover:bg-sky-500'
                }`}
              >
                {pushSubscribed ? 'Subscribed ✓' : 'Enable Push'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-bold text-slate-800">Cute Sound Effects</span>
              </div>
              <button
                onClick={() => {
                  playTapSound();
                  onToggleSound(!soundEnabled);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-amber-400' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => {
                playTapSound();
                onOpenInstallGuide();
              }}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-amber-100/50 border border-amber-200 text-amber-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>How to Install HydraLove PWA</span>
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (confirm("Reset today's water entries?")) {
                  onResetToday();
                }
              }}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset Today's Water</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear ALL saved HydraLove data?')) {
                  onResetAll();
                }
              }}
              className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All App Data</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
