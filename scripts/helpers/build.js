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

  await Bun.build({
    entrypoints: [path.join(SOURCE_PATH, "index.js")],
    outdir: DIST_PATH,
    target: "browser",
  });
}

