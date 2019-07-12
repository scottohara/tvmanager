import sinon, { SinonStub } from "sinon";
import { SettingsStore } from "stores";

const migration = sinon.stub(),
			SettingsStoreMock: SettingsStore = {
				get: sinon.stub(),
				save: sinon.stub(),
				remove: sinon.stub(),
				name: Promise.resolve("SettingsStoreMock")
			},
			upgradeTo: SinonStub[] = [
				migration,
				migration
			],
			create: SinonStub = sinon.stub().returns(SettingsStoreMock);

export { upgradeTo, create, SettingsStoreMock };