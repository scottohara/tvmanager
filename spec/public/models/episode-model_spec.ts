import sinon, {
	SinonFakeTimers,
	SinonStub
} from "sinon";
import ApplicationControllerMock from "mocks/application-controller-mock";
import Episode from "../../../src/models/episode-model";
import {EpisodeStatus} from "models";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("Episode", (): void => {
	let id: string,
			episodeName: string,
			status: EpisodeStatus,
			statusDate: string,
			unverified: boolean,
			unscheduled: boolean,
			sequence: number,
			seriesId: string,
			seriesName: string,
			programName: string,
			episode: Episode,
			callback: SinonStub;

	beforeEach((): void => {
		id = "1";
		episodeName = "test-episode";
		status = "Expected";
		statusDate = "31-Dec";
		unverified = true;
		unscheduled = true;
		sequence = 1;
		seriesId = "2";
		seriesName = "test-series";
		programName = "test-program";
		episode = new Episode(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId, seriesName, programName);
	});

	describe("object constructor", (): void => {
		it("should return an Episode instance", (): Chai.Assertion => episode.should.be.an.instanceOf(Episode));
		it("should set the id", (): Chai.Assertion => String(episode.id).should.equal(id));
		it("should set the episode name", (): Chai.Assertion => String(episode.episodeName).should.equal(episodeName));
		it("should set the status", (): Chai.Assertion => episode.status.should.equal(status));
		it("should set the status date", (): Chai.Assertion => episode.statusDate.should.equal(statusDate));
		it("should set the unverified flag", (): Chai.Assertion => episode.unverified.should.equal(unverified));
		it("should set the unscheduled flag", (): Chai.Assertion => episode.unscheduled.should.equal(unscheduled));
		it("should set the sequence", (): Chai.Assertion => episode.sequence.should.equal(sequence));
		it("should set the series id", (): Chai.Assertion => String(episode["seriesId"]).should.equal(seriesId));
		it("should set the series name", (): Chai.Assertion => String(episode.seriesName).should.equal(seriesName));
		it("should set the program name", (): Chai.Assertion => String(episode.programName).should.equal(programName));

		describe("default properties", (): void => {
			beforeEach((): void => {
				let undefinedObject: undefined;

				episode = new Episode(id, episodeName, status, statusDate, undefinedObject, undefinedObject, undefinedObject, seriesId);
			});

			it("should clear the unverified flag if not specified", (): Chai.Assertion => episode.unverified.should.be.false);
			it("should clear the unscheduled flag if not specified", (): Chai.Assertion => episode.unscheduled.should.be.false);
			it("should default the sequence to zero if not specified", (): Chai.Assertion => episode.sequence.should.equal(0));
		});
	});

	describe("listBySeries", (): void => {
		let sql: string;

		beforeEach((): void => {
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
									p.Name AS ProgramName
				FROM			Episode e
				JOIN			Series s ON e.SeriesID = s.SeriesID
				JOIN			Program p ON s.ProgramID = p.ProgramID
				WHERE			e.SeriesID = ${seriesId}
				ORDER BY	e.Sequence,
									e.EpisodeID
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
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
					ProgramName: programName
				}]);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([episode]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("listByUnscheduled", (): void => {
		let sql: string;

		beforeEach((): void => {
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

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Episode.listByUnscheduled(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Episode.listByUnscheduled(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
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
					ProgramName: programName
				}]);
				Episode.listBySeries(seriesId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([episode]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("find", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
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

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
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

				episode = new Episode(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId);
				Episode.find(id, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(episode));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("totalCount", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt("SELECT COUNT(*) AS EpisodeCount FROM Episode ");
				Episode.totalCount(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(0));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{EpisodeCount: 1}]);
				Episode.totalCount(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(1));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("countByStatus", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`
					SELECT	COUNT(*) AS EpisodeCount
					FROM		Episode
					WHERE		Status = ${status}
				`);
				Episode.countByStatus(status, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(0));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{EpisodeCount: 1}]);
				Episode.countByStatus(status, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(1));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("removeAll", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt("DELETE FROM Episode");
				Episode.removeAll(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(`Episode.removeAll: ${appController.db.errorMessage}`));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => Episode.removeAll(callback));

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("fromJson", (): void => {
		it("should construct an Episode object from the JSON", (): Chai.Assertion => Episode.fromJson({id, episodeName, seriesId, status, statusDate, unverified, unscheduled, sequence, type: "Episode"}).should.deep.equal(new Episode(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId)));
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			useId: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				useId: true
			},
			{
				description: "insert",
				useId: false
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let episodeId: string,
						sql: string;

				beforeEach((): void => {
					if (scenario.useId) {
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

				describe("fail", (): void => {
					beforeEach((): void => appController.db.failAt(sql));

					describe("without callback", (): void => {
						beforeEach((): void => episode.save());

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});
				});

				describe("no rows affected", (): void => {
					beforeEach((): void => appController.db.noRowsAffectedAt(sql));

					describe("without callback", (): void => {
						beforeEach((): void => episode.save());

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("no rows affected"));
						it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("no rows affected"));
					});
				});

				describe(`${scenario.description} Sync fail`, (): void => {
					beforeEach((): void => appController.db.failAt(`
						INSERT OR IGNORE INTO Sync (Type, ID, Action)
						VALUES ('Episode', ${episodeId}, 'modified')
					`));

					describe("without callback", (): void => {
						beforeEach((): void => episode.save());

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});
				});

				describe("success", (): void => {
					describe("without callback", (): void => {
						beforeEach((): void => episode.save());

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
						it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							episode.save(callback);
						});

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(episode.id));
						it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
					});
				});
			});
		});
	});

	describe("remove", (): void => {
		describe("no ID", (): void => {
			it("should execute no SQL commands", (): void => {
				episode.id = null;
				episode.remove();
				appController.db.commands.length.should.equal(0);
			});
		});

		describe("insert Sync fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) VALUES ('Episode', ${id}, 'deleted')`);
				episode.remove();
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(episode.id).should.equal(id));
			it("should not clear the episode name", (): Chai.Assertion => String(episode.episodeName).should.equal(episodeName));
			it("should not clear the series id", (): Chai.Assertion => String(episode["seriesId"]).should.equal(seriesId));
		});

		describe("delete fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Episode WHERE EpisodeID = ${id}`);
				episode.remove();
			});

			it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(episode.id).should.equal(id));
			it("should not clear the episode name", (): Chai.Assertion => String(episode.episodeName).should.equal(episodeName));
			it("should not clear the series id", (): Chai.Assertion => String(episode["seriesId"]).should.equal(seriesId));
		});

		describe("success", (): void => {
			beforeEach((): void => episode.remove());

			it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
			it("should clear the id", (): Chai.Assertion => (null === episode.id).should.be.true);
			it("should clear the episode name", (): Chai.Assertion => (null === episode.episodeName).should.be.true);
			it("should clear the series id", (): Chai.Assertion => (null === episode["seriesId"]).should.be.true);
		});
	});

	describe("toJson", (): void => {
		it("should return a JSON representation of the episode", (): Chai.Assertion => episode.toJson().should.deep.equal({id, episodeName, seriesId, status, statusDate, unverified, unscheduled, sequence, type: "Episode"}));
	});

	describe("setStatus", (): void => {
		it("should set the status", (): void => {
			status = "Watched";
			episode.setStatus(status);
			episode.status.should.equal(status);
		});
	});

	describe("setUnverified", (): void => {
		interface Scenario {
			description: string;
			status: EpisodeStatus;
			unverified: boolean;
			unverifiedDisplay: "" | "Unverified";
		}

		const scenarios: Scenario[] = [
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

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => {
					episode.status = scenario.status;
					episode.setUnverified(scenario.unverified);
				});

				it("should set the unverified flag", (): Chai.Assertion => episode.unverified.should.equal(scenario.unverified));
				it("should set the unverified display", (): Chai.Assertion => episode.unverifiedDisplay.should.equal(scenario.unverifiedDisplay));
			});
		});
	});

	describe("setStatusDate", (): void => {
		interface Scenario {
			description: string;
			status: EpisodeStatus;
			unscheduled: boolean;
			statusDate: string;
			statusDateDisplay: string;
			statusWarning: "" | "warning";
			today?: {day: number; month: number;};
		}

		const scenarios: Scenario[] = [
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

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let clock: SinonFakeTimers;

				beforeEach((): void => {
					if (scenario.today) {
						const currentYear: number = (new Date()).getFullYear();

						clock = sinon.useFakeTimers(new Date(currentYear, scenario.today.month, scenario.today.day).valueOf());
					}

					episode.status = scenario.status;
					episode.unscheduled = scenario.unscheduled;

					episode.setStatusDate(scenario.statusDate);
				});

				it("should set the status date", (): Chai.Assertion => episode.statusDate.should.equal(scenario.statusDate));
				it("should set the status date display", (): Chai.Assertion => episode.statusDateDisplay.should.equal(scenario.statusDateDisplay));
				it(`should ${"" === scenario.statusWarning ? "not " : ""}highlight the episode with a warning`, (): Chai.Assertion => episode.statusWarning.should.equal(scenario.statusWarning));

				afterEach((): void => {
					if (scenario.today) {
						clock.restore();
					}
				});
			});
		});
	});

	afterEach((): void => appController.db.reset());
});