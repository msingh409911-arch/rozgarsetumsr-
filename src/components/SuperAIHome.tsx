import React, { useState } from 'react';
import { BriefcaseBusiness, GraduationCap, School, Sparkles, UserRound } from 'lucide-react';

type Props = {
  onOpenJobs: () => void;
  onOpenEducation: () => void;
  onOpenSchools: () => void;
};

export function SuperAIHome({ onOpenJobs, onOpenEducation, onOpenSchools }: Props) {
  const [showHelplines, setShowHelplines] = useState(false);
  const cards = [
    {
      title: 'RozgarSetuMSR',
      subtitle: 'सरकारी और प्राइवेट नौकरियाँ',
      description: 'नौकरी खोजें, आवेदन करें और कंपनियों से जुड़ें।',
      icon: BriefcaseBusiness,
      action: onOpenJobs,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      title: 'MSR ज्ञानसेतु AI',
      subtitle: 'बच्चों की पढ़ाई और शिक्षा',
      description: 'पढ़ाई, अभ्यास, MCQ और ऑनलाइन टेस्ट की सुविधा।',
      icon: GraduationCap,
      action: onOpenEducation,
      color: 'from-emerald-500 to-teal-700',
    },
    {
      title: 'School Promotion',
      subtitle: 'स्कूल प्रचार और एडमिशन',
      description: 'स्कूल की जानकारी, प्रवेश प्रचार और अभिभावकों से संपर्क।',
      icon: School,
      action: onOpenSchools,
      color: 'from-orange-500 to-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Sparkles className="h-9 w-9 text-amber-300" />
          </div>
          <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-amber-300">ONE APP · THREE SERVICES</p>
          <h1 className="text-3xl font-black sm:text-5xl">MSR SUPER AI APP</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            रोजगार · शिक्षा · स्कूल एडमिशन — एक ही प्लेटफॉर्म पर
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-200">
            <UserRound className="h-4 w-4 text-amber-300" />
            Founder: Manish Singh Rajpoot
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">आप क्या करना चाहते हैं?</h2>
          <p className="mt-2 text-sm text-slate-400">अपनी जरूरत के अनुसार एक सेवा चुनें</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map(({ title, subtitle, description, icon: Icon, action, color }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              className="group rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-left shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color}`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold">{title}</h3>
              <p className="mt-2 font-semibold text-amber-300">{subtitle}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">{description}</p>
              <span className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition group-hover:bg-amber-300">
                खोलें →
              </span>
            </button>
          ))}
        </div>
      </section>

      
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 text-center">
          <h2 className="text-2xl font-bold">🚨 Emergency Helpline</h2>
          <button onClick={() => setShowHelplines(!showHelplines)}
            className="mt-5 rounded-xl bg-red-600 px-6 py-3 font-bold text-white">
            {showHelplines ? 'नंबर बंद करें' : 'हेल्पलाइन नंबर देखें'}
          </button>
          {showHelplines && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['आपातकालीन सहायता - भारत', '112'],
                ['राष्ट्रीय राजमार्ग सहायता', '1033'],
                ['रेलवे सहायता', '139'],
                ['महिला हेल्पलाइन - UP', '1090'],
                ['CM हेल्पलाइन - UP', '1076'],
                ['CM हेल्पलाइन - MP', '181'],
              ].map(([name, number]) => (
                <a key={number} href={'tel:' + number}
                  className="flex justify-between rounded-xl bg-white/10 p-4 text-left">
                  <span>{name}</span>
                  <strong className="text-xl text-amber-300">{number}</strong>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-7 text-center text-sm text-slate-400">
        <p className="font-semibold text-white">MSR SUPER AI APP</p>
        <p className="mt-1">Founded by Manish Singh Rajpoot</p>
        <p className="mt-2">रोजगार • शिक्षा • स्कूल विकास</p>
      </footer>
    </div>
  );
}
