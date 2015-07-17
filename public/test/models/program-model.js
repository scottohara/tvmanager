define(
	[
		'models/program-model',
		'controllers/application-controller',
		'framework/jquery'
	],

	function(Program, ApplicationController, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("program-model", {
			setup: function() {
				this.id = 1;
				this.programName = "test-program";
				this.seriesCount = 1;
				this.episodeCount = 1;
				this.watchedCount = 1;
				this.recordedCount = 1;
				this.expectedCount = 1;
				this.program = new Program(this.id, this.programName, this.seriesCount, this.episodeCount, this.watchedCount, this.recordedCount, this.expectedCount);
			},
			teardown: function() {
				appController.db.reset();
			}
		});

		QUnit.test("object constructor", 9, function() {
			QUnit.ok(this.program, "Instantiate Program object");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
			QUnit.equal(this.program.progressBar.total, this.episodeCount, "progressBar.total property");
			QUnit.equal(this.program.seriesCount, this.seriesCount, "seriesCount property");
			QUnit.equal(this.program.episodeCount, this.episodeCount, "episodeCount property");
			QUnit.equal(this.program.watchedCount, this.watchedCount, "watchedCount property");
			QUnit.equal(this.program.recordedCount, this.recordedCount, "recordedCount property");
			QUnit.equal(this.program.expectedCount, this.expectedCount, "expectedCount property");
		});

		QUnit.test("save - update fail without callback", 3, function() {
			appController.db.failAt("REPLACE INTO Program (ProgramID, Name) VALUES (" + this.id + ", " + this.programName + ")");
			this.program.save();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update fail with callback", 4, function() {
			appController.db.failAt("REPLACE INTO Program (ProgramID, Name) VALUES (" + this.id + ", " + this.programName + ")");
			this.program.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("REPLACE INTO Program (ProgramID, Name) VALUES (" + this.id + ", " + this.programName + ")");
			this.program.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update Sync fail", 4, function() {
			appController.db.failAt("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Program', " + this.id + ", 'modified')");
			this.program.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update success without callback", 4, function() {
			this.program.save();
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("save - update success with callback", 5, function() {
			this.program.save($.proxy(function(id) {
				QUnit.equal(id, this.id, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("save - insert fail", 4, function() {
			this.program.id = null;
			appController.db.failAt("REPLACE INTO Program (ProgramID, Name) VALUES (%, " + this.programName + ")");
			this.program.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert no rows affected", 4, function() {
			this.program.id = null;
			appController.db.noRowsAffectedAt("REPLACE INTO Program (ProgramID, Name) VALUES (%, " + this.programName + ")");
			this.program.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert Sync fail", 4, function() {
			appController.db.failAt("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Program', %, 'modified')");
			this.program.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert success", 5, function() {
			this.program.id = null;
			this.program.save(function(id) {
				QUnit.notEqual(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.notEqual(this.program.id, null, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("remove - no rows affected", 1, function() {
			this.program.id = null;
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 0, "Number of SQL commands");
		});

		QUnit.test("remove - insert Episode Sync fail", 4, function() {
			appController.db.failAt("REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = " + this.id);
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
		});

		QUnit.test("remove - delete Episode fail", 4, function() {
			appController.db.failAt("DELETE FROM Episode WHERE SeriesID IN (SELECT SeriesID FROM Series WHERE ProgramID = " + this.id + ")");
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
		});

		QUnit.test("remove - insert Series Sync fail", 4, function() {
			appController.db.failAt("REPLACE INTO Sync (Type, ID, Action) SELECT 'Series', SeriesID, 'deleted' FROM Series WHERE ProgramID = " + this.id);
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 3, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
		});

		QUnit.test("remove - delete Series fail", 4, function() {
			appController.db.failAt("DELETE FROM Series WHERE ProgramID = " + this.id);
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 4, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
		});

		QUnit.test("remove - insert Program Sync fail", 4, function() {
			appController.db.failAt("REPLACE INTO Sync (Type, ID, Action) VALUES ('Program', " + this.id + ", 'deleted')");
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 5, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
		});

		QUnit.test("remove - delete Program fail", 4, function() {
			appController.db.failAt("DELETE FROM Program WHERE ProgramID = " + this.id);
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 6, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.program.id, this.id, "id property");
			QUnit.equal(this.program.programName, this.programName, "programName property");
		});

		QUnit.test("remove - success", 5, function() {
			this.program.remove();
			QUnit.equal(appController.db.commands.length, 6, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
			QUnit.equal(this.program.id, null, "id property");
			QUnit.equal(this.program.programName, null, "programName property");
		});

		QUnit.test("toJson", 1, function() {
			QUnit.deepEqual(this.program.toJson(), {
				id: this.id,
				programName: this.programName
			}, "program JSON");
		});

		QUnit.test("setProgramName", 2, function() {
			this.programName = "another-test-program";
			this.programGroup = "A";
			this.program.setProgramName(this.programName);
			QUnit.equal(this.program.programName, this.programName, "programName property");
			QUnit.equal(this.program.programGroup, this.programGroup, "programGroup property");
		});

		QUnit.test("setEpisodeCount", 2, function() {
			this.episodeCount = 2;
			this.program.setEpisodeCount(this.episodeCount);
			QUnit.equal(this.program.episodeCount, this.episodeCount, "episodeCount property");
			QUnit.equal(this.program.progressBar.total, this.episodeCount, "progressBar.total property");
		});

		QUnit.test("setWatchedCount", 1, function() {
			this.watchedCount = 2;
			this.program.setWatchedCount(this.watchedCount);
			QUnit.equal(this.program.watchedCount, this.watchedCount, "watchedCount property");
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
				this.program.watchedCount = testParams[i].watchedCount;
				this.program.setWatchedProgress();
				QUnit.deepEqual(this.program.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
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
				this.program.setRecordedCount(testParams[i].recordedCount);
				QUnit.equal(this.program.recordedCount, testParams[i].recordedCount, testParams[i].description + " - recordedCount property");
				QUnit.deepEqual(this.program.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
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
				this.program.setExpectedCount(testParams[i].expectedCount);
				QUnit.equal(this.program.expectedCount, testParams[i].expectedCount, testParams[i].description + " - expectedCount property");
				QUnit.deepEqual(this.program.progressBarDisplay, testParams[i].progressBarDisplay, testParams[i].description + " - progressBarDisplay property");
			}
		});

		QUnit.test("list - fail", 4, function() {
			appController.db.failAt("SELECT p.ProgramID, p.Name, COUNT(DISTINCT s.SeriesID) AS SeriesCount, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e on s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY p.ProgramID ORDER BY p.Name");
			Program.list(function(programList) {
				QUnit.deepEqual(programList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("list - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT p.ProgramID, p.Name, COUNT(DISTINCT s.SeriesID) AS SeriesCount, COUNT(e.EpisodeID) AS EpisodeCount, COUNT(e2.EpisodeID) AS WatchedCount, COUNT(e3.EpisodeID) AS RecordedCount, COUNT(e4.EpisodeID) AS ExpectedCount FROM Program p LEFT OUTER JOIN Series s on p.ProgramID = s.ProgramID LEFT OUTER JOIN Episode e on s.SeriesID = e.SeriesID LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched' LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded' LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected' GROUP BY p.ProgramID ORDER BY p.Name");
			Program.list(function(programList) {
				QUnit.deepEqual(programList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("list - success", 4, function() {
			appController.db.addResultRows([{
				ProgramID: this.id,
				Name: this.programName,
				SeriesCount: this.seriesCount,
				EpisodeCount: this.episodeCount,
				WatchedCount: this.watchedCount,
				RecordedCount: this.recordedCount,
				ExpectedCount: this.expectedCount
			}]);
			Program.list($.proxy(function(programList) {
				QUnit.deepEqual(programList, [this.program], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("find - fail", 4, function() {
			appController.db.failAt("SELECT ProgramID, Name FROM Program WHERE ProgramID = " + this.id);
			Program.find(this.id, function(program) {
				QUnit.equal(program, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.find: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("find - success", 4, function() {
			appController.db.addResultRows([{
				ProgramID: this.id,
				Name: this.programName
			}]);

			this.program.seriesCount = undefined;
			this.program.setEpisodeCount(undefined);
			this.program.setWatchedCount(undefined);
			this.program.setRecordedCount(undefined);
			this.program.setExpectedCount(undefined);

			Program.find(this.id, $.proxy(function(program) {
				QUnit.deepEqual(program, this.program, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("count - fail", 4, function() {
			appController.db.failAt("SELECT COUNT(*) AS ProgramCount FROM Program");
			Program.count(function(count) {
				QUnit.equal(count, 0, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.count: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("count - success", 4, function() {
			appController.db.addResultRows([{
				ProgramCount: 1
			}]);
			Program.count(function(count) {
				QUnit.equal(count, 1, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("removeAll - fail", 4, function() {
			appController.db.failAt("DELETE FROM Program");
			Program.removeAll(function(message) {
				QUnit.notEqual(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Program.removeAll: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("removeAll - success", 4, function() {
			Program.removeAll(function(message) {
				QUnit.equal(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("fromJson", 1, function() {
			var program = Program.fromJson({
				id: this.id,
				programName: this.programName
			});
			
			QUnit.deepEqual(program, new Program(this.id, this.programName), "Program object");
		});
	}
);
