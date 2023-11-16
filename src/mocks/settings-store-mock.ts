import type { SettingsStore } from "~/stores";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const migration = sinon.stub(),
	SettingsStoreMock: SettingsStore = {
		get: sinon.stub(),
		save: sinon.stub(),
		remove: sinon.stub(),
		name: Promise.resolve("SettingsStoreMock"),
	},
	upgradeTo: SinonStub[] = [migration, migration],
	create: SinonStub = sinon.stub().returns(SettingsStoreMock);

export { upgradeTo, create, SettingsStoreMock };
