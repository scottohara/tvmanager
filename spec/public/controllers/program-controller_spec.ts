import type {
	NavButton,
	NavButtonEventHandler,
	ProgramListItem
} from "controllers";
import ApplicationControllerMock from "mocks/application-controller-mock";
import ProgramController from "controllers/program-controller";
import ProgramMock from "mocks/program-model-mock";
import ProgramView from "views/program-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("ProgramController", (): void => {
	let listItem: ProgramListItem,
			programController: ProgramController;

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
				programController
			},
			{
				description: "add",
				listItem: { program: new ProgramMock(null, "") },
				programController: new ProgramController()
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					if (undefined === scenario.listItem) {
						scenario.listItem = listItem;
						scenario.programController = programController;
					}
				});

				it("should return a ProgramController instance", (): Chai.Assertion => programController.should.be.an.instanceOf(ProgramController));
				it("should set the list item", (): Chai.Assertion => String(scenario.programController["listItem"].program.programName).should.equal((scenario.listItem as ProgramListItem).program.programName));
			});
		});
	});

	describe("view", (): void => {
		it("should return the program view", (): Chai.Assertion => programController.view.should.equal(ProgramView));
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

		it("should set the header label", (): Chai.Assertion => String(programController.header.label).should.equal("Add/Edit Program"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			programController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			programController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));

		it("should set the program name", (): Chai.Assertion => programName.value.should.equal(listItem.program.programName));

		afterEach((): void => programName.remove());
	});

	describe("save", (): void => {
		let programName: string,
				programNameInput: HTMLInputElement;

		beforeEach(async (): Promise<void> => {
			programName = "test-program-2";

			programNameInput = document.createElement("input");
			programNameInput.id = "programName";
			programNameInput.value = programName;
			document.body.append(programNameInput);

			await programController["save"]();
		});

		it("should get the program name", (): Chai.Assertion => String(programController["listItem"].program.programName).should.equal(programName));
		it("should save the program", (): Chai.Assertion => listItem.program.save.should.have.been.called);
		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);

		afterEach((): void => programNameInput.remove());
	});

	describe("cancel", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await programController["cancel"]();
			appController.popView.should.have.been.called;
		});
	});
});