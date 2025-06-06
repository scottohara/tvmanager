import type {
	NavButton,
	NavButtonEventHandler,
	ProgramListItem,
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import ProgramController from "~/controllers/program-controller";
import ProgramMock from "~/mocks/program-model-mock";
import ProgramView from "~/views/program-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("ProgramController", (): void => {
	let listItem: ProgramListItem, programController: ProgramController;

	beforeEach((): void => {
		listItem = { program: new ProgramMock(null, "test-program") };
		programController = new ProgramController(listItem);
	});

	describe("object constructor", (): void => {
		interface Scenario {
			description: string;
			listItem?: ProgramListItem;
			programController: ProgramController;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				listItem,
				programController,
			},
			{
				description: "add",
				listItem: { program: new ProgramMock(null, "") },
				programController: new ProgramController(),
			},
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					if (undefined === scenario.listItem) {
						scenario.listItem = listItem;
						scenario.programController = programController;
					}
				});

				it("should return a ProgramController instance", (): Chai.Assertion =>
					expect(programController).to.be.an.instanceOf(ProgramController));
				it("should set the list item", (): Chai.Assertion =>
					expect(
						String(scenario.programController["listItem"].program.programName),
					).to.equal(
						(scenario.listItem as ProgramListItem).program.programName,
					));
			});
		});
	});

	describe("view", (): void => {
		it("should return the program view", (): Chai.Assertion =>
			expect(programController.view).to.equal(ProgramView));
	});

	describe("setup", (): void => {
		let programName: HTMLInputElement,
			leftButton: NavButton,
			rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(programController, "cancel" as keyof ProgramController);
			sinon.stub(programController, "save" as keyof ProgramController);

			programName = document.createElement("input");
			programName.id = "programName";
			document.body.append(programName);

			await programController.setup();
			leftButton = programController.header.leftButton as NavButton;
			rightButton = programController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(programController.header.label)).to.equal(
				"Add/Edit Program",
			));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(programController["cancel"]).to.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(programController["save"]).to.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Save"));

		it("should set the program name", (): Chai.Assertion =>
			expect(programName.value).to.equal(listItem.program.programName));

		afterEach((): void => programName.remove());
	});

	describe("save", (): void => {
		let programName: string, programNameInput: HTMLInputElement;

		beforeEach((): void => {
			programName = "test-program-2";

			programNameInput = document.createElement("input");
			programNameInput.id = "programName";
			programNameInput.value = programName;
			document.body.append(programNameInput);
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => programController["save"]());

			it("should get the program name", (): Chai.Assertion =>
				expect(
					String(programController["listItem"].program.programName),
				).to.equal(programName));
			it("should save the program", (): Chai.Assertion =>
				expect(listItem.program.save).to.have.been.called);
			it("should pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.error = "save failed";
				await programController["save"]();
			});

			it("should get the program name", (): Chai.Assertion =>
				expect(
					String(programController["listItem"].program.programName),
				).to.equal(programName));
			it("should attempt to save the program", (): Chai.Assertion =>
				expect(listItem.program.save).to.have.been.called);
			it("should not pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.not.have.been.called);
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "save failed",
				}));

			afterEach((): null => (ProgramMock.error = null));
		});

		afterEach((): void => programNameInput.remove());
	});

	describe("cancel", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await programController["cancel"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	afterEach((): void => ProgramMock.reset());
});
