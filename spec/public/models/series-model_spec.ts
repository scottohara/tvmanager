import sinon, { SinonStub } from "sinon";
import ApplicationControllerMock from "mocks/application-controller-mock";
import { EpisodeStatus } from "models";
import Series from "../../../src/models/series-model";

// Get a reference to the application controller singleton
const appController: ApplicationControllerMock = new ApplicationControllerMock();

describe("Series", (): void => {
	let id: string,
			seriesName: string,
			nowShowing: number,
			programId: string,
			programName: string,
			episodeCount: number,
			watchedCount: number,
			recordedCount: number,
			expectedCount: number,
			missedCount: number,
			statusWarningCount: number,
			series: Series,
			callback: SinonStub;

	beforeEach((): void => {
		id = "1";
		seriesName = "test-series";
		nowShowing = 1;
		programId = "2";
		programName = "test-program";
		episodeCount = 1;
		watchedCount = 1;
		recordedCount = 1;
		expectedCount = 1;
		missedCount = 1;
		statusWarningCount = 1;
		series = new Series(id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount, missedCount, statusWarningCount);
	});

	describe("object constructor", (): void => {
		it("should return a Series instance", (): Chai.Assertion => series.should.be.an.instanceOf(Series));
		it("should set the id", (): Chai.Assertion => String(series.id).should.equal(id));
		it("should set the series name", (): Chai.Assertion => String(series.seriesName).should.equal(seriesName));
		it("should set the now showing", (): Chai.Assertion => Number(series.nowShowing).should.equal(nowShowing));
		it("should set the program id", (): Chai.Assertion => String(series.programId).should.equal(programId));
		it("should set the program name", (): Chai.Assertion => String(series.programName).should.equal(programName));
		it("should set the progress bar total", (): Chai.Assertion => series["progressBar"]["total"].should.equal(episodeCount));
		it("should set the episode count", (): Chai.Assertion => series.episodeCount.should.equal(episodeCount));
		it("should set the watched count", (): Chai.Assertion => series.watchedCount.should.equal(watchedCount));
		it("should set the recorded count", (): Chai.Assertion => series.recordedCount.should.equal(recordedCount));
		it("should set the expected count", (): Chai.Assertion => series.expectedCount.should.equal(expectedCount));
		it("should set the missed count", (): Chai.Assertion => series["missedCount"].should.equal(missedCount));
		it("should set the status warning count", (): Chai.Assertion => series.statusWarningCount.should.equal(statusWarningCount));
	});

	describe("listByProgram", (): void => {
		let sql: string;

		beforeEach((): void => {
			callback = sinon.stub();
			sql = `
				SELECT					p.Name AS ProgramName,
												s.SeriesID,
												s.Name,
												s.NowShowing,
												s.ProgramID,
												COUNT(e.EpisodeID) AS EpisodeCount,
												COUNT(e2.EpisodeID) AS WatchedCount,
												COUNT(e3.EpisodeID) AS RecordedCount,
												COUNT(e4.EpisodeID) AS ExpectedCount
				FROM						Program p
				JOIN						Series s ON p.ProgramID = s.ProgramID
				LEFT OUTER JOIN	Episode e ON s.SeriesID = e.SeriesID
				LEFT OUTER JOIN	Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched'
				LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded'
				LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'
				WHERE						p.ProgramID = ${programId}
				GROUP BY				s.SeriesID
				ORDER BY				s.Name COLLATE NOCASE
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Series.listByProgram(programId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Series.listByProgram(programId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					SeriesID: id,
					Name: seriesName,
					NowShowing: nowShowing,
					ProgramID: programId,
					ProgramName: programName,
					EpisodeCount: episodeCount,
					WatchedCount: watchedCount,
					RecordedCount: recordedCount,
					ExpectedCount: expectedCount,
					MissedCount: missedCount,
					StatusWarningCount: statusWarningCount
				}]);
				Series.listByProgram(programId, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([series]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("listByNowShowing", (): void => {
		let sql: string;

		beforeEach((): void => {
			callback = sinon.stub();
			sql = `
				SELECT					p.Name AS ProgramName,
												s.SeriesID,
												s.Name,
												s.NowShowing,
												s.ProgramID,
												COUNT(e.EpisodeID) AS EpisodeCount,
												COUNT(e2.EpisodeID) AS WatchedCount,
												COUNT(e3.EpisodeID) AS RecordedCount,
												COUNT(e4.EpisodeID) AS ExpectedCount ,
												SUM(CASE
													WHEN e4.StatusDate IS NULL THEN 0
													WHEN STRFTIME('%m', 'now') < '04' THEN
														CASE
															WHEN STRFTIME('%m%d', 'now') < (
																CASE SUBSTR(e4.StatusDate, 4, 3)
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
																END || SUBSTR(e4.StatusDate, 1, 2)) AND STRFTIME('%m%d', 'now', '9 months') > (
																	CASE SUBSTR(e4.StatusDate, 4, 3)
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
																	END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0
															ELSE 1
														END
													ELSE
														CASE
															WHEN STRFTIME('%m%d', 'now') < (
																CASE SUBSTR(e4.StatusDate, 4, 3)
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
																END || SUBSTR(e4.StatusDate, 1, 2)) OR STRFTIME('%m%d', 'now', '9 months') > (
																	CASE SUBSTR(e4.StatusDate, 4, 3)
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
																	END || SUBSTR(e4.StatusDate, 1, 2)) THEN 0
															ELSE 1
														END
												END) AS StatusWarningCount
				FROM						Program p
				JOIN						Series s ON p.ProgramID = s.ProgramID
				LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID
				LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched'
				LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded'
				LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'
				GROUP BY				s.SeriesID
				HAVING					s.NowShowing IS NOT NULL OR
												COUNT(e3.EpisodeID) > 0 OR
												COUNT(e4.EpisodeID) > 0
				ORDER BY				CASE
													WHEN s.NowShowing IS NULL THEN 1
													ELSE 0
												END,
												s.NowShowing,
												p.Name COLLATE NOCASE
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Series.listByNowShowing(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Series.listByNowShowing(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					SeriesID: id,
					Name: seriesName,
					NowShowing: nowShowing,
					ProgramID: programId,
					ProgramName: programName,
					EpisodeCount: episodeCount,
					WatchedCount: watchedCount,
					RecordedCount: recordedCount,
					ExpectedCount: expectedCount,
					MissedCount: missedCount,
					StatusWarningCount: statusWarningCount
				}]);
				Series.listByNowShowing(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([series]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("listByStatus", (): void => {
		let status: EpisodeStatus,
				sql: string;

		beforeEach((): void => {
			callback = sinon.stub();
			status = "Watched";
			sql = `
				SELECT		p.Name AS ProgramName,
									s.SeriesID,
									s.Name,
									s.NowShowing,
									s.ProgramID,
									COUNT(e.EpisodeID) AS EpisodeCount,
									COUNT(e.EpisodeID) AS ${status}Count
				FROM			Program p
				JOIN			Series s ON p.ProgramID = s.ProgramID
				JOIN			Episode e ON s.SeriesID = e.SeriesID
				WHERE			e.Status = ${status}
				GROUP BY	s.SeriesID
				ORDER BY	p.Name COLLATE NOCASE,
									s.Name COLLATE NOCASE
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Series.listByStatus(callback, status);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Series.listByStatus(callback, status);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					SeriesID: id,
					Name: seriesName,
					NowShowing: nowShowing,
					ProgramID: programId,
					ProgramName: programName,
					EpisodeCount: episodeCount,
					WatchedCount: watchedCount,
					RecordedCount: recordedCount,
					ExpectedCount: expectedCount,
					MissedCount: missedCount,
					StatusWarningCount: statusWarningCount
				}]);
				Series.listByStatus(callback, status);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([series]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("listByIncomplete", (): void => {
		let sql: string;

		beforeEach((): void => {
			callback = sinon.stub();
			sql = `
				SELECT					p.Name AS ProgramName,
												s.SeriesID,
												s.Name,
												s.NowShowing,
												s.ProgramID,
												COUNT(e.EpisodeID) AS EpisodeCount,
												COUNT(e2.EpisodeID) AS WatchedCount,
												COUNT(e3.EpisodeID) AS RecordedCount,
												COUNT(e4.EpisodeID) AS ExpectedCount
				FROM						Program p
				JOIN						Series s ON p.ProgramID = s.ProgramID
				LEFT OUTER JOIN Episode e ON s.SeriesID = e.SeriesID
				LEFT OUTER JOIN Episode e2 ON e.EpisodeID = e2.EpisodeID AND e2.Status = 'Watched'
				LEFT OUTER JOIN Episode e3 ON e.EpisodeID = e3.EpisodeID AND e3.Status = 'Recorded'
				LEFT OUTER JOIN Episode e4 ON e.EpisodeID = e4.EpisodeID AND e4.Status = 'Expected'
				GROUP BY				s.SeriesID
				HAVING					COUNT(e.EpisodeID) > COUNT(e2.EpisodeID) AND
												COUNT(e2.EpisodeID) > 0
				ORDER BY				p.Name COLLATE NOCASE,
												s.Name COLLATE NOCASE
			`;
		});

		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(sql);
				Series.listByIncomplete(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("no rows affected", (): void => {
			beforeEach((): void => {
				appController.db.noRowsAffectedAt(sql);
				Series.listByIncomplete(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					SeriesID: id,
					Name: seriesName,
					NowShowing: nowShowing,
					ProgramID: programId,
					ProgramName: programName,
					EpisodeCount: episodeCount,
					WatchedCount: watchedCount,
					RecordedCount: recordedCount,
					ExpectedCount: expectedCount,
					MissedCount: missedCount,
					StatusWarningCount: statusWarningCount
				}]);
				Series.listByIncomplete(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith([series]));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("find", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`
					SELECT	SeriesID,
									Name,
									ProgramID,
									NowShowing
					FROM		Series
					WHERE		SeriesID = ${id}
				`);
				Series.find(id, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{
					SeriesID: id,
					Name: seriesName,
					NowShowing: nowShowing,
					ProgramID: programId
				}]);

				let undefinedObject: undefined;

				series.programName = undefinedObject;
				series.setEpisodeCount(0);
				series.setWatchedCount(0);
				series.setRecordedCount(0);
				series.setExpectedCount(0);
				series["setMissedCount"](0);
				series.setStatusWarning(0);

				Series.find(id, callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(series));
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("count", (): void => {
		describe("fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt("SELECT COUNT(*) AS SeriesCount FROM Series");
				Series.count(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(0));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => {
				appController.db.addResultRows([{ SeriesCount: 1 }]);
				Series.count(callback);
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
				appController.db.failAt("DELETE FROM Series");
				Series.removeAll(callback);
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(`Series.removeAll: ${appController.db.errorMessage}`));
			it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
		});

		describe("success", (): void => {
			beforeEach((): void => Series.removeAll(callback));

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
			it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
		});
	});

	describe("fromJson", (): void => {
		it("should construct a Series object from the JSON", (): Chai.Assertion => Series.fromJson({ id, seriesName, nowShowing, programId, type: "Series" }).should.deep.equal(new Series(id, seriesName, nowShowing, programId)));
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
				let seriesId: string,
						sql: string;

				beforeEach((): void => {
					if (scenario.useId) {
						seriesId = id;
					} else {
						seriesId = "%";
						series.id = null;
					}

					sql = `
						REPLACE INTO Series (SeriesID, Name, NowShowing, ProgramID)
						VALUES (${seriesId}, ${seriesName}, ${nowShowing}, ${programId})
					`;
				});

				describe("fail", (): void => {
					beforeEach((): void => appController.db.failAt(sql));

					describe("without callback", (): void => {
						beforeEach((): void => series.save());

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							series.save(callback);
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
						beforeEach((): void => series.save());

						it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("no rows affected"));
						it("should not be successful", (): Chai.Assertion => appController.db.success.should.be.false);
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							series.save(callback);
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
						VALUES ('Series', ${seriesId}, 'modified')
					`));

					describe("without callback", (): void => {
						beforeEach((): void => series.save());

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							series.save(callback);
						});

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.called);
						it("should set an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal("Force failed"));
					});
				});

				describe("success", (): void => {
					describe("without callback", (): void => {
						beforeEach((): void => series.save());

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
						it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
					});

					describe("with callback", (): void => {
						beforeEach((): void => {
							callback = sinon.stub();
							series.save(callback);
						});

						it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
						it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
						it("should invoke the callback", (): Chai.Assertion => callback.should.have.been.calledWith(series.id));
						it("should be successful", (): Chai.Assertion => appController.db.success.should.be.true);
					});
				});
			});
		});
	});

	describe("remove", (): void => {
		describe("no ID", (): void => {
			it("should execute no SQL commands", (): void => {
				series.id = null;
				series.remove();
				appController.db.commands.length.should.equal(0);
			});
		});

		describe("insert Episode Sync fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID = ${id}`);
				series.remove();
			});

			it("should execute one SQL command", (): Chai.Assertion => appController.db.commands.length.should.equal(1));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(series.id).should.equal(id));
			it("should not clear the series name", (): Chai.Assertion => String(series.seriesName).should.equal(seriesName));
			it("should not clear the now showing", (): Chai.Assertion => Number(series.nowShowing).should.equal(nowShowing));
			it("should not clear the program id", (): Chai.Assertion => String(series.programId).should.equal(programId));
		});

		describe("delete Episode fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Episode WHERE SeriesID = ${id}`);
				series.remove();
			});

			it("should execute two SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(2));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(series.id).should.equal(id));
			it("should not clear the series name", (): Chai.Assertion => String(series.seriesName).should.equal(seriesName));
			it("should not clear the now showing", (): Chai.Assertion => Number(series.nowShowing).should.equal(nowShowing));
			it("should not clear the program id", (): Chai.Assertion => String(series.programId).should.equal(programId));
		});

		describe("insert Series Sync fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) VALUES ('Series', ${id}, 'deleted')`);
				series.remove();
			});

			it("should execute three SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(3));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(series.id).should.equal(id));
			it("should not clear the series name", (): Chai.Assertion => String(series.seriesName).should.equal(seriesName));
			it("should not clear the now showing", (): Chai.Assertion => Number(series.nowShowing).should.equal(nowShowing));
			it("should not clear the program id", (): Chai.Assertion => String(series.programId).should.equal(programId));
		});

		describe("delete Series fail", (): void => {
			beforeEach((): void => {
				appController.db.failAt(`DELETE FROM Series	WHERE SeriesID = ${id}`);
				series.remove();
			});

			it("should execute four SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(4));
			it("should rollback the transaction", (): Chai.Assertion => appController.db.commit.should.be.false);
			it("should not clear the id", (): Chai.Assertion => String(series.id).should.equal(id));
			it("should not clear the series name", (): Chai.Assertion => String(series.seriesName).should.equal(seriesName));
			it("should not clear the now showing", (): Chai.Assertion => Number(series.nowShowing).should.equal(nowShowing));
			it("should not clear the program id", (): Chai.Assertion => String(series.programId).should.equal(programId));
		});

		describe("success", (): void => {
			beforeEach((): void => series.remove());

			it("should execute four SQL commands", (): Chai.Assertion => appController.db.commands.length.should.equal(4));
			it("should commit the transaction", (): Chai.Assertion => appController.db.commit.should.be.true);
			it("should not return an error message", (): Chai.Assertion => appController.db.errorMessage.should.equal(""));
			it("should clear the id", (): Chai.Assertion => (null === series.id).should.be.true);
			it("should clear the series name", (): Chai.Assertion => (null === series.seriesName).should.be.true);
			it("should clear the now showing", (): Chai.Assertion => (null === series.nowShowing).should.be.true);
			it("should clear the program id", (): Chai.Assertion => (null === series.programId).should.be.true);
		});
	});

	describe("toJson", (): void => {
		it("should return a JSON representation of the series", (): Chai.Assertion => series.toJson().should.deep.equal({ id, seriesName, nowShowing, programId, type: "Series" }));
	});

	describe("setEpisodeCount", (): void => {
		beforeEach((): void => {
			episodeCount = 2;
			series.setEpisodeCount(episodeCount);
		});

		it("should set the episode count", (): Chai.Assertion => series.episodeCount.should.equal(episodeCount));
		it("should set the progress bar total", (): Chai.Assertion => series["progressBar"]["total"].should.equal(episodeCount));
	});

	describe("setWatchedCount", (): void => {
		it("should set the watched count", (): void => {
			watchedCount = 2;
			series.setWatchedCount(watchedCount);
			series.watchedCount.should.equal(watchedCount);
		});
	});

	describe("setRecordedCount", (): void => {
		beforeEach((): void => series.setRecordedCount(1));

		it("should set the recorded count", (): Chai.Assertion => series.recordedCount.should.equal(1));
		it("should update the progress bar display", (): Chai.Assertion => series.progressBarDisplay.should.equal(JSON.stringify({
			label: 1,
			percent: 100,
			style: "recorded"
		})));
	});

	describe("setExpectedCount", (): void => {
		beforeEach((): void => series.setExpectedCount(1));

		it("should set the expected count", (): Chai.Assertion => series.expectedCount.should.equal(1));
		it("should update the progress bar display", (): Chai.Assertion => series.progressBarDisplay.should.equal(JSON.stringify({
			label: 1,
			percent: 100,
			style: "expected"
		})));
	});

	describe("setStatusWarning", (): void => {
		interface Scenario {
			description: string;
			statusWarningCount: number;
			statusWarning: "" | "warning";
		}

		const scenarios: Scenario[] = [
			{
				description: "no warning count",
				statusWarningCount: 0,
				statusWarning: ""
			},
			{
				description: "with warning count",
				statusWarningCount: 1,
				statusWarning: "warning"
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => series.setStatusWarning(scenario.statusWarningCount));

				it("should set the status warning count", (): Chai.Assertion => series.statusWarningCount.should.equal(scenario.statusWarningCount));
				it(`should ${0 === scenario.statusWarningCount ? "not " : ""}highlight the series with a warning`, (): Chai.Assertion => series.statusWarning.should.equal(scenario.statusWarning));
			});
		});
	});

	describe("setNowShowing", (): void => {
		interface Scenario {
			description: string;
			nowShowing?: number | null;
			nowShowingDisplay: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "undefined",
				nowShowingDisplay: "Not Showing"
			},
			{
				description: "null",
				nowShowing: null,
				nowShowingDisplay: "Not Showing"
			},
			{
				description: "zero",
				nowShowing: 0,
				nowShowingDisplay: "Not Showing"
			},
			{
				description: "non-zero",
				nowShowing: 2,
				nowShowingDisplay: "Tuesdays"
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach((): void => series.setNowShowing(scenario.nowShowing));

				it("should set the now showing", (): void => {
					if (scenario.nowShowing) {
						Number(series.nowShowing).should.equal(scenario.nowShowing);
					} else {
						(null === series.nowShowing).should.be.true;
					}
				});

				it("should update the now showing display", (): Chai.Assertion => series.nowShowingDisplay.should.equal(scenario.nowShowingDisplay));
			});
		});
	});

	describe("setWatchedProgress", (): void => {
		it("should update the progress bar display", (): void => {
			series.watchedCount = 1;
			series["setWatchedProgress"]();
			series.progressBarDisplay.should.equal(JSON.stringify({
				label: 1,
				percent: 100,
				style: "watched"
			}));
		});
	});

	describe("setMissedCount", (): void => {
		beforeEach((): void => series["setMissedCount"](1));

		it("should set the expected count", (): Chai.Assertion => series["missedCount"].should.equal(1));
		it("should update the progress bar display", (): Chai.Assertion => series.progressBarDisplay.should.equal(JSON.stringify({
			label: 1,
			percent: 100,
			style: "missed"
		})));
	});

	afterEach((): void => appController.db.reset());
});