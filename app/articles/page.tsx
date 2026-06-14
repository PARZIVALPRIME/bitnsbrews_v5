import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, type ArticleMeta } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Long-form technical writing on computer architecture and silicon design from Bits'nBrews.",
  alternates: { canonical: "/articles" },
};

function ArticleCard({ a }: { a: ArticleMeta }) {
  return (
    <Link
      href={`/articles/${a.slug}`}
      className="group block panel rounded-2xl p-6 sm:p-7 hover:border-[#8aa9ff]/40 transition-colors duration-300"
    >
      {a.track && (
        <div className="text-[11px] font-medium tracking-[0.08em] text-[#8aa9ff] uppercase mb-3">
          {a.track}
          {a.trackNo ? ` · No. ${a.trackNo}` : ""}
        </div>
      )}
      <h2 className="article-serif text-[24px] font-semibold leading-[1.2] tracking-[-0.01em] text-white/95 group-hover:text-white transition-colors mb-2">
        {a.title}
      </h2>
      {a.subtitle && (
        <p className="article-serif italic text-[15.5px] leading-[1.5] text-white/50 mb-4">
          {a.subtitle}
        </p>
      )}
      <div className="text-[11.5px] text-white/40">
        {a.author}
        {a.readTime ? ` · ${a.readTime}` : ""}
      </div>
    </Link>
  );
}

export default function ArticlesIndex() {
  const articles = getAllArticles();

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 h-16 bg-gradient-to-b from-[#0b0d12] via-[#0b0d12]/85 to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto text-[13px] font-semibold tracking-[-0.01em] text-white/50 hover:text-white/80 transition-colors"
        >
          Bits&apos;nBrews
        </Link>
        <Link
          href="/"
          className="pointer-events-auto text-[12px] font-medium text-white/55 hover:text-white/90 border border-white/12 hover:border-white/25 rounded-lg px-4 py-2 transition-colors duration-200 bg-[#12151d]"
        >
          ← The die
        </Link>
      </div>

      <div className="max-w-[760px] mx-auto px-6 sm:px-8 pt-28 pb-32">
        <header className="mb-14">
          <h1 className="article-serif text-[40px] sm:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white/95 mb-4">
            Articles
          </h1>
          <p className="article-serif text-[18px] leading-[1.6] text-white/55">
            Long-form pieces on how silicon really works — no simplification, no
            hand-waving.
          </p>
        </header>

        {articles.length === 0 ? (
          <p className="text-white/45 text-[15px]">No articles published yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {articles.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
