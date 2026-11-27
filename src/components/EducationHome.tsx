import React, { useState } from 'react';

type Props = { onBack: () => void };

const subjects = ['हिंदी', 'English', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'कंप्यूटर'];

const lessons: Record<string, string[]> = {
  हिंदी: ['वर्णमाला और मात्राएँ', 'संज्ञा और सर्वनाम', 'वाक्य निर्माण'],
  English: ['Alphabet and Words', 'Nouns and Pronouns', 'Simple Sentences'],
  गणित: ['संख्याएँ और जोड़', 'घटाव और गुणा', 'भाग और भिन्न'],
  विज्ञान: ['पौधे और उनके भाग', 'मानव शरीर', 'जल और वायु'],
  'सामाजिक विज्ञान': ['हमारा भारत', 'इतिहास का परिचय', 'पर्यावरण और समाज'],
  कंप्यूटर: ['कंप्यूटर का परिचय', 'कीबोर्ड और माउस', 'इंटरनेट की जानकारी'],
};

const questions = [
  { q: 'पौधे अपना भोजन किस प्रक्रिया से बनाते हैं?', options: ['प्रकाश संश्लेषण', 'वाष्पीकरण', 'पाचन', 'श्वसन'], answer: 0 },
  { q: 'सूर्य किस दिशा से निकलता है?', options: ['पश्चिम', 'उत्तर', 'पूर्व', 'दक्षिण'], answer: 2 },
  { q: 'एक सप्ताह में कितने दिन होते हैं?', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'पानी का रासायनिक सूत्र क्या है?', options: ['CO2', 'H2O', 'O2', 'NaCl'], answer: 1 },
  { q: 'भारत की राजधानी क्या है?', options: ['मुंबई', 'नई दिल्ली', 'जयपुर', 'लखनऊ'], answer: 1 },
];

export function EducationHome({ onBack }: Props) {
  const [grade, setGrade] = useState('5');
  const [subject, setSubject] = useState('विज्ञान');
  const [tab, setTab] = useState<'study' | 'test'>('study');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-800 text-white px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <button onClick={onBack} className="mb-6 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold">← मुख्य होम पर जाएँ</button>
          <p className="text-emerald-200 text-sm font-bold">MSR EDUCATION PLATFORM</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black">MSR ज्ञानसेतु AI 📚</h1>
          <p className="mt-3 text-emerald-50">सीखें, अभ्यास करें और अपनी तैयारी जाँचें।</p>
          <div className="mt-6 max-w-xs">
            <label className="block text-sm mb-2">अपनी कक्षा चुनें</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full rounded-xl bg-white text-slate-900 p-3 font-bold">
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>कक्षा {i + 1}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-7">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setTab('study')} className={`rounded-xl p-4 font-bold ${tab === 'study' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border'}`}>📖 पढ़ाई करें</button>
          <button onClick={() => setTab('test')} className={`rounded-xl p-4 font-bold ${tab === 'test' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border'}`}>✍️ MCQ टेस्ट</button>
        </div>

        {tab === 'study' ? (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">विषय चुनें</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {subjects.map(s => <button key={s} onClick={() => setSubject(s)} className={`rounded-xl border p-3 font-semibold ${subject === s ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'}`}>{s}</button>)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-emerald-700 font-bold">कक्षा {grade} · {subject}</p>
              <h2 className="text-xl font-black mt-1 text-slate-900">आज का अध्ययन</h2>
              <div className="space-y-3 mt-4">
                {lessons[subject].map((lesson, i) => <div key={lesson} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><span className="rounded-lg bg-emerald-100 text-emerald-800 px-3 py-2 font-black">{i + 1}</span><span className="font-semibold text-slate-800">{lesson}</span></div>)}
              </div>
              <p className="mt-4 text-sm text-slate-500">ये शुरुआती अध्ययन विषय हैं। विस्तृत पाठ और AI शिक्षक की सुविधा आगे जोड़ी जाएगी।</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-emerald-700">कक्षा {grade} · अभ्यास टेस्ट</p>
            <h2 className="text-2xl font-black text-slate-900 mt-1">सामान्य ज्ञान एवं विज्ञान MCQ</h2>
            <p className="text-sm text-slate-500 mt-2">सभी 5 प्रश्नों के उत्तर चुनें और अपना परिणाम देखें।</p>
            <div className="space-y-6 mt-6">
              {questions.map((q, i) => (
                <div key={i}>
                  <p className="font-bold text-slate-900">{i + 1}. {q.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {q.options.map((option, j) => <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))} className={`rounded-lg border p-3 text-left text-sm ${answers[i] === j ? 'border-emerald-600 bg-emerald-50 font-bold' : 'border-slate-200'} ${submitted && j === q.answer ? 'border-green-600 bg-green-50' : ''}`}>{String.fromCharCode(65 + j)}. {option}</button>)}
                  </div>
                  {submitted && answers[i] !== q.answer && <p className="text-sm text-red-600 mt-2">सही उत्तर: {q.options[q.answer]}</p>}
                </div>
              ))}
            </div>
            {submitted ? (
              <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-center">
                <h3 className="text-2xl font-black text-emerald-800">आपके अंक: {score}/5</h3>
                <p className="mt-1 text-emerald-700">{score >= 4 ? 'बहुत अच्छा! शानदार प्रयास।' : 'अच्छा प्रयास! फिर से अभ्यास करें।'}</p>
                <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-white font-bold">दोबारा टेस्ट दें</button>
              </div>
            ) : (
              <button disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)} className="mt-7 w-full rounded-xl bg-emerald-700 p-4 text-white font-bold disabled:opacity-40">टेस्ट जमा करें</button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
