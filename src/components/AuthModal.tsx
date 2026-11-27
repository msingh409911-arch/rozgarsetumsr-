import React, { useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { Briefcase, Building2, CheckCircle2, Mail, ShieldCheck, UserCheck, X } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { translations } from '../i18n';
import { createUserProfile } from '../services/firestoreService';
import {
  BLUEPRINT_LIMITS,
  INDIA_CITIES,
  INDIA_STATES,
  type Language,
  type UserRole,
} from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: UserRole;
  lang: Language;
  pendingUserNeedingProfile: User | null;
  onClose: () => void;
  onProfileCompleted: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialRole = 'candidate',
  lang,
  pendingUserNeedingProfile,
  onClose,
  onProfileCompleted,
}) => {
  const t = translations[lang];
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phoneLoginNumber, setPhoneLoginNumber] = useState('' );
  const [otpCode, setOtpCode] = useState('' );
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Onboarding profile fields
  const [fullName, setFullName] = useState(pendingUserNeedingProfile?.displayName ?? '');

  useEffect(() => {
    if (isOpen && !pendingUserNeedingProfile) {
      setSelectedRole(initialRole);
      setErrorMsg(null);
      setInfoMsg(null);
    }
  }, [isOpen, initialRole, pendingUserNeedingProfile]);

  useEffect(() => {
    if (pendingUserNeedingProfile?.displayName) {
      setFullName(pendingUserNeedingProfile.displayName);
    }
    if (pendingUserNeedingProfile?.phoneNumber) {
      setPhone(pendingUserNeedingProfile.phoneNumber);
    }
  }, [pendingUserNeedingProfile]);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [resumeUrl, setResumeUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('IT & Software');
  const [companyDescription, setCompanyDescription] = useState('');

  if (!isOpen) return null;

  const isOnboarding = Boolean(pendingUserNeedingProfile);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth listener in App.tsx will detect profile existence and either close modal or trigger onboarding
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setErrorMsg(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      if (authMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(cred.user);
        setInfoMsg(
          lang === 'hi'
            ? 'सत्यापन ईमेल भेजा गया है। कृपया अपना इनबॉक्स सत्यापित करके पुनः लॉगिन करें।'
            : 'Verification email sent. Please verify your email address before saving your profile.'
        );
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setErrorMsg(
          lang === 'hi'
            ? 'ईमेल/पासवर्ड साइन-इन अभी Firebase Console में सक्रिय नहीं है। कृपया ऊपर "Google से जारी रखें" का उपयोग करें या Firebase Console > Authentication > Sign-in method में Email/Password चालू करें।'
            : 'Email/Password sign-in is not yet enabled in Firebase Console. Use "Continue with Google" above for instant access, or enable Email/Password under Firebase Console > Authentication > Sign-in method.'
        );
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
      }
    } finally {
      setBusy(false);
    }
  };


  const handleSendPhoneOtp = async () => {
    setBusy(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      let digits = phoneLoginNumber.replace(/[^0-9]/g, "");
      if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
      if (digits.length !== 10) {
        setErrorMsg("कृपया सही 10 अंकों का मोबाइल नंबर डालें।");
        return;
      }
      const formattedPhone = "+91" + digits;
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, "phone-recaptcha-container", { size: "normal" });
      }
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
      setConfirmationResult(result);
      setInfoMsg("OTP आपके मोबाइल नंबर पर भेज दिया गया है।");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "OTP भेजने में समस्या हुई।");
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!confirmationResult) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await confirmationResult.confirm(otpCode.trim());
      setInfoMsg("मोबाइल नंबर सत्यापित हो गया।");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "OTP गलत है या समाप्त हो गया है।");
    } finally {
      setBusy(false);
    }
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    const match = INDIA_CITIES.find((c) => c.city === selectedCity);
    if (match) setStateName(match.state);
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserNeedingProfile) return;

    if (!pendingUserNeedingProfile.emailVerified && !pendingUserNeedingProfile.providerData.some((provider) => provider.providerId === "phone")) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया पहले अपना ईमेल सत्यापित करें (Google लॉगिन स्वतः सत्यापित होता है)।'
          : 'Please verify your email address first (Google Sign-In is automatically verified).'
      );
      return;
    }

    if (fullName.trim().length < 2) {
      setErrorMsg(lang === 'hi' ? 'कृपया पूरा नाम दर्ज करें।' : 'Please enter your full name (at least 2 characters).');
      return;
    }
    if (selectedRole === 'company' && companyName.trim().length < 2) {
      setErrorMsg(lang === 'hi' ? 'कृपया कंपनी का नाम दर्ज करें।' : 'Please enter your company name.');
      return;
    }

    setBusy(true);
    setErrorMsg(null);
    try {
      await createUserProfile({
        uid: pendingUserNeedingProfile.uid,
        email: pendingUserNeedingProfile.email || 'user@rozgarsetumsr.in',
        role: selectedRole,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: stateName.trim(),
        skills: selectedRole === 'candidate' ? skills.trim() : '',
        experienceYears: selectedRole === 'candidate' ? Number(experienceYears) || 0 : 0,
        resumeUrl: selectedRole === 'candidate' ? resumeUrl.trim() : '',
        companyName: selectedRole === 'company' ? companyName.trim() : '',
        industry: selectedRole === 'company' ? industry.trim() : '',
        companyDescription: selectedRole === 'company' ? companyDescription.trim() : '',
      });
      onProfileCompleted();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 sm:p-8 my-auto shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isOnboarding ? t.completeProfileTitle : t.authTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {isOnboarding ? t.completeProfileSub : t.authSub}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('candidate')}
            className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              selectedRole === 'candidate'
                ? 'border-orange-600 bg-orange-50/70 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <UserCheck className={`w-5 h-5 ${selectedRole === 'candidate' ? 'text-orange-600' : 'text-slate-400'}`} />
              {selectedRole === 'candidate' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
            </div>
            <span className="text-sm font-semibold">{t.roleCandidate}</span>
            <span className="text-xs text-slate-500">
              {lang === 'hi' ? '100% मुफ्त नौकरी आवेदन' : '100% free job applications'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('company')}
            className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              selectedRole === 'company'
                ? 'border-blue-700 bg-blue-50/70 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Building2 className={`w-5 h-5 ${selectedRole === 'company' ? 'text-blue-700' : 'text-slate-400'}`} />
              {selectedRole === 'company' && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
            </div>
            <span className="text-sm font-semibold">{t.roleCompany}</span>
            <span className="text-xs text-slate-500">
              {lang === 'hi' ? '₹99 से जॉब पोस्टिंग शुरू' : 'Job posts starting at ₹99'}
            </span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
            {infoMsg}
          </div>
        )}

        {!isOnboarding ? (
          <div className="space-y-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              {t.continueGoogle}
            </button>

            <button type="button" onClick={() => setShowPhoneForm(v => !v)} className="w-full py-3 border rounded-xl text-blue-700">मोबाइल नंबर से लॉगिन / रजिस्टर</button>
            {showPhoneForm && <div className="space-y-3 p-3 border rounded-xl"><input type="tel" value={phoneLoginNumber} onChange={e => setPhoneLoginNumber(e.target.value)} placeholder="10 अंकों का मोबाइल नंबर" className="w-full p-3 border rounded-lg" /><div id="phone-recaptcha-container"></div><button type="button" onClick={handleSendPhoneOtp} disabled={busy} className="w-full p-3 bg-blue-600 text-white rounded-lg">OTP भेजें</button>{confirmationResult && <><input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g,""))} maxLength={6} placeholder="6 अंकों का OTP" className="w-full p-3 border rounded-lg" /><button type="button" onClick={handleVerifyPhoneOtp} disabled={busy || otpCode.length!==6} className="w-full p-3 bg-green-600 text-white rounded-lg">OTP सत्यापित करें</button></>}</div>}
            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-slate-200 flex-1" />
              <button
                type="button"
                onClick={() => setShowEmailForm((prev) => !prev)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                {t.orEmail}
              </button>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {showEmailForm && (
              <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                      authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t.registerAction}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                      authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {t.loginAction}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.passwordLabel}</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 px-4 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {authMode === 'register' ? t.registerAction : t.loginAction}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleCompleteProfile} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.fullNameLabel} *</label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_LIMITS.NAME_MAX}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.phoneLabel} *</label>
                <input
                  type="tel"
                  required
                  maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                  placeholder="+91 98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.cityLabel} *</label>
                <select
                  value={city}
                  onChange={(e) => handleCitySelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {INDIA_CITIES.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.stateLabel} *</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRole === 'candidate' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.skillsLabel}</label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.SKILLS_MAX}
                      placeholder="React, Tally, Hindi Typing, Sales"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.expLabel}</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.resumeLabel}</label>
                  <input
                    type="url"
                    maxLength={BLUEPRINT_LIMITS.RESUME_URL_MAX}
                    placeholder="https://drive.google.com/..."
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.companyNameLabel} *</label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.COMPANY_NAME_MAX}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.industryLabel}</label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.INDUSTRY_MAX}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.companyDescLabel}</label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.COMPANY_DESC_MAX}
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Briefcase className="w-4 h-4" />
              {t.saveProfileBtn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
