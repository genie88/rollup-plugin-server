import { readFile } from 'fs'
import { createServer as createHttpsServer } from 'https'
import { createServer } from 'http'
import { resolve } from 'path'

import mime from 'mime'
import opener from 'opener'

export default function serve(options = { contentBase: '' }) {
  if (Array.isArray(options) || typeof options === 'string') {
    options = { contentBase: options }
  }
  options.contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase]
  options.host = options.host || 'localhost'
  options.port = options.port || 10001
  options.headers = options.headers || {}
  options.https = options.https || false
  mime.default_type = 'text/plain'

  const requestListener = (request, response) => {
    // Remove querystring
    const urlPath = decodeURI(request.url.split('?')[0])

    Object.keys(options.headers).forEach((key) => {
      response.setHeader(key, options.headers[key])
    })

    // support cors request
    if (options.allowCrossOrigin) {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Request-Method', '*');
      response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
      response.setHeader('Access-Control-Allow-Headers', '*');

      if (request.method === 'OPTIONS' ) {
        response.writeHead(200);
        response.end();
        return;
      }
    }

    // need proxy 
    if(options.proxy) {
      let match = matchProxy(options.proxy, request)
      proxy.web(request, response, options.proxy[match]);
      return;
    }

    readFileFromContentBase(options.contentBase, urlPath, function (error, content, filePath) {
      if (!error) {
        if (hasRange(request)) {
          return serveWithRanges(request, response, content)
        }
        return found(response, filePath, content)
      }
      if (error.code !== 'ENOENT') {
        response.writeHead(500)
        response.end('500 Internal Server Error' +
          '\n\n' + filePath +
          '\n\n' + Object.keys(error).map(function (k) {
            return error[k]
          }).join('\n') +
          '\n\n(rollup-plugin-serve)', 'utf-8')
        return
      }
      if (request.url === '/favicon.ico') {
        filePath = resolve(__dirname, '../dist/favicon.ico')
        readFile(filePath, function (error, content) {
          if (error) {
            notFound(response, filePath)
          } else {
            found(response, filePath, content)
          }
        })
      } else if (options.historyApiFallback) {
        readFileFromContentBase(options.contentBase, '/index.html', function (error, content, filePath) {
          if (error) {
            notFound(response, filePath)
          } else {
            found(response, filePath, content)
          }
        })
      } else {
        notFound(response, filePath)
      }
    })
  }

  // If HTTPS options are available, create an HTTPS server
  let server
  if (options.https) {
    server = createHttpsServer(options.https, requestListener).listen(options.port)
  } else {
    server = createServer(requestListener).listen(options.port)
  }

  closeServerOnTermination(server)

  var running = options.verbose === false

  return {
    name: 'serve',
    ongenerate() {
      if (!running) {
        running = true

        // Log which url to visit
        const url = (options.https ? 'https' : 'http') + '://' + options.host + ':' + options.port
        options.contentBase.forEach(base => {
          console.log(green(url) + ' -> ' + resolve(base))
        })

        // Open browser
        if (options.open) {
          opener(url)
        }
      }
    }
  }
}

function matchProxy(proxy, request){
  let match = '';
  const url = request.url;
  const urlPath = decodeURI(request.url.split('?')[0]);
  proxy.forEach()
}

function readFileFromContentBase(contentBase, urlPath, callback) {
  let filePath = resolve(contentBase[0] || '.', '.' + urlPath)

  // Load index.html in directories
  if (urlPath.endsWith('/')) {
    filePath = resolve(filePath, 'index.html')
  }

  readFile(filePath, (error, content) => {
    if (error && contentBase.length > 1) {
      // Try to read from next contentBase
      readFileFromContentBase(contentBase.slice(1), urlPath, callback)
    } else {
      // We know enough
      callback(error, content, filePath)
    }
  })
}

function notFound(response, filePath) {
  response.writeHead(404)
  response.end('404 Not Found' +
    '\n\n' + filePath +
    '\n\n(rollup-plugin-serve)', 'utf-8')
}

function found(response, filePath, content) {
  response.writeHead(200, { 'Content-Type': mime.lookup(filePath) })
  response.end(content, 'utf-8')
}

function hasRange(request) {
  var range = request.headers.range || ''
  var parts = range.replace(/bytes=/, "").split("-");
  var partialstart = parts[0];
  var partialend = parts[1];
  return partialstart && partialend
}

function serveWithRanges(request, response, content) {
  var range = request.headers.range;
  var total = content.length;
  var parts = range.replace(/bytes=/, "").split("-");
  var partialstart = parts[0];
  var partialend = parts[1];

  var start = parseInt(partialstart, 10);
  var end = partialend ? parseInt(partialend, 10) : total;
  var chunksize = (end - start);
  response.writeHead(206, {
    "Content-Range": "bytes " + start + "-" + end + "/" + total,
    "Accept-Ranges": "bytes",
    "Content-Length": chunksize
  });
  response.end(content.slice(start, end));
}

function green(text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function closeServerOnTermination(server) {
  const terminationSignals = ['SIGINT', 'SIGTERM']
  terminationSignals.forEach((signal) => {
    process.on(signal, () => {
      server.close()
      process.exit()
    })
  })
}
