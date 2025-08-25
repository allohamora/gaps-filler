// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import beautifulSort from 'eslint-plugin-beautiful-sort';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  { ignores: ['node_modules', 'dist'] },
  {
    files: ['**/*.ts'],
    languageOptions: { globals: { ...globals.node }, parserOptions: { project: true } },
    plugins: {
      'beautiful-sort': beautifulSort,
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      'object-shorthand': 'warn',
      'no-async-promise-executor': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-deprecated': 'error',
      'beautiful-sort/import': [
        'error',
        {
          special: ['./mocks/index.js', '/config.service.mock.js$/', '/setup-.+-context.js$/'],
          order: ['special', 'namespace', 'default', 'defaultObj', 'obj', 'none'],
        },
      ],
      'no-relative-import-paths/no-relative-import-paths': ['error', { allowSameFolder: true, allowedDepth: 1 }],
    },
  },
);
