const saveStub = sinon.stub(),
			removeStub = sinon.stub(),
			getStub = sinon.stub(),
			setting = {};

export default class SettingMock {
	constructor(settingName, settingValue) {
		setting.name = settingName;
		setting.value = settingValue;
		this.settingName = settingName;
		this.settingValue = settingValue;
		saveStub.reset();
		removeStub.reset();
	}

	get save() {
		return saveStub;
	}

	get remove() {
		return removeStub;
	}

	static get setting() {
		return setting;
	}

	static get "get"() {
		return getStub;
	}
}