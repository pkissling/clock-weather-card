import typescript from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import image from '@rollup/plugin-image'
import gzipPlugin from 'rollup-plugin-gzip'

export default [
  {
    input: 'src/clock-weather-card.ts',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [
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
      gzipPlugin()
    ],
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('/luxon/')) {
        // https://github.com/moment/luxon/issues/193
        return;
      } else if (warning.code === 'THIS_IS_UNDEFINED' && warning.id.includes('@formatjs')) {
        // https://github.com/custom-cards/custom-card-helpers/issues/64
        return
      }
      warn(warning);
    },
  },
];
