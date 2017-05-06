/**
 * Created by vmcb on 12-04-2017.
 */
var resources = require('./../../resources/model');
var configs = require('./../../configs/configs');
var Bleacon = require('bleacon');
var http = require('http');
// We need this to build our post string
var querystring = require('querystring');


var interval, sensor;
var model = resources.pi.sensors.beacons;
var pluginName = resources.pi.sensors.beacons.name;

var weightPlugin = require('./../../plugins/internal/weightPlugin');

var actualBeacons = [];
var beaconsAfterClosing = [];
exports.reading = false;
var afterClosing = false;

exports.start = function (params) { //#A
    if (!exports.reading) {
        afterClosing = false;
        exports.reading = true;
        actualBeacons = [];
        console.info("Vou ler beacons");
        Bleacon.startScanning(); // scan for any bleacons
    }
};

exports.stop = function () { //#A
    Bleacon.stopScanning();
    console.log(weightPlugin.removedDifferences);
    if (weightPlugin.removedDifferences.length > 0) {
        afterClosing = true;
        beaconsAfterClosing = [];
        Bleacon.startScanning(); // scan for any bleacons
    }
    else {
        beaconsAfterClosing = actualBeacons;
        model.value = beaconsAfterClosing;
        showValue();
        postBeaconData();
        postBeaconsData();
        console.log("##################################### VOZINHA A DIZER QUE JÀ PODE METER OUTRO ################################");
    }
    exports.reading = false;
};

Bleacon.on('discover', function (bleacon) {
    var uuid = bleacon.uuid;
    if (afterClosing) {
        console.log("Já fechei");
        beaconsArray = beaconsAfterClosing;
    }else {
        beaconsArray = actualBeacons;
    }
    if (uuid !== '00000000000000000000000000000000') {
        var distance = bleacon.accuracy;
        if (distance < 0.5) {
            var exists = false;
            for (var i = 0; i < beaconsArray.length; i++) {
                if (beaconsArray[i].uuid === uuid) {
                    exists = true;
                }
            }
            if (!exists) {
                console.info("New beacon");
                if (weightPlugin.removedDifferences.length > 0) {
                    console.log("Existem beacons a remover");
                    console.log(beaconsAfterClosing.length);
                    console.log(actualBeacons.length);
                    console.log(weightPlugin.removedDifferences.length);
                    if(beaconsAfterClosing.length < actualBeacons.length - weightPlugin.removedDifferences.length) {
                        console.log("Este beacon manteve-se");
                        beaconsAfterClosing.push({
                            "uuid": bleacon.uuid,
                            "major": bleacon.major,
                            "minor": bleacon.minor,
                            "distance": bleacon.accuracy
                        });
                        if(beaconsAfterClosing.length === actualBeacons.length - weightPlugin.removedDifferences.length) {
                            console.log("Já descobri todos os beacons q tenho de manter e remover");
                            Bleacon.stopScanning();
                            model.value = beaconsAfterClosing;
                            showValue();
                            postBeaconData();
                            postBeaconsData()
                        }
                    }
                    else {
                        console.log("Já descobri todos os beacons q tenho de manter e remover");
                        Bleacon.stopScanning();
                        model.value = beaconsAfterClosing;
                        showValue();
                        postBeaconData();
                        postBeaconsData()
                    }
                }
                else {
                    actualBeacons.push({
                        "uuid": bleacon.uuid,
                        "major": bleacon.major,
                        "minor": bleacon.minor,
                        "distance": bleacon.accuracy
                    });
                    exports.stop();
                }
            }
        }
    }
});

function showValue() {
    console.info(model.value ? 'there is beacons data!' : 'not anymore!');
}

function postBeaconData() {
    console.log("buffer weight");
    console.log(weightPlugin.weightBuffer);
    console.log(beaconsAfterClosing);

    beaconsAfterClosing.forEach(function(result, index) {
        if (checkIfBeaconIsNew(result.uuid)) {
            if(weightPlugin.newProductWeight !== 0){
                console.log("não vou remover");
                result.weight = weightPlugin.newProductWeight;
            }else{
                console.log("vou remover");
                beaconsAfterClosing.splice(index,1);
                console.log(beaconsAfterClosing);
            }
        }
        else {
            result.weight = null;
        }
    });

    console.log(beaconsAfterClosing);

    var post_data = {
        "device_id": resources.pi.id,
        "beacons": JSON.stringify(beaconsAfterClosing)
    };
    console.log(post_data);
    var options = {
        host: configs.server.ip,
        port: configs.server.port,
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

function checkIfBeaconIsNew(uuid) {
    var options = {
        host: configs.server.ip,
        port: configs.server.port,
        path: '/api/product_item/' + uuid + '?state=IN'
    };

    console.log(options);


    var request = require('sync-request');
    var res = request('GET', 'http://' + options.host + ':'+ options.port + '/' + options.path);
    if (res.statusCode !== 200) {
        console.log("not found");
        return true;
    } else {
        console.log("found");
        return false;
    }
}

function postBeaconsData() {

    var post_data = {
        "device_id": resources.pi.id,
        "timestamp": Date.now()/1000,
        "beacons": model.value.length
    };

    var options = {
        host: configs.server.ip,
        port: configs.server.port,
        path: '/api/sensors/beacons',
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

