declare namespace Cypress {
	interface Chainable {
		login: () => void;
		createAboutData: () => void;
		createEpisodesData: () => void;
		createProgramsData: () => void;
		createIncompleteReportData: () => void;
		createStatusReportData: (status: import("~/models").EpisodeStatus) => void;
		createScheduleData: () => void;
		createSeriesData: () => void;
		createUnscheduledData: () => void;
	}
}
