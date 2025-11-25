import * as API from "~/mocks/api-service-mock";
import type { EpisodeStatus, JsonEpisode } from "~/models";
import sinon, { type SinonFakeTimers } from "sinon";
import Episode from "./episode-model";

describe("Episode", (): void => {
	let id: number,
		episodeName: string,
		status: EpisodeStatus,
		statusDate: string,
		unverified: boolean,
		unscheduled: boolean,
		sequence: number,
		seriesId: number,
		seriesName: string,
		programName: string,
		episode: Episode,
		path: string;

	beforeEach((): void => {
		id = 1;
		episodeName = "test-episode";
		status = "expected";
		statusDate = "31-Dec";
		unverified = true;
		unscheduled = true;
		sequence = 1;
		seriesId = 2;
		seriesName = "test-series";
		programName = "test-program";
		episode = new Episode(
			id,
			episodeName,
			status,
			statusDate,
			seriesId,
			unverified,
			unscheduled,
			sequence,
			seriesName,
			programName,
		);
	});

	describe("object constructor", (): void => {
		it("should return an Episode instance", (): Chai.Assertion =>
			expect(episode).to.be.an.instanceOf(Episode));
		it("should set the id", (): Chai.Assertion =>
			expect(episode.id).to.equal(id));
		it("should set the episode name", (): Chai.Assertion =>
			expect(episode.episodeName).to.equal(episodeName));
		it("should set the status", (): Chai.Assertion =>
			expect(episode.status).to.equal(status));
		it("should set the status date", (): Chai.Assertion =>
			expect(episode.statusDate).to.equal(statusDate));
		it("should set the unverified flag", (): Chai.Assertion =>
			expect(episode.unverified).to.equal(unverified));
		it("should set the unscheduled flag", (): Chai.Assertion =>
			expect(episode.unscheduled).to.equal(unscheduled));
		it("should set the sequence", (): Chai.Assertion =>
			expect(episode.sequence).to.equal(sequence));
		it("should set the series id", (): Chai.Assertion =>
			expect(episode["seriesId"]).to.equal(seriesId));
		it("should set the series name", (): Chai.Assertion =>
			expect(String(episode.seriesName)).to.equal(seriesName));
		it("should set the program name", (): Chai.Assertion =>
			expect(String(episode.programName)).to.equal(programName));

		describe("default properties", (): void => {
			beforeEach(
				(): Episode =>
					(episode = new Episode(
						id,
						episodeName,
						status,
						statusDate,
						seriesId,
						undefined,
						undefined,
						undefined,
					)),
			);

			it("should clear the unverified flag if not specified", (): Chai.Assertion =>
				expect(episode.unverified).to.be.false);
			it("should clear the unscheduled flag if not specified", (): Chai.Assertion =>
				expect(episode.unscheduled).to.be.false);
			it("should default the sequence to zero if not specified", (): Chai.Assertion =>
				expect(episode.sequence).to.equal(0));
		});

		["statusDateDisplay", "statusWarning", "unverifiedDisplay"].forEach(
			(property: string): void => {
				it(`should make the ${property} property enumerable`, (): Chai.Assertion =>
					expect(
						Boolean(
							(
								Object.getOwnPropertyDescriptor(
									episode,
									property,
								) as PropertyDescriptor
							).enumerable,
						),
					).to.be.true);
			},
		);
	});

	describe("list", (): void => {
		let episodeList: Episode[];

		beforeEach(async (): Promise<void> => {
			path = `/series/${seriesId}/episodes`;
			API.get.withArgs(path).returns([
				{
					id,
					name: episodeName,
					status,
					status_date: statusDate,
					unverified,
					unscheduled,
					sequence,
					series_id: seriesId,
					series_name: seriesName,
					program_name: programName,
				},
			]);
			episodeList = await Episode.list(seriesId);
		});

		it("should attempt to get the list of episodes", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of episodes", (): Chai.Assertion =>
			expect(episodeList).to.deep.equal([episode]));

		afterEach((): void => API.get.reset());
	});

	describe("unscheduled", (): void => {
		let episodeList: Episode[];

		beforeEach(async (): Promise<void> => {
			path = "/unscheduled";
			API.get.withArgs(path).returns([
				{
					id,
					name: episodeName,
					status,
					status_date: statusDate,
					unverified,
					unscheduled,
					sequence,
					series_id: seriesId,
					series_name: seriesName,
					program_name: programName,
				},
			]);
			episodeList = await Episode.unscheduled();
		});

		it("should attempt to get the list of episodes", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the list of episodes", (): Chai.Assertion =>
			expect(episodeList).to.deep.equal([episode]));

		afterEach((): void => API.get.reset());
	});

	describe("find", (): void => {
		let foundEpisode: Episode;

		beforeEach(async (): Promise<void> => {
			path = `/episodes/${id}`;
			API.get.withArgs(path).returns({
				id,
				name: episodeName,
				status,
				status_date: statusDate,
				unverified,
				unscheduled,
				sequence,
				series_id: seriesId,
			});

			episode = new Episode(
				id,
				episodeName,
				status,
				statusDate,
				seriesId,
				unverified,
				unscheduled,
				sequence,
			);

			foundEpisode = await Episode.find(id);
		});

		it("should attempt to find the episode", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the episode", (): Chai.Assertion =>
			expect(foundEpisode).to.deep.equal(episode));

		afterEach((): void => API.get.reset());
	});

	describe("count", (): void => {
		let count: number;

		beforeEach(async (): Promise<void> => {
			path = "/episodes/count";
			API.get.withArgs(path).returns(1);
			count = await Episode.count();
		});

		it("should attempt to get the count of episodes", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the count of episodes", (): Chai.Assertion =>
			expect(count).to.equal(1));

		afterEach((): void => API.get.reset());
	});

	describe("countByStatus", (): void => {
		let count: number;

		beforeEach(async (): Promise<void> => {
			path = `/episodes/${status}/count`;
			API.get.withArgs(path).returns(1);
			count = await Episode.countByStatus(status);
		});

		it("should attempt to get the count of episodes", (): Chai.Assertion =>
			expect(API.get).to.have.been.calledWith(path));
		it("should return the count of episodes", (): Chai.Assertion =>
			expect(count).to.equal(1));

		afterEach((): void => API.get.reset());
	});

	describe("fromJson", (): void => {
		it("should construct an Episode object from the JSON", (): Chai.Assertion =>
			expect(
				Episode["fromJson"]({
					id,
					name: episodeName,
					status,
					status_date: statusDate,
					unverified,
					unscheduled,
					sequence,
					series_id: seriesId,
					series_name: seriesName,
					program_name: programName,
				}),
			).to.deep.equal(episode));
	});

	describe("save", (): void => {
		let episodeToSave: Omit<JsonEpisode, "id">;

		beforeEach(
			(): Omit<JsonEpisode, "id"> =>
				(episodeToSave = {
					name: episodeName,
					status,
					status_date: statusDate,
					unverified,
					unscheduled,
					sequence,
					series_id: seriesId,
				}),
		);

		describe("status date", (): void => {
			it("should clear the status date when watched", async (): Promise<void> => {
				episode.status = "watched";
				await episode.save();
				expect(episode.statusDate).to.equal("");
			});

			it("should not clear the status date when not watched", async (): Promise<void> => {
				await episode.save();
				expect(episode.statusDate).not.to.equal("");
			});
		});

		describe("insert", (): void => {
			beforeEach(async (): Promise<void> => {
				episode.id = null;
				path = `/series/${seriesId}/episodes`;
				API.create.withArgs(path).returns({ id: 1 });
				await episode.save();
			});

			it("should attempt to save the episode", (): Chai.Assertion =>
				expect(API.create).to.have.been.calledWith(path, episodeToSave));

			it("should set the episode id", (): Chai.Assertion =>
				expect(episode.id).to.equal(1));

			afterEach((): void => API.create.reset());
		});

		describe("update", (): void => {
			beforeEach(async (): Promise<void> => {
				path = `/episodes/${id}`;
				API.update.withArgs(path).returns(true);
				await episode.save();
			});

			it("should attempt to save the episode", (): Chai.Assertion =>
				expect(API.update).to.have.been.calledWith(path, episodeToSave));

			afterEach((): void => API.update.reset());
		});
	});

	describe("remove", (): void => {
		beforeEach((): string => (path = `/episodes/${id}`));

		describe("no ID", (): void => {
			it("should do nothing", async (): Promise<void> => {
				episode.id = null;
				await episode.remove();
				expect(API.destroy.withArgs(path)).to.not.have.been.called;
			});
			it("should not clear the episode name", (): Chai.Assertion =>
				expect(episode.episodeName).to.equal(episodeName));
		});

		describe("with ID", (): void => {
			beforeEach(async (): Promise<void> => episode.remove());

			it("should attempt to remove the episode", (): Chai.Assertion =>
				expect(API.destroy).to.have.been.calledWith(path));
			it("should clear the id", (): Chai.Assertion =>
				expect(episode.id).to.be.null);
			it("should clear the episode name", (): Chai.Assertion =>
				expect(episode.episodeName).to.equal(""));
		});

		afterEach((): void => API.destroy.reset());
	});

	describe("statusDateDisplay", (): void => {
		const statuses: EpisodeStatus[] = [
			"",
			"watched",
			"recorded",
			"expected",
			"missed",
		];

		statuses.forEach((episodeStatus: EpisodeStatus): void => {
			describe("" === episodeStatus ? "No status" : episodeStatus, (): void => {
				beforeEach((): EpisodeStatus => (episode.status = episodeStatus));

				describe("scheduled", (): void => {
					beforeEach((): boolean => (episode.unscheduled = false));

					describe("without a status date", (): void => {
						beforeEach((): string => (episode.statusDate = ""));
						it("should return an empty string", (): Chai.Assertion =>
							expect(episode.statusDateDisplay).to.equal(""));
					});

					describe("with a status date", (): void => {
						beforeEach((): string => (episode.statusDate = "2000-12-31"));

						if ("watched" === episodeStatus || "" === episodeStatus) {
							it("should return an empty string", (): Chai.Assertion =>
								expect(episode.statusDateDisplay).to.equal(""));
						} else {
							it("should return the status date formatted for display", (): Chai.Assertion =>
								expect(episode.statusDateDisplay).to.equal("Sun Dec 31 2000"));
						}
					});
				});

				describe("unscheduled", (): void => {
					beforeEach((): boolean => (episode.unscheduled = true));

					describe("without a status date", (): void => {
						beforeEach((): string => (episode.statusDate = ""));
						it("should return an empty string", (): Chai.Assertion =>
							expect(episode.statusDateDisplay).to.equal(""));
					});

					describe("with a status date", (): void => {
						beforeEach((): string => (episode.statusDate = "2000-12-31"));
						it("should return the status date formatted for display", (): Chai.Assertion =>
							expect(episode.statusDateDisplay).to.equal("Sun Dec 31 2000"));
					});
				});
			});
		});
	});

	describe("statusWarning", (): void => {
		let clock: SinonFakeTimers;

		const statuses: EpisodeStatus[] = ["recorded", "expected"];

		statuses.forEach((episodeStatus: EpisodeStatus): void => {
			describe(`${episodeStatus} episode without a status date`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.statusDate = "";
				});

				it("should return an empty string", (): Chai.Assertion =>
					expect(episode.statusWarning).to.equal(""));
			});

			describe(`${episodeStatus} episode with a status date in the future`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.statusDate = "2000-12-31";
					clock = sinon.useFakeTimers(new Date("2000-12-30").valueOf());
				});

				it("should return an empty string", (): Chai.Assertion =>
					expect(episode.statusWarning).to.equal(""));

				afterEach((): void => clock.restore());
			});

			describe(`${episodeStatus} episode with a status date in the past`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.statusDate = "2000-12-31";
					clock = sinon.useFakeTimers(new Date("2001-01-01").valueOf());
				});

				if ("expected" === episodeStatus) {
					it("should return the CSS warning class", (): Chai.Assertion =>
						expect(episode.statusWarning).to.equal("warning"));
				} else {
					it("should return an empty string", (): Chai.Assertion =>
						expect(episode.statusWarning).to.equal(""));
				}

				afterEach((): void => clock.restore());
			});
		});
	});

	describe("unverifiedDisplay", (): void => {
		const statuses: EpisodeStatus[] = ["watched", "recorded"];

		statuses.forEach((episodeStatus: EpisodeStatus): void => {
			describe(`${episodeStatus} episode that is unverified`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.unverified = true;
				});

				if ("watched" === episodeStatus) {
					it("should return an empty string", (): Chai.Assertion =>
						expect(episode.unverifiedDisplay).to.equal(""));
				} else {
					it("should return the CSS unverified class", (): Chai.Assertion =>
						expect(episode.unverifiedDisplay).to.equal("Unverified"));
				}
			});

			describe(`${episodeStatus} episode that is not unverified`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.unverified = false;
				});

				it("should return an empty string", (): Chai.Assertion =>
					expect(episode.unverifiedDisplay).to.equal(""));
			});
		});
	});
});
