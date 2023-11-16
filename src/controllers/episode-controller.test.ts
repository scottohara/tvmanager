import type {
	EpisodeListItem,
	NavButton,
	NavButtonEventHandler,
} from "~/controllers";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import EpisodeController from "~/controllers/episode-controller";
import EpisodeMock from "~/mocks/episode-model-mock";
import type { EpisodeStatus } from "~/models";
import EpisodeView from "~/views/episode-view.html";
import SeriesMock from "~/mocks/series-model-mock";
import type { SinonStub } from "sinon";
import TestController from "~/mocks/test-controller";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("EpisodeController", (): void => {
	let listItem: EpisodeListItem, episodeController: EpisodeController;

	beforeEach((): void => {
		listItem = {
			listIndex: 0,
			episode: new EpisodeMock(
				null,
				"test-episode",
				"Watched",
				"2000-01-01",
				undefined,
				false,
				false,
			),
		};

		episodeController = new EpisodeController(listItem);
	});

	describe("object constructor", (): void => {
		describe("update", (): void => {
			it("should return a EpisodeController instance", (): Chai.Assertion =>
				expect(episodeController).to.be.an.instanceOf(EpisodeController));
			it("should set the list item", (): Chai.Assertion =>
				expect(episodeController["listItem"]).to.deep.equal(listItem));
			it("should save the original status", (): Chai.Assertion =>
				expect(episodeController["originalStatus"]).to.equal(
					listItem.episode.status,
				));
			it("should save the original status date", (): Chai.Assertion =>
				expect(episodeController["originalStatusDate"]).to.equal(
					listItem.episode.statusDate,
				));
		});

		describe("add", (): void => {
			beforeEach((): void => {
				listItem = {
					episode: new EpisodeMock(null, null, "", ""),
					sequence: 1,
					series: new SeriesMock("1", null, null, null),
				};
				episodeController = new EpisodeController(listItem);
			});

			it("should return a EpisodeController instance", (): Chai.Assertion =>
				expect(episodeController).to.be.an.instanceOf(EpisodeController));

			it("should create a list item", (): void => {
				expect(
					String(episodeController["listItem"].episode.episodeName),
				).to.equal(`Episode ${Number(listItem.sequence) + 1}`);
				expect(episodeController["listItem"].episode.sequence).to.equal(
					listItem.sequence,
				);
				expect(
					String(
						(episodeController["listItem"].episode as EpisodeMock).seriesId,
					),
				).to.equal((listItem.series as SeriesMock).id);
			});
		});
	});

	describe("view", (): void => {
		it("should return the episode view", (): Chai.Assertion =>
			expect(episodeController.view).to.equal(EpisodeView));
	});

	describe("setup", (): void => {
		let episodeName: HTMLInputElement,
			unverified: HTMLInputElement,
			unscheduled: HTMLInputElement,
			watched: HTMLDivElement,
			recorded: HTMLDivElement,
			expected: HTMLDivElement,
			missed: HTMLDivElement,
			statusDate: HTMLInputElement,
			leftButton: NavButton,
			rightButton: NavButton;

		beforeEach(async (): Promise<void> => {
			sinon.stub(episodeController, "cancel" as keyof EpisodeController);
			sinon.stub(episodeController, "save" as keyof EpisodeController);
			sinon.stub(episodeController, "setStatus" as keyof EpisodeController);
			sinon.stub(
				episodeController,
				"toggleStatusDateRow" as keyof EpisodeController,
			);

			episodeName = document.createElement("input");
			episodeName.id = "episodeName";

			unverified = document.createElement("input");
			unverified.type = "checkbox";
			unverified.id = "unverified";

			unscheduled = document.createElement("input");
			unscheduled.type = "checkbox";
			unscheduled.id = "unscheduled";

			watched = document.createElement("div");
			watched.id = "watched";

			recorded = document.createElement("div");
			recorded.id = "recorded";

			expected = document.createElement("div");
			expected.id = "expected";

			missed = document.createElement("div");
			missed.id = "missed";

			statusDate = document.createElement("input");
			statusDate.id = "statusDate";

			document.body.append(
				episodeName,
				unverified,
				unscheduled,
				watched,
				recorded,
				expected,
				missed,
				statusDate,
			);

			await episodeController.setup();
			leftButton = episodeController.header.leftButton as NavButton;
			rightButton = episodeController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion =>
			expect(String(episodeController.header.label)).to.equal(
				"Add/Edit Episode",
			));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			expect(episodeController["cancel"]).to.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion =>
			expect(leftButton.label).to.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			expect(episodeController["save"]).to.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion =>
			expect(String(rightButton.style)).to.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion =>
			expect(rightButton.label).to.equal("Save"));
		it("should set the episode name", (): Chai.Assertion =>
			expect(episodeName.value).to.equal(listItem.episode.episodeName));
		it("should set the status date", (): Chai.Assertion =>
			expect(statusDate.value).to.equal(listItem.episode.statusDate));
		it("should set the unverified toggle", (): Chai.Assertion =>
			expect(unverified.checked).to.equal(listItem.episode.unverified));
		it("should set the unscheduled toggle", (): Chai.Assertion =>
			expect(unscheduled.checked).to.equal(listItem.episode.unscheduled));

		it("should attach a watched click event handler", (): void => {
			watched.dispatchEvent(new MouseEvent("click"));
			expect(episodeController["setStatus"]).to.have.been.calledWith("Watched");
		});

		it("should attach a recorded click event handler", (): void => {
			recorded.dispatchEvent(new MouseEvent("click"));
			expect(episodeController["setStatus"]).to.have.been.calledWith(
				"Recorded",
			);
		});

		it("should attach an expected click event handler", (): void => {
			expected.dispatchEvent(new MouseEvent("click"));
			expect(episodeController["setStatus"]).to.have.been.calledWith(
				"Expected",
			);
		});

		it("should attach a missed click event handler", (): void => {
			missed.dispatchEvent(new MouseEvent("click"));
			expect(episodeController["setStatus"]).to.have.been.calledWith("Missed");
		});

		it("should attach an unscheduled click event handler", (): void => {
			unscheduled.dispatchEvent(new MouseEvent("click"));
			expect(episodeController["toggleStatusDateRow"]).to.have.been.called;
		});

		it("should toggle the current status", (): Chai.Assertion =>
			expect(episodeController["setStatus"]).to.have.been.calledWith(
				"Watched",
			));

		afterEach((): void => {
			episodeName.remove();
			unverified.remove();
			unscheduled.remove();
			watched.remove();
			recorded.remove();
			expected.remove();
			missed.remove();
			statusDate.remove();
		});
	});

	describe("contentShown", (): void => {
		let episodeName: HTMLInputElement, select: SinonStub;

		beforeEach((): void => {
			episodeName = document.createElement("input");
			episodeName.id = "episodeName";
			document.body.append(episodeName);

			select = sinon.stub(episodeName, "select");
		});

		describe("adding episode", (): void => {
			beforeEach((): void => {
				episodeController["listItem"].listIndex = undefined;
				episodeController.contentShown();
			});

			it("should select the episode name text", (): Chai.Assertion =>
				expect(select).to.have.been.called);
		});

		describe("not adding episode", (): void => {
			beforeEach((): void => episodeController.contentShown());
			it("should not select the episode name text", (): Chai.Assertion =>
				expect(select).to.not.have.been.called);
		});

		afterEach((): void => {
			episodeName.remove();
			select.restore();
		});
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			listIndex: number;
			scrollPos: number;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				listIndex: 0,
				scrollPos: 0,
			},
			{
				description: "insert",
				listIndex: -1,
				scrollPos: -1,
			},
		];

		let episodeName: string,
			episodeNameInput: HTMLInputElement,
			statusDate: string,
			statusDateInput: HTMLInputElement,
			unverified: HTMLInputElement,
			unscheduled: HTMLInputElement;

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(async (): Promise<void> => {
					episodeName = "test-episode-2";
					statusDate = "2000-12-31";

					episodeNameInput = document.createElement("input");
					episodeNameInput.id = "episodeName";
					episodeNameInput.value = episodeName;

					statusDateInput = document.createElement("input");
					statusDateInput.id = "statusDate";
					statusDateInput.value = statusDate;

					unverified = document.createElement("input");
					unverified.type = "checkbox";
					unverified.id = "unverified";
					unverified.checked = true;

					unscheduled = document.createElement("input");
					unscheduled.type = "checkbox";
					unscheduled.id = "unscheduled";
					unscheduled.checked = true;

					document.body.append(
						episodeNameInput,
						statusDateInput,
						unverified,
						unscheduled,
					);

					appController.viewStack = [
						{ controller: new TestController(), scrollPos: 0 },
						{ controller: new TestController(), scrollPos: 0 },
					];
					episodeController["listItem"].listIndex = scenario.listIndex;
					await episodeController["save"]();
				});

				it("should get the episode name", (): Chai.Assertion =>
					expect(
						String(episodeController["listItem"].episode.episodeName),
					).to.equal(episodeName));
				it("should get the status date", (): Chai.Assertion =>
					expect(
						String(episodeController["listItem"].episode.statusDate),
					).to.equal(statusDate));
				it("should get the unverified toggle", (): Chai.Assertion =>
					expect(episodeController["listItem"].episode.unverified).to.be.true);
				it("should get the unscheduled toggle", (): Chai.Assertion =>
					expect(episodeController["listItem"].episode.unscheduled).to.be.true);
				it("should save the episode", (): Chai.Assertion =>
					expect(listItem.episode.save).to.have.been.called);
				it("should set the series list view scroll position", (): Chai.Assertion =>
					expect(appController.viewStack[0].scrollPos).to.equal(
						scenario.scrollPos,
					));
				it("should pop the view", (): Chai.Assertion =>
					expect(appController.popView).to.have.been.called);

				afterEach((): void => {
					episodeNameInput.remove();
					statusDateInput.remove();
					unverified.remove();
					unscheduled.remove();
				});
			});
		});
	});

	describe("cancel", (): void => {
		beforeEach(async (): Promise<void> => {
			episodeController["listItem"].episode.status = "Recorded";
			episodeController["listItem"].episode.statusDate = "2000-01-02";
			await episodeController["cancel"]();
		});

		it("should revert any changes", (): void => {
			expect(episodeController["listItem"].episode.status).to.equal("Watched");
			expect(episodeController["listItem"].episode.statusDate).to.equal(
				"2000-01-01",
			);
		});

		it("should pop the view", (): Chai.Assertion =>
			expect(appController.popView).to.have.been.called);
	});

	describe("setStatus", (): void => {
		beforeEach(
			(): SinonStub =>
				sinon.stub(
					episodeController,
					"toggleStatusDateRow" as keyof EpisodeController,
				),
		);

		describe("in progress", (): void => {
			it("should do nothing", (): void => {
				episodeController["settingStatus"] = true;
				episodeController["setStatus"]("");
				expect(episodeController["toggleStatusDateRow"]).to.not.have.been
					.called;
				expect(episodeController["settingStatus"]).to.be.true;
			});
		});

		describe("not in progress", (): void => {
			interface Scenario {
				description: string;
				previousStatus: EpisodeStatus;
				newStatus: EpisodeStatus;
				expectedStatus: EpisodeStatus;
				unverifiedRowHidden: boolean;
			}

			const scenarios: Scenario[] = [
				{
					description: "no change",
					previousStatus: "Watched",
					newStatus: "Watched",
					expectedStatus: "",
					unverifiedRowHidden: true,
				},
				{
					description: "watched",
					previousStatus: "",
					newStatus: "Watched",
					expectedStatus: "Watched",
					unverifiedRowHidden: true,
				},
				{
					description: "recorded",
					previousStatus: "Watched",
					newStatus: "Recorded",
					expectedStatus: "Recorded",
					unverifiedRowHidden: false,
				},
				{
					description: "expected",
					previousStatus: "Watched",
					newStatus: "Expected",
					expectedStatus: "Expected",
					unverifiedRowHidden: false,
				},
				{
					description: "missed",
					previousStatus: "Watched",
					newStatus: "Missed",
					expectedStatus: "Missed",
					unverifiedRowHidden: false,
				},
				{
					description: "unknown",
					previousStatus: "Watched",
					newStatus: "",
					expectedStatus: "",
					unverifiedRowHidden: true,
				},
			];

			let watched: HTMLDivElement,
				recorded: HTMLDivElement,
				expected: HTMLDivElement,
				missed: HTMLDivElement,
				unverifiedRow: HTMLDivElement;

			beforeEach((): void => {
				watched = document.createElement("div");
				watched.id = "watched";
				watched.classList.add("status");

				recorded = document.createElement("div");
				recorded.id = "recorded";
				recorded.classList.add("status");

				expected = document.createElement("div");
				expected.id = "expected";
				expected.classList.add("status");

				missed = document.createElement("div");
				missed.id = "missed";
				missed.classList.add("status");

				unverifiedRow = document.createElement("div");
				unverifiedRow.id = "unverifiedRow";

				document.body.append(
					watched,
					recorded,
					expected,
					missed,
					unverifiedRow,
				);
			});

			scenarios.forEach((scenario: Scenario): void => {
				describe(scenario.description, (): void => {
					beforeEach((): void => {
						listItem.episode.status = scenario.previousStatus;
						episodeController["setStatus"](scenario.newStatus);
					});

					it("should set the episode status", (): Chai.Assertion =>
						expect(listItem.episode.status).to.equal(scenario.expectedStatus));

					it("should toggle the status", (): void => {
						expect(watched.classList.contains("status")).to.equal(
							"Watched" === scenario.expectedStatus,
						);
						expect(recorded.classList.contains("status")).to.equal(
							"Recorded" === scenario.expectedStatus,
						);
						expect(expected.classList.contains("status")).to.equal(
							"Expected" === scenario.expectedStatus,
						);
						expect(missed.classList.contains("status")).to.equal(
							"Missed" === scenario.expectedStatus,
						);
					});

					it("should toggle the unverified row", (): Chai.Assertion =>
						expect("none" === unverifiedRow.style.display).to.equal(
							scenario.unverifiedRowHidden,
						));
					it("should toggle the status date row", (): Chai.Assertion =>
						expect(episodeController["toggleStatusDateRow"]).to.have.been
							.called);
					it("should clear the semaphore", (): Chai.Assertion =>
						expect(episodeController["settingStatus"]).to.be.false);
				});
			});

			afterEach((): void => {
				watched.remove();
				recorded.remove();
				expected.remove();
				missed.remove();
				unverifiedRow.remove();
			});
		});
	});

	describe("toggleStatusDateRow", (): void => {
		interface Scenario {
			description: string;
			isHidden: boolean;
			isUnscheduled: boolean;
			status: EpisodeStatus;
			noDate: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "hidden",
				isHidden: true,
				isUnscheduled: false,
				status: "",
				noDate: false,
			},
			{
				description: "unscheduled",
				isHidden: false,
				isUnscheduled: true,
				status: "",
				noDate: false,
			},
			{
				description: "recorded",
				isHidden: false,
				isUnscheduled: false,
				status: "Recorded",
				noDate: false,
			},
			{
				description: "expected",
				isHidden: false,
				isUnscheduled: false,
				status: "Expected",
				noDate: false,
			},
			{
				description: "missed",
				isHidden: false,
				isUnscheduled: false,
				status: "Missed",
				noDate: false,
			},
			{
				description: "no date specified",
				isHidden: false,
				isUnscheduled: true,
				status: "",
				noDate: true,
			},
		];

		let statusDateRow: HTMLDivElement, unscheduled: HTMLInputElement;

		beforeEach((): void => {
			statusDateRow = document.createElement("div");
			statusDateRow.id = "statusDateRow";

			unscheduled = document.createElement("input");
			unscheduled.type = "checkbox";
			unscheduled.id = "unscheduled";

			document.body.append(statusDateRow, unscheduled);
		});

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					unscheduled.checked = scenario.isUnscheduled;
					listItem.episode.status = scenario.status;
					listItem.episode.statusDate = scenario.noDate
						? ""
						: listItem.episode.statusDate;
					episodeController["toggleStatusDateRow"]();
				});

				it(`should ${
					scenario.isHidden ? "hide" : "show"
				} the status date`, (): Chai.Assertion =>
					expect("none" === statusDateRow.style.display).to.equal(
						Boolean(scenario.isHidden),
					));
			});
		});

		afterEach((): void => {
			statusDateRow.remove();
			unscheduled.remove();
		});
	});
});
