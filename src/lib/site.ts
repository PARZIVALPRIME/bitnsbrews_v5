// Central site config. Canonical URLs, sitemap, robots, OpenGraph, and the
// shared nav/footer all read from here.
//
// TODO(you): replace the placeholders below with your real links before launch.
//  - SITE_URL: your domain once purchased (e.g. https://bitsnbrews.com)
//  - DISCORD_URL: your real Discord invite
//  - CONTACT_EMAIL: the inbox you want readers to use
//  - SOCIALS: real profile URLs (delete any you don't use)
export const SITE_URL = "https://bitsnbrews.example.com";
export const SITE_NAME = "Bits'nBrews";

export const DISCORD_URL = "https://discord.gg/your-invite"; // TODO: real invite
export const CONTACT_EMAIL = "hello@bitsnbrews.com"; // TODO: real inbox

export interface SocialLink {
  label: string;
  href: string;
}

// TODO: replace hrefs with your real profiles; remove entries you don't use.
export const SOCIALS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/PARZIVALPRIME" },
  { label: "X", href: "https://x.com/your-handle" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/your-page" },
];

// Team — reused on the About page. Roles mirror the hub credits.
export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export const TEAM: TeamMember[] = [
  {
    name: "Dhruv",
    role: "Architecture",
    bio: "Shapes the editorial direction and the architecture deep-dives — deciding what stories the silicon tells and how each piece is built.",
  },
  {
    name: "Gemini Partner",
    role: "Engineering",
    bio: "Builds the site, the interactive visualizers, and the tooling behind each article.",
  },
  {
    name: "Parzival Prime",
    role: "Graphics",
    bio: "Directs the visual language — the 3D die experience, illustrations, and the overall look and feel.",
  },
];
