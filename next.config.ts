import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fesamedcare.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com', // Añadir este dominio
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
