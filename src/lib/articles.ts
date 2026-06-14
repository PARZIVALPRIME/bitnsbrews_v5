// Server-only content layer for long-form articles.
// Articles are authored as MDX files in /content/articles/<slug>.mdx with YAML
// frontmatter. This module reads them off disk at build time (SSG) — it must
// only ever run on the server (it uses node:fs).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

export interface ArticleFrontmatter {
  title: string;
  subtitle?: string;
  description: string;
  author: string;
  date: string; // ISO, e.g. "2026-01-15"
  readTime?: string;
  track?: string;
  trackNo?: string;
  /** Which die block this piece is the deep-dive for (links the 3D scene to the article). */
  blockId?: string;
  cover?: string;
  /** Set false to keep a draft out of listings, sitemap, and static params. */
  published?: boolean;
}

export interface ArticleMeta extends ArticleFrontmatter {
  slug: string;
}

export interface TocItem {
  text: string;
  id: string;
  level: number; // 2 = h2, 3 = h3
}

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export function getArticleSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

function readArticleFile(slug: string) {
  const fullPath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(fullPath, "utf8");
  return matter(raw);
}

export function getArticleBySlug(
  slug: string
): { meta: ArticleMeta; content: string } | null {
  try {
    const { data, content } = readArticleFile(slug);
    return { meta: { ...(data as ArticleFrontmatter), slug }, content };
  } catch {
    return null;
  }
}

export function getAllArticles(
  { includeUnpublished = false }: { includeUnpublished?: boolean } = {}
): ArticleMeta[] {
  return getArticleSlugs()
    .map((slug) => {
      const { data } = readArticleFile(slug);
      return { ...(data as ArticleFrontmatter), slug };
    })
    .filter((a) => includeUnpublished || a.published !== false)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Extract a table of contents from raw MDX by scanning markdown headings.
// Uses the same slugger as rehype-slug so anchor links match the rendered ids.
export function getToc(content: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[*_`]/g, "").trim();
      toc.push({ text, id: slugger.slug(text), level });
    }
  }
  return toc;
}
