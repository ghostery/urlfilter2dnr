import build from './helpers/build.js';

const startAt = Date.now();

await build();

console.info(`Build finished in: ${Date.now() - startAt}ms`);
