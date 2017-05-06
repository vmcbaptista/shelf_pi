/**
 * Created by vmcb on 12-04-2017.
 */
var resources = require('./../../resources/model');
var configs = require('./../../configs/configs');
var weightPlugin = require('./../../plugins/internal/weightPlugin');
var beaconsPlugin = require('./../../plugins/internal/beaconsPlugin');

var interval, sensor;
var model = resources.pi.sensors.luminosity;
var pluginName = resources.pi.sensors.luminosity.name;

var doorOpened = false;

SerialPort = require("serialport");

var portLight = new SerialPort("/dev/ttyACM0", {
    baudRate: 9600
});

exports.start = function (params) { //#A
    portLight.on("open", function () {
        portLight.on('data', function (data) {
            if (parseInt(data)) {
                model.value = parseInt(data);
                postLuminosityData();
                //showValue();
            }
            if (String(data).match(/.*Opened.*/g)) {
                weightPlugin.start(); // When door is open start weight measure.
            }
            if (String(data).match(/.*Closed.*/g)) {
                if(weightPlugin.reading) {
                    weightPlugin.stop(); // When door is CLOSED stop weight measure.
                }
                if(beaconsPlugin.reading) {
                    beaconsPlugin.stop();
                }
            }
        });
    });
};

exports.stop = function () { //#A
    portLight.close();
};

function showValue() {
    console.info(model.value ? 'there is luminosity data!' : 'not anymore!');
}

function postLuminosityData() {

    var post_data = {
        "device_id": resources.pi.id,
        "timestamp": Date.now()/1000,
        "luminosity": model.value
    };

    var options = {
        host: configs.server.ip,
        port: configs.server.port,
        path: '/api/sensors/luminosity',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    // Set up the request
    var post_req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });
    // post the data
    //console.log(JSON.stringify(post_data));
    post_req.write(JSON.stringify(post_data));
    post_req.end();
}

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.
