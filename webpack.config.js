import path from 'node:path';
import { fileURLToPath } from 'node:url';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? '[name].[contenthash:8].js' : 'main.js',
      // 配信先のパスに依存しないよう相対参照にする
      publicPath: './',
      clean: true,
    },
    devtool: isProd ? 'source-map' : 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        title: 'カロリーコーチ',
      }),
      // manifest・アイコン・Service Worker は webpack で加工せずそのまま配る
      new CopyWebpackPlugin({
        patterns: [{ from: 'public', to: '.' }],
      }),
    ],
    devServer: {
      static: { directory: path.resolve(__dirname, 'dist') },
      port: 8080,
      hot: true,
    },
  };
};
