import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DISCORD_URL, TEAM } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Bits'nBrews is a technical publication and interactive engineering museum — long-form writing on computer architecture, paired with a navigable 3D silicon die.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <SiteNav />

      <main className="max-w-[760px] mx-auto px-6 sm:px-8 pt-28 pb-24">
        <header className="mb-12">
          <div className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#8aa9ff] mb-4">
            About
          </div>
          <h1 className="article-serif text-[40px] sm:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white/95 mb-6">
            An interactive engineering museum.
          </h1>
          <p className="article-serif text-[18px] leading-[1.7] text-white/65">
            Bits&apos;nBrews bridges the gap between academic VLSI briefs and
            practical chip design. We explain how silicon really works through
            spatial 3D graphics, real-time pipeline simulations, and deep-dive
            technical journalism — no simplification, no hand-waving.
          </p>
        </header>

        <section className="mb-14">
          <h2 className="article-serif text-[24px] font-semibold text-white/95 mb-4">
            Why we built this
          </h2>
          <p className="article-serif text-[16.5px] leading-[1.85] text-white/65 mb-5">
            Most hardware writing falls into one of two traps: textbook diagrams
            that omit the messy reality, or marketing that flattens the
            engineering trade-offs entirely. We sit in the middle — taking real
            silicon and showing the design intent, the historical alternatives,
            and the consequences engineers actually live with.
          </p>
          <p className="article-serif text-[16.5px] leading-[1.85] text-white/65">
            The die you scroll through on the home page is the table of contents:
            each block opens onto the writing behind it.
          </p>
        </section>

        <section className="mb-14">
          <h2 className="article-serif text-[24px] font-semibold text-white/95 mb-6">
            The team
          </h2>
          <div className="flex flex-col gap-6">
            {TEAM.map((m) => (
              <div
                key={m.name}
                className="panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6"
              >
                <div className="sm:w-[200px] shrink-0">
                  <div className="text-[15px] font-semibold text-white/90">
                    {m.name}
                  </div>
                  <div className="text-[11px] font-mono tracking-wide uppercase text-[#8aa9ff] mt-1">
                    {m.role}
                  </div>
                </div>
                <p className="text-[14px] leading-[1.7] text-white/60">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-7 text-center">
          <h2 className="article-serif text-[22px] font-semibold text-white/95 mb-2">
            Want to write with us, or just talk shop?
          </h2>
          <p className="text-[14px] text-white/55 mb-6 max-w-md mx-auto leading-relaxed">
            We hang out in our Discord. Come say hi, pitch a piece, or argue
            about cache hierarchies.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-[#0b0d12] bg-white/95 hover:bg-white transition-colors px-6 py-3 rounded-lg"
            >
              Join the Discord
            </a>
            <Link
              href="/contact"
              className="text-[13px] font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/35 px-6 py-3 rounded-lg transition-colors"
            >
              Contact
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
