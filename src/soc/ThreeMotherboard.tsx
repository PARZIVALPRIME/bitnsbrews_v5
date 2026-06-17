import * as THREE from "three";
import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";

interface Path3D {
  points: THREE.Vector3[];
  color: string;
  isHighlighted: boolean;
  isFlowing: boolean;
}

// Statically declare vias, testPoints, etc., to avoid re-generating on every render
const staticVias = [
  // Top Left
  { x: -48, z: -30 }, { x: -48, z: -28 }, { x: -48, z: -26 },
  // Bottom Left
  { x: -42, z: 20 }, { x: -42, z: 22 }, { x: -42, z: 24 },
  // Top Right
  { x: 48, z: -30 }, { x: 48, z: -28 }, { x: 48, z: -26 },
  // Bottom Right
  { x: 42, z: 20 }, { x: 42, z: 22 }, { x: 42, z: 24 },
  // Vertical
  { x: -12, z: -55 }, { x: 12, z: -55 }, { x: -12, z: 55 }, { x: 12, z: 55 }
];

const testPoints: { x: number; z: number }[] = [];
const grids = [
  { cx: -40, cz: -45 },
  { cx: 40, cz: -45 },
  { cx: -40, cz: 45 },
  { cx: 40, cz: 45 }
];
grids.forEach(g => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r + c) % 3 === 0) continue;
      testPoints.push({ x: g.cx + c * 1.5, z: g.cz + r * 1.5 });
    }
  }
});

function getPointOnPath(points: THREE.Vector3[], t: number, outTarget: THREE.Vector3) {
  if (points.length === 0) return;
  if (points.length === 1) {
    outTarget.copy(points[0]);
    return;
  }
  
  const numSegments = points.length - 1;
  const rawIndex = t * numSegments;
  const segmentIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
  const segmentT = rawIndex - segmentIndex;
  
  const pStart = points[segmentIndex];
  const pEnd = points[segmentIndex + 1];
  outTarget.lerpVectors(pStart, pEnd, segmentT);
}

function setSegmentMatrix(A: THREE.Vector3, B: THREE.Vector3, width: number, thickness: number, dummy: THREE.Object3D) {
  const dx = B.x - A.x;
  const dz = B.z - A.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  
  // Midpoint position at Y=-1.95, slightly offset by thickness
  dummy.position.set((A.x + B.x) / 2, -1.95 + thickness / 2, (A.z + B.z) / 2);
  dummy.rotation.set(0, -angle, 0);
  dummy.scale.set(len, thickness, width);
  dummy.updateMatrix();
}

function PacketSphere({
  path,
  color,
  speed,
  offset,
  opacity,
  thickness,
}: {
  path: THREE.Vector3[];
  color: string;
  speed: number;
  offset: number;
  opacity: number;
  thickness: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (opacity <= 0.05) return;
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    // Flow from endpoint (t=0) to startpoint (t=1)
    const tVal = (time * speed + offset) % 1.0;
    // Invert so they flow towards the center (chip)
    const reversedT = 1.0 - tVal;
    getPointOnPath(path, reversedT, pos);
    
    // Look ahead to calculate direction
    const nextT = Math.max(0.0, reversedT - 0.015);
    const nextPos = new THREE.Vector3();
    getPointOnPath(path, nextT, nextPos);
    
    const dir = new THREE.Vector3().subVectors(nextPos, pos).normalize();
    
    // Set Y position to sit right on top of the trace
    pos.y = -1.95 + thickness + thickness * 0.9;
    meshRef.current.position.copy(pos);
    
    if (dir.lengthSq() > 0.0001) {
      const lookTarget = pos.clone().add(dir);
      meshRef.current.lookAt(lookTarget);
    }
  });

  const radius = thickness * 1.1;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[radius * 1.4, radius * 1.4, radius * 4.5]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={15.0 * opacity}
        transparent
        opacity={opacity}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

export function ThreeMotherboard({ levelFloat }: { levelFloat: number }) {
  const copperColor = "#4b687a";

  const stdMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        /vec3\s+totalEmissiveRadiance\s*=\s*emissive\s*;/g,
        `
        #ifdef USE_INSTANCING_COLOR
          vec3 totalEmissiveRadiance = vInstanceColor * 4.0;
        #else
          vec3 totalEmissiveRadiance = emissive;
        #endif
        `
      );
    };
    return mat;
  }, []);

  const hiMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        /vec3\s+totalEmissiveRadiance\s*=\s*emissive\s*;/g,
        `
        #ifdef USE_INSTANCING_COLOR
          vec3 totalEmissiveRadiance = vInstanceColor * 6.5;
        #else
          vec3 totalEmissiveRadiance = emissive;
        #endif
        `
      );
    };
    return mat;
  }, []);

  const flowMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        /vec3\s+totalEmissiveRadiance\s*=\s*emissive\s*;/g,
        `
        #ifdef USE_INSTANCING_COLOR
          vec3 totalEmissiveRadiance = vInstanceColor * 10.0;
        #else
          vec3 totalEmissiveRadiance = emissive;
        #endif
        `
      );
    };
    return mat;
  }, []);

  const viaMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        /vec3\s+totalEmissiveRadiance\s*=\s*emissive\s*;/g,
        `
        #ifdef USE_INSTANCING_COLOR
          vec3 totalEmissiveRadiance = vInstanceColor * 3.5;
        #else
          vec3 totalEmissiveRadiance = emissive;
        #endif
        `
      );
    };
    return mat;
  }, []);

  const stdRef = useRef<THREE.InstancedMesh>(null!);
  const hiRef = useRef<THREE.InstancedMesh>(null!);
  const flowRef = useRef<THREE.InstancedMesh>(null!);
  const viasRef = useRef<THREE.InstancedMesh>(null!);

  // Generate paths in 3D coordinates
  const paths = useMemo(() => {
    const list: Path3D[] = [];
    
    const addPath = (
      startX: number,
      startZ: number,
      points: { x: number; z: number }[],
      isHighlighted: boolean,
      isFlowing: boolean,
      pathColor: string
    ) => {
      // Sit standard traces at Y = -1.94
      const curvePoints = [new THREE.Vector3(startX, -1.94, startZ)];
      points.forEach(p => {
        curvePoints.push(new THREE.Vector3(p.x, -1.94, p.z));
      });
      list.push({
        points: curvePoints,
        color: pathColor,
        isHighlighted,
        isFlowing
      });
    };

    // Curated premium technical cool blue, frost, slate, and silver-blue palette matching both the die and site
    const leftColors = ["#5b80a4", "#384d61", "#d6e4ed", "#8faebc", "#7fa8cc", "#5b80a4", "#384d61", "#8faebc", "#5b80a4", "#384d61"];
    const rightColors = ["#384d61", "#d6e4ed", "#8faebc", "#7fa8cc", "#5b80a4", "#384d61", "#8faebc", "#5b80a4", "#384d61", "#5b80a4"];
    const diagTLColors = ["#5b80a4", "#384d61", "#8faebc", "#d6e4ed", "#5b80a4", "#7fa8cc", "#8faebc", "#384d61"];
    const diagTRColors = ["#384d61", "#5b80a4", "#7fa8cc", "#8faebc", "#8faebc", "#384d61", "#5b80a4", "#8faebc"];
    const diagBLColors = ["#5b80a4", "#384d61", "#d6e4ed", "#8faebc", "#7fa8cc", "#5b80a4", "#384d61", "#8faebc"];
    const diagBRColors = ["#384d61", "#5b80a4", "#8faebc", "#7fa8cc", "#384d61", "#8faebc", "#5b80a4", "#8faebc"];
    const vertTColors = ["#5b80a4", "#d6e4ed", "#384d61", "#8faebc", "#7fa8cc", "#5b80a4", "#8faebc", "#384d61"];
    const vertBColors = ["#384d61", "#8faebc", "#d6e4ed", "#7fa8cc", "#5b80a4", "#8faebc", "#384d61", "#5b80a4"];

    // 1. Left Bus (10 lines)
    for (let i = 0; i < 10; i++) {
      const startZ = -11 + i * 2.4;
      const isHi = i === 2 || i === 7;
      const isFlow = i === 4;
      addPath(
        -14, // start under chip
        startZ,
        [
          { x: -20, z: startZ }, // package edge connection point
          { x: -28 - i * 0.3, z: startZ },
          { x: -34 - i * 0.3, z: startZ + 5.0 },
          { x: -44 - i * 0.5, z: startZ + 5.0 },
          { x: -48 - i * 0.5, z: startZ + 1.0 },
          { x: -240, z: startZ + 1.0 } // extends way off screen
        ],
        isHi,
        isFlow,
        leftColors[i % leftColors.length]
      );
    }
    
    // 2. Right Bus (10 lines)
    for (let i = 0; i < 10; i++) {
      const startZ = -11 + i * 2.4;
      const isHi = i === 1 || i === 6;
      const isFlow = i === 3;
      addPath(
        14, // start under chip
        startZ,
        [
          { x: 20, z: startZ }, // package edge connection point
          { x: 28 + i * 0.3, z: startZ },
          { x: 34 + i * 0.3, z: startZ - 5.0 },
          { x: 44 + i * 0.5, z: startZ - 5.0 },
          { x: 48 + i * 0.5, z: startZ - 1.0 },
          { x: 240, z: startZ - 1.0 } // extends way off screen
        ],
        isHi,
        isFlow,
        rightColors[i % rightColors.length]
      );
    }
    
    // 3. Top Left Diagonal Bus (8 lines)
    for (let i = 0; i < 8; i++) {
      const startX = -20 + 2.0 + i * 1.3;
      const isHi = i === 3;
      const isFlow = i === 5;
      addPath(
        startX,
        -12, // start under chip
        [
          { x: startX, z: -17 }, // package edge connection point
          { x: startX - 10.0, z: -27.0 },
          { x: startX - 10.0, z: -35.0 - i * 0.6 },
          { x: startX - 15.0, z: -40.0 - i * 0.6 },
          { x: -240, z: -40.0 - i * 0.6 } // extends way off screen
        ],
        isHi,
        isFlow,
        diagTLColors[i % diagTLColors.length]
      );
    }
    
    // 4. Top Right Diagonal Bus (8 lines)
    for (let i = 0; i < 8; i++) {
      const startX = 20 - 2.0 - i * 1.3;
      const isHi = i === 4;
      const isFlow = i === 2;
      addPath(
        startX,
        -12, // start under chip
        [
          { x: startX, z: -17 }, // package edge connection point
          { x: startX + 10.0, z: -27.0 },
          { x: startX + 10.0, z: -35.0 - i * 0.6 },
          { x: startX + 15.0, z: -40.0 - i * 0.6 },
          { x: 240, z: -40.0 - i * 0.6 } // extends way off screen
        ],
        isHi,
        isFlow,
        diagTRColors[i % diagTRColors.length]
      );
    }
    
    // 5. Bottom Left Diagonal Bus (8 lines)
    for (let i = 0; i < 8; i++) {
      const startX = -20 + 2.0 + i * 1.3;
      const isHi = i === 2;
      const isFlow = i === 4;
      addPath(
        startX,
        12, // start under chip
        [
          { x: startX, z: 17 }, // package edge connection point
          { x: startX - 10.0, z: 27.0 },
          { x: startX - 10.0, z: 35.0 + i * 0.6 },
          { x: startX - 15.0, z: 40.0 + i * 0.6 },
          { x: -240, z: 40.0 + i * 0.6 } // extends way off screen
        ],
        isHi,
        isFlow,
        diagBLColors[i % diagBLColors.length]
      );
    }
    
    // 6. Bottom Right Diagonal Bus (8 lines)
    for (let i = 0; i < 8; i++) {
      const startX = 20 - 2.0 - i * 1.3;
      const isHi = i === 5;
      const isFlow = i === 3;
      addPath(
        startX,
        12, // start under chip
        [
          { x: startX, z: 17 }, // package edge connection point
          { x: startX + 10.0, z: 27.0 },
          { x: startX + 10.0, z: 35.0 + i * 0.6 },
          { x: startX + 15.0, z: 40.0 + i * 0.6 },
          { x: 240, z: 40.0 + i * 0.6 } // extends way off screen
        ],
        isHi,
        isFlow,
        diagBRColors[i % diagBRColors.length]
      );
    }
    
    // 7. Top Vertical Bus (8 lines)
    for (let i = 0; i < 8; i++) {
      const startX = -5.0 + i * 1.4;
      const isHi = i === 1 || i === 6;
      const isFlow = i === 4;
      addPath(
        startX,
        -12, // start under chip
        [
          { x: startX, z: -17 }, // package edge connection point
          { x: startX, z: -28.0 - i * 0.5 },
          { x: startX + (i < 4 ? -8.0 : 8.0), z: -36.0 - i * 0.5 },
          { x: startX + (i < 4 ? -8.0 : 8.0), z: -240 } // extends way off screen (covers top empty space!)
        ],
        isHi,
        isFlow,
        vertTColors[i % vertTColors.length]
      );
    }
    
    // 8. Bottom Vertical Bus (8 lines)
    for (let i = 0; i < 8; i++) {
      const startX = -5.0 + i * 1.4;
      const isHi = i === 2 || i === 5;
      const isFlow = i === 3;
      addPath(
        startX,
        12, // start under chip
        [
          { x: startX, z: 17 }, // package edge connection point
          { x: startX, z: 28.0 + i * 0.5 },
          { x: startX + (i < 4 ? -8.0 : 8.0), z: 36.0 + i * 0.5 },
          { x: startX + (i < 4 ? -8.0 : 8.0), z: 240 } // extends way off screen
        ],
        isHi,
        isFlow,
        vertBColors[i % vertBColors.length]
      );
    }
    
    return list;
  }, []);

  // Segment groupings for 3D boxes
  const segmentsData = useMemo(() => {
    const stdSegs: { A: THREE.Vector3; B: THREE.Vector3; color: string }[] = [];
    const hiSegs: { A: THREE.Vector3; B: THREE.Vector3; color: string }[] = [];
    const flowSegs: { A: THREE.Vector3; B: THREE.Vector3; color: string }[] = [];
    
    paths.forEach(p => {
      const list = p.isFlowing ? flowSegs : p.isHighlighted ? hiSegs : stdSegs;
      for (let i = 0; i < p.points.length - 1; i++) {
        list.push({ A: p.points[i], B: p.points[i+1], color: p.color });
      }
    });
    
    return { stdSegs, hiSegs, flowSegs };
  }, [paths]);

  // Solder Vias position groupings (endpoints + static vias + connection vias + intermediate joints)
  const viaPositions = useMemo(() => {
    const list: THREE.Vector3[] = [];
    paths.forEach(p => {
      // 1. Endpoint
      list.push(p.points[p.points.length - 1]);
      
      // 2. Intermediate joints/bends
      for (let j = 2; j < p.points.length - 1; j++) {
        list.push(p.points[j]);
      }
      
      // 3. Connection points (both the inner start point under package and the edge boundary)
      if (p.points.length > 1) {
        list.push(p.points[0]); // Inner connection column under chip
        list.push(p.points[1]); // Edge connection column
      }
    });
    
    // 4. Static vias
    staticVias.forEach(v => {
      list.push(new THREE.Vector3(v.x, -1.56, v.z));
    });
    return list;
  }, [paths]);

  // Set up matrices on instanced meshes
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    
    // 1. Standard copper traces: width = 0.16, thickness = 0.12
    segmentsData.stdSegs.forEach((seg, i) => {
      setSegmentMatrix(seg.A, seg.B, 0.16, 0.12, dummy);
      stdRef.current.setMatrixAt(i, dummy.matrix);
      stdRef.current.setColorAt(i, new THREE.Color(seg.color));
    });
    stdRef.current.instanceMatrix.needsUpdate = true;
    if (stdRef.current.instanceColor) {
      stdRef.current.instanceColor.needsUpdate = true;
      stdMaterial.needsUpdate = true;
    }
    
    // 2. Highlighted traces: width = 0.22, thickness = 0.16
    segmentsData.hiSegs.forEach((seg, i) => {
      setSegmentMatrix(seg.A, seg.B, 0.22, 0.16, dummy);
      hiRef.current.setMatrixAt(i, dummy.matrix);
      hiRef.current.setColorAt(i, new THREE.Color(seg.color));
    });
    hiRef.current.instanceMatrix.needsUpdate = true;
    if (hiRef.current.instanceColor) {
      hiRef.current.instanceColor.needsUpdate = true;
      hiMaterial.needsUpdate = true;
    }
    
    // 3. Flowing/Dynamic traces: width = 0.28, thickness = 0.20
    segmentsData.flowSegs.forEach((seg, i) => {
      setSegmentMatrix(seg.A, seg.B, 0.28, 0.20, dummy);
      flowRef.current.setMatrixAt(i, dummy.matrix);
      flowRef.current.setColorAt(i, new THREE.Color(seg.color));
    });
    flowRef.current.instanceMatrix.needsUpdate = true;
    if (flowRef.current.instanceColor) {
      flowRef.current.instanceColor.needsUpdate = true;
      flowMaterial.needsUpdate = true;
    }

    // 4. Vias cylinders (endpoint copper/matching, connection gold, and joints)
    let viaIndex = 0;
    paths.forEach((p) => {
      // 4a. Endpoint via (match the trace's color, scaled to match/exceed trace thickness)
      const endPos = p.points[p.points.length - 1];
      dummy.position.copy(endPos);
      
      const radScale = p.isFlowing ? 2.0 : p.isHighlighted ? 1.6 : 1.2;
      const hScale = p.isFlowing ? 5.5 : p.isHighlighted ? 4.5 : 3.5;
      const hThick = p.isFlowing ? 0.20 : p.isHighlighted ? 0.16 : 0.12;

      dummy.position.y = -1.95 + hThick / 2;
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(radScale, hScale, radScale);
      dummy.updateMatrix();
      viasRef.current.setMatrixAt(viaIndex, dummy.matrix);
      viasRef.current.setColorAt(viaIndex, new THREE.Color(p.color));
      viaIndex++;

      // 4b. Intermediate joint/bend vias (scaled to trace thickness)
      for (let j = 2; j < p.points.length - 1; j++) {
        const bendPos = p.points[j];
        dummy.position.copy(bendPos);
        
        const scaleXZ = p.isFlowing ? 1.8 : p.isHighlighted ? 1.4 : 1.0;
        const scaleY = p.isFlowing ? 5.0 : p.isHighlighted ? 4.0 : 3.0;
        const thickness = p.isFlowing ? 0.20 : p.isHighlighted ? 0.16 : 0.12;
        
        dummy.position.y = -1.95 + thickness / 2;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(scaleXZ, scaleY, scaleXZ);
        dummy.updateMatrix();
        viasRef.current.setMatrixAt(viaIndex, dummy.matrix);
        viasRef.current.setColorAt(viaIndex, new THREE.Color(p.color));
        viaIndex++;
      }

      // 4c. Connection vias (sleek gold vertical PGA mounting pins)
      if (p.points.length > 1) {
        // Inner connection column under chip (directly under packages)
        // Spans Y = -1.95 (motherboard) to Y = -1.50 (plugged into package body)
        const innerPos = p.points[0];
        dummy.position.copy(innerPos);
        dummy.position.y = -1.725; 
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.5, 11.25, 1.5); // 0.15 radius, 0.45 height (stout and visible!)
        dummy.updateMatrix();
        viasRef.current.setMatrixAt(viaIndex, dummy.matrix);
        viasRef.current.setColorAt(viaIndex, new THREE.Color("#ffe1a0")); // gold PGA pin
        viaIndex++;

        // Edge connection column at package boundary
        const edgePos = p.points[1];
        dummy.position.copy(edgePos);
        dummy.position.y = -1.725; 
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.2, 11.25, 1.2); // 0.12 radius, 0.45 height
        dummy.updateMatrix();
        viasRef.current.setMatrixAt(viaIndex, dummy.matrix);
        viasRef.current.setColorAt(viaIndex, new THREE.Color("#ffe1a0")); // gold PGA pin
        viaIndex++;
      }
    });

    staticVias.forEach((v) => {
      dummy.position.set(v.x, -1.95 + 0.04, v.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1.2, 2.0, 1.2);
      dummy.updateMatrix();
      viasRef.current.setMatrixAt(viaIndex, dummy.matrix);
      viasRef.current.setColorAt(viaIndex, new THREE.Color(copperColor));
      viaIndex++;
    });

    viasRef.current.instanceMatrix.needsUpdate = true;
    if (viasRef.current.instanceColor) {
      viasRef.current.instanceColor.needsUpdate = true;
      viaMaterial.needsUpdate = true;
    }
  }, [segmentsData, viaPositions]);

  // Set up ground plane canvas texture
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.Texture();
 
    // Map 3D coordinate [-250, 250] to Canvas coordinate [0, 2048]
    // Keeping this broad projection covers a massive 500x500 ground plane
    // so it fills the entire viewport in Chapter 1 perspective.
    const mapX = (x: number) => 1024 + (x / 250) * 1024;
    const mapY = (z: number) => 1024 + (z / 250) * 1024;

    ctx.clearRect(0, 0, 2048, 2048);

    // Draw the solid dark blue-gray PCB background
    ctx.fillStyle = "#0a0d16";
    ctx.fillRect(0, 0, 2048, 2048);

    // 1. Draw Grid Lines (cool technical blue-gray, clearly visible!)
    ctx.strokeStyle = "#495e6d";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.18;
    for (let x = -240; x <= 240; x += 12) {
      ctx.beginPath();
      ctx.moveTo(mapX(x), mapY(-250));
      ctx.lineTo(mapX(x), mapY(250));
      ctx.stroke();
    }
    for (let z = -240; z <= 240; z += 12) {
      ctx.beginPath();
      ctx.moveTo(mapX(-250), mapY(z));
      ctx.lineTo(mapX(250), mapY(z));
      ctx.stroke();
    }

    // 1.5 Draw small tick crosshairs at grid intersections to make it look highly technical
    ctx.fillStyle = "#5c7585";
    ctx.globalAlpha = 0.35;
    for (let x = -240; x <= 240; x += 24) {
      for (let z = -240; z <= 240; z += 24) {
        ctx.fillRect(mapX(x) - 1.5, mapY(z) - 1.5, 3, 3);
      }
    }

    // Feathered mask out in center under package (keeps grids clean under package base)
    ctx.globalCompositeOperation = "destination-out";
    const centerGrad = ctx.createRadialGradient(1024, 1024, 0, 1024, 1024, 250);
    centerGrad.addColorStop(0, "rgba(0,0,0,1)");
    centerGrad.addColorStop(0.8, "rgba(0,0,0,0.85)");
    centerGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(1024, 1024, 280, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // 1.6 Draw silkscreen component outlines (voltage regulators, sensor modules)
    ctx.strokeStyle = "#495e6d";
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1.5;
    const drawIC = (cx: number, cz: number, w: number, h: number, label: string) => {
      const x1 = mapX(cx - w/2);
      const y1 = mapY(cz - h/2);
      ctx.strokeRect(x1, y1, w * 4.096, h * 4.096);
      ctx.fillStyle = "#8faebc";
      ctx.globalAlpha = 0.6;
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(label, x1 + 5, y1 + 13);
      ctx.strokeStyle = "#495e6d";
      ctx.globalAlpha = 0.25;
    };
    drawIC(-60, -80, 20, 15, "U12_PUMP");
    drawIC(60, -80, 20, 15, "U14_VREF");
    drawIC(-80, 60, 24, 18, "U21_SOC_IO");
    drawIC(80, 60, 24, 18, "U22_MEM_IO");

    // 2. Draw outer concentric rings of vias (solder mask expansions)
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = "#495e6d";
    ctx.lineWidth = 2.0;
    paths.forEach(p => {
      const end = p.points[p.points.length - 1];
      ctx.beginPath();
      ctx.arc(mapX(end.x), mapY(end.z), 7.2, 0, Math.PI * 2);
      ctx.stroke();
    });
    staticVias.forEach(v => {
      ctx.beginPath();
      ctx.arc(mapX(v.x), mapY(v.z), 7.2, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 3. Draw Test Points (flat pads flush with solder mask)
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = "#ffd700"; // Gold test points
    testPoints.forEach(tp => {
      ctx.beginPath();
      ctx.arc(mapX(tp.x), mapY(tp.z), 3.0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Gold fingers (flat margins connector rows at X = -238 and 238)
    ctx.globalAlpha = 0.75;
    const drawFingers = (x: number, isLeft: boolean) => {
      for (let z = -60; z <= 60; z += 4.5) {
        ctx.fillStyle = "#ffd700"; // Gold fingers
        ctx.fillRect(mapX(x) - 4, mapY(z) - 16, 8, 32);

        // Trace lines feeding into fingers
        const bendZ = z + (z % 2 === 0 ? 1.5 : -1.5);
        const targetX = isLeft ? x + 8 : x - 8;
        const bendX = isLeft ? x + 4 : x - 4;

        ctx.strokeStyle = "#495e6d"; // Cool technical gray lines
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(mapX(x), mapY(z));
        ctx.lineTo(mapX(bendX), mapY(bendZ));
        ctx.lineTo(mapX(targetX), mapY(bendZ));
        ctx.stroke();
      }
    };
    drawFingers(-238, true);
    drawFingers(238, false);

    // 5. Draw Fiducial Corner Targets
    ctx.globalAlpha = 0.75;
    const fiducials = [
      { x: -140, z: -140 }, { x: 140, z: -140 },
      { x: -140, z: 140 }, { x: 140, z: 140 }
    ];
    fiducials.forEach(f => {
      const fx = mapX(f.x);
      const fz = mapY(f.z);
      
      ctx.strokeStyle = "#8faebc"; // Tech silver-blue silkscreen target
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(fx, fz, 16, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = "#ffd700"; // Gold registration center dot
      ctx.beginPath();
      ctx.arc(fx, fz, 3.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#8faebc"; // Tech silver-blue silkscreen crosshairs
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx - 24, fz);
      ctx.lineTo(fx + 24, fz);
      ctx.moveTo(fx, fz - 24);
      ctx.lineTo(fx, fz + 24);
      ctx.stroke();
    });

    // 6. Monospace Labels & Specs matching the site's cool technical styling
    ctx.globalAlpha = 0.85; // silkscreen print
    ctx.fillStyle = "#8faebc"; // Tech silver-blue silkscreen color
    ctx.font = "bold 17px 'JetBrains Mono', 'Courier New', monospace";
    
    ctx.fillText("SYS_BD", mapX(-32), mapY(-15));
    ctx.fillText("_VDD_SOC", mapX(-32), mapY(15));
    ctx.fillText("_M_ADDR[8..3]", mapX(17), mapY(-15));
    ctx.fillText("_VREG_OUT", mapX(17), mapY(15));
    
    ctx.save();
    ctx.translate(mapX(0) + 22, mapY(45));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("_REF_200M", 0, 0);
    ctx.restore();
    
    ctx.font = "13.5px 'JetBrains Mono', 'Courier New', monospace";
    ctx.fillText("BOARD SPEC: 12-LAYER FR4 HDI", mapX(-70), mapY(-55));
    ctx.fillText("TRACE WIDTH: 0.125MM", mapX(-70), mapY(-53.5));
    ctx.fillText("CONTROLLED IMPEDANCE: 50R/90R", mapX(-70), mapY(-52));
    
    ctx.textAlign = "right";
    ctx.fillText("DESIGNED BY: PARZIVAL & DHRUV", mapX(70), mapY(-55));
    ctx.fillText("PROJECT: BITS'N'BREWS V5", mapX(70), mapY(-53.5));
    ctx.fillText("LAYER STACKUP: 1-10-1", mapX(70), mapY(-52));

    // 7. FADE OUT EDGES RADIENT MASK
    ctx.globalCompositeOperation = "destination-out";
    const maskGrad = ctx.createRadialGradient(1024, 1024, 600, 1024, 1024, 980);
    maskGrad.addColorStop(0, "rgba(0,0,0,0)");
    maskGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = maskGrad;
    ctx.beginPath();
    ctx.arc(1024, 1024, 1024, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }, [paths]);

  // Animated packets specs (updated thickness heights)
  const packetSpecs = useMemo(() => {
    const list: {
      path: THREE.Vector3[];
      color: string;
      speed: number;
      offset: number;
      thickness: number;
    }[] = [];
    
    paths.forEach((p, idx) => {
      // Flow packets on ~40% of the paths
      if (idx % 3 === 0) {
        const thickness = p.isFlowing ? 0.20 : p.isHighlighted ? 0.16 : 0.12;
        list.push({
          path: p.points,
          color: p.color, // Match the trace color!
          speed: 0.22 + (idx % 4) * 0.05,
          offset: (idx % 5) * 0.2,
          thickness
        });
      }
    });
    return list;
  }, [paths]);

  const opacity = Math.max(0, 1 - Math.abs(levelFloat - 1) * 1.55);
  const visible = opacity > 0.001;

  useFrame(() => {
    stdMaterial.opacity = opacity;
    hiMaterial.opacity = opacity;
    flowMaterial.opacity = opacity;
    viaMaterial.opacity = opacity;
  });

  return (
    <group visible={visible}>
      {/* 1. Large Ground Motherboard Mesh (Y=-1.95, size 500x500 to span viewport, glossier reflectiveness!) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.95, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={opacity}
          roughness={0.22}
          metalness={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* 2. 3D Standard Copper Traces (Instanced boxes) */}
      <instancedMesh
        ref={stdRef}
        args={[undefined, undefined, segmentsData.stdSegs.length]}
        material={stdMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* 3. 3D Highlighted Traces */}
      <instancedMesh
        ref={hiRef}
        args={[undefined, undefined, segmentsData.hiSegs.length]}
        material={hiMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* 4. 3D Flowing Traces (Dynamic high intensity) */}
      <instancedMesh
        ref={flowRef}
        args={[undefined, undefined, segmentsData.flowSegs.length]}
        material={flowMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* 5. 3D Vias cylinders */}
      <instancedMesh
        ref={viasRef}
        args={[undefined, undefined, viaPositions.length]}
        material={viaMaterial}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.10, 0.10, 0.04, 8]} />
      </instancedMesh>

      {/* 6. Moving 3D Data Packets */}
      <group visible={opacity > 0.05}>
        {packetSpecs.map((spec, i) => (
          <PacketSphere
            key={i}
            path={spec.path}
            color={spec.color}
            speed={spec.speed}
            offset={spec.offset}
            opacity={opacity}
            thickness={spec.thickness}
          />
        ))}
      </group>
    </group>
  );
}
