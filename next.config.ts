import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',  // Required for static export to GitHub Pages
  images: { unoptimized: true },  // Disables image optimization for static sites
  eslint: { ignoreDuringBuilds: true }, // Disables ESLint during build
  typescript: { ignoreBuildErrors: true },

  // Enable asset prefix with hashes for cache busting
  // Next.js automatically adds content hashes to _next/static files
  assetPrefix: undefined,
};

export default nextConfig;
