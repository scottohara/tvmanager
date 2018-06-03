/**
 * @file (Controllers) RegistrationController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/registration-controller
 * @requires jquery
 * @requires models/setting-model
 * @requires controllers/view-controller
 */
import $ from "jquery";
import RegistrationView from "views/registration-view.html";
import Setting from "models/setting-model";
import ViewController from "controllers/view-controller";

/**
 * @class RegistrationController
 * @classdesc Controller for the registration view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 * @property {Device} device - the registered device
 * @property {HeaderFooter} footer - the view footer bar
 */
export default class RegistrationController extends ViewController {
	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	get view() {
		return RegistrationView;
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	setup() {
		// Setup the header
		this.header = {
			label: "Register",
			leftButton: {
				eventHandler: this.cancel.bind(this),
				label: "Cancel"
			},
			rightButton: {
				eventHandler: this.save.bind(this),
				style: "confirmButton",
				label: "Save"
			}
		};

		// Get the registered device
		Setting.get("Device", this.gotDevice.bind(this));
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method gotDevice
	 * @desc Parses the registered device and displays it
	 * @param {Setting} device - a Setting object containing the registered device
	 */
	gotDevice(device) {
		// Check if we have a registered device
		if (device && device.settingValue) {
			// Parse the JSON
			this.device = JSON.parse(device.settingValue);

			// Display the device name
			$("#deviceName").val(this.device.name);

			// Setup the footer
			this.footer = {
				label: `v${this.appController.db.version}`,
				leftButton: {
					eventHandler: this.unregister.bind(this),
					style: "cautionButton",
					label: "Unregister"
				}
			};

			// Set the view footer
			this.appController.setFooter();
		} else {
			// No registered device
			this.device = {
				id: "",
				name: "",
				imported: false
			};

			// Clear the view footer
			this.appController.clearFooter();
		}
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method unregister
	 * @desc Unregisters the current device
	 */
	unregister() {
		// Send a DELETE request to the server
		$.ajax({
			url: `/devices/${this.device.id}`,
			context: this,
			type: "DELETE",
			headers: {
				"X-DEVICE-ID": String(this.device.id)
			},
			success() {
				const device = new Setting("Device", null);

				// Remove the device from the database
				device.remove();

				// Pop the view off the stack
				this.appController.popView();
			},
			error: (request, statusText) => this.appController.showNotice({
				label: `Unregister failed: ${statusText}, ${request.status} (${request.statusText})`,
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			})
		});
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method save
	 * @desc Registers or updates the current device
	 */
	save() {
		// Get the device details
		this.device.name = $("#deviceName").val();

		// Send a PUT request to the server, including the device ID in the request headers
		$.ajax({
			url: `/devices/${this.device.name}`,
			context: this,
			type: "PUT",
			headers: {
				"X-DEVICE-ID": String(this.device.id)
			},
			success(registrationReponse, status, jqXHR) {
				// Get the device ID returned in the Location header
				this.device.id = jqXHR.getResponseHeader("Location");

				const device = new Setting("Device", JSON.stringify(this.device));

				// Update the database
				device.save();

				// Pop the view off the stack
				this.appController.popView();
			},
			error: (request, statusText) => this.appController.showNotice({
				label: `Registration failed: ${statusText}, ${request.status} (${request.statusText})`,
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			})
		});
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method cancel
	 * @desc Pops the view off the stack
	 */
	cancel() {
		this.appController.popView();
	}
}