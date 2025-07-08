import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  entries: [
    {
      input: "src",
      outDir: "dist",
      ext: "mjs",
      name: "edge-scraper",
      builder: "mkdist"
    }
  ]
});