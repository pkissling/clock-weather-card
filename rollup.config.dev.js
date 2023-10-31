import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import { babel } from '@rollup/plugin-babel'
import serve from 'rollup-plugin-serve'
import { terser } from 'rollup-plugin-terser'
import json from '@rollup/plugin-json'
import image from '@rollup/plugin-image'

export default {
  input: ['src/clock-weather-card.ts'],
  output: {
    dir: './dist',
    format: 'es',
  },
  plugins: [
    image(),
    nodeResolve(),
    typescript(),
    json(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled'
    }),
    terser(),
    serve({
      contentBase: './dist',
      host: '0.0.0.0',
      port: 5001,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),
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
};
