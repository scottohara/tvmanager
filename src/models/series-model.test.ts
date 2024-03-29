import type { EpisodeStatus, PersistedSeries } from "~/models";
import DatabaseServiceMock from "~/mocks/database-service-mock";
import Series from "./series-model";
import type { SinonStub } from "sinon";

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
		series: Series;

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
		series = new Series(
			id,
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
		);
	});

	describe("object constructor", (): void => {
		it("should return a Series instance", (): Chai.Assertion =>
			expect(series).to.be.an.instanceOf(Series));
		it("should set the id", (): Chai.Assertion =>
			expect(String(series.id)).to.equal(id));
		it("should set the series name", (): Chai.Assertion =>
			expect(String(series.seriesName)).to.equal(seriesName));
		it("should set the now showing", (): Chai.Assertion =>
			expect(Number(series.nowShowing)).to.equal(nowShowing));
		it("should set the program id", (): Chai.Assertion =>
			expect(String(series.programId)).to.equal(programId));
		it("should set the program name", (): Chai.Assertion =>
			expect(String(series.programName)).to.equal(programName));
		it("should set the progress bar total", (): Chai.Assertion =>
			expect(series["progressBar"]["total"]).to.equal(episodeCount));
		it("should set the episode count", (): Chai.Assertion =>
			expect(series.episodeCount).to.equal(episodeCount));
		it("should set the watched count", (): Chai.Assertion =>
			expect(series.watchedCount).to.equal(watchedCount));
		it("should set the recorded count", (): Chai.Assertion =>
			expect(series.recordedCount).to.equal(recordedCount));
		it("should set the expected count", (): Chai.Assertion =>
			expect(series.expectedCount).to.equal(expectedCount));
		it("should set the missed count", (): Chai.Assertion =>
			expect(series["missedCount"]).to.equal(missedCount));
		it("should set the status warning count", (): Chai.Assertion =>
			expect(series.statusWarningCount).to.equal(statusWarningCount));

		["statusWarning", "nowShowingDisplay"].forEach((property: string): void => {
			it(`should make the ${property} property enumerable`, (): Chai.Assertion =>
				expect(
					Boolean(
						(
							Object.getOwnPropertyDescriptor(
								series,
								property,
							) as PropertyDescriptor
						).enumerable,
					),
				).to.be.true);
		});
	});

	describe("listByProgram", (): void => {
		let seriesList: Series[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByProgram as SinonStub
				).throws();
				seriesList = await Series.listByProgram(programId);
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.listByProgram,
				).to.have.been.calledWith(programId));
			it("should return an empty array", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByProgram as SinonStub
				).returns([
					{
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
						StatusWarningCount: statusWarningCount,
					},
				]);
				seriesList = await Series.listByProgram(programId);
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.listByProgram,
				).to.have.been.calledWith(programId));
			it("should return the list of series", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([series]));
		});

		afterEach(
			async (): Promise<void> =>
				(
					(await DatabaseServiceMock).seriesStore.listByProgram as SinonStub
				).reset(),
		);
	});

	describe("listByNowShowing", (): void => {
		let seriesList: Series[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByNowShowing as SinonStub
				).throws();
				seriesList = await Series.listByNowShowing();
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.listByNowShowing).to.have
					.been.called);
			it("should return an empty array", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByNowShowing as SinonStub
				).returns([
					{
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
						StatusWarningCount: statusWarningCount,
					},
				]);
				seriesList = await Series.listByNowShowing();
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.listByNowShowing).to.have
					.been.called);
			it("should return the list of series", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([series]));
		});

		afterEach(
			async (): Promise<void> =>
				(
					(await DatabaseServiceMock).seriesStore.listByNowShowing as SinonStub
				).reset(),
		);
	});

	describe("listByStatus", (): void => {
		const status: EpisodeStatus = "Watched";

		let seriesList: Series[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByStatus as SinonStub
				).throws();
				seriesList = await Series.listByStatus(status);
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.listByStatus,
				).to.have.been.calledWith(status));
			it("should return an empty array", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByStatus as SinonStub
				).returns([
					{
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
						StatusWarningCount: statusWarningCount,
					},
				]);
				seriesList = await Series.listByStatus(status);
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.listByStatus,
				).to.have.been.calledWith(status));
			it("should return the list of series", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([series]));
		});

		afterEach(
			async (): Promise<void> =>
				(
					(await DatabaseServiceMock).seriesStore.listByStatus as SinonStub
				).reset(),
		);
	});

	describe("listByIncomplete", (): void => {
		let seriesList: Series[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByIncomplete as SinonStub
				).throws();
				seriesList = await Series.listByIncomplete();
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.listByIncomplete).to.have
					.been.called);
			it("should return an empty array", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				(
					(await DatabaseServiceMock).seriesStore.listByIncomplete as SinonStub
				).returns([
					{
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
						StatusWarningCount: statusWarningCount,
					},
				]);
				seriesList = await Series.listByIncomplete();
			});

			it("should attempt to get the list of series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.listByIncomplete).to.have
					.been.called);
			it("should return the list of series", (): Chai.Assertion =>
				expect(seriesList).to.deep.equal([series]));
		});

		afterEach(
			async (): Promise<void> =>
				(
					(await DatabaseServiceMock).seriesStore.listByIncomplete as SinonStub
				).reset(),
		);
	});

	describe("find", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).seriesStore.find as SinonStub).throws();
				series = await Series.find(id);
			});

			it("should attempt to find the series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.find,
				).to.have.been.calledWith(id));
			it("should return a null series id", (): Chai.Assertion =>
				expect(series.id).to.be.null);
		});

		describe("success", (): void => {
			describe("doesn't exist", (): void => {
				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).seriesStore.find as SinonStub).returns(
						undefined,
					);
					series = await Series.find(id);
				});

				it("should attempt to find the series", async (): Promise<Chai.Assertion> =>
					expect(
						(await DatabaseServiceMock).seriesStore.find,
					).to.have.been.calledWith(id));
				it("should return a null series id", (): Chai.Assertion =>
					expect(series.id).to.be.null);
			});

			describe("exists", (): void => {
				let foundSeries: Series;

				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).seriesStore.find as SinonStub).returns({
						SeriesID: id,
						Name: seriesName,
						NowShowing: nowShowing,
						ProgramID: programId,
					});

					series.programName = undefined;
					series.setEpisodeCount(0);
					series.setWatchedCount(0);
					series.setRecordedCount(0);
					series.setExpectedCount(0);
					series["setMissedCount"](0);
					series.statusWarningCount = 0;

					foundSeries = await Series.find(id);
				});

				it("should attempt to find the series", async (): Promise<Chai.Assertion> =>
					expect(
						(await DatabaseServiceMock).seriesStore.find,
					).to.have.been.calledWith(id));
				it("should return the series", (): Chai.Assertion =>
					expect(foundSeries).to.deep.equal(series));
			});
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).seriesStore.find as SinonStub).reset(),
		);
	});

	describe("count", (): void => {
		let count: number;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).seriesStore.count as SinonStub).throws();
				count = await Series.count();
			});

			it("should attempt to get the count of series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.count).to.have.been
					.called);
			it("should return zero", (): Chai.Assertion => expect(count).to.equal(0));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).seriesStore.count as SinonStub).returns(1);
				count = await Series.count();
			});

			it("should attempt to get the count of series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.count).to.have.been
					.called);
			it("should return the count of series", (): Chai.Assertion =>
				expect(count).to.equal(1));
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).seriesStore.count as SinonStub).reset(),
		);
	});

	describe("removeAll", (): void => {
		let errorMessage: string | undefined;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).seriesStore.removeAll as SinonStub).throws(
					new Error("Force failed"),
				);
				errorMessage = await Series.removeAll();
			});

			it("should attempt to remove all series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.removeAll).to.have.been
					.called);
			it("should return an error message", (): Chai.Assertion =>
				expect(String(errorMessage)).to.equal(
					"Series.removeAll: Force failed",
				));
		});

		describe("success", (): void => {
			beforeEach(
				async (): Promise<string | undefined> =>
					(errorMessage = await Series.removeAll()),
			);

			it("should attempt to remove all series", async (): Promise<Chai.Assertion> =>
				expect((await DatabaseServiceMock).seriesStore.removeAll).to.have.been
					.called);
			it("should not return an error message", (): Chai.Assertion =>
				expect(errorMessage).to.be.undefined);
		});

		afterEach(
			async (): Promise<void> =>
				(
					(await DatabaseServiceMock).seriesStore.removeAll as SinonStub
				).reset(),
		);
	});

	describe("fromJson", (): void => {
		it("should construct a Series object from the JSON", (): Chai.Assertion =>
			expect(
				Series.fromJson({
					id,
					seriesName,
					nowShowing,
					programId,
					type: "Series",
				}),
			).to.deep.equal(new Series(id, seriesName, nowShowing, programId)));
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			useId: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				useId: true,
			},
			{
				description: "insert",
				useId: false,
			},
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let seriesToSave: PersistedSeries, seriesId: string | undefined;

				beforeEach((): void => {
					if (!scenario.useId) {
						series.id = null;
					}

					seriesToSave = {
						SeriesID: "ignored",
						Name: String(series.seriesName),
						NowShowing: series.nowShowing,
						ProgramID: String(series.programId),
					};
				});

				describe("fail", (): void => {
					beforeEach(async (): Promise<void> => {
						(
							(await DatabaseServiceMock).seriesStore.save as SinonStub
						).throws();
						seriesId = await series.save();
					});

					it("should attempt to save the series", async (): Promise<Chai.Assertion> =>
						expect(
							(await DatabaseServiceMock).seriesStore.save,
						).to.have.been.calledWith({
							...seriesToSave,
							SeriesID: series.id,
						}));

					it("should not return the series id", (): Chai.Assertion =>
						expect(seriesId).to.be.undefined);
				});

				describe("success", (): void => {
					beforeEach(
						async (): Promise<string | undefined> =>
							(seriesId = await series.save()),
					);

					it("should attempt to save the series", async (): Promise<Chai.Assertion> =>
						expect(
							(await DatabaseServiceMock).seriesStore.save,
						).to.have.been.calledWith({
							...seriesToSave,
							SeriesID: series.id,
						}));

					it("should return the series id", (): Chai.Assertion =>
						expect(String(seriesId)).to.equal(series.id));
				});
			});
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).seriesStore.save as SinonStub).reset(),
		);
	});

	describe("remove", (): void => {
		describe("no ID", (): void => {
			it("should do nothing", async (): Promise<void> => {
				series.id = null;
				await series.remove();
				expect((await DatabaseServiceMock).seriesStore.remove).to.not.have.been
					.called;
			});
		});

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).seriesStore.remove as SinonStub).throws();
				try {
					await series.remove();
				} catch (_e: unknown) {
					// No op
				}
			});

			it("should attempt to remove the series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.remove,
				).to.have.been.calledWith(id));
			it("should not clear the id", (): Chai.Assertion =>
				expect(String(series.id)).to.equal(id));
			it("should not clear the series name", (): Chai.Assertion =>
				expect(String(series.seriesName)).to.equal(seriesName));
			it("should not clear the now showing", (): Chai.Assertion =>
				expect(Number(series.nowShowing)).to.equal(nowShowing));
			it("should not clear the program id", (): Chai.Assertion =>
				expect(String(series.programId)).to.equal(programId));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => series.remove());

			it("should attempt to remove the series", async (): Promise<Chai.Assertion> =>
				expect(
					(await DatabaseServiceMock).seriesStore.remove,
				).to.have.been.calledWith(id));
			it("should clear the id", (): Chai.Assertion =>
				expect(series.id).to.be.null);
			it("should clear the series name", (): Chai.Assertion =>
				expect(series.seriesName).to.be.null);
			it("should clear the now showing", (): Chai.Assertion =>
				expect(series.nowShowing).to.be.null);
			it("should clear the program id", (): Chai.Assertion =>
				expect(series.programId).to.be.null);
		});

		afterEach(
			async (): Promise<void> =>
				((await DatabaseServiceMock).seriesStore.remove as SinonStub).reset(),
		);
	});

	describe("toJson", (): void => {
		it("should return a JSON representation of the series", (): Chai.Assertion =>
			expect(series.toJson()).to.deep.equal({
				id,
				seriesName,
				nowShowing,
				programId,
				type: "Series",
			}));
	});

	describe("setEpisodeCount", (): void => {
		beforeEach((): void => {
			episodeCount = 2;
			series.setEpisodeCount(episodeCount);
		});

		it("should set the episode count", (): Chai.Assertion =>
			expect(series.episodeCount).to.equal(episodeCount));
		it("should set the progress bar total", (): Chai.Assertion =>
			expect(series["progressBar"]["total"]).to.equal(episodeCount));
	});

	describe("setWatchedCount", (): void => {
		it("should set the watched count", (): void => {
			watchedCount = 2;
			series.setWatchedCount(watchedCount);
			expect(series.watchedCount).to.equal(watchedCount);
		});
	});

	describe("setRecordedCount", (): void => {
		beforeEach((): void => series.setRecordedCount(1));

		it("should set the recorded count", (): Chai.Assertion =>
			expect(series.recordedCount).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(series.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "recorded",
				}),
			));
	});

	describe("setExpectedCount", (): void => {
		beforeEach((): void => series.setExpectedCount(1));

		it("should set the expected count", (): Chai.Assertion =>
			expect(series.expectedCount).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(series.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "expected",
				}),
			));
	});

	describe("statusWarning", (): void => {
		interface Scenario {
			description: string;
			statusWarningCount: number;
			statusWarning: "" | "warning";
		}

		const scenarios: Scenario[] = [
			{
				description: "no warning count",
				statusWarningCount: 0,
				statusWarning: "",
			},
			{
				description: "with warning count",
				statusWarningCount: 1,
				statusWarning: "warning",
			},
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(
					(): number =>
						(series.statusWarningCount = scenario.statusWarningCount),
				);
				it(`should ${
					scenario.statusWarningCount ? "" : "not "
				}highlight the series with a warning`, (): Chai.Assertion =>
					expect(series.statusWarning).to.equal(scenario.statusWarning));
			});
		});
	});

	describe("nowShowingDisplay", (): void => {
		interface Scenario {
			description: string;
			nowShowing: number | null;
			nowShowingDisplay: string;
		}

		const scenarios: Scenario[] = [
			{
				description: "null",
				nowShowing: null,
				nowShowingDisplay: "Not Showing",
			},
			{
				description: "zero",
				nowShowing: 0,
				nowShowingDisplay: "Not Showing",
			},
			{
				description: "non-zero",
				nowShowing: 2,
				nowShowingDisplay: "Tuesdays",
			},
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				beforeEach(
					(): number | null => (series.nowShowing = scenario.nowShowing),
				);
				it("should update the now showing display", (): Chai.Assertion =>
					expect(series.nowShowingDisplay).to.equal(
						scenario.nowShowingDisplay,
					));
			});
		});
	});

	describe("setWatchedProgress", (): void => {
		it("should update the progress bar display", (): void => {
			series.watchedCount = 1;
			series["setWatchedProgress"]();
			expect(series.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "watched",
				}),
			);
		});
	});

	describe("setMissedCount", (): void => {
		beforeEach((): void => series["setMissedCount"](1));

		it("should set the expected count", (): Chai.Assertion =>
			expect(series["missedCount"]).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(series.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "missed",
				}),
			));
	});
});
