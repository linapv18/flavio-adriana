import type { NextConfig } from "next";

import { readdirSync } from "node:fs";

// Folders in public/ hold photos, video and music: let browsers cache them.
const publicFolders = readdirSync("public", { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);

const nextConfig: NextConfig = {
  async headers() {
    const assets = publicFolders.join("|");
    return [
      { source: "/:path*", headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ] },
      { source: assets ? `/:path((?!(?:${assets})/).*)` : "/:path*", headers: [
        { key: "Cache-Control", value: "private, no-store" },
      ] },
      ...publicFolders.map(folder => ({ source: `/${folder}/:path*`, headers: [
        { key: "Cache-Control", value: "public, max-age=86400" },
      ] })),
    ];
  },
};

export default nextConfig;
