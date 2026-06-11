// Exact coordinate table from the bitnbrews 3nm SoC brief.
// cx/cz centers, w/d footprints, h extrusion heights.
// Die: X[-11,+11], Z[-9,+9], Y=0 is the die surface, blocks extrude UP.
// 1u = 0.5mm real-world. Gap between adjacent blocks: 0.08u (0.04u each side).

export type DetailKind =
  | "cpuBig"
  | "cpuEff"
  | "gpu"
  | "npu"
  | "modem"
  | "isp"
  | "dsp"
  | "video"
  | "slc"
  | "memctrl"
  | "pmu"
  | "lpddr"
  | "ioring";

export interface Block {
  id: string;
  name: string;
  fn: string;
  description: string;
  specs: { label: string; value: string }[];
  detail: DetailKind;
  cx: number;
  cz: number;
  w: number;
  d: number;
  h: number;
  lift: number;
  color: string;     // deep body color per domain
  base: string;      // very slightly lighter top-surface color
  roughness: number;
  metalness: number;
  showLabel: boolean;
  labelDir?: [number, number, number];
}

export type SocMode = "Idle" | "Gaming" | "AI" | "Camera" | "Web" | "Video";

// Per-domain accent colors — drive emissive glow, selection outlines, labels,
// legends, and traffic streams. Keyed by DetailKind so LPDDR channels share one.
export const DOMAIN_ACCENTS: Record<DetailKind, string> = {
  cpuBig: "#6d9bff",
  cpuEff: "#57c2b4",
  gpu: "#a78bfa",
  npu: "#f277a8",
  modem: "#e8a05c",
  isp: "#62c46f",
  dsp: "#4fc1a6",
  video: "#45b890",
  slc: "#4fc3e8",
  memctrl: "#58a8dc",
  pmu: "#b9c2d0",
  lpddr: "#7c90b0",
  ioring: "#93a1b5",
};

export const accentFor = (b: Block): string => DOMAIN_ACCENTS[b.detail];

// Utilization (0..1) for each block in each scenario — drives emissive glow.
export const UTILIZATION: Record<string, Record<SocMode, number>> = {
  "cpu-big":  { Idle: 0.02, Gaming: 0.75, AI: 0.15, Camera: 0.10, Web: 0.30, Video: 0.20 },
  "cpu-eff":  { Idle: 0.10, Gaming: 0.35, AI: 0.20, Camera: 0.25, Web: 0.50, Video: 0.35 },
  "gpu":      { Idle: 0.02, Gaming: 1.00, AI: 0.30, Camera: 0.35, Web: 0.40, Video: 0.45 },
  "npu":      { Idle: 0.00, Gaming: 0.10, AI: 1.00, Camera: 0.55, Web: 0.05, Video: 0.15 },
  "modem":    { Idle: 0.05, Gaming: 0.50, AI: 0.15, Camera: 0.15, Web: 0.90, Video: 0.70 },
  "isp":      { Idle: 0.00, Gaming: 0.05, AI: 0.20, Camera: 1.00, Web: 0.05, Video: 0.25 },
  "dsp":      { Idle: 0.10, Gaming: 0.20, AI: 0.25, Camera: 0.50, Web: 0.30, Video: 0.40 },
  "video":    { Idle: 0.00, Gaming: 0.30, AI: 0.10, Camera: 0.60, Web: 0.40, Video: 1.00 },
  "slc":      { Idle: 0.20, Gaming: 0.90, AI: 0.80, Camera: 0.70, Web: 0.55, Video: 0.70 },
  "memctrl":  { Idle: 0.15, Gaming: 0.80, AI: 0.75, Camera: 0.60, Web: 0.50, Video: 0.60 },
  "pmu":      { Idle: 0.20, Gaming: 0.50, AI: 0.45, Camera: 0.40, Web: 0.35, Video: 0.40 },
  "lpddr0":   { Idle: 0.10, Gaming: 0.70, AI: 0.75, Camera: 0.60, Web: 0.55, Video: 0.60 },
  "lpddr1":   { Idle: 0.10, Gaming: 0.70, AI: 0.75, Camera: 0.60, Web: 0.55, Video: 0.60 },
  "io-top":   { Idle: 0.10, Gaming: 0.20, AI: 0.10, Camera: 0.10, Web: 0.30, Video: 0.25 },
  "lpddr2":   { Idle: 0.10, Gaming: 0.70, AI: 0.75, Camera: 0.60, Web: 0.55, Video: 0.60 },
  "lpddr3":   { Idle: 0.10, Gaming: 0.70, AI: 0.75, Camera: 0.60, Web: 0.55, Video: 0.60 },
  "io-bot":   { Idle: 0.10, Gaming: 0.20, AI: 0.10, Camera: 0.10, Web: 0.30, Video: 0.25 },
};

// Data paths drawn for each mode — curved energy streams between source→destination.
export interface TrafficPath { from: string; to: string; bandwidth: string; modes: SocMode[]; }
export const TRAFFIC_PATHS: TrafficPath[] = [
  { from: "gpu",     to: "slc",     bandwidth: "GPU ⇄ SLC · 400 GB/s", modes: ["Gaming", "Video", "AI"] },
  { from: "slc",     to: "memctrl", bandwidth: "SLC ⇄ DRAM · 96 GB/s", modes: ["Gaming", "Video", "AI", "Camera", "Web"] },
  { from: "cpu-big", to: "slc",     bandwidth: "CPU-B ⇄ SLC",         modes: ["Gaming", "Video", "Web"] },
  { from: "cpu-eff", to: "slc",     bandwidth: "CPU-E ⇄ SLC",         modes: ["Idle", "Web", "Video", "Camera", "AI"] },
  { from: "npu",     to: "slc",     bandwidth: "NPU ⇄ SLC · 180 GB/s", modes: ["AI", "Camera"] },
  { from: "npu",     to: "cpu-big", bandwidth: "NPU ⇄ CPU-B",         modes: ["AI"] },
  { from: "isp",     to: "video",   bandwidth: "ISP → Video",          modes: ["Camera", "Video"] },
  { from: "video",   to: "slc",     bandwidth: "Video ⇄ SLC · 24 GB/s", modes: ["Video", "Camera"] },
  { from: "isp",     to: "slc",     bandwidth: "ISP ⇄ SLC · 32 GB/s",  modes: ["Camera"] },
  { from: "modem",   to: "slc",     bandwidth: "Modem ⇄ SLC · 12 Gbps", modes: ["Web", "Video", "Gaming"] },
  { from: "pmu",     to: "cpu-big", bandwidth: "PMU → CPU-B",          modes: ["Gaming", "Video", "AI"] },
  { from: "pmu",     to: "gpu",     bandwidth: "PMU → GPU",            modes: ["Gaming", "Video"] },
  { from: "pmu",     to: "npu",     bandwidth: "PMU → NPU",            modes: ["AI", "Camera"] },
];

/* ---------- Exact block table ---------- */

export const DIE_W = 22;
export const DIE_D = 18;

// Colors follow the brief's "temperature-of-importance" palette.
export const BLOCKS: Block[] = [
  // 1. CPU Big — deep navy, tallest at h=3.20.
  {
    id: "cpu-big",
    name: "CPU Performance Cores",
    fn: "High-Performance Compute · 3× Cortex-X4",
    description: "Three performance cores with dedicated L2 caches. The tallest blocks on the die at 3.20u — physically embodying the most aggressive DVFS point on the chip.",
    specs: [
      { label: "Clock Frequency", value: "3.30 GHz" },
      { label: "L2 Cache", value: "3 × 2 MB" },
      { label: "Die Area Share", value: "~12%" },
    ],
    detail: "cpuBig",
    cx: -2.50, cz: -4.55, w: 4.80, d: 5.30, h: 3.20,
    lift: 11.5,
    color: "#0a1d3c", base: "#16264a",
    roughness: 0.48, metalness: 0.55,
    showLabel: true, labelDir: [-1.2, 1.5, -0.7],
  },

  // 2. CPU Eff — slightly lighter navy, h=2.20.
  {
    id: "cpu-eff",
    name: "CPU Efficiency Cores",
    fn: "Efficiency Compute · 4× Cortex-A720",
    description: "Four in-order/lightly-out-of-order efficiency cores arranged as a 2×2 cluster. Runs background threads, manages the sensor hub, and keeps the platform alive when the big cluster is gated.",
    specs: [
      { label: "Clock Frequency", value: "2.40 GHz" },
      { label: "L2 Cache", value: "Shared 2 MB" },
      { label: "Power Floor", value: "~150 mW" },
    ],
    detail: "cpuEff",
    cx: -2.50, cz: 0.32, w: 4.80, d: 4.50, h: 2.20,
    lift: 9,
    color: "#061830", base: "#0e2440",
    roughness: 0.52, metalness: 0.50,
    showLabel: true, labelDir: [-1.2, 1.1, 0.3],
  },

  // 3. GPU — deep violet, widest block h=3.00.
  {
    id: "gpu",
    name: "GPU",
    fn: "Graphics & Parallel Compute · 16-Core Mobile",
    description: "The largest single block on the die. A tile-based-deferred renderer with independent shader clusters, geometry front-end, render output units, and a dedicated L2 cache complex at the bottom.",
    specs: [
      { label: "Core Count", value: "16 Cores" },
      { label: "Shader ALUs", value: "128-wide" },
      { label: "FP32 TFLOPS", value: "~4.2" },
    ],
    detail: "gpu",
    cx: 3.44, cz: -2.33, w: 7.20, d: 9.75, h: 3.00,
    lift: 10,
    color: "#140a26", base: "#2a1844",
    roughness: 0.40, metalness: 0.60,
    showLabel: true, labelDir: [0.9, 1.45, -0.5],
  },

  // 4. NPU — dark burgundy, h=2.80.
  {
    id: "npu",
    name: "NPU / AI Engine",
    fn: "Neural Processing Engine · On-Device AI",
    description: "Dedicated systolic array for matrix math. Split horizontally: compute (MAC array, top ~60%) and weight SRAM (bottom ~40%). When the chip is doing AI this block carries most of the load.",
    specs: [
      { label: "TOPS (INT8)", value: "45 TOPS" },
      { label: "Precision", value: "INT4/8, FP16" },
      { label: "Weight SRAM", value: "On-die 12 MB" },
    ],
    detail: "npu",
    cx: -6.90, cz: -4.41, w: 4.00, d: 5.60, h: 2.80,
    lift: 9.5,
    color: "#2a0a12", base: "#3f0e1a",
    roughness: 0.42, metalness: 0.58,
    showLabel: true, labelDir: [-1.25, 1.2, -0.5],
  },

  // 5. 5G Modem — deep brown, h=2.40.
  {
    id: "modem",
    name: "5G Modem",
    fn: "Baseband · Release 16 RF-System",
    description: "A self-contained sub-SoC: its own CPU, its own RTOS, its own memory. RF-isolated from the digital core; the slight perimeter trace on the top surface is the physical shield that keeps RF out of the compute die.",
    specs: [
      { label: "Downlink", value: "10 Gbps" },
      { label: "Bands", value: "Sub-6 GHz + mmWave" },
      { label: "Release", value: "3GPP R16" },
    ],
    detail: "modem",
    cx: -6.90, cz: 0.47, w: 4.00, d: 4.20, h: 2.40,
    lift: 8,
    color: "#281508", base: "#3b2410",
    roughness: 0.55, metalness: 0.45,
    showLabel: true, labelDir: [-1.25, 1.0, 0.45],
  },

  // 6. ISP — deep teal-green, h=2.00.
  {
    id: "isp",
    name: "ISP",
    fn: "Image Signal Processor · Camera Pipeline",
    description: "The image pipeline: demosaic → noise reduction → tone mapping → output. Some stages are hardwired silicon; some are programmable DSP blocks; late-stage HDR fusion is offloaded to the NPU.",
    specs: [
      { label: "Max Sensor", value: "200 MP" },
      { label: "Video", value: "8K @ 60 fps" },
      { label: "HDR", value: "14-bit RAW" },
    ],
    detail: "isp",
    cx: 9.02, cz: -4.87, w: 4.00, d: 4.70, h: 2.00,
    lift: 7,
    color: "#051a14", base: "#0d2a20",
    roughness: 0.50, metalness: 0.50,
    showLabel: true, labelDir: [1.2, 1.0, -0.55],
  },

  // 7. DSP — green, h=1.80.
  {
    id: "dsp",
    name: "DSP",
    fn: "Digital Signal Processor · Audio & Sensor Hub",
    description: "VLIW audio/sensor hub. Runs at 10-50 MHz at microwatt levels when the screen is off; handles wake-word, spatial audio, and sensor fusion for AR.",
    specs: [
      { label: "Audio", value: "32-bit Hi-Res" },
      { label: "Voice", value: "Multi-mic Beamforming" },
      { label: "AR Latency", value: "< 10 ms" },
    ],
    detail: "dsp",
    cx: 9.02, cz: -1.29, w: 4.00, d: 2.50, h: 1.80,
    lift: 6,
    color: "#0a2418", base: "#163828",
    roughness: 0.55, metalness: 0.45,
    showLabel: true, labelDir: [1.2, 0.9, -0.05],
  },

  // 8. Video — dark teal-green, h=1.50.
  {
    id: "video",
    name: "Video Codec",
    fn: "Media Engine · Encode/Decode",
    description: "Hardware encoder/decoder. Supports AV1, H.265 (HEVC), and VP9. The media workload almost never goes to the CPU/GPU — it lives here.",
    specs: [
      { label: "Codecs", value: "AV1, H.265" },
      { label: "Streams", value: "4 × 4K" },
      { label: "Decoding", value: "10-bit HDR" },
    ],
    detail: "video",
    cx: 9.02, cz: 1.26, w: 4.00, d: 2.60, h: 1.50,
    lift: 5,
    color: "#072018", base: "#0d3022",
    roughness: 0.55, metalness: 0.45,
    showLabel: true, labelDir: [1.2, 0.9, 0.35],
  },

  // 9. SLC — flat horizontal highway, h=1.50.
  {
    id: "slc",
    name: "System Level Cache",
    fn: "Shared Memory Fabric · 16 MB",
    description: "16 MB of shared L3-equivalent SRAM spanning most of the die width. Every compute block first goes to the SLC before paying the cost of going off-chip to LPDDR.",
    specs: [
      { label: "Capacity", value: "16 MB" },
      { label: "Bandwidth", value: "~400 GB/s" },
      { label: "Latency", value: "~12 ns" },
    ],
    detail: "slc",
    cx: 1.06, cz: 3.76, w: 19.90, d: 2.40, h: 1.50,
    lift: 6,
    color: "#061528", base: "#0e2138",
    roughness: 0.60, metalness: 0.40,
    showLabel: true, labelDir: [0.15, 1.15, 1.0],
  },

  // 10. Memory Controller — lowest infrastructure slab, h=1.00.
  {
    id: "memctrl",
    name: "Memory Controller",
    fn: "4× LPDDR5x · DRAM Traffic Cop",
    description: "The traffic cop between compute and off-chip DRAM. Implements FR-FCFS scheduling plus power-aware row closure. Almost invisible visually — that's the intent.",
    specs: [
      { label: "Memory", value: "LPDDR5x" },
      { label: "Data Rate", value: "8533 MT/s" },
      { label: "Channels", value: "4 × 16-bit" },
    ],
    detail: "memctrl",
    cx: 1.06, cz: 5.95, w: 19.90, d: 1.90, h: 1.00,
    lift: 4.5,
    color: "#04101c", base: "#0a1a2c",
    roughness: 0.65, metalness: 0.35,
    showLabel: true, labelDir: [0.1, 0.9, 0.9],
  },

  // 11. PMU — left spine, h=1.20.
  {
    id: "pmu",
    name: "PMU + I/O",
    fn: "Power Management · I/O PHY",
    description: "The vertical power-and-IO spine. Implements DVFS per-rail. Voltage must be stable before the frequency can ramp up — and the regulator settling time of ~10 μs is the invisible limit on how snappy the chip feels.",
    specs: [
      { label: "Power Rails", value: "12 Primary" },
      { label: "Interface", value: "PCIe Gen 4 + USB" },
      { label: "Thermal Limit", value: "Tj 105 °C" },
    ],
    detail: "pmu",
    cx: -9.94, cz: 0.00, w: 2.12, d: 14.10, h: 1.20,
    lift: 11,
    color: "#0a0a06", base: "#14140a",
    roughness: 0.70, metalness: 0.30,
    showLabel: true, labelDir: [-1.2, 1.5, 0.0],
  },

  // 12. LPDDR 0 — top-left strip, h=0.80.
  {
    id: "lpddr0",
    name: "LPDDR5x CH 0",
    fn: "Memory Interface · Channel 0",
    description: "Off-die DRAM interface. Lowest profile on the die — these are the highway on-ramps for the chip.",
    specs: [
      { label: "Type", value: "LPDDR5x" },
      { label: "Channel", value: "1 / 4" },
      { label: "C4 Bumps", value: "Per-channel grid" },
    ],
    detail: "lpddr",
    cx: -7.52, cz: -8.10, w: 6.97, d: 1.80, h: 0.80,
    lift: 3.5,
    color: "#060c18", base: "#0c1424",
    roughness: 0.75, metalness: 0.25,
    showLabel: true, labelDir: [-0.65, 0.9, -1.0],
  },

  // 13. LPDDR 1 — top-right strip, h=0.80.
  {
    id: "lpddr1",
    name: "LPDDR5x CH 1",
    fn: "Memory Interface · Channel 1",
    description: "Second LPDDR channel. Top pair (CH0/CH1) and bottom pair (CH2/CH3) are ganged as two 32-bit interfaces for double burst length on heavy workloads.",
    specs: [
      { label: "Type", value: "LPDDR5x" },
      { label: "Channel", value: "2 / 4" },
      { label: "C4 Bumps", value: "Per-channel grid" },
    ],
    detail: "lpddr",
    cx: 7.15, cz: -8.10, w: 7.70, d: 1.80, h: 0.80,
    lift: 3.5,
    color: "#060c18", base: "#0c1424",
    roughness: 0.75, metalness: 0.25,
    showLabel: true, labelDir: [0.65, 1.0, -1.0],
  },

  // 14. I/O Top Ring — between top two LPDDR channels, h=0.50.
  {
    id: "io-top",
    name: "I/O Top Ring",
    fn: "Top Perimeter I/O",
    description: "Top perimeter I/O strip. Thin, low-profile, visible only as a subtle amber hairline — exactly the treatment described for the scribe-line.",
    specs: [
      { label: "Type", value: "Perimeter PHY" },
      { label: "Function", value: "Auxiliary I/O" },
      { label: "Profile", value: "Lowest" },
    ],
    detail: "ioring",
    cx: -0.37, cz: -8.10, w: 7.33, d: 1.80, h: 0.50,
    lift: 2.5,
    color: "#0a0a06", base: "#14140a",
    roughness: 0.75, metalness: 0.25,
    showLabel: true, labelDir: [0.0, 0.9, -1.15],
  },

  // 15. LPDDR 2 — bottom-left strip, h=0.80, deeper band.
  {
    id: "lpddr2",
    name: "LPDDR5x CH 2",
    fn: "Memory Interface · Channel 2",
    description: "Bottom pair of LPDDR channels. Slightly deeper footprint than the top pair because of additional power-rail keep-out margin.",
    specs: [
      { label: "Type", value: "LPDDR5x" },
      { label: "Channel", value: "3 / 4" },
      { label: "C4 Bumps", value: "Per-channel grid" },
    ],
    detail: "lpddr",
    cx: -7.52, cz: 7.96, w: 6.97, d: 2.09, h: 0.80,
    lift: 3.5,
    color: "#060c18", base: "#0c1424",
    roughness: 0.75, metalness: 0.25,
    showLabel: true, labelDir: [-0.65, 0.9, 1.0],
  },

  // 16. LPDDR 3 — bottom-right strip, h=0.80.
  {
    id: "lpddr3",
    name: "LPDDR5x CH 3",
    fn: "Memory Interface · Channel 3",
    description: "Fourth LPDDR channel. Together with CH2 this forms the bottom 32-bit interface.",
    specs: [
      { label: "Type", value: "LPDDR5x" },
      { label: "Channel", value: "4 / 4" },
      { label: "C4 Bumps", value: "Per-channel grid" },
    ],
    detail: "lpddr",
    cx: 7.15, cz: 7.96, w: 7.70, d: 2.09, h: 0.80,
    lift: 3.5,
    color: "#060c18", base: "#0c1424",
    roughness: 0.75, metalness: 0.25,
    showLabel: true, labelDir: [0.65, 0.9, 1.0],
  },

  // 17. I/O Bottom Ring — between bottom two LPDDR channels.
  {
    id: "io-bot",
    name: "I/O Bottom Ring",
    fn: "Bottom Perimeter I/O",
    description: "Bottom perimeter I/O strip. Mirror of the top ring.",
    specs: [
      { label: "Type", value: "Perimeter PHY" },
      { label: "Function", value: "Auxiliary I/O" },
      { label: "Profile", value: "Lowest" },
    ],
    detail: "ioring",
    cx: -0.37, cz: 7.96, w: 7.33, d: 2.09, h: 0.50,
    lift: 2.5,
    color: "#0a0a06", base: "#14140a",
    roughness: 0.75, metalness: 0.25,
    showLabel: true, labelDir: [0.0, 0.85, 1.15],
  },
];
