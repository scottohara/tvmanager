module("about-controller", {
	setup: function() {
		"use strict";

		this.aboutController = new AboutController();
	}
});

test("constructor", 1, function() {
	"use strict";

	ok(this.aboutController, "Instantiate AboutController object");
});

test("setup", 8, function() {
	"use strict";

	var originalProgram = Program;
	var originalSeries = Series;
	var originalEpisode = Episode;

	Program = ProgramMock;
	Series = SeriesMock;
	Episode = EpisodeMock;

	var totalPrograms = $("<input>")
		.attr("id", "totalPrograms")
		.hide()
		.appendTo(document.body);

	var totalSeries = $("<input>")
		.attr("id", "totalSeries")
		.hide()
		.appendTo(document.body);

	var totalEpisodes = $("<input>")
		.attr("id", "totalEpisodes")
		.hide()
		.appendTo(document.body);

	var databaseVersion = $("<input>")
		.attr("id", "databaseVersion")
		.hide()
		.appendTo(document.body);

	var appVersion = $("<input>")
		.attr("id", "appVersion")
		.hide()
		.appendTo(document.body);

	var update = $("<div>")
		.attr("id", "update")
		.hide()
		.appendTo(document.body);

	this.aboutController.checkForUpdate = function() {
		ok(true, "Bind click event listener");
	};
	this.aboutController.goBack = function() {
		ok(true, "Bind back button event listener");
	};

	this.aboutController.setup();
	equals(totalPrograms.val(), "1", "Total Programs");
	equals(totalSeries.val(), "1", "Total Series");
	equals(totalEpisodes.val(), "1 (100% watched)", "Total Episodes");
	equals(databaseVersion.val(), "v1.0", "Database Version");
	equals(appVersion.val(), "v1.0", "App Version");
	update.trigger("click");
	this.aboutController.header.leftButton.eventHandler();

	totalPrograms.remove();
	totalSeries.remove();
	totalEpisodes.remove();
	databaseVersion.remove();
	appVersion.remove();
	update.remove();

	Program = originalProgram;
	Series = originalSeries;
	Episode = originalEpisode;
});

test("goBack", 1, function() {
	"use strict";

	this.aboutController.goBack();
});

test("checkForUpdate - updating", 1, function() {
	"use strict";

	this.aboutController.updating = true;
	this.aboutController.checkForUpdate();
	ok(this.aboutController.updating, "Update blocked by semaphore");
});

test("checkForUpdate - not updating", 2, function() {
	"use strict";

	this.aboutController.checkForUpdate();
	same(appController.notice.pop(), {
		label: "Updated",
		leftButton: {
			style: "redButton",
			label: "OK"
		}
	}, "Update notice");
	ok(!this.aboutController.updating, "Reset semaphore");
});
