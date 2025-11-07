import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAUpdater: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [swUpdate, setSwUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Handle PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setSwUpdate(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdateBanner(true);
              }
            });
          }
        });
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
    } else {
      console.log('PWA installation dismissed');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleUpdateClick = () => {
    if (swUpdate) {
      swUpdate.waiting?.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateBanner(false);
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdateBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallButton(false);
  };

  if (!showInstallButton && !showUpdateBanner) {
    return null;
  }

  return (
    <>
      {/* Install PWA Banner */}
      {showInstallButton && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-indigo-600 text-white rounded-lg shadow-xl p-4 transform transition-all duration-300 ease-in-out">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Install TaskWizer Browser
              </p>
              <p className="text-xs mt-1 text-indigo-100">
                Install our app for faster access and offline capabilities
              </p>
            </div>
            <button
              onClick={handleDismissInstall}
              className="flex-shrink-0 p-1 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 px-3 py-1.5 bg-white text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-50 transition-colors"
            >
              Install App
            </button>
            <button
              onClick={handleDismissInstall}
              className="flex-1 px-3 py-1.5 bg-indigo-700 text-white text-sm font-medium rounded-md hover:bg-indigo-800 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-green-600 text-white rounded-lg shadow-xl p-4 transform transition-all duration-300 ease-in-out">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                New Version Available
              </p>
              <p className="text-xs mt-1 text-green-100">
                A new version of TaskWizer Browser is ready to install
              </p>
            </div>
            <button
              onClick={handleDismissUpdate}
              className="flex-shrink-0 p-1 rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleUpdateClick}
              className="flex-1 px-3 py-1.5 bg-white text-green-600 text-sm font-medium rounded-md hover:bg-green-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={handleDismissUpdate}
              className="flex-1 px-3 py-1.5 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      <OfflineIndicator />
    </>
  );
};

// Offline indicator component
const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-amber-600 text-white rounded-lg shadow-xl px-4 py-2 flex items-center space-x-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-sm font-medium">You're offline</span>
    </div>
  );
};

export default PWAUpdater;