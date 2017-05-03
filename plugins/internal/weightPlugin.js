var resources = require('./../../resources/model');
var beaconsPlugin = require('./../../plugins/internal/beaconsPlugin');
var median = require('median');

SerialPort = require("serialport");


var interval, sensor;
var model = resources.pi.sensors.weight;
var pluginName = resources.pi.sensors.weight.name;
var localParams = {'simulate': false, 'frequency': 2000};
var bufferToMedian = [];

var started = false;
var actualWeight = 0;
var previousWeight = 0;
exports.weightBuffer = [];
var THRESHOLD = 0.100;


var portWeight = new SerialPort("/dev/ttyACM1", {
    baudRate: 9600
});

exports.start = function (params) { //#A
    if (!started) {
        started = true;
        if (params) {
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
        if (!portWeight.isOpen()) {
            portWeight.open()
        }
        portWeight.on('data', function (data) {
            if (!isNaN(parseFloat(data))) {
                val = parseFloat(data);
                console.log(val);
                bufferToMedian.push(val);
                console.log(bufferToMedian);
                if (bufferToMedian.length === 5) {
                    copyArray = bufferToMedian.slice();
                    val = median(copyArray);
                    if (val < 0) {
                        val = 0;
                    }
                    model.value = val;
                    actualWeight = val;
                    console.log("Peso e: " + val);
                    checkThreshold();
                    showValue();
                    bufferToMedian.shift();
                }
            }
        });
}

function simulate() { //#E
    interval = setInterval(function () {
        val = Math.random() * 20;
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

    var dif = actualWeight - previousWeight;
    console.info(dif);
    if (dif > THRESHOLD) {
        exports.weightBuffer.push(dif);
    }
    previousWeight = actualWeight;
}


//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.


