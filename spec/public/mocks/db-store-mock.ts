import { EpisodesStoreMock } from "~/mocks/episodes-store-mock";
import { ProgramsStoreMock } from "~/mocks/programs-store-mock";
import { SeriesStoreMock } from "~/mocks/series-store-mock";
import { SettingsStoreMock } from "~/mocks/settings-store-mock";
import { SyncsStoreMock } from "~/mocks/syncs-store-mock";
import type { TVManagerStoreProxy } from "~/stores";
import { expose } from "~/mocks/comlink-mock";
import sinon from "sinon";

const connect = sinon.stub(),
			storeProxy: TVManagerStoreProxy = {
				connect,
				programsStore: ProgramsStoreMock,
				seriesStore: SeriesStoreMock,
				episodesStore: EpisodesStoreMock,
				settingsStore: SettingsStoreMock,
				syncsStore: SyncsStoreMock
			};

// This is needed because we can't seem to expose a stub directly via Comlink
async function connectCalledWith(version: number): Promise<boolean> {
	return Promise.resolve(connect.calledWith(version));
}

expose({
	...storeProxy,
	connectCalledWith
});