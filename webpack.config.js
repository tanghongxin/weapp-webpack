const path = require('path')
const { resolve } = path
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WxRuntimeChunk = require('./build/plugins/wxRuntimeChunk')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { getEntries } = require('./build/utils/getEntries')
const TerserPlugin = require('terser-webpack-plugin')
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin")
const webpack = require('webpack')

const { NODE_ENV } = process.env
const IS_PROD = NODE_ENV === 'production'
const SRC_DIR = resolve(__dirname, 'src')

const config = {
  context: SRC_DIR,
  mode: NODE_ENV,
  watch: !IS_PROD,
  watchOptions: {
    aggregateTimeout: 500,
    ignored: ['**/node_modules', '**/json'],
    poll: 1000,
  },
  stats: {
    errorDetails: true,
    errorStack: false
  },
  entry: getEntries(SRC_DIR, { app: './app.ts' }),
  output: {
    path: resolve(__dirname, 'dist'),
    globalObject: 'wx',
    clean: {
      keep: /miniprogram_npm/,
    },
    publicPath: '',
  },
  resolve: {
    alias: {
      '@': SRC_DIR,
    },
    extensions: ['.ts', '.js', '.json'],
  },
  resolveLoader: {
    modules: ['node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          'ts-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.less$/,
        include: /src/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].wxss',
              context: resolve('src')
            },
          },
          'postcss-loader',
          'less-loader',
        ],
      },
      {
        test: /\.wxss$/,
        include: /src/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].wxss',
              context: resolve('src')
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|png|webp|gif)$/,
        type: 'asset',
        generator: {
          filename: 'assets/[name].[ext]'
        },
        parser: {
          dataUrlCondition: {
            maxSize: 100 * 1024
          }
        }
      }
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '**/*',
          to: '',
          globOptions: {
            ignore: [
              '**/*.ts',
              '**/*.js',
              '**/*.less',
            ],
          },
        },
      ],
    }),
    new WxRuntimeChunk(),
    ...IS_PROD ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: path.resolve(__dirname, 'report.html'),
        openAnalyzer: false,
      })
    ] : [],
  ],
  optimization: {
    ...IS_PROD ? {
      minimize: true,
      minimizer: [
        new JsonMinimizerPlugin(),
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
            output: {
              comments: false,
            },
          },
        }),
      ],
    } : {},
    // tree shaking
    usedExports: true,
    // runtime code
    runtimeChunk: {
      name: 'runtime',
    },
    // code splitting
    splitChunks: {
      chunks: 'all',
      name: 'common',
    },
  },
  devtool: IS_PROD ? false : 'source-map',
  cache: {
    type: 'filesystem'
  }
}

module.exports = config
