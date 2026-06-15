import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TRACKS } from "@/trackArticles";
import { getAllArticles } from "@/lib/articles";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string }>;
}): Promise<Metadata> {
  const { track } = await params;
  const t = TRACKS.find((x) => x.id === track);
  if (!t) return {};
  return {
    title: t.name,
    description: t.longSummary,
    alternates: { canonical: `/tracks/${t.id}` },
  };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  const t = TRACKS.find((x) => x.id === track);
  if (!t) notFound();

  const articles = getAllArticles().filter((a) => a.track === t.name);

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <SiteNav />

      <div className="max-w-[760px] mx-auto px-6 sm:px-8 pt-28 pb-24">
        <header className="mb-12">
          <div className="text-[40px] mb-4" aria-hidden>
            {t.icon}
          </div>
          <h1 className="article-serif text-[40px] sm:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white/95 mb-5">
            {t.name}
          </h1>
          <p className="article-serif text-[18px] leading-[1.7] text-white/60">
            {t.longSummary}
          </p>
        </header>

        <h2 className="text-[11px] font-mono tracking-[0.12em] uppercase text-white/35 mb-5">
          Pieces in this track
        </h2>

        {articles.length === 0 ? (
          <p className="text-white/45 text-[15px]">
            Nothing published in this track yet — subscribe from the hub to get
            them as they land.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="group block panel rounded-2xl p-6 hover:border-[#8aa9ff]/40 transition-colors duration-300"
              >
                <h3 className="article-serif text-[22px] font-semibold leading-[1.2] text-white/95 group-hover:text-white transition-colors mb-2">
                  {a.title}
                </h3>
                {a.subtitle && (
                  <p className="article-serif italic text-[15px] text-white/50">
                    {a.subtitle}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
