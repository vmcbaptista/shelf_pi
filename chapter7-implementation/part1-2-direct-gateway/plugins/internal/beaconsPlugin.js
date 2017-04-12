/**
 * Created by vmcb on 12-04-2017.
 */
var resources = require('./../../resources/model');
var Bleacon = require('bleacon');


var interval, sensor;
var model = resources.pi.sensors.beacons;
var pluginName = resources.pi.sensors.beacons.name;

var actualBeacons = [];
var reading = false;

exports.start = function (params) { //#A
    if (!reading) {
        actualBeacons = [];
        reading = true;
        console.info("Vou ler beacons");
        Bleacon.startScanning(); // scan for any bleacons
        setTimeout(exports.stop, 60000);
    }
};

exports.stop = function () { //#A
    Bleacon.stopScanning();
    model.value = actualBeacons;
    showValue();
    reading = false;
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
                actualBeacons.push(bleacon)
            }
        }
    }
});

function showValue() {
    console.info(model.value ? 'there is beacons data!' : 'not anymore!');
}

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.

