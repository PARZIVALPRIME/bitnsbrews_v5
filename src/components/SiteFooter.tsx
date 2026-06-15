import Link from "next/link";
import { CONTACT_EMAIL, DISCORD_URL, SITE_NAME, SOCIALS } from "@/lib/site";
import { NewsletterSignup } from "./NewsletterSignup";

// The single, canonical footer — used on content pages, the article reader, and
// the hub inside the 3D experience, so the whole site reads as one design.
export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/8 bg-[#0b0d12] overflow-hidden">
      {/* Newsletter */}
      <div className="relative border-b border-white/8 bg-[#12151d]">
        <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#8aa9ff] to-[#5bd6a2] rounded-full blur-[100px] opacity-[0.07] pointer-events-none" />
        <div className="max-w-[1020px] mx-auto px-6 sm:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="flex-1">
            <h2 className="article-serif text-[22px] font-semibold tracking-tight text-white/95 mb-2">
              The newsletter
            </h2>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-[440px]">
              New long-form pieces on silicon and processor design, straight to your
              inbox. Written for engineers and the engineering-curious.
            </p>
          </div>
          <div className="w-full md:w-[340px] shrink-0">
            <NewsletterSignup />
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-[1020px] mx-auto px-6 sm:px-8 py-12 flex flex-col sm:flex-row gap-8 justify-between relative z-10">
        <div>
          <div className="text-[14px] font-semibold text-white/85 mb-1">{SITE_NAME}</div>
          <p className="text-[12.5px] text-white/45 max-w-[280px] leading-relaxed">
            A technical publication on how silicon really works.
          </p>
        </div>

        <div className="flex gap-12">
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-white/35">
              Explore
            </span>
            <Link href="/articles" className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors">
              Articles
            </Link>
            <Link href="/about" className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-white/35">
              Connect
            </span>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors">
              Discord
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors">
              Email
            </a>
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 relative z-10">
        <div className="max-w-[1020px] mx-auto px-6 sm:px-8 py-5 text-[11px] text-white/35">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>

      {/* Bleeding watermark */}
      <div className="absolute right-[-4%] bottom-[-24%] pointer-events-none select-none overflow-hidden z-0 flex items-end justify-end">
        <span
          className="article-serif italic font-semibold text-white/[0.015] leading-none whitespace-nowrap"
          style={{ fontSize: "clamp(100px, 14vw, 150px)" }}
        >
          bits&apos;nbrews
        </span>
      </div>
    </footer>
  );
}
