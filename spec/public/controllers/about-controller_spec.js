import $ from "jquery";
import AboutController from "../../../src/controllers/about-controller";
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

	describe("setup", () => {
		let databaseVersion,
				appVersion,
				update;

		beforeEach(() => {
			databaseVersion = $("<input>").attr("id", "databaseVersion");
			appVersion = $("<input>").attr("id", "appVersion");
			update = $("<div>").attr("id", "update");

			sinon.stub(aboutController, "goBack");
			sinon.stub(aboutController, "programCount");
			sinon.stub(aboutController, "seriesCount");
			sinon.stub(aboutController, "episodeCount");
			sinon.stub(aboutController, "checkForUpdate");

			$(document.body).append(databaseVersion, appVersion, update);
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
		it("should set the app version", () => appVersion.val().should.equal("v1.0"));

		it("should attach an update click event handler", () => {
			update.trigger("click");
			aboutController.checkForUpdate.should.have.been.called;
		});

		it("should set the scroll position", () => appController.setScrollPosition.should.have.been.called);

		afterEach(() => {
			databaseVersion.remove();
			appVersion.remove();
			update.remove();
		});
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

	describe("checkForUpdate", () => {
		describe("updating", () => {
			it("should do nothing", () => {
				aboutController.updating = true;
				aboutController.checkForUpdate();
				appController.cache.update.should.not.have.been.called;
			});
		});

		describe("not updating", () => {
			beforeEach(() => aboutController.checkForUpdate());

			it("should update the application cache", () => appController.cache.update.should.have.been.calledWith(true));
			it("should reset the updating flag", () => aboutController.updating.should.be.false);
		});
	});
});