import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.rewe.de" },
      { hostname: "www.rewe.de" },
    ],
  },
  // Disable static prerendering for pages that use Supabase
  output: undefined,
};

export default nextConfig;
