import type { ProgramsStore } from "stores";
import type { SinonStub } from "sinon";
import sinon from "sinon";

const migration = sinon.stub(),
			ProgramsStoreMock: ProgramsStore = {
				list: sinon.stub(),
				find: sinon.stub(),
				count: sinon.stub(),
				removeAll: sinon.stub(),
				save: sinon.stub(),
				remove: sinon.stub(),
				name: Promise.resolve("ProgramsStoreMock")
			},
			upgradeTo: SinonStub[] = [
				migration,
				migration
			],
			create: SinonStub = sinon.stub().returns(ProgramsStoreMock);

export { upgradeTo, create, ProgramsStoreMock };