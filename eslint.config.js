import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
  },
  pluginJs.configs.recommended,
  pluginPrettier,
  {
    ignores: ['node_modules/*', 'dist/*'],
  },
];
