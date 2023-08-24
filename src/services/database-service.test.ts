import DatabaseService from "./database-service";
import type {	SinonSpyCall } from "sinon";
import type { TVManagerStore } from "~/stores";
import sinon from "sinon";
import worker from "~/mocks/worker-store-mock";
import { wrap } from "~/mocks/comlink-mock";

describe("DatabaseService", (): void => {
	let db: TVManagerStore,
			connectCalledWith: (version: number) => Promise<boolean>,
			wrapCall: SinonSpyCall;

	beforeEach(async (): Promise<void> => {
		wrapCall = wrap.firstCall;
		({ connectCalledWith } = wrap(worker) as { connectCalledWith: (version: number) => Promise<boolean>; });
		wrap.resetHistory();
		db = await DatabaseService;
	});

	it("should wrap the store worker", (): Chai.Assertion => expect(wrapCall).to.have.been.calledWith(sinon.match.instanceOf(Worker)));
	it("should connect to the stores", async (): Promise<Chai.Assertion> => expect(await connectCalledWith(db.version)).to.be.true);
	it("should export the programs store", async (): Promise<Chai.Assertion> => expect(String(await db.programsStore.name)).to.equal("ProgramsStoreMock"));
	it("should export the series store", async (): Promise<Chai.Assertion> => expect(String(await db.seriesStore.name)).to.equal("SeriesStoreMock"));
	it("should export the episodes store", async (): Promise<Chai.Assertion> => expect(String(await db.episodesStore.name)).to.equal("EpisodesStoreMock"));
	it("should export the settings store", async (): Promise<Chai.Assertion> => expect(String(await db.settingsStore.name)).to.equal("SettingsStoreMock"));
	it("should export the syncs store", async (): Promise<Chai.Assertion> => expect(String(await db.syncsStore.name)).to.equal("SyncsStoreMock"));
	it("should export the version", (): Chai.Assertion => expect(db.version).to.equal(1));
});