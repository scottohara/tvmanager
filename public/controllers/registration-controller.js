var RegistrationController = function () {
};

RegistrationController.prototype.setup = function() {
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

	Setting.get("Device", $.proxy(this.gotDevice, this));
};

RegistrationController.prototype.gotDevice = function(device) {
	if (device.settingValue) {
		this.device = $.parseJSON(device.settingValue);
		$("#deviceName").val(this.device.name);

		this.footer = {
			label: "v" + appController.db.version,
			leftButton: {
				eventHandler: $.proxy(this.unregister, this),
				style: "redButton",
				label: "Unregister"
			}
		};

		appController.setFooter();
	} else {
		this.device = {
			id: "",
			name: "",
			imported: false
		};
		appController.clearFooter();
	}
};

RegistrationController.prototype.unregister = function() {
	$.ajax({
		url: "/devices/" + this.device.id,
		context: this,
		type: "DELETE",
		success: function(unregisterResponse, status, jqXHR) {
			var device = new Setting("Device", null);
			device.remove();
			appController.popView();
		},
		error: function(request, statusText) {
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

RegistrationController.prototype.save = function() {
	this.device.name = $("#deviceName").val();
	$.ajax({
		url: "/devices/" + this.device.name,
		context: this,
		type: "PUT",
		headers: {
			"X-DEVICE-ID": this.device.id
		},
		success: function(registrationReponse, status, jqXHR) {
			this.device.id = jqXHR.getResponseHeader("Location");
			var device = new Setting("Device", JSON.stringify(this.device));
			device.save();
			appController.popView();
		},
		error: function(request, statusText) {
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

RegistrationController.prototype.cancel = function() {
	appController.popView();
};
