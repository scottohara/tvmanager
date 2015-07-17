define(
	[
		'models/episode-model',
		'controllers/application-controller',
		'framework/jquery'
	],

	function(Episode, ApplicationController, $) {
		"use strict";

		// Get a reference to the application controller singleton
		var appController = new ApplicationController();

		QUnit.module("episode-model", {
			setup: function() {
				this.id = 1;
				this.episodeName = "test-episode";
				this.status = "Expected";
				this.statusDate = "31-Dec";
				this.unverified = true;
				this.unscheduled = true;
				this.sequence = 1;
				this.seriesId = 2;
				this.seriesName = "test-series";
				this.programId = 3;
				this.programName = "test-program";
				this.episode = new Episode(this.id, this.episodeName, this.status, this.statusDate, this.unverified, this.unscheduled, this.sequence, this.seriesId, this.seriesName, this.programId, this.programName);
			},
			teardown: function() {
				appController.db.reset();
			}
		});

		QUnit.test("object constructor", 12, function() {
			QUnit.ok(this.episode, "Instantiate Episode object");
			QUnit.equal(this.episode.id, this.id, "id property");
			QUnit.equal(this.episode.episodeName, this.episodeName, "episodeName property");
			QUnit.equal(this.episode.status, this.status, "status property");
			QUnit.equal(this.episode.statusDate, this.statusDate, "statusDate property");
			QUnit.equal(this.episode.unverified, this.unverified, "unverified property");
			QUnit.equal(this.episode.unscheduled, this.unscheduled, "unscheduled property");
			QUnit.equal(this.episode.sequence, this.sequence, "sequence property");
			QUnit.equal(this.episode.seriesId, this.seriesId, "seriesId property");
			QUnit.equal(this.episode.seriesName, this.seriesName, "seriesName property");
			QUnit.equal(this.episode.programId, this.programId, "programId property");
			QUnit.equal(this.episode.programName, this.programName, "programName property");
		});

		QUnit.test("save - update fail without callback", 3, function() {
			appController.db.failAt("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (" + this.id + ", " + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
			this.episode.save();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update fail with callback", 4, function() {
			appController.db.failAt("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (" + this.id + ", " + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
			this.episode.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (" + this.id + ", " + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
			this.episode.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update Sync fail", 4, function() {
			appController.db.failAt("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Episode', " + this.id + ", 'modified')");
			this.episode.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - update success without callback", 4, function() {
			this.episode.save();
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.equal(this.episode.id, this.id, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("save - update success with callback", 5, function() {
			this.episode.save($.proxy(function(id) {
				QUnit.equal(id, this.id, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.equal(this.episode.id, this.id, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("save - insert fail", 4, function() {
			this.episode.id = null;
			appController.db.failAt("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (%, " + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
			this.episode.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert no rows affected", 4, function() {
			this.episode.id = null;
			appController.db.noRowsAffectedAt("REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (%, " + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
			this.episode.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: no rows affected", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert Sync fail", 4, function() {
			appController.db.failAt("INSERT OR IGNORE INTO Sync (Type, ID, Action) VALUES ('Episode', %, 'modified')");
			this.episode.save(function(id) {
				QUnit.equal(id, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("save - insert success", 5, function() {
			this.episode.id = null;
			this.episode.save($.proxy(function(id) {
				QUnit.notEqual(id, null, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.notEqual(this.episode.id, null, "id property");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("remove - no rows affected", 1, function() {
			this.episode.id = null;
			this.episode.remove();
			QUnit.equal(appController.db.commands.length, 0, "Number of SQL commands");
		});

		QUnit.test("remove - insert Sync fail", 5, function() {
			appController.db.failAt("REPLACE INTO Sync (Type, ID, Action) VALUES ('Episode', " + this.id + ", 'deleted')");
			this.episode.remove();
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.episode.id, this.id, "id property");
			QUnit.equal(this.episode.episodeName, this.episodeName, "episodeName property");
			QUnit.equal(this.episode.seriesId, this.seriesId, "seriesId property");
		});

		QUnit.test("remove - fail", 5, function() {
			appController.db.failAt("DELETE FROM Episode WHERE EpisodeID = " + this.id);
			this.episode.remove();
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
			QUnit.equal(this.episode.id, this.id, "id property");
			QUnit.equal(this.episode.episodeName, this.episodeName, "episodeName property");
			QUnit.equal(this.episode.seriesId, this.seriesId, "seriesId property");
		});

		QUnit.test("remove - success", 6, function() {
			this.episode.remove();
			QUnit.equal(appController.db.commands.length, 2, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
			QUnit.equal(this.episode.id, null, "id property");
			QUnit.equal(this.episode.episodeName, null, "episodeName property");
			QUnit.equal(this.episode.seriesId, null, "seriesId property");
		});

		QUnit.test("toJson", 1, function() {
			QUnit.deepEqual(this.episode.toJson(), {
				id: this.id,
				episodeName: this.episodeName,
				seriesId: this.seriesId,
				status: this.status,
				statusDate: this.statusDate,
				unverified: this.unverified,
				unscheduled: this.unscheduled,
				sequence: this.sequence
			}, "episode JSON");
		});

		QUnit.test("setStatus", 1, function() {
			this.status = "Watched";
			this.episode.setStatus(this.status);
			QUnit.equal(this.episode.status, this.status, "status property");
		});

		QUnit.test("setStatusDate", function() {
			var testParams = [
				{
					description: "Recorded without date",
					status: "Recorded",
					unscheduled: false,
					statusDate: "",
					statusDateDisplay: "",
					statusWarning: ""
				},
				{
					description: "Recorded with date",
					status: "Recorded",
					unscheduled: false,
					statusDate: "31-Dec",
					statusDateDisplay: "(31-Dec)",
					statusWarning: ""
				},
				{
					description: "Expected without date",
					status: "Expected",
					unscheduled: false,
					statusDate: "",
					statusDateDisplay: "",
					statusWarning: ""
				},
				{
					description: "Expected with date at end of warning range (today = 01-Jan)",
					status: "Expected",
					unscheduled: false,
					statusDate: "01-Jan",
					statusDateDisplay: "(01-Jan)",
					statusWarning: "warning",
					today: {
						day: 1,
						month: 0
					}
				},
				{
					description: "Expected with date after end of warning range (today = 01-Jan)",
					status: "Expected",
					unscheduled: false,
					statusDate: "02-Jan",
					statusDateDisplay: "(02-Jan)",
					statusWarning: "",
					today: {
						day: 1,
						month: 0
					}
				},
				{
					description: "Expected with date at start of warning range (today = 01-Jan)",
					status: "Expected",
					unscheduled: false,
					statusDate: "01-Oct",
					statusDateDisplay: "(01-Oct)",
					statusWarning: "warning",
					today: {
						day: 1,
						month: 0
					}
				},
				{
					description: "Expected with date before start of warning range (today = 01-Jan)",
					status: "Expected",
					unscheduled: false,
					statusDate: "30-Sep",
					statusDateDisplay: "(30-Sep)",
					statusWarning: "",
					today: {
						day: 1,
						month: 0
					}
				},
				{
					description: "Expected with date at end of warning range (today = 31-Mar)",
					status: "Expected",
					unscheduled: false,
					statusDate: "31-Mar",
					statusDateDisplay: "(31-Mar)",
					statusWarning: "warning",
					today: {
						day: 31,
						month: 2
					}
				},
				{
					description: "Expected with date after end of warning range (today = 31-Mar)",
					status: "Expected",
					unscheduled: false,
					statusDate: "01-Apr",
					statusDateDisplay: "(01-Apr)",
					statusWarning: "",
					today: {
						day: 31,
						month: 2
					}
				},
				{
					description: "Expected with date at start of warning range (today = 31-Mar)",
					status: "Expected",
					unscheduled: false,
					statusDate: "31-Dec",
					statusDateDisplay: "(31-Dec)",
					statusWarning: "warning",
					today: {
						day: 31,
						month: 2
					}
				},
				{
					description: "Expected with date before start of warning range (today = 31-Mar)",
					status: "Expected",
					unscheduled: false,
					statusDate: "30-Dec",
					statusDateDisplay: "(30-Dec)",
					statusWarning: "",
					today: {
						day: 31,
						month: 2
					}
				},
				{
					description: "Expected with date at end of warning range (today = 01-Apr)",
					status: "Expected",
					unscheduled: false,
					statusDate: "01-Apr",
					statusDateDisplay: "(01-Apr)",
					statusWarning: "warning",
					today: {
						day: 1,
						month: 3
					}
				},
				{
					description: "Expected with date after end of warning range (today = 01-Apr)",
					status: "Expected",
					unscheduled: false,
					statusDate: "02-Apr",
					statusDateDisplay: "(02-Apr)",
					statusWarning: "",
					today: {
						day: 1,
						month: 3
					}
				},
				{
					description: "Expected with date at start of warning range (today = 01-Apr)",
					status: "Expected",
					unscheduled: false,
					statusDate: "01-Jan",
					statusDateDisplay: "(01-Jan)",
					statusWarning: "warning",
					today: {
						day: 1,
						month: 3
					}
				},
				{
					description: "Expected with date before start of warning range (today = 01-Apr)",
					status: "Expected",
					unscheduled: false,
					statusDate: "31-Dec",
					statusDateDisplay: "(31-Dec)",
					statusWarning: "",
					today: {
						day: 1,
						month: 3
					}
				},
				{
					description: "Missed without date",
					status: "Missed",
					unscheduled: false,
					statusDate: "",
					statusDateDisplay: "",
					statusWarning: ""
				},
				{
					description: "Missed with date",
					status: "Missed",
					unscheduled: false,
					statusDate: "31-Dec",
					statusDateDisplay: "(31-Dec)",
					statusWarning: ""
				},
				{
					description: "Unscheduled without date",
					status: "",
					unscheduled: true,
					statusDate: "",
					statusDateDisplay: "",
					statusWarning: ""
				},
				{
					description: "Unscheduled with date",
					status: "",
					unscheduled: true,
					statusDate: "31-Dec",
					statusDateDisplay: "(31-Dec)",
					statusWarning: ""
				}
			];

			QUnit.expect(testParams.length * 3);

			var realDate = new Date();
			var fakeDate;

			var fakeDateConstructor = function() {
				return fakeDate;
			};

			for (var i = 0; i < testParams.length; i++) {
				var originalDate = Date;
				this.episode.status = testParams[i].status;
				this.episode.unscheduled = testParams[i].unscheduled;
				if (testParams[i].today) {
					fakeDate = new Date(realDate.getFullYear(), testParams[i].today.month, testParams[i].today.day);
					Date = fakeDateConstructor;
				}
				this.episode.setStatusDate(testParams[i].statusDate);
				QUnit.equal(this.episode.statusDate, testParams[i].statusDate, testParams[i].description + " - statusDate property");
				QUnit.equal(this.episode.statusDateDisplay, testParams[i].statusDateDisplay, testParams[i].description + " - statusDateDisplay property");
				QUnit.equal(this.episode.statusWarning, testParams[i].statusWarning, testParams[i].description + " - statusWarning property");
				Date = originalDate;
			}
		});

		QUnit.test("setUnverified", function() {
			var testParams = [
				{
					description: "Watched & Unverified",
					status: "Watched",
					unverified: true,
					unverifiedDisplay: ""
				},
				{
					description: "Watched & Verified",
					status: "Watched",
					unverified: false,
					unverifiedDisplay: ""
				},
				{
					description: "Unwatched & Unverified",
					status: "",
					unverified: true,
					unverifiedDisplay: "Unverified"
				},
				{
					description: "Unwatched & Verified",
					status: "",
					unverified: false,
					unverifiedDisplay: ""
				}
			];

			QUnit.expect(testParams.length * 2);
			for (var i = 0; i < testParams.length; i++) {
				this.episode.status = testParams[i].status;
				this.episode.setUnverified(testParams[i].unverified);
				QUnit.equal(this.episode.unverified, testParams[i].unverified, testParams[i].description + " - unverified property");
				QUnit.equal(this.episode.unverifiedDisplay, testParams[i].unverifiedDisplay, testParams[i].description + " - unverifiedDisplay property");
			}
		});

		QUnit.test("listBySeries - fail", 4, function() {
			appController.db.failAt("SELECT e.EpisodeID, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.SeriesID JOIN Program p ON s.ProgramID = p.ProgramID WHERE e.SeriesID = " + this.seriesId + " ORDER BY e.Sequence, e.EpisodeID");
			Episode.listBySeries(this.seriesId, function(episodeList) {
				QUnit.deepEqual(episodeList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("listBySeries - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT e.EpisodeID, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.SeriesID JOIN Program p ON s.ProgramID = p.ProgramID WHERE e.SeriesID = " + this.seriesId + " ORDER BY e.Sequence, e.EpisodeID");
			Episode.listBySeries(this.seriesId, function(episodeList) {
				QUnit.deepEqual(episodeList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listBySeries - success", 4, function() {
			appController.db.addResultRows([{
				EpisodeID: this.id,
				Name: this.episodeName,
				Status: this.status,
				StatusDate: this.statusDate,
				Unverified: String(this.unverified),
				Unscheduled: String(this.unscheduled),
				Sequence: this.sequence,
				SeriesID: this.seriesId,
				SeriesName: this.seriesName,
				ProgramID: this.programId,
				ProgramName: this.programName
			}]);
			Episode.listBySeries(this.seriesId, $.proxy(function(episodeList) {
				QUnit.deepEqual(episodeList, [this.episode], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByUnscheduled - fail", 4, function() {
			appController.db.failAt("SELECT e.EpisodeID, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.SeriesID JOIN Program p ON s.ProgramID = p.ProgramID WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)");
			Episode.listByUnscheduled(function(episodeList) {
				QUnit.deepEqual(episodeList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.list: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("listByUnscheduled - no rows affected", 4, function() {
			appController.db.noRowsAffectedAt("SELECT e.EpisodeID, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.SeriesID JOIN Program p ON s.ProgramID = p.ProgramID WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)");
			Episode.listByUnscheduled(function(episodeList) {
				QUnit.deepEqual(episodeList, [], "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("listByUnscheduled - success", 4, function() {
			appController.db.addResultRows([{
				EpisodeID: this.id,
				Name: this.episodeName,
				Status: this.status,
				StatusDate: this.statusDate,
				Unverified: String(this.unverified),
				Unscheduled: String(this.unscheduled),
				Sequence: this.sequence,
				SeriesID: this.seriesId,
				SeriesName: this.seriesName,
				ProgramID: this.programId,
				ProgramName: this.programName
			}]);
			Episode.listByUnscheduled($.proxy(function(episodeList) {
				QUnit.deepEqual(episodeList, [this.episode], "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("find - fail", 4, function() {
			appController.db.failAt("SELECT EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence FROM Episode WHERE EpisodeID = " + this.id);
			Episode.find(this.id, function(episode) {
				QUnit.equal(episode, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.find: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("find - success", 4, function() {
			appController.db.addResultRows([{
				EpisodeID: this.id,
				Name: this.episodeName,
				Status: this.status,
				StatusDate: this.statusDate,
				Unverified: String(this.unverified),
				Unscheduled: String(this.unscheduled),
				Sequence: this.sequence,
				SeriesID: this.seriesId
			}]);

			this.episode.seriesName = undefined;
			this.episode.programName = undefined;
			this.episode.programId = undefined;

			Episode.find(this.id, $.proxy(function(episode) {
				QUnit.deepEqual(episode, this.episode, "Invoke callback");
			}, this));
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("totalCount - fail", 4, function() {
			appController.db.failAt("SELECT COUNT(*) AS EpisodeCount FROM Episode ");
			Episode.totalCount(function(count) {
				QUnit.equal(count, 0, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.count: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("totalCount - success", 4, function() {
			appController.db.addResultRows([{
				EpisodeCount: 1
			}]);
			Episode.totalCount(function(count) {
				QUnit.equal(count, 1, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("countByStatus - fail", 4, function() {
			appController.db.failAt("SELECT COUNT(*) AS EpisodeCount FROM Episode WHERE Status = " + this.status);
			Episode.countByStatus(this.status, function(count) {
				QUnit.equal(count, 0, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.count: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("countByStatus - success", 4, function() {
			appController.db.addResultRows([{
				EpisodeCount: 1
			}]);
			Episode.countByStatus(this.status, function(count) {
				QUnit.equal(count, 1, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("removeAll - fail", 4, function() {
			appController.db.failAt("DELETE FROM Episode");
			Episode.removeAll(function(message) {
				QUnit.notEqual(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, "Episode.removeAll: Force failed", "Error message");
			QUnit.ok(!appController.db.commit, "Rollback transaction");
		});

		QUnit.test("removeAll - success", 4, function() {
			Episode.removeAll(function(message) {
				QUnit.equal(message, null, "Invoke callback");
			});
			QUnit.equal(appController.db.commands.length, 1, "Number of SQL commands");
			QUnit.equal(appController.db.errorMessage, null, "Error message");
			QUnit.ok(appController.db.commit, "Commit transaction");
		});

		QUnit.test("fromJson", 1, function() {
			var episode = Episode.fromJson({
				id: this.id,
				episodeName: this.episodeName,
				seriesId: this.seriesId,
				status: this.status,
				statusDate: this.statusDate,
				unverified: this.unverified,
				unscheduled: this.unscheduled,
				sequence: this.sequence
			});
			
			QUnit.deepEqual(episode, new Episode(this.id, this.episodeName, this.status, this.statusDate, this.unverified, this.unscheduled, this.sequence, this.seriesId), "Episode object");
		});
	}
);
