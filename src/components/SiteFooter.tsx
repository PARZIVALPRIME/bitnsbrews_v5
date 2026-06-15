import Link from "next/link";
import { CONTACT_EMAIL, DISCORD_URL, SITE_NAME, SOCIALS } from "@/lib/site";

// Footer for content pages (About, Contact, Articles, Tracks). Lightweight —
// the newsletter block lives in the hub's own Footer inside the experience.
export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#0b0d12]">
      <div className="max-w-[1020px] mx-auto px-6 sm:px-8 py-12 flex flex-col sm:flex-row gap-8 justify-between">
        <div>
          <div className="text-[14px] font-semibold text-white/85 mb-1">
            {SITE_NAME}
          </div>
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
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors"
            >
              Discord
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors"
            >
              Email
            </a>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12.5px] text-white/55 hover:text-[#8aa9ff] transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-[1020px] mx-auto px-6 sm:px-8 py-5 text-[11px] text-white/35">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
