export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  ignoreFiles: ['**/.nuxt/**', '**/.output/**', '**/dist/**', 'prototype/**'],
  rules: {
    'rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,
    'no-descending-specificity': null,
    // Vue scoped CSS turns `:global(a) .b` into a bare global `a`, silently dropping `.b`.
    'selector-disallowed-list': [
      [/:global\(/],
      { message: 'Use a plain ancestor selector (`a:hover .b`) — :global() drops the rest of the selector' },
    ],
  },
};
