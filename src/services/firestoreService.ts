import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  BLUEPRINT_LIMITS,
  JOB_PLANS,
  type ApplicationStatus,
  type ExperienceLevel,
  type FounderProfileSettings,
  type JobApplication,
  type JobCategory,
  type JobListing,
  type JobStatus,
  type JobType,
  type PaidPlanTier,
  type PlanOrder,
  type UserProfile,
  type UserRole,
} from '../types';

function clampStr(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function sortByCreatedDesc<T extends { createdAt?: { toMillis?: () => number } }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tB - tA;
  });
}

// ── User Profile Operations ──────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserProfile(input: {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  city: string;
  state: string;
  skills: string;
  experienceYears: number;
  resumeUrl: string;
  companyName: string;
  industry: string;
  companyDescription: string;
}): Promise<void> {
  const path = `users/${input.uid}`;
  try {
    const payload = {
      uid: clampStr(input.uid, BLUEPRINT_LIMITS.UID_MAX),
      email: clampStr(input.email, BLUEPRINT_LIMITS.EMAIL_MAX),
      role: input.role,
      fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.NAME_MAX),
      phone: clampStr(input.phone, BLUEPRINT_LIMITS.PHONE_MAX),
      city: clampStr(input.city, BLUEPRINT_LIMITS.CITY_MAX),
      state: clampStr(input.state, BLUEPRINT_LIMITS.STATE_MAX),
      skills: clampStr(input.skills, BLUEPRINT_LIMITS.SKILLS_MAX),
      experienceYears: Math.max(0, Math.min(60, Number(input.experienceYears) || 0)),
      resumeUrl: clampStr(input.resumeUrl, BLUEPRINT_LIMITS.RESUME_URL_MAX),
      companyName: clampStr(input.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX),
      industry: clampStr(input.industry, BLUEPRINT_LIMITS.INDUSTRY_MAX),
      companyDescription: clampStr(input.companyDescription, BLUEPRINT_LIMITS.COMPANY_DESC_MAX),
      activePlan: 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', input.uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  input: {
    fullName: string;
    phone: string;
    city: string;
    state: string;
    skills: string;
    experienceYears: number;
    resumeUrl: string;
    companyName: string;
    industry: string;
    companyDescription: string;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      fullName: clampStr(input.fullName, BLUEPRINT_LIMITS.NAME_MAX),
      phone: clampStr(input.phone, BLUEPRINT_LIMITS.PHONE_MAX),
      city: clampStr(input.city, BLUEPRINT_LIMITS.CITY_MAX),
      state: clampStr(input.state, BLUEPRINT_LIMITS.STATE_MAX),
      skills: clampStr(input.skills, BLUEPRINT_LIMITS.SKILLS_MAX),
      experienceYears: Math.max(0, Math.min(60, Number(input.experienceYears) || 0)),
      resumeUrl: clampStr(input.resumeUrl, BLUEPRINT_LIMITS.RESUME_URL_MAX),
      companyName: clampStr(input.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX),
      industry: clampStr(input.industry, BLUEPRINT_LIMITS.INDUSTRY_MAX),
      companyDescription: clampStr(input.companyDescription, BLUEPRINT_LIMITS.COMPANY_DESC_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeAllUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as UserProfile);
      callback(sortByCreatedDesc(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getApprovedJobById(jobId: string): Promise<JobListing | null> {
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(jobId)) return null;
  try {
    const snap = await getDoc(doc(db, jobs, jobId));
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<JobListing, id>;
    if (data.status !== approved) return null;
    return { ...data, id: snap.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `jobs/${jobId}`);
    return null;
  }
}

// ── Jobs Subscriptions & Mutations ───────────────────────────────────────────

export function subscribeApprovedJobs(callback: (jobs: JobListing[]) => void): Unsubscribe {
  const path = 'jobs';
  const q = query(collection(db, 'jobs'), where('status', '==', 'approved'));
  return onSnapshot(
    q,
    (snap) => {
      const jobs = snap.docs.map((d) => ({ ...(d.data() as Omit<JobListing, 'id'>), id: d.id }));
      const sorted = sortByCreatedDesc(jobs).sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
      callback(sorted);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeCompanyJobs(companyId: string, callback: (jobs: JobListing[]) => void): Unsubscribe {
  const path = 'jobs';
  const q = query(collection(db, 'jobs'), where('companyId', '==', companyId));
  return onSnapshot(
    q,
    (snap) => {
      const jobs = snap.docs.map((d) => ({ ...(d.data() as Omit<JobListing, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(jobs));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllJobsAdmin(callback: (jobs: JobListing[]) => void): Unsubscribe {
  const path = 'jobs';
  return onSnapshot(
    collection(db, 'jobs'),
    (snap) => {
      const jobs = snap.docs.map((d) => ({ ...(d.data() as Omit<JobListing, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(jobs));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface JobInputPayload {
  companyId: string;
  companyName: string;
  title: string;
  category: JobCategory;
  locationCity: string;
  locationState: string;
  salaryMin: number;
  salaryMax: number;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  openings: number;
  description: string;
  requirements: string;
  planTier: PaidPlanTier;
}

export async function createJobPost(
  input: JobInputPayload,
  options?: { asAdmin?: boolean; activeOrder?: PlanOrder }
): Promise<string> {
  const jobId = makeDocId('job');
  const path = `jobs/${jobId}`;
  const isFeatured = input.planTier === 'featured_199' || input.planTier === 'monthly_499';
  const salaryMin = Math.max(0, Math.min(10000000, Math.round(Number(input.salaryMin) || 0)));
  const salaryMax = Math.max(salaryMin, Math.min(10000000, Math.round(Number(input.salaryMax) || salaryMin)));

  const jobPayload = {
    companyId: clampStr(input.companyId, BLUEPRINT_LIMITS.UID_MAX),
    companyName: clampStr(input.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX),
    title: clampStr(input.title, BLUEPRINT_LIMITS.JOB_TITLE_MAX),
    category: input.category,
    locationCity: clampStr(input.locationCity, BLUEPRINT_LIMITS.CITY_MAX),
    locationState: clampStr(input.locationState, BLUEPRINT_LIMITS.STATE_MAX),
    salaryMin,
    salaryMax,
    jobType: input.jobType,
    experienceLevel: input.experienceLevel,
    openings: Math.max(1, Math.min(5000, Math.round(Number(input.openings) || 1))),
    description: clampStr(input.description, BLUEPRINT_LIMITS.JOB_DESC_MAX),
    requirements: clampStr(input.requirements, BLUEPRINT_LIMITS.JOB_REQ_MAX),
    planTier: input.planTier,
    isFeatured,
    status: options?.asAdmin ? 'approved' : 'pending',
    adminNote: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (options?.activeOrder) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'jobs', jobId), jobPayload);
      const nextUsed = options.activeOrder.creditsUsed + 1;
      const nextOrderStatus = nextUsed >= options.activeOrder.creditsTotal ? 'used' : 'active';
      batch.update(doc(db, 'planOrders', options.activeOrder.id), {
        creditsUsed: nextUsed,
        status: nextOrderStatus,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await setDoc(doc(db, 'jobs', jobId), jobPayload);
    }
    return jobId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateJobByCompany(
  jobId: string,
  input: Omit<JobInputPayload, 'companyId' | 'planTier'> & { status: 'pending' | 'closed' }
): Promise<void> {
  const path = `jobs/${jobId}`;
  const salaryMin = Math.max(0, Math.min(10000000, Math.round(Number(input.salaryMin) || 0)));
  const salaryMax = Math.max(salaryMin, Math.min(10000000, Math.round(Number(input.salaryMax) || salaryMin)));
  try {
    await updateDoc(doc(db, 'jobs', jobId), {
      companyName: clampStr(input.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX),
      title: clampStr(input.title, BLUEPRINT_LIMITS.JOB_TITLE_MAX),
      category: input.category,
      locationCity: clampStr(input.locationCity, BLUEPRINT_LIMITS.CITY_MAX),
      locationState: clampStr(input.locationState, BLUEPRINT_LIMITS.STATE_MAX),
      salaryMin,
      salaryMax,
      jobType: input.jobType,
      experienceLevel: input.experienceLevel,
      openings: Math.max(1, Math.min(5000, Math.round(Number(input.openings) || 1))),
      description: clampStr(input.description, BLUEPRINT_LIMITS.JOB_DESC_MAX),
      requirements: clampStr(input.requirements, BLUEPRINT_LIMITS.JOB_REQ_MAX),
      status: input.status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateJobByAdmin(
  jobId: string,
  updates: {
    companyName?: string;
    title?: string;
    category?: JobCategory;
    locationCity?: string;
    locationState?: string;
    salaryMin?: number;
    salaryMax?: number;
    jobType?: JobType;
    experienceLevel?: ExperienceLevel;
    openings?: number;
    description?: string;
    requirements?: string;
    planTier?: PaidPlanTier;
    status?: JobStatus;
    adminNote?: string;
  }
): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.companyName !== undefined) payload.companyName = clampStr(updates.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX);
    if (updates.title !== undefined) payload.title = clampStr(updates.title, BLUEPRINT_LIMITS.JOB_TITLE_MAX);
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.locationCity !== undefined) payload.locationCity = clampStr(updates.locationCity, BLUEPRINT_LIMITS.CITY_MAX);
    if (updates.locationState !== undefined) payload.locationState = clampStr(updates.locationState, BLUEPRINT_LIMITS.STATE_MAX);
    if (updates.salaryMin !== undefined) payload.salaryMin = Math.max(0, Math.round(updates.salaryMin));
    if (updates.salaryMax !== undefined) payload.salaryMax = Math.max(0, Math.round(updates.salaryMax));
    if (updates.jobType !== undefined) payload.jobType = updates.jobType;
    if (updates.experienceLevel !== undefined) payload.experienceLevel = updates.experienceLevel;
    if (updates.openings !== undefined) payload.openings = Math.max(1, Math.round(updates.openings));
    if (updates.description !== undefined) payload.description = clampStr(updates.description, BLUEPRINT_LIMITS.JOB_DESC_MAX);
    if (updates.requirements !== undefined) payload.requirements = clampStr(updates.requirements, BLUEPRINT_LIMITS.JOB_REQ_MAX);
    if (updates.planTier !== undefined) {
      payload.planTier = updates.planTier;
      payload.isFeatured = updates.planTier === 'featured_199' || updates.planTier === 'monthly_499';
    }
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.adminNote !== undefined) payload.adminNote = clampStr(updates.adminNote, BLUEPRINT_LIMITS.ADMIN_NOTE_MAX);

    await updateDoc(doc(db, 'jobs', jobId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteJobListing(jobId: string): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ── Applications Subscriptions & Mutations ───────────────────────────────────

export function subscribeCandidateApplications(
  candidateId: string,
  callback: (apps: JobApplication[]) => void
): Unsubscribe {
  const path = 'applications';
  const q = query(collection(db, 'applications'), where('candidateId', '==', candidateId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<JobApplication, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeCompanyApplications(
  companyId: string,
  callback: (apps: JobApplication[]) => void
): Unsubscribe {
  const path = 'applications';
  const q = query(collection(db, 'applications'), where('companyId', '==', companyId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<JobApplication, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllApplicationsAdmin(callback: (apps: JobApplication[]) => void): Unsubscribe {
  const path = 'applications';
  return onSnapshot(
    collection(db, 'applications'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<JobApplication, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function submitJobApplication(input: {
  job: JobListing;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateCity: string;
  experienceYears: number;
  resumeUrl: string;
  coverNote: string;
}): Promise<string> {
  const appId = `${input.job.id}_${input.candidateId}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const path = `applications/${appId}`;
  try {
    await setDoc(doc(db, 'applications', appId), {
      jobId: input.job.id,
      jobTitle: clampStr(input.job.title, BLUEPRINT_LIMITS.JOB_TITLE_MAX),
      companyId: input.job.companyId,
      companyName: clampStr(input.job.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX),
      candidateId: clampStr(input.candidateId, BLUEPRINT_LIMITS.UID_MAX),
      candidateName: clampStr(input.candidateName, BLUEPRINT_LIMITS.NAME_MAX),
      candidateEmail: clampStr(input.candidateEmail, BLUEPRINT_LIMITS.EMAIL_MAX),
      candidatePhone: clampStr(input.candidatePhone, BLUEPRINT_LIMITS.PHONE_MAX),
      candidateCity: clampStr(input.candidateCity, BLUEPRINT_LIMITS.CITY_MAX),
      experienceYears: Math.max(0, Math.min(60, Number(input.experienceYears) || 0)),
      resumeUrl: clampStr(input.resumeUrl, BLUEPRINT_LIMITS.RESUME_URL_MAX),
      coverNote: clampStr(input.coverNote, BLUEPRINT_LIMITS.COVER_NOTE_MAX),
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return appId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  const path = `applications/${applicationId}`;
  try {
    await updateDoc(doc(db, 'applications', applicationId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function withdrawApplication(applicationId: string): Promise<void> {
  const path = `applications/${applicationId}`;
  try {
    await deleteDoc(doc(db, 'applications', applicationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ── Plan Orders Subscriptions & Mutations ────────────────────────────────────

export function subscribeCompanyPlanOrders(
  companyId: string,
  callback: (orders: PlanOrder[]) => void
): Unsubscribe {
  const path = 'planOrders';
  const q = query(collection(db, 'planOrders'), where('companyId', '==', companyId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<PlanOrder, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllPlanOrdersAdmin(callback: (orders: PlanOrder[]) => void): Unsubscribe {
  const path = 'planOrders';
  return onSnapshot(
    collection(db, 'planOrders'),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Omit<PlanOrder, 'id'>), id: d.id }));
      callback(sortByCreatedDesc(list));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createPlanOrder(input: {
  companyId: string;
  companyName: string;
  planTier: PaidPlanTier;
  paymentMethod: 'upi' | 'card' | 'netbanking';
  paymentReference: string;
}): Promise<PlanOrder> {
  const orderId = makeDocId('ord');
  const path = `planOrders/${orderId}`;
  const plan = JOB_PLANS[input.planTier];
  const payload = {
    companyId: clampStr(input.companyId, BLUEPRINT_LIMITS.UID_MAX),
    companyName: clampStr(input.companyName, BLUEPRINT_LIMITS.COMPANY_NAME_MAX),
    planTier: input.planTier,
    amountInr: plan.priceInr,
    paymentMethod: input.paymentMethod,
    paymentReference: clampStr(input.paymentReference, BLUEPRINT_LIMITS.PAYMENT_REF_MAX),
    creditsTotal: plan.credits,
    creditsUsed: 0,
    status: 'active' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'planOrders', orderId), payload);
    return {
      id: orderId,
      companyId: payload.companyId,
      companyName: payload.companyName,
      planTier: payload.planTier,
      amountInr: payload.amountInr,
      paymentMethod: payload.paymentMethod,
      paymentReference: payload.paymentReference,
      creditsTotal: payload.creditsTotal,
      creditsUsed: 0,
      status: 'active',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ── Admin Starter Pan-India Jobs Seed ────────────────────────────────────────

export async function seedSamplePanIndiaJobs(adminUid: string): Promise<number> {
  const starterJobs: Omit<JobInputPayload, 'companyId'>[] = [
    {
      companyName: 'Bharat FinPay Systems',
      title: 'Full Stack React & Node.js Developer',
      category: 'IT & Software',
      locationCity: 'Bengaluru',
      locationState: 'Karnataka',
      salaryMin: 55000,
      salaryMax: 95000,
      jobType: 'Full-time',
      experienceLevel: '1-3 Years',
      openings: 4,
      description:
        'Build high-throughput UPI merchant dashboards and settlement APIs serving small merchants across Tier-2 and Tier-3 Indian cities.',
      requirements:
        'Strong TypeScript, React, Node.js, REST API design, and experience with relational or Firestore databases.',
      planTier: 'featured_199',
    },
    {
      companyName: 'Narmada Logistics India',
      title: 'Regional Supply Chain & Hub Coordinator',
      category: 'Logistics & Delivery',
      locationCity: 'Indore',
      locationState: 'Madhya Pradesh',
      salaryMin: 22000,
      salaryMax: 34000,
      jobType: 'Full-time',
      experienceLevel: '1-3 Years',
      openings: 6,
      description:
        'Coordinate daily dispatch routes, fleet attendance, and last-mile delivery SLAs across Indore, Ujjain, and Bhopal corridors.',
      requirements:
        'Graduate in any stream, proficiency in Excel/Google Sheets, fluent Hindi and basic English communication.',
      planTier: 'monthly_499',
    },
    {
      companyName: 'Surya Solar & Infra Pvt Ltd',
      title: 'Field Sales Executive — Rooftop Solar',
      category: 'Sales & Marketing',
      locationCity: 'Jaipur',
      locationState: 'Rajasthan',
      salaryMin: 18000,
      salaryMax: 32000,
      jobType: 'Full-time',
      experienceLevel: 'Fresher',
      openings: 10,
      description:
        'Consult homeowners and commercial establishments on PM Surya Ghar solar subsidies, conduct site visits, and close installation orders.',
      requirements:
        'Two-wheeler with valid license, strong Hindi & local communication skills, and passion for renewable energy.',
      planTier: 'basic_99',
    },
    {
      companyName: 'Dakshina MedCare Diagnostics',
      title: 'Certified Phlebotomist & Lab Technician',
      category: 'Healthcare & Pharma',
      locationCity: 'Hyderabad',
      locationState: 'Telangana',
      salaryMin: 20000,
      salaryMax: 29000,
      jobType: 'Full-time',
      experienceLevel: '1-3 Years',
      openings: 5,
      description:
        'Perform home sample collections and pathology lab processing following strict NABL hygiene and cold-chain guidelines.',
      requirements: 'DMLT or BMLT certification, 1+ year clinical lab experience, courteous patient handling.',
      planTier: 'featured_199',
    },
    {
      companyName: 'Kaveri EdTech Academy',
      title: 'Bilingual Mathematics & Reasoning Faculty',
      category: 'Education & Teaching',
      locationCity: 'Lucknow',
      locationState: 'Uttar Pradesh',
      salaryMin: 28000,
      salaryMax: 45000,
      jobType: 'Full-time',
      experienceLevel: '1-3 Years',
      openings: 3,
      description:
        'Teach quantitative aptitude and reasoning in Hindi and English for SSC, Banking, and State PSC aspirants in live and classroom batches.',
      requirements: 'B.Sc / B.Tech / M.Sc with strong command over bilingual teaching and student mentorship.',
      planTier: 'basic_99',
    },
    {
      companyName: 'Vardhman Precision Auto Components',
      title: 'CNC Machine Operator & Quality Inspector',
      category: 'Engineering & Manufacturing',
      locationCity: 'Pune',
      locationState: 'Maharashtra',
      salaryMin: 21000,
      salaryMax: 35000,
      jobType: 'Full-time',
      experienceLevel: '1-3 Years',
      openings: 8,
      description:
        'Operate precision CNC turning centers, read engineering tolerances, and log hourly micrometer quality checks on automotive parts.',
      requirements: 'ITI Turner/Machinist or Diploma in Mechanical Engineering with 1+ year shop-floor experience.',
      planTier: 'monthly_499',
    },
    {
      companyName: 'Sahyadri Retail & Cloud Kitchens',
      title: 'Customer Support Associate (Hindi + English)',
      category: 'BPO & Support',
      locationCity: 'Remote India',
      locationState: 'Pan-India',
      salaryMin: 16000,
      salaryMax: 24000,
      jobType: 'Remote',
      experienceLevel: 'Fresher',
      openings: 15,
      description:
        'Resolve customer order queries via voice and chat from home, manage refund escalations politely, and maintain 95%+ satisfaction.',
      requirements: '12th Pass or Graduate, personal laptop with stable broadband, fluent Hindi and conversational English.',
      planTier: 'featured_199',
    },
    {
      companyName: 'Triveni Capital Microfinance',
      title: 'Branch Credit & Relationship Officer',
      category: 'Banking & Finance',
      locationCity: 'Patna',
      locationState: 'Bihar',
      salaryMin: 19000,
      salaryMax: 28000,
      jobType: 'Full-time',
      experienceLevel: 'Fresher',
      openings: 7,
      description:
        'Evaluate MSME and women self-help group loan applications, conduct KYC verification, and guide timely digital EMI collections.',
      requirements: 'Any Graduate (B.Com preferred), good numerical skills, comfortable with local field visits.',
      planTier: 'basic_99',
    },
  ];

  const path = 'jobs';
  try {
    const batch = writeBatch(db);
    starterJobs.forEach((job, idx) => {
      const jobId = `job_seed_${Date.now()}_${idx}`;
      const isFeatured = job.planTier === 'featured_199' || job.planTier === 'monthly_499';
      batch.set(doc(db, 'jobs', jobId), {
        ...job,
        companyId: adminUid,
        isFeatured,
        status: 'approved',
        adminNote: 'Verified Pan-India starter listing',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    return starterJobs.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ── Public Founder Branding Profile (Admin-Managed) ──────────────────────────

export function subscribeFounderProfile(
  callback: (profile: FounderProfileSettings | null) => void
): Unsubscribe {
  const path = 'siteSettings/founder';
  return onSnapshot(
    doc(db, 'siteSettings', 'founder'),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data() as FounderProfileSettings);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveFounderProfilePhoto(photoUrl: string): Promise<void> {
  const path = 'siteSettings/founder';
  try {
    await setDoc(doc(db, 'siteSettings', 'founder'), {
      founderName: 'Manish Singh Rajpoot',
      designation: 'Founder & Owner',
      photoUrl: clampStr(photoUrl, BLUEPRINT_LIMITS.FOUNDER_PHOTO_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

