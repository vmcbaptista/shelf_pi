var http = require("http"),
    request = require('request'),
    fs = require('fs'),
    async = require('async');


var serviceRootUrl = 'http://localhost:8686';

http.createServer(function (req, res) {
    console.log('New incoming client request...');

    if (req.url == '/log') {
        async.series([						                        //#A
                function (callback) {
                    request({url: serviceRootUrl + '/temperature', json: true}, function (err, res, body) {
                        if (err) callback(err);
                        if (res.statusCode == 200) {
                            console.log(body);
                            var temp = body.temperature;
                            callback(null, temp);                   //#B
                        }
                    });
                },
                function (callback) {
                    request({url: serviceRootUrl + '/light', json: true}, function (err, res, body) {
                        if (err) callback(err);
                        if (res.statusCode == 200) {
                            console.log(body);
                            var light = body.light;
                            callback(null, light);
                        }
                    });
                }],
            function (err, results) {			                    //#C
                console.log(results);				                //#D
                var logEntry = 'Temperature: ' + results[0] + ' Light: ' + results[1];
                fs.appendFile('log.txt', logEntry + ' - ', encoding = 'utf8', function (err) {
                    if (err) throw err;
                    res.writeHeader(200, {"Content-Type": "text/plain"});
                    res.write(logEntry);
                    res.end();
                });
            });

    } else {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write('Please use /log');
        res.end();
    }

}).listen(8787);