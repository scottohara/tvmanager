define(
	() => {
		"use strict";

		const saveStub = sinon.stub(),
					removeStub = sinon.stub(),
					getStub = sinon.stub(),
					setting = {};

		class SettingMock {
			constructor(settingName, settingValue) {
				this.settingName = setting.name = settingName;
				this.settingValue = setting.value = settingValue;
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

		return SettingMock;
	}
);