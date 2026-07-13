'use client';

import { useEffect, useState } from 'react';

export default function BookingConfirmed() {
  const [status, setStatus] = useState('loading'); // loading -> ready -> error
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setStatus('error');
      return;
    }

    fetch(`/api/get-plan?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load plan');
        return res.json();
      })
      .then((data) => {
        setPlan(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--background)' }}>
        <p style={{ color: 'var(--on-surface-variant)' }}>Loading your plan…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--background)' }}>
        <div
          className="rounded-lg p-12 max-w-md text-center"
          style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
        >
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
            Payment Received
          </h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>
            Check your email for a copy of your plan. If you don't see it shortly, contact us and we'll resend it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-lg p-8 mb-8"
          style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
        >
          <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
            Your Plan Is Unlocked
          </h1>
          <div className="whitespace-pre-wrap leading-relaxed mb-6" style={{ color: 'var(--on-surface-variant)' }}>
            {plan.situationAnalysis}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {plan.fullPlan}
          </div>
        </div>
      </div>
    </div>
  );
}
