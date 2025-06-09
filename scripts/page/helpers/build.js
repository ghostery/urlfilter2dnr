import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

import { SOURCE_PATH, DIST_PATH } from './paths.js';

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

  const result = await esbuild.build({
    entryPoints: [path.join(SOURCE_PATH, 'page', 'index.js')],
    outdir: DIST_PATH,
    bundle: true,
    minify: !debug,
    sourcemap: debug ? 'inline' : 'external',
    format: 'esm',
    target: ['es2020'],
    platform: 'browser',
  });

  logBuildError(result);
}
