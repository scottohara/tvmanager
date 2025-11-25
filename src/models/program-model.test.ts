import * as API from "~/mocks/api-service-mock";
import type { JsonProgram } from "~/models";
import Program from "./program-model";

describe("Program", (): void => {
	let id: number,
		programName: string,
		seriesCount: number,
		episodeCount: number,
		watchedCount: number,
		recordedCount: number,
		expectedCount: number,
		program: Program,
		path: string;

	beforeEach((): void => {
		id = 1;
		programName = "test-program";
		seriesCount = 1;
		episodeCount = 1;
		watchedCount = 1;
		recordedCount = 1;
		expectedCount = 1;
		program = new Program(
			id,
			programName,
			seriesCount,
			episodeCount,
			watchedCount,
			recordedCount,
			expectedCount,
		);
	});

	describe("object constructor", (): void => {
		it("should return a Program instance", (): Chai.Assertion =>
			expect(program).to.be.an.instanceOf(Program));
		it("should set the id", (): Chai.Assertion =>
			expect(program.id).to.equal(id));
		it("should set the program name", (): Chai.Assertion =>
			expect(program.programName).to.equal(programName));
		it("should set the progress bar total", (): Chai.Assertion =>
			expect(program["progressBar"]["total"]).to.equal(episodeCount));
		it("should set the series count", (): Chai.Assertion =>
			expect(program.seriesCount).to.equal(seriesCount));
		it("should set the episode count", (): Chai.Assertion =>
			expect(program.episodeCount).to.equal(episodeCount));
		it("should set the watched count", (): Chai.Assertion =>
			expect(program.watchedCount).to.equal(watchedCount));
		it("should set the recorded count", (): Chai.Assertion =>
			expect(program.recordedCount).to.equal(recordedCount));
		it("should set the expected count", (): Chai.Assertion =>
			expect(program.expectedCount).to.equal(expectedCount));

		["programGroup"].forEach((property: string): void => {
			it(`should make the ${property} property enumerable`, (): Chai.Assertion =>
				expect(
					Boolean(
						(
							Object.getOwnPropertyDescriptor(
								program,
								property,
							) as PropertyDescriptor
						).enumerable,
					),
				).to.be.true);
		});
	});

	describe("list", (): void => {
		let programList: Program[];

		beforeEach(async (): Promise<void> => {
			path = "/programs";
			API.get.withArgs(path).returns([
				{
					id,
					name: programName,
					series_count: seriesCount,
					episode_count: episodeCount,
					watched_count: watchedCount,
					recorded_count: recordedCount,
					expected_count: expectedCount,
				},
			]);
			programList = await Program.list();
		});

		it("should attempt to get the list of programs", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of programs", (): Chai.Assertion =>
			expect(programList).to.deep.equal([program]));

		afterEach((): void => API.get.reset());
	});

	describe("find", (): void => {
		let foundProgram: Program;

		beforeEach(async (): Promise<void> => {
			path = `/programs/${id}`;
			API.get.withArgs(path).returns({
				id,
				name: programName,
			});
			program.seriesCount = 0;
			program.setEpisodeCount(0);
			program.setWatchedCount(0);
			program.setRecordedCount(0);
			program.setExpectedCount(0);
			foundProgram = await Program.find(id);
		});

		it("should attempt to find the program", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the program", (): Chai.Assertion =>
			expect(foundProgram).to.deep.equal(program));

		afterEach((): void => API.get.reset());
	});

	describe("count", (): void => {
		let count: number;

		beforeEach(async (): Promise<void> => {
			path = "/programs/count";
			API.get.withArgs(path).returns(1);
			count = await Program.count();
		});

		it("should attempt to get the count of programs", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the count of programs", (): Chai.Assertion =>
			expect(count).to.equal(1));

		afterEach((): void => API.get.reset());
	});

	describe("save", (): void => {
		let programToSave: Omit<JsonProgram, "id">;

		beforeEach(
			(): Omit<JsonProgram, "id"> => (programToSave = { name: programName }),
		);

		describe("insert", (): void => {
			beforeEach(async (): Promise<void> => {
				program.id = null;
				path = "/programs";
				API.create.withArgs(path).returns({ id: 1 });
				await program.save();
			});

			it("should attempt to save the program", (): Chai.Assertion =>
				expect(API.create).to.have.been.calledWith(path, programToSave));

			it("should set the program id", (): Chai.Assertion =>
				expect(program.id).to.equal(1));

			afterEach((): void => API.create.reset());
		});

		describe("update", (): void => {
			beforeEach(async (): Promise<void> => {
				path = `/programs/${id}`;
				API.update.withArgs(path).returns(true);
				await program.save();
			});

			it("should attempt to save the program", (): Chai.Assertion =>
				expect(API.update).to.have.been.calledWith(path, programToSave));
		});

		afterEach((): void => API.update.reset());
	});

	describe("remove", (): void => {
		beforeEach((): string => (path = `/programs/${id}`));

		describe("no ID", (): void => {
			it("should do nothing", async (): Promise<void> => {
				program.id = null;
				await program.remove();
				expect(API.destroy.withArgs(path)).to.not.have.been.called;
			});
			it("should not clear the program name", (): Chai.Assertion =>
				expect(program.programName).to.equal(programName));
		});

		describe("with ID", (): void => {
			beforeEach(async (): Promise<void> => program.remove());

			it("should attempt to remove the program", (): Chai.Assertion =>
				expect(API.destroy).to.have.been.calledWith(path));
			it("should clear the id", (): Chai.Assertion =>
				expect(program.id).to.be.null);
			it("should clear the program name", (): Chai.Assertion =>
				expect(program.programName).to.equal(""));
		});

		afterEach((): void => API.destroy.reset());
	});

	describe("programGroup", (): void => {
		beforeEach((): string => (program.programName = "a-test-group"));
		it("should return the program group", (): Chai.Assertion =>
			expect(program.programGroup).to.equal("A"));
	});

	describe("setEpisodeCount", (): void => {
		beforeEach((): void => {
			episodeCount = 2;
			program.setEpisodeCount(episodeCount);
		});

		it("should set the episode count", (): Chai.Assertion =>
			expect(program.episodeCount).to.equal(episodeCount));
		it("should set the progress bar total", (): Chai.Assertion =>
			expect(program["progressBar"]["total"]).to.equal(episodeCount));
	});

	describe("setWatchedCount", (): void => {
		it("should set the watched count", (): void => {
			watchedCount = 2;
			program.setWatchedCount(watchedCount);
			expect(program.watchedCount).to.equal(watchedCount);
		});
	});

	describe("setRecordedCount", (): void => {
		beforeEach((): void => program.setRecordedCount(1));

		it("should set the recorded count", (): Chai.Assertion =>
			expect(program.recordedCount).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(program.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "recorded",
				}),
			));
	});

	describe("setExpectedCount", (): void => {
		beforeEach((): void => program.setExpectedCount(1));

		it("should set the expected count", (): Chai.Assertion =>
			expect(program.expectedCount).to.equal(1));
		it("should update the progress bar display", (): Chai.Assertion =>
			expect(program.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "expected",
				}),
			));
	});

	describe("setWatchedProgress", (): void => {
		it("should update the progress bar display", (): void => {
			program.watchedCount = 1;
			program["setWatchedProgress"]();
			expect(program.progressBarDisplay).to.equal(
				JSON.stringify({
					label: 1,
					percent: 100,
					style: "watched",
				}),
			);
		});
	});
});
