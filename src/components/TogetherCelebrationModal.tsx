import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { KawaiiCharacter } from './KawaiiCharacter';
import type { UserProfile } from '../types';
import { Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCelebrationSound } from '../utils/soundEffects';

interface TogetherCelebrationModalProps {
  user1: UserProfile;
  user2: UserProfile;
  onClose: () => void;
}

export const TogetherCelebrationModal: React.FC<TogetherCelebrationModalProps> = ({
  user1,
  user2,
  onClose,
}) => {
  useEffect(() => {
    playCelebrationSound();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FF9EAA', '#74D4FF', '#FFD166', '#A8E6CF', '#FFC0D3'],
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        className="bg-gradient-to-b from-pink-100 via-pink-50 to-sky-100 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border-4 border-pink-300 relative space-y-5"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 text-slate-400 hover:text-slate-600 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pt-2">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/90 border border-pink-200 shadow-xs text-xs font-black text-pink-500">
            <Sparkles className="w-3.5 h-3.5 fill-pink-400" />
            <span>TOGETHER CELEBRATION!</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            You both did it today! 💕
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            {user1.name} & {user2.name} both crushed their hydration goals!
          </p>
        </div>

        <div className="relative w-full h-44 rounded-3xl bg-gradient-to-b from-sky-200 to-sky-400 border-4 border-white shadow-inner flex items-center justify-around overflow-hidden p-2">
          <div className="absolute top-2 left-0 right-0 h-4 bg-sky-300/60 rounded-full" />

          <div className="flex flex-col items-center z-10">
            <KawaiiCharacter emotion="super_happy" percentage={100} scale={0.75} />
            <span className="text-[11px] font-bold text-white bg-pink-400 px-2 py-0.5 rounded-full shadow-xs -mt-2">
              {user1.name} 💧
            </span>
          </div>

          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl z-20"
          >
            💖
          </motion.div>

          <div className="flex flex-col items-center z-10">
            <KawaiiCharacter emotion="super_happy" percentage={100} scale={0.75} />
            <span className="text-[11px] font-bold text-white bg-pink-400 px-2 py-0.5 rounded-full shadow-xs -mt-2">
              {user2.name} 💧
            </span>
          </div>
        </div>

        <p className="text-xs font-bold text-pink-600 italic bg-white/80 py-2.5 px-4 rounded-2xl border border-pink-200 shadow-2xs">
          "Two hydrated souls, one happy garden! Keep shining together! 🌸✨"
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 to-sky-400 text-white font-black text-sm shadow-md active:scale-95 transition-all"
        >
          High Five! 🙌
        </button>
      </motion.div>
    </div>
  );
};
