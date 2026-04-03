import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.rewe.de" },
      { hostname: "www.rewe.de" },
    ],
  },
};

export default nextConfig;
