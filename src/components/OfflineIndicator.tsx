import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import type { Language } from '../types';

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      {lang === 'hi'
        ? 'ऑफ़लाइन मोड — कैश्ड डेटा दिखाया जा रहा है'
        : 'Offline Mode — Cached data active'}
    </div>
  );
};
