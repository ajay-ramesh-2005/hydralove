import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KawaiiCharacter } from './KawaiiCharacter';
import type { EmotionState } from '../types';

interface KawaiiGardenProps {
  percentage: number;
  emotion: EmotionState;
  isAddingWater: boolean;
  justDrank?: boolean;
  addingAmount?: number;
  onDropletClick?: () => void;
  dropletTapCount?: number;
}

export const KawaiiGarden: React.FC<KawaiiGardenProps> = ({
  percentage,
  emotion,
  isAddingWater,
  justDrank = false,
  addingAmount,
  onDropletClick,
}) => {
  const waterHeightPercent = percentage >= 100
    ? 100
    : Math.min(Math.max(18 + (percentage * 0.75), 18), 95);

  return (
    <div className="relative w-full max-w-sm h-[300px] mx-auto rounded-3xl overflow-hidden shadow-md border-4 border-pink-100 bg-sky-50/60 select-none flex items-center justify-center p-2">
      {/* Water Container Bar */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-sky-200 bg-sky-100/40 shadow-inner flex flex-col justify-end">
        {/* Dynamic Animated Water Fill */}
        <motion.div
          className={`absolute bottom-0 inset-x-0 overflow-hidden ${
            percentage >= 100
              ? 'bg-gradient-to-b from-pink-300 via-sky-400 to-blue-500'
              : 'bg-gradient-to-b from-sky-300 via-sky-400 to-blue-400'
          }`}
          animate={{ height: `${waterHeightPercent}%` }}
          transition={{ type: 'spring', stiffness: 45, damping: 14 }}
        >
          {/* Surface Wave Line */}
          <div className="absolute top-0 left-0 right-0 h-4 -mt-2 overflow-hidden pointer-events-none">
            <motion.svg
              className="w-[200%] h-full"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              animate={{ x: [0, -600] }}
              transition={{ duration: percentage >= 50 ? 4 : 6, repeat: Infinity, ease: 'linear' }}
            >
              <path
                d="M0 0 Q 150 30, 300 0 T 600 0 T 900 0 T 1200 0 L 1200 120 L 0 120 Z"
                fill={percentage >= 100 ? "#FFAAC9" : "#7DD3FC"}
                opacity="0.85"
              />
            </motion.svg>
          </div>

          {/* Floating Underwater Bubbles */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute bottom-2 left-1/4 w-3 h-3 rounded-full bg-white/40 border border-white/60"
              animate={{ y: [-10, -120], opacity: [0, 0.8, 0], x: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-4 right-1/3 w-3.5 h-3.5 rounded-full bg-white/35 border border-white/60"
              animate={{ y: [-5, -140], opacity: [0, 0.9, 0], x: [4, -4, 4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            {percentage >= 40 && (
              <motion.div
                className="absolute bottom-3 left-1/2 w-2.5 h-2.5 rounded-full bg-white/50 border border-white/60"
                animate={{ y: [-10, -100], opacity: [0, 0.9, 0], x: [-3, 3, -3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
            )}
            {percentage >= 70 && (
              <motion.div
                className="absolute bottom-1 right-1/4 w-4 h-4 rounded-full bg-white/45 border border-white/70"
                animate={{ y: [-5, -150], opacity: [0, 0.9, 0], x: [3, -3, 3] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              />
            )}
          </div>
        </motion.div>

        {/* Soft Water Surface Ripple Line */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center z-15 pointer-events-none">
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-4 rounded-full border border-sky-100 bg-sky-200/30"
          />
        </div>

        {/* Secret Clickable Aqua Drop Character Container (No visible counter badge) */}
        <div
          onClick={onDropletClick}
          className="absolute inset-x-0 bottom-5 flex items-center justify-center z-20 cursor-pointer active:scale-95 transition-transform"
        >
          <KawaiiCharacter
            emotion={emotion}
            percentage={percentage}
            isAddingWater={isAddingWater}
            justDrank={justDrank}
          />
        </div>
      </div>

      {/* Water Addition Surface Ripple */}
      <AnimatePresence>
        {isAddingWater && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="w-20 h-8 rounded-full border-4 border-white bg-sky-200/40 shadow-md"
            />

            {addingAmount && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 inset-x-6 z-40 bg-white/95 backdrop-blur-xs px-4 py-2 rounded-2xl shadow-md border border-pink-200 text-center"
              >
                <span className="text-sm font-bold text-pink-600">
                  +{addingAmount} ml poured! 💧✨
                </span>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* 100%+ Floating Hearts */}
      {percentage >= 100 && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          <motion.div
            className="absolute bottom-10 left-10 text-pink-400 text-lg"
            animate={{ y: [-10, -180], opacity: [0, 1, 0], x: [-10, 10, -10] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut' }}
          >
            💖
          </motion.div>
          <motion.div
            className="absolute bottom-8 right-12 text-pink-400 text-xl"
            animate={{ y: [-10, -200], opacity: [0, 1, 0], x: [10, -10, 10] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeOut', delay: 1 }}
          >
            💕
          </motion.div>
          <motion.div
            className="absolute bottom-6 left-1/2 text-amber-300 text-base"
            animate={{ y: [-10, -160], opacity: [0, 1, 0], x: [-5, 5, -5] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          >
            🌸
          </motion.div>
        </div>
      )}
    </div>
  );
};
