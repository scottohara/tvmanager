import Base from "../../../src/models/base-model";

describe("Base", (): void => {
	class TestModel extends Base {
		public constructor() {
			super();

			this.makeEnumerable("nonExistentProperty");
		}
	}

	let testModel: TestModel;

	beforeEach((): TestModel => (testModel = new TestModel()));

	describe("makeEnumerable", (): void => {
		it("should do nothing if the property doesn't exist", (): Chai.Assertion => (undefined === Object.getOwnPropertyDescriptor(testModel, "nonExistentProperty")).should.be.true);
	});
});
