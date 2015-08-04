var webpack = require("webpack");
var path = require("path");

var argv = require('optimist')
            .alias('m','minify')
            .argv;

var version = require(path.resolve(__dirname,'package.json')).version;

var config = {
    context: path.join(__dirname,'src'),
    entry: {
        "main":"./main.js",
        "reveal":"./revealjs/index.js"
    },
    output: {
        path: path.join(__dirname,'public'),
        filename: "[name]-bundle.js"
    },
    resolve: {
        alias: {
            'Promise':path.resolve('node_modules','promiscuous')
        }
    },
    devtool: 'eval',
    module: {
        loaders: [
            { test: /\.json$/,   loader: "json-loader" },
            { test: /\.css$/,    loader: "style-loader!css-loader" },
            { test: /\.less$/,   loader: "style-loader!css-loader!less-loader" },
            { test: /\.jade$/,   loader: "jade-loader?self" },
            { test: /\.png$/,    loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.jpg$/,    loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.gif$/,    loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.woff$/,   loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.woff2$/,   loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.eot$/,   loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.otf$/,   loader: "url-loader?name=/bundle/[hash].[ext]&limit=5000" },
            { test: /\.ttf$/,    loader: "file-loader?name=/bundle/[hash].[ext]" },
            { test: /\.svg$/,    loader: "file-loader?name=/bundle/[hash].[ext]" },
        ]
    },
    plugins:[
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(version),
        ENV: JSON.stringify(argv.minify? 'production':'dev'),
        API_KEY: JSON.stringify(argv.minify? 'zhMz3IMtrC':'test-rxcWA1HIZM'),
      })
    ],
    node: {
      fs: "empty"
    }
};

/**
 * Enable minification
 */
if(argv.minify){
  config.devtool = 'source-map';
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    mangle:true,
    compress:{
      drop_console:true
    },
    output: {
      comments: false
    }
  }));
}

module.exports = config;