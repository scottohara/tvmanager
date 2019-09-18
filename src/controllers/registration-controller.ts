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
import DatabaseService from "services/database-service";
import { Device } from "controllers";
import { PublicInterface } from "global";
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
	private device!: Device;

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return RegistrationView;
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
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
		return this.gotDevice(await Setting.get("Device"));
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method gotDevice
	 * @desc Parses the registered device and displays it
	 * @param {Setting} device - a Setting object containing the registered device
	 */
	private async gotDevice(device: PublicInterface<Setting>): Promise<void> {
		// Check if we have a registered device
		if (undefined === device.settingValue) {
			// No registered device
			this.device = {
				id: "",
				name: "",
				imported: false
			};

			// Clear the view footer
			this.appController.clearFooter();
		} else {
			// Parse the JSON
			this.device = JSON.parse(device.settingValue) as Device;

			// Display the device name
			$("#deviceName").val(this.device.name);

			// Setup the footer
			this.footer = {
				label: `v${(await DatabaseService).version}`,
				leftButton: {
					eventHandler: this.unregister.bind(this),
					style: "cautionButton",
					label: "Unregister"
				}
			};

			// Set the view footer
			this.appController.setFooter();
		}
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method unregister
	 * @desc Unregisters the current device
	 */
	private async unregister(): Promise<void> {
		try {
			// Send a DELETE request to the server
			const response: Response = await fetch(`/devices/${this.device.id}`, {
				method: "DELETE",
				headers: {
					"X-DEVICE-ID": String(this.device.id)
				}
			});

			if (response.ok) {
				const device: Setting = new Setting("Device");

				// Remove the device from the database
				await device.remove();

				// Pop the view off the stack
				await this.appController.popView();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error) {
			this.appController.showNotice({
				label: `Unregister failed: ${error.message}`,
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			});
		}
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method save
	 * @desc Registers or updates the current device
	 */
	private async save(): Promise<void> {
		// Get the device details
		this.device.name = String($("#deviceName").val());

		// Send a PUT request to the server, including the device ID in the request headers
		try {
			const response: Response = await fetch(`/devices/${this.device.name}`, {
				method: "PUT",
				headers: {
					"X-DEVICE-ID": String(this.device.id)
				}
			});

			if (response.ok) {
				// Get the device ID returned in the Location header
				this.device.id = String(response.headers.get("Location"));

				const device: Setting = new Setting("Device", JSON.stringify(this.device));

				// Update the database
				await device.save();

				// Pop the view off the stack
				await this.appController.popView();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error) {
			this.appController.showNotice({
				label: `Registration failed: ${error.message}`,
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			});
		}
	}

	/**
	 * @memberof RegistrationController
	 * @this RegistrationController
	 * @instance
	 * @method cancel
	 * @desc Pops the view off the stack
	 */
	private async cancel(): Promise<void> {
		return this.appController.popView();
	}
}