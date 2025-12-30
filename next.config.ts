import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.bigweb.co.jp",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "files.hareruyamtg.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "mtg-jp.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
