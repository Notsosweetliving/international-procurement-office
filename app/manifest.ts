import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "International Procurement Office",
    short_name: "IPO",
    description:
      "Global procurement intelligence for public-sector opportunities.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ed",
    theme_color: "#0c2335",
    icons: [
      {
        src: "/ipo-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/ipo-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
