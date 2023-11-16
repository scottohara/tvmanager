import type {
	Device,
	HeaderFooter,
	NavButton,
	NavButtonEventHandler,
} from "~/controllers";
import type { SinonMatcher, SinonStub } from "sinon";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import RegistrationController from "~/controllers/registration-controller";
import RegistrationView from "~/views/registration-view.html";
import SettingMock from "~/mocks/setting-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("RegistrationController", (): void => {
	let device: Device, registrationController: RegistrationController;

	beforeEach((): void => {
		device = {
			id: "1",
			name: "test-device",
			imported: true,
		};

		registrationController = new RegistrationController();
	});

	describe("object constructor", (): void => {
		it("should return a RegistrationController instance", (): Chai.Assertion =>
			expect(registrationController).to.be.an.instanceOf(
				RegistrationController,
			));
	});

	describe("view", (): void => {
		it("should return the registration view", (): Chai.Assertion =>
			expect(registrationController.view).to.equal(RegistrationView));
	});

	describe("setup", (): void => {
		const deviceSetting: SettingMock = new SettingMock(
			"Device",
			JSON.stringify(device),
		);

		let leftButton: NavButton, rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(
				registrationController,
				"cancel" as keyof RegistrationController,
			);
			sinon.stub(
				registrationController,
				"save" as keyof RegistrationController,
			);
			sinon.stub(
				registrationController,
				"gotDevice" as keyof RegistrationController,
			);
			SettingMock.get.reset();
			SettingMock.get.withArgs("Device").returns(deviceSetting);
			await registrationController.setup();
			leftButton = registrationController.header.leftButton as NavButton;
			rightButton = registrationController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(registrationController.header.label)).to.equal("Register"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(registrationController["cancel"]).to.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(registrationController["save"]).to.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Save"));
		it("should get the device", (): Chai.Assertion =>
			expect(registrationController["gotDevice"]).to.have.been.calledWith(
				deviceSetting,
			));
	});

	describe("gotDevice", (): void => {
		describe("unregistered", (): void => {
			beforeEach(
				async (): Promise<void> =>
					registrationController["gotDevice"](new SettingMock()),
			);

			it("should set an empty device", (): Chai.Assertion =>
				expect(registrationController["device"]).to.deep.equal({
					id: "",
					name: "",
					imported: false,
				}));

			it("should clear the view footer", (): Chai.Assertion =>
				expect(appController.clearFooter).to.have.been.called);
		});

		describe("registered", (): void => {
			let deviceName: HTMLInputElement,
				footer: HeaderFooter,
				leftButton: NavButton;

			beforeEach(async (): Promise<void> => {
				sinon.stub(
					registrationController,
					"unregister" as keyof RegistrationController,
				);

				deviceName = document.createElement("input");
				deviceName.id = "deviceName";
				document.body.append(deviceName);

				await registrationController["gotDevice"](
					new SettingMock(undefined, JSON.stringify(device)),
				);
				footer = registrationController.footer as HeaderFooter;
				leftButton = footer.leftButton as NavButton;
			});

			it("should set the device", (): Chai.Assertion =>
				expect(registrationController["device"]).to.deep.equal(device));
			it("should display the device name", (): Chai.Assertion =>
				expect(deviceName.value).to.equal(device.name));
			it("should set the footer label", (): Chai.Assertion =>
				expect(String(footer.label)).to.equal("v1"));

			it("should attach a footer left button event handler", (): void => {
				(leftButton.eventHandler as NavButtonEventHandler)();
				expect(registrationController["unregister"]).to.have.been.called;
			});

			it("should set the footer left button style", (): Chai.Assertion =>
				expect(String(leftButton.style)).to.equal("cautionButton"));
			it("should set the footer left button label", (): Chai.Assertion =>
				expect(leftButton.label).to.equal("Unregister"));
			it("should set the view footer", (): Chai.Assertion =>
				expect(appController.setFooter).to.have.been.called);

			afterEach((): void => deviceName.remove());
		});
	});

	describe("unregister", (): void => {
		let fakeFetch: SinonStub, fetchArgs: [SinonMatcher, RequestInit];

		beforeEach((): void => {
			fakeFetch = sinon.stub(window, "fetch");
			fetchArgs = [
				sinon.match(/\/devices\/\w+/u),
				{
					method: "DELETE",
					headers: {
						"X-DEVICE-ID": device.id,
					},
				},
			];
			registrationController["device"] = device;
		});

		describe("fail", (): void => {
			it("should display a notice", async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(
					Promise.resolve(
						new Response("", {
							status: 404,
							statusText: "Not Found",
						}),
					),
				);

				await registrationController["unregister"]();
				expect(appController.showNotice).to.have.been.calledWith({
					label: "Unregister failed: 404 (Not Found)",
				});
			});
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(
					Promise.resolve(
						new Response("", {
							status: 200,
							statusText: "OK",
						}),
					),
				);

				await registrationController["unregister"]();
			});

			it("should remove the device", (): void => {
				expect(String(SettingMock.setting.name)).to.equal("Device");
				expect(SettingMock.setting.value).to.be.undefined;
				expect(SettingMock.prototype.remove).to.have.been.called;
			});

			it("should pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.have.been.called);
		});

		afterEach((): void => fakeFetch.restore());
	});

	describe("save", (): void => {
		let deviceName: HTMLInputElement,
			fakeFetch: SinonStub,
			fetchArgs: [SinonMatcher, RequestInit];

		beforeEach((): void => {
			fakeFetch = sinon.stub(window, "fetch");
			fetchArgs = [
				sinon.match(/\/devices\/\w+/u),
				{
					method: "PUT",
					headers: {
						"X-DEVICE-ID": device.id,
					},
				},
			];
			registrationController["device"] = device;
			deviceName = document.createElement("input");
			deviceName.id = "deviceName";
			deviceName.value = "new-device";
			document.body.append(deviceName);
		});

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(
					Promise.resolve(
						new Response("", {
							status: 404,
							statusText: "Not Found",
						}),
					),
				);

				await registrationController["save"]();
			});

			it("should get the device name", (): Chai.Assertion =>
				expect(registrationController["device"].name).to.equal("new-device"));
			it("should display a notice", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "Registration failed: 404 (Not Found)",
				}));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				fakeFetch.withArgs(...fetchArgs).returns(
					Promise.resolve(
						new Response("", {
							status: 200,
							statusText: "OK",
							headers: { Location: "new-device-id" },
						}),
					),
				);

				await registrationController["save"]();
			});

			it("should get the device name", (): Chai.Assertion =>
				expect(registrationController["device"].name).to.equal("new-device"));
			it("should set the device id", (): Chai.Assertion =>
				expect(registrationController["device"].id).to.equal("new-device-id"));

			it("should save the device", (): void => {
				expect(String(SettingMock.setting.name)).to.equal("Device");
				expect(String(SettingMock.setting.value)).to.deep.equal(
					JSON.stringify(device),
				);
				expect(SettingMock.prototype.save).to.have.been.called;
			});

			it("should pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.have.been.called);
		});

		afterEach((): void => {
			deviceName.remove();
			fakeFetch.restore();
		});
	});

	describe("cancel", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await registrationController["cancel"]();
			expect(appController.popView).to.have.been.called;
		});
	});
});
