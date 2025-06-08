import bundle from './helpers/bundle.js';

const startAt = Date.now();

await bundle();

console.info(`Bundle finished in: ${Date.now() - startAt}ms`);
