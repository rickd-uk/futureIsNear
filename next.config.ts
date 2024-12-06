import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  serverRuntimeConfig: {
    port: process.env.PORT || 5000,
  },
};

export default nextConfig;
