/**
 * Created by vmcb on 12-04-2017.
 */
var http = require("http");

SerialPort = require("serialport");

var luminositySensorPort = new SerialPort("/dev/ttyACM0", {
    baudRate: 9600
});

exports.start = function (device_configs, weightSensor,beaconSensor) {
    console.log("Starting luminosity sensor readings");
    var luminosity_data = device_configs.sensors.luminosity; //Reading Value from configs

    luminositySensorPort.on("open", function () {
        luminositySensorPort.on('data', function (data) {
            if (parseInt(data)) {
                luminosity_data.value = parseInt(data);
                postLuminosityData(device_configs, luminosity_data);
                //showValue();
            }
            if (String(data).match(/.*Opened.*/g)) {
                weightSensor.start(device_configs); // When door is open start weight measure.
                beaconSensor.doorClosed = false;
            }
            if (String(data).match(/.*Closed.*/g)) {
                weightSensor.stop();
                if(!beaconSensor.doorClosed) {
                    beaconSensor.doorClosed = true;
                    if(weightSensor.removedDifferences.length > 0) {
                        beaconSensor.start();
                    }else{
                        beaconSensor.stop();
                    }
                    console.log("The door was closed.")
                }
            }
        });
    });
};

exports.stop = function () {
    luminositySensorPort.close();
};

/*
function showValue() {
    console.info(model.value ? 'there is luminosity data!' : 'not anymore!');
}*/

function postLuminosityData(device_configs, luminosity_data) {
    var post_data = {
        "device_id": device_configs.id,
        "timestamp": Date.now()/1000,
        "luminosity": luminosity_data.value
    };
    var options = {
        host: device_configs.server.ip,
        port: device_configs.server.port,
        path: '/api/sensors/luminosity',
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
    post_req.write(JSON.stringify(post_data));
    post_req.end();
}