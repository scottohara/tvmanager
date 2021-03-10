import * as EpisodesStoreFactory from "stores/episodes";
import * as ProgramsStoreFactory from "stores/programs";
import * as SeriesStoreFactory from "stores/series";
import * as SettingsStoreFactory from "stores/settings";
import * as SyncsStoreFactory from "stores/syncs";
import {
	IDBPDatabase,
	IDBPTransaction,
	openDB
} from "idb";
import {
	Progress,
	TestData
} from "types";
import { TVManagerDB } from "stores";

export const headerLabel = "#headerLabel";
export const headerLeftButton = "#headerLeftButton";
export const headerRightButton = "#headerRightButton";

export const nowLoading = "#nowLoading";
export const content = "#content";
export const list = "#list";
export const listItems = `${list} > li`;
export const firstListItem = `${listItems}:first-of-type`;
export const secondListItem = `${listItems}:nth-of-type(2)`;
export const thirdListItem = `${listItems}:nth-of-type(3)`;
export const fourthListItem = `${listItems}:nth-of-type(4)`;
export const fifthListItem = `${listItems}:nth-of-type(5)`;
export const lastListItem = `${listItems}:last-of-type`;
export const listItem = "a";
export const listItemSubText = `${listItem} > div.subText`;
export const index = "#index";

export const footerLabel = "#footerLabel";
export const footerLeftButton = "#footerLeftButton";
export const footerRightButton = "#footerRightButton";

export const notices = "#notices";
export const dismissNoticeButton = "#notices > div.notice > a:first-of-type";

const progressBar = `${listItem} > div.progressBar`,
			progressTotal = `${progressBar} div.total`,
			progressWatched = `${progressBar} div.watched`,
			progressRecorded = `${progressBar} div.recorded`,
			progressExpected = `${progressBar} div.expected`,
			progressMissed = `${progressBar} div.missed`;

export function checkGroup(group: HTMLLIElement, label: string): void {
	cy.wrap(group).should("have.class", "group");
	cy.wrap(group).should("have.text", label);
}

export function checkProgress({ watched = 0, recorded = 0, expected = 0, missed = 0, noStatus = 0 }: Progress = {}): void {
	const total = watched + recorded + expected + missed + noStatus;

	if (total > 0) {
		cy.get(progressTotal).should("have.text", total);
	} else {
		cy.get(progressBar).should("not.exist");
		cy.get(progressTotal).should("not.exist");
	}

	if (watched > 0) {
		cy.get(progressWatched).should("have.text", watched);
	} else {
		cy.get(progressWatched).should("not.exist");
	}

	if (recorded > 0) {
		cy.get(progressRecorded).should("have.text", recorded);
	} else {
		cy.get(progressRecorded).should("not.exist");
	}

	if (expected > 0) {
		cy.get(progressExpected).should("have.text", expected);
	} else {
		cy.get(progressExpected).should("not.exist");
	}

	if (missed > 0) {
		cy.get(progressMissed).should("have.text", missed);
	} else {
		cy.get(progressMissed).should("not.exist");
	}
}

Cypress.Commands.add("createTestData", ({ programs = [], settings = [] }: TestData): void => {
	cy.window().then(async (): Promise<void> => {
		const db = await openDB<TVManagerDB>("tvmanager", 1, {
						upgrade(database: IDBPDatabase<TVManagerDB>, oldVersion: number, newVersion: number | null, transaction: IDBPTransaction<TVManagerDB>): void {
							for (let version: number = oldVersion; version < Number(newVersion); version++) {
								ProgramsStoreFactory.upgradeTo[version](database, transaction);
								SeriesStoreFactory.upgradeTo[version](database, transaction);
								EpisodesStoreFactory.upgradeTo[version](database, transaction);
								SyncsStoreFactory.upgradeTo[version](database, transaction);
								SettingsStoreFactory.upgradeTo[version](database, transaction);
							}
						}
					}),
					programsStore = ProgramsStoreFactory.create(db),
					seriesStore = SeriesStoreFactory.create(db),
					episodesStore = EpisodesStoreFactory.create(db),
					syncsStore = SyncsStoreFactory.create(db),
					settingsStore = SettingsStoreFactory.create(db);

		await Promise.all([programsStore.removeAll(), seriesStore.removeAll(), episodesStore.removeAll(), syncsStore.removeAll(), settingsStore.remove("LastSyncTime")]);
		await Promise.all(settings.filter(({ value }): boolean => "" === value).map(async ({ name }): Promise<void> => settingsStore.remove(name)));
		await Promise.all(settings.filter(({ value }): boolean => "" !== value).map(async ({ name, value }): Promise<string> => settingsStore.save(name, value)));

		programs.forEach(async ({ programName, series }, programIndex): Promise<void> => {
			const programId = String(programIndex);

			await programsStore.save({
				ProgramID: programId,
				Name: undefined === programName ? `Program ${programIndex}` : programName
			});

			series.forEach(async ({ seriesName, nowShowing, episodes }, seriesIndex): Promise<void> => {
				const seriesId = `${programId}-${seriesIndex}`;

				await seriesStore.save({
					SeriesID: seriesId,
					Name: undefined === seriesName ? `Series ${seriesIndex}` : seriesName,
					NowShowing: undefined === nowShowing ? null : nowShowing,
					ProgramID: programId
				});

				episodes.forEach(async ({ episodeName, status = "", statusDate = "", unverified = "false", unscheduled = "false" }, episodeIndex): Promise<void> => {
					await episodesStore.save({
						EpisodeID: `${seriesId}-${episodeIndex}`,
						Name: undefined === episodeName ? `Episode ${episodeIndex}` : episodeName,
						SeriesID: seriesId,
						Status: status,
						StatusDate: statusDate,
						Unverified: unverified,
						Unscheduled: unscheduled,
						Sequence: episodeIndex
					});
				});
			});
		});
	});
});