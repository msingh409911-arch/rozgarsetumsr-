import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, MapPin, Trash2, Upload, UserRound, Users } from 'lucide-react';
import { translations } from '../i18n';
import { saveFounderProfilePhoto } from '../services/firestoreService';
import { BLUEPRINT_LIMITS, type FounderProfileSettings, type Language } from '../types';

interface FounderSectionProps {
  lang: Language;
  founderSettings: FounderProfileSettings | null;
  isAdmin: boolean;
  onRequestAdminLogin: () => void;
}

const LOCAL_PREVIEW_KEY = 'msr_founder_photo_preview';

function compressImageToDataUrl(file: File, maxSize = 480, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > BLUEPRINT_LIMITS.FOUNDER_PHOTO_MAX) {
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        } else {
          resolve(dataUrl);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const FounderSection: React.FC<FounderSectionProps> = ({
  lang,
  founderSettings,
  isAdmin,
  onRequestAdminLogin,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string>(() => {
    try {
      return window.localStorage.getItem(LOCAL_PREVIEW_KEY) || '';
    } catch {
      return '';
    }
  });
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePhotoUrl = founderSettings?.photoUrl || localPreview || '/images/founder.jpg';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य छवि फ़ाइल (JPG/PNG) चुनें।' : 'Please select a valid image file (JPG or PNG).');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const compressed = await compressImageToDataUrl(file);
      if (compressed.length > BLUEPRINT_LIMITS.FOUNDER_PHOTO_MAX) {
        setErrorMsg(
          lang === 'hi'
            ? 'फोटो बहुत बड़ी है। कृपया छोटी छवि चुनें।'
            : 'Image is too large after compression. Please choose a smaller photo.'
        );
        return;
      }

      if (isAdmin) {
        await saveFounderProfilePhoto(compressed);
        try {
          window.localStorage.removeItem(LOCAL_PREVIEW_KEY);
        } catch {
          // ignore storage restriction
        }
        setLocalPreview('');
        setStatusMsg(
          lang === 'hi'
            ? 'फोटो सुरक्षित रूप से सहेजी गई और सभी उपयोगकर्ताओं के लिए लाइव है।'
            : 'Photo saved to Cloud Firestore and published for all visitors.'
        );
      } else {
        try {
          window.localStorage.setItem(LOCAL_PREVIEW_KEY, compressed);
        } catch {
          // ignore storage restriction
        }
        setLocalPreview(compressed);
        setStatusMsg(
          lang === 'hi'
            ? 'फोटो पूर्वावलोकन सहेजा गया। सभी के लिए लाइव करने हेतु एडमिन (msingh409911@gmail.com) से लॉग इन करें।'
            : 'Preview saved in this browser. Sign in as Admin to publish globally for all visitors.'
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      if (isAdmin && founderSettings?.photoUrl) {
        await saveFounderProfilePhoto('');
      }
      try {
        window.localStorage.removeItem(LOCAL_PREVIEW_KEY);
      } catch {
        // ignore storage restriction
      }
      setLocalPreview('');
      setStatusMsg(lang === 'hi' ? 'फोटो हटा दी गई है।' : 'Photo removed.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not remove photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      {/* Photo Frame & Upload Option (No random person's photo) */}
      <div className="md:col-span-4 flex flex-col items-center md:items-start gap-3">
        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative">
          {activePhotoUrl ? (
            <img
              src={activePhotoUrl}
              alt="Manish Singh Rajpoot — Founder & Owner, Rozgar Setu MSR"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
              <div className="w-16 h-16 rounded-full bg-slate-200/80 text-slate-600 flex items-center justify-center">
                <UserRound className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold tracking-wide text-slate-800">MSR</div>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'असली फोटो यहाँ अपलोड करें' : 'Upload real founder photo'}
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
          >
            {activePhotoUrl ? <Camera className="w-3.5 h-3.5 text-orange-600" /> : <Upload className="w-3.5 h-3.5 text-orange-600" />}
            {uploading
              ? lang === 'hi'
                ? 'प्रोसेसिंग...'
                : 'Uploading...'
              : activePhotoUrl
              ? lang === 'hi'
                ? 'फोटो बदलें'
                : 'Change Photo'
              : lang === 'hi'
              ? 'फोटो अपलोड करें'
              : 'Upload Photo'}
          </button>

          {activePhotoUrl && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemovePhoto}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'hi' ? 'हटाएं' : 'Remove'}
            </button>
          )}
        </div>

        {statusMsg && (
          <div className="flex items-start gap-1.5 text-xs text-emerald-700 max-w-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {statusMsg}{' '}
              {!isAdmin && localPreview && (
                <button
                  type="button"
                  onClick={onRequestAdminLogin}
                  className="underline font-semibold text-blue-700 cursor-pointer"
                >
                  {lang === 'hi' ? 'एडमिन लॉगिन' : 'Admin Sign In'}
                </button>
              )}
            </span>
          </div>
        )}

        {errorMsg && <p className="text-xs text-red-600 max-w-xs">{errorMsg}</p>}
      </div>

      {/* Founder & Owner Details */}
      <div className="md:col-span-8 space-y-3">
        <p className="text-xs font-semibold text-orange-600">{t.founderHeading}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Manish Singh Rajpoot</h3>
            <a href="mailto:rozgarsetumsrofficial@gmail.com" className="text-sm font-medium text-blue-700 hover:underline">rozgarsetumsrofficial@gmail.com</a>
        <p className="text-sm font-semibold text-blue-700">
          {t.founderRole} · {t.founderOrg}
        </p>
        <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
          “{t.founderQuote}”
        </blockquote>
        <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            {lang === 'hi' ? 'उम्मीदवार आवेदन: 100% मुफ्त' : 'Candidate Applications: 100% Free'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            {lang === 'hi' ? '28 राज्यों और 8 केंद्र शासित प्रदेशों में सेवा' : 'Pan-India Coverage'}
          </span>
        </div>
      </div>
    </div>
  );
};
