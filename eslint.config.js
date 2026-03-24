import js from '@eslint/js';
import tseslint from 'typescript-eslint';

import globals from 'globals';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginPrettier,
  {
    files: ['./{scripts,src,test}/**/*.{js,ts}', './*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ['./src/page/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    ignores: ['node_modules', '.tshy', '.tsimp', 'dist', 'page'],
  },
];
