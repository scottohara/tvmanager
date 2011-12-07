module("episode-model", {
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
		appController.db = new DatabaseMock();
	}
});

test("constructor", 12, function() {
	ok(this.episode, "Instantiate Episode object");
	equals(this.episode.id, this.id, "id property");
	equals(this.episode.episodeName, this.episodeName, "episodeName property");
	equals(this.episode.status, this.status, "status property");
	equals(this.episode.statusDate, this.statusDate, "statusDate property");
	equals(this.episode.unverified, this.unverified, "unverified property");
	equals(this.episode.unscheduled, this.unscheduled, "unscheduled property");
	equals(this.episode.sequence, this.sequence, "sequence property");
	equals(this.episode.seriesId, this.seriesId, "seriesId property");
	equals(this.episode.seriesName, this.seriesName, "seriesName property");
	equals(this.episode.programId, this.programId, "programId property");
	equals(this.episode.programName, this.programName, "programName property");
});

test("save - update fail", 3, function() {
	appController.db.failAt("UPDATE Episode SET Name = " + this.episodeName + ", Status = " + this.status + ", StatusDate = " + this.statusDate + ", Unverified = " + this.unverified + ", Unscheduled = " + this.unscheduled + ", Sequence = " + this.sequence + " WHERE rowid = " + this.id);
	this.episode.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - update no rows affected", 3, function() {
	appController.db.noRowsAffectedAt("UPDATE Episode SET Name = " + this.episodeName + ", Status = " + this.status + ", StatusDate = " + this.statusDate + ", Unverified = " + this.unverified + ", Unscheduled = " + this.unscheduled + ", Sequence = " + this.sequence + " WHERE rowid = " + this.id);
	this.episode.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.save: no rows affected", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - update success", 4, function() {
	this.episode.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	equals(this.episode.id, this.id, "id property");
	ok(appController.db.commit, "Commit transaction");
});

test("save - insert fail", 3, function() {
	this.episode.id = null;
	appController.db.failAt("INSERT INTO Episode (Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (" + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
	this.episode.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.save: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert no rows affected", 3, function() {
	this.episode.id = null;
	appController.db.noRowsAffectedAt("INSERT INTO Episode (Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence) VALUES (" + this.episodeName + ", " + this.seriesId + ", " + this.status + ", " + this.statusDate + ", " + this.unverified + ", " + this.unscheduled + ", " + this.sequence + ")");
	this.episode.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.save: no rows affected", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("save - insert success", 4, function() {
	this.episode.id = null;
	this.episode.save();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	equals(this.episode.id, 999, "id property");
	ok(appController.db.commit, "Commit transaction");
});

test("remove - no rows affected", 1, function() {
	this.episode.id = null;
	this.episode.remove();
	equals(appController.db.commands.length, 0, "Number of SQL commands");
});

test("remove - fail", 5, function() {
	appController.db.failAt("DELETE FROM Episode WHERE rowid = " + this.id);
	this.episode.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	ok(!appController.db.commit, "Rollback transaction");
	equals(this.episode.id, this.id, "id property");
	equals(this.episode.episodeName, this.episodeName, "episodeName property");
	equals(this.episode.seriesId, this.seriesId, "seriesId property");
});

test("remove - success", 6, function() {
	this.episode.remove();
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
	equals(this.episode.id, null, "id property");
	equals(this.episode.episodeName, null, "episodeName property");
	equals(this.episode.seriesId, null, "seriesId property");
});

test("toJson", 1, function() {
	same(this.episode.toJson(), {
		episodeName: this.episodeName,
		status: this.status,
		statusDate: this.statusDate,
		unverified: this.unverified,
		unscheduled: this.unscheduled,
		sequence: this.sequence
	}, "episode JSON");
});

test("setStatus", 1, function() {
	this.status = "Watched";
	this.episode.setStatus(this.status);
	equals(this.episode.status, this.status, "status property");
});

test("setStatusDate", function() {
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

	expect(testParams.length * 3);

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
		equals(this.episode.statusDate, testParams[i].statusDate, testParams[i].description + " - statusDate property");
		equals(this.episode.statusDateDisplay, testParams[i].statusDateDisplay, testParams[i].description + " - statusDateDisplay property");
		equals(this.episode.statusWarning, testParams[i].statusWarning, testParams[i].description + " - statusWarning property");
		Date = originalDate;
	}
});

test("setUnverified", function() {
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

	expect(testParams.length * 2);
	for (var i = 0; i < testParams.length; i++) {
		this.episode.status = testParams[i].status;
		this.episode.setUnverified(testParams[i].unverified);
		equals(this.episode.unverified, testParams[i].unverified, testParams[i].description + " - unverified property");
		equals(this.episode.unverifiedDisplay, testParams[i].unverifiedDisplay, testParams[i].description + " - unverifiedDisplay property");
	}
});

test("listBySeries - fail", 4, function() {
	appController.db.failAt("SELECT e.rowid, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.rowid JOIN Program p ON s.ProgramID = p.rowid WHERE e.SeriesID = " + this.seriesId + " ORDER BY e.Sequence, e.rowid");
	Episode.listBySeries(this.seriesId, function(episodeList) {
		same(episodeList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("listBySeries - no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("SELECT e.rowid, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.rowid JOIN Program p ON s.ProgramID = p.rowid WHERE e.SeriesID = " + this.seriesId + " ORDER BY e.Sequence, e.rowid");
	Episode.listBySeries(this.seriesId, function(episodeList) {
		same(episodeList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listBySeries - success", 4, function() {
	appController.db.addResultRows([{
		rowid: this.id,
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
		same(episodeList, [this.episode], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByUnscheduled - fail", 4, function() {
	appController.db.failAt("SELECT e.rowid, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.rowid JOIN Program p ON s.ProgramID = p.rowid WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)");
	Episode.listByUnscheduled(function(episodeList) {
		same(episodeList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.list: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("listByUnscheduled - no rows affected", 4, function() {
	appController.db.noRowsAffectedAt("SELECT e.rowid, e.Name, e.Status, e.StatusDate, e.Unverified, e.Unscheduled, e.Sequence, e.SeriesID, s.Name AS SeriesName, s.ProgramID, p.Name AS ProgramName FROM Episode e JOIN Series s ON e.SeriesID = s.rowid JOIN Program p ON s.ProgramID = p.rowid WHERE	e.Unscheduled = 'true' ORDER BY	CASE WHEN STRFTIME('%m%d', 'now') <= (CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END || SUBSTR(StatusDate, 1, 2)) THEN 0 ELSE 1 END, CASE SUBSTR(StatusDate, 4, 3) WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03' WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06' WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09' WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12' END, SUBSTR(StatusDate, 1, 2)");
	Episode.listByUnscheduled(function(episodeList) {
		same(episodeList, [], "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("listByUnscheduled - success", 4, function() {
	appController.db.addResultRows([{
		rowid: this.id,
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
		same(episodeList, [this.episode], "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("totalCount - fail", 4, function() {
	appController.db.failAt("SELECT COUNT(*) AS EpisodeCount FROM Episode ");
	Episode.totalCount(function(count) {
		equals(count, 0, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.count: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("totalCount - success", 4, function() {
	appController.db.addResultRows([{
		EpisodeCount: 1
	}]);
	Episode.totalCount($.proxy(function(count) {
		equals(count, 1, "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});

test("countByStatus - fail", 4, function() {
	appController.db.failAt("SELECT COUNT(*) AS EpisodeCount FROM Episode WHERE Status = " + this.status);
	Episode.countByStatus(this.status, function(count) {
		equals(count, 0, "Invoke callback");
	});
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, "Episode.count: Force failed", "Error message");
	ok(!appController.db.commit, "Rollback transaction");
});

test("countByStatus - success", 4, function() {
	appController.db.addResultRows([{
		EpisodeCount: 1
	}]);
	Episode.countByStatus(this.status, $.proxy(function(count) {
		equals(count, 1, "Invoke callback");
	}, this));
	equals(appController.db.commands.length, 1, "Number of SQL commands");
	equals(appController.db.errorMessage, null, "Error message");
	ok(appController.db.commit, "Commit transaction");
});