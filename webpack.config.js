const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        library: 'BackgroundFilter',
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, 'dist'),
    },
};