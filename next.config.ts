import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.e2b.app', 'localhost', '127.0.0.1'],
  experimental: { serverActions: { allowedOrigins: ['*.e2b.app'] } },
};
export default nextConfig;
