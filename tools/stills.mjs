// Renders a handful of frames from one composition as JPEGs for review (bundles once).
//   node tools/stills.mjs atlas-peak-539843 20,90,250,590,800 out/stills
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [id, framesArg = "20,90,250,450,590,680,800,870", outDir = "out/stills"] = process.argv.slice(2);
if (!id) throw new Error("usage: node tools/stills.mjs <composition-id> [f1,f2,...] [outDir]");
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
for (const frame of framesArg.split(",").map(Number)) {
  const output = path.join(outDir, `${id}-${String(frame).padStart(3, "0")}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: "jpeg", jpegQuality: 85 });
  console.log(output);
}
