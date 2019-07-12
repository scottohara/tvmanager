import sinon, {	SinonSpyCall } from "sinon";
import DatabaseService from "../../../src/services/database-service";
import { TVManagerStore } from "stores";
import worker from "mocks/worker-store-mock";
import { wrap } from "mocks/comlink-mock";

describe("DatabaseService", (): void => {
	let db: TVManagerStore,
			connectCalledWith: (version: number) => Promise<boolean>,
			wrapCall: SinonSpyCall;

	beforeEach(async (): Promise<void> => {
		wrapCall = wrap.firstCall;
		({ connectCalledWith } = wrap(worker));
		wrap.resetHistory();
		db = await DatabaseService;
	});

	it("should wrap the store worker", (): Chai.Assertion => wrapCall.should.have.been.calledWith(sinon.match.instanceOf(Worker)));
	it("should connect to the stores", async (): Promise<Chai.Assertion> => (await connectCalledWith(db.version)).should.be.true);
	it("should export the programs store", async (): Promise<Chai.Assertion> => String(await db.programsStore.name).should.equal("ProgramsStoreMock"));
	it("should export the series store", async (): Promise<Chai.Assertion> => String(await db.seriesStore.name).should.equal("SeriesStoreMock"));
	it("should export the episodes store", async (): Promise<Chai.Assertion> => String(await db.episodesStore.name).should.equal("EpisodesStoreMock"));
	it("should export the settings store", async (): Promise<Chai.Assertion> => String(await db.settingsStore.name).should.equal("SettingsStoreMock"));
	it("should export the syncs store", async (): Promise<Chai.Assertion> => String(await db.syncsStore.name).should.equal("SyncsStoreMock"));
	it("should export the version", (): Chai.Assertion => db.version.should.equal(1));
});