/**
 * @file (Services) DatabaseService
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module services/database-service
 */
import type {
	EpisodesStore,
	ProgramsStore,
	SeriesStore,
	SettingsStore,
	SyncsStore,
	TVManagerStore,
	TVManagerStoreProxy
} from "stores";
import type { Remote } from "comlink";
import worker from "stores/worker";
import { wrap } from "comlink";

const	version = 1,
			{ connect, programsStore, seriesStore, episodesStore, settingsStore, syncsStore }: Remote<TVManagerStoreProxy> = wrap(worker);

export default Promise.resolve((async (): Promise<TVManagerStore> => {
	await connect(version);

	return {
		programsStore: programsStore as unknown as ProgramsStore,
		seriesStore: seriesStore as unknown as SeriesStore,
		episodesStore: episodesStore as unknown as EpisodesStore,
		settingsStore: settingsStore as unknown as SettingsStore,
		syncsStore: syncsStore as unknown as SyncsStore,
		version
	};
})());