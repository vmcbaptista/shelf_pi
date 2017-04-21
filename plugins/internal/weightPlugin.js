var resources = require('./../../resources/model');
var beaconsPlugin = require('./../../plugins/internal/beaconsPlugin');

SerialPort = require("serialport");


var interval, sensor;
var model = resources.pi.sensors.weight;
var pluginName = resources.pi.sensors.weight.name;
var localParams = {'simulate': false, 'frequency': 2000};

var started = false;
var actualWeight = 0;
var previousWeight = 0;
exports.weightBuffer = [];
var THRESHOLD = 100;

exports.start = function (params) { //#A
    if (!started) {
        started = true;
        localParams = params;
        if (localParams.simulate) {
            simulate();
        } else {
            connectHardware();
        }
    }
};

exports.stop = function () { //#A
    if(started) {
        if (localParams.simulate) {
            clearInterval(interval);
        } else {
            portWeight.close();
        }
        started = false;
    }
};

function connectHardware() { //#B
    var portWeight = new SerialPort("/dev/ttyACM0", {
        baudRate: 9600
    });
    portWeight.on("open", function () {
        portLight.on('data', function (data) {
            if (parseInt(data)) {
                val = parseInt(data);
                model.value = val;
                actualWeight = val;
                activateBeacons();
                showValue();
            }
        });
    });
}

function simulate() { //#E
    interval = setInterval(function () {
        val = Math.random() * 16000;
        model.value = val;
        actualWeight = val;
        checkThreshold();
        showValue();
    }, localParams.frequency);
    console.info('Simulated %s sensor started!', pluginName);
}

function showValue() {
    console.info(model.value ? 'there is someone!' : 'not anymore!');
}

function checkThreshold() {
    var dif = previousWeight - actualWeight;
    if (previousWeight - actualWeight > THRESHOLD) {
        this.weightBuffer.push(actualWeight);
    }
    previousWeight = actualWeight;
}


//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.


