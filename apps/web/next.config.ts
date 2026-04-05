import type { NextConfig } from 'next';
// @ducanh2912/next-pwa supports Next.js 14+
// Install it: pnpm add @ducanh2912/next-pwa
// Then uncomment the block below and remove the plain export.
//
// import withPWA from '@ducanh2912/next-pwa';
// export default withPWA({
//   dest: 'public',
//   cacheOnFrontEndNav: true,
//   aggressiveFrontEndNavCaching: true,
//   reloadOnOnline: true,
//   disable: process.env.NODE_ENV === 'development',
// })({ output: 'standalone' } satisfies NextConfig);

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;

