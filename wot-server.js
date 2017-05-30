var resources = require('./resources/model');

// Internal Plugins
var luminositySensor= require('./plugins/internal/luminosityPlugin');
var beaconSensor = require('./plugins/internal/beaconsPlugin');
var weightSensor = require('./plugins/internal/weightPlugin');
var shelf = require('./plugins/internal/device.js');

shelf.registerDevice(resources.pi);
var existing_beacons = beaconSensor.getBeacons(resources.pi);


if(!existing_beacons){
    console.log("ERROR: Can get beacons from database");
}else{
    shelf.webSocketServer(resources.pi);
    beaconSensor.setUpMemory(resources.pi, existing_beacons, weightSensor);
    luminositySensor.start(resources.pi, weightSensor, beaconSensor);
}

