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
    id: "cpu-cores",
    chapter: "04",
    tag: "COMPUTE CORES",
    title: "CPU Clusters",
    subtitle: "Cortex-X4 Performance Cores",
    description:
      "High-performance Cortex-X4 performance cores and Cortex-A720 efficiency cores. Optimized for single-threaded speed and low-power standby operations, dynamically balancing work via DVFS.",
  },
  {
    level: 5,
    id: "gpu-cores",
    chapter: "05",
    tag: "GRAPHICS & PARALLEL",
    title: "Graphics Engine",
    subtitle: "16-Core Shader Pipeline",
    description:
      "The parallel processing engine of the SoC. Renders high-fidelity mobile graphics and accelerates parallel compute tasks with tile-based-deferred rendering and hardware raytracing.",
  },
  {
    level: 6,
    id: "npu-cores",
    chapter: "06",
    tag: "NEURAL PROCESSING",
    title: "Neural Accelerator",
    subtitle: "45 TOPS Systolic AI Engine",
    description:
      "A high-throughput systolic array optimized for deep neural network operations, matrix multiplication, and transformer models. Pre-fetches weights via dedicated SRAM.",
  },
  {
    level: 7,
    id: "modem",
    chapter: "07",
    tag: "COMMUNICATIONS",
    title: "Baseband Modem",
    subtitle: "RF-Isolated 5G Sub-system",
    description:
      "An independent sub-SoC managing high-speed cellular links. Thermally and electromagnetically shielded from the digital core to prevent signal interference during gigabit transfers.",
  },
  {
    level: 8,
    id: "multimedia",
    chapter: "08",
    tag: "MEDIA PROCESSING",
    title: "Media Pipeline",
    subtitle: "14-bit RAW Image & Codecs",
    description:
      "Integrates the Image Signal Processor (ISP), hardware video encoders/decoders (AV1/HEVC), and audio DSPs. Processes high-bandwidth media streams offloading the main CPU cores.",
  },
  {
    level: 9,
    id: "memory",
    chapter: "09",
    tag: "SYSTEM MEMORY",
    title: "Memory & Fabric",
    subtitle: "16MB System Cache & DRAM",
    description:
      "Coordinates communication between all blocks. The 16MB System Level Cache (SLC) caches memory accesses before sending them to the 4-channel LPDDR5x DRAM controller.",
  },
  {
    level: 10,
    id: "pipeline",
    chapter: "10",
    tag: "VLSI & PIPELINES",
    title: "Execution Pipeline",
    subtitle: "Instruction Flow Pipeline",
    description:
      "Information in motion. Instructions traverse Fetch → Decode → Rename → Dispatch → Issue → Execute → Retire — a choreography invisible to the programmer, fundamental to every computation.",
  },
];

export const TOTAL = CHAPTERS.length;
