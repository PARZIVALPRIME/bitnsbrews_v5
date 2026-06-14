// Registry of custom, per-article visualizers referenced by name inside MDX.
// To add one: build a component (client if interactive — add "use client"),
// then register it here. In an .mdx file, drop it in like <MissRateDemo />.
import { MissRateDemo } from "./MissRateDemo";

export const visualizers = {
  MissRateDemo,
};
