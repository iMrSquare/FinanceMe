import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: ['10.9.94.14', '10.9.94.15'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/hogar/registros', destination: '/hogar/modulos/registros', permanent: true },
      { source: '/hogar/ahorro', destination: '/hogar/modulos/ahorro', permanent: true },
      { source: '/personal/ahorro', destination: '/personal/modulos/ahorro', permanent: true },
      { source: '/personal/suscripciones', destination: '/personal/modulos/recurrentes', permanent: true },
    ];
  },
};

export default nextConfig;
