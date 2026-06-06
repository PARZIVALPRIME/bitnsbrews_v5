import { useState, useEffect } from "react";
import { Html } from "@react-three/drei";

function getDefaultArticle(blockId: string): string {
  switch (blockId) {
    case "cpu-big":
      return `# Layer 4: CPU Cores
## Performance Cortex-X4

This is the top face of the CPU performance core block. You can paste your CPU performance articles or compiler research notes here.

- Core Frequency: 3.30 GHz
- L2 Cache: 3 × 2 MB
- Process Node: 3nm GAA EUV`;
    case "cpu-eff":
      return `# Layer 4: CPU Cores
## Efficiency Cortex-A720

This is the top face of the CPU efficiency core block. You can paste your low-power scheduling or standby power articles here.

- Core Frequency: 2.40 GHz
- L2 Cache: Shared 2 MB
- Power Floor: ~150 mW`;
    case "gpu":
      return `# Layer 5: Graphics Engine
## 16-Core Shader Pipeline

This is the top face of the GPU block. You can paste your GPU benchmarks, mobile raytracing papers, or shader specs here.

- Shader ALUs: 128-wide
- Compute power: ~4.2 FP32 TFLOPS
- Cache: Dedicated L2 cache complex`;
    case "npu":
      return `# Layer 6: Neural Accelerator
## 45 TOPS Systolic AI Engine

This is the top face of the NPU block. You can paste your systolic array architectures, transformer models, or weights SRAM studies here.

- Compute: systolic MAC array
- Weights Cache: 12MB SRAM on-die
- Precision: INT4/8, FP16`;
    case "modem":
      return `# Layer 7: Baseband Modem
## RF-Isolated 5G Sub-system

This is the top face of the 5G Modem block. You can paste cellular baseband processors, Release 16 RF specs, or shielding articles here.

- Downlink speed: 10 Gbps
- Frequency: Sub-6 GHz + mmWave
- Operating System: Real-Time RTOS`;
    case "isp":
      return `# Layer 8: ISP Pipeline
## 14-bit RAW Image Processor

This is the top face of the ISP block. You can paste RAW camera pipeline details, demosaic stages, or HDR fusion specs here.

- Max Sensor support: 200 MP
- Video Capability: 8K @ 60 fps
- Precision: 14-bit RAW pipeline`;
    case "dsp":
      return `# Layer 8: Audio & DSP
## VLIW Low-Power Signal Processor

This is the top face of the DSP block. You can paste audio beamforming algorithms, wake-word models, or sensor fusion articles here.

- Resolution: 32-bit Hi-Res
- Target: Microwatt standby tracking
- System latency: <10 ms`;
    case "video":
      return `# Layer 8: Media Codec
## AV1 / HEVC Video Engine

This is the top face of the Video Codec block. You can paste hardware decoder specs, AV1 streaming metrics, or transcoding notes here.

- Formats: AV1, H.265 (HEVC), VP9
- Capacity: 4 × 4K simultaneous streams
- Color Depth: 10-bit HDR decoding`;
    case "slc":
      return `# Layer 9: Memory Subsystem
## 16MB System Level Cache

This is the top face of the SLC block. You can paste your cache coherency protocols, interconnect latency studies, or fabric layouts here.

- Cache Capacity: 16 MB SRAM
- Fabric Bandwidth: ~400 GB/s
- Read Latency: ~12 ns`;
    case "memctrl":
      return `# Layer 9: Memory Subsystem
## 4x LPDDR5x DRAM Controller

This is the top face of the memory controller. You can paste Row Hammer mitigation notes, DRAM scheduling policies, or page table briefs here.

- Memory standard: LPDDR5x
- Max Data Rate: 8533 MT/s
- Channels: 4 × 16-bit wide`;
    default:
      if (blockId.startsWith("lpddr")) {
        return `# Layer 9: LPDDR5x DRAM
## Off-Chip Memory Channel

This is the top face of an LPDDR5x PHY block. You can paste DRAM signal integrity, PHY trace routing, or memory burst specs here.`;
      }
      if (blockId.startsWith("io")) {
        return `# Layer 9: I/O Perimeter Ring
## System PHY Interfaces

This is the top face of an I/O ring block. You can paste high-speed PCIe Gen 4 channels, USB PHY spec, or ESD protection briefs here.`;
      }
      return `# Silicon Block Overview
## Domain: ${blockId}

This is the top face of the ${blockId} silicon block. Click EDIT to paste your technical documentation or articles directly here.`;
  }
}

function parseMarkdown(text: string) {
  return text.split("\n").map((line, idx) => {
    if (line.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-[12px] font-bold text-[#e8a23a] mt-2 mb-0.5 tracking-wide uppercase">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-[10.5px] font-semibold text-white/95 mt-1.5 mb-0.5 border-b border-white/5 pb-0.5">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-[9.5px] font-medium text-[#e8a23a]/80 mt-1 mb-0.5">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={idx} className="text-[8.5px] text-white/60 ml-3.5 list-disc my-0.5">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={idx} className="h-1" />;
    }
    return (
      <p key={idx} className="text-[9px] leading-[1.55] text-white/50 my-0.5 font-light">
        {line}
      </p>
    );
  });
}

interface BlockArticleProps {
  blockId: string;
  active: boolean;
  blockW: number;
  blockD: number;
  blockH: number;
  level: number;
}

export function BlockArticle({ blockId, active, blockW: _blockW, blockD: _blockD, blockH, level }: BlockArticleProps) {
  const [activeTab, setActiveTab] = useState<"read" | "edit">("read");
  const [content, setContent] = useState("");

  // Load persisted content or default
  useEffect(() => {
    // If it is level 10 and this is the big CPU, we use a special pipeline article!
    if (level === 10 && blockId === "cpu-big") {
      const saved = localStorage.getItem("bnb_article_pipeline");
      if (saved) {
        setContent(saved);
        return;
      }
      setContent(`# Layer 10: Execution Pipeline
## Core Instruction Processing Flow

This is Layer 10 (Execution Pipeline) standing on top of the Performance CPU.

### Out-of-Order Execution Stages
- **Fetch**: Grabs instruction packets from the 64KB L1 Instruction Cache.
- **Decode**: Explodes instruction bytes into micro-ops (uOps) at 10 uOps/cycle.
- **Rename**: Maps architectural registers to a physical register file of 320 entries.
- **Dispatch**: Reserves execution slots in reservation stations.
- **Issue**: Sends ready uOps to 8 execution ports out-of-order.
- **Execute**: Computes results in integer ALUs or FP SIMD units.
- **Retire**: Commits results back to architectural state in-order.`);
      return;
    }

    const saved = localStorage.getItem(`bnb_article_${blockId}`);
    if (saved) {
      setContent(saved);
    } else {
      setContent(getDefaultArticle(blockId));
    }
  }, [blockId, level]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (level === 10 && blockId === "cpu-big") {
      localStorage.setItem("bnb_article_pipeline", val);
    } else {
      localStorage.setItem(`bnb_article_${blockId}`, val);
    }
  };

  if (!active) return null;

  // We rotate it flat on top of the block cap
  // HTML card dimension: 360px width by 250px height
  // scaled by 0.022, it maps to ~7.9 units wide by ~5.5 units deep in 3D
  const htmlScale = 0.022;

  return (
    <group position={[0, blockH + 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 3D Glass card backing */}
      <mesh receiveShadow castShadow>
        <planeGeometry args={[375 * htmlScale, 265 * htmlScale]} />
        <meshStandardMaterial 
          color="#060912" 
          metalness={0.95} 
          roughness={0.1} 
          transparent 
          opacity={0.5} 
        />
      </mesh>

      {/* HTML transform element */}
      <Html 
        transform 
        distanceFactor={10.0} 
        portal={undefined} 
        position={[0, 0, 0.01]}
      >
        <div className="w-[360px] h-[240px] flex flex-col bg-black/90 border border-[#e8a23a]/25 rounded-md p-3 backdrop-blur-md text-white font-sans select-text shadow-2xl">
          {/* Header controls */}
          <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-1.5 shrink-0">
            <span className="text-[7.5px] font-mono font-bold tracking-[0.2em] text-[#e8a23a]/70 uppercase">
              BNB Co-Spatial Journal
            </span>
            <div className="flex gap-1 p-0.5 rounded bg-white/5 border border-white/5">
              <button
                onClick={() => setActiveTab("read")}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase tracking-wider transition-colors duration-150 ${
                  activeTab === "read"
                    ? "bg-[#e8a23a]/80 text-black shadow"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Read
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase tracking-wider transition-colors duration-150 ${
                  activeTab === "edit"
                    ? "bg-[#e8a23a]/80 text-black shadow"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Plaque main text viewport */}
          <div className="flex-1 overflow-y-auto pr-0.5 select-text scrollbar-thin">
            {activeTab === "read" ? (
              <div className="text-left select-text">
                {parseMarkdown(content)}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Paste your markdown or notes here..."
                className="w-full h-full bg-black/20 border border-white/5 focus:border-[#e8a23a]/30 rounded p-1.5 text-[8.5px] font-mono leading-relaxed text-white/75 outline-none resize-none select-text focus:ring-0 focus:outline-none"
              />
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}
