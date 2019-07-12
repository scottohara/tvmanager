/**
 * @file (Services) DatabaseService
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module services/database-service
 */
import { TVManagerStore } from "stores";
import worker from "stores/worker";
import { wrap } from "comlink";

const	version = 1,
			{ connect, programsStore, seriesStore, episodesStore, settingsStore, syncsStore } = wrap(worker);

export default Promise.resolve((async (): Promise<TVManagerStore> => {
	await connect(version);

	return {
		programsStore,
		seriesStore,
		episodesStore,
		settingsStore,
		syncsStore,
		version
	};
})());