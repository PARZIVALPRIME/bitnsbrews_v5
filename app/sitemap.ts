import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllArticles } from "@/lib/articles";
import { TRACKS } from "@/trackArticles";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/articles`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...articles.map((a) => ({
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: a.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...TRACKS.map((t) => ({
      url: `${SITE_URL}/tracks/${t.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
