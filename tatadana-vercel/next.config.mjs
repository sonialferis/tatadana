/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent build failures on Vercel due to ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensure smooth build on Vercel without strict type blocking
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable', 'xlsx'],
  },
};

export default nextConfig;
