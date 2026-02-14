/** @type {import('next').NextConfig} */
const nextConfig = {
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
