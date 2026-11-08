import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fesamedcare-local-testing.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'fesamedcare.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'fesamedcare-files.s3.amazonaws.com',
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
      // Foto de perfil de las cuentas creadas con Google.
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Storage local compatible con S3 (SeaweedFS en el docker-compose del backend).
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8333',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['isomorphic-dompurify'],
};

export default nextConfig;
