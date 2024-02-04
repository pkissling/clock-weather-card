module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        'standard-with-typescript',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-type-checked'
    ],
    overrides: [
        {
            env: {
                node: true
            },
            files: [
                '.eslintrc.{js,cjs}'
            ],
            parserOptions: {
                sourceType: 'script'
            }
        }
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
        tsconfigRootDir: __dirname,
    },
    rules: {
        '@typescript-eslint/strict-boolean-expressions': 'off'
    },
    root: true
}
