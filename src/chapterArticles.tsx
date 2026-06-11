// import React from "react";

export function getArticleForLevel(level: number): string {
  switch (level) {
    case 4:
      return `# Layer 4: CPU Cores
## Performance Cortex-X4

This is the top face of the CPU performance core block. You can paste your CPU performance articles or compiler research notes here.

- Core Frequency: 3.30 GHz
- L2 Cache: 3 × 2 MB
- Process Node: 3nm GAA EUV`;
    case 5:
      return `# Layer 5: Graphics Engine
## 16-Core Shader Pipeline

This is the top face of the GPU block. You can paste your GPU benchmarks, mobile raytracing papers, or shader specs here.

- Shader ALUs: 128-wide
- Compute power: ~4.2 FP32 TFLOPS
- Cache: Dedicated L2 cache complex`;
    case 6:
      return `# Layer 6: Neural Accelerator
## 45 TOPS Systolic AI Engine

This is the top face of the NPU block. You can paste your systolic array architectures, transformer models, or weights SRAM studies here.

- Compute: systolic MAC array
- Weights Cache: 12MB SRAM on-die
- Precision: INT4/8, FP16`;
    case 7:
      return `# Layer 7: Baseband Modem
## RF-Isolated 5G Sub-system

This is the top face of the 5G Modem block. You can paste cellular baseband processors, Release 16 RF specs, or shielding articles here.

- Downlink speed: 10 Gbps
- Frequency: Sub-6 GHz + mmWave
- Operating System: Real-Time RTOS`;
    case 8:
      return `# Layer 8: Media & ISP Pipeline
## 14-bit RAW Image & Multi-Codec Engine

This is the media pipeline processing cluster, including the Image Signal Processor (ISP), Audio DSP, and Video hardware acceleration codecs.

- Max Sensor support: 200 MP
- Video Codecs: AV1, H.265 (HEVC), VP9
- Audio Resolution: 32-bit Hi-Res`;
    case 9:
      return `# Layer 9: Memory Subsystem
## 16MB System Level Cache & LPDDR5x Controller

This is the memory interface layer on top of the silicon floorplan. Integrates the system-wide coherent cache and the LPDDR5x PHY interfaces.

- Cache Capacity: 16 MB SRAM
- Memory standard: LPDDR5x
- Fabric Bandwidth: ~400 GB/s`;
    case 10:
      return `# Layer 10: Execution Pipeline
## Core Instruction Processing Flow

This is Layer 10 (Execution Pipeline) standing on top of the Performance CPU.

### Out-of-Order Execution Stages
- **Fetch**: Grabs instruction packets from the 64KB L1 Instruction Cache.
- **Decode**: Explodes instruction bytes into micro-ops (uOps) at 10 uOps/cycle.
- **Rename**: Maps architectural registers to a physical register file of 320 entries.
- **Dispatch**: Reserves execution slots in reservation stations.
- **Issue**: Sends ready uOps to 8 execution ports out-of-order.
- **Execute**: Computes results in integer ALUs or FP SIMD units.
- **Retire**: Commits results back to architectural state in-order.`;
    default:
      return `# Silicon Block Overview
## Domain Level ${level}

This is the top face of the silicon block. Click EDIT to paste your technical documentation or articles directly here.`;
  }
}

export function parseMarkdown(text: string) {
  return text.split("\n").map((line, idx) => {
    if (line.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-[13px] font-semibold text-white/95 mt-2 mb-1">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-[11.5px] font-medium text-[#8aa9ff] mt-1.5 mb-1">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-[11px] font-medium text-white/75 mt-1.5 mb-0.5">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={idx} className="text-[11px] leading-[1.6] text-white/60 ml-3.5 list-disc my-0.5">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="text-[11.5px] leading-[1.65] text-white/60 my-1 text-left">
        {line}
      </p>
    );
  });
}
