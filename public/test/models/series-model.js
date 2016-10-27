define(
	[
		"models/series-model",
		"controllers/application-controller"
	],

	(Series, ApplicationController) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		describe("Series", () => {
			let id,
					seriesName,
					nowShowing,
					programId,
					programName,
					episodeCount,
					watchedCount,
					recordedCount,
					expectedCount,
					missedCount,
					statusWarningCount,
					series,
					callback;

			beforeEach(() => {
				id = 1;
				seriesName = "test-series";
				nowShowing = 1;
				programId = 2;
				programName = "test-program";
				episodeCount = 1;
				watchedCount = 1;
				recordedCount = 1;
				expectedCount = 1;
				missedCount = 1;
				statusWarningCount = 1;
				series = new Series(id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount, missedCount, statusWarningCount);
			});

			describe("object constructor", () => {
				it("should return a Series instance", () => series.should.be.an.instanceOf(Series));
				it("should set the id", () => series.id.should.equal(id));
				it("should set the series name", () => series.seriesName.should.equal(seriesName));
				it("should set the now showing", () => series.nowShowing.should.equal(nowShowing));
				it("should set the program id", () => series.programId.should.equal(programId));
				it("should set the program name", () => series.programName.should.equal(programName));
				it("should set the progress bar total", () => series.progressBar.total.should.equal(episodeCount));
				it("should set the episode count", () => series.episodeCount.should.equal(episodeCount));
				it("should set the watched count", () => series.watchedCount.should.equal(watchedCount));
				it("should set the recorded count", () => series.recordedCount.should.equal(recordedCount));
				it("should set the expected count", () => series.expectedCount.should.equal(expectedCount));
				it("should set the missed count", () => series.missedCount.should.equal(missedCount));
				it("should set the status warning count", () => series.statusWarningCount.should.equal(statusWarningCount));
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
						let seriesId,
								sql;

						beforeEach(() => {
							if (params.useId) {
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

						describe("fail", () => {
							beforeEach(() => appController.db.failAt(sql));

							describe("without callback", () => {
								beforeEach(() => series.save());

								it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
								it("should rollback the transaction", () => appController.db.commit.should.be.false);
								it("should return an error message", () => appController.db.errorMessage.should.equal("Series.save: Force failed"));
							});

							describe("with callback", () => {
								beforeEach(() => {
									callback = sinon.stub();
									series.save(callback);
								});

								it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
								it("should rollback the transaction", () => appController.db.commit.should.be.false);
								it("should invoke the callback", () => callback.should.have.been.called);
								it("should return an error message", () => appController.db.errorMessage.should.equal("Series.save: Force failed"));
							});
						});

						describe("no rows affected", () => {
							beforeEach(() => appController.db.noRowsAffectedAt(sql));

							describe("without callback", () => {
								beforeEach(() => series.save());

								it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
								it("should rollback the transaction", () => appController.db.commit.should.be.false);
								it("should return an error message", () => appController.db.errorMessage.should.equal("Series.save: no rows affected"));
							});

							describe("with callback", () => {
								beforeEach(() => {
									callback = sinon.stub();
									series.save(callback);
								});

								it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
								it("should rollback the transaction", () => appController.db.commit.should.be.false);
								it("should invoke the callback", () => callback.should.have.been.called);
								it("should return an error message", () => appController.db.errorMessage.should.equal("Series.save: no rows affected"));
							});
						});

						describe(`${params.description} Sync fail`, () => {
							beforeEach(() => appController.db.failAt(`
								INSERT OR IGNORE INTO Sync (Type, ID, Action)
								VALUES ('Series', ${seriesId}, 'modified')
							`));

							describe("without callback", () => {
								beforeEach(() => series.save());

								it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
								it("should rollback the transaction", () => appController.db.commit.should.be.false);
								it("should return an error message", () => appController.db.errorMessage.should.equal("Series.save: Force failed"));
							});

							describe("with callback", () => {
								beforeEach(() => {
									callback = sinon.stub();
									series.save(callback);
								});

								it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
								it("should rollback the transaction", () => appController.db.commit.should.be.false);
								it("should invoke the callback", () => callback.should.have.been.called);
								it("should return an error message", () => appController.db.errorMessage.should.equal("Series.save: Force failed"));
							});
						});

						describe("success", () => {
							describe("without callback", () => {
								beforeEach(() => series.save());

								it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
								it("should commit the transaction", () => appController.db.commit.should.be.true);
								it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
							});

							describe("with callback", () => {
								beforeEach(() => {
									callback = sinon.stub();
									series.save(callback);
								});

								it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
								it("should commit the transaction", () => appController.db.commit.should.be.true);
								it("should invoke the callback", () => callback.should.have.been.calledWith(series.id));
								it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
							});
						});
					});
				});
			});

			describe("remove", () => {
				describe("no ID", () => {
					it("should execute no SQL commands", () => {
						series.id = null;
						series.remove();
						appController.db.commands.length.should.equal(0);
					});
				});

				describe("insert Episode Sync fail", () => {
					beforeEach(() => {
						appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) SELECT 'Episode', EpisodeID, 'deleted' FROM Episode WHERE SeriesID = ${id}`);
						series.remove();
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should not clear the id", () => series.id.should.equal(id));
					it("should not clear the series name", () => series.seriesName.should.equal(seriesName));
					it("should not clear the now showing", () => series.nowShowing.should.equal(nowShowing));
					it("should not clear the program id", () => series.programId.should.equal(programId));
				});

				describe("delete Episode fail", () => {
					beforeEach(() => {
						appController.db.failAt(`DELETE FROM Episode WHERE SeriesID = ${id}`);
						series.remove();
					});

					it("should execute two SQL commands", () => appController.db.commands.length.should.equal(2));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should not clear the id", () => series.id.should.equal(id));
					it("should not clear the series name", () => series.seriesName.should.equal(seriesName));
					it("should not clear the now showing", () => series.nowShowing.should.equal(nowShowing));
					it("should not clear the program id", () => series.programId.should.equal(programId));
				});

				describe("insert Series Sync fail", () => {
					beforeEach(() => {
						appController.db.failAt(`REPLACE INTO Sync (Type, ID, Action) VALUES ('Series', ${id}, 'deleted')`);
						series.remove();
					});

					it("should execute three SQL commands", () => appController.db.commands.length.should.equal(3));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should not clear the id", () => series.id.should.equal(id));
					it("should not clear the series name", () => series.seriesName.should.equal(seriesName));
					it("should not clear the now showing", () => series.nowShowing.should.equal(nowShowing));
					it("should not clear the program id", () => series.programId.should.equal(programId));
				});

				describe("delete Series fail", () => {
					beforeEach(() => {
						appController.db.failAt(`DELETE FROM Series	WHERE SeriesID = ${id}`);
						series.remove();
					});

					it("should execute four SQL commands", () => appController.db.commands.length.should.equal(4));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should not clear the id", () => series.id.should.equal(id));
					it("should not clear the series name", () => series.seriesName.should.equal(seriesName));
					it("should not clear the now showing", () => series.nowShowing.should.equal(nowShowing));
					it("should not clear the program id", () => series.programId.should.equal(programId));
				});

				describe("success", () => {
					beforeEach(() => series.remove());

					it("should execute four SQL commands", () => appController.db.commands.length.should.equal(4));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
					it("should clear the id", () => (null === series.id).should.be.true);
					it("should clear the series name", () => (null === series.seriesName).should.be.true);
					it("should clear the now showing", () => (null === series.nowShowing).should.be.true);
					it("should clear the program id", () => (null === series.programId).should.be.true);
				});
			});

			describe("toJson", () => {
				it("should return a JSON representation of the series", () => series.toJson().should.deep.equal({id, seriesName, nowShowing, programId}));
			});

			describe("setNowShowing", () => {
				const testParams = [
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

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => series.setNowShowing(params.nowShowing));

						it("should set the now showing", () => {
							if (params.nowShowing) {
								series.nowShowing.should.equal(params.nowShowing);
							} else {
								(null === series.nowShowing).should.be.true;
							}
						});

						it("should update the now showing display", () => series.nowShowingDisplay.should.equal(params.nowShowingDisplay));
					});
				});
			});

			describe("setEpisodeCount", () => {
				beforeEach(() => {
					episodeCount = 2;
					series.setEpisodeCount(episodeCount);
				});

				it("should set the episode count", () => series.episodeCount.should.equal(episodeCount));
				it("should set the progress bar total", () => series.progressBar.total.should.equal(episodeCount));
			});

			describe("setWatchedCount", () => {
				it("should set the watched count", () => {
					watchedCount = 2;
					series.setWatchedCount(watchedCount);
					series.watchedCount.should.equal(watchedCount);
				});
			});

			describe("setWatchedProgress", () => {
				const testParams = [
					{
						description: "null",
						watchedCount: null,
						progressBarDisplay: {
							label: null,
							percent: 0,
							style: "watched"
						}
					},
					{
						description: "zero",
						watchedCount: 0,
						progressBarDisplay: {
							label: 0,
							percent: 0,
							style: "watched"
						}
					},
					{
						description: "non-zero",
						watchedCount: 1,
						progressBarDisplay: {
							label: 1,
							percent: 100,
							style: "watched"
						}
					}
				];

				testParams.forEach(params => {
					describe(params.description, () => {
						it("should update the progress bar display", () => {
							series.watchedCount = params.watchedCount;
							series.setWatchedProgress();
							series.progressBarDisplay.should.deep.equal(params.progressBarDisplay);
						});
					});
				});
			});

			describe("setRecordedCount", () => {
				const testParams = [
					{
						description: "null",
						recordedCount: null,
						progressBarDisplay: {
							label: null,
							percent: 0,
							style: "recorded"
						}
					},
					{
						description: "zero",
						recordedCount: 0,
						progressBarDisplay: {
							label: 0,
							percent: 0,
							style: "recorded"
						}
					},
					{
						description: "non-zero",
						recordedCount: 1,
						progressBarDisplay: {
							label: 1,
							percent: 100,
							style: "recorded"
						}
					}
				];

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => series.setRecordedCount(params.recordedCount));

						it("should set the recorded count", () => {
							if (null === params.recordedCount) {
								(null === series.recordedCount).should.be.true;
							} else {
								series.recordedCount.should.equal(params.recordedCount);
							}
						});

						it("should update the progress bar display", () => series.progressBarDisplay.should.deep.equal(params.progressBarDisplay));
					});
				});
			});

			describe("setExpectedCount", () => {
				const testParams = [
					{
						description: "null",
						expectedCount: null,
						progressBarDisplay: {
							label: null,
							percent: 0,
							style: "expected"
						}
					},
					{
						description: "zero",
						expectedCount: 0,
						progressBarDisplay: {
							label: 0,
							percent: 0,
							style: "expected"
						}
					},
					{
						description: "non-zero",
						expectedCount: 1,
						progressBarDisplay: {
							label: 1,
							percent: 100,
							style: "expected"
						}
					}
				];

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => series.setExpectedCount(params.expectedCount));

						it("should set the expected count", () => {
							if (null === params.expectedCount) {
								(null === series.expectedCount).should.be.true;
							} else {
								series.expectedCount.should.equal(params.expectedCount);
							}
						});

						it("should update the progress bar display", () => series.progressBarDisplay.should.deep.equal(params.progressBarDisplay));
					});
				});
			});

			describe("setMissedCount", () => {
				const testParams = [
					{
						description: "null",
						missedCount: null,
						progressBarDisplay: {
							label: null,
							percent: 0,
							style: "missed"
						}
					},
					{
						description: "zero",
						missedCount: 0,
						progressBarDisplay: {
							label: 0,
							percent: 0,
							style: "missed"
						}
					},
					{
						description: "non-zero",
						missedCount: 1,
						progressBarDisplay: {
							label: 1,
							percent: 100,
							style: "missed"
						}
					}
				];

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => series.setMissedCount(params.missedCount));

						it("should set the missed count", () => {
							if (null === params.missedCount) {
								(null === series.missedCount).should.be.true;
							} else {
								series.missedCount.should.equal(params.missedCount);
							}
						});

						it("should update the progress bar display", () => series.progressBarDisplay.should.deep.equal(params.progressBarDisplay));
					});
				});
			});

			describe("setStatusWarning", () => {
				const testParams = [
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

				testParams.forEach(params => {
					describe(params.description, () => {
						beforeEach(() => series.setStatusWarning(params.statusWarningCount));

						it("should set the status warning count", () => series.statusWarningCount.should.equal(params.statusWarningCount));
						it(`should ${0 === params.statusWarningCount ? "not " : ""}highlight the series with a warning`, () => series.statusWarning.should.equal(params.statusWarning));
					});
				});
			});

			describe("listByProgram", () => {
				let sql;

				beforeEach(() => {
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
						ORDER BY				s.Name
					`;
				});

				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt(sql);
						Series.listByProgram(programId, callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.list: Force failed"));
				});

				describe("no rows affected", () => {
					beforeEach(() => {
						appController.db.noRowsAffectedAt(sql);
						Series.listByProgram(programId, callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});

				describe("success", () => {
					beforeEach(() => {
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

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([series]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("listByNowShowing", () => {
				let sql;

				beforeEach(() => {
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
														p.Name
					`;
				});

				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt(sql);
						Series.listByNowShowing(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.list: Force failed"));
				});

				describe("no rows affected", () => {
					beforeEach(() => {
						appController.db.noRowsAffectedAt(sql);
						Series.listByNowShowing(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});

				describe("success", () => {
					beforeEach(() => {
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

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([series]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("listByStatus", () => {
				let status,
						sql;

				beforeEach(() => {
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
						ORDER BY	p.Name,
											s.Name
					`;
				});

				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt(sql);
						Series.listByStatus(callback, status);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.list: Force failed"));
				});

				describe("no rows affected", () => {
					beforeEach(() => {
						appController.db.noRowsAffectedAt(sql);
						Series.listByStatus(callback, status);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});

				describe("success", () => {
					beforeEach(() => {
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

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([series]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("listByIncomplete", () => {
				let sql;

				beforeEach(() => {
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
						ORDER BY				p.Name,
														s.Name
					`;
				});

				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt(sql);
						Series.listByIncomplete(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.list: Force failed"));
				});

				describe("no rows affected", () => {
					beforeEach(() => {
						appController.db.noRowsAffectedAt(sql);
						Series.listByIncomplete(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});

				describe("success", () => {
					beforeEach(() => {
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

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith([series]));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("find", () => {
				describe("fail", () => {
					beforeEach(() => {
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

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.called);
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.find: Force failed"));
				});

				describe("success", () => {
					beforeEach(() => {
						appController.db.addResultRows([{
							SeriesID: id,
							Name: seriesName,
							NowShowing: nowShowing,
							ProgramID: programId
						}]);

						series.programName = Reflect.undefined;
						series.setEpisodeCount();
						series.setWatchedCount();
						series.setRecordedCount();
						series.setExpectedCount();
						series.setMissedCount();
						series.setStatusWarning();

						Series.find(id, callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.calledWith(series));
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("count", () => {
				describe("fail", () => {
					beforeEach(() => {
						appController.db.failAt("SELECT COUNT(*) AS SeriesCount FROM Series");
						Series.count(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith(0));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.count: Force failed"));
				});

				describe("success", () => {
					beforeEach(() => {
						appController.db.addResultRows([{SeriesCount: 1}]);
						Series.count(callback);
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
						appController.db.failAt("DELETE FROM Series");
						Series.removeAll(callback);
					});

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should rollback the transaction", () => appController.db.commit.should.be.false);
					it("should invoke the callback", () => callback.should.have.been.calledWith(appController.db.errorMessage));
					it("should return an error message", () => appController.db.errorMessage.should.equal("Series.removeAll: Force failed"));
				});

				describe("success", () => {
					beforeEach(() => Series.removeAll(callback));

					it("should execute one SQL command", () => appController.db.commands.length.should.equal(1));
					it("should commit the transaction", () => appController.db.commit.should.be.true);
					it("should invoke the callback", () => callback.should.have.been.called);
					it("should not return an error message", () => (null === appController.db.errorMessage).should.be.true);
				});
			});

			describe("fromJson", () => {
				it("should construct a Series object from the JSON", () => Series.fromJson({id, seriesName, nowShowing, programId}).should.deep.equal(new Series(id, seriesName, nowShowing, programId)));
			});

			afterEach(() => appController.db.reset());
		});
	}
);
