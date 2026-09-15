import type { EpisodeStatus } from "~/models";

Cypress.Commands.add(
	"createIncompleteReportData",
	(): Cypress.Chainable => cy.task("createData", "incomplete_report"),
);

Cypress.Commands.add(
	"createStatusReportData",
	(status: EpisodeStatus): Cypress.Chainable =>
		cy.task("createData", `status_report[${status}]`),
);
