module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    // ✅ 실용적인 규칙 설정 (NestJS-friendly)
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    'prettier/prettier': ['warn', { singleQuote: true, semi: true }],
  },
};