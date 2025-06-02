export default {
  exports: {
    './package.json': './package.json',
    '.': './src/index.ts',
  },
  esbuild: {
    format: 'esm',
    target: 'es2020',
    platform: 'node',
  },
};
