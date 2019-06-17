import {
	NavButton,
	ProgramListItem
} from "controllers";
import $ from "jquery";
import ApplicationControllerMock from "mocks/application-controller-mock";
import ProgramController from "controllers/program-controller";
import ProgramMock from "mocks/program-model-mock";
import ProgramView from "views/program-view.html";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

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
			programController?: ProgramController;
		}

		const scenarios: Scenario[] = [
			{
				description: "update"
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
					listItem = scenario.listItem || listItem;
					programController = scenario.programController || programController;
				});

				it("should return a ProgramController instance", (): Chai.Assertion => programController.should.be.an.instanceOf(ProgramController));
				it("should set the list item", (): Chai.Assertion => String(programController["listItem"].program.programName).should.equal(listItem.program.programName));
			});
		});
	});

	describe("view", (): void => {
		it("should return the program view", (): Chai.Assertion => programController.view.should.equal(ProgramView));
	});

	describe("setup", (): void => {
		let programName: JQuery<HTMLElement>,
				leftButton: NavButton,
				rightButton: NavButton;

		beforeEach((): void => {
			sinon.stub(programController, "cancel" as keyof ProgramController);
			sinon.stub(programController, "save" as keyof ProgramController);

			programName = $("<input>")
				.attr("id", "programName")
				.appendTo(document.body);

			programController.setup();
			leftButton = programController.header.leftButton as NavButton;
			rightButton = programController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(programController.header.label).should.equal("Add/Edit Program"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			programController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as Function)();
			programController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));

		it("should set the program name", (): Chai.Assertion => String(programName.val()).should.equal(listItem.program.programName));

		afterEach((): JQuery<HTMLElement> => programName.remove());
	});

	describe("save", (): void => {
		let programName: string,
				programNameInput: JQuery<HTMLElement>;

		beforeEach((): void => {
			programName = "test-program-2";

			programNameInput = $("<input>")
				.attr("id", "programName")
				.val(programName)
				.appendTo(document.body);

			programController["save"]();
		});

		it("should get the program name", (): Chai.Assertion => programController["listItem"].program.setProgramName.should.have.been.calledWith(programName));
		it("should save the program", (): Chai.Assertion => listItem.program.save.should.have.been.called);
		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);

		afterEach((): JQuery<HTMLElement> => programNameInput.remove());
	});

	describe("cancel", (): void => {
		it("should pop the view", (): void => {
			programController["cancel"]();
			appController.popView.should.have.been.called;
		});
	});
});