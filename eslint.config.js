import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  pluginJs.configs.recommended,
  pluginPrettier,
  {
    files: ['./{scripts,src,test}/**/*.js', './*.js'],
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
  {
    files: ['./src/page/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
  },
];
