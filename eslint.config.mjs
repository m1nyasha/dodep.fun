import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', 'prototype/**', 'app/**', 'admin/**', 'ui/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: { process: 'readonly', console: 'readonly' } } },
  prettier,
  {
    // NestJS modules/controllers are classes whose only purpose is the decorator.
    rules: { '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }] },
  },
);
