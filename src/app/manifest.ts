import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barangay Poblacion North Online Services",
    short_name: "Poblacion North",
    description: "Official online services portal of Barangay Poblacion North, Polanco.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4c1d95",
    lang: "en-PH",
  };
}
