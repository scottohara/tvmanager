module("registration-controller", {
	setup: function() {
		this.device = {
			id: 1,
			name: "test-device"
		};

		this.deviceName = $("<input>")
			.attr("id", "deviceName")
			.hide()
			.appendTo(document.body);

		this.ajaxMock = $.proxy(function(options) {
			options.error.apply(options.context, [{
				status: "404",
				statusText: "Not found"
			}, "Force failed"]);
		}, this);

		this.originalSetting = Setting;
		Setting = SettingMock;

		this.registrationController = new RegistrationController();
	},
	teardown: function() {
		this.deviceName.remove();
		Setting = this.originalSetting;
	}
});

test("setup", 3, function() {
	this.registrationController.cancel = function() {
		ok(true, "Bind back button event handler");
	};
	this.registrationController.save = function() {
		ok(true, "Bind save button event handler");
	};
	this.registrationController.gotDevice = $.proxy(function(device) {
		same($.parseJSON(device.settingValue), this.device, "Device");
	}, this);

	Setting.setting.Device = JSON.stringify(this.device);

	this.registrationController.setup();
	this.registrationController.header.leftButton.eventHandler();
	this.registrationController.header.rightButton.eventHandler();
});

test("gotDevice - unregistered", 2, function() {
	var device = {
		id: "",
		name: ""
	};

	appController.clearFooter = function() {
		ok(true, "Clear footer");
	};

	this.registrationController.gotDevice({}); 
	same(this.registrationController.device, device, "device property");
});

test("gotDevice - registered", 2, function() {
	var device = {
		settingValue: JSON.stringify(this.device)
	};

	this.registrationController.unregister = function() {
		ok(true, "Bind unregister button event handler");
	};

	this.registrationController.gotDevice(device);
	this.registrationController.footer.leftButton.eventHandler();
	equals(this.deviceName.val(), this.device.name, "Device");
});

test("unregister - ajax fail", 1, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.registrationController.device = this.device;
	this.registrationController.unregister();
	same(appController.notice.pop(), {
		label: "Unregister failed: Force failed, 404 (Not found)",
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	}, "Failure notice");

	$.ajax = originalAjax;
});

asyncTest("unregister - success", 2, function() {
	Setting.prototype.remove = function() {
		ok(true, "Setting removed");
	};

	var originalPopView = appController.popView;
	appController.popView = function() {
		originalPopView();
		start();
	};

	this.registrationController.device = this.device;
	this.registrationController.unregister();
});

test("save - ajax fail", 1, function() {
	var originalAjax = $.ajax;
	$.ajax = this.ajaxMock;

	this.registrationController.device = this.device;
	this.registrationController.save();
	same(appController.notice.pop(), {
		label: "Registration failed: Force failed, 404 (Not found)",
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	}, "Failure notice");

	$.ajax = originalAjax;
});

asyncTest("save - success", 3, function() {
	var that = this;
	Setting.prototype.save = function() {
		same($.parseJSON(this.settingValue), that.device, "settingValue property");
		ok(true, "Setting saved");
	};

	var originalPopView = appController.popView;
	appController.popView = function() {
		originalPopView();
		start();
	};

	this.deviceName.val(this.device.name);
	this.registrationController.device = this.device;
	this.registrationController.save();
});

test("cancel", 1, function() {
	this.registrationController.cancel();
});
