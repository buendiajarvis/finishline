'use client';

export default function BookingConfirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      <div
        className="rounded-lg p-12 max-w-md text-center"
        style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>
          Check your email for confirmation details. We'll follow up shortly to schedule your session.
        </p>
      </div>
    </div>
  );
}
