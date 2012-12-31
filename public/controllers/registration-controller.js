/**
 * @file (Controllers) RegistrationController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class RegistrationController
 * @classdesc Controller for the registration view
 * @property {HeaderFooter} header - the view header bar
 * @property {Device} device - the registered device
 * @property {HeaderFooter} footer - the view footer bar
 * @this RegistrationController
 * @constructor
 */
var RegistrationController = function () {
	"use strict";
};

/**
 * @memberof RegistrationController
 * @this RegistrationController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
RegistrationController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "Register",
		leftButton: {
			eventHandler: this.cancel,
			style: "toolButton",
			label: "Cancel"
		},
		rightButton: {
			eventHandler: $.proxy(this.save, this),
			style: "blueButton",
			label: "Save"
		}
	};

	// Get the registered device
	Setting.get("Device", $.proxy(this.gotDevice, this));
};

/**
 * @memberof RegistrationController
 * @this RegistrationController
 * @instance
 * @method gotDevice
 * @desc Parses the registered device and displays it
 * @param {Setting} device - a Setting object containing the registered device
 */
RegistrationController.prototype.gotDevice = function(device) {
	"use strict";

	// Check if we have a registered device
	if (device.settingValue) {
		// Parse the JSON
		this.device = $.parseJSON(device.settingValue);

		// Display the device name
		$("#deviceName").val(this.device.name);

		// Setup the footer
		this.footer = {
			label: "v" + appController.db.version,
			leftButton: {
				eventHandler: $.proxy(this.unregister, this),
				style: "redButton",
				label: "Unregister"
			}
		};

		// Set the view footer
		appController.setFooter();
	} else {
		// No registered device
		this.device = {
			id: "",
			name: "",
			imported: false
		};

		// Clear the view footer
		appController.clearFooter();
	}
};

/**
 * @memberof RegistrationController
 * @this RegistrationController
 * @instance
 * @method unregister
 * @desc Unregisters the current device
 */
RegistrationController.prototype.unregister = function() {
	"use strict";

	// Send a DELETE request to the server
	$.ajax({
		url: "/devices/" + this.device.id,
		context: this,
		type: "DELETE",
		success: function(unregisterResponse, status, jqXHR) {
			// Remove the device from the database
			var device = new Setting("Device", null);
			device.remove();

			// Pop the view off the stack
			appController.popView();
		},
		error: function(request, statusText) {
			// Display a notice indicating that the unregister failed
			appController.showNotice({
				label: "Unregister failed: " + statusText + ", " + request.status + " (" + request.statusText + ")",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});
	  }
	});
};

/**
 * @memberof RegistrationController
 * @this RegistrationController
 * @instance
 * @method save
 * @desc Registers or updates the current device
 */
RegistrationController.prototype.save = function() {
	"use strict";

	// Get the device details
	this.device.name = $("#deviceName").val();
	
	// Send a PUT request to the server, including the device ID in the request headers
	$.ajax({
		url: "/devices/" + this.device.name,
		context: this,
		type: "PUT",
		headers: {
			"X-DEVICE-ID": this.device.id
		},
		success: function(registrationReponse, status, jqXHR) {
			// Get the device ID returned in the Location header
			this.device.id = jqXHR.getResponseHeader("Location");

			// Update the database
			var device = new Setting("Device", JSON.stringify(this.device));
			device.save();

			// Pop the view off the stack
			appController.popView();
		},
		error: function(request, statusText) {
			// Display a notice indicating that the registration failed
			appController.showNotice({
				label: "Registration failed: " + statusText + ", " + request.status + " (" + request.statusText + ")",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});
	  }
	});
};

/**
 * @memberof RegistrationController
 * @this RegistrationController
 * @instance
 * @method cancel
 * @desc Pops the view off the stack
 */
RegistrationController.prototype.cancel = function() {
	"use strict";

	appController.popView();
};
