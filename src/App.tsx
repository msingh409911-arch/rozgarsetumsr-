import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Filter,
  Globe,
  IndianRupee,
  LogOut,
  MapPin,
  Menu,
  Search,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { CandidateDashboard } from './components/CandidateDashboard';
import { CompanyDashboard } from './components/CompanyDashboard';
import { FounderSection } from './components/FounderSection';
import { JobDetailsModal } from './components/JobDetailsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PlanCheckoutModal } from './components/PlanCheckoutModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SuperAIHome } from './components/SuperAIHome';
import { EducationHome } from './components/EducationHome';
import { auth } from './firebase';
import { CATEGORY_LABELS_HI, formatSalaryInr, JOB_TYPE_LABELS_HI, translations } from './i18n';
import {
  getUserProfile,
  subscribeAllApplicationsAdmin,
  subscribeAllJobsAdmin,
  subscribeAllPlanOrdersAdmin,
  subscribeAllUsers,
  getApprovedJobById,
  subscribeApprovedJobs,
  subscribeCandidateApplications,
  subscribeCompanyApplications,
  subscribeCompanyJobs,
  subscribeCompanyPlanOrders,
  subscribeFounderProfile,
} from './services/firestoreService';
import {
  ADMIN_EMAIL,
  INDIA_CITIES,
  JOB_CATEGORIES,
  JOB_PLANS,
  JOB_TYPES,
  SALARY_FILTERS,
  type FounderProfileSettings,
  type JobApplication,
  type JobCategory,
  type JobListing,
  type JobType,
  type Language,
  type PaidPlanTier,
  type PlanOrder,
  type UserProfile,
  type UserRole,
} from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // View & Navigation State
  const [view, setView] = useState<'portal' | 'dashboard'>('portal');
  const [superSection, setSuperSection] = useState<'home' | 'jobs' | 'education' | 'schools'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Auth & Profile State
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Modals State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<UserRole>('candidate');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [publicJobId, setPublicJobId] = useState<string | null>(() => window.location.pathname.match(/^\/jobs\/([a-zA-Z0-9_-]+)\/?$/)?.[1] || null);
  const [publicJob, setPublicJob] = useState<JobListing | null>(null);
  const [publicJobLoading, setPublicJobLoading] = useState(false);
  const [checkoutPlanTier, setCheckoutPlanTier] = useState<PaidPlanTier | null>(null);

  // Live Firestore Data
  const [founderSettings, setFounderSettings] = useState<FounderProfileSettings | null>(null);
  const [approvedJobs, setApprovedJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [candidateApps, setCandidateApps] = useState<JobApplication[]>([]);
  const [companyJobs, setCompanyJobs] = useState<JobListing[]>([]);
  const [companyApps, setCompanyApps] = useState<JobApplication[]>([]);
  const [companyOrders, setCompanyOrders] = useState<PlanOrder[]>([]);

  // Admin Data
  const [adminJobs, setAdminJobs] = useState<JobListing[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminApps, setAdminApps] = useState<JobApplication[]>([]);
  const [adminOrders, setAdminOrders] = useState<PlanOrder[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSalary, setSelectedSalary] = useState<string>('all');
  const [selectedJobType, setSelectedJobType] = useState<string>('all');

  const isAdmin = Boolean(
    firebaseUser && firebaseUser.emailVerified && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL
  );

  // Public job URL navigation
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/^\/jobs\/([a-zA-Z0-9_-]+)\/?$/);
      setPublicJobId(match?.[1] || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load one approved job for its public page
  useEffect(() => {
    let cancelled = false;
    if (!publicJobId) {
      setPublicJob(null);
      setPublicJobLoading(false);
      return;
    }
    setPublicJobLoading(true);
    getApprovedJobById(publicJobId)
      .then((job) => { if (!cancelled) setPublicJob(job); })
      .catch(() => { if (!cancelled) setPublicJob(null); })
      .finally(() => { if (!cancelled) setPublicJobLoading(false); });
    return () => { cancelled = true; };
  }, [publicJobId]);

  // 1. Firebase Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setProfileLoading(true);
        try {
          const prof = await getUserProfile(user.uid);
          setUserProfile(prof);
          const userIsAdmin = Boolean(user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
          if (prof || userIsAdmin) {
            setAuthModalOpen(false);
          } else {
            // Newly authenticated user needs one-time profile setup
            setAuthModalOpen(true);
          }
        } finally {
          setProfileLoading(false);
          setAuthReady(true);
        }
      } else {
        setUserProfile(null);
        setView('portal');
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // 2. Public Approved Jobs & Founder Settings Listeners
  useEffect(() => {
    setJobsLoading(true);
    const unsubJobs = subscribeApprovedJobs((jobs) => {
      setApprovedJobs(jobs);
      setJobsLoading(false);
    });
    const unsubFounder = subscribeFounderProfile(setFounderSettings);
    return () => {
      unsubJobs();
      unsubFounder();
    };
  }, []);

  // 3. Role-Specific Real-Time Listeners
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setCandidateApps([]);
      setCompanyJobs([]);
      setCompanyApps([]);
      setCompanyOrders([]);
      setAdminJobs([]);
      setAdminUsers([]);
      setAdminApps([]);
      setAdminOrders([]);
      return;
    }

    const unsubs: Array<() => void> = [];

    if (isAdmin) {
      unsubs.push(subscribeAllJobsAdmin(setAdminJobs));
      unsubs.push(subscribeAllUsers(setAdminUsers));
      unsubs.push(subscribeAllApplicationsAdmin(setAdminApps));
      unsubs.push(subscribeAllPlanOrdersAdmin(setAdminOrders));
    } else if (userProfile?.role === 'company') {
      unsubs.push(subscribeCompanyJobs(firebaseUser.uid, setCompanyJobs));
      unsubs.push(subscribeCompanyApplications(firebaseUser.uid, setCompanyApps));
      unsubs.push(subscribeCompanyPlanOrders(firebaseUser.uid, setCompanyOrders));
    } else if (userProfile?.role === 'candidate') {
      unsubs.push(subscribeCandidateApplications(firebaseUser.uid, setCandidateApps));
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser, userProfile?.role, isAdmin]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const salaryBand = SALARY_FILTERS.find((s) => s.id === selectedSalary) ?? SALARY_FILTERS[0];

    return approvedJobs.filter((job) => {
      if (q) {
        const hay = `${job.title} ${job.companyName} ${job.locationCity} ${job.locationState} ${job.category} ${job.requirements}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCategory !== 'all' && job.category !== selectedCategory) return false;
      if (selectedCity !== 'all' && job.locationCity !== selectedCity) return false;
      if (selectedJobType !== 'all' && job.jobType !== selectedJobType) return false;
      if (selectedSalary !== 'all') {
        if (job.salaryMax < salaryBand.min) return false;
        if (salaryBand.max !== Infinity && job.salaryMin > salaryBand.max) return false;
      }
      return true;
    });
  }, [approvedJobs, searchQuery, selectedCategory, selectedCity, selectedSalary, selectedJobType]);

  const appliedJobIds = useMemo(() => new Set(candidateApps.map((a) => a.jobId)), [candidateApps]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedSalary('all');
    setSelectedJobType('all');
  };

  const openPublicJobPage = (jobId: string) => {
    window.history.pushState({}, "", `/jobs/${encodeURIComponent(jobId)}`);
    setPublicJobId(jobId);
    setSelectedJob(null);
    window.scrollTo(0, 0);
  };

  const openAuthForRole = (role: UserRole) => {
    setAuthModalInitialRole(role);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleSelectPlan = (tier: PaidPlanTier) => {
    if (!firebaseUser || !userProfile) {
      openAuthForRole('company');
      return;
    }
    if (userProfile.role !== 'company' && !isAdmin) {
      openAuthForRole('company');
      return;
    }
    setCheckoutPlanTier(tier);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setView('portal');
    setMobileMenuOpen(false);
  };

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const prof = await getUserProfile(firebaseUser.uid);
    setUserProfile(prof);
    if (prof) {
      setAuthModalOpen(false);
      setView('dashboard');
    }
  };

  const scrollToSection = (sectionId: string) => {
    setView('portal');
    setSuperSection('jobs');
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const pendingUserNeedingProfile =
    firebaseUser && !profileLoading && !userProfile && !isAdmin ? firebaseUser : null;

  if (publicJobId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-white border-b border-slate-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Rozgar Setu MSR</h1>
            <button onClick={() => { window.history.pushState({}, "", "/"); setPublicJobId(null); }} className="text-sm text-blue-700 font-semibold">All Jobs</button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-4 sm:p-8">
          {publicJobLoading ? (
            <div className="bg-white rounded-xl p-8 text-center">Loading job details...</div>
          ) : !publicJob ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold">Job not found</h2>
              <p className="mt-2 text-slate-600">This job may no longer be available or has not been approved.</p>
              <button onClick={() => { window.history.pushState({}, "", "/"); setPublicJobId(null); }} className="mt-4 px-5 py-2 rounded-lg bg-blue-700 text-white">Browse all jobs</button>
            </div>
          ) : (
            <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">{publicJob.category} · {publicJob.jobType}</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2">{publicJob.title}</h2>
              <p className="text-lg text-slate-700 mt-2">{publicJob.companyName}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                <p><strong>Location:</strong> {publicJob.locationCity}, {publicJob.locationState}</p>
                <p><strong>Salary:</strong> {formatSalaryInr(publicJob.salaryMin, publicJob.salaryMax, lang)}</p>
                <p><strong>Experience:</strong> {publicJob.experienceLevel}</p>
                <p><strong>Openings:</strong> {publicJob.openings}</p>
              </div>
              <section className="mt-8">
                <h3 className="text-lg font-bold">Job Description</h3>
                <p className="mt-2 text-slate-700 whitespace-pre-wrap">{publicJob.description}</p>
              </section>
              <section className="mt-6">
                <h3 className="text-lg font-bold">Requirements</h3>
                <p className="mt-2 text-slate-700 whitespace-pre-wrap">{publicJob.requirements}</p>
              </section>
              <button onClick={() => { window.history.pushState({}, "", "/"); setPublicJobId(null); setSelectedJob(publicJob); window.scrollTo(0, 0); }} className="mt-8 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold">Apply for this Job</button>
            </article>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <OfflineIndicator lang={lang} />
      {/* ── Top Navigation Bar (Strict 3-Zone Contract) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
              type="button"
              onClick={() => { setView('portal'); setSuperSection('home'); }}
              className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <img src="/rozgar-setu-msr-logo.png" alt="Rozgar Setu MSR Logo" className="h-11 w-11 object-contain rounded-full" />
              <span>{t.brand}</span>
            </button>

          {/* Zone 2: 4-5 Concise Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => scrollToSection('jobs-board')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navJobs}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('plans')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navPlans}
            </button>
            <button
              type="button"
              onClick={() => {
                if (userProfile?.role === 'company' || isAdmin) {
                  setView('dashboard');
                } else {
                  openAuthForRole('company');
                }
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navCompanies}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navAbout}
            </button>
            {firebaseUser && (userProfile || isAdmin) && (
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  view === 'dashboard' ? 'text-orange-600 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                {t.navDashboard}
              </button>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            {firebaseUser ? (
              <button
                type="button"
                onClick={view === 'dashboard' ? handleSignOut : () => setView('dashboard')}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {view === 'dashboard' ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    {t.signOutBtn}
                  </>
                ) : (
                  <>
                    {isAdmin && <Shield className="w-3.5 h-3.5 text-orange-400" />}
                    {t.navDashboard}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthForRole('candidate')}
                className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.signInBtn}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="md:hidden p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            <button
              type="button"
              onClick={() => scrollToSection('jobs-board')}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.navJobs}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('plans')}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.navPlans}
            </button>
            <button
              type="button"
              onClick={() => openAuthForRole('company')}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.navCompanies}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.navAbout}
            </button>

            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  <Globe className="w-3.5 h-3.5 text-orange-600" />
                  {t.langSwitch}
                </button>
                <PWAInstallButton lang={lang} variant="compact" />
              </div>

              {firebaseUser ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                  >
                    {t.navDashboard}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700"
                  >
                    {t.signOutBtn}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthForRole('candidate')}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold"
                >
                  {t.signInBtn}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        {view === 'dashboard' && firebaseUser ? (
          isAdmin ? (
            <AdminDashboard
              adminUid={firebaseUser.uid}
              adminEmail={firebaseUser.email || ADMIN_EMAIL}
              allJobs={adminJobs}
              allUsers={adminUsers}
              allApplications={adminApps}
              allPlanOrders={adminOrders}
              lang={lang}
            />
          ) : userProfile?.role === 'company' ? (
            <CompanyDashboard
              profile={userProfile}
              companyJobs={companyJobs}
              applications={companyApps}
              planOrders={companyOrders}
              lang={lang}
              onBuyPlan={(tier) => setCheckoutPlanTier(tier)}
            />
          ) : userProfile?.role === 'candidate' ? (
            <CandidateDashboard
              profile={userProfile}
              applications={candidateApps}
              lang={lang}
              onBrowseJobs={() => setView('portal')}
              onProfileUpdated={refreshProfile}
            />
          ) : (
            <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
              <p className="text-sm text-slate-600">
                {lang === 'hi'
                  ? 'जारी रखने के लिए अपनी उम्मीदवार या कंपनी प्रोफ़ाइल पूरी करें।'
                  : 'Complete your Candidate or Company profile to access your dashboard.'}
              </p>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold cursor-pointer"
              >
                {t.completeProfileTitle}
              </button>
            </div>
          )
        ) : superSection === 'home' ? (
          <SuperAIHome
            onOpenJobs={() => setSuperSection('jobs')}
            onOpenEducation={() => setSuperSection('education')}
            onOpenSchools={() => setSuperSection('schools')}
          />
        ) : superSection === 'education' ? (
          <EducationHome onBack={() => setSuperSection('home')} />
        ) : superSection === 'schools' ? (
          <section className="min-h-[70vh] bg-gradient-to-br from-orange-950 to-rose-800 text-white px-5 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-black">School Promotion</h1>
              <p className="mt-4 text-lg">स्कूल प्रचार, एडमिशन और अभिभावकों से संपर्क</p>
              <p className="mt-3 text-sm text-orange-100">स्कूल रजिस्ट्रेशन और विज्ञापन सुविधाएँ अगले चरण में जोड़ी जाएँगी।</p>
              <button onClick={() => setSuperSection('home')} className="mt-8 rounded-xl bg-white px-6 py-3 font-bold text-orange-900">मुख्य होम पर जाएँ</button>
            </div>
          </section>
        ) : (
          <> 
            {/* ── Hero Section ── */}
            <section className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
                {/* Language Switch & Regional Kicker Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <p className="text-xs sm:text-sm font-medium text-slate-600">{t.heroKicker}</p>
                  <button
                    type="button"
                    onClick={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-orange-600" />
                    {t.langSwitch}
                  </button>
                </div>

                {/* Balanced 2-Column Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                    <h1
                      className="font-bold tracking-tight text-slate-900 leading-[1.12] text-balance max-w-2xl"
                      style={{ fontSize: 'clamp(2.1rem, 4vw, 3.35rem)' }}
                    >
                      {t.heroHeadline}
                    </h1>
                    <p className="text-base text-slate-600 leading-relaxed max-w-2xl">{t.heroSub}</p>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => scrollToSection('jobs-board')}
                        className="px-5 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t.heroCtaBrowse}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (userProfile?.role === 'company') {
                            setView('dashboard');
                          } else {
                            openAuthForRole('company');
                          }
                        }}
                        className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t.heroCtaPost}
                      </button>
                      <PWAInstallButton lang={lang} variant="hero" />
                    </div>

                    {/* Quick Search Bar */}
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5 flex items-center gap-2 px-3 bg-white border border-slate-200 rounded-lg">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t.searchPlaceholder}
                          className="w-full py-2.5 text-sm bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4 flex items-center gap-2 px-3 bg-white border border-slate-200 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full py-2.5 text-sm bg-transparent focus:outline-none"
                        >
                          <option value="all">{t.allCities}</option>
                          {INDIA_CITIES.map((c) => (
                            <option key={c.city} value={c.city}>
                              {c.city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => scrollToSection('jobs-board')}
                        className="sm:col-span-3 py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {t.searchBtn}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-50 via-slate-100 to-blue-50">
                      <img
                        src="/src/assets/images/hero_india_career_1795605159105.jpg"
                        alt="Indian professionals collaborating in a modern workplace"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Pan-India Jobs Marketplace ── */}
            <section id="jobs-board" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {lang === 'hi' ? 'सत्यापित नौकरियाँ' : 'Verified Pan-India Openings'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
                    {t.showingJobs} <span className="font-semibold text-slate-900">{filteredJobs.length}</span>{' '}
                    {t.jobsAvailable}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen((prev) => !prev)}
                    className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    {t.filtersTitle}
                  </button>
                  {(searchQuery ||
                    selectedCategory !== 'all' ||
                    selectedCity !== 'all' ||
                    selectedSalary !== 'all' ||
                    selectedJobType !== 'all') && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-orange-700 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                      {t.resetFilters}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Filter Sidebar */}
                <aside
                  className={`lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-5 ${
                    mobileFiltersOpen ? 'block' : 'hidden lg:block'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">{t.filtersTitle}</h3>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                    >
                      {t.resetFilters}
                    </button>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.filterCategory}</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">{t.allCategories}</option>
                      {JOB_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {lang === 'hi' ? CATEGORY_LABELS_HI[cat] : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.filterLocation}</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">{t.allCities}</option>
                      {INDIA_CITIES.map((c) => (
                        <option key={c.city} value={c.city}>
                          {c.city} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Salary Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.filterSalary}</label>
                    <div className="space-y-1.5">
                      {SALARY_FILTERS.map((band) => (
                        <button
                          key={band.id}
                          type="button"
                          onClick={() => setSelectedSalary(band.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedSalary === band.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {t.salaryOptions[band.id]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Job Type Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.filterJobType}</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedJobType('all')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer ${
                          selectedJobType === 'all'
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {t.allJobTypes}
                      </button>
                      {JOB_TYPES.map((jt) => (
                        <button
                          key={jt}
                          type="button"
                          onClick={() => setSelectedJobType(jt)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer ${
                            selectedJobType === jt
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {lang === 'hi' ? JOB_TYPE_LABELS_HI[jt] : jt}
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                {/* Job Results Column */}
                <div className="lg:col-span-9 space-y-4">
                  {jobsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse space-y-3">
                          <div className="h-3 w-48 bg-slate-200 rounded" />
                          <div className="h-5 w-72 bg-slate-200 rounded" />
                          <div className="h-4 w-full bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                      <Briefcase className="w-9 h-9 text-slate-400 mx-auto" />
                      <h3 className="text-lg font-bold text-slate-900">{t.noJobsTitle}</h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto">{t.noJobsSub}</p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          {t.resetFilters}
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setView('dashboard')}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                          >
                            {t.navDashboard}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const alreadyApplied = appliedJobIds.has(job.id);
                      const catText = lang === 'hi' ? CATEGORY_LABELS_HI[job.category] : job.category;
                      const typeText = lang === 'hi' ? JOB_TYPE_LABELS_HI[job.jobType] : job.jobType;

                      return (
                        <article
                          key={job.id}
                          className={`bg-white border rounded-xl p-6 transition-colors hover:border-slate-300 ${
                            job.isFeatured ? 'border-slate-200 border-t-2 border-t-orange-500' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                              {/* Unboxed clean metadata line */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="font-semibold text-blue-700">{catText}</span>
                                <span aria-hidden="true">·</span>
                                <span>{typeText}</span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">
                                  {job.openings} {t.openingsLabel}
                                </span>
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

                              <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                                  <Building2 className="w-4 h-4 text-slate-400" />
                                  {job.companyName}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  {job.locationCity}, {job.locationState}
                                </span>
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-900 tabular-nums">
                                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                                  {formatSalaryInr(job.salaryMin, job.salaryMax, lang)}
                                </span>
                              </div>

                              <p className="text-sm text-slate-600 line-clamp-2 pt-1">{job.description}</p>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedJob(job)}
                                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  alreadyApplied
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-orange-600 text-white hover:bg-orange-700'
                                }`}
                              >
                                {alreadyApplied ? t.alreadyApplied : t.applyFreeBtn}
                              </button>
                              <a href={`/jobs/${encodeURIComponent(job.id)}`}
                                
                                onClick={(event) => { event.preventDefault(); openPublicJobPage(job.id); }}
                                className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline whitespace-nowrap cursor-pointer"
                              >
                                {t.viewDetailsBtn}
                              </a>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* ── Job Posting Plans Section ── */}
            <section id="plans" className="bg-white border-y border-slate-200 py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="max-w-2xl mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">{t.plansHeading}</h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">{t.plansSub}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(['basic_99', 'featured_199', 'monthly_499'] as PaidPlanTier[]).map((tier) => {
                    const plan = JOB_PLANS[tier];
                    const isPopular = tier === 'monthly_499';
                    return (
                      <div
                        key={tier}
                        className={`rounded-2xl p-6 sm:p-7 border flex flex-col justify-between ${
                          isPopular
                            ? 'border-blue-700 bg-slate-900 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold ${
                                isPopular ? 'text-orange-400' : 'text-blue-700'
                              }`}
                            >
                              {lang === 'hi' ? plan.audienceHi : plan.audienceEn}
                            </span>
                            {isPopular && (
                              <span className="text-xs font-semibold text-orange-400">{t.mostPopular}</span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold mt-1">{lang === 'hi' ? plan.nameHi : plan.nameEn}</h3>

                          <div className="mt-4 pb-5 border-b border-current/15 flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold font-mono-num">₹{plan.priceInr}</span>
                            <span className={`text-xs ${isPopular ? 'text-slate-300' : 'text-slate-500'}`}>
                              / {plan.credits} {lang === 'hi' ? 'जॉब पोस्ट' : plan.credits > 1 ? 'jobs' : 'job'} ·{' '}
                              {plan.durationDays} {lang === 'hi' ? 'दिन' : 'days'}
                            </span>
                          </div>

                          <ul className="space-y-3 my-6">
                            {(lang === 'hi' ? plan.featuresHi : plan.featuresEn).map((feat) => (
                              <li key={feat} className="text-sm flex items-start gap-2.5">
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    isPopular ? 'text-orange-400' : 'text-emerald-600'
                                  }`}
                                />
                                <span className={isPopular ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectPlan(tier)}
                          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                            isPopular
                              ? 'bg-orange-600 text-white hover:bg-orange-700'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {t.selectPlanBtn}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Pan-India Reach & Founder Leadership Section ── */}
            <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 min-h-[280px] sm:min-h-[340px] flex items-end bg-slate-900">
                <img
                  src="/src/assets/images/banner_indian_industries_1795605159593.jpg"
                  alt="Modern Indian business and technology campus at golden hour"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
                <div className="relative z-10 p-6 sm:p-10 max-w-2xl text-white">
                  <h2 className="text-2xl sm:text-3xl font-bold text-balance">{t.enterpriseHeading}</h2>
                  <p className="text-sm sm:text-base text-slate-200 mt-2 leading-relaxed">{t.enterpriseSub}</p>
                </div>
              </div>

              {/* Founder & Owner Profile Section */}
              <FounderSection
                lang={lang}
                founderSettings={founderSettings}
                isAdmin={isAdmin}
                onRequestAdminLogin={() => openAuthForRole('candidate')}
              />
            </section>
          </>
        )}
      </main>

      {/* ── Quiet Footer ── */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="text-base font-bold text-white">{t.brand}</div>
            <p className="text-xs text-slate-400 mt-1">{t.footerTagline}</p>
            <p className="text-xs font-medium text-slate-200 mt-1">{t.footerCreatedBy}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <button
              type="button"
              onClick={() => scrollToSection('jobs-board')}
              className="hover:text-white cursor-pointer"
            >
              {t.navJobs}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('plans')}
              className="hover:text-white cursor-pointer"
            >
              {t.navPlans}
            </button>
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
              className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              {t.langSwitch}
            </button>
            <PWAInstallButton lang={lang} variant="compact" />
            <details className="text-xs text-slate-300 max-w-xl">
  <summary className="cursor-pointer hover:text-white font-semibold">पंजीकरण एवं कानूनी स्थिति</summary>
  <div className="mt-3 space-y-2 leading-relaxed">
    <p>रोजगार सेतु MSR एक स्वतंत्र रोजगार सहायता मंच है, जिसकी स्थापना Manish Singh Rajpoot द्वारा की गई है।</p>
    <p>इस मंच के कानूनी पंजीकरण या सरकारी मान्यता का कोई प्रमाण वर्तमान में प्रस्तुत नहीं किया गया है। इसलिए इसे सरकारी पोर्टल या पंजीकृत कंपनी के रूप में प्रस्तुत नहीं किया जाता।</p>
    <p>उम्मीदवारों के लिए नौकरी आवेदन निःशुल्क हैं। उम्मीदवारों से अनुरोध है कि वे अपनी व्यक्तिगत एवं बैंकिंग जानकारी साझा करते समय सावधानी बरतें।</p>
    <p>हमारा उद्देश्य पारदर्शिता के साथ नौकरी खोजने वालों और नियोक्ताओं को जोड़ना है।</p>
  </div>
</details>
<span className="text-slate-500">
              © {new Date().getFullYear()} Rozgar Setu MSR. {t.footerRights}
            </span>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      <AuthModal
        isOpen={authModalOpen}
        initialRole={authModalInitialRole}
        lang={lang}
        pendingUserNeedingProfile={pendingUserNeedingProfile}
        onClose={() => setAuthModalOpen(false)}
        onProfileCompleted={refreshProfile}
      />

      <JobDetailsModal
        job={selectedJob}
        lang={lang}
        firebaseUser={firebaseUser}
        userProfile={userProfile}
        hasAlreadyApplied={selectedJob ? appliedJobIds.has(selectedJob.id) : false}
        onClose={() => setSelectedJob(null)}
        onRequireAuth={() => {
          setSelectedJob(null);
          openAuthForRole('candidate');
        }}
        onAppliedSuccess={() => {
          // Real-time listener updates candidateApps automatically
        }}
      />

      {firebaseUser && userProfile && (
        <PlanCheckoutModal
          planTier={checkoutPlanTier}
          companyId={firebaseUser.uid}
          companyName={userProfile.companyName || userProfile.fullName}
          lang={lang}
          onClose={() => setCheckoutPlanTier(null)}
          onSuccess={() => {
            setCheckoutPlanTier(null);
            setView('dashboard');
          }}
        />
      )}
    </div>
  );
}
