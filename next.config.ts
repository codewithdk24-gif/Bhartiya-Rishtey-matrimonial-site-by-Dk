import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow external images (Cloudinary, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Suppress hydration warnings for development
  reactStrictMode: true,
  // @ts-ignore - allowedDevOrigins is required for network dev access but might not be in the base NextConfig type yet
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000'],
};

export default nextConfig;
