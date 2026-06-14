import * as THREE from "three";

export const globalLevelState = {
  current: 1.0,
  target: 1.0,
};

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
    name: "Silicon Die",
    subtitle: "3nm SoC Floorplan",
    description: "The monolithic semiconductor die. Spanning 22x18 units, containing ~12 Billion transistors constructed with EUV photolithography on a 3nm FinFET/GAA process node.",
    defaultPosition: [28, 22, 30],
    defaultTarget: [0.3, 1.5, 0.0],
    fov: 25,
  },
  {
    id: 3,
    name: "The Library",
    subtitle: "Knowledge Map",
    description: "The die as a table of contents. Every block rises, and each main block carries one editorial track. Click a block to read.",
    defaultPosition: [2.5, 22.5, 33],
    defaultTarget: [0, 3.4, 0],
    fov: 32,
  },
  {
    id: 4,
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
  const current = ZOOM_LEVELS.find((l) => l.id === level) || ZOOM_LEVELS[1];
  const position = new THREE.Vector3(...current.defaultPosition);
  const target = new THREE.Vector3(...current.defaultTarget);
  let fov = current.fov;

  if (selectedBlockCoords && level === 3) {
    target.set(selectedBlockCoords.cx, selectedBlockCoords.h + 0.2, selectedBlockCoords.cz);
    // Position the camera tightly close to the block, maintaining a front-right-above perspective
    position.set(
      selectedBlockCoords.cx + 2.0,
      selectedBlockCoords.h + 9.0,
      selectedBlockCoords.cz + 13.0
    );
    fov = 20; // tighter cinematic view
  }

  return { position, target, fov };
}

export function getFocusedBlockCoordsForLevel(_level: number): { cx: number; cz: number; h: number } | null {
  return null;
}
// Internal zero-allocation helpers
function getCameraParamsForLevelInPlace(
  level: number,
  selectedBlockCoords: { cx: number; cz: number; h: number } | null,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3
): number {
  const current = ZOOM_LEVELS.find((l) => l.id === level) || ZOOM_LEVELS[1];
  outPos.set(current.defaultPosition[0], current.defaultPosition[1], current.defaultPosition[2]);
  outTarget.set(current.defaultTarget[0], current.defaultTarget[1], current.defaultTarget[2]);
  let fov = current.fov;

  if (selectedBlockCoords && level === 3) {
    // Shift look target along the camera right direction (-X, +Z) to move the block
    // to the left viewport area so it is not obscured by the right sidebar.
    const targetX = selectedBlockCoords.cx - 2.7;
    const targetZ = selectedBlockCoords.cz + 0.7;

    outTarget.set(targetX, selectedBlockCoords.h + 0.2, targetZ);
    outPos.set(
      targetX + 4.5,
      selectedBlockCoords.h + 11.5,
      targetZ + 18.0
    );
    fov = 24;
  }

  return fov;
}

function interpolateSphericalInPlace(
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  alpha: number,
  twistAngle: number,
  outVec: THREE.Vector3
): void {
  const r1 = v1.length();
  const r2 = v2.length();
  const r = r1 + (r2 - r1) * alpha;
  if (r < 0.001) {
    outVec.set(0, 0, 0);
    return;
  }
  
  const theta1 = Math.acos(THREE.MathUtils.clamp(v1.y / (r1 || 1), -1, 1));
  const theta2 = Math.acos(THREE.MathUtils.clamp(v2.y / (r2 || 1), -1, 1));
  
  const phi1 = Math.atan2(v1.z, v1.x);
  const phi2 = Math.atan2(v2.z, v2.x);
  
  const theta = theta1 + (theta2 - theta1) * alpha;
  
  let diff = phi2 - phi1;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const phi = phi1 + diff * alpha + twistAngle;
  
  const sinTheta = Math.sin(theta);
  const x = r * sinTheta * Math.cos(phi);
  const z = r * sinTheta * Math.sin(phi);
  const y = r * Math.cos(theta);
  
  outVec.set(x, y, z);
}

// Module-level static vectors for interpolation to prevent garbage collection pressure
const _basePos = new THREE.Vector3();
const _baseTarget = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetTarget = new THREE.Vector3();
const _relP1 = new THREE.Vector3();
const _relP2 = new THREE.Vector3();
const _relPos = new THREE.Vector3();
const _posScratch = new THREE.Vector3();
const _targetScratch = new THREE.Vector3();

export function getCameraParamsInterpolated(
  levelFloat: number,
  selectedBlockCoords: { cx: number; cz: number; h: number } | null
): { position: THREE.Vector3; target: THREE.Vector3; fov: number; roll: number } {
  const baseLevel = Math.floor(levelFloat);
  const targetLevel = Math.min(ZOOM_LEVELS.length, baseLevel + 1);
  const rawAlpha = levelFloat - baseLevel;

  // Apply slow-in/slow-out easing (smoothstep) for cinematic acceleration
  const alpha = rawAlpha * rawAlpha * (3 - 2 * rawAlpha);

  const baseFocusCoords = selectedBlockCoords || getFocusedBlockCoordsForLevel(baseLevel);
  const targetFocusCoords = selectedBlockCoords || getFocusedBlockCoordsForLevel(targetLevel);

  const baseFov = getCameraParamsForLevelInPlace(baseLevel, baseFocusCoords, _basePos, _baseTarget);
  const targetFov = getCameraParamsForLevelInPlace(targetLevel, targetFocusCoords, _targetPos, _targetTarget);

  // Linearly interpolate the look-at focus target
  _targetScratch.lerpVectors(_baseTarget, _targetTarget, alpha);

  // Compute relative camera coordinates from the target
  _relP1.subVectors(_basePos, _targetScratch);
  _relP2.subVectors(_targetPos, _targetScratch);

  // Add lateral helical / orbital swing on Chapter 1 -> 2 transition (System Casing -> Silicon Die)
  let twistAngle = 0;
  let roll = 0;
  if (baseLevel === 1 && targetLevel === 2) {
    twistAngle = Math.sin(alpha * Math.PI) * 0.7;
    roll = -Math.sin(alpha * Math.PI) * 0.22; // deep cinematic camera bank/roll
  }

  // Interpolate camera relative coordinates spherically to pivot around the focus point
  interpolateSphericalInPlace(_relP1, _relP2, alpha, twistAngle, _relPos);
  _posScratch.addVectors(_targetScratch, _relPos);

  // Cinematic Flyover Arc
  const dist = _basePos.distanceTo(_targetPos);
  const arcScale = (baseLevel === 1 && targetLevel === 2) ? 0.22 : 0.14;
  const flyover = Math.sin(alpha * Math.PI) * (dist * arcScale);
  _posScratch.y += flyover;

  const fov = baseFov + (targetFov - baseFov) * alpha;

  return { position: _posScratch, target: _targetScratch, fov, roll };
}
