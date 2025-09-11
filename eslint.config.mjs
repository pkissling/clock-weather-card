import { includeIgnoreFile } from '@eslint/compat'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      'eslint.config.mjs'
    ],
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': ts,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      semi: ['error', 'never'],
      'simple-import-sort/imports': 'error',
      'no-restricted-imports': [
        'error',
        { patterns: ['.*'] },
      ],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      'no-console': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-spacing': ['error', { before: false, after: true }],
    },
  },
  {
    files: ['e2e/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off'
    }
  }
]
