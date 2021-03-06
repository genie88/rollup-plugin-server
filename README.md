# Rollup plugin to serve the bundle
Adopted from https://github.com/thgh/rollup-plugin-serve
Add cors & range-header supports

## Installation
```
npm install --save-dev rollup-plugin-dev-server
```

## Usage
```js
// rollup.config.js
import serve from 'rollup-plugin-dev-server'

export default {
  input: 'entry.js',
  output: {
    file: 'dist/bundle.js',
    format: ...
  },
  plugins: [
    serve('dist')
  ]
}
```

### Options

By default it serves the current project folder. Change it by passing a string:
```js
serve('public')    // will be used as contentBase

// Default options
serve({
  // Launch in browser (default: false)
  open: true,

  // Show server address in console (default: true)
  verbose: false,

  // Folder to serve files from
  contentBase: '',

  // Multiple folders to serve from
  contentBase: ['dist', 'static'],

  // Set to true to allow cors request
  allowCrossOrigin: false,

  // Set to true to return index.html instead of 404
  historyApiFallback: false,

  // Options used in setting up server
  host: 'localhost',
  port: 10001,

  // By default server will be served over HTTP (https: false). It can optionally be served over HTTPS
  https: {
    key: fs.readFileSync('/path/to/server.key'),
    cert: fs.readFileSync('/path/to/server.crt'),
    ca: fs.readFileSync('/path/to/ca.pem')
  },

  //set headers
  headers: {
    'Access-Control-Allow-Origin': '*',
    foo: 'bar'
  }
})
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Contributing

Contributions and feedback are very welcome.

To get it running:
  1. Clone the project.
  2. `npm install`
  3. `npm run build`

## Credits

- [Genie88](https://github.com/genie88)
- [All Contributors][link-contributors]

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

[link-author]: https://github.com/genie88
[link-contributors]: ../../contributors
[rollup-plugin-serve]: https://www.npmjs.com/package/rollup-plugin-server
