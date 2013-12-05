define(
	[
		'models/setting-model',
		'controllers/registration-controller',
		'controllers/application-controller',
		'framework/jquery',
		'test/framework/qunit',
		'test/mocks/jQuery-mock'
	],

	function(Setting, RegistrationController, ApplicationController, $, QUnit, jQueryMock) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("registration-controller", {
			setup: function() {
				this.device = {
					id: 1,
					name: "test-device",
					imported: true
				};

				this.sandbox = jQueryMock.sandbox(QUnit.config.current.testNumber);
				$("<input>")
					.attr("id", "deviceName")
					.appendTo(this.sandbox);

				this.ajaxMock = $.proxy(function(options) {
					options.error.apply(options.context, [{
						status: "404",
						statusText: "Not found"
					}, "Force failed"]);
				}, this);

				this.registrationController = new RegistrationController();
			},
			teardown: function() {
				this.sandbox.remove();
			}
		});

		QUnit.test("setup", 3, function() {
			this.registrationController.cancel = function() {
				QUnit.ok(true, "Bind back button event handler");
			};
			this.registrationController.save = function() {
				QUnit.ok(true, "Bind save button event handler");
			};
			this.registrationController.gotDevice = $.proxy(function(device) {
				QUnit.deepEqual($.parseJSON(device.settingValue), this.device, "Device");
			}, this);

			Setting.setting.Device = JSON.stringify(this.device);

			this.registrationController.setup();
			this.registrationController.header.leftButton.eventHandler();
			this.registrationController.header.rightButton.eventHandler();
		});

		QUnit.test("gotDevice - unregistered", 2, function() {
			var device = {
				id: "",
				name: "",
				imported: false
			};

			var originalClearFooter = appController.clearFooter;
			appController.clearFooter = function() {
				QUnit.ok(true, "Clear footer");
			};

			this.registrationController.gotDevice({}); 
			QUnit.deepEqual(this.registrationController.device, device, "device property");
			appController.clearFooter = originalClearFooter;
		});

		QUnit.test("gotDevice - registered", 2, function() {
			var device = {
				settingValue: JSON.stringify(this.device)
			};

			this.registrationController.unregister = function() {
				QUnit.ok(true, "Bind unregister button event handler");
			};

			jQueryMock.setDefaultContext(this.sandbox);
			this.registrationController.gotDevice(device);
			this.registrationController.footer.leftButton.eventHandler();
			QUnit.equal($("#deviceName").val(), this.device.name, "Device");
			jQueryMock.clearDefaultContext();
		});

		QUnit.test("unregister - ajax fail", 1, function() {
			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.registrationController.device = this.device;
			this.registrationController.unregister();
			QUnit.deepEqual(appController.notice.pop(), {
				label: "Unregister failed: Force failed, 404 (Not found)",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}, "Failure notice");

			$.ajax = originalAjax;
		});

		QUnit.asyncTest("unregister - success", 2, function() {
			var originalSettingRemove = Setting.prototype.remove;
			Setting.prototype.remove = function() {
				Setting.prototype.remove = originalSettingRemove;
				QUnit.ok(true, "Setting removed");
			};

			var originalPopView = appController.popView;
			appController.popView = function() {
				appController.popView = originalPopView;
				originalPopView();
				QUnit.start();
			};

			this.registrationController.device = this.device;
			this.registrationController.unregister();
		});

		QUnit.test("save - ajax fail", 1, function() {
			var originalAjax = $.ajax;
			$.ajax = this.ajaxMock;

			this.registrationController.device = this.device;
			this.registrationController.save();
			QUnit.deepEqual(appController.notice.pop(), {
				label: "Registration failed: Force failed, 404 (Not found)",
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			}, "Failure notice");

			$.ajax = originalAjax;
		});

		QUnit.asyncTest("save - success", 3, function() {
			var that = this;

			var originalSettingSave = Setting.prototype.save;
			Setting.prototype.save = function() {
				Setting.prototype.save = originalSettingSave;
				QUnit.deepEqual($.parseJSON(this.settingValue), that.device, "settingValue property");
				QUnit.ok(true, "Setting saved");
			};

			var originalPopView = appController.popView;
			appController.popView = function() {
				jQueryMock.clearDefaultContext();
				appController.popView = originalPopView;
				originalPopView();
				QUnit.start();
			};

			jQueryMock.setDefaultContext(this.sandbox);
			$("#deviceName").val(this.device.name);
			this.registrationController.device = this.device;
			this.registrationController.save();
		});

		QUnit.test("cancel", 1, function() {
			this.registrationController.cancel();
		});
	}
);
