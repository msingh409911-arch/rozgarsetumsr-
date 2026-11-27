import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { CATEGORY_LABELS_HI, formatSalaryInr, JOB_TYPE_LABELS_HI, translations } from '../i18n';
import { submitJobApplication } from '../services/firestoreService';
import { BLUEPRINT_LIMITS, type JobListing, type Language, type UserProfile } from '../types';

interface JobDetailsModalProps {
  job: JobListing | null;
  lang: Language;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  hasAlreadyApplied: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
  onAppliedSuccess: () => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  lang,
  firebaseUser,
  userProfile,
  hasAlreadyApplied,
  onClose,
  onRequireAuth,
  onAppliedSuccess,
}) => {
  const t = translations[lang];
  const [candidateName, setCandidateName] = useState(userProfile?.fullName || firebaseUser?.displayName || '');
  const [candidatePhone, setCandidatePhone] = useState(userProfile?.phone || '');
  const [candidateCity, setCandidateCity] = useState(userProfile?.city || 'Bengaluru');
  const [experienceYears, setExperienceYears] = useState(userProfile?.experienceYears ?? 0);
  const [resumeUrl, setResumeUrl] = useState(userProfile?.resumeUrl || '');
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setCandidateName(userProfile?.fullName || firebaseUser?.displayName || '');
    setCandidatePhone(userProfile?.phone || '');
    setCandidateCity(userProfile?.city || 'Bengaluru');
    setExperienceYears(userProfile?.experienceYears ?? 0);
    setResumeUrl(userProfile?.resumeUrl || '');
    setCoverNote('');
    setErrorMsg(null);
    setSubmitted(false);
  }, [job?.id, userProfile, firebaseUser?.displayName]);

  if (!job) return null;

  const categoryLabel = lang === 'hi' ? CATEGORY_LABELS_HI[job.category] : job.category;
  const typeLabel = lang === 'hi' ? JOB_TYPE_LABELS_HI[job.jobType] : job.jobType;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireAuth();
      return;
    }
    if (!firebaseUser.emailVerified) {
      setErrorMsg(
        lang === 'hi'
          ? 'आवेदन करने के लिए सत्यापित ईमेल आवश्यक है।'
          : 'A verified email account is required to apply.'
      );
      return;
    }
    if (coverNote.trim().length < 10) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया कम से कम 10 अक्षरों में अपनी उपयुक्तता लिखें।'
          : 'Please write a short cover note (at least 10 characters).'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await submitJobApplication({
        job,
        candidateId: firebaseUser.uid,
        candidateName: candidateName.trim() || userProfile?.fullName || firebaseUser.displayName || 'Candidate',
        candidateEmail: firebaseUser.email || 'candidate@rozgarsetumsr.in',
        candidatePhone: candidatePhone.trim() || '9999999999',
        candidateCity: candidateCity.trim() || 'India',
        experienceYears: Number(experienceYears) || 0,
        resumeUrl: resumeUrl.trim(),
        coverNote: coverNote.trim(),
      });
      setSubmitted(true);
      onAppliedSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl my-auto overflow-hidden shadow-xl">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="font-medium text-blue-700">{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{typeLabel}</span>
              {job.isFeatured && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-orange-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.featuredTag}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{job.title}</h2>
            <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              {job.companyName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close job details"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'वेतन' : 'Salary'}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                {formatSalaryInr(job.salaryMin, job.salaryMax, lang)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'स्थान' : 'Location'}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                {job.locationCity}, {job.locationState}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'अनुभव' : 'Experience'}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{job.experienceLevel}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'रिक्तियाँ' : 'Openings'}
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">{job.openings}</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {lang === 'hi' ? 'नौकरी का विवरण' : 'Role Description'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {lang === 'hi' ? 'योग्यता और कौशल' : 'Requirements & Skills'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.requirements}</p>
          </div>

          <div className="border-t border-slate-200 pt-5">
            {hasAlreadyApplied || submitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">
                    {lang === 'hi' ? 'आपका आवेदन सफलतापूर्वक भेजा गया!' : 'Application Submitted Successfully'}
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    {lang === 'hi'
                      ? 'आप अपने डैशबोर्ड में आवेदन की स्थिति देख सकते हैं। यह सेवा 100% मुफ्त है।'
                      : 'Track live status updates in your Candidate Dashboard. Always 100% free.'}
                  </div>
                </div>
              </div>
            ) : !firebaseUser ? (
              <div className="p-5 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {lang === 'hi' ? 'मुफ्त में आवेदन करने के लिए साइन इन करें' : 'Sign in to Apply Free'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {lang === 'hi'
                      ? 'उम्मीदवारों से कोई शुल्क नहीं लिया जाता। अपना खाता बनाएं या Google से लॉगिन करें।'
                      : 'Candidates never pay a fee on Rozgar Setu MSR. Register or sign in with Google in one click.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="px-4 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.signInBtn}
                </button>
              </div>
            ) : userProfile?.role === 'company' ? (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                {lang === 'hi'
                  ? 'आप कंपनी खाते से लॉग इन हैं। आवेदन करने के लिए उम्मीदवार खाते का उपयोग करें।'
                  : 'You are signed in with a Company account. Switch to a Candidate account to apply for jobs.'}
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-orange-600" />
                    {t.applyModalTitle}
                  </h3>
                  <span className="text-xs font-medium text-emerald-700">
                    {lang === 'hi' ? '₹0 आवेदन शुल्क' : '₹0 Application Fee'}
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.fullNameLabel} *</label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.NAME_MAX}
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.phoneLabel} *</label>
                    <input
                      type="tel"
                      required
                      minLength={6}
                      maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                      placeholder="+91 98XXXXXXXX"
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.cityLabel} *</label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.CITY_MAX}
                      value={candidateCity}
                      onChange={(e) => setCandidateCity(e.target.value)}
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
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.resumeLabel}</label>
                    <input
                      type="url"
                      maxLength={BLUEPRINT_LIMITS.RESUME_URL_MAX}
                      placeholder="https://..."
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t.coverNoteLabel} *</label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    maxLength={BLUEPRINT_LIMITS.COVER_NOTE_MAX}
                    placeholder={
                      lang === 'hi'
                        ? 'अपने अनुभव, कौशल और उपलब्धता के बारे में संक्षेप में लिखें...'
                        : 'Briefly share your relevant skills, work experience, and joining availability...'
                    }
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? lang === 'hi'
                      ? 'भेजा जा रहा है...'
                      : 'Submitting Application...'
                    : t.submitApplicationBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
