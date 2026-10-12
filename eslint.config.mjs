import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', 'prototype/**', 'app/**', 'admin/**', 'ui/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
);
