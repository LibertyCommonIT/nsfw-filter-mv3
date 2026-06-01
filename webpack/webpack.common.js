const path = require('path')
const glob = require('glob')
const CopyPlugin = require('copy-webpack-plugin')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin')

const PATHS = {
    src: path.join(__dirname, '../src'),
    dist: path.join(__dirname, '../dist/src')
}

module.exports = {
    entry: {
        content: `${PATHS.src}/content/content.ts`,
        background: `${PATHS.src}/background/background.ts`,
        offscreen: `${PATHS.src}/offscreen/offscreen.ts`,
        popup: `${PATHS.src}/popup/index.tsx`,
    },
    output: {
        path: PATHS.dist,
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(eot|png|svg|[ot]tf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource'
            },
            {
                test: /\.css$/,
                use: [
                    MiniCSSExtractPlugin.loader,
                    "css-loader"
                ]
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: `${PATHS.src}/popup/popup.html`, to: PATHS.dist },
                { from: `${PATHS.src}/offscreen/offscreen.html`, to: PATHS.dist },
                { from: './config.json', to: PATHS.dist },
            ],
        }),
        new AntdDayjsWebpackPlugin(),
        new MiniCSSExtractPlugin({
            filename: "[name].css",
        }),
        new PurgeCSSPlugin({
            paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true }),
        }),
    ],
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
        mainFields: ["browser", "module", "main"],
        alias: {
            nsfwjs$: path.resolve(__dirname, '../node_modules/nsfwjs/dist/esm/index.js')
        }
    },
    ignoreWarnings: [
        {
            module: /[\\/]node_modules[\\/]nsfwjs[\\/]/,
            message: /Critical dependency: the request of a dependency is an expression/
        }
    ]
}
