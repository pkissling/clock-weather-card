import { includeIgnoreFile } from '@eslint/compat'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import lit from 'eslint-plugin-lit'
import wc from 'eslint-plugin-wc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),

  // Base TypeScript settings for all TS files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      // Use identifiers (objects) instead of string keys
      ts,
      simpleImportSort,
      lit,
      wc,
    },
    rules: {
      // TypeScript rules
      'ts/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      'ts/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'ts/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' }],

      // Style
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'newline-per-chained-call': ['error', { ignoreChainWithDepth: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-spacing': ['error', { before: false, after: true }],

      // Import sorting
      'simpleImportSort/imports': 'error',
      'simpleImportSort/exports': 'error',

      // Project conventions
      'no-console': 'error',

      // Prefer alias over deep relative ups, allow same-folder './'
      'no-restricted-imports': [
        'error',
        { patterns: ['../*', '../../*', '../../../*'] },
      ],

      // Lit / Web Components
      'wc/no-typos': 'error',
      'wc/no-constructor-attributes': 'error',
      'lit/no-legacy-imports': 'error',
      'lit/prefer-static-styles': 'warn',
      'lit/no-invalid-html': 'warn',
      'lit/no-duplicate-template-bindings': 'error',
    },
  },

  {
    files: ['e2e/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },

  {
    files: ['test/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]
