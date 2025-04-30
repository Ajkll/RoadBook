/* eslint-env node */
export default {
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
  overrides: [
    {
      files: ['**/*.config.js', '**/.eslintrc.js', '**/.prettierrc.js'],
      env: {
        node: true,
      },
    },
  ],
};
