import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 👇 Solo lo que es experimental va aquí
  experimental: {
    optimizeCss: true,
  },

  // 👇 Esto es de nivel superior (no dentro de experimental)
  optimizeFonts: true,
};

export default nextConfig;
