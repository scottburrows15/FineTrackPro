import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    if (isInStandaloneMode || daysSinceDismissed < 7) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (isIOSDevice && !isInStandaloneMode) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-green-500/30 shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-lg mx-auto flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-green-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">Install FoulPay</h3>
          {isIOS ? (
            <p className="text-xs text-slate-400 mt-0.5">
              Tap <span className="inline-flex items-center"><svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16L16 11H13V4H11V11H8L12 16ZM20 18H4V11H2V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V11H20V18Z"/></svg></span> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">
              Add to your home screen for quick access
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isIOS && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-green-500 hover:bg-green-600 text-white gap-1.5"
            >
              <Download className="w-4 h-4" />
              Install
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
