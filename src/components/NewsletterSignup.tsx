"use client";

import { useState } from "react";

// Newsletter signup. NOTE: not yet wired to a backend — submitting just shows
// the success state locally. Hook this up to Supabase/Resend in the backend phase.
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (subscribed) {
    return (
      <div className="py-2 text-center animate-fade-in">
        <div className="relative w-11 h-11 mx-auto mb-3 flex items-center justify-center rounded-full bg-[#5bd6a2]/12 border border-[#5bd6a2]/40">
          <svg className="w-4 h-4 text-[#5bd6a2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark" />
          </svg>
        </div>
        <div className="text-[13px] font-medium text-white/90">You&apos;re on the list</div>
        <p className="text-[11px] text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
          We&apos;ll email you when the next piece ships.
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email) return;
          setSubmitting(true);
          setTimeout(() => {
            setSubmitting(false);
            setSubscribed(true);
          }, 800);
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 bg-[#0b0d12] border border-white/12 focus:border-[#8aa9ff] focus:ring-1 focus:ring-[#8aa9ff]/40 outline-none text-[13px] px-4 py-3 rounded-lg text-white transition-colors duration-200 placeholder-white/30"
          required
          disabled={submitting}
        />
        <button
          type="submit"
          className="bg-white/95 hover:bg-white text-[#0b0d12] font-medium text-[13px] px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
          disabled={submitting}
        >
          {submitting ? "Subscribing" : "Subscribe"}
        </button>
      </form>
      <p className="mt-3 text-left text-[11px] text-white/35">
        New pieces, occasionally. No spam, unsubscribe anytime.
      </p>
    </>
  );
}
