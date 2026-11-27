import React, { useState } from 'react';
import { Briefcase, CheckCircle2, ExternalLink, MapPin, Save, Trash2, User } from 'lucide-react';
import { APP_STATUS_LABELS, translations } from '../i18n';
import { updateUserProfile, withdrawApplication } from '../services/firestoreService';
import {
  BLUEPRINT_LIMITS,
  INDIA_CITIES,
  INDIA_STATES,
  type JobApplication,
  type Language,
  type UserProfile,
} from '../types';

interface CandidateDashboardProps {
  profile: UserProfile;
  applications: JobApplication[];
  lang: Language;
  onBrowseJobs: () => void;
  onProfileUpdated: () => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  profile,
  applications,
  lang,
  onBrowseJobs,
  onProfileUpdated,
}) => {
  const t = translations[lang];
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city || 'Bengaluru');
  const [stateName, setStateName] = useState(profile.state || 'Karnataka');
  const [skills, setSkills] = useState(profile.skills);
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears);
  const [resumeUrl, setResumeUrl] = useState(profile.resumeUrl);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await updateUserProfile(profile.uid, {
        fullName,
        phone,
        city,
        state: stateName,
        skills,
        experienceYears,
        resumeUrl,
        companyName: profile.companyName,
        industry: profile.industry,
        companyDescription: profile.companyDescription,
      });
      setSavedNotice(true);
      onProfileUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (appId: string) => {
    await withdrawApplication(appId);
  };

  const statusTone = (status: JobApplication['status']) => {
    switch (status) {
      case 'hired':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'shortlisted':
      case 'interview':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-orange-600">{t.roleCandidate}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            {lang === 'hi' ? `नमस्ते, ${profile.fullName}` : `Welcome, ${profile.fullName}`}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'hi'
              ? 'अपनी प्रोफ़ाइल अपडेट करें और अपने मुफ्त नौकरी आवेदनों की स्थिति ट्रैक करें।'
              : 'Manage your career profile and track all your free job applications across India.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBrowseJobs}
          className="px-4 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {t.heroCtaBrowse}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'कुल आवेदन' : 'Applications Sent'}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{applications.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'शॉर्टलिस्ट / इंटरव्यू' : 'Shortlisted & Interviews'}</div>
          <div className="text-2xl font-bold text-blue-700 mt-1 tabular-nums">
            {applications.filter((a) => a.status === 'shortlisted' || a.status === 'interview').length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'चयनित ऑफर' : 'Hired / Offers'}</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {applications.filter((a) => a.status === 'hired').length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'आवेदन शुल्क' : 'Candidate Fee'}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono-num">₹0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Applications List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-600" />
              {lang === 'hi' ? 'मेरे नौकरी आवेदन' : 'My Job Applications'}
            </h2>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                {lang === 'hi' ? 'अभी तक कोई आवेदन नहीं किया गया है' : 'No job applications yet'}
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {lang === 'hi'
                  ? 'भारत भर की सैकड़ों सत्यापित नौकरियों के लिए मुफ्त आवेदन करें।'
                  : 'Explore live openings across India and apply completely free.'}
              </p>
              <button
                type="button"
                onClick={onBrowseJobs}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                {t.heroCtaBrowse}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {applications.map((app) => (
                <div key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate">{app.jobTitle}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-700">{app.companyName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {app.candidateCity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${statusTone(
                        app.status
                      )}`}
                    >
                      {APP_STATUS_LABELS[app.status][lang]}
                    </span>
                    {app.status !== 'hired' && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(app.id)}
                        title={t.withdrawBtn}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-700" />
                {lang === 'hi' ? 'मेरी उम्मीदवार प्रोफ़ाइल' : 'Candidate Profile'}
              </h2>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === 'hi' ? 'सहेजा गया' : 'Saved'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.fullNameLabel}</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.NAME_MAX}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.phoneLabel}</label>
                <input
                  type="tel"
                  maxLength={BLUEPRINT_LIMITS.PHONE_MAX}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.cityLabel}</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {INDIA_CITIES.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.stateLabel}</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.skillsLabel}</label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.SKILLS_MAX}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.resumeLabel}</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  maxLength={BLUEPRINT_LIMITS.RESUME_URL_MAX}
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900"
                    title="Open Resume"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {t.saveProfileBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
