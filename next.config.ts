import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "api.mapbox.com" },
      { protocol: "https", hostname: "*.mapbox.com" },
    ],
  },
};

export default nextConfig;
