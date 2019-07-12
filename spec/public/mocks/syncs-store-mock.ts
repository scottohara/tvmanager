import sinon, { SinonStub } from "sinon";
import { SyncsStore } from "stores";

const migration = sinon.stub(),
			SyncsStoreMock: SyncsStore = {
				list: sinon.stub(),
				count: sinon.stub(),
				removeAll: sinon.stub(),
				remove: sinon.stub(),
				name: Promise.resolve("SyncsStoreMock")
			},
			upgradeTo: SinonStub[] = [
				migration,
				migration
			],
			create: SinonStub = sinon.stub().returns(SyncsStoreMock);

export { upgradeTo, create, SyncsStoreMock };
