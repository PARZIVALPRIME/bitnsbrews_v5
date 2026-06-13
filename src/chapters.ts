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
    id: "the-package",
    chapter: "02",
    tag: "PACKAGING",
    title: "The Package",
    subtitle: "MCM Silicon Substrate",
    description:
      "This is where the brain of the computer connects to the rest of the system. The package acts as a bridge, translating microscopic connections on the chip to larger wires on the main circuit board so they can talk to each other.",
  },
  {
    level: 3,
    id: "silicon-die",
    chapter: "03",
    tag: "SEMICONDUCTORS",
    title: "Silicon Die",
    subtitle: "3nm SoC Floorplan Layout",
    description:
      "Deep inside, billions of tiny switches work together on a piece of silicon smaller than a postage stamp. Made with advanced technology, this is the core where raw electricity turns into logical decisions.",
  },
  {
    level: 4,
    id: "the-library",
    chapter: "04",
    tag: "KNOWLEDGE MAP",
    title: "The Library",
    subtitle: "The Die as a Table of Contents",
    description:
      "Click on any of the glowing functional blocks on the die to pull up its dedicated deep dive, hardware specs, and related articles.",
  },
  {
    level: 5,
    id: "hub",
    chapter: "05",
    tag: "INDEX & DIRECTORY",
    title: "The Hub",
    subtitle: "Technical Index & Team Directory",
    description:
      "Welcome to our main library. Here you can explore our complete collection of technical articles, dive into specialized tracks, and meet the creators who put this guide together.",
  },
];

export const TOTAL = CHAPTERS.length;
