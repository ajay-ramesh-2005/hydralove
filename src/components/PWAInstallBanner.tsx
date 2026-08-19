import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, PlusSquare, X, Check } from 'lucide-react';
import { playTapSound } from '../utils/soundEffects';

interface PWAInstallBannerProps {
  forceShowModal?: boolean;
  onCloseModal?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  forceShowModal = false,
  onCloseModal,
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android'>('ios');

  useEffect(() => {
    // Detect iOS vs Android
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActivePlatformTab('ios');
    } else {
      setActivePlatformTab('android');
    }

    // Check if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isDismissed = localStorage.getItem('hydralove_pwa_dismissed') === 'true';

    if (!isStandalone && !isDismissed) {
      setShowBanner(true);
    }

    // Listen for Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (forceShowModal) {
      setShowGuideModal(true);
    }
  }, [forceShowModal]);

  const handleDismiss = () => {
    playTapSound();
    localStorage.setItem('hydralove_pwa_dismissed', 'true');
    setShowBanner(false);
  };

  const handleInstallClick = async () => {
    playTapSound();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <AnimatePresence>
        {showBanner && !showGuideModal && !forceShowModal && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border-2 border-pink-200 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-400 to-sky-400 flex items-center justify-center text-white text-lg shadow-xs">
                💧
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Add HydraLove to Home Screen</h4>
                <p className="text-[11px] text-slate-500">For offline tracking & quick access 🌸</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleInstallClick}
                className="py-1.5 px-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs"
              >
                How to Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Installation Instructions Step-by-Step Modal */}
      <AnimatePresence>
        {(showGuideModal || forceShowModal) && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border-4 border-pink-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-pink-500" />
                  <h3 className="text-base font-bold text-slate-800">Install HydraLove PWA</h3>
                </div>
                <button
                  onClick={() => {
                    setShowGuideModal(false);
                    if (onCloseModal) onCloseModal();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 font-bold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActivePlatformTab('ios')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    activePlatformTab === 'ios'
                      ? 'bg-white text-pink-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  iPhone (Safari)
                </button>
                <button
                  onClick={() => setActivePlatformTab('android')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    activePlatformTab === 'android'
                      ? 'bg-white text-pink-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Android (Chrome)
                </button>
              </div>

              {/* Step instructions */}
              <div className="space-y-3 py-1">
                {activePlatformTab === 'ios' ? (
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5 bg-pink-50 p-2.5 rounded-xl border border-pink-100">
                      <span className="w-5 h-5 rounded-full bg-pink-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                      <p>Open <strong>HydraLove</strong> in <strong>Safari</strong> on your iPhone.</p>
                    </div>
                    <div className="flex items-start gap-2.5 bg-pink-50 p-2.5 rounded-xl border border-pink-100">
                      <span className="w-5 h-5 rounded-full bg-pink-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                      <p className="flex items-center gap-1">
                        Tap the <strong>Share button</strong> <Share className="w-3.5 h-3.5 text-sky-500 inline" /> at the bottom bar.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5 bg-pink-50 p-2.5 rounded-xl border border-pink-100">
                      <span className="w-5 h-5 rounded-full bg-pink-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                      <p className="flex items-center gap-1">
                        Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 text-pink-500 inline" />.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5 bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                      <span className="w-5 h-5 rounded-full bg-sky-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                      <p>Open <strong>HydraLove</strong> in <strong>Chrome</strong> on your Android phone.</p>
                    </div>
                    <div className="flex items-start gap-2.5 bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                      <span className="w-5 h-5 rounded-full bg-sky-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                      <p>Tap the <strong>3 dots menu (⋮)</strong> in the top right corner.</p>
                    </div>
                    <div className="flex items-start gap-2.5 bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                      <span className="w-5 h-5 rounded-full bg-sky-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                      <p>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowGuideModal(false);
                  if (onCloseModal) onCloseModal();
                }}
                className="w-full py-3 rounded-2xl bg-pink-500 text-white font-bold text-xs shadow-md"
              >
                Got It! 💕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
