module("program-model", {
	setup: function() {
		this.id = 1;
		this.programName = "test-program";
		this.seriesCount = 1;
		this.episodeCount = 1;
		this.watchedCount = 1;
		this.recordedCount = 1;
		this.expectedCount = 1;
		this.originalProgressBar = ProgressBar;
		ProgressBar = ProgressBarMock;
		this.originalSeries = Series;
		Series = SeriesMock;
		this.program = new Program(this.id, this.programName, this.seriesCount, this.episodeCount, this.watchedCount, this.recordedCount, this.expectedCount);
		appController.db = new DatabaseMock();
	},
	teardown: function() {
		ProgressBar = this.originalProgressBar;
		Series = this.originalSeries;
	}
});

test("constructor", 9, function() {
	ok(this.program, "Instantiate Program object");
	equals(this.program.id, this.id, "id property");
	equals(this.program.programName, this.programName, "programName property");
	equals(this.program.progressBar.total, this.episodeCount, "progressBar.total property");
	equals(this.program.seriesCount, this.seriesCount, "seriesCount property");
	equals(this.program.episodeCount, this.episodeCount, "episodeCount property");
	equals(this.program.watchedCount, this.watchedCount, "watchedCount property");
	equals(this.program.recordedCount, this.recordedCount, "recordedCount property");
	equals(this.program.expectedCount, this.expectedCount, "expectedCount property");
});

test("save - update fail", 4, function() {
	appController.db.failAt("UPDATE Program SET Name = " + this.programName + " WHERE rowid = " + this.id);
	this.program.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Program.save: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - update no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("UPDATE Program SET Name = " + this.programName + " WHERE rowid = " + this.id);
	this.program.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Program.save: no rows affected", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - update success", 5, function() {
	this.program.save($.proxy(function(id) {
		equals(id, this.id, "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	equals(this.program.id, this.id, "id property");
	ok(appController.db.commit, "Commit transaction");
});

test("save - insert fail", 4, function() {
	this.program.id = null;
	appController.db.failAt("INSERT INTO Program (Name) VALUES (" + this.programName + ")");
	this.program.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Program.save: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert no rows affected", 4, function() {
	this.program.id = null;
	appController.db.noRowsAffectedAt("INSERT INTO Program (Name) VALUES (" + this.programName + ")");
	this.program.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Program.save: no rows affected", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert success", 5, function() {
	this.program.id = null;
	this.program.save(function(id) {
		equals(id, 999, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	equals(this.program.id, 999, "id property");
	ok(appController.db.commit, "Commit transaction");
});

test("remove - no rows affected", 1, function() {
	this.program.id = null;
	this.program.remove();
	equals(appController.db.commands.length, 0, "Number of SQL commands");
});

test("remove - delete Episode fail", 4, function() {
	appController.db.failAt("DELETE FROM Episode WHERE SeriesID IN (SELECT rowid FROM Series WHERE ProgramID = " + this.id + ")");
	this.program.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.program.id, this.id, "id property");
	equals(this.program.programName, this.programName, "programName property");
});

test("remove - delete Series fail", 4, function() {
	appController.db.failAt("DELETE FROM Series WHERE ProgramID = " + this.id);
	this.program.remove();
	equals(appController.db.commands.length, 2, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.program.id, this.id, "id property");
	equals(this.program.programName, this.programName, "programName property");
});

test("remove - delete Program fail", 4, function() {
	appController.db.failAt("DELETE FROM Program WHERE rowid = " + this.id);
	this.program.remove();
	equals(appController.db.commands.length, 3, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.program.id, this.id, "id property");
	equals(this.program.programName, this.programName, "programName property");
});

test("remove - success", 5, function() {
	this.program.remove();
	equals(appController.db.commands.length, 3, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
	equals(this.program.id, null, "id property");
	equals(this.program.programName, null, "programName property");
});

test("toJson", function() {
	var testParams = [
		{
			description: "no series",
			seriesJson: []
		},
		{
			description: "with series",
			seriesJson: [{}]
		}
	];

	expect(testParams.length);

	var i;

	var programRetrieved = $.proxy(function(json) {
		same(json, {
			programName: this.programName,
			seriesList: testParams[i].seriesJson
		}, testParams[i].description + " - program JSON");
	}, this);

	for (i = 0; i < testParams.length; i++) {
		Series.seriesJson = testParams[i].seriesJson;
		this.program.toJson(programRetrieved);
	}
});

test("setProgramName", 2, function() {
	this.programName = "another-test-program";
	this.programGroup = "A";
	this.program.setProgramName(this.programName);
	equals(this.program.programName, this.programName, "programName property");
	equals(this.program.programGroup, this.programGroup, "programGroup property");
});

test("setEpisodeCount", 2, function() {
	this.episodeCount = 2;
	this.program.setEpisodeCount(this.episodeCount);
	equals(this.program.episodeCount, this.episodeCount, "episodeCount property");
	equals(this.program.progressBar.total, this.episodeCount, "progressBar.total property");
});

test("setWatchedCount", 1, function() {
	this.watchedCount = 2;
	this.program.setWatchedCount(this.watchedCount);
	equals(this.program.watchedCount, this.watchedCount, "watchedCount property");
});

test("setWatchedProgress", function() {
	var testParams = [
		{
			description: "null watched count",
			watchedCount: null,
			progressBarDisplay: {
				label: null,
				percent: 0,
				style: "watched"
			}
		},
		{
			description: "zero watched count",
			watchedCount: 0,
			progressBarDisplay: {
				label: 0,
				percent: 0,
				style: "watched"
			}
		},
		{
			description: "with watched count",
			watchedCount: 1,
			progressBarDisplay: {
				label: 1,
				percent: 100,
				style: "watched"
			}
		}
	];

	expect(testParams.length);
	for (var i = 0; i < testParams.length; i++) {
		this.program.watchedCount = testParams[i].watchedCount;
		this.program.setWatchedProgress();
		same(this.program.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
	}
});

test("setRecordedCount", function() {
	var testParams = [
		{
			description: "null recorded count",
			recordedCount: null,
			progressBarDisplay: {
				label: null,
				percent: 0,
				style: "recorded"
			}
		},
		{
			description: "zero recorded count",
			recordedCount: 0,
			progressBarDisplay: {
				label: 0,
				percent: 0,
				style: "recorded"
			}
		},
		{
			description: "with recorded count",
			recordedCount: 1,
			progressBarDisplay: {
				label: 1,
				percent: 100,
				style: "recorded"
			}
		}
	];

	expect(testParams.length * 2);
	for (var i = 0; i < testParams.length; i++) {
		this.program.setRecordedCount(testParams[i].recordedCount);
		equals(this.program.recordedCount, testParams[i].recordedCount, testParams[i].description + " - recordedCount property");
		same(this.program.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
	}
});

test("setExpectedCount", function() {
	var testParams = [
		{
			description: "null expected count",
			expectedCount: null,
			progressBarDisplay: {
				label: null,
				percent: 0,
				style: "expected"
			}
		},
		{
			description: "zero expected count",
			expectedCount: 0,
			progressBarDisplay: {
				label: 0,
				percent: 0,
				style: "expected"
			}
		},
		{
			description: "with expected count",
			expectedCount: 1,
			progressBarDisplay: {
				label: 1,
				percent: 100,
				style: "expected"
			}
		}
	];

	expect(testParams.length * 2);
	for (var i = 0; i < testParams.length; i++) {
		this.program.setExpectedCount(testParams[i].expectedCount);
		equals(this.program.expectedCount, testParams[i].expectedCount, testParams[i].description + " - expectedCount property");
		same(this.program.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
	}
});

test("list - fail", 4, function() {
	appController.db.failAt("SELECT p.rowid, p.Name, COUNT(DISTINCT s.rowid) AS SeriesCount, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.rowid = s.ProgramID LEFT OUTER JOIN Episode e on s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY p.rowid ORDER BY p.Name");
	Program.list(function(programList) {
		same(programList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Program.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("list - no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("SELECT p.rowid, p.Name, COUNT(DISTINCT s.rowid) AS SeriesCount, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.rowid = s.ProgramID LEFT OUTER JOIN Episode e on s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY p.rowid ORDER BY p.Name");
	Program.list(function(programList) {
		same(programList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("list - success", 4, function() {
	appController.db.addResultRows([{
		rowid: this.id,
		Name: this.programName,
		SeriesCount: this.seriesCount,
		EpisodeCount: this.episodeCount,
		WatchedCount: this.watchedCount,
		RecordedCount: this.recordedCount,
		ExpectedCount: this.expectedCount
	}]);
	Program.list($.proxy(function(programList) {
		same(programList, [this.program], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("count - fail", 4, function() {
	appController.db.failAt("SELECT COUNT(*) AS ProgramCount FROM Program");
	Program.count(function(count) {
		equals(count, 0, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Program.count: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("count - success", 4, function() {
	appController.db.addResultRows([{
		ProgramCount: 1
	}]);
	Program.count($.proxy(function(count) {
		equals(count, 1, "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});