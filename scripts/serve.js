import { watch } from "node:fs";
import path from "node:path";

import build from "./helpers/build.js";
import { SOURCE_PATH, DIST_PATH } from "./helpers/paths.js";

const PORT = 3000;

await build();

const watcher = watch(SOURCE_PATH, async (event, filename) => {
  console.log(`Detected ${event} in ${filename}`);
  await build();
});

Bun.serve({
  port: PORT,
  development: true,
  async fetch(req) {
    let filePath = new URL(req.url).pathname;
    if (filePath === '/') {
      filePath += 'index.html';
    }
    const file = Bun.file(path.join(DIST_PATH, filePath));
    return new Response(file);
  },
  error() {
    return new Response(null, { status: 404 });
  },
});

console.log(`Starting dev server at port: ${PORT}`);

process.on("SIGINT", () => {
  // close watcher when Ctrl-C is pressed
  console.log("Closing server...");
  watcher.close();

  process.exit(0);
});
