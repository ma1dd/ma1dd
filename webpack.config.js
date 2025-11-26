// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production'

	return {
		entry: './src/index.js', // Точка входа
		output: {
			path: path.resolve(__dirname, 'build'), // Папка для выходных файлов
			filename: 'bundle.js', // Имя выходного файла
			publicPath: isProduction ? '/ma1dd/' : '/', // Для GitHub Pages используем /ma1dd/
		},
		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-react'],
						},
					},
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader'],
				},
			],
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: './public/index.html', // Путь к шаблону index.html
				filename: 'index.html', // Имя выходного файла в dist
				inject: 'body', // Вставлять скрипт в body
			}),
			new CopyWebpackPlugin({
				patterns: [
					{ from: 'public/data', to: 'data' },
					{ from: 'public/.nojekyll', to: '.nojekyll', toType: 'file' },
				],
			}),
		],
		resolve: {
			extensions: ['.js', '.jsx'], // Позволяет импортировать без указания расширения
		},
		devServer: {
			static: [
				{
					directory: path.join(__dirname, 'dist'),
				},
				{
					directory: path.join(__dirname, 'public'),
					publicPath: '/',
				},
			],
			compress: true,
			port: 8080,
			open: true,
			historyApiFallback: true, // Очень важно для React Router и SPA!
		},
		mode: argv.mode || 'development',
	}
}
