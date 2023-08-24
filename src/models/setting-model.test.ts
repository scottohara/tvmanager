import DatabaseServiceMock from "~/mocks/database-service-mock";
import Setting from "./setting-model";
import type { SinonStub } from "sinon";

describe("Setting", (): void => {
	let name: string,
			value: string,
			setting: Setting;

	beforeEach((): void => {
		name = "test-setting";
		value = "test-value";
		setting = new Setting(name, value);
	});

	describe("object constructor", (): void => {
		it("should return a Setting instance", (): Chai.Assertion => expect(setting).to.be.an.instanceOf(Setting));
		it("should set the setting name", (): Chai.Assertion => expect(String(setting["settingName"])).to.equal(name));
		it("should set the setting value", (): Chai.Assertion => expect(String(setting.settingValue)).to.equal(value));
	});

	describe("get", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).settingsStore.get as SinonStub).throws();
				setting = await Setting.get(name);
			});

			it("should attempt to get the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.get).to.have.been.calledWith(name));
			it("should return and undefined value", (): Chai.Assertion => expect(setting.settingValue).to.be.undefined);
		});

		describe("success", (): void => {
			describe("doesn't exist", (): void => {
				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).settingsStore.get as SinonStub).returns(undefined);
					setting = await Setting.get(name);
				});

				it("should attempt to get the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.get).to.have.been.calledWith(name));
				it("should return an undefined value", (): Chai.Assertion => expect(setting.settingValue).to.be.undefined);
			});

			describe("exists", (): void => {
				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).settingsStore.get as SinonStub).returns({ name, value });
					setting = await Setting.get(name);
				});

				it("should attempt to get the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.get).to.have.been.called);
				it("should return the setting value", (): Chai.Assertion => expect(String(setting.settingValue)).to.equal(value));
			});
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).settingsStore.get as SinonStub).reset());
	});

	describe("save", (): void => {
		let result: boolean;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).settingsStore.save as SinonStub).throws();
				result = await setting.save();
			});

			it("should attempt to save the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.save).to.have.been.calledWith(name, value));
			it("should return false", (): Chai.Assertion => expect(result).to.be.false);
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<boolean> => (result = await setting.save()));

			it("should attempt to save the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.save).to.have.been.calledWith(name, value));
			it("should return true", (): Chai.Assertion => expect(result).to.be.true);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).settingsStore.save as SinonStub).reset());
	});

	describe("remove", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).settingsStore.remove as SinonStub).throws();
				try {
					await setting.remove();
				} catch (_e: unknown) {
					// No op
				}
			});

			it("should attempt to remove the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.remove).to.have.been.calledWith(name));
			it("should not clear the setting name", (): Chai.Assertion => expect(String(setting["settingName"])).to.equal(name));
			it("should not clear the setting value", (): Chai.Assertion => expect(String(setting.settingValue)).to.equal(value));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => setting.remove());

			it("should attempt to remove the setting", async (): Promise<Chai.Assertion> => expect((await DatabaseServiceMock).settingsStore.remove).to.have.been.calledWith(name));
			it("should clear the setting name", (): Chai.Assertion => expect(setting["settingName"]).to.be.undefined);
			it("should clear the setting value", (): Chai.Assertion => expect(setting.settingValue).to.be.undefined);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).settingsStore.remove as SinonStub).reset());
	});
});