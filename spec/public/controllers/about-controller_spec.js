import $ from "jquery";
import AboutController from "../../../src/controllers/about-controller";
import AboutView from "views/about-view.html";
import ApplicationController from "controllers/application-controller";
import Episode from "models/episode-model";
import Program from "models/program-model";
import Series from "models/series-model";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("AboutController", () => {
	let aboutController;

	beforeEach(() => (aboutController = new AboutController()));

	describe("object constructor", () => {
		it("should return an AboutController instance", () => aboutController.should.be.an.instanceOf(AboutController));
	});

	describe("view", () => {
		it("should return the about view", () => aboutController.view.should.equal(AboutView));
	});

	describe("setup", () => {
		let databaseVersion;

		beforeEach(() => {
			databaseVersion = $("<input>").attr("id", "databaseVersion");

			sinon.stub(aboutController, "goBack");
			sinon.stub(aboutController, "programCount");
			sinon.stub(aboutController, "seriesCount");
			sinon.stub(aboutController, "episodeCount");

			$(document.body).append(databaseVersion);
			aboutController.setup();
		});

		it("should set the header label", () => aboutController.header.label.should.equal("About"));

		it("should attach a header left button event handler", () => {
			aboutController.header.leftButton.eventHandler();
			aboutController.goBack.should.have.been.called;
		});

		it("should set the header left button style", () => aboutController.header.leftButton.style.should.equal("backButton"));
		it("should set the header left button label", () => aboutController.header.leftButton.label.should.equal("Settings"));

		it("should get the total number of programs", () => {
			Program.count.should.have.been.calledWith(aboutController.programCount);
			aboutController.programCount.should.have.been.calledWith(1);
		});

		it("should get the total number of series", () => {
			Series.count.should.have.been.calledWith(aboutController.seriesCount);
			aboutController.seriesCount.should.have.been.calledWith(1);
		});

		it("should get the total number of episodes", () => {
			Episode.totalCount.should.have.been.calledWith(sinon.match.func);
			aboutController.episodeCount.should.have.been.calledWith(1);
		});

		it("should set the database version", () => databaseVersion.val().should.equal("v1.0"));
		it("should set the scroll position", () => appController.setScrollPosition.should.have.been.called);

		afterEach(() => databaseVersion.remove());
	});

	describe("goBack", () => {
		it("should pop the view", () => {
			aboutController.goBack();
			appController.popView.should.have.been.called;
		});
	});

	describe("programCount", () => {
		it("should set the program count", () => {
			const count = 1,
						totalPrograms = $("<input>")
							.attr("id", "totalPrograms")
							.appendTo(document.body);

			aboutController.programCount(count);
			totalPrograms.val().should.equal(count.toString());
			totalPrograms.remove();
		});
	});

	describe("seriesCount", () => {
		it("should set the series count", () => {
			const count = 1,
						totalSeries = $("<input>")
							.attr("id", "totalSeries")
							.appendTo(document.body);

			aboutController.seriesCount(count);
			totalSeries.val().should.equal(count.toString());
			totalSeries.remove();
		});
	});

	describe("episodeCount", () => {
		let count;

		beforeEach(() => {
			count = 1;
			sinon.stub(aboutController, "watchedCount");
			aboutController.episodeCount(count);
		});

		it("should set the episode total count", () => aboutController.episodeTotalCount.should.equal(count));
		it("should get the total number of watched episodes", () => {
			Episode.countByStatus.should.have.been.calledWith("Watched", sinon.match.func);
			aboutController.watchedCount.should.have.been.calledWith(1);
		});
	});

	describe("watchedCount", () => {
		let totalEpisodes;

		beforeEach(() => {
			totalEpisodes = $("<input>")
				.attr("id", "totalEpisodes")
				.appendTo(document.body);
		});

		describe("no episodes", () => {
			it("should set the watched percent to zero", () => {
				aboutController.episodeTotalCount = 0;
				aboutController.watchedCount(1);
				totalEpisodes.val().should.equal("0 (0% watched)");
			});
		});

		describe("with episodes", () => {
			it("should set the watched percent", () => {
				aboutController.episodeTotalCount = 1;
				aboutController.watchedCount(1);
				totalEpisodes.val().should.equal("1 (100% watched)");
			});
		});

		afterEach(() => totalEpisodes.remove());
	});
});