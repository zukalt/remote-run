const http = require('http')
    , fs = require('fs')
    , YAML = require('yamljs')
    , URL = require('url')
    , serveStatic = require('serve-static')
    , finalhandler = require('finalhandler')
    , exec = require('child_process').exec;

//
// Read yaml configuration
//
var config = {host: '127.0.0.1', port: 5000};
var cfgFile = __dirname + '/remote-run.yaml';
if (fs.existsSync(cfgFile)) {
    config = YAML.parse(fs.readFileSync(cfgFile, 'utf8'))
}
console.log("running with config: ", config);
//
// Run http server
//

// this is for static files (optional)
var serve = serveStatic(__dirname);

const server = http.createServer(function(req, res) {
        const url = URL.parse(req.url, true);

        // redirect / => /static/index.html
        if (url.pathname == '/') {
            res.writeHead(302, {'Location': '/static/index.html'});
            res.end();
        }
        // static files serving
        else if (url.pathname.startsWith('/static/')) {
            var done = finalhandler(req, res);
            serve(req, res, done);
        }
        // Running commands
        else if (url.pathname.startsWith('/run/')) {
            var cmd = url.pathname.substr(5);
            var run = config.cmd[cmd].join(' ');
            for (var p in url.query) {
                run = run.replace('{'+p+'}', url.query[p]);
            }
            exec(run, {cwd: __dirname}, function(error, stdout, stderr) {
                if (error) {
                    // console.log('stderr:', stderr);
                    // console.log('stdout: ', stdout);
                    res.writeHead(500, error);
                    res.end();
                    console.log(error, stdout, stderr);
                    return;
                }
                res.end(stdout);
            });

            console.log(run);

        }
        
});

server.on('clientError', function (err, socket) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(config.port, config.host);