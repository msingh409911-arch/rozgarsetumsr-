import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  Edit3,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  APP_STATUS_LABELS,
  CATEGORY_LABELS_HI,
  formatSalaryInr,
  JOB_STATUS_LABELS,
  translations,
} from '../i18n';
import {
  createJobPost,
  deleteJobListing,
  updateApplicationStatus,
  updateJobByCompany,
} from '../services/firestoreService';
import {
  BLUEPRINT_LIMITS,
  EXPERIENCE_LEVELS,
  INDIA_CITIES,
  INDIA_STATES,
  JOB_CATEGORIES,
  JOB_PLANS,
  JOB_TYPES,
  type ApplicationStatus,
  type ExperienceLevel,
  type JobApplication,
  type JobCategory,
  type JobListing,
  type JobType,
  type Language,
  type PaidPlanTier,
  type PlanOrder,
  type UserProfile,
} from '../types';

interface CompanyDashboardProps {
  profile: UserProfile;
  companyJobs: JobListing[];
  applications: JobApplication[];
  planOrders: PlanOrder[];
  lang: Language;
  onBuyPlan: (tier: PaidPlanTier) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  profile,
  companyJobs,
  applications,
  planOrders,
  lang,
  onBuyPlan,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'plans'>('jobs');
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);

  // Job form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<JobCategory>('IT & Software');
  const [locationCity, setLocationCity] = useState(profile.city || 'Bengaluru');
  const [locationState, setLocationState] = useState(profile.state || 'Karnataka');
  const [salaryMin, setSalaryMin] = useState(20000);
  const [salaryMax, setSalaryMax] = useState(40000);
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('1-3 Years');
  const [openings, setOpenings] = useState(2);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilterJobId, setStatusFilterJobId] = useState<string>('all');

  const activeOrders = useMemo(
    () => planOrders.filter((o) => o.status === 'active' && o.creditsTotal - o.creditsUsed > 0),
    [planOrders]
  );

  const totalRemainingCredits = useMemo(
    () => activeOrders.reduce((acc, o) => acc + (o.creditsTotal - o.creditsUsed), 0),
    [activeOrders]
  );

  const openNewJobForm = () => {
    setEditingJob(null);
    setTitle('');
    setCategory('IT & Software');
    setLocationCity(profile.city || 'Bengaluru');
    setLocationState(profile.state || 'Karnataka');
    setSalaryMin(20000);
    setSalaryMax(40000);
    setJobType('Full-time');
    setExperienceLevel('1-3 Years');
    setOpenings(2);
    setDescription('');
    setRequirements('');
    setSelectedOrderId(activeOrders[0]?.id ?? '');
    setFormError(null);
    setShowPostForm(true);
  };

  const openEditJobForm = (job: JobListing) => {
    setEditingJob(job);
    setTitle(job.title);
    setCategory(job.category);
    setLocationCity(job.locationCity);
    setLocationState(job.locationState);
    setSalaryMin(job.salaryMin);
    setSalaryMax(job.salaryMax);
    setJobType(job.jobType);
    setExperienceLevel(job.experienceLevel);
    setOpenings(job.openings);
    setDescription(job.description);
    setRequirements(job.requirements);
    setFormError(null);
    setShowPostForm(true);
  };

  const handleCityChange = (city: string) => {
    setLocationCity(city);
    const match = INDIA_CITIES.find((c) => c.city === city);
    if (match) setLocationState(match.state);
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setFormError(lang === 'hi' ? 'नौकरी का शीर्षक कम से कम 3 अक्षर का हो।' : 'Job title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 20) {
      setFormError(lang === 'hi' ? 'विवरण कम से कम 20 अक्षर का लिखें।' : 'Description must be at least 20 characters.');
      return;
    }
    if (requirements.trim().length < 10) {
      setFormError(lang === 'hi' ? 'योग्यता कम से कम 10 अक्षर की लिखें।' : 'Requirements must be at least 10 characters.');
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      if (editingJob) {
        await updateJobByCompany(editingJob.id, {
          companyName: profile.companyName || profile.fullName,
          title,
          category,
          locationCity,
          locationState,
          salaryMin,
          salaryMax,
          jobType,
          experienceLevel,
          openings,
          description,
          requirements,
          status: 'pending',
        });
      } else {
        const orderToUse = activeOrders.find((o) => o.id === selectedOrderId) || activeOrders[0];
        if (!orderToUse) {
          setFormError(
            lang === 'hi'
              ? 'नया जॉब पोस्ट करने के लिए कृपया पहले ₹99, ₹199 या ₹499 प्लान सक्रिय करें।'
              : 'Please activate a Basic (₹99), Featured (₹199), or Monthly (₹499) plan first to publish a job.'
          );
          setBusy(false);
          return;
        }
        await createJobPost(
          {
            companyId: profile.uid,
            companyName: profile.companyName || profile.fullName,
            title,
            category,
            locationCity,
            locationState,
            salaryMin,
            salaryMax,
            jobType,
            experienceLevel,
            openings,
            description,
            requirements,
            planTier: orderToUse.planTier,
          },
          { activeOrder: orderToUse }
        );
      }
      setShowPostForm(false);
      setEditingJob(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save job post.');
    } finally {
      setBusy(false);
    }
  };

  const handleCloseJob = async (job: JobListing) => {
    await updateJobByCompany(job.id, {
      companyName: job.companyName,
      title: job.title,
      category: job.category,
      locationCity: job.locationCity,
      locationState: job.locationState,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      openings: job.openings,
      description: job.description,
      requirements: job.requirements,
      status: 'closed',
    });
  };

  const handleDeleteJob = async (jobId: string) => {
    await deleteJobListing(jobId);
  };

  const handleApplicationStatusChange = async (appId: string, status: ApplicationStatus) => {
    await updateApplicationStatus(appId, status);
  };

  const filteredApplications = useMemo(() => {
    if (statusFilterJobId === 'all') return applications;
    return applications.filter((a) => a.jobId === statusFilterJobId);
  }, [applications, statusFilterJobId]);

  const jobStatusStyle = (status: JobListing['status']) => {
    switch (status) {
      case 'approved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-blue-700">{t.roleCompany}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            {profile.companyName || profile.fullName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {profile.city}, {profile.state} · {profile.industry || 'Verified Employer'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'hi' ? `क्रेडिट्स: ${totalRemainingCredits}` : `Credits: ${totalRemainingCredits}`}
          </button>
          <button
            type="button"
            onClick={openNewJobForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.postJobBtn}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'पोस्ट की गई नौकरियाँ' : 'Posted Jobs'}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{companyJobs.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'लाइव नौकरियाँ' : 'Approved Live'}</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {companyJobs.filter((j) => j.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'प्राप्त आवेदन' : 'Candidate Applicants'}</div>
          <div className="text-2xl font-bold text-blue-700 mt-1 tabular-nums">{applications.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{lang === 'hi' ? 'बचे जॉब क्रेडिट्स' : 'Available Credits'}</div>
          <div className="text-2xl font-bold text-orange-600 mt-1 tabular-nums">{totalRemainingCredits}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? `मेरी नौकरियाँ (${companyJobs.length})` : `My Job Posts (${companyJobs.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('applicants')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'applicants' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? `आवेदक (${applications.length})` : `Applicants (${applications.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'plans' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? 'प्लान और क्रेडिट्स' : 'Plans & Credits'}
        </button>
      </div>

      {/* Post / Edit Job Form */}
      {showPostForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingJob
                  ? lang === 'hi'
                    ? 'जॉब पोस्ट संपादित करें'
                    : 'Edit Job Listing'
                  : lang === 'hi'
                  ? 'नई नौकरी प्रकाशित करें'
                  : 'Create New Job Listing'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.pendingNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
          </div>

          {!editingJob && activeOrders.length === 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {lang === 'hi' ? 'कोई सक्रिय जॉब पोस्टिंग क्रेडिट नहीं है' : 'No Active Job Posting Credits'}
                  </div>
                  <div className="text-xs text-slate-600">
                    {lang === 'hi'
                      ? 'जारी रखने के लिए ₹99 (Basic), ₹199 (Featured), या ₹499 (Monthly 15 Posts) चुनें।'
                      : 'Activate Basic (₹99), Featured (₹199), or Monthly Company Plan (₹499) to submit your job.'}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['basic_99', 'featured_199', 'monthly_499'] as PaidPlanTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onBuyPlan(tier)}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
                  >
                    ₹{JOB_PLANS[tier].priceInr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{formError}</div>
          )}

          <form onSubmit={handleSubmitJob} className="space-y-4">
            {!editingJob && activeOrders.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'hi' ? 'उपयोग करने के लिए सक्रिय प्लान चुनें' : 'Select Active Plan Credit'}
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {activeOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {lang === 'hi' ? JOB_PLANS[ord.planTier].nameHi : JOB_PLANS[ord.planTier].nameEn} (₹
                      {ord.amountInr}) — {ord.creditsTotal - ord.creditsUsed} credits left
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'hi' ? 'पद का नाम (Job Title) *' : 'Job Title *'}
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={BLUEPRINT_LIMITS.JOB_TITLE_MAX}
                  placeholder="e.g. Sales Executive / React Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.filterCategory} *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JobCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {lang === 'hi' ? CATEGORY_LABELS_HI[cat] : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.cityLabel} *</label>
                <select
                  value={locationCity}
                  onChange={(e) => handleCityChange(e.target.value)}
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
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.stateLabel} *</label>
                <select
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.filterJobType} *</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {JOB_TYPES.map((jt) => (
                    <option key={jt} value={jt}>
                      {jt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'hi' ? 'अनुभव स्तर' : 'Experience Level'}
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'hi' ? 'न्यूनतम मासिक वेतन (₹)' : 'Min Monthly Salary (₹)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'hi' ? 'अधिकतम मासिक वेतन (₹)' : 'Max Monthly Salary (₹)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'hi' ? 'कुल पद (Openings)' : 'Openings'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={openings}
                  onChange={(e) => setOpenings(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {lang === 'hi' ? 'नौकरी का विवरण (कम से कम 20 अक्षर) *' : 'Job Description (min 20 chars) *'}
              </label>
              <textarea
                rows={4}
                required
                minLength={20}
                maxLength={BLUEPRINT_LIMITS.JOB_DESC_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {lang === 'hi' ? 'योग्यता और कौशल (कम से कम 10 अक्षर) *' : 'Requirements & Skills (min 10 chars) *'}
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={BLUEPRINT_LIMITS.JOB_REQ_MAX}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer disabled:opacity-60"
              >
                {busy
                  ? lang === 'hi'
                    ? 'सहेजा जा रहा है...'
                    : 'Saving...'
                  : editingJob
                  ? lang === 'hi'
                    ? 'अपडेट भेजें'
                    : 'Save & Resubmit'
                  : lang === 'hi'
                  ? 'समीक्षा के लिए जॉब सबमिट करें'
                  : 'Submit Job for Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: My Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {companyJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">
                {lang === 'hi' ? 'अभी तक कोई नौकरी पोस्ट नहीं की गई' : 'No job posts published yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                {lang === 'hi'
                  ? '₹99 से प्लान चुनें और पूरे भारत के उम्मीदवारों तक अपनी नौकरी पहुँचाएं।'
                  : 'Choose a plan starting at ₹99 and post your opening to candidates across India.'}
              </p>
              <button
                type="button"
                onClick={openNewJobForm}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
              >
                {t.postJobBtn}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {companyJobs.map((job) => {
                const count = applications.filter((a) => a.jobId === job.id).length;
                return (
                  <div key={job.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-blue-700">{job.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {job.locationCity}, {job.locationState}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatSalaryInr(job.salaryMin, job.salaryMax, lang)}</span>
                        {job.isFeatured && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-orange-700 font-semibold">
                              <Sparkles className="w-3 h-3" />
                              {t.featuredTag}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                      {job.adminNote && (
                        <p className="text-xs text-slate-600">
                          {lang === 'hi' ? 'एडमिन टिप्पणी:' : 'Admin note:'} {job.adminNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-md border text-xs font-medium ${jobStatusStyle(job.status)}`}
                      >
                        {JOB_STATUS_LABELS[job.status][lang]}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilterJobId(job.id);
                          setActiveTab('applicants');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer tabular-nums"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {count}
                      </button>
                      {job.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => openEditJobForm(job)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                          title={t.editBtn}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleCloseJob(job)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          {t.closeJobBtn}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title={t.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Applicants */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'hi' ? 'उम्मीदवारों के आवेदन' : 'Incoming Candidate Applications'}
            </h2>
            <select
              value={statusFilterJobId}
              onChange={(e) => setStatusFilterJobId(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">{lang === 'hi' ? 'सभी नौकरियाँ' : 'All Jobs'}</option>
              {companyJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              {lang === 'hi' ? 'अभी तक कोई आवेदन प्राप्त नहीं हुआ है।' : 'No candidate applications received yet.'}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {filteredApplications.map((app) => (
                <div key={app.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">{app.jobTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span>{app.candidateCity}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {app.experienceYears} {lang === 'hi' ? 'वर्ष अनुभव' : 'yrs exp'}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-slate-900">{app.candidateName}</div>
                    <div className="text-xs text-slate-600 font-mono-num">
                      {app.candidatePhone} · {app.candidateEmail}
                    </div>
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">{app.coverNote}</p>
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-medium text-blue-700 hover:underline pt-1"
                      >
                        {lang === 'hi' ? 'रिज्यूमे लिंक खोलें →' : 'View Resume Link →'}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      disabled={app.status === 'hired'}
                      value={app.status}
                      onChange={(e) => handleApplicationStatusChange(app.id, e.target.value as ApplicationStatus)}
                      className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white disabled:opacity-60"
                    >
                      {(['submitted', 'shortlisted', 'interview', 'hired', 'rejected'] as ApplicationStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {APP_STATUS_LABELS[st][lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Plans & Credits */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['basic_99', 'featured_199', 'monthly_499'] as PaidPlanTier[]).map((tier) => {
              const plan = JOB_PLANS[tier];
              return (
                <div
                  key={tier}
                  className={`bg-white rounded-xl p-6 border flex flex-col justify-between ${
                    tier === 'monthly_499' ? 'border-blue-600' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {lang === 'hi' ? plan.nameHi : plan.nameEn}
                      </h3>
                      <span className="text-lg font-bold font-mono-num text-slate-900">₹{plan.priceInr}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{lang === 'hi' ? plan.audienceHi : plan.audienceEn}</p>
                    <ul className="space-y-2 mb-6">
                      {(lang === 'hi' ? plan.featuresHi : plan.featuresEn).map((feat) => (
                        <li key={feat} className="text-xs text-slate-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuyPlan(tier)}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      tier === 'monthly_499'
                        ? 'bg-blue-700 text-white hover:bg-blue-800'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {t.selectPlanBtn} · ₹{plan.priceInr}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'hi' ? 'प्लान खरीद इतिहास' : 'Plan Order History'}
              </h3>
            </div>
            {planOrders.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 text-center">
                {lang === 'hi' ? 'कोई प्लान ऑर्डर नहीं मिला।' : 'No plan purchases yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'प्लान' : 'Plan'}</th>
                      <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'संदर्भ' : 'Reference'}</th>
                      <th className="py-3 px-4 font-medium text-right">{lang === 'hi' ? 'राशि' : 'Amount'}</th>
                      <th className="py-3 px-4 font-medium text-right">{lang === 'hi' ? 'क्रेडिट उपयोग' : 'Credits'}</th>
                      <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {planOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {lang === 'hi' ? JOB_PLANS[ord.planTier].nameHi : JOB_PLANS[ord.planTier].nameEn}
                        </td>
                        <td className="py-3 px-4 font-mono-num text-slate-600">{ord.paymentReference}</td>
                        <td className="py-3 px-4 font-mono-num text-right text-slate-900">₹{ord.amountInr}</td>
                        <td className="py-3 px-4 font-mono-num text-right text-slate-700">
                          {ord.creditsUsed} / {ord.creditsTotal}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700">{ord.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
