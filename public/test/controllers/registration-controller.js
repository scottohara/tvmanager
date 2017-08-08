define(
	[
		"models/setting-model",
		"controllers/registration-controller",
		"controllers/application-controller",
		"framework/jquery"
	],

	(Setting, RegistrationController, ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("RegistrationController", () => {
			let device,
					registrationController,
					fakeServer;

			beforeEach(() => {
				device = {
					id: 1,
					name: "test-device",
					imported: true
				};

				registrationController = new RegistrationController();
			});

			describe("object constructor", () => {
				it("should return a RegistrationController instance", () => registrationController.should.be.an.instanceOf(RegistrationController));
			});

			describe("setup", () => {
				beforeEach(() => {
					sinon.stub(registrationController, "cancel");
					sinon.stub(registrationController, "save");
					sinon.stub(registrationController, "gotDevice");
					Setting.get.reset();
					Setting.get.withArgs("Device").yields({settingValue: device});
					registrationController.setup();
				});

				it("should set the header label", () => registrationController.header.label.should.equal("Register"));

				it("should attach a header left button event handler", () => {
					registrationController.header.leftButton.eventHandler();
					registrationController.cancel.should.have.been.called;
				});

				it("should set the header left button label", () => registrationController.header.leftButton.label.should.equal("Cancel"));

				it("should attach a header right button event handler", () => {
					registrationController.header.rightButton.eventHandler();
					registrationController.save.should.have.been.called;
				});

				it("should set the header right button style", () => registrationController.header.rightButton.style.should.equal("confirmButton"));
				it("should set the header right button label", () => registrationController.header.rightButton.label.should.equal("Save"));
				it("should get the device", () => registrationController.gotDevice.should.have.been.calledWith({settingValue: device}));
			});

			describe("gotDevice", () => {
				describe("unregistered", () => {
					beforeEach(() => registrationController.gotDevice());

					it("should set an empty device", () => registrationController.device.should.deep.equal({
						id: "",
						name: "",
						imported: false
					}));

					it("should clear the view footer", () => appController.clearFooter.should.have.been.called);
				});

				describe("registered", () => {
					let deviceName;

					beforeEach(() => {
						sinon.stub(registrationController, "unregister");

						deviceName = $("<input>")
							.attr("id", "deviceName")
							.appendTo(document.body);

						registrationController.gotDevice({settingValue: JSON.stringify(device)});
					});

					it("should set the device", () => registrationController.device.should.deep.equal(device));
					it("should display the device name", () => deviceName.val().should.equal(device.name));
					it("should set the footer label", () => registrationController.footer.label.should.equal("v1.0"));

					it("should attach a footer left button event handler", () => {
						registrationController.footer.leftButton.eventHandler();
						registrationController.unregister.should.have.been.called;
					});

					it("should set the footer left button style", () => registrationController.footer.leftButton.style.should.equal("cautionButton"));
					it("should set the footer left button label", () => registrationController.footer.leftButton.label.should.equal("Unregister"));
					it("should set the view footer", () => appController.setFooter.should.have.been.called);

					afterEach(() => deviceName.remove());
				});
			});

			describe("unregister", () => {
				beforeEach(() => {
					fakeServer = sinon.fakeServer.create();
					fakeServer.respondImmediately = true;
					registrationController.device = device;
				});

				describe("fail", () => {
					it("should display a notice", () => {
						registrationController.unregister();
						appController.showNotice.should.have.been.calledWith({
							label: "Unregister failed: error, 404 (Not Found)",
							leftButton: {
								style: "cautionButton",
								label: "OK"
							}
						});
					});
				});

				describe("success", () => {
					beforeEach(() => {
						fakeServer.respondWith("DELETE", /\/devices\/\w+/, "");
						registrationController.unregister();
					});

					it("should remove the device", () => {
						Setting.setting.name.should.equal("Device");
						(null === Setting.setting.value).should.be.true;
						Setting.prototype.remove.should.have.been.called;
					});

					it("should pop the view", () => appController.popView.should.have.been.called);
				});

				afterEach(() => fakeServer.restore());
			});

			describe("save", () => {
				let deviceName;

				beforeEach(() => {
					fakeServer = sinon.fakeServer.create();
					fakeServer.respondImmediately = true;
					registrationController.device = device;
					deviceName = $("<input>")
						.attr("id", "deviceName")
						.val("new-device")
						.appendTo(document.body);
				});

				describe("fail", () => {
					beforeEach(() => registrationController.save());

					it("should get the device name", () => registrationController.device.name.should.equal("new-device"));
					it("should display a notice", () => appController.showNotice.should.have.been.calledWith({
						label: "Registration failed: error, 404 (Not Found)",
						leftButton: {
							style: "cautionButton",
							label: "OK"
						}
					}));
				});

				describe("success", () => {
					beforeEach(() => {
						fakeServer.respondWith("PUT", /\/devices\/\w+/, [200, {Location: "new-device-id"},	""]);
						registrationController.save();
					});

					it("should get the device name", () => registrationController.device.name.should.equal("new-device"));
					it("should set the device id", () => registrationController.device.id.should.equal("new-device-id"));

					it("should save the device", () => {
						Setting.setting.name.should.equal("Device");
						Setting.setting.value.should.deep.equal(JSON.stringify(device));
						Setting.prototype.save.should.have.been.called;
					});

					it("should pop the view", () => appController.popView.should.have.been.called);
				});

				afterEach(() => {
					deviceName.remove();
					fakeServer.restore();
				});
			});

			describe("cancel", () => {
				it("should pop the view", () => {
					registrationController.cancel();
					appController.popView.should.have.been.called;
				});
			});
		});
	}
);