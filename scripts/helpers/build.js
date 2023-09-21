import fs from "node:fs";
import path from "node:path";

import { SOURCE_PATH, DIST_PATH } from "./paths.js";

export default async function build() {
  fs.rmSync(DIST_PATH, { recursive: true, force: true });
  fs.mkdirSync(DIST_PATH);
  fs.copyFileSync(
    path.join(SOURCE_PATH, "index.html"),
    path.join(DIST_PATH, "index.html")
  );

  const result = await Bun.build({
    entrypoints: [path.join(SOURCE_PATH, "index.js")],
    outdir: DIST_PATH,
    target: "browser",
    minify: true,
    sourcemap: "external",
  });

  if (!result.success) {
    console.error("Build failed");
    for (const message of result.logs) {
      // Bun will pretty print the message object
      console.error(message);
    }
    throw new Error(result.logs.join('\n'));
  }
}

