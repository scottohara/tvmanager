import type { EpisodeStatus } from "~/models";

Cypress.Commands.add("createIncompleteReportData", (): void => {
	cy.exec("bundle exec rake db:e2e:incomplete_report");
});

Cypress.Commands.add(
	"createStatusReportData",
	(status: EpisodeStatus): void => {
		cy.exec(`bundle exec rake db:e2e:status_report'[${status}]'`);
	},
);
