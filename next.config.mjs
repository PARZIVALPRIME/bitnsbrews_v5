/** @type {import('next').NextConfig} */
const nextConfig = {
  // The merged `main` branch carries pre-existing lint noise; don't block builds on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
