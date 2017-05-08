/**
 * Created by vmcb on 12-04-2017.
 */

var Bleacon = require('bleacon');
var say = require('say');
var http = require("http");

exports.doorClosed = true;

var beaconsCount = [];
var myMemory = [];
var temporaryMemoryMissingBeacons=[];
var deviceConfigs;
var weightSensor;

exports.start = function (params) {
        if(myMemory.length === weightSensor.removedDifferences.length && exports.doorClosed){
            myMemory = [];
            weightSensor.removedDifferences.length=0;
            exports.stop();
        }else {
            console.info("Reading Beacons - Started");
            Bleacon.startScanning();
        }
};

exports.stop = function () {
    Bleacon.stopScanning();
    beaconsCount.value = myMemory.length;
    //showValue();
    console.log("Sending Data to Server");
    postBeaconData(deviceConfigs, myMemory);
    postBeaconsData(deviceConfigs);
};

exports.getBeacons = function(device_configs) {
    console.log("Setting Up Memory - Getting Beacons");
    var options = {
        host: device_configs.server.ip,
        port: device_configs.server.port,
        path: '/api/product_item/?state=IN'
    };
    var request = require('sync-request');
    var res = request('GET', 'http://' + options.host + ':'+ options.port + '/' + options.path);
    if (res.statusCode !== 200) {
        return false;
    } else {
        console.log("Beacons Found.");
        myMemory = JSON.parse(res.getBody());
        return myMemory;
    }
};

exports.setUpMemory = function(device_configs,existingBeacons,weight_sensor){
    myMemory = existingBeacons;
    beaconsCount = device_configs.sensors.beacons;
    deviceConfigs = device_configs;
    weightSensor = weight_sensor;
};

/*
 function showValue() {
 console.info(model.value ? 'there is beacons data!' : 'not anymore!');
 }*/

function postBeaconData(deviceConfigs,myMemory) {
    var post_data = {
        "device_id": deviceConfigs.id,
        "beacons": JSON.stringify(myMemory)
    };
    console.log(post_data);
    var options = {
        host: deviceConfigs.server.ip,
        port: deviceConfigs.server.port,
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

function postBeaconsData(deviceConfigs) {

    var post_data = {
        "device_id": deviceConfigs.id,
        "timestamp": Date.now()/1000,
        "beacons": beaconsCount.value
    };

    var options = {
        host: deviceConfigs.server.ip,
        port: deviceConfigs.server.port,
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

function isBeaconNew(array, beacon) {
    var isNew = false;
    if (array.length === 0) {
        newBeacon = {
            uuid: beacon.uuid,
            distance: beacon.accuracy,
            major: beacon.major,
            minor: beacon.minor,
            weight: weightSensor.newProductWeight
        };
        array.push(newBeacon);
        isNew = true;
    }else {
        var exists = false;
        for (var i = 0; i < array.length; i++) {
            if (beacon.uuid == array[i].uuid) {
                exists = true;
            }
        }

        if (!exists) {
            newBeacon = {
                uuid: beacon.uuid,
                distance: beacon.accuracy,
                major: beacon.major,
                minor: beacon.minor,
                weight: weightSensor.newProductWeight
            };
            array.push(newBeacon);
            isNew = true;
        }
    }
    return isNew;
}

function isBeaconRemoved(array, beacon){
    var numberNegativeWeightVariations = weightSensor.removedDifferences.length;
    if(numberNegativeWeightVariations > 0) {
        var exists = false;
        for (var i = 0; i < temporaryMemoryMissingBeacons.length; i++) {
            if (beacon.uuid == temporaryMemoryMissingBeacons[i].uuid) {
                exists = true;
            }
        }
        if (!exists) {
            existingBeacon  = {
                uuid: beacon.uuid,
                distance: beacon.accuracy,
                major: beacon.major,
                minor: beacon.minor
                //weight: weightSensor.newProductWeight
            };

            temporaryMemoryMissingBeacons.push(existingBeacon);
        }
        console.log("My Memory Lenght " + myMemory.length);
        console.log("Negative Vars " + numberNegativeWeightVariations);
        console.log(" Temporary Memory " + temporaryMemoryMissingBeacons);

        if(temporaryMemoryMissingBeacons.length ===  myMemory.length - numberNegativeWeightVariations){
            console.log("Removing things");
            temporaryMemoryMissingBeacons.forEach(function(resultTM,indexTM){
                myMemory.forEach(function(resultMM,indexMM){
                    if(resultTM.uuid == resultMM.uuid){
                        resultTM.weight = resultMM.weight;
                    }
                });
            });
            myMemory = temporaryMemoryMissingBeacons.slice();
            console.log("MyMemory after splice");
            console.log(myMemory);
            temporaryMemoryMissingBeacons = [];
            console.log("Negative measures jumping to stop");
            weightSensor.removedDifferences.length = 0;
            exports.stop();
        }
    }else{
        console.log("No negative measures jumping to stop");
        exports.stop();
    }

}

Bleacon.on('discover', function (bleacon) {
    if (bleacon.uuid !== '00000000000000000000000000000000') {
        if (bleacon.accuracy < 0.5) {
            console.log("Checking if doot is closed");
            if(!exports.doorClosed) {
                console.log("Checking if Beacon Exists");
                if (isBeaconNew(myMemory, bleacon)) {
                    console.log(myMemory);
                    Bleacon.stopScanning();
                    console.log("A new beacon was discovered." + bleacon.major);
                    say.speak("Now you can add another product.");
                }
            }else {
                    isBeaconRemoved(myMemory, bleacon);
            }
        }
    }
});

exports.getMemory = function(){
    return myMemory;
};