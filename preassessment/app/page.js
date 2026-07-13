'use client';

import { useState } from 'react';
import { ChevronRight, Loader, Check, CreditCard } from 'lucide-react';
import { SECTIONS, visibleQuestions } from '@/lib/questions';

export default function Home() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [stage, setStage] = useState('form'); // form -> generating -> offering -> paying -> done
  const [offering, setOffering] = useState(null);
  const [error, setError] = useState(null);

  const section = SECTIONS[sectionIndex];
  const questions = section ? visibleQuestions(section.id, answers) : [];

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function goNext() {
    // If we haven't fetched dynamic follow-ups for this section yet, do that first
    if (dynamicQuestions.length === 0) {
      setLoadingFollowUps(true);
      try {
        const res = await fetch('/api/next-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionTitle: section.title, answersSoFar: answers }),
        });
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setDynamicQuestions(data.questions);
          setLoadingFollowUps(false);
          return; // show the follow-ups before advancing
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingFollowUps(false);
    }

    // Advance to next section (clearing dynamic questions for the new section)
    setDynamicQuestions([]);
    if (sectionIndex < SECTIONS.length - 1) {
      setSectionIndex(sectionIndex + 1);
    } else {
      await generateOffering();
    }
  }

  async function generateOffering() {
    setStage('generating');
    setError(null);
    try {
      const res = await fetch('/api/generate-offering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error('Failed to generate offering');
      const data = await res.json();
      setOffering(data);
      setStage('offering');
    } catch (e) {
      console.error(e);
      setError('Something went wrong generating your assessment. Please try again.');
      setStage('form');
    }
  }

  async function unlockPlan() {
    setStage('paying');
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: answers.orgName,
          email: answers.email,
          situationAnalysis: offering.situationAnalysis,
          fullPlan: offering.fullPlan,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirect to real Stripe Checkout
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e) {
      console.error(e);
      setError('Payment setup failed. Please try again.');
      setStage('offering');
    }
  }

  const progressPercent = Math.round(((sectionIndex + 1) / SECTIONS.length) * 100);

  if (stage === 'generating') {
    return (
      <Centered>
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--primary-container)' }} />
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--ff-display)' }}>Analyzing your responses…</h2>
        <p className="mt-2" style={{ color: 'var(--on-surface-variant)' }}>Building your tailored assessment.</p>
      </Centered>
    );
  }

  if (stage === 'paying') {
    return (
      <Centered>
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--primary-container)' }} />
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--ff-display)' }}>Redirecting to secure checkout…</h2>
      </Centered>
    );
  }

  if (stage === 'offering' && offering) {
    return <OfferingScreen offering={offering} onUnlock={unlockPlan} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div style={{ borderBottom: '1px solid var(--outline-variant)' }}>
        <div className="max-w-xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
            Free AI Readiness Assessment
          </h1>
          <p className="mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            A few tailored questions to map out where AI can help.
          </p>
        </div>
      </div>

      <div
        className="sticky z-10"
        style={{ top: '56px', borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
      >
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: 'var(--primary-container)', boxShadow: 'var(--glow-cyan)' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h2
          className="text-xl font-semibold mb-6"
          style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}
        >
          {section.title}
        </h2>

        {error && <p className="mb-4" style={{ color: 'var(--error)' }}>{error}</p>}

        <div className="space-y-6">
          {questions.map((q) => (
            <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          ))}

          {dynamicQuestions.length > 0 && (
            <div className="pt-4" style={{ borderTop: '1px dashed var(--outline)' }}>
              <p
                className="text-xs font-medium mb-4 uppercase tracking-wide"
                style={{ fontFamily: 'var(--ff-mono)', color: 'var(--surface-tint)' }}
              >
                A couple of follow-ups based on what you shared
              </p>
              <div className="space-y-6">
                {dynamicQuestions.map((q) => (
                  <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={goNext}
          disabled={loadingFollowUps}
          className="mt-10 w-full font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: 'var(--primary-container)',
            color: 'var(--on-primary)',
            boxShadow: 'var(--glow-cyan)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-cyan-strong)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-cyan)'; }}
        >
          {loadingFollowUps ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : sectionIndex < SECTIONS.length - 1 || dynamicQuestions.length > 0 ? (
            <>
              Continue <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            'Generate My Assessment'
          )}
        </button>
      </div>
    </div>
  );
}

function QuestionField({ question, value, onChange }) {
  const fieldStyle = {
    background: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
        {question.label}
        {question.required && <span className="ml-1" style={{ color: 'var(--surface-tint)' }}>*</span>}
      </label>

      {question.type === 'text' || question.type === 'email' || question.type === 'tel' ? (
        <input
          type={question.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg focus:outline-none"
          style={fieldStyle}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary-container)'; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
        />
      ) : question.type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg focus:outline-none resize-none"
          style={fieldStyle}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary-container)'; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
        />
      ) : question.type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg focus:outline-none"
          style={fieldStyle}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary-container)'; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
        >
          <option value="">Select an option</option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : question.type === 'radio' ? (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center p-3 rounded-lg cursor-pointer"
              style={{ border: '1px solid var(--outline-variant)' }}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--primary-container)' }}
              />
              <span className="ml-3" style={{ color: 'var(--on-surface-variant)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      ) : question.type === 'checkbox' ? (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const arr = value || [];
            return (
              <label
                key={opt}
                className="flex items-center p-3 rounded-lg cursor-pointer"
                style={{ border: '1px solid var(--outline-variant)' }}
              >
                <input
                  type="checkbox"
                  checked={arr.includes(opt)}
                  onChange={() =>
                    onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt])
                  }
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--primary-container)' }}
                />
                <span className="ml-3" style={{ color: 'var(--on-surface-variant)' }}>{opt}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function OfferingScreen({ offering, onUnlock }) {
  return (
    <div className="min-h-screen py-12 px-6" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-lg p-8 mb-8"
          style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary-container)' }}
            >
              <Check className="w-5 h-5" style={{ color: 'var(--on-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
              Your Situation, At a Glance
            </h1>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {offering.situationAnalysis}
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid var(--outline-variant)' }}>
          <div
            className="whitespace-pre-wrap leading-relaxed p-8 select-none pointer-events-none"
            style={{ color: 'var(--on-surface-variant)', filter: 'blur(4px)', maxHeight: '260px', overflow: 'hidden' }}
            aria-hidden="true"
          >
            {offering.fullPlan}
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            style={{ background: 'rgba(12, 19, 36, 0.82)' }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
              Your Full Plan Is Ready
            </h2>
            <p className="max-w-sm mb-6" style={{ color: 'var(--on-surface-variant)' }}>
              Three ranked recommendations, a phased implementation roadmap, and investment guidance tailored to what you shared.
            </p>
            <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--ff-mono)', color: 'var(--on-surface)' }}>
              $750
            </p>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Credited in full toward implementation if you move forward.
            </p>
            <button
              onClick={onUnlock}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: 'var(--primary-container)', color: 'var(--on-primary)', boxShadow: 'var(--glow-cyan)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-cyan-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-cyan)'; }}
            >
              <CreditCard className="w-4 h-4" /> Unlock Your Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--background)' }}
    >
      <div className="text-center" style={{ color: 'var(--on-surface)' }}>{children}</div>
    </div>
  );
}
