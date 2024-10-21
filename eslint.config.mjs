import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier/recommended';
import parserBabel from '@babel/eslint-parser';

export default [
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        Bun: 'readonly',
      },
      parser: parserBabel,
      parserOptions: {
        ecmaVersion: 'latest',
        requireConfigFile: false,
        babelOptions: {
          plugins: ['@babel/plugin-syntax-import-assertions'],
        },
      },
    },
  },
  pluginJs.configs.recommended,
  pluginPrettier,
];
