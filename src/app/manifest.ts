import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "saludlog",
    short_name: "saludlog",
    description: "Registro personal de salud",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0c110c",
    theme_color: "#0c110c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
