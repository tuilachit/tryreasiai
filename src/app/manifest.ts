import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reasi",
    short_name: "Reasi",
    theme_color: "#0a0a0a",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
  };
}
