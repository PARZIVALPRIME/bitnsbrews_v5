import React, { useState } from "react";

interface FooterProps {
  onNavigateToDie?: () => void;
  onNavigateToTracks?: () => void;
}

export function Footer({ onNavigateToDie, onNavigateToTracks }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      {/* ── Subscribe Newsletter: Full Sweep Footer ── */}
      <div className="w-full border-t border-white/8 bg-[#12151d] mt-16 shrink-0 relative overflow-hidden">
        {/* Glowy Gradient Orb */}
        <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#8aa9ff] to-[#5bd6a2] rounded-full blur-[100px] opacity-[0.08] pointer-events-none" />
        
        <div className="max-w-[760px] mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex-1 text-left">
            <h2 className="article-serif text-[24px] font-semibold tracking-tight text-white/95 mb-2.5">
              The newsletter
            </h2>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-[440px]">
              Spatial-first writeups on silicon layouts, execution pipelines, and
              instruction-set trade-offs. Written for engineers and the engineering-curious.
            </p>
          </div>

          <div className="w-full md:w-[320px] shrink-0">
            {subscribed ? (
              <div className="py-2 text-center animate-fade-in">
                <div className="relative w-11 h-11 mx-auto mb-3 flex items-center justify-center rounded-full bg-[#5bd6a2]/12 border border-[#5bd6a2]/40">
                  <svg className="w-4 h-4 text-[#5bd6a2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark" />
                  </svg>
                </div>
                <div className="text-[13px] font-medium text-white/90">
                  You&apos;re on the list
                </div>
                <p className="text-[11px] text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
                  Check your inbox to confirm your subscription.
                </p>
              </div>
            ) : (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!email) return;
                    setSubmitting(true);
                    setTimeout(() => {
                      setSubmitting(false);
                      setSubscribed(true);
                    }, 1000);
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
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Subscribing
                      </span>
                    ) : (
                      "SUBSCRIBE"
                    )}
                  </button>
                </form>
                <p className="mt-3 text-left text-[11px] text-white/35">
                  Published fortnightly. No marketing, unsubscribe anytime.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Sub-Footer Links & Large Bleeding Watermark ── */}
      <div className="w-full border-t border-white/5 bg-[#0b0d12] py-14 pb-20 relative overflow-hidden shrink-0">
        <div className="max-w-[760px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
          {/* Left side: Logo & Copyright */}
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="text-[13px] font-bold text-white/80">Bits&apos;nBrews</span>
            <span className="text-[11px] text-white/35">
              © {new Date().getFullYear()} bitsnbrews. All rights reserved.
            </span>
          </div>

          {/* Right side: Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 text-[11px] font-mono tracking-wider text-white/45">
            <button
              onClick={onNavigateToDie}
              className="hover:text-[#8aa9ff] transition-colors cursor-pointer uppercase"
            >
              Interactive Die
            </button>
            <button
              onClick={onNavigateToTracks}
              className="hover:text-[#8aa9ff] transition-colors cursor-pointer uppercase"
            >
              Tracks
            </button>
            <a href="#" className="hover:text-[#8aa9ff] transition-colors uppercase">About</a>
            <a href="#" className="hover:text-[#8aa9ff] transition-colors uppercase">Contact</a>
            <a href="#" className="hover:text-[#8aa9ff] transition-colors uppercase">Terms</a>
          </div>
        </div>
        
        {/* Bleeding Watermark */}
        <div className="absolute right-[-4%] bottom-[-20%] pointer-events-none select-none overflow-hidden z-0 flex items-end justify-end">
          <span 
            className="article-serif italic font-semibold text-white/[0.02] leading-none whitespace-nowrap"
            style={{ fontSize: "clamp(120px, 15vw, 150px)" }}
          >
            bits&apos;nbrews
          </span>
        </div>
      </div>
    </>
  );
}
