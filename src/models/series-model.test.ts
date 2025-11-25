import * as API from "~/mocks/api-service-mock";
import type { EpisodeStatus, JsonSeries } from "~/models";
import Series from "./series-model";

describe("Series", (): void => {
	let id: number,
		seriesName: string,
		nowShowing: number,
		programId: number,
		programName: string,
		episodeCount: number,
		watchedCount: number,
		recordedCount: number,
		expectedCount: number,
		missedCount: number,
		statusWarningCount: number,
		series: Series,
		path: string;

	beforeEach((): void => {
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
			expect(series.id).to.equal(id));
		it("should set the series name", (): Chai.Assertion =>
			expect(series.seriesName).to.equal(seriesName));
		it("should set the now showing", (): Chai.Assertion =>
			expect(Number(series.nowShowing)).to.equal(nowShowing));
		it("should set the program id", (): Chai.Assertion =>
			expect(series.programId).to.equal(programId));
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

	describe("list", (): void => {
		let seriesList: Series[];

		beforeEach(async (): Promise<void> => {
			path = `/programs/${programId}/series`;
			API.get.withArgs(path).returns([
				{
					id,
					name: seriesName,
					now_showing: nowShowing,
					program_id: programId,
					program_name: programName,
					episode_count: episodeCount,
					watched_count: watchedCount,
					recorded_count: recordedCount,
					expected_count: expectedCount,
					missed_count: missedCount,
					status_warning_count: statusWarningCount,
				},
			]);
			seriesList = await Series.list(programId);
		});

		it("should attempt to get the list of series", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of series", (): Chai.Assertion =>
			expect(seriesList).to.deep.equal([series]));

		afterEach((): void => API.get.reset());
	});

	describe("scheduled", (): void => {
		let seriesList: Series[];

		beforeEach(async (): Promise<void> => {
			path = "/scheduled";
			API.get.withArgs(path).returns([
				{
					id,
					name: seriesName,
					now_showing: nowShowing,
					program_id: programId,
					program_name: programName,
					episode_count: episodeCount,
					watched_count: watchedCount,
					recorded_count: recordedCount,
					expected_count: expectedCount,
					missed_count: missedCount,
					status_warning_count: statusWarningCount,
				},
			]);
			seriesList = await Series.scheduled();
		});

		it("should attempt to get the list of series", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of series", (): Chai.Assertion =>
			expect(seriesList).to.deep.equal([series]));

		afterEach((): void => API.get.reset());
	});

	describe("listByStatus", (): void => {
		const status: EpisodeStatus = "watched";
		let seriesList: Series[];

		beforeEach(async (): Promise<void> => {
			path = `/reports/${status}`;
			API.get.withArgs(path).returns([
				{
					id,
					name: seriesName,
					now_showing: nowShowing,
					program_id: programId,
					program_name: programName,
					episode_count: episodeCount,
					watched_count: watchedCount,
					recorded_count: recordedCount,
					expected_count: expectedCount,
					missed_count: missedCount,
					status_warning_count: statusWarningCount,
				},
			]);
			seriesList = await Series.listByStatus(status);
		});

		it("should attempt to get the list of series", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of series", (): Chai.Assertion =>
			expect(seriesList).to.deep.equal([series]));

		afterEach((): void => API.get.reset());
	});

	describe("incomplete", (): void => {
		let seriesList: Series[];

		beforeEach(async (): Promise<void> => {
			path = "/reports/incomplete";
			API.get.withArgs(path).returns([
				{
					id,
					name: seriesName,
					now_showing: nowShowing,
					program_id: programId,
					program_name: programName,
					episode_count: episodeCount,
					watched_count: watchedCount,
					recorded_count: recordedCount,
					expected_count: expectedCount,
					missed_count: missedCount,
					status_warning_count: statusWarningCount,
				},
			]);
			seriesList = await Series.incomplete();
		});

		it("should attempt to get the list of series", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of series", (): Chai.Assertion =>
			expect(seriesList).to.deep.equal([series]));

		afterEach((): void => API.get.reset());
	});

	describe("find", (): void => {
		let foundSeries: Series;

		beforeEach(async (): Promise<void> => {
			path = `/series/${id}`;
			API.get.withArgs(path).returns({
				id,
				name: seriesName,
				now_showing: nowShowing,
				program_id: programId,
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

		it("should attempt to find the series", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the series", (): Chai.Assertion =>
			expect(foundSeries).to.deep.equal(series));

		afterEach((): void => API.get.reset());
	});

	describe("count", (): void => {
		let count: number;

		beforeEach(async (): Promise<void> => {
			path = "/series/count";
			API.get.withArgs(path).returns(1);
			count = await Series.count();
		});

		it("should attempt to get the count of series", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the count of series", (): Chai.Assertion =>
			expect(count).to.equal(1));

		afterEach((): void => API.get.reset());
	});

	describe("fromJson", (): void => {
		it("should construct a Series object from the JSON", (): Chai.Assertion =>
			expect(
				Series["fromJson"]({
					id,
					name: seriesName,
					now_showing: nowShowing,
					program_id: programId,
					program_name: programName,
					episode_count: episodeCount,
					watched_count: watchedCount,
					recorded_count: recordedCount,
					expected_count: expectedCount,
					missed_count: missedCount,
					status_warning_count: statusWarningCount,
				}),
			).to.deep.equal(series));
	});

	describe("save", (): void => {
		let seriesToSave: Omit<JsonSeries, "id">;

		beforeEach(
			(): Omit<JsonSeries, "id"> =>
				(seriesToSave = {
					name: seriesName,
					now_showing: nowShowing,
					program_id: programId,
				}),
		);

		describe("insert", (): void => {
			beforeEach(async (): Promise<void> => {
				series.id = null;
				path = `/programs/${programId}/series`;
				API.create.withArgs(path).returns({ id: 1 });
				await series.save();
			});

			it("should attempt to save the series", (): Chai.Assertion =>
				expect(API.create).to.have.been.calledWith(path, seriesToSave));

			it("should set the series id", (): Chai.Assertion =>
				expect(series.id).to.equal(1));

			afterEach((): void => API.create.reset());
		});

		describe("update", (): void => {
			beforeEach(async (): Promise<void> => {
				path = `/series/${id}`;
				API.update.withArgs(path).returns(true);
				await series.save();
			});

			it("should attempt to save the series", (): Chai.Assertion =>
				expect(API.update).to.have.been.calledWith(path, seriesToSave));

			afterEach((): void => API.update.reset());
		});
	});

	describe("remove", (): void => {
		beforeEach((): string => (path = `/series/${id}`));

		describe("no ID", (): void => {
			it("should do nothing", async (): Promise<void> => {
				series.id = null;
				await series.remove();
				expect(API.destroy.withArgs(path)).to.not.have.been.called;
			});
			it("should not clear the series name", (): Chai.Assertion =>
				expect(series.seriesName).to.equal(seriesName));
			it("should not clear the now showing", (): Chai.Assertion =>
				expect(Number(series.nowShowing)).to.equal(nowShowing));
		});

		describe("with ID", (): void => {
			beforeEach(async (): Promise<void> => series.remove());

			it("should attempt to remove the series", (): Chai.Assertion =>
				expect(API.destroy).to.have.been.calledWith(path));
			it("should clear the id", (): Chai.Assertion =>
				expect(series.id).to.be.null);
			it("should clear the series name", (): Chai.Assertion =>
				expect(series.seriesName).to.equal(""));
			it("should clear the now showing", (): Chai.Assertion =>
				expect(series.nowShowing).to.be.null);
		});

		afterEach((): void => API.destroy.reset());
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
