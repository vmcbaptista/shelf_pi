/**
 * Created by fcl-93 on 06-05-2017.
 */
var httpServer = require('../../servers/http'),
    wsServer = require('../../servers/websockets'),
    http = require("http"),
    os = require("os"),
    resources = require('../../resources/model');

// Register Device
exports.registerDevice = function(device_configs){
    var post_data = {
        "device_name": os.hostname()
    };
    var options = {
        host: device_configs.server.ip,
        port: device_configs.server.port,
        path: '/api/device',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    var post_req = http.request(options, function(res) {        // Set up the request
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log(chunk);
            var result  = JSON.parse(chunk);
            device_configs.id = result.id;
        });
    });
    post_req.write(JSON.stringify(post_data));
    post_req.end();
};

exports.webSocketServer = function(device_configs){
    var server = httpServer.listen(device_configs.socketport, function () {
        console.log('HTTP server started...');
        wsServer.listen(server);
        console.info('Running on port %s', device_configs.socketport);
    });
    return server;
};