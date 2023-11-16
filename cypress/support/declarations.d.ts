declare namespace Cypress {
	interface Chainable {
		createTestData: (data: import("~/support/types").TestData) => void;
	}
}
