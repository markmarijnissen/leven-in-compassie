var webpack = require("webpack");
var path = require("path");

var argv = require('optimist')
            .alias('m','minify')
            .argv;

var version = require(path.resolve(__dirname,'package.json')).version;

var config = {
    context: path.join(__dirname,'src'),
    entry: "./main.js",
    output: {
        path: __dirname,
        filename: "public/bundle.js", 
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
            { test: /\.css$/,    loader: "style-loader!css-loader!autoprefixer-loader?browsers=last 3 version" },
            { test: /\.less$/,   loader: "style-loader!css-loader!autoprefixer-loader?browsers=last 3 version!less-loader" },
            { test: /\.jade$/,   loader: "jade-loader?self" },
            { test: /\.png$/,    loader: "url-loader?name=public/bundle/[hash].[ext]&limit=5000" },
            { test: /\.jpg$/,    loader: "url-loader?name=public/bundle/[hash].[ext]&limit=5000" },
            { test: /\.gif$/,    loader: "url-loader?name=public/bundle/[hash].[ext]&limit=5000" },
            { test: /\.woff$/,   loader: "url-loader?name=public/bundle/[hash].[ext]&limit=5000" },
            { test: /\.eot$/,    loader: "file-loader?name=public/bundle/[hash].[ext]" },
            { test: /\.ttf$/,    loader: "file-loader?name=public/bundle/[hash].[ext]" },
            { test: /\.svg$/,    loader: "file-loader?name=public/bundle/[hash].[ext]" },
        ]
    },
    plugins:[
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(version),
        ENV: JSON.stringify(argv.minify? 'production':'dev')
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
  delete config.devtool;
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