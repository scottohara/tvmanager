define(
	[
		'models/series-model',
		'controllers/application-controller',
		'framework/jquery',
		'test/framework/qunit'
	],

	function(Series, ApplicationController, $, QUnit) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("series-model", {
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
				this.series = new Series(this.id, this.seriesName, this.nowShowing, this.programId, this.programName, this.episodeCount, this.watchedCount, this.recordedCount, this.expectedCount, this.missedCount, this.statusWarningCount);
			},
			teardown: function() {
				appController.db.reset();
			}
		});

		QUnit.test("constructor", 13, function() {
			QUnit.ok(this.series, "Instantiate Series object");
			QUnit.equal(this.series.id, this.id, "id property");
			QUnit.equal(this.series.seriesName, this.seriesName, "seriesName property");
			QUnit.equal(this.series.nowShowing, this.nowShowing, "nowShowing property");
			QUnit.equal(this.series.programId, this.programId, "programId property");
			QUnit.equal(this.series.programName, this.programName, "programName property");
			QUnit.equal(this.series.progressBar.total, this.episodeCount, "progressBar.total property");
			QUnit.equal(this.series.episodeCount, this.episodeCount, "episodeCount property");
			QUnit.equal(this.series.watchedCount, this.watchedCount, "watchedCount property");
			QUnit.equal(this.series.recordedCount, this.recordedCount, "recordedCount property");
			QUnit.equal(this.series.expectedCount, this.expectedCount, "expectedCount property");
			QUnit.equal(this.series.missedCount, this.missedCount, "missedCount property");
			QUnit.equal(this.series.statusWarningCount, this.statusWarningCount, "statusWarningCount property");
		});

		QUnit.test("save - update fail", 4, function() {
			appController.db.failAt("REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID) VALUES (" + this.id + ", " + this.seriesName + ", " + this.nowShowing + ", " + this.programId + ")");
			this.series.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID) VALUES (" + this.id + ", " + this.seriesName + ", " + this.nowShowing + ", " + this.programId + ")");
			this.series.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update Sync fail", 4, function() {
			appController.db.failAt("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Series', " + this.id + ", 'modified')");
			this.series.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update success", 5, function() {
			this.series.save($.proxy(function(id) {
				QUnit.equal(id, this.id, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.equal(this.series.id, this.id, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("save - insert fail", 4, function() {
			this.series.id = null;
			appController.db.failAt("REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID) VALUES (%, " + this.seriesName + ", " + this.nowShowing + ", " + this.programId + ")");
			this.series.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert no rows affected", 4, function() {
			this.series.id = null;
			appController.db.noRowsAffectedAt("REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID) VALUES (%, " + this.seriesName + ", " + this.nowShowing + ", " + this.programId + ")");
			this.series.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert Sync fail", 4, function() {
			appController.db.failAt("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Series', %, 'modified')");
			this.series.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert success", 5, function() {
			this.series.id = null;
			this.series.save(function(id) {
				QUnit.notEqual(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.notEqual(this.series.id, null, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("remove - no rows affected", 1, function() {
			this.series.id = null;
			this.series.remove();
			QUnit.equal(appController.db.commands.length, 0, "Number of SQL commands");
		});

		QUnit.test("remove - insert Episode Sync fail", 5, function() {
			appController.db.failAt("REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID = " + this.id);
			this.series.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.series.id, this.id, "id property");
			QUnit.equal(this.series.seriesName, this.seriesName, "programName property");
			QUnit.equal(this.series.programId, this.programId, "programId property");
		});

		QUnit.test("remove - delete Episode fail", 6, function() {
			appController.db.failAt("DELETE FROM Episode WHERE SeriesID = " + this.id);
			this.series.remove();
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.series.id, this.id, "id property");
			QUnit.equal(this.series.seriesName, this.seriesName, "seriesName property");
			QUnit.equal(this.series.nowShowing, this.nowShowing, "nowShowing property");
			QUnit.equal(this.series.programId, this.programId, "programId property");
		});

		QUnit.test("remove - insert Series Sync fail", 5, function() {
			appController.db.failAt("REPLACE INTO Sync (Type, ID, Action) VALUES ('Series', " + this.id + ", 'deleted')");
			this.series.remove();
			QUnit.equal(appController.db.commands.length, 3, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.series.id, this.id, "id property");
			QUnit.equal(this.series.seriesName, this.seriesName, "programName property");
			QUnit.equal(this.series.programId, this.programId, "programId property");
		});

		QUnit.test("remove - delete Series fail", 6, function() {
			appController.db.failAt("DELETE FROM Series WHERE SeriesID = " + this.id);
			this.series.remove();
			QUnit.equal(appController.db.commands.length, 4, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.series.id, this.id, "id property");
			QUnit.equal(this.series.seriesName, this.seriesName, "seriesName property");
			QUnit.equal(this.series.nowShowing, this.nowShowing, "nowShowing property");
			QUnit.equal(this.series.programId, this.programId, "programId property");
		});

		QUnit.test("remove - success", 7, function() {
			this.series.remove();
			QUnit.equal(appController.db.commands.length, 4, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
			QUnit.equal(this.series.id, null, "id property");
			QUnit.equal(this.series.seriesName, null, "seriesName property");
			QUnit.equal(this.series.nowShowing, null, "nowShowing property");
			QUnit.equal(this.series.programId, null, "programId property");
		});

		QUnit.test("toJson", 1, function() {
			QUnit.deepEqual(this.series.toJson(), {
				id: this.id,
				seriesName: this.seriesName,
				nowShowing: this.nowShowing,
				programId: this.programId
			}, "series JSON");
		});

		QUnit.test("setNowShowing", function() {
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

			QUnit.expect(testParams.length * 2);
			for (var i = 0; i < testParams.length; i++) {
				this.series.setNowShowing(testParams[i].nowShowing);
				QUnit.equal(this.series.nowShowing, (0 === testParams[i].nowShowing ? null : testParams[i].nowShowing), testParams[i].description + " - nowShowing property");
				QUnit.equal(this.series.nowShowingDisplay, testParams[i].nowShowingDisplay, testParams[i].description + " - nowShowingDisplay property");
			}
		});

		QUnit.test("setEpisodeCount", 2, function() {
			this.episodeCount = 2;
			this.series.setEpisodeCount(this.episodeCount);
			QUnit.equal(this.series.episodeCount, this.episodeCount, "episodeCount property");
			QUnit.equal(this.series.progressBar.total, this.episodeCount, "progressBar.total property");
		});

		QUnit.test("setWatchedCount", 1, function() {
			this.watchedCount = 2;
			this.series.setWatchedCount(this.watchedCount);
			QUnit.equal(this.series.watchedCount, this.watchedCount, "watchedCount property");
		});

		QUnit.test("setWatchedProgress", function() {
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

			QUnit.expect(testParams.length);
			for (var i = 0; i < testParams.length; i++) {
				this.series.watchedCount = testParams[i].watchedCount;
				this.series.setWatchedProgress();
				QUnit.deepEqual(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
			}
		});

		QUnit.test("setRecordedCount", function() {
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

			QUnit.expect(testParams.length * 2);
			for (var i = 0; i < testParams.length; i++) {
				this.series.setRecordedCount(testParams[i].recordedCount);
				QUnit.equal(this.series.recordedCount, testParams[i].recordedCount, testParams[i].description + " - recordedCount property");
				QUnit.deepEqual(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
			}
		});

		QUnit.test("setExpectedCount", function() {
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

			QUnit.expect(testParams.length * 2);
			for (var i = 0; i < testParams.length; i++) {
				this.series.setExpectedCount(testParams[i].expectedCount);
				QUnit.equal(this.series.expectedCount, testParams[i].expectedCount, testParams[i].description + " - expectedCount property");
				QUnit.deepEqual(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
			}
		});

		QUnit.test("setMissedCount", function() {
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

			QUnit.expect(testParams.length * 2);
			for (var i = 0; i < testParams.length; i++) {
				this.series.setMissedCount(testParams[i].missedCount);
				QUnit.equal(this.series.missedCount, testParams[i].missedCount, testParams[i].description + " - missedCount property");
				QUnit.deepEqual(this.series.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
			}
		});

		QUnit.test("setStatusWarning", function() {
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

			QUnit.expect(testParams.length);
			for (var i = 0; i < testParams.length; i++) {
				this.series.setStatusWarning(testParams[i].statusWarningCount);
				QUnit.equal(this.series.statusWarningCount, testParams[i].statusWarningCount, testParams[i].description + " - statusWarningCount property");
			}
		});

		QUnit.test("listByProgram - fail", 4, function() {
			appController.db.failAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' WHERE p.ProgramID = " + this.programId + " GROUP BY s.SeriesID ORDER BY s.Name");
			Series.listByProgram(this.programId, function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("listByProgram - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' WHERE p.ProgramID = " + this.programId + " GROUP BY s.SeriesID ORDER BY s.Name");
			Series.listByProgram(this.programId, function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByProgram - success", 4, function() {
			appController.db.addResultRows([{
				SeriesID: this.id,
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
				QUnit.deepEqual(seriesList, [this.series], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByNowShowing - fail", 4, function() {
			appController.db.failAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount, SUM(CASE WHEN e4.StatusDate IS NULL THEN 0 WHEN STRFTIME('%m', 'now') < '04' THEN CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END ELSE CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END END) AS StatusWarningCount FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY s.SeriesID HAVING s.NowShowing IS NOT NULL OR COUNT(e3.EpisodeID) > 0 OR COUNT(e4.EpisodeID) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name");
			Series.listByNowShowing(function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("listByNowShowing - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount, SUM(CASE WHEN e4.StatusDate IS NULL THEN 0 WHEN STRFTIME('%m', 'now') < '04' THEN CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END ELSE CASE WHEN STRFTIME('%m%d', 'now') < (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (CASE SUBSTR(e4.StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0 ELSE 1 END END) AS StatusWarningCount FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY s.SeriesID HAVING s.NowShowing IS NOT NULL OR COUNT(e3.EpisodeID) > 0 OR COUNT(e4.EpisodeID) > 0 ORDER BY CASE WHEN s.NowShowing IS NULL THEN 1 ELSE 0 END, s.NowShowing, p.Name");
			Series.listByNowShowing(function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByNowShowing - success", 4, function() {
			appController.db.addResultRows([{
				SeriesID: this.id,
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
				QUnit.deepEqual(seriesList, [this.series], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByStatus - fail", 4, function() {
			var status = "Watched";
			appController.db.failAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e.EpisodeID) AS " + status + "Count FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID JOIN Episode e ON s.SeriesID = e.SeriesID WHERE e.Status = " + status + " GROUP BY s.SeriesID ORDER BY p.Name, s.Name");
			Series.listByStatus(function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			}, status);
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("listByStatus - no rows affected", 4, function() {
			var status = "Watched";
			appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e.EpisodeID) AS " + status + "Count FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID JOIN Episode e ON s.SeriesID = e.SeriesID WHERE e.Status = " + status + " GROUP BY s.SeriesID ORDER BY p.Name, s.Name");
			Series.listByStatus(function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			}, status);
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByStatus - success", 4, function() {
			var status = "Watched";
			appController.db.addResultRows([{
				SeriesID: this.id,
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
				QUnit.deepEqual(seriesList, [this.series], "Invoke callback");
			}, this), status);
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByIncomplete - fail", 4, function() {
			appController.db.failAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY s.SeriesID HAVING COUNT(e.EpisodeID) > COUNT(e2.EpisodeID) AND COUNT(e2.EpisodeID) > 0 ORDER BY p.Name, s.Name");
			Series.listByIncomplete(function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("listByIncomplete - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT p.Name AS ProgramName, s.SeriesID, s.Name, s.NowShowing, s.ProgramID, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p JOIN Series s ON p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY s.SeriesID HAVING COUNT(e.EpisodeID) > COUNT(e2.EpisodeID) AND COUNT(e2.EpisodeID) > 0 ORDER BY p.Name, s.Name");
			Series.listByIncomplete(function(seriesList) {
				QUnit.deepEqual(seriesList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByIncomplete - success", 4, function() {
			appController.db.addResultRows([{
				SeriesID: this.id,
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
				QUnit.deepEqual(seriesList, [this.series], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("find - fail", 4, function() {
			appController.db.failAt("SELECT SeriesID, Name, ProgramID, NowShowing FROM Series WHERE SeriesID = " + this.id);
			Series.find(this.id, function(series) {
				QUnit.equal(series, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.find: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("find - success", 4, function() {
			appController.db.addResultRows([{
				SeriesID: this.id,
				Name: this.seriesName,
				NowShowing: this.nowShowing,
				ProgramID: this.programId
			}]);

			this.series.programName = undefined;
			this.series.setEpisodeCount(undefined);
			this.series.setWatchedCount(undefined);
			this.series.setRecordedCount(undefined);
			this.series.setExpectedCount(undefined);
			this.series.setMissedCount(undefined);
			this.series.setStatusWarning(undefined);

			Series.find(this.id, $.proxy(function(series) {
				QUnit.deepEqual(series, this.series, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("count - fail", 4, function() {
			appController.db.failAt("SELECT COUNT(*) AS SeriesCount FROM Series");
			Series.count(function(count) {
				QUnit.equal(count, 0, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.count: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("count - success", 4, function() {
			appController.db.addResultRows([{
				SeriesCount: 1
			}]);
			Series.count(function(count) {
				QUnit.equal(count, 1, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("removeAll - fail", 4, function() {
			appController.db.failAt("DELETE FROM Series");
			Series.removeAll(function(message) {
				QUnit.notEqual(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Series.removeAll: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("removeAll - success", 4, function() {
			Series.removeAll(function(message) {
				QUnit.equal(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("fromJson", 1, function() {
			var series = Series.fromJson({
				id: this.id,
				seriesName: this.seriesName,
				nowShowing: this.nowShowing,
				programId: this.programId
			});
			
			QUnit.deepEqual(series, new Series(this.id, this.seriesName, this.nowShowing, this.programId), "Series object");
		});
	}
);
