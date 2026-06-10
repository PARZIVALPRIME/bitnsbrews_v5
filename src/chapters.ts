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
      "Every computation begins at the physical boundary. The outer enclosure provides structural integrity, thermal management pathways, and electromagnetic shielding — the invisible architecture before the silicon.",
  },
  {
    level: 2,
    id: "the-package",
    chapter: "02",
    tag: "PACKAGING",
    title: "The Package",
    subtitle: "MCM Silicon Substrate",
    description:
      "Where silicon meets the board. The Multi-Chip Module substrate bridges micro-bump pitches of <100μm to PCB traces in millimeters — a 1000× scale transition solved in organic laminate.",
  },
  {
    level: 3,
    id: "silicon-die",
    chapter: "03",
    tag: "SEMICONDUCTORS",
    title: "Silicon Die",
    subtitle: "3nm SoC Floorplan Layout",
    description:
      "12 billion transistors. 22×18mm of silicon. Fabricated with extreme ultraviolet (EUV) lithography at a 3nm Gate-All-Around process node. This is Bits'nBrews territory — where physics meets architecture.",
  },
  {
    level: 4,
    id: "the-library",
    chapter: "04",
    tag: "KNOWLEDGE MAP",
    title: "The Library",
    subtitle: "The Die as a Table of Contents",
    description:
      "Every functional block on this die maps to a concept worth understanding deeply. Click a block — or browse the index — to read the engineering story behind the silicon.",
  },
  {
    level: 5,
    id: "hub",
    chapter: "05",
    tag: "INDEX & DIRECTORY",
    title: "The Hub",
    subtitle: "Technical Index & Team Directory",
    description:
      "Welcome to the central hub. Browse all 9 general technical tracks, full articles, and meet the team behind the Bits'nBrews Digital Engineering Museum.",
  },
];

export const TOTAL = CHAPTERS.length;
