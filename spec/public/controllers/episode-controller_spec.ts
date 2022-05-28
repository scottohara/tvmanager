import type {
	EpisodeListItem,
	NavButton,
	NavButtonEventHandler
} from "controllers";
import ApplicationControllerMock from "mocks/application-controller-mock";
import EpisodeController from "controllers/episode-controller";
import EpisodeMock from "mocks/episode-model-mock";
import type { EpisodeStatus } from "models";
import EpisodeView from "views/episode-view.html";
import SeriesMock from "mocks/series-model-mock";
import type { SinonStub } from "sinon";
import TestController from "mocks/test-controller";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("EpisodeController", (): void => {
	let listItem: EpisodeListItem,
			episodeController: EpisodeController;

	beforeEach((): void => {
		listItem = {
			listIndex: 0,
			episode: new EpisodeMock(null, "test-episode", "Watched", "2000-01-01", undefined, false, false)
		};

		episodeController = new EpisodeController(listItem);
	});

	describe("object constructor", (): void => {
		describe("update", (): void => {
			it("should return a EpisodeController instance", (): Chai.Assertion => episodeController.should.be.an.instanceOf(EpisodeController));
			it("should set the list item", (): Chai.Assertion => episodeController["listItem"].should.deep.equal(listItem));
			it("should save the original status", (): Chai.Assertion => episodeController["originalStatus"].should.equal(listItem.episode.status));
			it("should save the original status date", (): Chai.Assertion => episodeController["originalStatusDate"].should.equal(listItem.episode.statusDate));
		});

		describe("add", (): void => {
			beforeEach((): void => {
				listItem = {
					episode: new EpisodeMock(null, null, "", ""),
					sequence: 1,
					series: new SeriesMock("1", null, null, null)
				};
				episodeController = new EpisodeController(listItem);
			});

			it("should return a EpisodeController instance", (): Chai.Assertion => episodeController.should.be.an.instanceOf(EpisodeController));

			it("should create a list item", (): void => {
				String(episodeController["listItem"].episode.episodeName).should.equal(`Episode ${Number(listItem.sequence) + 1}`);
				episodeController["listItem"].episode.sequence.should.equal(listItem.sequence);
				String((episodeController["listItem"].episode as EpisodeMock).seriesId).should.equal((listItem.series as SeriesMock).id);
			});
		});
	});

	describe("view", (): void => {
		it("should return the episode view", (): Chai.Assertion => episodeController.view.should.equal(EpisodeView));
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
			sinon.stub(episodeController, "toggleStatusDateRow" as keyof EpisodeController);

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

			document.body.append(episodeName, unverified, unscheduled, watched, recorded, expected, missed, statusDate);

			await episodeController.setup();
			leftButton = episodeController.header.leftButton as NavButton;
			rightButton = episodeController.header.rightButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(episodeController.header.label).should.equal("Add/Edit Episode"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			episodeController["cancel"].should.have.been.called;
		});

		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Cancel"));

		it("should attach a header right button event handler", (): void => {
			(rightButton.eventHandler as NavButtonEventHandler)();
			episodeController["save"].should.have.been.called;
		});

		it("should set the header right button style", (): Chai.Assertion => String(rightButton.style).should.equal("confirmButton"));
		it("should set the header right button label", (): Chai.Assertion => rightButton.label.should.equal("Save"));
		it("should set the episode name", (): Chai.Assertion => episodeName.value.should.equal(listItem.episode.episodeName));
		it("should set the status date", (): Chai.Assertion => statusDate.value.should.equal(listItem.episode.statusDate));
		it("should set the unverified toggle", (): Chai.Assertion => unverified.checked.should.equal(listItem.episode.unverified));
		it("should set the unscheduled toggle", (): Chai.Assertion => unscheduled.checked.should.equal(listItem.episode.unscheduled));

		it("should attach a watched click event handler", (): void => {
			watched.dispatchEvent(new MouseEvent("click"));
			episodeController["setStatus"].should.have.been.calledWith("Watched");
		});

		it("should attach a recorded click event handler", (): void => {
			recorded.dispatchEvent(new MouseEvent("click"));
			episodeController["setStatus"].should.have.been.calledWith("Recorded");
		});

		it("should attach an expected click event handler", (): void => {
			expected.dispatchEvent(new MouseEvent("click"));
			episodeController["setStatus"].should.have.been.calledWith("Expected");
		});

		it("should attach a missed click event handler", (): void => {
			missed.dispatchEvent(new MouseEvent("click"));
			episodeController["setStatus"].should.have.been.calledWith("Missed");
		});

		it("should attach an unscheduled click event handler", (): void => {
			unscheduled.dispatchEvent(new MouseEvent("click"));
			episodeController["toggleStatusDateRow"].should.have.been.called;
		});

		it("should toggle the current status", (): Chai.Assertion => episodeController["setStatus"].should.have.been.calledWith("Watched"));

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
		let episodeName: HTMLInputElement,
				select: SinonStub;

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

			it("should select the episode name text", (): Chai.Assertion => select.should.have.been.called);
		});

		describe("not adding episode", (): void => {
			beforeEach((): void => episodeController.contentShown());
			it("should not select the episode name text", (): Chai.Assertion => select.should.not.have.been.called);
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
				scrollPos: 0
			},
			{
				description: "insert",
				listIndex: -1,
				scrollPos: -1
			}
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

					document.body.append(episodeNameInput, statusDateInput, unverified, unscheduled);

					appController.viewStack = [
						{ controller: new TestController(), scrollPos: 0 },
						{ controller: new TestController(), scrollPos: 0 }
					];
					episodeController["listItem"].listIndex = scenario.listIndex;
					await episodeController["save"]();
				});

				it("should get the episode name", (): Chai.Assertion => String(episodeController["listItem"].episode.episodeName).should.equal(episodeName));
				it("should get the status date", (): Chai.Assertion => String(episodeController["listItem"].episode.statusDate).should.equal(statusDate));
				it("should get the unverified toggle", (): Chai.Assertion => episodeController["listItem"].episode.unverified.should.be.true);
				it("should get the unscheduled toggle", (): Chai.Assertion => episodeController["listItem"].episode.unscheduled.should.be.true);
				it("should save the episode", (): Chai.Assertion => listItem.episode.save.should.have.been.called);
				it("should set the series list view scroll position", (): Chai.Assertion => appController.viewStack[0].scrollPos.should.equal(scenario.scrollPos));
				it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);

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
			episodeController["listItem"].episode.status.should.equal("Watched");
			episodeController["listItem"].episode.statusDate.should.equal("2000-01-01");
		});

		it("should pop the view", (): Chai.Assertion => appController.popView.should.have.been.called);
	});

	describe("setStatus", (): void => {
		beforeEach((): SinonStub => sinon.stub(episodeController, "toggleStatusDateRow" as keyof EpisodeController));

		describe("in progress", (): void => {
			it("should do nothing", (): void => {
				episodeController["settingStatus"] = true;
				episodeController["setStatus"]("");
				episodeController["toggleStatusDateRow"].should.not.have.been.called;
				episodeController["settingStatus"].should.be.true;
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
					unverifiedRowHidden: true
				},
				{
					description: "watched",
					previousStatus: "",
					newStatus: "Watched",
					expectedStatus: "Watched",
					unverifiedRowHidden: true
				},
				{
					description: "recorded",
					previousStatus: "Watched",
					newStatus: "Recorded",
					expectedStatus: "Recorded",
					unverifiedRowHidden: false
				},
				{
					description: "expected",
					previousStatus: "Watched",
					newStatus: "Expected",
					expectedStatus: "Expected",
					unverifiedRowHidden: false
				},
				{
					description: "missed",
					previousStatus: "Watched",
					newStatus: "Missed",
					expectedStatus: "Missed",
					unverifiedRowHidden: false
				},
				{
					description: "unknown",
					previousStatus: "Watched",
					newStatus: "",
					expectedStatus: "",
					unverifiedRowHidden: true
				}
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

				document.body.append(watched, recorded, expected, missed, unverifiedRow);
			});

			scenarios.forEach((scenario: Scenario): void => {
				describe(scenario.description, (): void => {
					beforeEach((): void => {
						listItem.episode.status = scenario.previousStatus;
						episodeController["setStatus"](scenario.newStatus);
					});

					it("should set the episode status", (): Chai.Assertion => listItem.episode.status.should.equal(scenario.expectedStatus));

					it("should toggle the status", (): void => {
						watched.classList.contains("status").should.equal("Watched" === scenario.expectedStatus);
						recorded.classList.contains("status").should.equal("Recorded" === scenario.expectedStatus);
						expected.classList.contains("status").should.equal("Expected" === scenario.expectedStatus);
						missed.classList.contains("status").should.equal("Missed" === scenario.expectedStatus);
					});

					it("should toggle the unverified row", (): Chai.Assertion => ("none" === unverifiedRow.style.display).should.equal(scenario.unverifiedRowHidden));
					it("should toggle the status date row", (): Chai.Assertion => episodeController["toggleStatusDateRow"].should.have.been.called);
					it("should clear the semaphore", (): Chai.Assertion => episodeController["settingStatus"].should.be.false);
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
				noDate: false
			},
			{
				description: "unscheduled",
				isHidden: false,
				isUnscheduled: true,
				status: "",
				noDate: false
			},
			{
				description: "recorded",
				isHidden: false,
				isUnscheduled: false,
				status: "Recorded",
				noDate: false
			},
			{
				description: "expected",
				isHidden: false,
				isUnscheduled: false,
				status: "Expected",
				noDate: false
			},
			{
				description: "missed",
				isHidden: false,
				isUnscheduled: false,
				status: "Missed",
				noDate: false
			},
			{
				description: "no date specified",
				isHidden: false,
				isUnscheduled: true,
				status: "",
				noDate: true
			}
		];

		let statusDateRow: HTMLDivElement,
				unscheduled: HTMLInputElement;

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
					listItem.episode.statusDate = scenario.noDate ? "" : listItem.episode.statusDate;
					episodeController["toggleStatusDateRow"]();
				});

				it(`should ${scenario.isHidden ? "hide" : "show"} the status date`, (): Chai.Assertion => ("none" === statusDateRow.style.display).should.equal(Boolean(scenario.isHidden)));
			});
		});

		afterEach((): void => {
			statusDateRow.remove();
			unscheduled.remove();
		});
	});
});