import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  external: [
    /^@babel.*/,
    /^@date-io\/.*/,
    /^@material-ui\/.*/,
    /^@openimis.*/,
    'classnames',
    'clsx',
    'history',
    /^lodash.*/,
    'moment',
    'prop-types',
    /^react.*/,
    /^redux.*/,
    'recharts',
    'react-grid-layout',
    'xlsx',
    'file-saver',
  ],
  plugins: [
    json(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      extensions: ['.js', '.jsx'],
      presets: [
        ['@babel/preset-env', { modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        ['@babel/plugin-transform-runtime', { useESModules: true }]
      ]
    }),
  ],
};
