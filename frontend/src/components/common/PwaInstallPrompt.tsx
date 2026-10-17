import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-brand-navy text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 flex items-start space-x-3 animate-bounce-in">
      <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center">
        <img src="/favicon.png" alt="Maraayn" className="w-8 h-8 object-contain" />
      </div>

      <div className="flex-1 min-w-0 text-xs">
        <h4 className="font-extrabold text-white text-sm">Install Maraayn App</h4>
        <p className="text-slate-300 text-[11px] mt-0.5">
          Install on your phone or desktop for quick access and full offline PWA capabilities.
        </p>

        <div className="mt-3 flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-1.5 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install App</span>
          </button>

          <button
            onClick={() => setShowPrompt(false)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            Not Now
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowPrompt(false)}
        className="text-slate-400 hover:text-white p-1 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

