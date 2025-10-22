import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore: propiedades experimentales no tipadas aún
  experimental: {
    optimizeCss: true,
    optimizeFonts: true,
  },
};

export default nextConfig;
