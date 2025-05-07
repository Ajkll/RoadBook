/* eslint-env node */
export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      // Define globals here instead of using "env"
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // Node.js globals
        process: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    // Remove the "env" or "environments" property completely
    
    // Settings for plugins
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
    // Rules
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Handle specific files with different configs
  {
    files: ['.eslintrc.js', '.prettierrc.js', 'jest.config.js', '*.config.js', '*.config.cjs'],
    languageOptions: {
      sourceType: 'script', // Important for CommonJS
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    // Remove "env" or "environments" property here too
    
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['*.config.js', '.*.js', '*.config.cjs', '.*.cjs'],
    // Remove "env" or "environments" property here
    // Instead add globals if needed
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
];