export default {
  /* config options here */
  output: 'export', // Required for static export to GitHub Pages
  images: { unoptimized: true }, // Disables image optimization for static sites
  eslint: { ignoreDuringBuilds: true }, // Disables ESLint during build
  typescript: { ignoreBuildErrors: true },
};
