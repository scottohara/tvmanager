module("series-model", {
	setup: function() {
		this.id = 1;
		this.seriesName = "test-series";
		this.nowShowing = 1;
		this.programId = 2;
		this.programName = "test-program";
		this.episodeCount = 1;
		this.watchedCount = 1;
		this.recordedCount = 1;
		this.expectedCount = 1;
		this.missedCount = 1;
		this.statusWarningCount = 1;
		this.originalProgressBar = ProgressBar;
		ProgressBar = ProgressBarMock;
		this.originalEpisode = Episode;
		Episode = EpisodeMock;
		this.series = new Series(this.id, this.seriesName, this.nowShowing, this.programId, this.programName, this.episodeCount, this.watchedCount, this.recordedCount, this.expectedCount, this.missedCount, this.statusWarningCount);
		appController.db = new DatabaseMock();
	},
	teardown: function() {
		ProgressBar = this.originalProgressBar;
		Episode = this.originalEpisode;
	}
});

test("constructor", 13, function() {
	ok(this.series, "Instantiate Series object");
	equals(this.series.id, this.id, "id property")
	equals(this.series.seriesName, this.seriesName, "seriesName property")
	equals(this.series.nowShowing, this.nowShowing, "nowShowing property")
	equals(this.series.programId, this.programId, "programId property")
	equals(this.series.programName, this.programName, "programName property")
	equals(this.series.progressBar.total, this.episodeCount, "progressBar.total property");
	equals(this.series.episodeCount, this.episodeCount, "episodeCount property")
	equals(this.series.watchedCount, this.watchedCount, "watchedCount property")
	equals(this.series.recordedCount, this.recordedCount, "recordedCount property")
	equals(this.series.expectedCount, this.expectedCount, "expectedCount property")
	equals(this.series.missedCount, this.missedCount, "missedCount property")
	equals(this.series.statusWarningCount, this.statusWarningCount, "statusWarningCount property")
});

test("save - update fail", 4, function() {
	appController.db.failAt("UPDATE Series SET Name = " + this.seriesName + ", NowShowing = " + this.nowShowing + ", ProgramID = " + this.programId + " WHERE rowid = " + this.id);
	this.series.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.save: Force failed", "Error message")
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - update no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("UPDATE Series SET Name = " + this.seriesName + ", NowShowing = " + this.nowShowing + ", ProgramID = " + this.programId + " WHERE rowid = " + this.id);
	this.series.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.save: no rows affected", "Error message")
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - update success", 5, function() {
	this.series.save($.proxy(function(id) {
		equals(id, this.id, "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message")
	equals(this.series.id, this.id, "id property")
	ok(appController.db.commit, "Commit transaction");
});

test("save - insert fail", 4, function() {
	this.series.id = null;
	appController.db.failAt("INSERT INTO Series (Name, NowShowing, ProgramID) VALUES (" + this.seriesName + ", " + this.nowShowing + ", " + this.programId + ")");
	this.series.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.save: Force failed", "Error message")
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert no rows affected", 4, function() {
	this.series.id = null;
	appController.db.noRowsAffectedAt("INSERT INTO Series (Name, NowShowing, ProgramID) VALUES (" + this.seriesName + ", " + this.nowShowing + ", " + this.programId + ")");
	this.series.save(function(id) {
		equals(id, null, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.save: no rows affected", "Error message")
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert success", 5, function() {
	this.series.id = null;
	this.series.save(function(id) {
		equals(id, 999, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	equals(this.series.id, 999, "id property");
	ok(appController.db.commit, "Commit transaction");
});

test("remove - no rows affected", 1, function() {
	this.series.id = null;
	this.series.remove();
	equals(appController.db.commands.length, 0, "Number of SQL commands");
});

test("remove - delete Episode fail", 6, function() {
	appController.db.failAt("DELETE FROM Episode WHERE SeriesID = " + this.id);
	this.series.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.series.id, this.id, "id property");
	equals(this.series.seriesName, this.seriesName, "seriesName property");
	equals(this.series.nowShowing, this.nowShowing, "nowShowing property");
	equals(this.series.programId, this.programId, "programId property");
});

test("remove - delete Series fail", 6, function() {
	appController.db.failAt("DELETE FROM Series WHERE rowid = " + this.id);
	this.series.remove();
	equals(appController.db.commands.length, 2, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.series.id, this.id, "id property");
	equals(this.series.seriesName, this.seriesName, "seriesName property");
	equals(this.series.nowShowing, this.nowShowing, "nowShowing property");
	equals(this.series.programId, this.programId, "programId property");
});

test("remove - success", 7, function() {
	this.series.remove();
	equals(appController.db.commands.length, 2, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
	equals(this.series.id, null, "id property");
	equals(this.series.seriesName, null, "seriesName property");
	equals(this.series.nowShowing, null, "nowShowing property");
	equals(this.series.programId, null, "programId property");
});

test("toJson", 1, function() {
	this.series.toJson($.proxy(function(json) {
		same(json, {
			seriesName: this.seriesName,
			nowShowing: this.nowShowing,
			episodes: [{}]
		}, "series JSON");
	}, this));
});

test("setNowShowing", function() {
	var testParams = [
		{
			description: "null now showing",
			nowShowing: null,
			nowShowingDisplay: "Not Showing"
		},
		{
			description: "zero now showing",
			nowShowing: 0,
			nowShowingDisplay: "Not Showing"
		},
		{
			description: "with now showing",
			nowShowing: 2,
			nowShowingDisplay: "Tuesdays"
		}
	];

	expect(testParams.length * 2);
	for (var i = 0; i < testParams.length; i++) {
		this.series.setNowShowing(testParams[i].nowShowing);
		equals(this.series.nowShowing, (testParams[i].nowShowing === 0 ? null : testParams[i].nowShowing), testParams[i].description + " - nowShowing property");
		equals(this.series.nowShowingDisplay, testParams[i].nowShowingDisplay, testParams[i].description + " - nowShowingDisplay property");
	}
});

test("setEpisodeCount", 2, function() {
	this.episodeCount = 2;
	this.series.setEpisodeCount(this.episodeCount);
	equals(this.series.episodeCount, this.episodeCount, "episodeCount property");
	equals(this.series.progressBar.total, this.episodeCount, "progressBar.total property");
});

test("setWatchedCount", 1, function() {
	this.watchedCount = 2;
	this.series.setWatchedCount(this.watchedCount);
	equals(this.series.watchedCount, this.watchedCount, "watchedCount property");
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
		this.series.watchedCount = testParams[i].watchedCount;
		this.series.setWatchedProgress();
		same(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
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
		this.series.setRecordedCount(testParams[i].recordedCount);
		equals(this.series.recordedCount, testParams[i].recordedCount, testParams[i].description + " - recordedCount property");
		same(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
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
		this.series.setExpectedCount(testParams[i].expectedCount);
		equals(this.series.expectedCount, testParams[i].expectedCount, testParams[i].description + " - expectedCount property");
		same(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
	}
});

test("setMissedCount", function() {
	var testParams = [
		{
			description: "null missed count",
			missedCount: null,
			progressBarDisplay: {
				label: null,
				percent: 0,
				style: "missed"
			}
		},
		{
			description: "zero missed count",
			missedCount: 0,
			progressBarDisplay: {
				label: 0,
				percent: 0,
				style: "missed"
			}
		},
		{
			description: "with missed count",
			missedCount: 1,
			progressBarDisplay: {
				label: 1,
				percent: 100,
				style: "missed"
			}
		}
	];

	expect(testParams.length * 2);
	for (var i = 0; i < testParams.length; i++) {
		this.series.setMissedCount(testParams[i].missedCount);
		equals(this.series.missedCount, testParams[i].missedCount, testParams[i].description + " - missedCount property");
		same(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
	}
});

test("setStatusWarning", function() {
	var testParams = [
		{
			description: "no warning count",
			statusWarningCount: 0,
			statusWarning: ''
		},
		{
			description: "with warning count",
			statusWarningCount: 1,
			statusWarning: 'warning'
		}
	];

	expect(testParams.length);
	for (var i = 0; i < testParams.length; i++) {
		this.series.setStatusWarning(testParams[i].statusWarningCount);
		equals(this.series.statusWarningCount, testParams[i].statusWarningCount, testParams[i].description + " - statusWarningCount property");
	}
});

test("listByProgram - fail", 4, function() {
	appController.db.failAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' WHERE ProgramID = " + this.programId + " GROUP BY s.rowid ORDER BY s.Name");
	Series.listByProgram(this.programId, function(seriesList) {
		same(seriesList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("listByProgram - no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' WHERE ProgramID = " + this.programId + " GROUP BY s.rowid ORDER BY s.Name");
	Series.listByProgram(this.programId, function(seriesList) {
		same(seriesList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByProgram - success", 4, function() {
	appController.db.addResultRows([{
		rowid: this.id,
		Name: this.seriesName,
		NowShowing: this.nowShowing,
		ProgramID: this.programId,
		ProgramName: this.programName,
		EpisodeCount: this.episodeCount,
		WatchedCount: this.watchedCount,
		RecordedCount: this.recordedCount,
		ExpectedCount: this.expectedCount,
		MissedCount: this.missedCount,
		StatusWarningCount: this.statusWarningCount
	}]);
	Series.listByProgram(this.programId, $.proxy(function(seriesList) {
		same(seriesList, [this.series], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByNowShowing - fail", 4, function() {
	appController.db.failAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount, SUM(CASE WHEN e4.StatusDate IS NULL THEN 0 WHEN STRFTIME('%m', 'now') < '04' THEN CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END ELSE CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END END) AS StatusWarningCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY s.rowid HAVING s.NowShowing IS NOT NULL OR COUNT(e3.rowid) > 0 OR COUNT(e4.rowid) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name");
	Series.listByNowShowing(function(seriesList) {
		same(seriesList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("listByNowShowing - no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount, SUM(CASE WHEN e4.StatusDate IS NULL THEN 0 WHEN STRFTIME('%m', 'now') < '04' THEN CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END ELSE CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END END) AS StatusWarningCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY s.rowid HAVING s.NowShowing IS NOT NULL OR COUNT(e3.rowid) > 0 OR COUNT(e4.rowid) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name");
	Series.listByNowShowing(function(seriesList) {
		same(seriesList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByNowShowing - success", 4, function() {
	appController.db.addResultRows([{
		rowid: this.id,
		Name: this.seriesName,
		NowShowing: this.nowShowing,
		ProgramID: this.programId,
		ProgramName: this.programName,
		EpisodeCount: this.episodeCount,
		WatchedCount: this.watchedCount,
		RecordedCount: this.recordedCount,
		ExpectedCount: this.expectedCount,
		MissedCount: this.missedCount,
		StatusWarningCount: this.statusWarningCount
	}]);
	Series.listByNowShowing($.proxy(function(seriesList) {
		same(seriesList, [this.series], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByStatus - fail", 4, function() {
	var status = "Watched";
	appController.db.failAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e.rowid) AS " + status + "Count FROM Program p JOIN Series s ON p.rowid = s.ProgramID JOIN Episode e ON s.rowid = e.SeriesID WHERE e.Status = " + status + " GROUP BY s.rowid ORDER BY p.Name, s.Name");
	Series.listByStatus(function(seriesList) {
		same(seriesList, [], "Invoke callback");
	}, status);
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("listByStatus - no rows affected", 4, function() {
	var status = "Watched";
	appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e.rowid) AS " + status + "Count FROM Program p JOIN Series s ON p.rowid = s.ProgramID JOIN Episode e ON s.rowid = e.SeriesID WHERE e.Status = " + status + " GROUP BY s.rowid ORDER BY p.Name, s.Name");
	Series.listByStatus(function(seriesList) {
		same(seriesList, [], "Invoke callback");
	}, status);
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByStatus - success", 4, function() {
	var status = "Watched";
	appController.db.addResultRows([{
		rowid: this.id,
		Name: this.seriesName,
		NowShowing: this.nowShowing,
		ProgramID: this.programId,
		ProgramName: this.programName,
		EpisodeCount: this.episodeCount,
		WatchedCount: this.watchedCount,
		RecordedCount: this.recordedCount,
		ExpectedCount: this.expectedCount,
		MissedCount: this.missedCount,
		StatusWarningCount: this.statusWarningCount
	}]);
	Series.listByStatus($.proxy(function(seriesList) {
		same(seriesList, [this.series], "Invoke callback");
	}, this), status);
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByIncomplete - fail", 4, function() {
	appController.db.failAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY s.rowid HAVING COUNT(e.rowid) > COUNT(e2.rowid) AND COUNT(e2.rowid) > 0 ORDER BY p.Name, s.Name");
	Series.listByIncomplete(function(seriesList) {
		same(seriesList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("listByIncomplete - no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.rowid, s.Name, s.NowShowing, s.ProgramID, COUNT(e.rowid) AS EpisodeCount, COUNT(e2.rowid) AS WatchedCount, COUNT(e3.rowid) AS RecordedCount, COUNT(e4.rowid) AS ExpectedCount FROM Program p JOIN Series s ON p.rowid = s.ProgramID LEFT OUTER JOIN Episode e ON s.rowid = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.rowid = e2.rowid AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.rowid = e3.rowid AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.rowid = e4.rowid AND e4.Status = 'Expected' GROUP BY s.rowid HAVING COUNT(e.rowid) > COUNT(e2.rowid) AND COUNT(e2.rowid) > 0 ORDER BY p.Name, s.Name");
	Series.listByIncomplete(function(seriesList) {
		same(seriesList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByIncomplete - success", 4, function() {
	appController.db.addResultRows([{
		rowid: this.id,
		Name: this.seriesName,
		NowShowing: this.nowShowing,
		ProgramID: this.programId,
		ProgramName: this.programName,
		EpisodeCount: this.episodeCount,
		WatchedCount: this.watchedCount,
		RecordedCount: this.recordedCount,
		ExpectedCount: this.expectedCount,
		MissedCount: this.missedCount,
		StatusWarningCount: this.statusWarningCount
	}]);
	Series.listByIncomplete($.proxy(function(seriesList) {
		same(seriesList, [this.series], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("count - fail", 4, function() {
	appController.db.failAt("SELECT COUNT(*) AS SeriesCount FROM Series");
	Series.count(function(count) {
		equals(count, 0, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Series.count: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("count - success", 4, function() {
	appController.db.addResultRows([{
		SeriesCount: 1
	}]);
	Series.count($.proxy(function(count) {
		equals(count, 1, "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});