import { ExperienceLoader } from "@/ExperienceLoader";

// The home page is the immersive 3D silicon experience. It is WebGL/Three.js,
// so it must run client-only (see ExperienceLoader). Article pages live under
// /articles and are server-rendered for SEO.
export default function HomePage() {
  return <ExperienceLoader />;
}
