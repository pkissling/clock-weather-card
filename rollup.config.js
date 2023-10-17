import typescript from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import json from '@rollup/plugin-json'
import image from '@rollup/plugin-image'
import gzipPlugin from 'rollup-plugin-gzip'
import { sentryRollupPlugin } from "@sentry/rollup-plugin"

export default [
  {
    input: 'src/clock-weather-card.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true
    },
    plugins:  [
      image(),
      nodeResolve(),
      commonjs(),
      typescript(),
      json(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled'
      }),
      terser(),
      gzipPlugin(),
      sentryRollupPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      })
    ]
  },
];
