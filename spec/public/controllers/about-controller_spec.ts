import $ from "jquery";
import AboutController from "../../../src/controllers/about-controller";
import AboutView from "views/about-view.html";
import ApplicationControllerMock from "mocks/application-controller-mock";
import EpisodeMock from "mocks/episode-model-mock";
import { NavButton } from "controllers";
import ProgramMock from "mocks/program-model-mock";
import SeriesMock from "mocks/series-model-mock";
import sinon from "sinon";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

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
		let databaseVersion: JQuery,
				leftButton: NavButton;

		beforeEach(async (): Promise<void> => {
			databaseVersion = $("<input>").attr("id", "databaseVersion");

			sinon.stub(aboutController, "goBack" as keyof AboutController);
			sinon.stub(aboutController, "programCount" as keyof AboutController);
			sinon.stub(aboutController, "seriesCount" as keyof AboutController);
			sinon.stub(aboutController, "episodeCount" as keyof AboutController);

			$(document.body).append(databaseVersion);
			await aboutController.setup();
			leftButton = aboutController.header.leftButton as NavButton;
		});

		it("should set the header label", (): Chai.Assertion => String(aboutController.header.label).should.equal("About"));

		it("should attach a header left button event handler", (): void => {
			(leftButton.eventHandler as Function)();
			aboutController["goBack"].should.have.been.called;
		});

		it("should set the header left button style", (): Chai.Assertion => String(leftButton.style).should.equal("backButton"));
		it("should set the header left button label", (): Chai.Assertion => leftButton.label.should.equal("Settings"));

		it("should get the total number of programs", (): void => {
			ProgramMock.count.should.have.been.called;
			aboutController["programCount"].should.have.been.calledWith(1);
		});

		it("should get the total number of series", (): void => {
			SeriesMock.count.should.have.been.called;
			aboutController["seriesCount"].should.have.been.calledWith(1);
		});

		it("should get the total number of episodes", (): void => {
			EpisodeMock.totalCount.should.have.been.called;
			aboutController["episodeCount"].should.have.been.calledWith(1);
		});

		it("should set the database version", (): Chai.Assertion => String(databaseVersion.val()).should.equal("v1"));
		it("should set the scroll position", (): Chai.Assertion => appController.setScrollPosition.should.have.been.called);

		afterEach((): JQuery => databaseVersion.remove());
	});

	describe("goBack", (): void => {
		it("should pop the view", async (): Promise<void> => {
			await aboutController["goBack"]();
			appController.popView.should.have.been.called;
		});
	});

	describe("programCount", (): void => {
		it("should set the program count", (): void => {
			const count = 1,
						totalPrograms: JQuery = $("<input>")
							.attr("id", "totalPrograms")
							.appendTo(document.body);

			aboutController["programCount"](count);
			String(totalPrograms.val()).should.equal(count.toString());
			totalPrograms.remove();
		});
	});

	describe("seriesCount", (): void => {
		it("should set the series count", (): void => {
			const count = 1,
						totalSeries: JQuery = $("<input>")
							.attr("id", "totalSeries")
							.appendTo(document.body);

			aboutController["seriesCount"](count);
			String(totalSeries.val()).should.equal(count.toString());
			totalSeries.remove();
		});
	});

	describe("episodeCount", (): void => {
		let count: number;

		beforeEach(async (): Promise<void> => {
			count = 1;
			sinon.stub(aboutController, "watchedCount" as keyof AboutController);
			await aboutController["episodeCount"](count);
		});

		it("should set the episode total count", (): Chai.Assertion => aboutController["episodeTotalCount"].should.equal(count));
		it("should get the total number of watched episodes", (): void => {
			EpisodeMock.countByStatus.should.have.been.calledWith("Watched");
			aboutController["watchedCount"].should.have.been.calledWith(1);
		});
	});

	describe("watchedCount", (): void => {
		let totalEpisodes: JQuery;

		beforeEach((): void => {
			totalEpisodes = $("<input>")
				.attr("id", "totalEpisodes")
				.appendTo(document.body);
		});

		describe("no episodes", (): void => {
			it("should set the watched percent to zero", (): void => {
				aboutController["episodeTotalCount"] = 0;
				aboutController["watchedCount"](1);
				String(totalEpisodes.val()).should.equal("0 (0% watched)");
			});
		});

		describe("with episodes", (): void => {
			it("should set the watched percent", (): void => {
				aboutController["episodeTotalCount"] = 1;
				aboutController["watchedCount"](1);
				String(totalEpisodes.val()).should.equal("1 (100.00% watched)");
			});
		});

		afterEach((): JQuery => totalEpisodes.remove());
	});
});