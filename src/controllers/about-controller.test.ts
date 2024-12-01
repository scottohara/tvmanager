import type { NavButton, NavButtonEventHandler } from "~/controllers";
import AboutController from "~/controllers/about-controller";
import AboutView from "~/views/about-view.html";
import ApplicationControllerMock from "~/mocks/application-controller-mock";
import EpisodeMock from "~/mocks/episode-model-mock";
import ProgramMock from "~/mocks/program-model-mock";
import SeriesMock from "~/mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController = new ApplicationControllerMock();

describe("AboutController", (): void => {
	let aboutController: AboutController;

	beforeEach((): AboutController => (aboutController = new AboutController()));

	describe("object constructor", (): void => {
		it("should return an AboutController instance", (): Chai.Assertion =>
			expect(aboutController).to.be.an.instanceOf(AboutController));
	});

	describe("view", (): void => {
		it("should return the about view", (): Chai.Assertion =>
			expect(aboutController.view).to.equal(AboutView));
	});

	describe("setup", (): void => {
		let statistics: HTMLElement,
			totalPrograms: HTMLInputElement,
			totalSeries: HTMLInputElement,
			totalEpisodes: HTMLInputElement,
			leftButton: NavButton;

		beforeEach((): void => {
			statistics = document.createElement("section");
			statistics.id = "statistics";
			statistics.style.display = "none";
			totalPrograms = document.createElement("input");
			totalPrograms.id = "totalPrograms";
			totalSeries = document.createElement("input");
			totalSeries.id = "totalSeries";
			totalEpisodes = document.createElement("input");
			totalEpisodes.id = "totalEpisodes";

			sinon.stub(aboutController, "goBack" as keyof AboutController);

			document.body.append(
				statistics,
				totalPrograms,
				totalSeries,
				totalEpisodes,
			);
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				await aboutController.setup();
				leftButton = aboutController.header.leftButton as NavButton;
			});

			it("should set the header label", (): Chai.Assertion =>
				expect(String(aboutController.header.label)).to.equal("About"));

			it("should attach a header left button event handler", (): void => {
				(leftButton.eventHandler as NavButtonEventHandler)();
				expect(aboutController["goBack"]).to.have.been.called;
			});

			it("should set the header left button style", (): Chai.Assertion =>
				expect(String(leftButton.style)).to.equal("backButton"));
			it("should set the header left button label", (): Chai.Assertion =>
				expect(leftButton.label).to.equal("Settings"));

			it("should set the total number of programs", (): void => {
				expect(ProgramMock.count).to.have.been.called;
				expect(totalPrograms.value).to.equal("1");
			});

			it("should set the total number of series", (): void => {
				expect(SeriesMock.count).to.have.been.called;
				expect(totalSeries.value).to.equal("1");
			});

			it("should set the total number of episodes", (): void => {
				expect(EpisodeMock.count).to.have.been.called;
				expect(EpisodeMock.countByStatus).to.have.been.calledWith("watched");
				expect(totalEpisodes.value).to.equal("1 (100.00% watched)");
			});

			it("should set the scroll position", (): Chai.Assertion =>
				expect(appController.setScrollPosition).to.have.been.called);
			it("should show the statistics", (): Chai.Assertion =>
				expect(statistics.style.display).to.equal("block"));
		});

		describe("failure", (): void => {
			beforeEach(async (): Promise<void> => {
				ProgramMock.error = "setup failed";
				await aboutController.setup();
			});

			it("should not set the total number of programs", (): void => {
				expect(ProgramMock.count).to.have.been.called;
				expect(totalPrograms.value).to.equal("");
			});

			it("should not set the total number of series", (): void => {
				expect(SeriesMock.count).to.not.have.been.called;
				expect(totalSeries.value).to.equal("");
			});

			it("should not set the total number of episodes", (): void => {
				expect(EpisodeMock.count).to.not.have.been.called;
				expect(EpisodeMock.countByStatus).to.not.have.been.calledWith(
					"watched",
				);
				expect(totalEpisodes.value).to.equal("");
			});

			it("should display a notice to the user", (): Chai.Assertion =>
				expect(appController.showNotice).to.have.been.calledWith({
					label: "setup failed",
				}));

			it("should not set the scroll position", (): Chai.Assertion =>
				expect(appController.setScrollPosition).to.not.have.been.called);
			it("should show the statistics", (): Chai.Assertion =>
				expect(statistics.style.display).to.equal("none"));

			afterEach((): null => (ProgramMock.error = null));
		});

		afterEach((): void => {
			statistics.remove();
			totalPrograms.remove();
			totalSeries.remove();
			totalEpisodes.remove();
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await aboutController["goBack"]();
			expect(appController.popView).to.have.been.called;
		});
	});

	describe("watchedPercent", (): void => {
		describe("no episodes", (): void => {
			it("should return the watched percent as zero", (): Chai.Assertion =>
				expect(aboutController["watchedPercent"](0, 1)).to.equal(
					"0 (0% watched)",
				));
		});

		describe("with episodes", (): void => {
			it("should return the watched percent as non-zero", (): Chai.Assertion =>
				expect(aboutController["watchedPercent"](2, 1)).to.equal(
					"2 (50.00% watched)",
				));
		});
	});

	afterEach((): void => {
		ProgramMock.reset();
		SeriesMock.reset();
		EpisodeMock.reset();
	});
});
