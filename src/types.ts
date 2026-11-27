import type { Timestamp } from 'firebase/firestore';

export type Language = 'en' | 'hi';

export type UserRole = 'candidate' | 'company';

export type PlanTier = 'none' | 'basic_99' | 'featured_199' | 'monthly_499';
export type PaidPlanTier = 'basic_99' | 'featured_199' | 'monthly_499';

export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';
export type ApplicationStatus = 'submitted' | 'shortlisted' | 'interview' | 'hired' | 'rejected';

export const ADMIN_EMAIL = 'msingh409911@gmail.com';

export const JOB_CATEGORIES = [
  'IT & Software',
  'Sales & Marketing',
  'Banking & Finance',
  'Engineering & Manufacturing',
  'Logistics & Delivery',
  'Healthcare & Pharma',
  'Education & Teaching',
  'Hospitality & Retail',
  'BPO & Support',
  'Design & Media',
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Remote',
  'Internship',
  'Contract',
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-3 Years',
  '3-5 Years',
  '5+ Years',
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const INDIA_CITIES = [
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi NCR', state: 'Delhi' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Remote India', state: 'Pan-India' },
] as const;

export const INDIA_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Pan-India',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const SALARY_FILTERS = [
  { id: 'all', min: 0, max: Infinity },
  { id: 'u15', min: 0, max: 15000 },
  { id: '15_30', min: 15000, max: 30000 },
  { id: '30_60', min: 30000, max: 60000 },
  { id: '60p', min: 60000, max: Infinity },
] as const;

export interface PlanDefinition {
  id: PaidPlanTier;
  priceInr: number;
  credits: number;
  durationDays: number;
  isFeatured: boolean;
  nameEn: string;
  nameHi: string;
  audienceEn: string;
  audienceHi: string;
  featuresEn: string[];
  featuresHi: string[];
}

export const JOB_PLANS: Record<PaidPlanTier, PlanDefinition> = {
  basic_99: {
    id: 'basic_99',
    priceInr: 99,
    credits: 1,
    durationDays: 15,
    isFeatured: false,
    nameEn: 'Basic Job Post',
    nameHi: 'बेसिक जॉब पोस्ट',
    audienceEn: 'For single urgent local hiring',
    audienceHi: 'एकल स्थानीय भर्ती के लिए उपयुक्त',
    featuresEn: [
      '1 active job listing across India',
      '15 days standard search visibility',
      'Unlimited free candidate applications',
      'Admin verification within 24 hours',
    ],
    featuresHi: [
      'पूरे भारत में 1 सक्रिय जॉब लिस्टिंग',
      '15 दिनों की मानक सर्च दृश्यता',
      'उम्मीदवारों से असीमित मुफ्त आवेदन',
      '24 घंटे के भीतर एडमिन सत्यापन',
    ],
  },
  featured_199: {
    id: 'featured_199',
    priceInr: 199,
    credits: 1,
    durationDays: 30,
    isFeatured: true,
    nameEn: 'Featured Job Post',
    nameHi: 'फीचर्ड जॉब पोस्ट',
    audienceEn: 'For priority visibility & faster hires',
    audienceHi: 'प्राथमिकता दृश्यता और तेज़ भर्ती के लिए',
    featuresEn: [
      '1 priority Featured job listing',
      '30 days top-of-search placement',
      'Highlighted card border & Featured tag',
      'Direct applicant shortlist tools',
    ],
    featuresHi: [
      '1 प्राथमिकता फीचर्ड जॉब लिस्टिंग',
      '30 दिनों तक सर्च में शीर्ष स्थान',
      'हाइलाइटेड कार्ड व फीचर्ड पहचान',
      'आवेदकों को शॉर्टलिस्ट करने की सुविधा',
    ],
  },
  monthly_499: {
    id: 'monthly_499',
    priceInr: 499,
    credits: 15,
    durationDays: 30,
    isFeatured: true,
    nameEn: 'Monthly Company Plan',
    nameHi: 'मासिक कंपनी प्लान',
    audienceEn: 'For growing teams hiring regularly',
    audienceHi: 'नियमित भर्ती करने वाली कंपनियों के लिए',
    featuresEn: [
      'Up to 15 Featured job posts per month',
      '30 days priority placement on all posts',
      'Centralized applicant pipeline management',
      'Best value: ₹33 per job listing',
    ],
    featuresHi: [
      'प्रति माह 15 तक फीचर्ड जॉब पोस्ट',
      'सभी पोस्ट पर 30 दिन की प्राथमिकता',
      'संपूर्ण आवेदक पाइपलाइन प्रबंधन',
      'सर्वश्रेष्ठ बचत: मात्र ₹33 प्रति जॉब',
    ],
  },
};

export const BLUEPRINT_LIMITS = {
  UID_MAX: 128,
  EMAIL_MAX: 160,
  NAME_MAX: 100,
  PHONE_MAX: 20,
  CITY_MAX: 80,
  STATE_MAX: 80,
  SKILLS_MAX: 300,
  RESUME_URL_MAX: 400,
  COMPANY_NAME_MAX: 120,
  INDUSTRY_MAX: 80,
  COMPANY_DESC_MAX: 1000,
  JOB_TITLE_MAX: 140,
  JOB_DESC_MAX: 3000,
  JOB_REQ_MAX: 1500,
  ADMIN_NOTE_MAX: 400,
  COVER_NOTE_MAX: 1200,
  PAYMENT_REF_MAX: 80,
  FOUNDER_PHOTO_MAX: 200000,
} as const;

export interface FounderProfileSettings {
  founderName: string;
  designation: string;
  photoUrl: string;
  updatedAt?: Timestamp;
}

export interface UserProfile {
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
  activePlan: PlanTier;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface JobListing {
  id: string;
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
  isFeatured: boolean;
  status: JobStatus;
  adminNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateCity: string;
  experienceYears: number;
  resumeUrl: string;
  coverNote: string;
  status: ApplicationStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PlanOrder {
  id: string;
  companyId: string;
  companyName: string;
  planTier: PaidPlanTier;
  amountInr: number;
  paymentMethod: 'upi' | 'card' | 'netbanking';
  paymentReference: string;
  creditsTotal: number;
  creditsUsed: number;
  status: 'active' | 'used' | 'expired';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
