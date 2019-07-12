import sinon, { SinonStub } from "sinon";
import { SeriesStore } from "stores";

const migration = sinon.stub(),
			SeriesStoreMock: SeriesStore = {
				listByProgram: sinon.stub(),
				listByNowShowing: sinon.stub(),
				listByStatus: sinon.stub(),
				listByIncomplete: sinon.stub(),
				find: sinon.stub(),
				count: sinon.stub(),
				removeAll: sinon.stub(),
				save: sinon.stub(),
				remove: sinon.stub(),
				name: Promise.resolve("SeriesStoreMock")
			},
			upgradeTo: SinonStub[] = [
				migration,
				migration
			],
			create: SinonStub = sinon.stub().returns(SeriesStoreMock);

export { upgradeTo, create, SeriesStoreMock };