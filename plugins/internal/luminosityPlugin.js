/**
 * Created by vmcb on 12-04-2017.
 */
var resources = require('./../../resources/model');
var beaconsPlugin = require('./../../plugins/internal/beaconsPlugin')

var interval, sensor;
var model = resources.pi.sensors.luminosity;
var pluginName = resources.pi.sensors.luminosity.name;

SerialPort = require("serialport");

var portLight = new SerialPort("/dev/ttyACM0", {
    baudRate: 9600
});

exports.start = function (params) { //#A
    portLight.on("open", function () {
        portLight.on('data', function (data) {
            if (parseInt(data)) {
                model.value = parseInt(data);
                showValue();
            }
            if (String(data).match(/.*Closed.*/g)) {
                beaconsPlugin.start(); // When door is closed start beacons search
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

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.
