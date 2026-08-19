import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { calculateDailyGoalMl, formatMlToLiters } from '../utils/hydrationGoal';
import { KawaiiCharacter } from './KawaiiCharacter';
import type { UserProfile } from '../types';
import { Sparkles, Heart, ArrowRight, Check, UserCheck, Smartphone } from 'lucide-react';
import { playTapSound } from '../utils/soundEffects';

interface WelcomeOnboardingProps {
  existingProfiles: UserProfile[];
  onComplete: (selectedUserId: string, weightKg: number) => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  existingProfiles,
  onComplete,
}) => {
  const [step, setStep] = useState<'welcome' | 'select_user' | 'weight' | 'goal'>('welcome');
  const [selectedUserId, setSelectedUserId] = useState<string>(existingProfiles[0]?.id || 'user_1');
  const [weightKg, setWeightKg] = useState<string>('65');

  const selectedProfile = existingProfiles.find(p => p.id === selectedUserId) || existingProfiles[0];
  const goalMl = calculateDailyGoalMl(parseFloat(weightKg) || 60);

  const handleNextStep = () => {
    playTapSound();
    if (step === 'welcome') {
      setStep('select_user');
    } else if (step === 'select_user') {
      setStep('weight');
    } else if (step === 'weight') {
      const numWeight = parseFloat(weightKg);
      if (!numWeight || numWeight <= 0) return;
      setStep('goal');
    } else if (step === 'goal') {
      onComplete(selectedUserId, parseFloat(weightKg) || 65);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-sky-50 to-pink-50 flex flex-col justify-between p-6 select-none max-w-md mx-auto">
      <div className="flex items-center justify-center pt-4">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 border border-pink-200 shadow-xs text-xs font-semibold text-pink-500">
          <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
          <span>HydraLove • Setup Device</span>
        </div>
      </div>

      <div className="my-auto py-8">
        {step === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-sky-100 to-sky-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-sky-300/40 rounded-full scale-90" />
              <KawaiiCharacter emotion="happy" percentage={50} scale={1.1} />
              <motion.div
                className="absolute top-4 right-6 text-xl"
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💧
              </motion.div>
              <motion.div
                className="absolute bottom-6 left-6 text-lg"
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                🌸
              </motion.div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Welcome to HydraLove <span className="text-pink-500">🌸</span>
              </h1>
              <p className="text-base font-medium text-slate-600 max-w-xs mx-auto">
                Let's set up this device! We'll link your profile and calculate your daily goal.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'select_user' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-3xl shadow-sm text-purple-600">
              <Smartphone className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Who is using this phone?
              </h2>
              <p className="text-sm text-slate-500">
                Select your profile so this phone remembers you!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs pt-2">
              {existingProfiles.map((p) => {
                const isSelected = selectedUserId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      playTapSound();
                      setSelectedUserId(p.id);
                    }}
                    className={`py-4 px-4 rounded-2xl font-extrabold text-sm transition-all border-2 flex flex-col items-center justify-center gap-1 shadow-xs ${
                      isSelected
                        ? 'bg-gradient-to-b from-pink-400 to-pink-500 text-white border-pink-600 shadow-md scale-105'
                        : 'bg-white text-slate-700 border-pink-200 hover:bg-pink-50'
                    }`}
                  >
                    <UserCheck className="w-6 h-6" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 'weight' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center text-3xl shadow-sm">
              ⚖️
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">
                What's your weight, {selectedProfile?.name}?
              </h2>
              <p className="text-sm text-slate-500">
                We'll calculate your custom daily water target!
              </p>
            </div>

            <div className="relative w-full max-w-xs">
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="60"
                autoFocus
                className="w-full text-center text-3xl font-bold px-4 py-3.5 rounded-2xl border-2 border-sky-200 focus:border-sky-400 focus:outline-none bg-white shadow-inner text-slate-800"
              />
              <span className="absolute right-6 top-4 font-semibold text-slate-400 text-lg">
                kg
              </span>
            </div>
          </motion.div>
        )}

        {step === 'goal' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-sky-200 to-pink-200 p-1 flex items-center justify-center shadow-lg">
              <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-2xl">💧</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-700">
                All set, {selectedProfile?.name}! Your daily target:
              </h2>
              <div className="text-4xl font-extrabold text-pink-500 tracking-tight">
                {formatMlToLiters(goalMl)}
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto pt-1">
                This phone will remember you as {selectedProfile?.name}. You can switch profiles or change target anytime in Settings!
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="pb-4">
        <button
          onClick={handleNextStep}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-400 to-sky-400 hover:from-pink-500 hover:to-sky-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === 'welcome' && (
            <>
              <span>Setup Device</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
          {step === 'select_user' && (
            <>
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
          {step === 'weight' && (
            <>
              <span>Calculate Goal</span>
              <Sparkles className="w-5 h-5" />
            </>
          )}
          {step === 'goal' && (
            <>
              <span>Start Hydrating! 🌸</span>
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
