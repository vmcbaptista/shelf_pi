var resources = require('./../../resources/model');
var configs = require('./../../configs/configs');
var beaconsPlugin = require('./../../plugins/internal/beaconsPlugin');
var median = require('median');

SerialPort = require("serialport");


var interval, sensor;
var model = resources.pi.sensors.weight;
var pluginName = resources.pi.sensors.weight.name;
var localParams = {'simulate': false, 'frequency': 2000};

var started = false;
var actualWeight = 0;
var previousWeight = 0;
exports.newProductWeight = 0;
exports.removedDifferences = [];
var THRESHOLD = 0.100;


var portWeight = new SerialPort("/dev/ttyACM1", {
    baudRate: 9600
});

exports.start = function (params) { //#A
    if (!started) {
        exports.removedDifferences = [];
        exports.weightBuffer = [];
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
        if (String(data).match(/\*[+-]?([0-9]*[.])?[0-9]+\#/g)) {
            val = parseFloat(String(data).substring(1,String(data).length - 1));
            if (val < 0) {
                val = 0;
            }
            model.value = val;
            actualWeight = val;
            postWeightData();
            console.log("Peso e: " + val);
            checkThreshold();
            //showValue();
        }
    });
}

function simulate() { //#E
    interval = setInterval(function () {
        val = Math.random() * 20;
        model.value = val;
        actualWeight = val;
        checkThreshold();
        //showValue();
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
        console.log("Há um produto novo");
        exports.newProductWeight = dif;
        beaconsPlugin.start();
    } else if (dif < -THRESHOLD) {
        exports.removedDifferences.push(dif);
    }
    previousWeight = actualWeight;
}

function postWeightData() {

    var post_data = {
        "device_id": resources.pi.id,
        "timestamp": Date.now()/1000,
        "weight": model.value
    };

    var options = {
        host: configs.server.ip,
        port: configs.server.port,
        path: '/api/sensors/weight',
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


