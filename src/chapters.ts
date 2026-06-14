// Bits'nBrews chapter definitions — kept in a separate file so
// AppUI.tsx only exports the component (required for Vite Fast Refresh).

export const CHAPTERS = [
  {
    level: 1,
    id: "the-machine",
    chapter: "01",
    tag: "HARDWARE FOUNDATIONS",
    title: "The Machine",
    subtitle: "System Casing & Enclosure",
    description:
      "Every computer begins with its physical shell. The outer casing does a lot more than just look good. It keeps the machine cool, protects the parts inside, and shields them from electrical interference, creating the perfect environment for the silicon to do its job.",
  },
  {
    level: 2,
    id: "silicon-die",
    chapter: "02",
    tag: "SEMICONDUCTORS",
    title: "Silicon Die",
    subtitle: "3nm SoC Floorplan Layout",
    description:
      "Deep inside, billions of tiny switches work together on a piece of silicon smaller than a postage stamp. Made with advanced technology, this is the core where raw electricity turns into logical decisions.",
  },
  {
    level: 3,
    id: "the-library",
    chapter: "03",
    tag: "KNOWLEDGE MAP",
    title: "The Library",
    subtitle: "The Die as a Table of Contents",
    description:
      "Click on any of the glowing functional blocks on the die to pull up its dedicated deep dive, hardware specs, and related articles.",
  },
  {
    level: 4,
    id: "hub",
    chapter: "04",
    tag: "INDEX & DIRECTORY",
    title: "The Hub",
    subtitle: "Technical Index & Team Directory",
    description:
      "Welcome to our main library. Here you can explore our complete collection of technical articles, dive into specialized tracks, and meet the creators who put this guide together.",
  },
];

export const TOTAL = CHAPTERS.length;
