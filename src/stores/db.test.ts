import * as EpisodesStore from "~/mocks/episodes-store-mock";
import * as ProgramsStore from "~/mocks/programs-store-mock";
import * as SeriesStore from "~/mocks/series-store-mock";
import * as SettingsStore from "~/mocks/settings-store-mock";
import * as SyncsStore from "~/mocks/syncs-store-mock";
import { connect, disconnect } from "./db";
import { deleteDB, openDB } from "idb";
import { expose } from "~/mocks/comlink-mock";
import sinon from "sinon";

describe("db", (): void => {
	it("should expose the connect function and stores to the main thread", (): Chai.Assertion =>
		expect(expose).to.have.been.calledWith({
			connect,
			programsStore: undefined,
			seriesStore: undefined,
			episodesStore: undefined,
			settingsStore: undefined,
			syncsStore: undefined,
		}));

	describe("connect", (): void => {
		const idbDb = sinon.match({
				createObjectStore: sinon.match.func,
				transaction: sinon.match.func,
				get: sinon.match.func,
			}),
			version = 2;

		beforeEach(async (): Promise<void> => deleteDB("tvmanager"));

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => connect(version));
			it("should create the programs store", (): Chai.Assertion =>
				expect(ProgramsStore.create).to.have.been.calledWith(idbDb));
			it("should create the series store", (): Chai.Assertion =>
				expect(SeriesStore.create).to.have.been.calledWith(idbDb));
			it("should create the episodes store", (): Chai.Assertion =>
				expect(EpisodesStore.create).to.have.been.calledWith(idbDb));
			it("should create the settings store", (): Chai.Assertion =>
				expect(SettingsStore.create).to.have.been.calledWith(idbDb));
			it("should create the syncs store", (): Chai.Assertion =>
				expect(SyncsStore.create).to.have.been.calledWith(idbDb));
		});

		describe("with full upgrade", (): void => {
			beforeEach(async (): Promise<void> => connect(version));
			it("should perform all migrations on the programs store", (): Chai.Assertion =>
				expect(ProgramsStore.upgradeTo[0].callCount).to.equal(version));
			it("should perform all migrations on the series store", (): Chai.Assertion =>
				expect(SeriesStore.upgradeTo[0].callCount).to.equal(version));
			it("should perform all migrations on the episodes store", (): Chai.Assertion =>
				expect(EpisodesStore.upgradeTo[0].callCount).to.equal(version));
			it("should perform all migrations on the settings store", (): Chai.Assertion =>
				expect(SettingsStore.upgradeTo[0].callCount).to.equal(version));
			it("should perform all migrations on the syncs store", (): Chai.Assertion =>
				expect(SyncsStore.upgradeTo[0].callCount).to.equal(version));
		});

		describe("with partial upgrade", (): void => {
			beforeEach(async (): Promise<void> => {
				const tempDb = await openDB("tvmanager", version - 1);

				tempDb.close();
				await connect(version);
			});

			it("should perform some migrations on the programs store", (): Chai.Assertion =>
				expect(ProgramsStore.upgradeTo[0].callCount).to.equal(version - 1));
			it("should perform some migrations on the series store", (): Chai.Assertion =>
				expect(SeriesStore.upgradeTo[0].callCount).to.equal(version - 1));
			it("should perform some migrations on the episodes store", (): Chai.Assertion =>
				expect(EpisodesStore.upgradeTo[0].callCount).to.equal(version - 1));
			it("should perform some migrations on the settings store", (): Chai.Assertion =>
				expect(SettingsStore.upgradeTo[0].callCount).to.equal(version - 1));
			it("should perform some migrations on the syncs store", (): Chai.Assertion =>
				expect(SyncsStore.upgradeTo[0].callCount).to.equal(version - 1));
		});

		describe("without upgrade", (): void => {
			beforeEach(async (): Promise<void> => {
				const tempDb = await openDB("tvmanager", version);

				tempDb.close();
				await connect(version);
			});

			it("should perform no migrations on the programs store", (): Chai.Assertion =>
				expect(ProgramsStore.upgradeTo[0]).to.not.have.been.called);
			it("should perform no migrations on the series store", (): Chai.Assertion =>
				expect(SeriesStore.upgradeTo[0]).to.not.have.been.called);
			it("should perform no migrations on the episodes store", (): Chai.Assertion =>
				expect(EpisodesStore.upgradeTo[0]).to.not.have.been.called);
			it("should perform no migrations on the settings store", (): Chai.Assertion =>
				expect(SettingsStore.upgradeTo[0]).to.not.have.been.called);
			it("should perform no migrations on the syncs store", (): Chai.Assertion =>
				expect(SyncsStore.upgradeTo[0]).to.not.have.been.called);
		});

		afterEach((): void => {
			disconnect();
			ProgramsStore.upgradeTo[0].reset();
			SeriesStore.upgradeTo[0].reset();
			EpisodesStore.upgradeTo[0].reset();
			SettingsStore.upgradeTo[0].reset();
			SyncsStore.upgradeTo[0].reset();
			ProgramsStore.create.reset();
			SeriesStore.create.reset();
			EpisodesStore.create.reset();
			SettingsStore.create.reset();
			SyncsStore.create.reset();
		});
	});
});
