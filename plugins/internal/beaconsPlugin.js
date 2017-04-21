/**
 * Created by vmcb on 12-04-2017.
 */
var resources = require('./../../resources/model');
var Bleacon = require('bleacon');
var http = require('http');
// We need this to build our post string
var querystring = require('querystring');


var interval, sensor;
var model = resources.pi.sensors.beacons;
var pluginName = resources.pi.sensors.beacons.name;

var weightPlugin = require('./../../plugins/internal/weightPlugin');

var actualBeacons = [];
var reading = false;

exports.start = function (params) { //#A
    if (!reading) {
        actualBeacons = [];
        reading = true;
        console.info("Vou ler beacons");
        Bleacon.startScanning(); // scan for any bleacons
    }
};

exports.stop = function () { //#A
    if (reading) {
        Bleacon.stopScanning();
        weightPlugin.stop();
        model.value = actualBeacons;
        console.log(actualBeacons);
        showValue();
        postBeaconData();
        reading = false;
    }
};

Bleacon.on('discover', function (bleacon) {
    var uuid = bleacon.uuid;
    if (uuid !== '00000000000000000000000000000000') {
        var distance = bleacon.accuracy;
        if (distance < 1) {
            var exists = false;
            for (var i = 0; i < actualBeacons.length; i++) {
                if (actualBeacons[i].uuid === uuid) {
                    exists = true;
                }
            }
            if (!exists) {
                console.info("New beacon");
                console.info(bleacon);
                actualBeacons.push({
                    "uuid": bleacon.uuid,
                    "major": bleacon.major,
                    "minor": bleacon.minor,
                    "distance": bleacon.accuracy,
                    "total_weight": weightPlugin.weightBuffer.shift()
                });
            }
        }
    }
});

function showValue() {
    console.info(model.value ? 'there is beacons data!' : 'not anymore!');
}

function postBeaconData() {
    var post_data = {
        "device_id": resources.pi.id,
        "weight": weightPlugin.weightBuffer.shift(),
        "beacons": JSON.stringify(actualBeacons)
    };
    console.log(post_data);
    var options = {
        host: '1.1.1.239',
        port: '8000',
        path: '/api/sensors/data',
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
    console.log(JSON.stringify(post_data));
    post_req.write(JSON.stringify(post_data));
    post_req.end();
}

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.

