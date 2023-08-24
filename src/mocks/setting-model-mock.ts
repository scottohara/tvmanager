import type { SinonStub } from "sinon";
import sinon from "sinon";

interface Setting {
	name?: string;
	value?: string;
}

const saveStub = sinon.stub(),
			removeStub = sinon.stub(),
			getStub = sinon.stub(),
			setting: Setting = {};

export default class SettingMock {
	public constructor(public readonly settingName?: string,
						public readonly settingValue?: string) {
		setting.name = this.settingName;
		setting.value = this.settingValue;
		saveStub.reset();
		removeStub.reset();
	}

	public static get setting(): Setting {
		return setting;
	}

	public static get "get"(): SinonStub<string[], SettingMock> {
		return getStub;
	}

	public get save(): SinonStub<unknown[], Promise<boolean>> {
		return saveStub;
	}

	public get remove(): SinonStub<unknown[], Promise<void>> {
		return removeStub;
	}
}