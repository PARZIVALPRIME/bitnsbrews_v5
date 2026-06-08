import * as THREE from "three";
import { BLOCKS } from "./data";

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
    defaultPosition: [0, 80, 100],
    defaultTarget: [0, 0, 0],
    fov: 30,
  },
  {
    id: 2,
    name: "MCM Package",
    subtitle: "Silicon Substrate Layer",
    description: "The Multi-Chip Module (MCM) packaging. Features an organic substrate, high-density interposer micro-bumps, and a copper heat spreader matching thermal expansion coefficients.",
    defaultPosition: [0, 32, 38],
    defaultTarget: [0, -1, 0],
    fov: 28,
  },
  {
    id: 3,
    name: "Silicon Die",
    subtitle: "3nm SoC Floorplan",
    description: "The monolithic semiconductor die. Spanning 22x18 units, containing ~12 Billion transistors constructed with EUV photolithography on a 3nm FinFET/GAA process node.",
    defaultPosition: [28, 22, 30],
    defaultTarget: [0.3, 1.5, 0.0],
    fov: 25,
  },
  {
    id: 4,
    name: "CPU Clusters",
    subtitle: "Compute Core Spotlight",
    description: "The main processing cluster. Spotlight on performance Cortex-X4 cores and Cortex-A720 efficiency cores, highlighting core layout and local cache interfaces.",
    defaultPosition: [-4.5, 23.8, -9.05],
    defaultTarget: [-2.0, 7.3, -3.55],
    fov: 22,
  },
  {
    id: 5,
    name: "Graphics Engine",
    subtitle: "GPU Spotlight",
    description: "Focusing on the 16-Core parallel mobile GPU. Spotlighting parallel execution units and high-speed local graphics caches.",
    defaultPosition: [5.44, 23.0, -6.83],
    defaultTarget: [2.94, 6.5, -1.33],
    fov: 22,
  },
  {
    id: 6,
    name: "Neural Accelerator",
    subtitle: "NPU Spotlight",
    description: "Zooming onto the Systolic Array NPU AI Engine, showing dedicated compute clusters and weight SRAM memory storage.",
    defaultPosition: [-8.90, 22.6, -8.91],
    defaultTarget: [-6.40, 6.1, -3.41],
    fov: 22,
  },
  {
    id: 7,
    name: "Baseband Modem",
    subtitle: "Modem Spotlight",
    description: "Focusing on the RF-isolated 5G Modem, highlighting baseband processors and electromagnetic boundary shield traces.",
    defaultPosition: [-8.90, 21.6, 4.97],
    defaultTarget: [-6.40, 5.1, -0.53],
    fov: 22,
  },
  {
    id: 8,
    name: "Media Pipeline",
    subtitle: "Media Spotlight",
    description: "Focusing on the ISP, Video Codecs, and Audio DSP blocks, highlighting raw camera pipelines and media decoding engines.",
    defaultPosition: [11.02, 20.8, -9.37],
    defaultTarget: [8.52, 4.3, -3.87],
    fov: 22,
  },
  {
    id: 9,
    name: "Memory Subsystem",
    subtitle: "SLC & Fabric Spotlight",
    description: "Focusing on System Cache, Memory Controller, and LPDDR memory interfaces, highlighting shared on-die data paths.",
    defaultPosition: [1.96, 19.6, 9.29],
    defaultTarget: [0.46, 3.1, 3.79],
    fov: 22,
  },
  {
    id: 10,
    name: "Execution Pipeline",
    subtitle: "Instruction Stage Flow",
    description: "Visualizing the pipeline instruction execution stage simulation inside the primary compute core.",
    defaultPosition: [-4.5, 20.81, -9.05],
    defaultTarget: [-2.0, 4.31, -3.55],
    fov: 22,
  },
  {
    id: 11,
    name: "The Hub",
    subtitle: "Complete Index Directory",
    description: "",
    defaultPosition: [0, 50, 60],
    defaultTarget: [0, -2, 0],
    fov: 32,
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
    
    // High-angle cinematic page-view offsets (around 70 degrees looking down)
    const offsets: Record<number, [number, number, number]> = {
      4: [-2.0, 16.0, -4.5],
      5: [2.0, 16.0, -4.5],
      6: [-2.0, 16.0, -4.5],
      7: [-2.0, 16.0, 4.5],
      8: [2.0, 16.0, -4.5],
      9: [1.0, 16.0, 4.5],
      10: [-2.0, 16.0, -4.5],
    };
    const offset = offsets[level] || [-2.0, 16.0, -4.5];
    
    // Shift target away from the camera to push the block down on the screen
    const shiftX = offset[0] > 0 ? -0.5 : 0.5;
    const shiftZ = offset[2] > 0 ? -1.0 : 1.0;
    target.set(cx + shiftX, h - 0.5, cz + shiftZ);
    
    position.set(cx + offset[0], h + offset[1], cz + offset[2]);
    fov = 22;
  }

  return { position, target, fov };
}

export function getFocusedBlockCoordsForLevel(level: number): { cx: number; cz: number; h: number } | null {
  const PRIMARY_BLOCK_FOR_LEVEL: Record<number, string> = {
    4: "cpu-big",
    5: "gpu",
    6: "npu",
    7: "modem",
    8: "isp",
    9: "slc",
    10: "cpu-big",
  };
  const primaryId = PRIMARY_BLOCK_FOR_LEVEL[level];
  if (!primaryId) return null;
  const block = BLOCKS.find((b) => b.id === primaryId);
  if (!block) return null;
  
  // Return coords using the block's narrative lift height scaled by 0.4
  const LIFT_SCALE = 0.4;
  const liftHeight = level === 10 ? 0.35 * block.lift * LIFT_SCALE : block.lift * LIFT_SCALE;
  return { cx: block.cx, cz: block.cz, h: liftHeight + block.h };
}

function interpolateSpherical(v1: THREE.Vector3, v2: THREE.Vector3, alpha: number): THREE.Vector3 {
  const r1 = v1.length();
  const r2 = v2.length();
  
  // Interpolate distance from target
  const r = r1 + (r2 - r1) * alpha;
  if (r < 0.001) return new THREE.Vector3();
  
  // Get polar angle (theta) from Y-axis
  const theta1 = Math.acos(THREE.MathUtils.clamp(v1.y / (r1 || 1), -1, 1));
  const theta2 = Math.acos(THREE.MathUtils.clamp(v2.y / (r2 || 1), -1, 1));
  
  // Get azimuthal angle (phi) around Y-axis
  const phi1 = Math.atan2(v1.z, v1.x);
  const phi2 = Math.atan2(v2.z, v2.x);
  
  // Interpolate polar angle
  const theta = theta1 + (theta2 - theta1) * alpha;
  
  // Interpolate azimuthal angle using the shortest path angular transition
  let diff = phi2 - phi1;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const phi = phi1 + diff * alpha;
  
  // Convert spherical coords back to Cartesian Vector3
  const sinTheta = Math.sin(theta);
  const x = r * sinTheta * Math.cos(phi);
  const z = r * sinTheta * Math.sin(phi);
  const y = r * Math.cos(theta);
  
  return new THREE.Vector3(x, y, z);
}

export function getCameraParamsInterpolated(
  levelFloat: number,
  selectedBlockCoords: { cx: number; cz: number; h: number } | null
): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
  const baseLevel = Math.floor(levelFloat);
  const targetLevel = Math.min(ZOOM_LEVELS.length, baseLevel + 1);
  const alpha = levelFloat - baseLevel;

  // Retrieve focused coords specific to base and target levels to prevent coordinate jumps during transitions
  const baseFocusCoords = selectedBlockCoords || getFocusedBlockCoordsForLevel(baseLevel);
  const targetFocusCoords = selectedBlockCoords || getFocusedBlockCoordsForLevel(targetLevel);

  const baseParams = getCameraParamsForLevel(baseLevel, baseFocusCoords);
  const targetParams = getCameraParamsForLevel(targetLevel, targetFocusCoords);

  // Linearly interpolate the look-at focus target
  const target = new THREE.Vector3().lerpVectors(baseParams.target, targetParams.target, alpha);

  // Compute relative camera coordinates from the target
  const relP1 = baseParams.position.clone().sub(target);
  const relP2 = targetParams.position.clone().sub(target);

  // Interpolate camera relative coordinates spherically to pivot around the focus point
  const relPos = interpolateSpherical(relP1, relP2, alpha);
  const position = target.clone().add(relPos);

  // Cinematic Flyover Arc: Add a vertical lift proportional to distance to create a dynamic flyby swoop
  const dist = baseParams.position.distanceTo(targetParams.position);
  const flyover = Math.sin(alpha * Math.PI) * (dist * 0.14);
  position.y += flyover;

  // Linear interpolation for field of view (FOV)
  const fov = baseParams.fov + (targetParams.fov - baseParams.fov) * alpha;

  return { position, target, fov };
}
