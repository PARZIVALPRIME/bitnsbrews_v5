import * as THREE from "three";

export interface ZoomLevel {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  defaultPosition: [number, number, number];
  defaultTarget: [number, number, number];
  fov: number;
}

export const ZOOM_LEVELS: ZoomLevel[] = [
  {
    id: 1,
    name: "System Casing",
    subtitle: "Computer Enclosure Layer",
    description: "The macroscopic physical layer. The outer enclosure provides structural integrity, heat distribution channels, and electromagnetic shielding for the system.",
    defaultPosition: [0, 60, 75],
    defaultTarget: [0, 0, 0],
    fov: 30,
  },
  {
    id: 2,
    name: "MCM Package",
    subtitle: "Silicon Substrate Layer",
    description: "The Multi-Chip Module (MCM) packaging. Features an organic substrate, high-density interposer micro-bumps, and a copper heat spreader matching thermal expansion coefficients.",
    defaultPosition: [0, 24, 28],
    defaultTarget: [0, -1, 0],
    fov: 28,
  },
  {
    id: 3,
    name: "Silicon Die",
    subtitle: "3nm SoC Floorplan",
    description: "The monolithic semiconductor die. Spanning 22x18 units, containing ~12 Billion transistors constructed with EUV photolithography on a 3nm FinFET/GAA process node.",
    defaultPosition: [20, 16, 22],
    defaultTarget: [0.3, 1.5, 0.0],
    fov: 25,
  },
  {
    id: 4,
    name: "CPU Clusters",
    subtitle: "Compute Core Spotlight",
    description: "The main processing cluster. Spotlight on performance Cortex-X4 cores and Cortex-A720 efficiency cores, highlighting core layout and local cache interfaces.",
    defaultPosition: [8, 20, 12],
    defaultTarget: [-2.5, 2.0, -2.0],
    fov: 32,
  },
  {
    id: 5,
    name: "Graphics Engine",
    subtitle: "GPU Spotlight",
    description: "Focusing on the 16-Core parallel mobile GPU. Spotlighting parallel execution units and high-speed local graphics caches.",
    defaultPosition: [14, 20, 10],
    defaultTarget: [3.5, 2.0, -2.3],
    fov: 32,
  },
  {
    id: 6,
    name: "Neural Accelerator",
    subtitle: "NPU Spotlight",
    description: "Zooming onto the Systolic Array NPU AI Engine, showing dedicated compute clusters and weight SRAM memory storage.",
    defaultPosition: [4, 20, 8],
    defaultTarget: [-6.9, 2.0, -4.4],
    fov: 32,
  },
  {
    id: 7,
    name: "Baseband Modem",
    subtitle: "Modem Spotlight",
    description: "Focusing on the RF-isolated 5G Modem, highlighting baseband processors and electromagnetic boundary shield traces.",
    defaultPosition: [4, 20, 14],
    defaultTarget: [-6.9, 2.0, 0.5],
    fov: 32,
  },
  {
    id: 8,
    name: "Media Pipeline",
    subtitle: "Media Spotlight",
    description: "Focusing on the ISP, Video Codecs, and Audio DSP blocks, highlighting raw camera pipelines and media decoding engines.",
    defaultPosition: [20, 20, 10],
    defaultTarget: [9.0, 2.0, -1.6],
    fov: 32,
  },
  {
    id: 9,
    name: "Memory Subsystem",
    subtitle: "SLC & Fabric Spotlight",
    description: "Focusing on System Cache, Memory Controller, and LPDDR memory interfaces, highlighting shared on-die data paths.",
    defaultPosition: [12, 20, 18],
    defaultTarget: [1.0, 2.0, 4.8],
    fov: 32,
  },
  {
    id: 10,
    name: "Execution Pipeline",
    subtitle: "Instruction Stage Flow",
    description: "Visualizing the pipeline instruction execution stage simulation inside the primary compute core.",
    defaultPosition: [8, 18, 8],
    defaultTarget: [-2.5, 3.0, -4.5],
    fov: 28,
  },
];

export function getCameraParamsForLevel(
  level: number,
  selectedBlockCoords: { cx: number; cz: number; h: number } | null
): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
  const current = ZOOM_LEVELS.find((l) => l.id === level) || ZOOM_LEVELS[2];
  const position = new THREE.Vector3(...current.defaultPosition);
  const target = new THREE.Vector3(...current.defaultTarget);
  let fov = current.fov;

  if (selectedBlockCoords && level >= 4) {
    const { cx, cz, h } = selectedBlockCoords;
    // Position camera nearly directly above the block's lifted top face
    // Minimal X/Z offset gives cinematic depth without losing top-down framing
    target.set(cx, h + 0.1, cz);
    position.set(cx + 0.8, h + 9, cz + 1.2);
    fov = 38;
  }

  return { position, target, fov };
}

export function getCameraParamsInterpolated(
  levelFloat: number,
  selectedBlockCoords: { cx: number; cz: number; h: number } | null
): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
  const baseLevel = Math.floor(levelFloat);
  const targetLevel = Math.min(ZOOM_LEVELS.length, baseLevel + 1);
  const alpha = levelFloat - baseLevel;

  const baseParams = getCameraParamsForLevel(baseLevel, selectedBlockCoords);
  const targetParams = getCameraParamsForLevel(targetLevel, selectedBlockCoords);

  const position = new THREE.Vector3().lerpVectors(baseParams.position, targetParams.position, alpha);
  const target = new THREE.Vector3().lerpVectors(baseParams.target, targetParams.target, alpha);
  const fov = baseParams.fov + (targetParams.fov - baseParams.fov) * alpha;

  return { position, target, fov };
}
