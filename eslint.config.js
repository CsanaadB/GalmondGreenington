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
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      custom: { rules: { 'no-line-comments': noLineComments } },
    },
    rules: {
      'no-console': 'warn',
      'custom/no-line-comments': 'warn',
    },
  },
];
