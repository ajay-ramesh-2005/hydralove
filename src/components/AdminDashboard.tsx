import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile, HydrationEntry, NotificationLog } from '../types';
import { KawaiiCharacter } from './KawaiiCharacter';
import { formatMlToLiters } from '../utils/hydrationGoal';
import { Heart, Send, TrendingUp, Bell, X, User, Edit3, Save, Database, Check, AlertCircle, Zap } from 'lucide-react';
import { playTapSound, playCelebrationSound } from '../utils/soundEffects';
import { getSupabaseCredentials, saveSupabaseCredentials, getSupabaseClient } from '../utils/supabaseClient';
import { triggerTestNotification } from '../utils/pushNotifications';

interface AdminDashboardProps {
  profiles: UserProfile[];
  entriesMap: Record<string, HydrationEntry[]>;
  onClose: () => void;
  onSendCustomNotification: (targetUserId: string, message: string) => Promise<boolean>;
  onSaveProfileNames?: (user1Name: string, user2Name: string) => void;
  notificationLogs: NotificationLog[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profiles,
  entriesMap,
  onClose,
  onSendCustomNotification,
  onSaveProfileNames,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'push' | 'profiles' | 'database'>('today');
  const [historyFilter, setHistoryFilter] = useState<'today' | 'yesterday' | '7days' | '30days'>('7days');
  const [targetUser, setTargetUser] = useState<string>('all');
  const [pushMessage, setPushMessage] = useState<string>('Drink some water, sleepyhead! 💕💧');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendStatusMessage, setSendStatusMessage] = useState<string>('');
  const [testNotifResult, setTestNotifResult] = useState<string>('');

  const p1 = profiles.find(p => p.id === 'user_1') || profiles[0];
  const p2 = profiles.find(p => p.id === 'user_2') || profiles[1] || profiles[0];

  const [u1Name, setU1Name] = useState<string>(p1?.name || 'User 1');
  const [u2Name, setU2Name] = useState<string>(p2?.name || 'User 2');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Cloud Supabase Credentials State inside Admin
  const initialCreds = getSupabaseCredentials();
  const [supaUrl, setSupaUrl] = useState(initialCreds.url);
  const [supaKey, setSupaKey] = useState(initialCreds.key);
  const [dbStatusMsg, setDbStatusMsg] = useState('');

  const isConnected = Boolean(getSupabaseClient());

  const presetMessages = [
    "Drink some water, sleepyhead! 💕💧",
    "Hey! Don't forget your water break! 🌸",
    "Sending you a little love and hydration! 🥰💦",
    "Our little drop character misses you! 🥺💧",
    "Stay hydrated and shine bright today! ✨",
  ];

  const calculateUserStats = (userId: string) => {
    const userEntries = entriesMap[userId] || [];
    const profile = profiles.find(p => p.id === userId);
    const goal = profile?.dailyGoalMl || 3000;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntries = userEntries.filter(e => e.localDate === todayStr);
    const todayTotal = todayEntries.reduce((sum, e) => sum + e.amountMl, 0);

    let filteredEntries = [...userEntries];
    if (historyFilter === 'today') {
      filteredEntries = todayEntries;
    } else if (historyFilter === 'yesterday') {
      const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      filteredEntries = userEntries.filter(e => e.localDate === yest);
    } else if (historyFilter === '7days') {
      const past7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      filteredEntries = userEntries.filter(e => e.localDate >= past7);
    } else if (historyFilter === '30days') {
      const past30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      filteredEntries = userEntries.filter(e => e.localDate >= past30);
    }

    const totalMl = filteredEntries.reduce((sum, e) => sum + e.amountMl, 0);
    const drinkCount = filteredEntries.length;
    const uniqueDays = new Set(filteredEntries.map(e => e.localDate)).size || 1;
    const avgDailyMl = Math.round(totalMl / uniqueDays);

    return {
      todayTotal,
      todayPct: Math.round((todayTotal / goal) * 100),
      totalMl,
      drinkCount,
      avgDailyMl,
      uniqueDays,
      goal,
    };
  };

  const handleSaveNames = () => {
    playTapSound();
    if (onSaveProfileNames) {
      onSaveProfileNames(u1Name.trim() || 'User 1', u2Name.trim() || 'User 2');
      playCelebrationSound();
      setSaveStatus('User names saved successfully! ✨');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleSaveDatabaseConfig = () => {
    playTapSound();
    saveSupabaseCredentials(supaUrl, supaKey);
    const client = getSupabaseClient();
    if (client) {
      playCelebrationSound();
      setDbStatusMsg('Connected to Supabase! Live sync active ✨');
    } else {
      setDbStatusMsg('Please enter valid Supabase URL & Anon Key');
    }
    setTimeout(() => setDbStatusMsg(''), 4000);
  };

  const handleTestOfflineNotification = async () => {
    playTapSound();
    setTestNotifResult('Testing notification...');
    const result = await triggerTestNotification(u1Name);
    if (result.success) {
      playCelebrationSound();
      setTestNotifResult(result.message);
    } else {
      setTestNotifResult(`❌ ${result.message}`);
    }
  };

  const handleSendPush = async () => {
    if (!pushMessage.trim()) return;
    playTapSound();
    setIsSending(true);
    setSendStatusMessage('');

    try {
      const success = await onSendCustomNotification(targetUser, pushMessage);
      if (success) {
        playCelebrationSound();
        setSendStatusMessage('Notification sent successfully! 🚀');
        setPushMessage('');
      } else {
        setSendStatusMessage('Notification queued / sent to registered users! 📲');
      }
    } catch (e) {
      setSendStatusMessage('Failed to deliver push notification.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border-4 border-pink-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="bg-gradient-to-r from-pink-400 via-rose-300 to-sky-400 p-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white text-white" />
            <div>
              <h2 className="text-lg font-black tracking-tight">HydraLove Admin</h2>
              <p className="text-[11px] text-pink-100 font-medium">Private Companion & System Controls</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-pink-100 bg-pink-50/50 p-1.5 gap-1 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'today' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'profiles' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'database' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cloud Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'history' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all ${
              activeTab === 'push' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Push</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'today' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Today's Companion Progress Cards
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profiles.map(p => {
                  const stats = calculateUserStats(p.id);
                  const emotion = stats.todayPct >= 100 ? 'super_happy' : stats.todayPct >= 50 ? 'happy' : 'sleepy';
                  return (
                    <div
                      key={p.id}
                      className="bg-gradient-to-b from-sky-50 to-pink-50 p-4 rounded-2xl border-2 border-pink-200 shadow-xs flex flex-col items-center text-center space-y-2"
                    >
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-pink-600 border border-pink-100 shadow-2xs">
                        {p.name}
                      </span>

                      <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
                        <KawaiiCharacter emotion={emotion} percentage={stats.todayPct} scale={0.65} />
                      </div>

                      <div>
                        <span className="text-lg font-black text-slate-800 block">
                          {(stats.todayTotal / 1000).toFixed(2)} / {formatMlToLiters(stats.goal)}
                        </span>
                        <span className="text-xs font-extrabold text-pink-500">
                          {stats.todayPct}% Hydrated
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="space-y-4">
              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-200 space-y-1">
                <h4 className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit User Names</span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  Change default names for User 1 and User 2. They will update across the entire app!
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-pink-100 shadow-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">User 1 Name:</label>
                  <input
                    type="text"
                    value={u1Name}
                    onChange={e => setU1Name(e.target.value)}
                    placeholder="User 1"
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">User 2 Name:</label>
                  <input
                    type="text"
                    value={u2Name}
                    onChange={e => setU2Name(e.target.value)}
                    placeholder="User 2"
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-pink-400"
                  />
                </div>

                <button
                  onClick={handleSaveNames}
                  className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save User Names</span>
                </button>

                {saveStatus && (
                  <p className="text-center text-xs font-bold text-emerald-600 pt-1">
                    {saveStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>Supabase Cloud Database Settings</span>
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isConnected ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                    <span>{isConnected ? 'Connected' : 'Sync Offline'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Configure your Supabase project credentials to enable live multi-device synchronization across phones and laptops.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-sky-100 shadow-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supabase Project URL:</label>
                  <input
                    type="text"
                    value={supaUrl}
                    onChange={(e) => setSupaUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supabase Anon Key:</label>
                  <input
                    type="password"
                    value={supaKey}
                    onChange={(e) => setSupaKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <button
                  onClick={handleSaveDatabaseConfig}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Connect & Enable Live Sync ✨</span>
                </button>

                {dbStatusMsg && (
                  <p className="text-center text-xs font-bold text-pink-600 pt-1">
                    {dbStatusMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(['today', 'yesterday', '7days', '30days'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      historyFilter === f ? 'bg-pink-500 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : f === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {profiles.map(p => {
                  const stats = calculateUserStats(p.id);
                  return (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border-2 border-pink-100 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4 h-4 text-pink-400" />
                          <span>{p.name}</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {stats.drinkCount} total drinks
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-sky-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-medium block">Total Water</span>
                          <span className="text-sm font-extrabold text-sky-600">{(stats.totalMl / 1000).toFixed(1)} L</span>
                        </div>
                        <div className="bg-pink-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-medium block">Daily Avg</span>
                          <span className="text-sm font-extrabold text-pink-600">{(stats.avgDailyMl / 1000).toFixed(1)} L</span>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-medium block">Days Tracked</span>
                          <span className="text-sm font-extrabold text-amber-600">{stats.uniqueDays} d</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'push' && (
            <div className="space-y-4">
              {/* Test Local Offline Notification Card */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border-2 border-purple-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span>Test Local / Offline Notifications</span>
                  </h4>
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    Screen Lock Test
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Tap to send an instant test notification, then lock/minimize your phone to verify that the 5-second delayed notification pops up on your lock screen!
                </p>

                <button
                  onClick={handleTestOfflineNotification}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>TEST LOCAL NOTIFICATION 🔔</span>
                </button>

                {testNotifResult && (
                  <div className="text-center text-xs font-bold text-purple-700 bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                    {testNotifResult}
                  </div>
                )}
              </div>

              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-200 space-y-1">
                <h4 className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Custom Push Notification</span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  Send a cute notification right to your partner's phone screen!
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Recipient:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTargetUser('all')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      targetUser === 'all'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Both Users 💕
                  </button>
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setTargetUser(p.id)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        targetUser === p.id
                          ? 'bg-pink-500 text-white border-pink-500 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Cute Presets:</label>
                <div className="flex flex-wrap gap-1.5">
                  {presetMessages.map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => setPushMessage(msg)}
                      className="text-[11px] bg-slate-100 hover:bg-pink-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-all text-left"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Message Text:</label>
                <textarea
                  rows={3}
                  value={pushMessage}
                  onChange={e => setPushMessage(e.target.value)}
                  placeholder="Type a sweet hydration reminder..."
                  className="w-full p-3 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <button
                onClick={handleSendPush}
                disabled={isSending || !pushMessage.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 to-sky-400 hover:from-pink-500 hover:to-sky-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending...' : 'SEND NOTIFICATION 🚀'}</span>
              </button>

              {sendStatusMessage && (
                <div className="text-center text-xs font-bold text-pink-600 bg-pink-50 p-2.5 rounded-xl border border-pink-200">
                  {sendStatusMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
