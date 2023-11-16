import { EpisodesStoreMock } from "~/mocks/episodes-store-mock";
import { ProgramsStoreMock } from "~/mocks/programs-store-mock";
import { SeriesStoreMock } from "~/mocks/series-store-mock";
import { SettingsStoreMock } from "~/mocks/settings-store-mock";
import { SyncsStoreMock } from "~/mocks/syncs-store-mock";

export default Promise.resolve({
	programsStore: ProgramsStoreMock,
	seriesStore: SeriesStoreMock,
	episodesStore: EpisodesStoreMock,
	settingsStore: SettingsStoreMock,
	syncsStore: SyncsStoreMock,
	version: 1,
});
