import Base from "models/base-model";

export default class Setting extends Base {
	public constructor(private settingName?: string,
						public settingValue?: string) {
		super();
	}

	public static async get(settingName: string): Promise<Setting> {
		let name: string | undefined,
				value: string | undefined;

		try {
			const persistedSetting = await (await this.db).settingsStore.get(settingName);

			if (undefined !== persistedSetting) {
				({ name, value } = persistedSetting);
			}
		} catch {
			// No op
		}

		return new Setting(name, value);
	}

	public async save(): Promise<boolean> {
		try {
			await (await this.db).settingsStore.save(String(this.settingName), String(this.settingValue));

			return true;
		} catch {
			return false;
		}
	}

	public async remove(): Promise<void> {
		await (await this.db).settingsStore.remove(String(this.settingName));

		// Clear the instance properties
		this.settingName = undefined;
		this.settingValue = undefined;
	}
}