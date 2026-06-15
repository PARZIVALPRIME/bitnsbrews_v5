import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL, DISCORD_URL, SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Bits'nBrews — join our Discord, email us, or find us on social.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <SiteNav />

      <main className="max-w-[680px] mx-auto px-6 sm:px-8 pt-28 pb-24">
        <header className="mb-12">
          <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#8aa9ff] mb-4">
            Contact
          </div>
          <h1 className="article-serif text-[40px] sm:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white/95 mb-5">
            Say hello.
          </h1>
          <p className="article-serif text-[18px] leading-[1.7] text-white/60">
            Questions, article pitches, corrections, or just want to talk
            silicon? Here&apos;s how to reach us.
          </p>
        </header>

        {/* Discord — primary */}
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group block panel rounded-2xl p-7 mb-5 hover:border-[#8aa9ff]/40 transition-colors"
        >
          <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#8aa9ff] mb-2">
            Community
          </div>
          <div className="text-[20px] font-semibold text-white/95 group-hover:text-white transition-colors mb-1.5">
            Join our Discord
          </div>
          <p className="text-[14px] text-white/55 leading-relaxed">
            The fastest way to reach us and the rest of the community. Pitch a
            piece, ask a question, or follow along as articles get built.
          </p>
        </a>

        {/* Email */}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="group block panel rounded-2xl p-7 mb-5 hover:border-[#8aa9ff]/40 transition-colors"
        >
          <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-white/40 mb-2">
            Email
          </div>
          <div className="text-[18px] font-semibold text-white/95 group-hover:text-white transition-colors">
            {CONTACT_EMAIL}
          </div>
        </a>

        {/* Socials */}
        <div className="panel rounded-2xl p-7">
          <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-white/40 mb-4">
            Elsewhere
          </div>
          <div className="flex flex-wrap gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-white/70 hover:text-white border border-white/15 hover:border-[#8aa9ff]/50 px-5 py-2.5 rounded-lg transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
