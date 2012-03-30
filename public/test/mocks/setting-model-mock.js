SettingMock = function(settingName, settingValue) {
	this.settingValue = settingValue;
};

SettingMock.prototype.save = function() {
};

SettingMock.setting = {};

SettingMock.get = function(settingName, callback) {
	callback({
		settingValue: this.setting[settingName]
	});
};


