import sinon, { SinonStub } from "sinon";
import { SaveCallback } from "models";

interface Setting {
	name?: string | null;
	value?: string | null;
}

const saveStub: SinonStub = sinon.stub(),
			removeStub: SinonStub = sinon.stub(),
			getStub: SinonStub = sinon.stub(),
			setting: Setting = {};

export default class SettingMock {
	public constructor(public readonly settingName: string | null,
						public readonly settingValue: string | null) {
		setting.name = this.settingName;
		setting.value = this.settingValue;
		saveStub.reset();
		removeStub.reset();
	}

	public get save(): SinonStub<SaveCallback[], void> {
		return saveStub;
	}

	public get remove(): SinonStub<void[], void> {
		return removeStub;
	}

	public static get setting(): Setting {
		return setting;
	}

	public static get "get"(): SinonStub<string[], void> {
		return getStub;
	}
}