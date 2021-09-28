import type { EpisodesStore } from "stores";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const migration = sinon.stub(),
			EpisodesStoreMock: EpisodesStore = {
				listBySeries: sinon.stub(),
				listByUnscheduled: sinon.stub(),
				find: sinon.stub(),
				totalCount: sinon.stub(),
				countByStatus: sinon.stub(),
				removeAll: sinon.stub(),
				save: sinon.stub(),
				remove: sinon.stub(),
				name: Promise.resolve("EpisodesStoreMock")
			},
			upgradeTo: SinonStub[] = [
				migration,
				migration
			],
			create: SinonStub = sinon.stub().returns(EpisodesStoreMock);

export { upgradeTo, create, EpisodesStoreMock };