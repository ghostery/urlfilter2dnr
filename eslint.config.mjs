import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        Bun: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
  },
  pluginJs.configs.recommended,
  pluginPrettier,
];
