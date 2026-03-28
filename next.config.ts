import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fesamedcare-files.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'fesamedcare.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'mymodelsbcuker.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
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
  transpilePackages: ['isomorphic-dompurify'],
};

export default nextConfig;
