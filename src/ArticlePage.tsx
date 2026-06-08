import { useState, useEffect, useRef } from "react";

interface ArticlePageProps {
  trackId: string;
  onClose: () => void;
}

const SECTIONS = [
  { id: "intro", title: "Introduction" },
  { id: "pedigree", title: "Server Pedigree" },
  { id: "dieshot", title: "Die Shot Analysis" },
  { id: "microarchitecture", title: "Microarchitecture" },
  { id: "cache", title: "Shared L2 Cache" },
  { id: "fetch-decode", title: "Fetch & Decode" },
  { id: "execution", title: "Execution Backend" },
  { id: "load-store", title: "Load/Store Unit" },
  { id: "mmu", title: "Memory Management" },
  { id: "memory-controller", title: "Memory & L3 Cache" },
  { id: "references", title: "References" },
];

export function ArticlePage({ trackId, onClose }: ArticlePageProps) {
  const [activeSection, setActiveSection] = useState("intro");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to track scroll positions and highlight active section in TOC
  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (trackId !== "die-chronicles") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08090e] font-sans text-white p-8">
        <h1 className="text-2xl font-bold tracking-widest text-[#e8a23a] mb-4">TRACK COMING SOON</h1>
        <p className="text-xs text-white/40 mb-8 max-w-sm text-center">
          Our technical engineering team is preparing the deep dives and interactive analysis for this publication track.
        </p>
        <button
          onClick={onClose}
          className="text-[10px] font-mono font-bold tracking-widest border border-white/20 hover:border-white/50 px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          BACK TO HUB
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto font-sans bg-[#08090e] text-white/90 pb-24 scrollbar-thin select-none"
    >
      {/* ── Ambient Radial Glows (matching landing page) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-[#e8a23a]/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#e8a23a]/3 blur-[120px]" />
      </div>

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 py-4 bg-[#08090e]/80">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase border border-white/10 hover:border-[#e8a23a]/30 px-4 py-2 rounded-lg bg-black/20 text-white/50 hover:text-[#e8a23a] transition-all duration-200 cursor-pointer"
          >
            <span>←</span> <span>Back to Hub</span>
          </button>
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#e8a23a] font-bold">Die Chronicles Track</span>
            <span className="text-xs font-bold tracking-tight text-white/80">Oryon microarchitecture &amp; layout</span>
          </div>
        </div>

        <div className="text-[10px] font-mono font-semibold tracking-[0.3em] text-white/30 uppercase">
          Bits'nBrews
        </div>
      </header>

      {/* ── Main Layout Grid ── */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-8 px-4 sm:px-8 pt-12 relative z-10">
        
        {/* ── Left Column: Sticky Table of Contents ── */}
        <aside className="col-span-12 md:col-span-2 hidden md:block">
          <div className="sticky top-24 flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-2 scrollbar-none">
            <div className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#e8a23a]/60 uppercase mb-2">
              Sections
            </div>
            <nav className="flex flex-col gap-1.5 border-l border-white/5 pl-2 relative">
              {SECTIONS.map((section) => {
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left text-[11px] leading-snug py-1.5 transition-all duration-200 border-l-2 -ml-[9px] pl-3 block cursor-pointer ${
                      active
                        ? "text-[#e8a23a] border-[#e8a23a] font-bold tracking-tight translate-x-0.5"
                        : "border-transparent text-white/40 hover:text-white/80 hover:translate-x-0.5"
                    }`}
                  >
                    {section.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Center Column: Readable Prose Content ── */}
        <main className="col-span-12 md:col-span-7 px-0 sm:px-4 leading-relaxed text-[13.5px] text-white/70">
          
          {/* Article Title */}
          <div className="mb-12" id="intro">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-[#e8a23a] uppercase bg-[#e8a23a]/5 border border-[#e8a23a]/15 px-2.5 py-1 rounded-sm">
                Reverse Engineering
              </span>
              <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-white/40 uppercase">
                12 MIN READ
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] mb-6 text-white">
              Qualcomm's Oryon CPU: <br />
              <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">From Server Ambitions to Consumer Success</span>
            </h1>
            <p className="text-sm sm:text-base text-white/50 leading-relaxed font-light mb-8">
              A comprehensive reverse engineering and microarchitectural analysis of Qualcomm's 3rd-generation custom core in the Snapdragon 8 Elite Gen 5.
            </p>
            <div className="w-16 h-px bg-[#e8a23a]/40 mb-8" />
          </div>

          {/* Intro Prose */}
          <section className="space-y-6 mb-12">
            <p>
              <strong>Oryon</strong> is Qualcomm’s new custom CPU core. It didn’t start at Qualcomm; it was created by <strong>NuVia</strong>, a startup founded by ex-Apple and other CPU veterans. Their original project (codenamed “Phoenix”) was a <strong>server CPU</strong> to compete with Intel Xeon, AMD EPYC, and Arm’s Neoverse designs. Qualcomm acquired NuVia in <strong>2021</strong>, repurposed Phoenix for <strong>consumer hardware</strong>, and renamed it <strong>Oryon</strong>.
            </p>
            <p>
              Current Oryon cores use the <strong>Arm v8.7-A ISA</strong> (Instruction Set Architecture). Since Phoenix was meant for servers, the first Oryon cores still carry many of those <strong>server-style design choices</strong>. Qualcomm is tweaking them for <strong>client devices (phones, laptops, tablets)</strong> in subsequent generations.
            </p>

            {/* Custom Warning Blockquote */}
            <blockquote className="border-l border-[#e8a23a] p-6 rounded-r-2xl my-6 leading-relaxed bg-[#e8a23a]/5 border-y-white/5 border-r-white/5 border shadow-xl shadow-black/10">
              <div className="font-mono font-bold tracking-[0.2em] text-[9px] text-[#e8a23a] uppercase mb-2 flex items-center gap-1.5">
                ☕ The Brew &amp; Core Insight
              </div>
              <p className="text-white/60 text-[12px] font-light">
                Computer architecture is all about applying common sense and analyzing trade-offs. Qualcomm recently launched the fastest mobile processor, the Snapdragon 8 Elite Gen 5, but did you know it consumes about 60% more power than Apple’s processors? Every design choice involves trade-offs—gaining something often means sacrificing something else.
              </p>
            </blockquote>
          </section>

          {/* Server Pedigree */}
          <section id="pedigree" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              1. The Server Pedigree
            </h2>
            <p>
              Phoenix was built to go toe-to-toe with high-performance CPUs (Xeon/EPYC). This means Oryon cores are unusually <strong>wide, powerful, and scalable</strong> compared to typical mobile-first designs.
            </p>
            <p>
              Mobile/consumer chips care about burst performance, thermal limits, and idle efficiency even more than servers do. First-gen Oryon (Snapdragon X) inherits a lot from Phoenix but lacks some “consumer-specific” refinements.
            </p>
            
            {/* Spec Table */}
            <div className="border border-white/5 rounded-2xl overflow-hidden my-8 bg-white/[0.012] shadow-xl shadow-black/10">
              <div className="px-4 py-3 border-b border-white/5 font-mono font-bold text-[9px] tracking-[0.2em] text-[#e8a23a] uppercase bg-white/[0.015]">
                Oryon Generation Timeline
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 font-mono font-semibold text-white/40">
                    <th className="p-3">Generation</th>
                    <th className="p-3">Core Target</th>
                    <th className="p-3">Key Chipsets</th>
                    <th className="p-3">Design Notes</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="p-3 font-semibold font-mono text-[#e8a23a]/80">1st Gen (2021-24)</td>
                    <td className="p-3">Laptops</td>
                    <td className="p-3 text-white/70">Snapdragon X Elite/Plus</td>
                    <td className="p-3 font-light">Pure NuVia Phoenix design, server-centric clustering.</td>
                  </tr>
                  <tr className="border-b border-white/5 bg-white/[0.005]">
                    <td className="p-3 font-semibold font-mono text-[#e8a23a]/80">2nd Gen (2024)</td>
                    <td className="p-3">Smartphones / Tablets</td>
                    <td className="p-3 text-white/70">Snapdragon 8 Elite (Initial)</td>
                    <td className="p-3 font-light">Adapted for mobile thermals and clock domains.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold font-mono text-[#e8a23a]/80">3rd Gen (2025-26)</td>
                    <td className="p-3">Mobile &amp; Client</td>
                    <td className="p-3 text-white/70">Snapdragon 8 Elite Gen 5 (SN8850)</td>
                    <td className="p-3 font-light">Heterogeneous layout, independent SME modules.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Die Shot Analysis */}
          <section id="dieshot" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              2. Reverse Engineering - Die Shot Analysis
            </h2>
            <p>
              The Snapdragon 8 Elite Gen 5 (SN8850) maintains the familiar 2+6 CPU configuration: two high-performance "L Cores" and six power-efficient "M Cores." These clusters each boast a shared 12MB of L2 cache, a setup that mirrors its predecessor. What's truly interesting is the continued reliance on Qualcomm's self-developed, third-generation Oryon cores. This isn't a ground-up redesign, but rather a focused iteration aimed at squeezing more performance and efficiency out of the established architecture.
            </p>

            {/* Click to Zoom Figure 1 */}
            <div className="group flex flex-col items-center my-8">
              <div
                onClick={() => setLightboxImage("/images/articles/image1.png")}
                className="border border-white/5 rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-300 group-hover:scale-[1.015] bg-[#08090e]/60 shadow-xl shadow-black/20"
              >
                <img
                  src="/images/articles/image1.png"
                  alt="DieShot of Snapdragon 8 Elite Gen 5"
                  className="max-h-[380px] object-contain mx-auto"
                />
              </div>
              <span className="text-[10px] font-mono mt-3 text-white/40 text-center max-w-lg">
                <strong>Figure 1</strong> - DieShot of Snapdragon 8 Elite Gen 5. Notice the L and M clusters framing the memory bus. (Click image to zoom)
              </span>
            </div>

            <p>
              In contrast to the Snapdragon X series which used 12 cores grouped in 3 clusters of 4, the mobile 8 Elite uses a 2+6 configuration. The Oryon microarchitecture was built to scale up to 8-core clusters. While this is typical of server CPUs, mobile chips utilize smaller clusters to achieve higher granularity in power management. The SoC can **power-gate** or **clock-gate** entire clusters more flexibly (e.g., for light workloads, keeping only one cluster active while putting other clusters to sleep).
            </p>
            <p>
              However, the tradeoff here is inter-cluster communication. Cores within a cluster communicate quickly via shared L2, but if a core in cluster A needs data from cluster B, it must go through the **Bus Interface Unit (BIU)**. This adds extra latency compared to a single, massive core cluster.
            </p>

            {/* Core Specific Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-xl shadow-xl shadow-black/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-[0.25em] text-[#e8a23a] font-mono uppercase mb-2">
                    L Cores (Performance)
                  </h3>
                  <p className="text-[11.5px] leading-relaxed text-white/55 font-light">
                    The two Oryon L Cores are where the heavy lifting happens. While their overall area saw only a modest increase of 0.39 sq mm, the internal layout shifted from a side-by-side arrangement to a top-and-bottom configuration. The frequency is bumped to a zippy 4.61 GHz (+6.71% over last gen). Removal of a powergate design suggests direct and efficient power delivery. Features an independent SME (Scalable Matrix Extension) module for AI.
                  </p>
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.015] backdrop-blur-xl shadow-xl shadow-black/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-[0.25em] text-[#e8a23a] font-mono uppercase mb-2">
                    M Cores (Efficiency)
                  </h3>
                  <p className="text-[11.5px] leading-relaxed text-white/55 font-light">
                    The six Oryon M Cores feature a frequency jump to 3.63 GHz. The layout has been tweaked, moving from a top-and-bottom arrangement to a left-and-right setup around the central L2 cache. Features independent SM units. Cache optimization reduced L2 area by 0.7 sq mm inside the cluster (13% density increase), letting Qualcomm pack more punch in a smaller die area.
                  </p>
                </div>
              </div>
            </div>

            {/* Click to Zoom Figure 2 */}
            <div className="group flex flex-col items-center my-8">
              <div
                onClick={() => setLightboxImage("/images/articles/image2.png")}
                className="border border-white/5 rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-300 group-hover:scale-[1.015] bg-[#08090e]/60 shadow-xl shadow-black/20"
              >
                <img
                  src="/images/articles/image2.png"
                  alt="Oryon M & L clusters"
                  className="max-h-[300px] object-contain mx-auto"
                />
              </div>
              <span className="text-[10px] font-mono mt-3 text-white/40 text-center max-w-lg">
                <strong>Figure 2</strong> - Oryon M &amp; L clusters of Snapdragon 8 Elite Gen 5. (Click image to zoom)
              </span>
            </div>
          </section>

          {/* Microarchitectural Insights */}
          <section id="microarchitecture" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              3. Microarchitectural Insights &amp; Power Philosophy
            </h2>
            <p>
              Since Qualcomm does not publish full architectural documents for the SN8850, we refer to the Snapdragon X architecture overview presented by Williams (Hot Chips 2024). The original X series design is closer to AMD’s Zen or Intel’s old Core designs (homogeneous cores).
            </p>
            <p>
              Originally, Qualcomm did not follow the typical “big vs little” split. All clusters used the same Oryon cores, with only 2 cores (in different clusters) capable of hitting the peak turbo frequency. Each cluster had its own PLL (phase-locked loop), allowing them to run at different frequencies or power off entirely.
            </p>
            
            {/* Figure 3 */}
            <div className="group flex flex-col items-center my-8">
              <div
                onClick={() => setLightboxImage("/images/articles/image3.png")}
                className="border border-white/5 rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-300 group-hover:scale-[1.015] bg-[#08090e]/60 shadow-xl shadow-black/20"
              >
                <img
                  src="/images/articles/image3.png"
                  alt="Oryon Topology"
                  className="max-h-[220px] object-contain mx-auto p-2"
                />
              </div>
              <span className="text-[10px] font-mono mt-3 text-white/40 text-center max-w-lg">
                <strong>Figure 3</strong> - Microarchitectural Topology of Oryon. Inter-cluster snooping keeps cores coherent via the fabric. (Click image to zoom)
              </span>
            </div>

            <p className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#e8a23a] font-bold mt-6">
              Why homogeneous cores with asymmetric clocks mattered:
            </p>
            <ol className="list-decimal pl-6 space-y-3 mt-2 text-white/60">
              <li className="font-light">
                <strong className="text-white/80">Simpler Scheduling:</strong> With Intel/AMD or traditional mobile SoCs, the OS scheduler must constantly decide whether to run a task on a “big” or “small” core. With Oryon, all cores are equal, allowing the OS to spread workloads symmetrically.
              </li>
              <li className="font-light">
                <strong className="text-white/80">Turbo Strategy:</strong> Allowing only 2 cores to hit max turbo is a deliberate choice. Running all cores at peak turbo would push package power beyond 45–80 W, draining a mobile/laptop battery in barely an hour. Peak single-core turbo ensures that bursty, single-threaded tasks feel snappy.
              </li>
            </ol>
            <p>
              In recent chipsets, such as the 3rd-gen Oryon CPUs in the Snapdragon 8 Elite Gen 5, Qualcomm has shifted to a heterogeneous core design (2 L cores + 6 M cores). While the specific reasons remain proprietary, the change allows even better battery optimization for phones.
            </p>
          </section>

          {/* Shared L2 Cache */}
          <section id="cache" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              4. Cache Hierarchy: Shared L2 Cache
            </h2>
            <p>
              Normally, each core has its own private L2 cache. Qualcomm does it differently: in Oryon, they have <strong>one big shared L2 cache</strong> for all the cores present in that cluster. This reduces data duplication across cores and enables highly efficient sharing.
            </p>
            <p>
              Qualcomm uses a <strong>12 MB, 12-way associative L2 cache</strong> per cluster. That’s very large for an L2 (most x86 CPUs give 512 KB – 2 MB per core). A large shared L2 allows bigger portions of the working set to stay close to the cores, reducing trips to DRAM.
            </p>
            <p>
              Despite being huge, the L2 only takes <strong>17 CPU cycles</strong> to access after an L1 miss, which is a significant improvement over most x86 CPUs that suffer from 30+ cycle L2 latencies.
            </p>

            <blockquote className="border-l border-[#e8a23a] p-6 rounded-r-2xl my-6 leading-relaxed bg-[#e8a23a]/5 border-y-white/5 border-r-white/5 border shadow-xl shadow-black/10">
              <div className="font-mono font-bold tracking-[0.2em] text-[9px] text-[#e8a23a] uppercase mb-2">
                🔬 Inclusive Cache &amp; MOESI Protocol
              </div>
              <p className="text-white/60 text-[12px] font-light">
                Oryon utilizes an <strong>inclusive cache hierarchy</strong> (everything in L1 is present in L2). This is energy efficient because it avoids unnecessary data movements. To maintain coherence, Oryon uses the <strong>MOESI Protocol</strong> (Modified, Owned, Exclusive, Shared, Invalid), which allows efficient sharing without writing back to memory.
              </p>
            </blockquote>
          </section>

          {/* Instruction Fetch and Decode */}
          <section id="fetch-decode" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              5. Front End: Instruction Fetch and Decode
            </h2>
            <p>
              Oryon’s front end shows just how aggressively Qualcomm has tuned this processor to maximize instruction throughput. It begins with a <strong>192 KB Level 1 Instruction Cache (L1 I-Cache)</strong>, which is exceptionally large for a consumer CPU core.
            </p>

            {/* Figure 4 */}
            <div className="group flex flex-col items-center my-8">
              <div
                onClick={() => setLightboxImage("/images/articles/image4.png")}
                className="border border-white/5 rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-300 group-hover:scale-[1.015] bg-[#08090e]/60 shadow-xl shadow-black/20"
              >
                <img
                  src="/images/articles/image4.png"
                  alt="Fetch and Decode Pipeline"
                  className="max-h-[220px] object-contain mx-auto p-2"
                />
              </div>
              <span className="text-[10px] font-mono mt-3 text-white/40 text-center max-w-lg">
                <strong>Figure 4</strong> - Oryon Front End Pipeline. Note the massive 8-wide decode width feeding the dispatch stage. (Click image to zoom)
              </span>
            </div>

            <p>
              From this I-Cache, the <strong>fetch unit can supply up to 16 instructions per cycle</strong>. These are grouped into fetch bundles and sent to the decoder stage.
            </p>
            <p>
              The <strong>decode stage is one of Oryon’s standout features</strong>. Capable of decoding <strong>up to 8 instructions per cycle</strong>, it surpasses the front ends of Intel’s Redwood Cove (6-wide) and AMD’s Zen 4 (4-wide). All decoders are symmetrical, meaning every instruction type can be handled by any decoder, avoiding bottlenecks.
            </p>
            <p>
              Branch prediction is handled by a single-cycle Branch Target Buffer (BTB) for fast path decisions, alongside conditional and indirect predictors. A misprediction incurs a competitive <strong>13-cycle penalty</strong>. Translating instructions is aided by a <strong>256-entry instruction TLB (iTLB)</strong>.
            </p>
          </section>

          {/* Execution Backend */}
          <section id="execution" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              6. Out-of-Order Execution Backend
            </h2>
            <p>
              Moving past the front end, the execution backend shows just how aggressively Qualcomm provisioned resources to sustain high throughput. Nearly every structure is oversized by mobile standards.
            </p>
            <p>
              At the heart lies a large register rename and scheduling system. Oryon provides more than <strong>400 physical registers each for integer and vector operations</strong>. This deep register file ensures the core can sustain a very wide scheduling window without running out of resources, which is essential for out-of-order instruction parallelism.
            </p>
            <p>
              Oryon backs this up with a <strong>massive 650+ entry Reorder Buffer (ROB)</strong>, one of the largest seen in a consumer-oriented CPU core (comparable to Apple's Firestorm/Avalanche cores). On retirement, up to <strong>8 uOps per cycle</strong> can be committed in order, matching the decode width.
            </p>
            <p>
              Execution pipelines are abundant:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/60 font-light">
              <li><strong>Integer:</strong> Six 64-bit ALU pipelines, two branch units, and two multiply-accumulate units.</li>
              <li><strong>Vector/Floating Point:</strong> Four 128-bit SIMD/FP pipelines with NEON support.</li>
              <li><strong>AI Acceleration:</strong> In 3rd-generation cores, the introduction of a newly independent SME (Scalable Matrix Extension) module hints at enhanced matrix computation capabilities.</li>
            </ul>
          </section>

          {/* Load/Store Unit */}
          <section id="load-store" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              7. Load/Store Unit (LSU)
            </h2>
            <p>
              The <strong>Load/Store Unit (LSU)</strong> ensures that data movement between registers, caches, and memory happens with high throughput. Qualcomm has equipped Oryon with <strong>four fully flexible execution pipelines</strong>, capable of handling loads and stores in any combination per cycle.
            </p>
            <p>
              Supporting these pipelines are deep queues: a <strong>192-entry Load Queue</strong> and a <strong>56-entry Store Queue</strong>. Memory operations can be issued out-of-order, while specialized logic manages store-to-load forwarding.
            </p>
            <p>
              The LSU is backed by a sizable <strong>96 KB Level 1 Data Cache (L1 D-Cache)</strong>, which is 6-way associative, multiported, and coherent. It is twice the size of Intel's Redwood Cove L1 data cache. To hide DRAM page-walk latencies, Qualcomm integrates a highly sophisticated **hardware prefetching system** and **TLB prefetching**.
            </p>
          </section>

          {/* Memory Management */}
          <section id="mmu" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              8. Memory Management Unit (MMU) &amp; Virtualization
            </h2>
            <p>
              Oryon's <strong>Memory Management Unit (MMU)</strong> performs virtual-to-physical address translations using hierarchical page tables, supporting <strong>48-bit virtual addressing</strong> with 4 KB pages.
            </p>
            <p>
              Where Oryon stands out is its <strong>full support for nested virtualization</strong>. In addition to standard two-stage address translation, the MMU can support guest hypervisors inside virtual machines—a capability rarely seen in smartphone chips, highlighting its server origins.
            </p>
            <p className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#e8a23a] font-bold">
              Multi-Level TLB Hierarchy:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white/60 font-light">
              <li>L1 instruction and data TLBs for immediate, single-cycle lookups.</li>
              <li>A large, unified <strong>L2 TLB (mTLB)</strong> with <strong>8192 entries</strong> (8-way associative).</li>
              <li>Specialized **Table Walk Caches** to store intermediate descriptors.</li>
              <li>Support for up to <strong>16 concurrent table walks per core</strong> to ensure page table misses don't stall the instruction pipelines.</li>
            </ul>
          </section>

          {/* Memory & L3 Cache */}
          <section id="memory-controller" className="scroll-mt-24 mb-16 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/90 border-b border-white/5 pb-2 mb-4 uppercase font-mono text-glow-gold">
              9. Memory Subsystem &amp; L3/SLC
            </h2>
            <p>
              Beyond the CPU clusters, Oryon cores depend on a shared memory subsystem. This is anchored by Qualcomm’s DDR subsystem (DDRSS), which integrates the memory controller and a <strong>System-Level Cache (SLC)</strong>.
            </p>
            .
            <p>
              The Snapdragon family utilizes a <strong>6 MB shared cache</strong> at the SoC level. Unlike the massive L1 and L2 caches, the SLC is treated primarily as a <strong>victim cache</strong>, catching evicted lines from lower levels.
            </p>
            <p>
              The benefit is latency: the SLC offers access times of just <strong>26–29 nanoseconds</strong>, while offering full <strong>135 GB/s of bandwidth</strong>.
            </p>
            <p>
              System memory is handled by the DDRSS memory controller, supporting <strong>LPDDR5X-8448 memory</strong> over a <strong>128-bit bus</strong> (8 channels × 16 bits), delivering 135 GB/s peak bandwidth. Memory modules are placed directly on the device motherboard, giving OEMs flexibility in configuration.
            </p>
          </section>

          {/* References */}
          <section id="references" className="scroll-mt-24 mb-16 space-y-4 text-[11px] text-white/40">
            <h2 className="text-sm font-bold tracking-tight text-white/60 border-b border-white/5 pb-1 mb-3 uppercase font-mono">
              References
            </h2>
            <ul className="list-decimal pl-5 space-y-1.5 font-mono leading-relaxed">
              <li>
                G. Williams, &ldquo;Snapdragon X Elite Qualcomm Oryon CPU: Design &amp; architecture overview,&rdquo; in <em>Proc. IEEE Symp. High Perform. Comput. Archit. (Hot Chips)</em>, 2024.
              </li>
              <li>
                Kurnalsalts (Reverse engineering floorplan annotations): <a href="https://x.com/Kurnalsalts/status/1971234108111192402" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#e8a23a] transition-colors">https://x.com/Kurnalsalts/status/1971234108111192402</a>
              </li>
              <li>
                Oryon Core Wikipedia details: <a href="https://en.wikipedia.org/wiki/Oryon" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#e8a23a] transition-colors">https://en.wikipedia.org/wiki/Oryon</a>
              </li>
            </ul>
          </section>

        </main>

        {/* ── Right Column: Sticky Author Card ── */}
        <aside className="col-span-12 md:col-span-3">
          <div className="sticky top-24 flex flex-col gap-6">
            
            {/* Author Profile Card */}
            <div className="border border-white/5 bg-white/[0.015] backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-black/15">
              <div className="flex flex-col items-center text-center">
                {/* Larger profile picture */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4 group/avatar">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#e8a23a] to-yellow-500/30 animate-pulse opacity-40 blur-sm group-hover/avatar:opacity-75 transition-opacity" />
                  <img
                    src="/images/preetam.png"
                    alt="Preetam"
                    className="w-full h-full rounded-full object-cover relative z-10 border border-[#e8a23a]/30"
                  />
                </div>
                
                <h3 className="text-base font-bold tracking-tight text-white mb-1">Preetam</h3>
                <div className="text-[9px] font-mono text-[#e8a23a] font-bold uppercase tracking-wider mb-4">
                  4th-year Electrical Engineer
                </div>
                
                <div className="w-8 h-px bg-white/10 mb-4" />
                
                {/* Author's credentials & bio */}
                <p className="text-[11.5px] leading-relaxed text-white/50 mb-6 font-light">
                  Electrical Engineering student at IIT Bombay. Passionate about computer architecture, silicon layout analysis, and the fascinating design decisions behind modern mobile and server processors.
                </p>
                
                {/* Action Links */}
                <div className="w-full flex flex-col gap-2 font-mono text-[9px] tracking-wider uppercase font-bold">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.012] hover:bg-[#e8a23a] text-white hover:text-black hover:border-transparent text-center transition-all duration-300"
                  >
                    💻 GitHub Profile
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.012] hover:bg-[#e8a23a] text-white hover:text-black hover:border-transparent text-center transition-all duration-300"
                  >
                    🐦 Twitter / X
                  </a>
                  <a
                    href="mailto:preetam@iitb.ac.in"
                    className="w-full py-2.5 rounded-lg border border-white/5 bg-white/[0.012] hover:bg-[#e8a23a] text-white hover:text-black hover:border-transparent text-center transition-all duration-300"
                  >
                    ✉️ Contact Author
                  </a>
                </div>
              </div>
            </div>

            {/* Subscribe Mini-Box */}
            <div className="border border-white/5 bg-white/[0.015] backdrop-blur-xl rounded-2xl p-5 shadow-xl shadow-black/15">
              <span className="text-[8px] font-mono tracking-widest text-[#e8a23a] font-bold uppercase block mb-1">
                Newsletter
              </span>
              <h4 className="text-xs font-bold uppercase font-mono tracking-tight text-white/80 mb-2">
                Get more die shots
              </h4>
              <p className="text-[11px] leading-normal text-white/50 font-light mb-3">
                Subscribe to receive weekly microarchitectural breakdowns directly in your inbox.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-black/40 text-[10px] px-3 py-2 rounded-lg border border-white/10 focus:border-[#e8a23a] focus:outline-none focus:ring-1 focus:ring-[#e8a23a] font-mono text-white placeholder-white/20"
                />
                <button className="bg-[#e8a23a] hover:bg-white text-black font-mono font-bold text-[8px] px-3 py-2 rounded-lg tracking-wider transition-colors shrink-0 cursor-pointer">
                  JOIN
                </button>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md cursor-zoom-out p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white font-mono text-[9px] tracking-widest bg-white/5 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-md cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            [CLOSE]
          </button>
          <img
            src={lightboxImage}
            alt="Fullscreen zoom"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/5"
          />
        </div>
      )}
    </div>
  );
}
