import tseslint from 'typescript-eslint';

const noLineComments = {
  create(context) {
    for (const comment of context.sourceCode.getAllComments()) {
      if (comment.type === 'Line'
        && !comment.value.trim().startsWith('@ts-')) {
        context.report({ loc: comment.loc, message: 'Unexpected line comment' });
      }
    }
    return {};
  },
};

export default [
  {
    ignores: ['.worktrees/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      custom: { rules: { 'no-line-comments': noLineComments } },
    },
    rules: {
      'no-console': 'warn',
      'custom/no-line-comments': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'eqeqeq': 'error',
      'no-var': 'error',
      'curly': 'error',
    },
  },
];
