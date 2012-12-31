SettingMock = function(settingName, settingValue) {
	"use strict";

	this.settingValue = settingValue;
};

SettingMock.prototype.save = function() {
	"use strict";
};

SettingMock.setting = {};

SettingMock.get = function(settingName, callback) {
	"use strict";

	callback({
		settingValue: this.setting[settingName]
	});
};


