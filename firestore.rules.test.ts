/**
 * Security Rule Verification Scenarios ("Dirty Dozen") for Rozgar Setu MSR.
 * Intended for execution with @firebase/rules-unit-testing against the Firebase Emulator Suite.
 */

export const DIRTY_DOZEN_SCENARIOS = [
  {
    id: 1,
    name: 'Self-Admin Escalation',
    collection: 'users',
    expected: 'PERMISSION_DENIED',
    description: 'Candidate attempts to register with role: "admin".'
  },
  {
    id: 2,
    name: 'Shadow Field Injection on User',
    collection: 'users',
    expected: 'PERMISSION_DENIED',
    description: 'User attempts to inject ghost field isVerifiedAdmin: true.'
  },
  {
    id: 3,
    name: 'PII Snooping',
    collection: 'users',
    expected: 'PERMISSION_DENIED',
    description: 'Non-admin user attempts get on another user profile or list on /users.'
  },
  {
    id: 4,
    name: 'Unverified Email Spoof',
    collection: 'jobs',
    expected: 'PERMISSION_DENIED',
    description: 'User with msingh409911@gmail.com and email_verified: false tries to approve a job.'
  },
  {
    id: 5,
    name: 'Company Self-Approval',
    collection: 'jobs',
    expected: 'PERMISSION_DENIED',
    description: 'Company attempts to create a job directly with status: "approved".'
  },
  {
    id: 6,
    name: 'Company Spoofing',
    collection: 'jobs',
    expected: 'PERMISSION_DENIED',
    description: 'Company A attempts to post a job with companyId set to Company B.'
  },
  {
    id: 7,
    name: 'Pending Job Scraping',
    collection: 'jobs',
    expected: 'PERMISSION_DENIED',
    description: 'Candidate runs list query on /jobs without status == "approved" filter.'
  },
  {
    id: 8,
    name: 'Orphan or Mismatched Application',
    collection: 'applications',
    expected: 'PERMISSION_DENIED',
    description: 'Candidate applies to a pending/non-existent job or spoofs companyId.'
  },
  {
    id: 9,
    name: 'Candidate Self-Hiring',
    collection: 'applications',
    expected: 'PERMISSION_DENIED',
    description: 'Candidate attempts to update own application status to "hired".'
  },
  {
    id: 10,
    name: 'Terminal State Bypass',
    collection: 'applications',
    expected: 'PERMISSION_DENIED',
    description: 'Company attempts to alter an application whose status is already "hired".'
  },
  {
    id: 11,
    name: 'Plan Price Tampering',
    collection: 'planOrders',
    expected: 'PERMISSION_DENIED',
    description: 'Company creates monthly_499 planOrder with amountInr: 1.'
  },
  {
    id: 12,
    name: 'ID Poisoning & Payload Exhaustion',
    collection: 'jobs',
    expected: 'PERMISSION_DENIED',
    description: 'Attacker writes a document with invalid characters in ID or >3000 char description.'
  }
] as const;
