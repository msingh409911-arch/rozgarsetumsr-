import React, { useState } from 'react';
import { Download, Smartphone, Terminal, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Language } from '../types';

interface PWAInstallButtonProps {
  lang: Language;
  variant?: 'hero' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang, variant = 'hero' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const buttonClasses =
    variant === 'hero'
      ? 'inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm font-semibold hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
      : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-xs font-semibold hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer';

  return (
    <>
      {isInstallable ? (
        <button type="button" onClick={install} className={buttonClasses}>
          <Download className="w-4 h-4 text-blue-700" />
          {lang === 'hi' ? 'Android ऐप इंस्टॉल करें' : 'Install Android App'}
        </button>
      ) : (
        <button type="button" onClick={() => setShowGuide(true)} className={buttonClasses}>
          <Smartphone className="w-4 h-4 text-blue-700" />
          {lang === 'hi' ? 'Android ऐप / APK' : 'Android App & APK'}
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl my-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-orange-600">com.rozgarsetu.msr</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {lang === 'hi'
                    ? 'Rozgar Setu MSR Android ऐप इंस्टॉल करें'
                    : 'Install Rozgar Setu MSR on Android'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              {isIOS ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-semibold text-slate-900">iPhone / iPad (Safari)</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Tap the <strong>Share</strong> icon in Safari.<br />
                    2. Tap <strong>Add to Home Screen</strong> to install Rozgar Setu MSR.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="font-semibold text-emerald-900">
                    {lang === 'hi'
                      ? 'विकल्प 1: Android Chrome से तुरंत इंस्टॉल करें'
                      : 'Option 1: Instant Install on Android Phone'}
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {lang === 'hi'
                      ? 'अपने Android फ़ोन में Chrome मेन्यू (⋮) खोलें और "Install app" या "Add to Home screen" चुनें।'
                      : 'Open this link in Android Chrome, tap the browser menu (⋮), and tap "Install app" or "Add to Home screen".'}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-700" />
                  {lang === 'hi'
                    ? 'विकल्प 2: Capacitor Android प्रोजेक्ट से APK बनाएं'
                    : 'Option 2: Build Native Android APK (Capacitor)'}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'hi'
                    ? 'प्रोजेक्ट में पहले से ही पूरा Capacitor Android प्रोजेक्ट (android/) शामिल है। APK बनाने के लिए:'
                    : 'This repository includes the full Capacitor Android project (com.rozgarsetu.msr). Build the APK locally or via GitHub Actions:'}
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono-num overflow-x-auto">
{`npm run build
npx cap sync android
cd android && ./gradlew assembleDebug`}
                </pre>
                <p className="text-xs text-slate-500 font-mono-num">
                  APK output: android/app/build/outputs/apk/debug/app-debug.apk
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
