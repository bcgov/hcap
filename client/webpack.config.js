const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Entry point for your app
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // Output bundle
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Transpile JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Use Babel to transpile JS/JSX
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/, // Handle CSS imports
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Handle image assets
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // Resolve JS and JSX files
    fallback: {
      querystring: require.resolve('querystring-es3'), // Polyfill fallback for querystring
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Path to your HTML template
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000, // Port for the dev server
  },
  mode: 'development', // Set mode to development for development environment
};
