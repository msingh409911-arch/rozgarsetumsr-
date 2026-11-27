import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Landmark, ShieldCheck, Smartphone, X } from 'lucide-react';
import { createPlanOrder } from '../services/firestoreService';
import { JOB_PLANS, type Language, type PaidPlanTier, type PlanOrder } from '../types';

interface PlanCheckoutModalProps {
  planTier: PaidPlanTier | null;
  companyId: string;
  companyName: string;
  lang: Language;
  onClose: () => void;
  onSuccess: (order: PlanOrder) => void;
}

export const PlanCheckoutModal: React.FC<PlanCheckoutModalProps> = ({
  planTier,
  companyId,
  companyName,
  lang,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [paymentReference, setPaymentReference] = useState(() => `MSR-UPI-${Math.floor(100000 + Math.random() * 900000)}`);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!planTier) return null;

  const plan = JOB_PLANS[planTier];
  const planName = lang === 'hi' ? plan.nameHi : plan.nameEn;

  const handleConfirmPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentReference.trim().length < 4) {
      setErrorMsg(lang === 'hi' ? 'कृपया मान्य ट्रांज़ैक्शन संदर्भ दर्ज करें।' : 'Enter a valid payment reference.');
      return;
    }

    setBusy(true);
    setErrorMsg(null);
    try {
      const order = await createPlanOrder({
        companyId,
        companyName: companyName || 'Verified Employer',
        planTier,
        paymentMethod,
        paymentReference: paymentReference.trim(),
      });
      onSuccess(order);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to activate plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="text-xs font-semibold text-blue-700">
              {lang === 'hi' ? 'प्लान सक्रिय करें' : 'Activate Job Posting Plan'}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">{planName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plan checkout"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-slate-500">
              {lang === 'hi' ? 'क्रेडिट्स शामिल' : 'Job Credits Included'}
            </div>
            <div className="text-sm font-semibold text-slate-900 tabular-nums">
              {plan.credits} {lang === 'hi' ? 'जॉब पोस्ट' : plan.credits > 1 ? 'Job Posts' : 'Job Post'} · {plan.durationDays}{' '}
              {lang === 'hi' ? 'दिन' : 'Days'}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-num">₹{plan.priceInr}</div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{errorMsg}</div>
        )}

        <form onSubmit={handleConfirmPlan} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              {lang === 'hi' ? 'भुगतान माध्यम चुनें' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'upi' as const, label: 'UPI', icon: Smartphone },
                { id: 'card' as const, label: 'Card', icon: CreditCard },
                { id: 'netbanking' as const, label: 'NetBanking', icon: Landmark },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      paymentMethod === m.id
                        ? 'border-blue-700 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {lang === 'hi' ? 'भुगतान संदर्भ / UPI ट्रांज़ैक्शन ID' : 'Payment Reference / UPI UTR'}
            </label>
            <input
              type="text"
              required
              minLength={4}
              maxLength={80}
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'hi'
                ? 'रसीद और क्रेडिट सक्रियण तुरंत आपके कंपनी डैशबोर्ड में जुड़ जाएगा।'
                : 'Order receipt and job posting credits activate immediately in your Company Dashboard.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            {busy
              ? lang === 'hi'
                ? 'सक्रिय किया जा रहा है...'
                : 'Activating Plan...'
              : lang === 'hi'
              ? `₹${plan.priceInr} प्लान सक्रिय करें`
              : `Confirm & Activate ₹${plan.priceInr} Plan`}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'hi' ? 'सुरक्षित Firestore ऑर्डर रिकॉर्ड' : 'Secured in Cloud Firestore'}
          </div>
        </form>
      </div>
    </div>
  );
};
