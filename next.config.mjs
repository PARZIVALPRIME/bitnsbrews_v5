/** @type {import('next').NextConfig} */

// Baseline security headers. The CSP is intentionally Report-Only for now: it
// reports violations (visible in the browser console / a report endpoint) without
// breaking the 3D scene or Google Fonts. Once we've confirmed it's clean, flip
// "Content-Security-Policy-Report-Only" to "Content-Security-Policy" to enforce.
const cspReportOnly = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; R3F/three are bundled from 'self'.
  "script-src 'self' 'unsafe-inline'",
  // Tailwind/Next inline styles + Google Fonts stylesheet.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // WebGL textures / canvas use data: and blob:.
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig = {
  // The merged `main` branch carries pre-existing lint noise; don't block builds on it.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
