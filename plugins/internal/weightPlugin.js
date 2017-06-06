var beaconsPlugin = require('./../../plugins/internal/beaconsPlugin');
var http = require("http");
var say = require('say');

exports.newProductWeight = 0;
exports.removedDifferences = [];

var THRESHOLD = 0.100;
var DIFFERENCE = 0.002;
var TOLERANCE = 0.002;
var started = false;
var previousWeight = 0;
var array = [];
SerialPort = require("serialport");
var weightSensorPort = new SerialPort("/dev/ttyACM1", {
    baudRate: 9600
});
var firstMeasure = true;

exports.start = function (device_configs) {
    if (!started) {
        var weight_data = device_configs.sensors.weight;
        exports.removedDifferences = [];
        started = true;

        if (!weightSensorPort.isOpen()) {
            weightSensorPort.open()
        }

        weightSensorPort.on('data', function (sensor_raw_data) {
            if (String(sensor_raw_data).match(/\*[+-]?([0-9]*[.])?[0-9]+\#/g)) {
                sensor_data = parseFloat(String(sensor_raw_data).substring(1,String(sensor_raw_data).length - 1));
                if (sensor_data < 0) {
                    sensor_data = 0;
                }
                weight_data.value = sensor_data;
                postWeightData(device_configs, weight_data);
                console.log("The measured weight is: " + weight_data.value);
                saveData(weight_data.value);
                //checkThreshold(weight_data.value);
                //showValue();
            }
        });
    }
};

exports.stop = function () {
    if(started) {
        weightSensorPort.close();
        started = false;
    }
};

function saveData(actualWeight) {
    if(array.length > 7) array = [];
    array.push(actualWeight);
    var sum = 0;
    for(var i=0;i<array.length;i++){
        sum += array[i];
    }
    var mean = sum / array.length;
    var dif = actualWeight - mean;
    if(Math.abs(dif) < DIFFERENCE){
        //console.info("The mean is " + mean + " and the actual weight is " + actualWeight);
        checkThreshold(actualWeight);
    }
}

function checkThreshold(actualWeight) {
    var dif = actualWeight - previousWeight;
    //console.info("The dif " + dif + " is higher than " + THRESHOLD);
    //console.info(beaconsPlugin.getMemory());
    if (dif > THRESHOLD) {
        if(firstMeasure && beaconsPlugin.getMemory().length > 0) {
            firstMeasure = false;
            console.log("Ignoring First Measure");
        }else {
            firstMeasure = false;
            exports.newProductWeight = dif;
            exports.newProductWeightTime = Date.now();
            beaconsPlugin.start();
        }
    } else if (dif < -THRESHOLD) {
        var temp = beaconsPlugin.getMemory();
        for(var i = 0; i < temp.length; i++){
            var pos = temp[i]["weight"] + TOLERANCE;
            var neg = temp[i]["weight"] - TOLERANCE;
            if(!beaconsPlugin.error) {
                if (Math.abs(dif) < pos && Math.abs(dif) > neg) {
                    console.info("Product removed");
                    exports.removedDifferences.push(dif);
                    say.speak("Please do not insert this product again. To do that you should close the door first");
                    break;
                }
            }
            else{
                beaconsPlugin.error = false;
            }
        }
    }
    previousWeight = actualWeight;
}

function postWeightData(device_configs, weight_data) {
    var post_data = {
        "device_id": device_configs.id,
        "timestamp": Date.now()/1000,
        "weight": weight_data.value
    };
    var options = {
        host: device_configs.server.ip,
        port: device_configs.server.port,
        path: '/api/sensors/weight',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    var post_req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });
    //console.log(JSON.stringify(post_data));
    post_req.write(JSON.stringify(post_data));
    post_req.end();
}

