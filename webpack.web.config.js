const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const webpack = require('webpack');

var path = require('path');

module.exports = {
	watch: false,
	target: 'web',
	mode: 'production',
	//devtool: 'inline-source-map',
	entry: {
		app: './src/components/app.tsx',	
	},
	output: {
		path: path.resolve(__dirname, 'build'),
		clean: true,
		filename: '[name].[contenthash].js',
		sourceMapFilename: '[name].js.map'
	},
	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: [".ts", ".tsx", ".js", ".jsx"]
	},
	module: {
		rules: [
			// all files with a `.ts`, `.tsx`, `.js`, or `.jsx` extension will be handled by `ts-loader`
			{ test: /\.[tj]sx?$/, loader: "ts-loader" },
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource'
			 },
			 {
				test: /\.(png|jpe?g|gif)$/i,
				type: 'asset/resource'
			 }
		]
	},
	plugins: [
		new NodePolyfillPlugin(),
		new webpack.DefinePlugin({
			'process.env.YOUTUBE_API_KEY': JSON.stringify(process.env.YOUTUBE_API_KEY || '')
		}),
		new HtmlWebpackPlugin({
			template: './index.html'
		}),
		new CopyPlugin({
			patterns: [
				{ from: './css', to: 'css' },
				{ from: './lib', to: 'lib' },
				{ from: './images', to: 'images' },
				{ from: './LICENSE', to: 'LICENSE', toType: 'file' }
			]
		})
	]
};