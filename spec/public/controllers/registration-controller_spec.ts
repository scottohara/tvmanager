import {
	Device,
	HeaderFooter,
	NavButton
} from "controllers";
import sinon, { SinonFakeServer } from "sinon";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import RegistrationController from "controllers/registration-controller";
import RegistrationView from "views/registration-view.html";
import SettingMock from "mocks/setting-model-mock";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("RegistrationController", (): void => {
	let device: Device,
			registrationController: RegistrationController,
			fakeServer: SinonFakeServer;

	beforeEach((): void => {
		device = {
			id: "1",
			name: "test-device",
			imported: true
		};

		registrationController = new RegistrationController();
	});

	describe("object constructor", (): void => {
		it("should return a RegistrationController instance", (): Chai.Assertion => registrationController.should.be.an.instanceOf(RegistrationController));
	});

	describe("view", (): void => {
		it("should return the registration view", (): Chai.Assertion => registrationController.view.should.equal(RegistrationView));
	});

	describe("setup", (): void => {
		let	leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(registrationController, "cancel" as keyof RegistrationController);
			sinon.stub(registrationController, "save" as keyof RegistrationController);
			sinon.stub(registrationController, "gotDevice" as keyof RegistrationController);
			SettingMock.get.reset();
			SettingMock.get.withArgs("Device").yields({ settingValue: device });
			registrationController.setup();
			leftButton = registrationController.header.leftButton as NavButton;
			rightButton = registrationController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(registrationController.header.label).should.equal("Register"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			registrationController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			registrationController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));
		it("should get the device", (): Chai.Assertion => registrationController["gotDevice"].should.have.been.calledWith({ settingValue: device }));
	});

	describe("gotDevice", (): void => {
		describe("unregistered", (): void => {
			beforeEach((): void => registrationController["gotDevice"](new SettingMock(null, null)));

			it("should set an empty device", (): Chai.Assertion => registrationController["device"].should.deep.equal({
				id: "",
				name: "",
				imported: false
			}));

			it("should clear the view footer", (): Chai.Assertion => appController.clearFooter.should.have.been.called);
		});

		describe("registered", (): void => {
			let deviceName: JQuery<HTMLElement>,
					footer: HeaderFooter,
					leftButton: NavButton;

			beforeEach((): void => {
				sinon.stub(registrationController, "unregister" as keyof RegistrationController);

				deviceName = $("<input>")
					.attr("id", "deviceName")
					.appendTo(document.body);

				registrationController["gotDevice"](new SettingMock(null, JSON.stringify(device)));
				footer = registrationController.footer as HeaderFooter;
				leftButton = footer.leftButton as NavButton;
			});

			it("should set the device", (): Chai.Assertion => registrationController["device"].should.deep.equal(device));
			it("should display the device name", (): Chai.Assertion => String(deviceName.val()).should.equal(device.name));
			it("should set the footer label", (): Chai.Assertion => String(footer.label).should.equal("v1.0"));

			it("should attach a footer left button event handler", (): void => {
				(leftButton.eventHandler as Function)();
				registrationController["unregister"].should.have.been.called;
			});

			it("should set the footer left button style", (): Chai.Assertion => String(leftButton.style).should.equal("cautionButton"));
			it("should set the footer left button label", (): Chai.Assertion => leftButton.label.should.equal("Unregister"));
			it("should set the view footer", (): Chai.Assertion => appController.setFooter.should.have.been.called);

			afterEach((): JQuery<HTMLElement> => deviceName.remove());
		});
	});

	describe("unregister", (): void => {
		beforeEach((): void => {
			fakeServer = sinon.fakeServer.create({ respondImmediately: true });
			registrationController["device"] = device;
		});

		describe("fail", (): void => {
			it("should display a notice", (): void => {
				registrationController["unregister"]();
				appController.showNotice.should.have.been.calledWith({
					label: "Unregister failed: error, 404 (Not Found)",
					leftButton: {
						style: "cautionButton",
						label: "OK"
					}
				});
			});
		});

		describe("success", (): void => {
			beforeEach((): void => {
				fakeServer.respondWith("DELETE", /\/devices\/\w+/u, "");
				registrationController["unregister"]();
			});

			it("should remove the device", (): void => {
				String(SettingMock.setting.name).should.equal("Device");
				(null === SettingMock.setting.value).should.be.true;
				SettingMock.prototype.remove.should.have.been.called;
			});

			it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
		});

		afterEach((): void => fakeServer.restore());
	});

	describe("save", (): void => {
		let deviceName: JQuery<HTMLElement>;

		beforeEach((): void => {
			fakeServer = sinon.fakeServer.create({ respondImmediately: true });
			registrationController["device"] = device;
			deviceName = $("<input>")
				.attr("id", "deviceName")
				.val("new-device")
				.appendTo(document.body);
		});

		describe("fail", (): void => {
			beforeEach((): void => registrationController["save"]());

			it("should get the device name", (): Chai.Assertion => registrationController["device"].name.should.equal("new-device"));
			it("should display a notice", (): Chai.Assertion => appController.showNotice.should.have.been.calledWith({
				label: "Registration failed: error, 404 (Not Found)",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}));
		});

		describe("success", (): void => {
			beforeEach((): void => {
				fakeServer.respondWith("PUT", /\/devices\/\w+/u, [200, { Location: "new-device-id" },	""]);
				registrationController["save"]();
			});

			it("should get the device name", (): Chai.Assertion => registrationController["device"].name.should.equal("new-device"));
			it("should set the device id", (): Chai.Assertion => registrationController["device"].id.should.equal("new-device-id"));

			it("should save the device", (): void => {
				String(SettingMock.setting.name).should.equal("Device");
				String(SettingMock.setting.value).should.deep.equal(JSON.stringify(device));
				SettingMock.prototype.save.should.have.been.called;
			});

			it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
		});

		afterEach((): void => {
			deviceName.remove();
			fakeServer.restore();
		});
	});

	describe("cancel", (): void => {
		it("should pop the view", (): void => {
			registrationController["cancel"]();
			appController.popView.should.have.been.called;
		});
	});
});