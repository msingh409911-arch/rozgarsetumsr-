import React, { useMemo, useState } from 'react';
import {
  Check,
  Database,
  Edit3,
  Shield,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  APP_STATUS_LABELS,
  formatSalaryInr,
  JOB_STATUS_LABELS,
  translations,
} from '../i18n';
import {
  deleteJobListing,
  seedSamplePanIndiaJobs,
  updateJobByAdmin,
} from '../services/firestoreService';
import {
  BLUEPRINT_LIMITS,
  EXPERIENCE_LEVELS,
  INDIA_CITIES,
  INDIA_STATES,
  JOB_CATEGORIES,
  JOB_PLANS,
  JOB_TYPES,
  type ExperienceLevel,
  type JobApplication,
  type JobCategory,
  type JobListing,
  type JobStatus,
  type JobType,
  type Language,
  type PaidPlanTier,
  type PlanOrder,
  type UserProfile,
} from '../types';

interface AdminDashboardProps {
  adminUid: string;
  adminEmail: string;
  allJobs: JobListing[];
  allUsers: UserProfile[];
  allApplications: JobApplication[];
  allPlanOrders: PlanOrder[];
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUid,
  adminEmail,
  allJobs,
  allUsers,
  allApplications,
  allPlanOrders,
  lang,
}) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'jobs' | 'users' | 'applications' | 'orders'>('jobs');
  const [jobFilter, setJobFilter] = useState<'all' | JobStatus>('all');
  const [seeding, setSeeding] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit modal fields
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editCategory, setEditCategory] = useState<JobCategory>('IT & Software');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editSalaryMin, setEditSalaryMin] = useState(0);
  const [editSalaryMax, setEditSalaryMax] = useState(0);
  const [editJobType, setEditJobType] = useState<JobType>('Full-time');
  const [editExp, setEditExp] = useState<ExperienceLevel>('1-3 Years');
  const [editOpenings, setEditOpenings] = useState(1);
  const [editPlanTier, setEditPlanTier] = useState<PaidPlanTier>('basic_99');
  const [editStatus, setEditStatus] = useState<JobStatus>('approved');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editReq, setEditReq] = useState('');

  const pendingCount = useMemo(() => allJobs.filter((j) => j.status === 'pending').length, [allJobs]);
  const approvedCount = useMemo(() => allJobs.filter((j) => j.status === 'approved').length, [allJobs]);
  const companyCount = useMemo(() => allUsers.filter((u) => u.role === 'company').length, [allUsers]);
  const totalRevenue = useMemo(
    () => allPlanOrders.reduce((sum, o) => sum + (Number(o.amountInr) || 0), 0),
    [allPlanOrders]
  );

  const visibleJobs = useMemo(() => {
    if (jobFilter === 'all') return allJobs;
    return allJobs.filter((j) => j.status === jobFilter);
  }, [allJobs, jobFilter]);

  const openEditor = (job: JobListing) => {
    setEditingJob(job);
    setEditTitle(job.title);
    setEditCompany(job.companyName);
    setEditCategory(job.category);
    setEditCity(job.locationCity);
    setEditState(job.locationState);
    setEditSalaryMin(job.salaryMin);
    setEditSalaryMax(job.salaryMax);
    setEditJobType(job.jobType);
    setEditExp(job.experienceLevel);
    setEditOpenings(job.openings);
    setEditPlanTier(job.planTier);
    setEditStatus(job.status);
    setEditAdminNote(job.adminNote || '');
    setEditDesc(job.description);
    setEditReq(job.requirements);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setSavingEdit(true);
    try {
      await updateJobByAdmin(editingJob.id, {
        title: editTitle,
        companyName: editCompany,
        category: editCategory,
        locationCity: editCity,
        locationState: editState,
        salaryMin: editSalaryMin,
        salaryMax: editSalaryMax,
        jobType: editJobType,
        experienceLevel: editExp,
        openings: editOpenings,
        planTier: editPlanTier,
        status: editStatus,
        adminNote: editAdminNote,
        description: editDesc,
        requirements: editReq,
      });
      setEditingJob(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSeedJobs = async () => {
    setSeeding(true);
    try {
      await seedSamplePanIndiaJobs(adminUid);
    } finally {
      setSeeding(false);
    }
  };

  const statusTone = (status: JobStatus) => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold text-orange-600 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {t.roleAdmin} · Manish Singh Rajpoot ({adminEmail})
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {lang === 'hi' ? 'एडमिन नियंत्रण कक्ष' : 'Admin Dashboard'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {lang === 'hi'
              ? 'नौकरियों को स्वीकृत, संपादित व हटाएं तथा कंपनियों, आवेदनों और प्लान राजस्व की निगरानी करें।'
              : 'Approve, edit, or delete job listings and monitor Pan-India employers, applicants, and plan orders.'}
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedJobs}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <Database className="w-4 h-4 text-orange-400" />
          {seeding ? (lang === 'hi' ? 'जोड़ा जा रहा है...' : 'Seeding...') : t.seedJobsBtn}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{t.kpiLiveJobs}</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{approvedCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{t.kpiPendingJobs}</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{pendingCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{t.kpiCompanies}</div>
          <div className="text-2xl font-bold text-blue-700 mt-1 tabular-nums">{companyCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500">{t.kpiApplications}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{allApplications.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 col-span-2 md:col-span-1">
          <div className="text-xs text-slate-500">{t.kpiRevenue}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono-num">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'jobs' as const, label: lang === 'hi' ? `नौकरियाँ (${allJobs.length})` : `Jobs (${allJobs.length})` },
            { id: 'orders' as const, label: lang === 'hi' ? `प्लान ऑर्डर (${allPlanOrders.length})` : `Plan Orders (${allPlanOrders.length})` },
            { id: 'applications' as const, label: lang === 'hi' ? `आवेदन (${allApplications.length})` : `Applications (${allApplications.length})` },
            { id: 'users' as const, label: lang === 'hi' ? `उपयोगकर्ता (${allUsers.length})` : `Users (${allUsers.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                tab === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'jobs' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'pending', 'approved', 'rejected', 'closed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setJobFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                  jobFilter === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {st === 'all' ? (lang === 'hi' ? 'सभी' : 'All') : JOB_STATUS_LABELS[st][lang]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Jobs Moderation Table */}
      {tab === 'jobs' && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {visibleJobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {lang === 'hi'
                ? 'इस श्रेणी में कोई नौकरी नहीं है। सैंपल भारतीय नौकरियाँ जोड़ने के लिए ऊपर बटन दबाएँ।'
                : 'No jobs in this filter. Click "Load 8 Sample Pan-India Jobs" above to populate starter listings.'}
            </div>
          ) : (
            visibleJobs.map((job) => (
              <div key={job.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{job.companyName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{job.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {job.locationCity}, {job.locationState}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatSalaryInr(job.salaryMin, job.salaryMax, lang)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">₹{JOB_PLANS[job.planTier].priceInr}</span>
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
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${statusTone(job.status)}`}>
                    {JOB_STATUS_LABELS[job.status][lang]}
                  </span>

                  {job.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateJobByAdmin(job.id, { status: 'approved', adminNote: 'Approved by Admin' })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.approveBtn}
                    </button>
                  )}

                  {job.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => updateJobByAdmin(job.id, { status: 'rejected', adminNote: 'Rejected by Admin' })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t.rejectBtn}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditor(job)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {t.editBtn}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteJobListing(job.id)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title={t.deleteBtn}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plan Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'कंपनी' : 'Company'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'प्लान' : 'Plan'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'भुगतान संदर्भ' : 'Payment Ref'}</th>
                <th className="py-3 px-4 font-medium text-right">{lang === 'hi' ? 'राशि' : 'Amount'}</th>
                <th className="py-3 px-4 font-medium text-right">{lang === 'hi' ? 'क्रेडिट्स' : 'Credits'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allPlanOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{ord.companyName}</td>
                  <td className="py-3 px-4 text-slate-700">
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
              {allPlanOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {lang === 'hi' ? 'अभी कोई प्लान ऑर्डर नहीं है।' : 'No plan orders recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Applications Tab */}
      {tab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'उम्मीदवार' : 'Candidate'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'पद' : 'Job Title'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'कंपनी' : 'Company'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'शहर' : 'City'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allApplications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{app.candidateName}</div>
                    <div className="text-slate-500 font-mono-num">{app.candidatePhone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{app.jobTitle}</td>
                  <td className="py-3 px-4 text-slate-600">{app.companyName}</td>
                  <td className="py-3 px-4 text-slate-600">{app.candidateCity}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{APP_STATUS_LABELS[app.status][lang]}</td>
                </tr>
              ))}
              {allApplications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {lang === 'hi' ? 'अभी कोई आवेदन नहीं है।' : 'No applications submitted yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'नाम' : 'Name'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'भूमिका' : 'Role'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'ईमेल / फोन' : 'Email / Phone'}</th>
                <th className="py-3 px-4 font-medium">{lang === 'hi' ? 'स्थान' : 'Location'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.fullName}</div>
                    {u.companyName && <div className="text-blue-700">{u.companyName}</div>}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-700 font-medium">{u.role}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{u.email}</div>
                    <div className="font-mono-num text-slate-500">{u.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {u.city}, {u.state}
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    {lang === 'hi' ? 'कोई पंजीकृत उपयोगकर्ता नहीं मिला।' : 'No registered user profiles yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Job Edit Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl my-auto p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {lang === 'hi' ? 'एडमिन द्वारा जॉब संपादन' : 'Admin Job Editor'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.JOB_TITLE_MAX}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.COMPANY_NAME_MAX}
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as JobCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {JOB_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                  <select
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Salary (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editSalaryMin}
                    onChange={(e) => setEditSalaryMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Salary (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editSalaryMax}
                    onChange={(e) => setEditSalaryMax(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job Type</label>
                  <select
                    value={editJobType}
                    onChange={(e) => setEditJobType(e.target.value as JobType)}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Experience</label>
                  <select
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value as ExperienceLevel)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Openings</label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={editOpenings}
                    onChange={(e) => setEditOpenings(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Plan Tier</label>
                  <select
                    value={editPlanTier}
                    onChange={(e) => setEditPlanTier(e.target.value as PaidPlanTier)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="basic_99">Basic ₹99</option>
                    <option value="featured_199">Featured ₹199</option>
                    <option value="monthly_499">Monthly ₹499</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Moderation Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as JobStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {(['pending', 'approved', 'rejected', 'closed'] as JobStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {JOB_STATUS_LABELS[st][lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Admin Note</label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.ADMIN_NOTE_MAX}
                  value={editAdminNote}
                  onChange={(e) => setEditAdminNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  minLength={20}
                  maxLength={BLUEPRINT_LIMITS.JOB_DESC_MAX}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Requirements</label>
                <textarea
                  rows={2}
                  required
                  minLength={10}
                  maxLength={BLUEPRINT_LIMITS.JOB_REQ_MAX}
                  value={editReq}
                  onChange={(e) => setEditReq(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 cursor-pointer disabled:opacity-60"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
