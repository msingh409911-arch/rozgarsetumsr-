# Rozgar Setu MSR — Security Specification (Phase 0)

## 1. Data Invariants

1. **Identity & Role Integrity**:
   - No user may self-assign `role: "admin"` or write to `/admins/{adminId}`.
   - A `/users/{userId}` document must have `uid == request.auth.uid == userId` and `role in ["candidate", "company"]`.
   - `uid` and `role` are immutable once created.
   - Admin privileges belong exclusively to verified `msingh409911@gmail.com` or existing `/admins/{uid}` documents.
2. **PII Isolation**:
   - `/users/{userId}` contains private PII (`email`, `phone`, `resumeUrl`) and may only be read (`get`) by the owning user or Admin. Listing `/users` is restricted to Admin only.
   - `/applications/{applicationId}` contains candidate PII (`candidateEmail`, `candidatePhone`, `resumeUrl`) and may only be read (`get`, `list`) by the applicant (`candidateId`), the hiring company (`companyId`), or Admin.
3. **Job Moderation Integrity**:
   - Public users and non-owning candidates can ONLY `get` or `list` `/jobs` documents whose `status == "approved"`.
   - Companies can only create jobs with `companyId == request.auth.uid` and `status == "pending"`. Companies cannot self-approve jobs (`status: "approved"`).
   - Only Admin can approve, reject, or edit moderated fields on any job.
4. **Application Relational Integrity**:
   - An application may only be created by a verified candidate (`candidateId == request.auth.uid`) for an existing `/jobs/{jobId}` where `status == "approved"` and `companyId` matches the job's `companyId`.
   - Initial application status must be `"submitted"`.
   - Once an application reaches terminal status `"hired"`, only Admin can alter it.
5. **Plan Order Integrity**:
   - Plan pricing must strictly match tier: `basic_99 -> 99 (1 credit)`, `featured_199 -> 199 (1 credit)`, `monthly_499 -> 499 (15 credits)`.
   - Only the owning company or Admin may read/list `/planOrders`.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Self-Admin Escalation**: Candidate creates `/users/{uid}` with `role: "admin"`.
2. **Shadow Field Injection on User**: User updates `/users/{uid}` adding ghost field `isVerifiedAdmin: true`.
3. **PII Snooping**: Candidate A attempts `get` on `/users/{candidateB_uid}` or `list` on `/users`.
4. **Unverified Email Spoof**: User with `email: "msingh409911@gmail.com"` and `email_verified: false` tries to approve a job.
5. **Company Self-Approval**: Company creates `/jobs/{jobId}` with `status: "approved"`.
6. **Company Spoofing**: Company A creates `/jobs/{jobId}` with `companyId: "companyB_uid"`.
7. **Pending Job Scraping**: Anonymous or Candidate user runs `list` on `/jobs` without `where("status", "==", "approved")`.
8. **Orphan / Fake Company Application**: Candidate creates `/applications/{appId}` referencing a non-existent `jobId` or mismatched `companyId`.
9. **Candidate Self-Hiring**: Candidate updates `/applications/{appId}` changing `status` to `"hired"`.
10. **Terminal State Bypass**: Company updates an application whose `status` is already `"hired"`.
11. **Plan Price Tampering**: Company creates `/planOrders/{orderId}` with `planTier: "monthly_499"` and `amountInr: 1`.
12. **Resource Exhaustion / ID Poisoning**: Attacker writes `/jobs/{200-char-invalid-id}` or injects a 50KB description string.
