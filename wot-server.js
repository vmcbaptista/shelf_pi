// Final version
var httpServer = require('./servers/http'),
  wsServer = require('./servers/websockets'),
  resources = require('./resources/model'),
  http = require("http"),
  os = require("os"),
  // We need this to build our post string
  querystring = require('querystring');

// Register Device

var post_data = {
    "device_name": os.hostname()
};

var options = {
    host: '1.1.1.239',
    port: '8000',
    path: '/api/device',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
};

// Set up the request
var post_req = http.request(options, function(res) {
    res.setEncoding('utf8');

    var str;
    //another chunk of data has been received, so append it to `str`
    res.on('data', function (chunk) {
        var result  = JSON.parse(chunk);
        resources.pi.id = result.id;
    });
});

// post the data
post_req.write(querystring.stringify(post_data));
post_req.end();


// Internal Plugins
var luminosityPlugin = require('./plugins/internal/luminosityPlugin'); //#A
var beaconsPlugin = require('./plugins/internal/beaconsPlugin'); //#A
var weightPlugin = require('./plugins/internal/weightPlugin'); //#A

luminosityPlugin.start();
/*
// Internal Plugins
var ledsPlugin = require('./plugins/internal/ledsPlugin'), //#A
  pirPlugin = require('./plugins/internal/pirPlugin'), //#A
  dhtPlugin = require('./plugins/internal/DHT22SensorPlugin'); //#A

// Internal Plugins for sensors/actuators connected to the PI GPIOs
// If you test this with real sensors do not forget to set simulate to 'false'
pirPlugin.start({'simulate': true, 'frequency': 2000}); //#B
ledsPlugin.start({'simulate': true, 'frequency': 10000}); //#B
dhtPlugin.start({'simulate': true, 'frequency': 10000}); //#B
*/
// External Plugins
//var coapPlugin = require('./plugins/external/coapPlugin');
//coapPlugin.start({'simulate': true, 'frequency': 10000});

// HTTP Server
var server = httpServer.listen(resources.pi.port, function () {
  console.log('HTTP server started...');

  // Websockets server
  wsServer.listen(server);

  console.info('Your WoT Pi is up and running on port %s', resources.pi.port);
});
//#A Require all the sensor plugins you need
//#B Start them with a parameter object; here you start them on a laptop so you activate the simulation function



/*
 // Initial version:
 var httpServer = require('./servers/http'), //#A
 resources = require('./resources/model');

 var server = httpServer.listen(resources.pi.port, function () { //#B
  console.info('Your WoT Pi is up and running on port %s', resources.pi.port); //#C
 });

 //#A Load the http server and the model
 //#B Start the HTTP server by invoking listen() on the Express application
 //#C Once the server is started the callback is invoked
 */

