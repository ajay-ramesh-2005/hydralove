import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { EmotionState } from '../types';

interface KawaiiCharacterProps {
  emotion: EmotionState;
  percentage: number;
  isAddingWater?: boolean;
  justDrank?: boolean;
  scale?: number;
}

export const KawaiiCharacter: React.FC<KawaiiCharacterProps> = ({
  emotion: _emotion,
  percentage,
  isAddingWater = false,
  justDrank = false,
  scale = 1,
}) => {
  // 5 Randomized drinking reaction modes
  const [reactionType, setReactionType] = useState<number>(0);

  useEffect(() => {
    if (isAddingWater || justDrank) {
      setReactionType(Math.floor(Math.random() * 5));
    }
  }, [isAddingWater, justDrank]);

  // Eyes rendering: Unique expressions per percentage milestone
  const renderEyes = () => {
    if (percentage === 0 && !justDrank) {
      return (
        <g>
          {/* 0%: Sleepy closed eyes */}
          <path d="M37 55 Q44 62 51 55" stroke="#1A2E3B" strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <path d="M73 55 Q80 63 87 55" stroke="#1A2E3B" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        </g>
      );
    }

    if (percentage < 20 && !justDrank) {
      return (
        <g>
          {/* < 20%: Thirsty sad eyes */}
          <ellipse cx="44" cy="55" rx="6" ry="7.5" fill="#1A2E3B" />
          <ellipse cx="80" cy="55" rx="6" ry="7.5" fill="#1A2E3B" />
          <circle cx="46" cy="52" r="2.8" fill="#FFFFFF" />
          <circle cx="41.5" cy="58" r="1.4" fill="#FFFFFF" />
          <circle cx="82" cy="52" r="2.8" fill="#FFFFFF" />
          <circle cx="77.5" cy="57" r="1.4" fill="#FFFFFF" />
          <path d="M35 46 L47 50" stroke="#1A2E3B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M89 46 L77 50" stroke="#1A2E3B" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    }

    if (percentage < 50 && !justDrank) {
      return (
        <g>
          {/* 20-50%: Cute open anime eyes */}
          <ellipse cx="43" cy="54" rx="6.5" ry="8" fill="#1A2E3B" />
          <ellipse cx="81" cy="54" rx="6.5" ry="8" fill="#1A2E3B" />
          <circle cx="45.5" cy="50.5" r="3" fill="#FFFFFF" />
          <circle cx="40.5" cy="57" r="1.5" fill="#FFFFFF" />
          <circle cx="83.5" cy="50.5" r="3" fill="#FFFFFF" />
          <circle cx="78.5" cy="57" r="1.5" fill="#FFFFFF" />
        </g>
      );
    }

    if (percentage < 75 && !justDrank) {
      return (
        <g>
          {/* 50-75%: Happy arches */}
          <path d="M35 56 Q43 43 51 56" stroke="#1A2E3B" strokeWidth="4.2" strokeLinecap="round" fill="none" />
          <path d="M73 56 Q81 43 89 56" stroke="#1A2E3B" strokeWidth="4.2" strokeLinecap="round" fill="none" />
        </g>
      );
    }

    // 75%+ or Just Drank: Sparkling big excited eyes!
    return (
      <g>
        <circle cx="43" cy="53" r="8" fill="#1A2E3B" />
        <circle cx="81" cy="53" r="8" fill="#1A2E3B" />
        <circle cx="45.5" cy="49" r="3.5" fill="#FFFFFF" />
        <circle cx="40" cy="56.5" r="1.8" fill="#FFFFFF" />
        <circle cx="83.5" cy="49" r="3.5" fill="#FFFFFF" />
        <circle cx="78" cy="56.5" r="1.8" fill="#FFFFFF" />
      </g>
    );
  };

  // Mouth expressions matching percentage
  const renderMouth = () => {
    if (percentage === 0 && !justDrank) {
      return <path d="M59 65 Q62 68 65 65" stroke="#1A2E3B" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }
    if (percentage < 20 && !justDrank) {
      return <path d="M57 68 Q62 64 67 68" stroke="#1A2E3B" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }
    if (percentage < 50 && !justDrank) {
      return <path d="M55 64 Q59 69 62 64 Q65 69 69 64" stroke="#1A2E3B" strokeWidth="2.8" strokeLinecap="round" fill="none" />;
    }

    return (
      <g>
        <path d="M54 62 Q62 76 70 62 Z" fill="#FF4081" stroke="#1A2E3B" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M57 68 Q62 73 67 68 Z" fill="#FF80AB" />
      </g>
    );
  };

  // Blushing Cheeks
  const renderCheeks = () => {
    if (percentage === 0 && !justDrank) return null;
    const opacity = Math.min(0.4 + (percentage / 200), 0.95);
    return (
      <g>
        <ellipse cx="28" cy="62" rx="7.5" ry="4" fill="#FF80AB" opacity={opacity} />
        <ellipse cx="96" cy="62" rx="7.5" ry="4" fill="#FF80AB" opacity={opacity} />
        <ellipse cx="27" cy="61" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.8" />
        <ellipse cx="95" cy="61" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.8" />
      </g>
    );
  };

  // Dynamic Head Accessories unlocking per percentage!
  const renderAccessories = () => {
    if (percentage >= 100) {
      // 100%: Golden Flower Crown
      return (
        <motion.g
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          transform="translate(62, 8)"
        >
          <path d="M -18 8 Q 0 -4 18 8" stroke="#8D5B4C" strokeWidth="2.5" fill="none" />
          <circle cx="-14" cy="5" r="4" fill="#FF8EA4" />
          <circle cx="-14" cy="5" r="1.5" fill="#FFE599" />
          <circle cx="0" cy="1" r="5" fill="#FF4081" />
          <circle cx="0" cy="1" r="2" fill="#FFE599" />
          <circle cx="14" cy="5" r="4" fill="#FF8EA4" />
          <circle cx="14" cy="5" r="1.5" fill="#FFE599" />
        </motion.g>
      );
    }

    if (percentage >= 50) {
      // 50-99%: Head Leaf Sprout
      return (
        <g transform="translate(62, 10)">
          <path d="M 0 4 Q -8 -4 -2 -10 Q 4 -8 0 4 Z" fill="#81C784" stroke="#388E3C" strokeWidth="1.5" />
          <path d="M 0 4 Q 8 -4 2 -10 Q -4 -8 0 4 Z" fill="#A5D6A7" stroke="#388E3C" strokeWidth="1.5" />
        </g>
      );
    }

    return null;
  };

  // Progressive Floating Particles per Percentage!
  const renderProgressParticles = () => {
    if (percentage === 0 && !justDrank) {
      // Sleeping Zzz
      return (
        <motion.g
          animate={{ y: [-2, -14, -2], opacity: [0.3, 1, 0.2], x: [0, 4, 8] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <text x="96" y="32" fontSize="15" fontWeight="bold" fill="#78CFE2">z</text>
          <text x="106" y="18" fontSize="18" fontWeight="bold" fill="#5F93BD">Z</text>
        </motion.g>
      );
    }

    if (percentage >= 30 && percentage < 50 && !justDrank) {
      // Floating Musical Note
      return (
        <motion.text
          x="100"
          y="30"
          fontSize="18"
          fill="#FF4081"
          animate={{ y: [-2, -14, -2], opacity: [0.4, 1, 0.3], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎵
        </motion.text>
      );
    }

    if (percentage >= 50 && percentage < 75 && !justDrank) {
      // Golden Sparkles
      return (
        <motion.text
          x="100"
          y="28"
          fontSize="18"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          ✨
        </motion.text>
      );
    }

    if (percentage >= 75 || justDrank) {
      // Floating Pink Hearts
      return (
        <motion.path
          d="M 108 30 C 108 25, 102 23, 100 28 C 98 23, 92 25, 92 30 C 92 36, 100 42, 100 42 C 100 42, 108 36, 108 30 Z"
          fill="#FF4081"
          animate={{ y: [-2, -14, -2], opacity: [0.6, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      );
    }

    return null;
  };

  // Motion physics: Squishy mochi bounce variations
  const getMotionAnimation = (): any => {
    if (isAddingWater || justDrank) {
      if (reactionType === 1) {
        // High double hop
        return {
          y: [0, -35, 4, -18, 0],
          scaleX: [1, 0.8, 1.25, 0.9, 1],
          scaleY: [1, 1.28, 0.78, 1.1, 1],
          transition: { duration: 0.85, ease: 'easeInOut' },
        };
      }
      if (reactionType === 2) {
        // Squishy side wiggle hop
        return {
          y: [0, -25, 0],
          x: [0, -8, 8, -4, 0],
          scaleX: [1, 1.15, 0.9, 1],
          transition: { duration: 0.75, ease: 'easeInOut' },
        };
      }
      // Standard squishy bounce
      return {
        y: [0, -30, 6, -10, 0],
        scaleX: [1, 0.82, 1.22, 0.92, 1],
        scaleY: [1, 1.25, 0.8, 1.08, 1],
        transition: { duration: 0.8, ease: 'easeInOut' },
      };
    }

    if (percentage === 0) {
      return {
        y: [0, 3, 0],
        scaleY: [1, 0.96, 1],
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
      };
    }

    if (percentage >= 75) {
      return {
        y: [0, -12, 0],
        scaleY: [1, 1.06, 0.94, 1],
        scaleX: [1, 0.94, 1.06, 1],
        transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
      };
    }

    return {
      y: [0, -6, 0],
      scaleY: [1, 1.04, 1],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    };
  };

  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <motion.div
        animate={getMotionAnimation()}
        style={{ transformOrigin: 'bottom center', scale }}
        className="relative"
      >
        {renderProgressParticles()}

        <svg width="124" height="124" viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="aquaBodyGrad" x1="62" y1="12" x2="62" y2="108" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0FAFF" />
              <stop offset="30%" stopColor="#80EEFF" />
              <stop offset="70%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#00B8D4" />
            </linearGradient>

            <linearGradient id="aquaShine" x1="42" y1="18" x2="62" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Feet */}
          <ellipse cx="46" cy="104" rx="6" ry="3.5" fill="#0097A7" />
          <ellipse cx="78" cy="104" rx="6" ry="3.5" fill="#0097A7" />

          {/* Arms (Arm posture raises as percentage increases!) */}
          <motion.path
            d={percentage >= 70 ? "M 23 72 Q 10 65 16 58" : "M 23 72 Q 13 74 18 82"}
            stroke="#0097A7"
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
            animate={percentage >= 70 || justDrank ? { y: [-3, 3, -3] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.path
            d={percentage >= 70 ? "M 101 72 Q 114 65 108 58" : "M 101 72 Q 111 74 106 82"}
            stroke="#0097A7"
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
            animate={percentage >= 70 || justDrank ? { y: [-3, 3, -3] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          />

          {/* Main Aqua Body */}
          <path
            d="M 62 14 
               C 76 34, 105 62, 105 81 
               C 105 97, 86 106, 62 106 
               C 38 106, 19 97, 19 81 
               C 19 62, 48 34, 62 14 Z"
            fill="url(#aquaBodyGrad)"
            stroke="#00ACC1"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Head Accessories */}
          {renderAccessories()}

          {/* Specular Highlights */}
          <path
            d="M 60 22 
               C 68 36, 88 58, 90 72 
               C 86 57, 68 36, 60 22 Z"
            fill="url(#aquaShine)"
          />
          <ellipse cx="37" cy="54" rx="4.5" ry="9" fill="#FFFFFF" opacity="0.75" transform="rotate(-20 37 54)" />
          <circle cx="47" cy="34" r="2.8" fill="#FFFFFF" opacity="0.85" />

          {/* Facial Features */}
          {renderEyes()}
          {renderMouth()}
          {renderCheeks()}
        </svg>
      </motion.div>
    </div>
  );
};
