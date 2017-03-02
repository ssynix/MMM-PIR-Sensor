/* global Module */

/* Magic Mirror
 * Module: MMM-PIR-Sensor
 *
 * By Paul-Vincent Roll http://paulvincentroll.com
 * MIT Licensed.
 */

Module.register('MMM-PIR-Sensor',{

	requiresVersion: "2.1.0",

	defaults: {
		sensorPIN: 22,
		relayPIN: false,
		powerSaving: true,
		relayOnState: 1,
		inactivityTimeoutSec: 30,
	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "USER_PRESENCE"){
			this.sendNotification(notification, payload)
		}
	},

	notificationReceived: function(notification, payload) {
		if (notification === "SCREEN_WAKEUP"){
			this.sendNotification(notification, payload)
		}
	},

	start: function() {
		if (this.config.relayOnState == 1){
			this.config.relayOffState = 0
		}
		else if (this.config.relayOnState == 0){
			this.config.relayOffState = 1
		}
		this.config.timerTimeoutMs = this.config.inactivityTimeoutSec * 1000;
		this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);
	}
});
