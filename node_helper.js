'use strict';

/* Magic Mirror
 * Module: MMM-PIR-Sensor
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const Gpio = require('onoff').Gpio;
const exec = require('child_process').exec;
const Stopwatch = require('timer-stopwatch');

module.exports = NodeHelper.create({
  start: function () {
    const self = this;
    this.started = false;
    this.timer = new Stopwatch();
    this.timer.onDone(function() {
      self.deactivateMonitor(self);
    });
  },

  activateMonitor: function () {
    // console.log("Turning on the monitor!");
    this.sendSocketNotification("USER_PRESENCE", true);
    if (!this.config.powerSaving) {
      return;
    }
    if (this.config.relayPIN != false) {
      this.relay.writeSync(this.config.relayOnState);
    }
    else if (this.config.relayPIN == false){
      exec("/opt/vc/bin/tvservice --preferred && sudo chvt 6 && sudo chvt 7", null);
    }
  },

  // When the timer calls this function, 'this' would not be in the same scope,
  // so we need to pass it as an argument, when initializing the timer
  deactivateMonitor: function (self) {
    // console.log("Turning off the monitor...");
    self.sendSocketNotification("USER_PRESENCE", false);
    if (!self.config.powerSaving) {
      return;
    }
    if (self.config.relayPIN != false) {
      self.relay.writeSync(self.config.relayOffState);
    }
    else if (self.config.relayPIN == false){
      exec("/opt/vc/bin/tvservice -o", null);
    }
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG' && this.started == false) {
      const self = this;
      this.config = payload;

      //Setup pins
      this.pir = new Gpio(this.config.sensorPIN, 'in', 'both');
      // exec("echo '" + this.config.sensorPIN.toString() + "' > /sys/class/gpio/export", null);
      // exec("echo 'in' > /sys/class/gpio/gpio" + this.config.sensorPIN.toString() + "/direction", null);

      if (this.config.relayPIN) {
        this.relay = new Gpio(this.config.relayPIN, 'out');
        this.relay.writeSync(this.config.relayOnState);
        exec("/opt/vc/bin/tvservice --preferred && sudo chvt 6 && sudo chvt 7", null);
      }

      //Detected movement
      this.pir.watch(function(err, value) {
        if (value == 1) {
          if (self.timer.state != 1) { // NOT RUNNING
            self.activateMonitor();
          }
          self.timer.reset(self.config.timerTimeoutMs);
          self.timer.start();
        }
      });

      this.started = true;

    } else if (notification === 'SCREEN_WAKEUP') {
      this.activateMonitor();
    }
  }

});
