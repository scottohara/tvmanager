import type {
	NavButton,
	NavButtonEventHandler
} from "~/controllers";
import AboutController from "../../../src/controllers/about-controller";
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
		it("should return an AboutController instance", (): Chai.Assertion => aboutController.should.be.an.instanceOf(AboutController));
	});

	describe("view", (): void => {
		it("should return the about view", (): Chai.Assertion => aboutController.view.should.equal(AboutView));
	});

	describe("setup", (): void => {
		let databaseVersion: HTMLInputElement,
				totalPrograms: HTMLInputElement,
				totalSeries: HTMLInputElement,
				totalEpisodes: HTMLInputElement,
				leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			databaseVersion = document.createElement("input");
			databaseVersion.id = "databaseVersion";
			totalPrograms = document.createElement("input");
			totalPrograms.id = "totalPrograms";
			totalSeries = document.createElement("input");
			totalSeries.id = "totalSeries";
			totalEpisodes = document.createElement("input");
			totalEpisodes.id = "totalEpisodes";

			sinon.stub(aboutController, "goBack" as keyof AboutController);

			document.body.append(databaseVersion, totalPrograms, totalSeries, totalEpisodes);
			await aboutController.setup();
			leftButton = aboutController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(aboutController.header.label).should.equal("About"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as NavButtonEventHandler)();
			aboutController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Settings"));

		it("should set the total number of programs", (): void => {
			ProgramMock.count.should.have.been.called;
			totalPrograms.value.should.equal("1");
		});

		it("should get the total number of series", (): void => {
			SeriesMock.count.should.have.been.called;
			totalSeries.value.should.equal("1");
		});

		it("should get the total number of episodes", (): void => {
			EpisodeMock.totalCount.should.have.been.called;
			EpisodeMock.countByStatus.should.have.been.calledWith("Watched");
			totalEpisodes.value.should.equal("1 (100.00% watched)");
		});

		it("should set the database version", (): Chai.Assertion => databaseVersion.value.should.equal("v1"));
		it("should set the scroll position", (): Chai.Assertion => appController.setScrollPosition.should.have.been.called);

		afterEach((): void => {
			databaseVersion.remove();
			totalPrograms.remove();
			totalSeries.remove();
			totalEpisodes.remove();
		});
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await aboutController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("watchedPercent", (): void => {
		describe("no episodes", (): void => {
			it("should return the watched percent as zero", (): Chai.Assertion => aboutController["watchedPercent"](0, 1).should.equal("0 (0% watched)"));
		});

		describe("with episodes", (): void => {
			it("should return the watched percent as non-zero", (): Chai.Assertion => aboutController["watchedPercent"](2, 1).should.equal("2 (50.00% watched)"));
		});
	});
});