import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

import { SOURCE_PATH, DIST_PATH, ROOT_PATH } from './paths.js';

function logBuildError(result) {
  if (!result.errors.length) {
    return;
  }
  console.error('Build failed');
  for (const error of result.errors) {
    console.error(error);
  }
  throw new Error(result.errors.map((e) => e.text).join('\n'));
}

export default async function build({ debug = false } = {}) {
  fs.rmSync(DIST_PATH, { recursive: true, force: true });
  fs.mkdirSync(DIST_PATH, { recursive: true });
  fs.copyFileSync(
    path.join(SOURCE_PATH, 'page', 'index.html'),
    path.join(DIST_PATH, 'index.html'),
  );

  // Copy re2.wasm to the output directory
  fs.copyFileSync(
    path.join(ROOT_PATH, 'node_modules', '@adguard', 're2-wasm', 'build', 'wasm', 're2.wasm'),
    path.join(DIST_PATH, 're2.wasm'),
  );

  // Copy re2.js to the output directory
  fs.copyFileSync(
    path.join(ROOT_PATH, 'node_modules', '@adguard', 're2-wasm', 'build', 'wasm', 're2.js'),
    path.join(DIST_PATH, 're2.js'),
  );

  const result = await esbuild.build({
    entryPoints: [path.join(SOURCE_PATH, 'page', 'index.js')],
    outdir: DIST_PATH,
    bundle: true,
    minify: !debug,
    sourcemap: debug ? 'inline' : 'external',
    format: 'esm',
    target: ['es2020'],
    platform: 'browser',
    external: ['fs', 'path'],
  });

  logBuildError(result);
}
