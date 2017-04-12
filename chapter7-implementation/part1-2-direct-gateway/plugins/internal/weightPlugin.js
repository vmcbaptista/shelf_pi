var resources = require('./../../resources/model');

SerialPort = require("serialport");


var interval, sensor;
var model = resources.pi.sensors.weight;
var pluginName = resources.pi.sensors.weight.name;
var localParams = {'simulate': false, 'frequency': 2000};

exports.start = function (params) { //#A
  localParams = params;
  if (localParams.simulate) {
    simulate();
  } else {
    connectHardware();
  }
};

exports.stop = function () { //#A
  if (localParams.simulate) {
    clearInterval(interval);
  } else {
      portWeight.close();
  }
};

function connectHardware() { //#B
    var portWeight = new SerialPort("/dev/ttyACM0", {
        baudRate: 9600
    });
    portWeight.on("open", function () {
        portLight.on('data', function (data) {
            if (parseInt(data)) {
                model.value = parseInt(data);
                showValue();
            }
        });
    });
};

function simulate() { //#E
  interval = setInterval(function () {
    model.value = Math.random() * 16000;
    showValue();
  }, localParams.frequency);
  console.info('Simulated %s sensor started!', pluginName);
};

function showValue() {
  console.info(model.value ? 'there is someone!' : 'not anymore!');
};

//#A starts and stops the plugin, should be accessible from other Node.js files so we export them
//#B require and connect the actual hardware driver and configure it
//#C configure the GPIO pin to which the PIR sensor is connected
//#D start listening for GPIO events, the callback will be invoked on events
//#E allows the plugin to be in simulation mode. This is very useful when developing or when you want to test your code on a device with no sensors connected, such as your laptop.


