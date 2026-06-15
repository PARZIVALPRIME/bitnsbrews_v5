// Bits'nBrews — Article library data.
// Maps the 9 main functional die blocks to their basic/advanced contents,
// and holds the full structured text of articles for the ArticleReader.

export type ArticleSegment =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "defs"; items: { term: string; def: string }[] }
  | { kind: "code"; lines: string[]; caption?: string }
  | { kind: "list"; items: string[] }
  | { kind: "challenge"; n: number; body: string[] };

export interface Article {
  id: string;
  track: string;
  trackNo: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  readTime: string;
  segments: ArticleSegment[];
}

export interface ComponentMetadata {
  id: string;
  name: string;
  tag: string;
  shortDesc: string;
  area: string;
  clockSpeed: string;
  process: string;
  powerFocus: string;
  textbookOmission: string;
  basicArticleId: string;
  advancedArticleId: string;
  advancedTrackNo: string;
  advancedTrackName: string;
}

// ── The 9 functional components on the silicon die ──
export const COMPONENTS: ComponentMetadata[] = [
  {
    id: "cpu-big",
    name: "CPU Performance Core",
    tag: "PROCESSING POWER",
    shortDesc: "Aggressive out-of-order execution core designed for latency-critical, single-threaded performance.",
    area: "2.40 mm²",
    clockSpeed: "3.30 - 4.60 GHz",
    process: "3nm GAA EUV",
    powerFocus: "High Performance (Turbo-capable)",
    textbookOmission: "Textbooks focus heavily on simple in-order 5-stage pipelines. They omit the staggering complexity of branch prediction side-channels (like Spectre), instruction fusion, memory dependency prediction, and how out-of-order execution registers are renamed inside physical register files with 400+ entries.",
    basicArticleId: "cpu-big-basics",
    advancedArticleId: "miss-rate", // Or custom track
    advancedTrackNo: "04",
    advancedTrackName: "Code → Core",
  },
  {
    id: "cpu-eff",
    name: "CPU Efficiency Core",
    tag: "EFFICIENCY & BACKGROUND",
    shortDesc: "Energy-optimized core running narrower, in-order or light out-of-order pipelines to handle background tasks.",
    area: "0.80 mm²",
    clockSpeed: "2.20 - 3.60 GHz",
    process: "3nm GAA EUV",
    powerFocus: "Ultra-low leakage (background thread saver)",
    textbookOmission: "Textbooks assume processors run at uniform voltage and frequency. In reality, mobile SoCs partition cores into clusters with separate voltage domains. Efficiency cores feature tiny local caches and use high-threshold voltage transistors to limit power leakage during standby.",
    basicArticleId: "cpu-eff-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "06",
    advancedTrackName: "The Tradeoff",
  },
  {
    id: "gpu",
    name: "Graphics Processor (GPU)",
    tag: "PARALLEL COMPUTATION",
    shortDesc: "High-throughput parallel compute engine optimized for massive floating-point graphics workloads and mobile shading.",
    area: "4.80 mm²",
    clockSpeed: "1.10 GHz",
    process: "3nm GAA EUV",
    powerFocus: "Dynamic range scaling based on thermals",
    textbookOmission: "Textbooks teach that GPUs are simple vector ALUs. Modern mobile GPUs are complex hierarchical systems incorporating specialized hardware for raytracing, tile-based deferred rendering (TBR), and frame buffer compression to drastically reduce energy-expensive memory traffic.",
    basicArticleId: "gpu-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "02",
    advancedTrackName: "Die Chronicles",
  },
  {
    id: "npu",
    name: "Neural Accelerator (NPU)",
    tag: "AI INFERENCE ENGINE",
    shortDesc: "Specialized accelerator designed specifically to execute low-precision matrix operations with massive data reuse.",
    area: "3.20 mm²",
    clockSpeed: "0.95 GHz",
    process: "3nm GAA EUV",
    powerFocus: "SRAM power gating and zero-skip processing",
    textbookOmission: "Textbooks introduce AI chips as generic matrix engines. They miss the fundamental bottleneck: memory access. Modern NPUs use specialized systolic arrays that pass data directly from ALU to ALU, and 'sparsity' engines that skip multiplications by zero entirely to save power.",
    basicArticleId: "npu-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "05",
    advancedTrackName: "Paper Lab",
  },
  {
    id: "modem",
    name: "5G Baseband Modem",
    tag: "WIRELESS COMMUNICATIONS",
    shortDesc: "RF-isolated communications engine processing high-frequency cellular signals into digital bits.",
    area: "2.10 mm²",
    clockSpeed: "Multi-clock DSP",
    process: "3nm / 4nm mixed",
    powerFocus: "Power-save modes on network search",
    textbookOmission: "Textbooks treat communication blocks as simple serial ports. In real silicon, cellular modems must run isolated on separate voltage planes to avoid injecting electromagnetic noise into sensitive CPU clocks, and use real-time operating systems (RTOS) to guarantee sub-millisecond response.",
    basicArticleId: "modem-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "03",
    advancedTrackName: "Chip Lore",
  },
  {
    id: "isp",
    name: "Image Signal Processor (ISP)",
    tag: "MEDIA PROCESSING",
    shortDesc: "Dedicated hardware pipeline handling real-time RAW image conversion, demosaicing, and video streams.",
    area: "1.80 mm²",
    clockSpeed: "Variable (tied to frame-rate)",
    process: "3nm GAA EUV",
    powerFocus: "Active only during capture / playback",
    textbookOmission: "Textbooks rarely mention image sensors or pixel math. Real mobile ISPs process 14-bit RAW signals at gigapixels per second, performing real-time multi-frame noise reduction, lens distortion correction, and autofocus calculations directly in hardware prior to saving to RAM.",
    basicArticleId: "isp-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "07",
    advancedTrackName: "Post Mortem",
  },
  {
    id: "dsp",
    name: "Digital Signal Processor (DSP)",
    tag: "MATHEMATICAL ACCELERATION",
    shortDesc: "Vector math coprocessor optimized for low-latency processing of audio, sensor arrays, and voice algorithms.",
    area: "1.00 mm²",
    clockSpeed: "0.80 GHz",
    process: "3nm GAA EUV",
    powerFocus: "Always-on micro-watt standby",
    textbookOmission: "Textbooks teach DSPs as simple arithmetic blocks. Mobile DSPs are highly advanced VLIW (Very Long Instruction Word) structures capable of executing up to 8 mathematical operations in a single cycle, handling voice trigger algorithms at micro-watt power budgets.",
    basicArticleId: "dsp-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "08",
    advancedTrackName: "RTL to Silicon",
  },
  {
    id: "slc",
    name: "System Level Cache (SLC)",
    tag: "COHERENCE & STORAGE",
    shortDesc: "Unified coherent cache buffer that prevents expensive, power-hungry DRAM reads across all blocks.",
    area: "6.00 mm²",
    clockSpeed: "Unified ring frequency",
    process: "3nm GAA EUV",
    powerFocus: "Static SRAM retention voltage",
    textbookOmission: "Textbooks cover CPU cache but skip the system-wide 'victim' caches. The SLC acts as a buffer for the entire chip, caching GPU framebuffers and NPU weights. It is integrated into a complex Network-on-Chip (NoC) that resolves cross-block resource contentions dynamically.",
    basicArticleId: "slc-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "09",
    advancedTrackName: "The Hard Question",
  },
  {
    id: "memctrl",
    name: "Memory Controller",
    tag: "EXTERNAL RAM INTERFACE",
    shortDesc: "Physical gateway managing read/write requests, row buffers, and command scheduling for external LPDDR5x.",
    area: "3.50 mm²",
    clockSpeed: "4266 MHz (8533 MT/s)",
    process: "Mixed analog-digital",
    powerFocus: "Dynamic frequency switching (DFS)",
    textbookOmission: "Textbooks treat RAM as a flat, single-cycle latency array. In reality, external DRAM is split into channels, ranks, and banks. The controller must coordinate row activation, precharging, and refresh commands, reordering requests in real-time to avoid row conflicts.",
    basicArticleId: "memctrl-basics",
    advancedArticleId: "miss-rate",
    advancedTrackNo: "01",
    advancedTrackName: "Silicon Explained",
  },
];

// Helper to get component by ID
export function getComponent(id: string): ComponentMetadata | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

// ── Curated articles including the basic and advanced sets ─────────────────
export const ARTICLES: Article[] = [
  // L2 Cache advanced article
  {
    id: "miss-rate",
    track: "Silicon Explained",
    trackNo: "01",
    title: "Global Miss Rate vs Local Miss Rate",
    subtitle: "Why Your Cache's Local Miss Rate is a Lie",
    author: "Preetam",
    date: "May 23, 2026",
    readTime: "9 min read",
    segments: [
      {
        kind: "p",
        text: "If you spend enough time reading CPU architecture manuals or running gem5 simulations, you'll eventually stumble across a metric that makes absolutely no sense: the L2 cache miss rate.",
      },
      {
        kind: "p",
        text: "Look at a state-of-the-art processor like an Intel Golden Cove or an AMD Zen 4 core, and you'll see the L1 cache sitting pretty with a miss rate around 5%. But go one level deeper and the L2 is casually reporting 20%, 30%, or worse.",
      },
      {
        kind: "p",
        text: "If you're new to reading these numbers, you might conclude the L2 design team was asleep at the wheel. How could a massive 1 MB SRAM array perform so much worse than the smaller L1?",
      },
      {
        kind: "p",
        text: "We have to understand how hardware architects actually evaluate performance, and why splitting cache metrics into Global and Local views is the only way to fairly attribute performance to a specific level of the hierarchy and know exactly which design decision to pull on when a chip underperforms.",
      },
      { kind: "h2", text: "Textbook Definitions" },
      {
        kind: "p",
        text: "Before we build the intuition, here are the two formal definitions you'll see in Patterson & Hennessy:",
      },
      {
        kind: "defs",
        items: [
          {
            term: "Local Miss Rate",
            def: "Misses in a specific cache divided by accesses that actually reached that cache.",
          },
          {
            term: "Global Miss Rate",
            def: "Misses in a specific cache divided by all memory requests generated by the CPU core.",
          },
        ],
      },
      {
        kind: "p",
        text: "Both tell you the truth. Just different truths about different things.",
      },
      {
        kind: "challenge",
        n: 1,
        body: [
          "Before we move on, think about your own software tooling. Next time you run `perf stat` or profile your C++ code to optimize memory accesses, take a hard look at the cache metrics it spits out.",
          "When it says `LLC-load-misses` (Last Level Cache), is the tool reporting the Global Miss Rate to make your code look efficient, or the Local Miss Rate to show you how badly you are thrashing the silicon? If you don't know which one your profiler is using, how can you actually trust your own software optimizations?",
        ],
      },
      { kind: "h2", text: "How This Maps to AMAT" },
      {
        kind: "p",
        text: "The nested Average Memory Access Time equation can be written from either perspective, and both are mathematically equivalent.",
      },
      {
        kind: "code",
        caption: "Using local miss rates",
        lines: ["AMAT = AT_L1 + MR_L1 × (AT_L2 + Local_MR_L2 × Miss_Penalty_L2)"],
      },
      {
        kind: "code",
        caption: "Using global miss rates",
        lines: ["AMAT = AT_L1 + MR_L1 × AT_L2 + Global_MR_L2 × Miss_Penalty_L2"],
      },
      {
        kind: "list",
        items: [
          "`AT_L1` — L1 access time. The mandatory cycle cost to check L1 on every request.",
          "`AT_L2` — L2 access time. Paid only when a request reaches L2.",
          "`MR_L1` — L1 miss rate, equivalent to the local miss rate of L1.",
          "`Local_MR_L2` — Fraction of requests that reached L2 which also missed L2.",
          "`Global_MR_L2` — Fraction of all CPU requests that missed both L1 and L2. Equal to `MR_L1 × Local_MR_L2`.",
          "`Miss_Penalty_L2` — Cycles lost going to the next level (L3 or DRAM).",
        ],
      },
      {
        kind: "p",
        text: "Notice: when you use the global miss rate, you do not multiply again by the L1 miss rate, because the L1 miss probability is already baked into the global number. Two algebraically identical forms of the same equation.",
      },
      {
        kind: "p",
        text: "If the math is equivalent, why do architecture papers obsess over the distinction? Because the math is used for different purposes by different people.",
      },
      { kind: "h2", text: "The CPU's Cockpit: The Global View" },
      {
        kind: "p",
        text: "The CPU execution engine is a hyperactive, data-starved beast. It fires off thousands of memory requests per millisecond and only cares about one thing: Did I get my data quickly, or did I have to stall my pipeline for 200 cycles waiting for DRAM?",
      },
      {
        kind: "p",
        text: "If we measure the system from this cockpit, we get the global miss rate.",
      },
      {
        kind: "list",
        items: [
          "Concretely: the CPU issues **1,000 memory requests**.",
          "**900** hit the L1 cache immediately.",
          "**80** miss L1 but are found in L2.",
          "**20** fail completely and go all the way to DRAM.",
        ],
      },
      {
        kind: "code",
        lines: ["Global L2 Miss Rate = 20 / 1000 = 2%"],
      },
      {
        kind: "p",
        text: "Marketing teams love this number. A 2% failure rate looks incredible on a spec sheet. AMAT is low, IPC stays high, everyone is happy.",
      },
      {
        kind: "p",
        text: "But if you walk down to the engineering floor and hand that 2% to the architect who designed the L2 cache block, they will throw it back at you. That number is useless for evaluating their work, because the 2% is almost entirely driven by the L1's heroic filtering performance, not by anything the L2 team did.",
      },
      { kind: "h2", text: "The Golden Child: The L1 as a High-Pass Filter" },
      {
        kind: "p",
        text: "To understand why the L2 looks so bad internally, you have to understand what reaches it in the first place.",
      },
      {
        kind: "p",
        text: "The L1 cache sits directly next to the execution units. It gets first pick at the buffet. When a program loops through a contiguous array, it exhibits perfect spatial locality: stride-1 access, cache line after cache line. The L1 swallows all of this effortlessly. Clean sequential strides, tight for loops, hot stack variables: fresh, structured, easy to digest. The L1 acts as a massive high-pass filter, handling 90% of all traffic.",
      },
      {
        kind: "p",
        text: "So what actually reaches the L2? **Leftovers.** Pointer chains where every next address is buried inside the current data. Randomised hash table probes scattered across gigabytes of address space. Sparse graph traversals with no spatial pattern to exploit. Cold database lookups that haven't been touched in milliseconds.",
      },
      {
        kind: "p",
        text: "The L2 isn't eating badly because it's incompetent. It's eating badly because it only ever gets the leftovers.",
      },
      {
        kind: "code",
        lines: ["Local L2 Miss Rate = 20 / 100 = 20%"],
      },
      {
        kind: "p",
        text: "Missing 20% of the time sounds terrible, until you realise the L2 is playing on hard mode.",
      },
      {
        kind: "challenge",
        n: 2,
        body: [
          "Assume the architect designs the L3 cache to be strictly inclusive of the L1. This means if a data block lives in L1, a copy must also exist in L3. Now, the L3 cache gets full and evicts a block. Because of the strict inclusion rule, the hardware must silently reach up and rip that exact same block out of the L1 cache too — even if the CPU was actively using it!",
          "Think about the metrics: By changing the L3 replacement policy, you just artificially caused the L1 miss rate to spike. In an inclusive hierarchy, can you ever truly isolate a \"Local\" miss rate? Or is every cache secretly sabotaging the others?",
        ],
      },
      { kind: "h2", text: "The Takeaway" },
      {
        kind: "p",
        text: "Modern processors are not a single monolithic memory block. They are a cascade of specialised filters, each one handing off its failures to the next level down.",
      },
      {
        kind: "list",
        items: [
          "**Use the global miss rate** when you want to compute AMAT and understand overall system performance.",
          "**Use the local miss rate** when you need to know whether a specific cache level's silicon footprint is actually earning its area.",
        ],
      },
    ],
  },
  
  // 1. CPU Big Basics
  {
    id: "cpu-big-basics",
    track: "CPU Performance Core",
    trackNo: "Basics",
    title: "How CPU Cores Cheat Time: Out-of-Order Execution",
    subtitle: "What is Out-of-Order Execution, and why do textbook diagrams fail to explain it?",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "5 min read",
    segments: [
      {
        kind: "p",
        text: "Your average textbook presents a clean processor pipeline: Fetch, Decode, Execute, Writeback. Instructions march in like soldiers. But in a real 3nm performance core, this orderly line is absolute fiction. Under the hood is a controlled riot called Out-of-Order (OoO) execution.",
      },
      {
        kind: "p",
        text: "Why do we do this? Because memory is slow. While a CPU core performs calculations in fractions of a nanosecond, getting data from RAM takes up to 100 nanoseconds. If instructions executed in-order, the entire processor would freeze, wasting hundreds of execution cycles waiting for a single variable.",
      },
      { kind: "h2", text: "Bypassing the Stall" },
      {
        kind: "p",
        text: "To bypass memory stalls, an Out-of-Order core fetches a window of 100 to 600 instructions into a queue. It decodes them and checks for dependencies. If Instruction A is waiting for a memory load, but Instructions B and C are ready arithmetic calculations that don't depend on A, the processor execution ports grab B and C and run them immediately.",
      },
      {
        kind: "p",
        text: "This process relies on three primary concepts that textbooks often oversimplify:",
      },
      {
        kind: "defs",
        items: [
          {
            term: "Register Renaming",
            def: "Mapping a few logical registers (like R1, R2 in ARM) to a massive array of physical registers (often 400+) to eliminate false name-dependencies between instructions.",
          },
          {
            term: "Reorder Buffer (ROB)",
            def: "A tracking table that keeps instruction results in a temporary state until all preceding instructions complete. This ensures that even though execution happened out-of-order, updates commit in-order so the program state remains coherent.",
          },
        ],
      },
      {
        kind: "challenge",
        n: 1,
        body: [
          "Imagine you have two instructions: R1 = R2 + R3, and then R2 = R4 * R5. Notice how R2 is overwritten in the second instruction. If they execute out of order, the second one might finish first, causing the first instruction to read the wrong value of R2!",
          "How does register renaming solve this? By mapping the first R2 to Physical Register 99, and the second R2 to Physical Register 100. The instructions now use different registers and can execute in any order safely.",
        ],
      },
    ],
  },

  // 2. CPU Little Basics
  {
    id: "cpu-eff-basics",
    track: "CPU Efficiency Core",
    trackNo: "Basics",
    title: "Understanding the CPU Efficiency Core",
    subtitle: "Why mobile chips split work between big and little brothers.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "4 min read",
    segments: [
      {
        kind: "p",
        text: "If performance cores are like F1 racecars, efficiency cores are hybrid sedans. In your phone, 90% of the active time is spent running background syncing, audio decoding, and sensor polling. Running these on a wide performance core is like using a rocket engine to power a lawnmower.",
      },
      {
        kind: "p",
        text: "Power consumption in CMOS digital circuits is governed by the dynamic power equation:",
      },
      {
        kind: "code",
        caption: "Dynamic Power Equation",
        lines: ["Power = C × V² × f"],
      },
      {
        kind: "p",
        text: "Where C is capacitance, V is voltage, and f is frequency. Notice that voltage is squared! To run at 4 GHz, a performance core needs high voltage (e.g. 1.2V). An efficiency core running at 2 GHz can operate at just 0.6V. By halving frequency and voltage, power consumption drops by a factor of 8!",
      },
      {
        kind: "defs",
        items: [
          {
            term: "In-Order Execution",
            def: "Instead of power-hungry out-of-order scheduler logic, efficiency cores execute instructions strictly in-order, reducing control transistor overhead.",
          },
          {
            term: "Voltage Domains",
            def: "Physical isolations on the die that allow efficiency cores to run at much lower voltages than performance cores.",
          },
        ],
      },
    ],
  },

  // 3. GPU Basics
  {
    id: "gpu-basics",
    track: "Graphics Processor",
    trackNo: "Basics",
    title: "Why GPUs Have Thousands of Cores but Can't Run Windows",
    subtitle: "Contrasting Latency Optimization vs Throughput Optimization.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "6 min read",
    segments: [
      {
        kind: "p",
        text: "If you open a GPU spec sheet, you will see numbers like '2048 Shader Cores'. In contrast, a high-end CPU might only have 8 or 16 cores. Why can't we replace the CPU with a GPU and run our computers 100 times faster?",
      },
      {
        kind: "p",
        text: "The answer lies in design philosophy. A CPU is a **latency-optimized** processor. It is built to execute a single thread of instructions as fast as humanly possible, using massive caches to avoid waiting for RAM and hyper-complex branch predictors to guess the code path.",
      },
      {
        kind: "p",
        text: "A GPU is a **throughput-optimized** processor. It is designed to perform the exact same mathematical instruction (like color modification) on millions of pixels simultaneously. It achieves this by stripping away caches, branch predictors, and out-of-order execution, dedicating almost all of its silicon area to raw math logic (ALUs).",
      },
      {
        kind: "defs",
        items: [
          {
            term: "SIMT (Single Instruction, Multiple Threads)",
            def: "A execution model where a group of threads (typically 32, called a warp) share a single instruction decoder. If threads diverge (e.g., an if-else condition), they must execute sequentially, stalling the GPU.",
          },
          {
            term: "Latency Tolerance",
            def: "Unlike a CPU which stalls on a memory read, a GPU hides latency by switching instantly to a different group of threads that are ready to run.",
          },
        ],
      },
    ],
  },

  // 4. NPU Basics
  {
    id: "npu-basics",
    track: "Neural Accelerator",
    trackNo: "Basics",
    title: "Systolic Arrays: Making AI Math Run at Low Power",
    subtitle: "How modern chips perform trillions of operations without catching fire.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "5 min read",
    segments: [
      {
        kind: "p",
        text: "When you run an LLM or image generation model on your device, the NPU is performing billions of matrix multiplications. If a CPU performed these, your device would drain its battery in minutes. Why are NPUs so efficient?",
      },
      {
        kind: "p",
        text: "In standard Von Neumann computer architectures, every computation requires: 1) Load instruction, 2) Load data from memory, 3) Perform math, 4) Save back to memory. In matrix multiplication, memory access costs 100× more energy than the actual addition or multiplication.",
      },
      {
        kind: "p",
        text: "NPUs solve this using a **Systolic Array**. Instead of reading and writing to memory at every step, data flows through a grid of arithmetic units like blood pumping through a heart (hence 'systolic'). Weights remain fixed inside the grid, and inputs flow horizontally and vertically, reusing data across neighboring cells without ever touching cache or DRAM.",
      },
      {
        kind: "defs",
        items: [
          {
            term: "MAC (Multiply-Accumulate)",
            def: "The core arithmetic cell of an NPU, performing the basic operation: a = a + (b * c) in a single cycle.",
          },
          {
            term: "Weight Stationary",
            def: "A design choice where weight coefficients are loaded once and held in local cells while input tokens sweep through the grid, saving power.",
          },
        ],
      },
    ],
  },

  // 5. Modem Basics
  {
    id: "modem-basics",
    track: "5G Baseband Modem",
    trackNo: "Basics",
    title: "The Radio-to-Silicon Gateway",
    subtitle: "How cellular modems convert electromagnetic waves into digital bytes.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "5 min read",
    segments: [
      {
        kind: "p",
        text: "Your phone is constantly bathed in high-frequency radio waves. The antenna converts these waves into analog electrical currents. The modem is the gateway that translates these continuous waves into discrete ones and zeros.",
      },
      {
        kind: "p",
        text: "This requires intense mathematical processing. The analog signal is sampled by Analog-to-Digital Converters (ADCs), and then a Digital Signal Processor (DSP) executes complex Fourier transforms to separate the signal from surrounding atmospheric noise.",
      },
      {
        kind: "p",
        text: "Furthermore, modems are physically isolated on the silicon die. Radio-frequency components generate significant noise and heat, which can interfere with the microprocessors, necessitating electromagnetic shielding layers inside the packaging.",
      },
    ],
  },

  // 6. ISP Basics
  {
    id: "isp-basics",
    track: "Image Signal Processor",
    trackNo: "Basics",
    title: "The Digital Camera's Darkroom",
    subtitle: "Why megapixel counts don't matter as much as the silicon behind them.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "4 min read",
    segments: [
      {
        kind: "p",
        text: "When light hits a camera sensor, it does not capture a pretty image. It registers raw intensity values through a color grid called a Bayer filter (alternating red, green, and blue pixels). If you looked at this raw file, it would be dark, pixelated, and green-tinted.",
      },
      {
        kind: "p",
        text: "The Image Signal Processor (ISP) is the hardware engine that turns this raw sensor array into a photograph. It runs a series of dedicated mathematical filters: demosaicing (interpolating colors), lens distortion correction, bad-pixel masking, automatic exposure calculations, and real-time noise filtering.",
      },
      {
        kind: "p",
        text: "Modern ISPs do this in a single pass at 60 frames per second for 8K video, demanding immense throughput that general-purpose CPU cores simply cannot deliver.",
      },
    ],
  },

  // 7. DSP Basics
  {
    id: "dsp-basics",
    track: "Digital Signal Processor",
    trackNo: "Basics",
    title: "Why Audio Processing Needs VLIW Architectures",
    subtitle: "Real-time math without the scheduling overhead.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "4 min read",
    segments: [
      {
        kind: "p",
        text: "When you speak into your phone, noise-canceling algorithms analyze the audio, filter out background hums, and compress the voice file. Audio and sensor arrays require continuous streams of mathematical filters (like FIR and IIR filters) with absolute time guarantees.",
      },
      {
        kind: "p",
        text: "A CPU cannot guarantee latency because it is interrupted by operating system tasks. A DSP, however, executes deterministic math cycles. It uses a VLIW (Very Long Instruction Word) design: instead of finding parallel operations dynamically, the compiler bundles them into a single long instruction word that executes in parallel on simple, predictable hardware.",
      },
    ],
  },

  // 8. SLC Basics
  {
    id: "slc-basics",
    track: "System Level Cache",
    trackNo: "Basics",
    title: "The Network-on-Chip: Routing Traffic Inside a Chip",
    subtitle: "How functional blocks communicate without collision.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "5 min read",
    segments: [
      {
        kind: "p",
        text: "On a complex 3nm chip, you have CPU clusters, GPUs, NPUs, and memory controllers. They all need to share data. In older chip designs, components were connected by a shared wire called a 'bus'. If the CPU was talking to memory, the GPU had to wait.",
      },
      {
        kind: "p",
        text: "In modern chips, this is solved by a Network-on-Chip (NoC). The chip is treated like a tiny postal network: data is split into packets, and routed through a grid of switches and routers using routing tables.",
      },
      {
        kind: "p",
        text: "To speed up communication and prevent accessing external DRAM (which is very expensive in energy), a shared System Level Cache (SLC) sits at the heart of the NoC. It caches active data from any component, preventing cache coherence bottlenecks.",
      },
    ],
  },

  // 9. Memory Controller Basics
  {
    id: "memctrl-basics",
    track: "Memory Controller",
    trackNo: "Basics",
    title: "Memory Controllers: Dynamic Row Scheduling",
    subtitle: "Why DRAM row buffer conflicts can ruin your software's performance.",
    author: "Dhruv & Gemini",
    date: "June 10, 2026",
    readTime: "5 min read",
    segments: [
      {
        kind: "p",
        text: "Your code reads and writes variables to memory. Software developers treat RAM as a flat array where any byte is read in equal time. But physical DRAM is laid out as a grid of rows and columns.",
      },
      {
        kind: "p",
        text: "To read a byte, the memory controller must first activate a row, loading its contents into a temporary capacitor line called the 'row buffer'. This takes time. If your code accesses another byte in the same row, it is a 'row hit' and returns in just a few nanoseconds.",
      },
      {
        kind: "p",
        text: "But if your code accesses a byte in a different row of the same bank, a 'row conflict' occurs. The controller must write the row buffer contents back (precharge) and activate the new row. This takes triple the time. The memory controller is the intelligence that reorders and schedules requests in real-time to maximize row hits.",
      },
    ],
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

// Maps an in-experience article id to its published MDX page slug. When an entry
// exists, the die portal links to the real /articles/<slug> page instead of the
// in-experience overlay reader. Add a line here each time an article is migrated.
export const ARTICLE_SLUGS: Record<string, string> = {
  "miss-rate": "global-vs-local-miss-rate",
};

export function getArticleSlug(id: string): string | undefined {
  return ARTICLE_SLUGS[id];
}

export const ARTICLE_BLOCK_IDS = new Set(COMPONENTS.map((c) => c.id));

export interface BlockTrack {
  blockId: string;
  trackNo: string;
  trackName: string;
  hook: string;
  status: "published" | "coming-soon";
  articleId?: string;
}

export function getTrackForBlock(blockId: string): BlockTrack | undefined {
  const comp = COMPONENTS.find((c) => c.id === blockId);
  if (!comp) return undefined;
  return {
    blockId: comp.id,
    trackNo: comp.advancedTrackNo,
    trackName: comp.advancedTrackName,
    hook: comp.shortDesc,
    status: comp.id === "memctrl" ? "published" : "coming-soon",
    articleId: comp.id === "memctrl" ? "miss-rate" : undefined,
  };
}
