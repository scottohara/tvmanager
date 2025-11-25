import type {
	NavButton,
	NavButtonEventHandler,
	SeriesListItem,
} from "~/controllers";
import sinon, { type SinonStub } from "sinon";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import ProgramMock from "~/mocks/program-model-mock";
import SeriesController from "~/controllers/series-controller";
import SeriesMock from "~/mocks/series-model-mock";
import SeriesView from "~/views/series-view.html";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("SeriesController", (): void => {
	let listItem: SeriesListItem, seriesController: SeriesController;

	beforeEach((): void => {
		listItem = {
			listIndex: 0,
			series: new SeriesMock(null, "test-series", 1, 1),
		};

		seriesController = new SeriesController(listItem);
	});

	describe("object constructor", (): void => {
		describe("update", (): void => {
			it("should return a SeriesController instance", (): Chai.Assertion =>
				expect(seriesController).to.be.an.instanceOf(SeriesController));
			it("should set the list item", (): Chai.Assertion =>
				expect(seriesController["listItem"]).to.deep.equal(listItem));
			it("should save the original now showing", (): Chai.Assertion =>
				expect(Number(seriesController["originalNowShowing"])).to.equal(
					listItem.series.nowShowing,
				));
			it("should save the original program id", (): Chai.Assertion =>
				expect(seriesController["originalProgramId"]).to.equal(
					listItem.series.programId,
				));
		});

		describe("add", (): void => {
			let seriesListItem: SeriesListItem;

			beforeEach((): void => {
				seriesListItem = {
					series: new SeriesMock(null, "", null, 1),
					sequence: 1,
					program: new ProgramMock(1, "test-program"),
				};
				seriesController = new SeriesController(seriesListItem);
			});

			it("should return a SeriesController instance", (): Chai.Assertion =>
				expect(seriesController).to.be.an.instanceOf(SeriesController));

			it("should create a list item", (): void => {
				expect(seriesController["listItem"].series.seriesName).to.equal(
					`Series ${Number(seriesListItem.sequence) + 1}`,
				);
				expect(seriesController["listItem"].series.programId).to.equal(
					(seriesListItem.program as ProgramMock).id,
				);
				expect(
					String(seriesController["listItem"].series.programName),
				).to.equal((seriesListItem.program as ProgramMock).programName);
			});
		});
	});

	describe("view", (): void => {
		it("should return the series view", (): Chai.Assertion =>
			expect(seriesController.view).to.equal(SeriesView));
	});

	describe("setup", (): void => {
		let seriesName: HTMLInputElement,
			nowShowing: HTMLSelectElement,
			moveTo: HTMLSelectElement,
			leftButton: NavButton,
			rightButton: NavButton,
			programs: [number, string][],
			programList: ProgramMock[];

		beforeEach((): void => {
			sinon.stub(seriesController, "cancel" as keyof SeriesController);
			sinon.stub(seriesController, "save" as keyof SeriesController);

			seriesName = document.createElement("input");
			seriesName.id = "seriesName";

			nowShowing = document.createElement("select");
			nowShowing.id = "nowShowing";

			const option = document.createElement("option");

			option.value = String(listItem.series.nowShowing);
			nowShowing.append(document.createElement("option"), option);

			moveTo = document.createElement("select");
			moveTo.id = "moveTo";

			document.body.append(seriesName, nowShowing, moveTo);

			programs = [
				[1, "program 1"],
				[2, "program 2"],
			];

			programList = programs.map(
				([id, name]: [number, string]): ProgramMock =>
					new ProgramMock(id, name),
			);
		});

		describe("now showing", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.programs = programList;
				await seriesController.setup();
				leftButton = seriesController.header.leftButton as NavButton;
				rightButton = seriesController.header.rightButton as NavButton;
			});

			it("should set the header label", (): Chai.Assertion =>
				expect(String(seriesController.header.label)).to.equal(
					"Add/Edit Series",
				));

			it("should attach a header left button event handler", (): void => {
				(leftButton.eventHandler as NavButtonEventHandler)();
				expect(seriesController["cancel"]).to.have.been.called;
			});

			it("should set the header left button label", (): Chai.Assertion =>
				expect(leftButton.label).to.equal("Cancel"));

			it("should attach a header right button event handler", (): void => {
				(rightButton.eventHandler as NavButtonEventHandler)();
				expect(seriesController["save"]).to.have.been.called;
			});

			it("should set the header right button style", (): Chai.Assertion =>
				expect(String(rightButton.style)).to.equal("confirmButton"));
			it("should set the header right button label", (): Chai.Assertion =>
				expect(rightButton.label).to.equal("Save"));
			it("should get the list of programs", (): Chai.Assertion =>
				expect(ProgramMock.list).to.have.been.called);

			it("should populate the move to select with a list of programs", (): void =>
				moveTo
					.querySelectorAll("option")
					.forEach((option: HTMLOptionElement, index: number): void => {
						expect(option.value).to.equal(String(programs[index][0]));
						expect(option.textContent).to.equal(programs[index][1]);
					}));

			it("should set the series name", (): Chai.Assertion =>
				expect(seriesName.value).to.equal(listItem.series.seriesName));
			it("should set the now showing", (): Chai.Assertion =>
				expect(Number(nowShowing.value)).to.equal(listItem.series.nowShowing));
			it("should set the current program", (): Chai.Assertion =>
				expect(moveTo.value).to.equal(String(listItem.series.programId)));
		});

		describe("not showing", (): void => {
			beforeEach(async (): Promise<void> => {
				seriesController["listItem"].series.nowShowing = null;
				await seriesController.setup();
			});

			it("should not set the now showing", (): Chai.Assertion =>
				expect(nowShowing.value).to.equal(""));
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.error = "setup failed";
				await seriesController.setup();
			});

			it("should attempt to get the list of programs", (): Chai.Assertion =>
				expect(ProgramMock.list).to.have.been.called);
			it("should not populate the move to select with a list of programs", (): Chai.Assertion =>
				expect(moveTo.querySelectorAll("option").length).to.equal(0));
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "setup failed",
				}));

			afterEach((): null => (ProgramMock.error = null));
		});

		afterEach((): void => {
			seriesName.remove();
			nowShowing.remove();
			moveTo.remove();
		});
	});

	describe("contentShown", (): void => {
		let seriesName: HTMLInputElement, select: SinonStub;

		beforeEach((): void => {
			seriesName = document.createElement("input");
			seriesName.id = "seriesName";
			document.body.append(seriesName);

			select = sinon.stub(seriesName, "select");
		});

		describe("adding series", (): void => {
			beforeEach((): void => {
				seriesController["listItem"].listIndex = undefined;
				seriesController.contentShown();
			});

			it("should select the series name text", (): Chai.Assertion =>
				expect(select).to.have.been.called);
		});

		describe("not adding series", (): void => {
			beforeEach((): void => seriesController.contentShown());
			it("should not select the series name text", (): Chai.Assertion =>
				expect(select).to.not.have.been.called);
		});

		afterEach((): void => {
			seriesName.remove();
			select.restore();
		});
	});

	describe("save", (): void => {
		let seriesName: string,
			nowShowing: number,
			programId: string,
			seriesNameInput: HTMLInputElement,
			nowShowingSelect: HTMLSelectElement,
			moveToSelect: HTMLSelectElement;

		beforeEach((): void => {
			seriesName = "test-series-2";
			nowShowing = 2;
			programId = "2";

			seriesNameInput = document.createElement("input");
			seriesNameInput.id = "seriesName";
			seriesNameInput.value = seriesName;

			const nowShowingOption = document.createElement("option"),
				moveToOption1 = document.createElement("option"),
				moveToOption2 = document.createElement("option");

			nowShowingSelect = document.createElement("select");
			nowShowingSelect.id = "nowShowing";
			nowShowingOption.value = String(nowShowing);
			nowShowingSelect.append(nowShowingOption);
			nowShowingSelect.value = String(nowShowing);

			moveToSelect = document.createElement("select");
			moveToSelect.id = "moveTo";
			moveToOption1.value = "1";
			moveToOption2.value = "2";
			moveToSelect.append(moveToOption1, moveToOption2);
			moveToSelect.value = programId;

			document.body.append(seriesNameInput, nowShowingSelect, moveToSelect);
		});

		describe("now showing", (): void => {
			beforeEach(async (): Promise<void> => seriesController["save"]());

			it("should get the series name", (): Chai.Assertion =>
				expect(seriesController["listItem"].series.seriesName).to.equal(
					seriesName,
				));
			it("should get the now showing", (): Chai.Assertion =>
				expect(Number(seriesController["listItem"].series.nowShowing)).to.equal(
					nowShowing,
				));
			it("should get the current program", (): Chai.Assertion =>
				expect(String(seriesController["listItem"].series.programId)).to.equal(
					programId,
				));
			it("should save the series", (): Chai.Assertion =>
				expect(listItem.series.save).to.have.been.called);
			it("should pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.have.been.called);
		});

		describe("not showing", (): void => {
			beforeEach(async (): Promise<void> => {
				nowShowingSelect.value = "";
				await seriesController["save"]();
			});

			it("should get the series name", (): Chai.Assertion =>
				expect(seriesController["listItem"].series.seriesName).to.equal(
					seriesName,
				));
			it("should get the now showing", (): Chai.Assertion =>
				expect(seriesController["listItem"].series.nowShowing).to.be.null);
			it("should get the current program", (): Chai.Assertion =>
				expect(String(seriesController["listItem"].series.programId)).to.equal(
					programId,
				));
			it("should save the series", (): Chai.Assertion =>
				expect(listItem.series.save).to.have.been.called);
			it("should pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.have.been.called);
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				SeriesMock.error = "save failed";
				await seriesController["save"]();
			});

			it("should get the series name", (): Chai.Assertion =>
				expect(seriesController["listItem"].series.seriesName).to.equal(
					seriesName,
				));
			it("should get the now showing", (): Chai.Assertion =>
				expect(seriesController["listItem"].series.nowShowing).to.equal(
					nowShowing,
				));
			it("should get the current program", (): Chai.Assertion =>
				expect(String(seriesController["listItem"].series.programId)).to.equal(
					programId,
				));
			it("should attempt to save the series", (): Chai.Assertion =>
				expect(listItem.series.save).to.have.been.called);
			it("should not pop the view", (): Chai.Assertion =>
				expect(appController.popView).to.not.have.been.called);
			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "save failed",
				}));

			afterEach((): null => (SeriesMock.error = null));
		});

		afterEach((): void => {
			seriesNameInput.remove();
			nowShowingSelect.remove();
			moveToSelect.remove();
		});
	});

	describe("cancel", (): void => {
		beforeEach(async (): Promise<void> => {
			seriesController["listItem"].series.nowShowing = 2;
			seriesController["listItem"].series.programId = 2;
			await seriesController["cancel"]();
		});

		it("should revert any changes", (): void => {
			expect(Number(seriesController["listItem"].series.nowShowing)).to.equal(
				1,
			);
			expect(String(seriesController["listItem"].series.programId)).to.equal(
				"1",
			);
		});

		it("should pop the view", (): Chai.Assertion =>
			expect(appController.popView).to.have.been.called);
	});

	afterEach((): void => {
		ProgramMock.reset();
		SeriesMock.reset();
	});
});
