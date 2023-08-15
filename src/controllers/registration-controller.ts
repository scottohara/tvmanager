import type {
	Device,
	NavButtonEventHandler
} from "~/controllers";
import DatabaseService from "~/services/database-service";
import type { PublicInterface } from "~/global";
import RegistrationView from "~/views/registration-view.html";
import Setting from "~/models/setting-model";
import ViewController from "~/controllers/view-controller";

export default class RegistrationController extends ViewController {
	private device!: Device;

	public get view(): string {
		return RegistrationView;
	}

	// DOM selectors
	private get deviceName(): HTMLInputElement {
		return document.querySelector("#deviceName") as HTMLInputElement;
	}

	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: "Register",
			leftButton: {
				eventHandler: this.cancel.bind(this) as NavButtonEventHandler,
				label: "Cancel"
			},
			rightButton: {
				eventHandler: this.save.bind(this) as NavButtonEventHandler,
				style: "confirmButton",
				label: "Save"
			}
		};

		// Get the registered device
		return this.gotDevice(await Setting.get("Device"));
	}

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
			this.deviceName.value = this.device.name;

			// Setup the footer
			this.footer = {
				label: `v${(await DatabaseService).version}`,
				leftButton: {
					eventHandler: this.unregister.bind(this) as NavButtonEventHandler,
					style: "cautionButton",
					label: "Unregister"
				}
			};

			// Set the view footer
			this.appController.setFooter();
		}
	}

	private async unregister(): Promise<void> {
		try {
			// Send a DELETE request to the server
			const response = await fetch(`/devices/${this.device.id}`, {
				method: "DELETE",
				headers: {
					"X-DEVICE-ID": String(this.device.id)
				}
			});

			if (response.ok) {
				const device = new Setting("Device");

				// Remove the device from the database
				await device.remove();

				// Pop the view off the stack
				await this.appController.popView();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			this.appController.showNotice({ label: `Unregister failed: ${(error as Error).message}` });
		}
	}

	private async save(): Promise<void> {
		// Get the device details
		this.device.name = this.deviceName.value;

		// Send a PUT request to the server, including the device ID in the request headers
		try {
			const response = await fetch(`/devices/${this.device.name}`, {
				method: "PUT",
				headers: {
					"X-DEVICE-ID": String(this.device.id)
				}
			});

			if (response.ok) {
				// Get the device ID returned in the Location header
				this.device.id = String(response.headers.get("Location"));

				const device = new Setting("Device", JSON.stringify(this.device));

				// Update the database
				await device.save();

				// Pop the view off the stack
				await this.appController.popView();
			} else {
				throw new Error(`${response.status} (${response.statusText})`);
			}
		} catch (error: unknown) {
			this.appController.showNotice({ label: `Registration failed: ${(error as Error).message}` });
		}
	}

	private async cancel(): Promise<void> {
		return this.appController.popView();
	}
}