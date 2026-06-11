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
    name: "The Library",
    subtitle: "Knowledge Map",
    description: "The die as a table of contents. Every block rises, and each main block carries one editorial track. Click a block to read.",
    defaultPosition: [2, 19, 28],
    defaultTarget: [0, 3.4, 0],
    fov: 32,
  },
  {
    id: 5,
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
  _selectedBlockCoords: { cx: number; cz: number; h: number } | null
): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
  const current = ZOOM_LEVELS.find((l) => l.id === level) || ZOOM_LEVELS[2];
  const position = new THREE.Vector3(...current.defaultPosition);
  const target = new THREE.Vector3(...current.defaultTarget);
  let fov = current.fov;



  return { position, target, fov };
}

export function getFocusedBlockCoordsForLevel(_level: number): { cx: number; cz: number; h: number } | null {
  return null;
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
