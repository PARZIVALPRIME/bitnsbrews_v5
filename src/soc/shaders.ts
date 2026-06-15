
/**
 * 1. Thermal Visualization Shader
 * Maps utilization level to a high-end thermal gradient.
 * Cooler areas are deep indigo, active areas are amber-orange, and heavy compute hot-spots glow bright white-red.
 */
export const ThermalShader = {
  vertexShader: /* glsl */ `
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uUtilization;
    uniform vec3 uBaseColor;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
      // Create a localized noise-based temperature fluctuation
      float noise = sin(vPosition.x * 2.0 + uTime * 1.5) * cos(vPosition.z * 2.0 - uTime * 1.2) * 0.1;
      
      // Calculate heat value based on utilization and position (hotter in the center of the block)
      float centerDist = length(vPosition.xz);
      float heat = clamp(uUtilization * 0.95 + noise - centerDist * 0.05, 0.0, 1.0);
      
      // Thermal color map gradient:
      // Cool (deep blue/indigo): rgb(10, 21, 48)
      // Warm (amber/orange): rgb(232, 162, 58)
      // Hot (bright red/white): rgb(255, 69, 0)
      
      vec3 coolColor = vec3(0.04, 0.08, 0.22);
      vec3 warmColor = vec3(0.91, 0.64, 0.23); // #e8a23a
      vec3 hotColor = vec3(1.0, 0.18, 0.0);    // Orange-Red
      vec3 peakColor = vec3(1.0, 0.95, 0.85);   // Glowing white-yellow

      vec3 color = coolColor;
      
      if (heat < 0.5) {
        color = mix(coolColor, warmColor, heat * 2.0);
      } else if (heat < 0.8) {
        color = mix(warmColor, hotColor, (heat - 0.5) * 3.33);
      } else {
        color = mix(hotColor, peakColor, (heat - 0.8) * 5.0);
      }

      // Add a subtle rim light outline based on normal to keep spatial detail
      float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
      color += warmColor * pow(rim, 3.5) * 0.25;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/**
 * 2. Power Grid Rail Shader
 * Renders glowing electric circuits that pulsate along the grid axis.
 */
export const PowerRailShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      // Draw grid lines
      float gridX = step(0.96, fract(vUv.x * 24.0));
      float gridY = step(0.96, fract(vUv.y * 24.0));
      float grid = max(gridX, gridY);

      if (grid < 0.1) {
        discard;
      }

      // Animate electric pulses traveling along the power rails
      float pulse = sin(vPosition.x * 4.0 - uTime * 6.0) * cos(vPosition.z * 4.0 + uTime * 3.0);
      pulse = smoothstep(0.4, 0.95, pulse);

      // Primary color and glowing peaks
      vec3 electricColor = uColor * (0.6 + pulse * 1.5);
      
      gl_FragColor = vec4(electricColor, 0.85);
    }
  `,
};
