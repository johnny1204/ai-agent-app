import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'development') {
  import('@cloudflare/next-on-pages/next-dev').then(({ setupDevPlatform }) => {
    setupDevPlatform();
  });
}

const nextConfig: NextConfig = {
  output: 'export',
  distDir: '../app/study-assistant',
  basePath: '/study-assistant',
  /* config options here */
};

export default nextConfig;
