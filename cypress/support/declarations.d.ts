
declare namespace Cypress {
	interface Chainable {
		createTestData: (data: import("types").TestData) => void;
	}
}