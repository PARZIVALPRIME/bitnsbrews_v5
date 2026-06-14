import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import {
  getArticleBySlug,
  getAllArticles,
  getToc,
} from "@/lib/articles";
import { mdxComponents } from "@/components/mdx";
import { visualizers } from "@/components/visualizers";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { ArticleToc } from "@/components/article/ArticleToc";

// Statically generate a page for every published article at build time.
export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

// Don't render arbitrary unknown slugs.
export const dynamicParams = false;

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  const { meta } = article;
  const url = `/articles/${slug}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      url,
      publishedTime: meta.date,
      authors: [meta.author],
      ...(meta.cover ? { images: [meta.cover] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      ...(meta.cover ? { images: [meta.cover] } : {}),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const { meta, content } = article;
  const toc = getToc(content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    author: { "@type": "Person", name: meta.author },
    datePublished: meta.date,
    ...(meta.cover ? { image: meta.cover } : {}),
  };

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <ReadingProgress />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top chrome */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 h-16 bg-gradient-to-b from-[#0b0d12] via-[#0b0d12]/85 to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto text-[13px] font-semibold tracking-[-0.01em] text-white/50 hover:text-white/80 transition-colors"
        >
          Bits&apos;nBrews
        </Link>
        <Link
          href="/"
          className="pointer-events-auto group flex items-center gap-2 text-[12px] font-medium text-white/55 hover:text-white/90 border border-white/12 hover:border-white/25 rounded-lg px-4 py-2 transition-colors duration-200 bg-[#12151d]"
        >
          <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Back to the die</span>
        </Link>
      </div>

      <div className="max-w-[1020px] mx-auto px-6 sm:px-8 pt-28 pb-32 flex gap-12 items-start justify-center">
        <ArticleToc items={toc} />

        <article className="max-w-[700px] flex-grow">
          <header className="mb-14">
            {meta.track && (
              <div className="flex items-center gap-3 mb-7">
                <span className="text-[11px] font-medium tracking-[0.08em] text-[#8aa9ff] uppercase">
                  {meta.track}
                  {meta.trackNo ? ` · No. ${meta.trackNo}` : ""}
                </span>
              </div>
            )}
            <h1 className="article-serif text-[38px] sm:text-[46px] font-bold leading-[1.12] tracking-[-0.02em] text-white/95 mb-5">
              {meta.title}
            </h1>
            {meta.subtitle && (
              <p className="article-serif italic text-[19px] leading-[1.5] text-white/50 mb-8">
                {meta.subtitle}
              </p>
            )}
            <div className="flex items-center gap-4 pt-6 border-t border-white/8">
              <div className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center font-medium text-[13px] text-white/80">
                {meta.author[0]}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12.5px] font-medium text-white/85">
                  {meta.author}
                </span>
                <span className="text-[11.5px] text-white/40">
                  {formatDate(meta.date)}
                  {meta.readTime ? ` · ${meta.readTime}` : ""}
                </span>
              </div>
            </div>
          </header>

          <MDXRemote
            source={content}
            components={{ ...mdxComponents, ...visualizers }}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />

          <footer className="mt-16">
            <div className="flex items-center gap-3 justify-center mb-10">
              <span className="w-10 h-px bg-white/12" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="w-10 h-px bg-white/12" />
            </div>
            <div className="flex justify-center">
              <Link
                href="/articles"
                className="text-[12px] font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/35 px-6 py-2.5 rounded-lg transition-colors duration-200"
              >
                ← All articles
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
