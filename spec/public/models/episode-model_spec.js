import ApplicationController from "controllers/application-controller";
import Episode from "../../../src/models/episode-model";

// Get a reference to the application controller singleton
const appController = new ApplicationController();

describe("Episode", () => {
	let id,
			episodeName,
			status,
			statusDate,
			unverified,
			unscheduled,
			sequence,
			seriesId,
			seriesName,
			programId,
			programName,
			episode,
			callback;

	beforeEach(() => {
		id = 1;
		episodeName = "test-episode";
		status = "Expected";
		statusDate = "31-Dec";
		unverified = true;
		unscheduled = true;
		sequence = 1;
		seriesId = 2;
		seriesName = "test-series";
		programId = 3;
		programName = "test-program";
		episode = new Episode(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId, seriesName, programId, programName);
	});

	describe("object constructor", () => {
		it("should return an Episode instance", () => episode.should.be.an.instanceOf(Episode));
		it("should set the id", () => episode.id.should.equal(id));
		it("should set the episode name", () => episode.episodeName.should.equal(episodeName));
		it("should set the status", () => episode.status.should.equal(status));
		it("should set the status date", () => episode.statusDate.should.equal(statusDate));
		it("should set the unverified flag", () => episode.unverified.should.equal(unverified));
		it("should set the unscheduled flag", () => episode.unscheduled.should.equal(unscheduled));
		it("should set the sequence", () => episode.sequence.should.equal(sequence));
		it("should set the series id", () => episode.seriesId.should.equal(seriesId));
		it("should set the series name", () => episode.seriesName.should.equal(seriesName));
		it("should set the program id", () => episode.programId.should.equal(programId));
		it("should set the program name", () => episode.programName.should.equal(programName));
	});

	describe("save", () => {
		const testParams = [
			{
				description: "update",
				useId: true
			},
			{
				description: "insert",
				useId: false
			}
		];

		testParams.forEach(params => {
			describe(params.description, () => {
				let episodeId,
						sql;

				beforeEach(() => {
					if (params.useId) {
						episodeId = id;
					} else {
						episodeId = "%";
						episode.id = null;
					}

					sql = `
						REPLACE INTO Episode (EpisodeID, Name, SeriesID, Status, StatusDate, Unverified, Unscheduled, Sequence)
						VALUES (${episodeId}, ${episodeName}, ${seriesId}, ${status}, ${statusDate}, ${unverified}, ${unscheduled}, ${sequence})
					`;
				});

				describe("fail", () => {
					beforeEach(() => appController.db.failAt(sql));

					describe("without callback", () => {
						beforeEach(() => episode.save());

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.save: Force failed"));
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should invoke the callback", () => callback.should.have.been.called);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.save: Force failed"));
					});
				});

				describe("no rows affected", () => {
					beforeEach(() => appController.db.noRowsAffectedAt(sql));

					describe("without callback", () => {
						beforeEach(() => episode.save());

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.save: no rows affected"));
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should invoke the callback", () => callback.should.have.been.called);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.save: no rows affected"));
					});
				});

				describe(`${params.description} Sync fail`, () => {
					beforeEach(() => appController.db.failAt(`
						INSERT OR IGNORE INTO Sync (Type, ID, Action)
						VALUES ('Episode', ${episodeId}, 'modified')
					`));

					describe("without callback", () => {
						beforeEach(() => episode.save());

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.save: Force failed"));
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", () => appController.db.commit.should.be.false);
						it("should invoke the callback", () => callback.should.have.been.called);
						it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.save: Force failed"));
					});
				});

				describe("success", () => {
					describe("without callback", () => {
						beforeEach(() => episode.save());

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", () => appController.db.commit.should.be.true);
						it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
					});

					describe("with callback", () => {
						beforeEach(() => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", () => appController.db.commit.should.be.true);
						it("should invoke the callback", () => callback.should.have.been.calledWith(episode.id));
						it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
					});
				});
			});
		});
	});

	describe("remove", () => {
		describe("no ID", () => {
			it("should execute no SQL commands", () => {
				episode.id = null;
				episode.remove();
				appController.db.commands.length.should.equal(0);
			});
		});

		describe("insert Sync fail", () => {
			beforeEach(() => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) VALUES ('Episode', ${id}, 'deleted')`);
				episode.remove();
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => episode.id.should.equal(id));
			it("should not clear the episode name", () => episode.episodeName.should.equal(episodeName));
			it("should not clear the series id", () => episode.seriesId.should.equal(seriesId));
		});

		describe("delete fail", () => {
			beforeEach(() => {
				appController.db.failAt(`DELETE FROM Episode WHERE EpisodeID = ${id}`);
				episode.remove();
			});

			it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should not clear the id", () => episode.id.should.equal(id));
			it("should not clear the episode name", () => episode.episodeName.should.equal(episodeName));
			it("should not clear the series id", () => episode.seriesId.should.equal(seriesId));
		});

		describe("success", () => {
			beforeEach(() => episode.remove());

			it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
			it("should clear the id", () => (null === episode.id).should.be.true);
			it("should clear the episode name", () => (null === episode.episodeName).should.be.true);
			it("should clear the series id", () => (null === episode.seriesId).should.be.true);
		});
	});

	describe("toJson", () => {
		it("should return a JSON representation of the episode", () => episode.toJson().should.deep.equal({id, episodeName, seriesId, status, statusDate, unverified, unscheduled, sequence}));
	});

	describe("setStatus", () => {
		it("should set the status", () => {
			status = "Watched";
			episode.setStatus(status);
			episode.status.should.equal(status);
		});
	});

	describe("setStatusDate", () => {
		const testParams = [
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

		testParams.forEach(params => {
			describe(params.description, () => {
				let clock;

				beforeEach(() => {
					if (params.today) {
						const currentYear = (new Date()).getFullYear();

						clock = sinon.useFakeTimers(new Date(currentYear, params.today.month, params.today.day).valueOf());
					}

					episode.status = params.status;
					episode.unscheduled = params.unscheduled;

					episode.setStatusDate(params.statusDate);
				});

				it("should set the status date", () => episode.statusDate.should.equal(params.statusDate));
				it("should set the status date display", () => episode.statusDateDisplay.should.equal(params.statusDateDisplay));
				it(`should ${"" === params.statusWarning ? "not " : ""}highlight the episode with a warning`, () => episode.statusWarning.should.equal(params.statusWarning));

				afterEach(() => {
					if (params.today) {
						clock.restore();
					}
				});
			});
		});
	});

	describe("setUnverified", () => {
		const testParams = [
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

		testParams.forEach(params => {
			describe(params.description, () => {
				beforeEach(() => {
					episode.status = params.status;
					episode.setUnverified(params.unverified);
				});

				it("should set the unverified flag", () => episode.unverified.should.equal(params.unverified));
				it("should set the unverified display", () => episode.unverifiedDisplay.should.equal(params.unverifiedDisplay));
			});
		});
	});

	describe("listBySeries", () => {
		let sql;

		beforeEach(() => {
			callback = sinon.stub();
			sql = `
				SELECT		e.EpisodeID,
									e.Name,
									e.Status,
									e.StatusDate,
									e.Unverified,
									e.Unscheduled,
									e.Sequence,
									e.SeriesID,
									s.Name AS SeriesName,
									s.ProgramID,
									p.Name AS ProgramName
				FROM			Episode e
				JOIN			Series s ON e.SeriesID = s.SeriesID
				JOIN			Program p ON s.ProgramID = p.ProgramID
				WHERE			e.SeriesID = ${seriesId}
				ORDER BY	e.Sequence,
									e.EpisodeID
			`;
		});

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(sql);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith([]));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.list: Force failed"));
		});

		describe("no rows affected", () => {
			beforeEach(() => {
				appController.db.noRowsAffectedAt(sql);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith([]));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{
					EpisodeID: id,
					Name: episodeName,
					Status: status,
					StatusDate: statusDate,
					Unverified: String(unverified),
					Unscheduled: String(unscheduled),
					Sequence: sequence,
					SeriesID: seriesId,
					SeriesName: seriesName,
					ProgramID: programId,
					ProgramName: programName
				}]);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith([episode]));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("listByUnscheduled", () => {
		let sql;

		beforeEach(() => {
			callback = sinon.stub();
			sql = `
				SELECT		e.EpisodeID,
									e.Name,
									e.Status,
									e.StatusDate,
									e.Unverified,
									e.Unscheduled,
									e.Sequence,
									e.SeriesID,
									s.Name AS SeriesName,
									s.ProgramID,
									p.Name AS ProgramName
				FROM			Episode e
				JOIN			Series s ON e.SeriesID = s.SeriesID
				JOIN			Program p ON s.ProgramID = p.ProgramID
				WHERE			e.Unscheduled = 'true'
				ORDER BY	CASE
										WHEN STRFTIME('%m%d', 'now') <= (
											CASE SUBSTR(StatusDate, 4, 3)
												WHEN 'Jan' THEN '01'
												WHEN 'Feb' THEN '02'
												WHEN 'Mar' THEN '03'
												WHEN 'Apr' THEN '04'
												WHEN 'May' THEN '05'
												WHEN 'Jun' THEN '06'
												WHEN 'Jul' THEN '07'
												WHEN 'Aug' THEN '08'
												WHEN 'Sep' THEN '09'
												WHEN 'Oct' THEN '10'
												WHEN 'Nov' THEN '11'
												WHEN 'Dec' THEN '12'
											END || SUBSTR(StatusDate, 1, 2)) THEN 0
										ELSE 1
									END,
									CASE SUBSTR(StatusDate, 4, 3)
										WHEN 'Jan' THEN '01'
										WHEN 'Feb' THEN '02'
										WHEN 'Mar' THEN '03'
										WHEN 'Apr' THEN '04'
										WHEN 'May' THEN '05'
										WHEN 'Jun' THEN '06'
										WHEN 'Jul' THEN '07'
										WHEN 'Aug' THEN '08'
										WHEN 'Sep' THEN '09'
										WHEN 'Oct' THEN '10'
										WHEN 'Nov' THEN '11'
										WHEN 'Dec' THEN '12'
									END ,
									SUBSTR(StatusDate, 1, 2)
			`;
		});

		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(sql);
				Episode.listByUnscheduled(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith([]));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.list: Force failed"));
		});

		describe("no rows affected", () => {
			beforeEach(() => {
				appController.db.noRowsAffectedAt(sql);
				Episode.listByUnscheduled(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith([]));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{
					EpisodeID: id,
					Name: episodeName,
					Status: status,
					StatusDate: statusDate,
					Unverified: String(unverified),
					Unscheduled: String(unscheduled),
					Sequence: sequence,
					SeriesID: seriesId,
					SeriesName: seriesName,
					ProgramID: programId,
					ProgramName: programName
				}]);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith([episode]));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("find", () => {
		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(`
					SELECT	EpisodeID,
									Name,
									SeriesID,
									Status,
									StatusDate,
									Unverified,
									Unscheduled,
									Sequence
					FROM		Episode
					WHERE		EpisodeID = ${id}
				`);
				Episode.find(id, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.called);
			it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.find: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{
					EpisodeID: id,
					Name: episodeName,
					Status: status,
					StatusDate: statusDate,
					Unverified: String(unverified),
					Unscheduled: String(unscheduled),
					Sequence: sequence,
					SeriesID: seriesId
				}]);

				episode.seriesName = Reflect.undefined;
				episode.programName = Reflect.undefined;
				episode.programId = Reflect.undefined;

				Episode.find(id, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith(episode));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("totalCount", () => {
		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt("SELECT COUNT(*) AS EpisodeCount FROM Episode ");
				Episode.totalCount(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith(0));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.count: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{EpisodeCount: 1}]);
				Episode.totalCount(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith(1));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("countByStatus", () => {
		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt(`
					SELECT	COUNT(*) AS EpisodeCount
					FROM		Episode
					WHERE		Status = ${status}
				`);
				Episode.countByStatus(status, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith(0));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.count: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => {
				appController.db.addResultRows([{EpisodeCount: 1}]);
				Episode.countByStatus(status, callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.calledWith(1));
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("removeAll", () => {
		describe("fail", () => {
			beforeEach(() => {
				appController.db.failAt("DELETE FROM Episode");
				Episode.removeAll(callback);
			});

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", () => appController.db.commit.should.be.false);
			it("should invoke the callback", () => callback.should.have.been.calledWith(appController.db.errorMessage));
			it("should return an error message", () => appController.db.errorMessage.should.equal("Episode.removeAll: Force failed"));
		});

		describe("success", () => {
			beforeEach(() => Episode.removeAll(callback));

			it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", () => appController.db.commit.should.be.true);
			it("should invoke the callback", () => callback.should.have.been.called);
			it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
		});
	});

	describe("fromJson", () => {
		it("should construct an Episode object from the JSON", () => Episode.fromJson({id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId}).should.deep.equal(new Episode(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId)));
	});

	afterEach(() => appController.db.reset());
});