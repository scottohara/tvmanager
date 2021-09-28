import type {
	EpisodeStatus,
	PersistedEpisode
} from "models";
import type {
	SinonFakeTimers,
	SinonStub
} from "sinon";
import DatabaseServiceMock from "mocks/database-service-mock";
import Episode from "../../../src/models/episode-model";
import sinon from "sinon";

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
			episode: Episode;

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
		episode = new Episode(id, episodeName, status, statusDate, seriesId, unverified, unscheduled, sequence, seriesName, programName);
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
			beforeEach((): Episode => (episode = new Episode(id, episodeName, status, statusDate, seriesId, undefined, undefined, undefined)));

			it("should clear the unverified flag if not specified", (): Chai.Assertion => episode.unverified.should.be.false);
			it("should clear the unscheduled flag if not specified", (): Chai.Assertion => episode.unscheduled.should.be.false);
			it("should default the sequence to zero if not specified", (): Chai.Assertion => episode.sequence.should.equal(0));
		});

		["statusDateDisplay", "statusWarning", "unverifiedDisplay"].forEach((property: string): void => {
			it(`should make the ${property} property enumerable`, (): Chai.Assertion => Boolean((Object.getOwnPropertyDescriptor(episode, property) as PropertyDescriptor).enumerable).should.be.true);
		});
	});

	describe("listBySeries", (): void => {
		let episodeList: Episode[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.listBySeries as SinonStub).throws();
				episodeList = await Episode.listBySeries(seriesId);
			});

			it("should attempt to get the list of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.listBySeries.should.have.been.calledWith(seriesId));
			it("should return an empty array", (): Chai.Assertion => episodeList.should.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.listBySeries as SinonStub).returns([{
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
				episodeList = await Episode.listBySeries(seriesId);
			});

			it("should attempt to get the list of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.listBySeries.should.have.been.calledWith(seriesId));
			it("should return the list of episodes", (): Chai.Assertion => episodeList.should.deep.equal([episode]));
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.listBySeries as SinonStub).reset());
	});

	describe("listByUnscheduled", (): void => {
		let episodeList: Episode[];

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.listByUnscheduled as SinonStub).throws();
				episodeList = await Episode.listByUnscheduled();
			});

			it("should attempt to get the list of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.listByUnscheduled.should.have.been.called);
			it("should return an empty array", (): Chai.Assertion => episodeList.should.deep.equal([]));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.listByUnscheduled as SinonStub).returns([{
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
				episodeList = await Episode.listByUnscheduled();
			});

			it("should attempt to get the list of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.listByUnscheduled.should.have.been.called);
			it("should return the list of episodes", (): Chai.Assertion => episodeList.should.deep.equal([episode]));
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.listByUnscheduled as SinonStub).reset());
	});

	describe("find", (): void => {
		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.find as SinonStub).throws();
				episode = await Episode.find(id);
			});

			it("should attempt to find the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.find.should.have.been.calledWith(id));
			it("should return a null episode id", (): Chai.Assertion => (null === episode.id).should.be.true);
		});

		describe("success", (): void => {
			describe("doesn't exist", (): void => {
				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).episodesStore.find as SinonStub).returns(undefined);
					episode = await Episode.find(id);
				});

				it("should attempt to find the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.find.should.have.been.calledWith(id));
				it("should return a null episode id", (): Chai.Assertion => (null === episode.id).should.be.true);
			});

			describe("exists", (): void => {
				let foundEpisode: Episode;

				beforeEach(async (): Promise<void> => {
					((await DatabaseServiceMock).episodesStore.find as SinonStub).returns({
						EpisodeID: id,
						Name: episodeName,
						Status: status,
						StatusDate: statusDate,
						Unverified: String(unverified),
						Unscheduled: String(unscheduled),
						Sequence: sequence,
						SeriesID: seriesId
					});

					episode = new Episode(id, episodeName, status, statusDate, seriesId, unverified, unscheduled, sequence);

					foundEpisode = await Episode.find(id);
				});

				it("should attempt to find the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.find.should.have.been.calledWith(id));
				it("should return the episode", (): Chai.Assertion => foundEpisode.should.deep.equal(episode));
			});
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.find as SinonStub).reset());
	});

	describe("totalCount", (): void => {
		let count: number;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.totalCount as SinonStub).throws();
				count = await Episode.totalCount();
			});

			it("should attempt to get the count of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.totalCount.should.have.been.called);
			it("should return zero", (): Chai.Assertion => count.should.equal(0));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.totalCount as SinonStub).returns(1);
				count = await Episode.totalCount();
			});

			it("should attempt to get the count of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.totalCount.should.have.been.called);
			it("should return the count of episodes", (): Chai.Assertion => count.should.equal(1));
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.totalCount as SinonStub).reset());
	});

	describe("countByStatus", (): void => {
		let count: number;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.countByStatus as SinonStub).throws();
				count = await Episode.countByStatus(status);
			});

			it("should attempt to get the count of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.countByStatus.should.have.been.calledWith(status));
			it("should return zero", (): Chai.Assertion => count.should.equal(0));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.countByStatus as SinonStub).returns(1);
				count = await Episode.countByStatus(status);
			});

			it("should attempt to get the count of episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.countByStatus.should.have.been.calledWith(status));
			it("should return the count of episodes", (): Chai.Assertion => count.should.equal(1));
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.countByStatus as SinonStub).reset());
	});

	describe("removeAll", (): void => {
		let errorMessage: string | undefined;

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.removeAll as SinonStub).throws(new Error("Force failed"));
				errorMessage = await Episode.removeAll();
			});

			it("should attempt to remove all episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.removeAll.should.have.been.called);
			it("should return an error message", (): Chai.Assertion => String(errorMessage).should.equal("Episode.removeAll: Force failed"));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<string | undefined> => (errorMessage = await Episode.removeAll()));

			it("should attempt to remove all episodes", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.removeAll.should.have.been.called);
			it("should not return an error message", (): Chai.Assertion => (undefined === errorMessage).should.be.true);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.removeAll as SinonStub).reset());
	});

	describe("fromJson", (): void => {
		it("should construct an Episode object from the JSON", (): Chai.Assertion => Episode.fromJson({ id, episodeName, seriesId, status, statusDate, unverified, unscheduled, sequence, type: "Episode" }).should.deep.equal(new Episode(id, episodeName, status, statusDate, seriesId, unverified, unscheduled, sequence)));
	});

	describe("save", (): void => {
		interface Scenario {
			description: string;
			useId: boolean;
			unverified: boolean;
			unscheduled: boolean;
		}

		const scenarios: Scenario[] = [
			{
				description: "update",
				useId: true,
				unverified: true,
				unscheduled: true
			},
			{
				description: "insert",
				useId: false,
				unverified: false,
				unscheduled: false
			}
		];

		scenarios.forEach((scenario: Scenario): void => {
			describe(scenario.description, (): void => {
				let episodeToSave: PersistedEpisode,
						episodeId: string | undefined;

				beforeEach((): void => {
					if (!scenario.useId) {
						episode.id = null;
					}

					episode.unverified = scenario.unverified;
					episode.unscheduled = scenario.unscheduled;

					episodeToSave = {
						EpisodeID: String(episode.id),
						Name: String(episode.episodeName),
						Status: episode.status,
						StatusDate: episode.statusDate,
						Unverified: episode.unverified ? "true" : "false",
						Unscheduled: episode.unscheduled ? "true" : "false",
						Sequence: episode.sequence,
						SeriesID: String(episode["seriesId"])
					};
				});

				describe("fail", (): void => {
					beforeEach(async (): Promise<void> => {
						((await DatabaseServiceMock).episodesStore.save as SinonStub).throws();
						episodeId = await episode.save();
					});

					it("should attempt to save the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.save.should.have.been.calledWith({
						...episodeToSave,
						EpisodeID: episode.id
					}));

					it("should not return the episode id", (): Chai.Assertion => (undefined === episodeId).should.be.true);
				});

				describe("success", (): void => {
					beforeEach(async (): Promise<string | undefined> => (episodeId = await episode.save()));

					it("should attempt to save the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.save.should.have.been.calledWith({
						...episodeToSave,
						EpisodeID: episode.id
					}));

					it("should return the episode id", (): Chai.Assertion => String(episodeId).should.equal(episode.id));
				});
			});
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.save as SinonStub).reset());
	});

	describe("remove", (): void => {
		describe("no ID", (): void => {
			it("should do nothing", async (): Promise<void> => {
				episode.id = null;
				await episode.remove();
				(await DatabaseServiceMock).episodesStore.remove.should.not.have.been.called;
			});
		});

		describe("fail", (): void => {
			beforeEach(async (): Promise<void> => {
				((await DatabaseServiceMock).episodesStore.remove as SinonStub).throws();
				try {
					await episode.remove();
				} catch (_e: unknown) {
					// No op
				}
			});

			it("should attempt to remove the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.remove.should.have.been.calledWith(id));
			it("should not clear the id", (): Chai.Assertion => String(episode.id).should.equal(id));
			it("should not clear the episode name", (): Chai.Assertion => String(episode.episodeName).should.equal(episodeName));
			it("should not clear the series id", (): Chai.Assertion => String(episode["seriesId"]).should.equal(seriesId));
		});

		describe("success", (): void => {
			beforeEach(async (): Promise<void> => episode.remove());

			it("should attempt to remove the episode", async (): Promise<Chai.Assertion> => (await DatabaseServiceMock).episodesStore.remove.should.have.been.calledWith(id));
			it("should clear the id", (): Chai.Assertion => (null === episode.id).should.be.true);
			it("should clear the episode name", (): Chai.Assertion => (null === episode.episodeName).should.be.true);
			it("should clear the series id", (): Chai.Assertion => (null === episode["seriesId"]).should.be.true);
		});

		afterEach(async (): Promise<void> => ((await DatabaseServiceMock).episodesStore.remove as SinonStub).reset());
	});

	describe("toJson", (): void => {
		it("should return a JSON representation of the episode", (): Chai.Assertion => episode.toJson().should.deep.equal({ id, episodeName, seriesId, status, statusDate, unverified, unscheduled, sequence, type: "Episode" }));
	});

	describe("statusDateDisplay", (): void => {
		const statuses: EpisodeStatus[] = [
			"",
			"Watched",
			"Recorded",
			"Expected",
			"Missed"
		];

		statuses.forEach((episodeStatus: EpisodeStatus): void => {
			describe("" === episodeStatus ? "No status" : episodeStatus, (): void => {
				beforeEach((): EpisodeStatus => (episode.status = episodeStatus));

				describe("scheduled", (): void => {
					beforeEach((): boolean => (episode.unscheduled = false));

					describe("without a status date", (): void => {
						beforeEach((): string => (episode.statusDate = ""));
						it("should return an empty string", (): Chai.Assertion => episode.statusDateDisplay.should.equal(""));
					});

					describe("with a status date", (): void => {
						beforeEach((): string => (episode.statusDate = "2000-12-31"));

						if ("Watched" === episodeStatus || "" === episodeStatus) {
							it("should return an empty string", (): Chai.Assertion => episode.statusDateDisplay.should.equal(""));
						} else {
							it("should return the status date formatted for display", (): Chai.Assertion => episode.statusDateDisplay.should.equal("Sun Dec 31 2000"));
						}
					});
				});

				describe("unscheduled", (): void => {
					beforeEach((): boolean => (episode.unscheduled = true));

					describe("without a status date", (): void => {
						beforeEach((): string => (episode.statusDate = ""));
						it("should return an empty string", (): Chai.Assertion => episode.statusDateDisplay.should.equal(""));
					});

					describe("with a status date", (): void => {
						beforeEach((): string => (episode.statusDate = "2000-12-31"));
						it("should return the status date formatted for display", (): Chai.Assertion => episode.statusDateDisplay.should.equal("Sun Dec 31 2000"));
					});
				});
			});
		});
	});

	describe("statusWarning", (): void => {
		let clock: SinonFakeTimers;

		const statuses: EpisodeStatus[] = [
			"Recorded",
			"Expected"
		];

		statuses.forEach((episodeStatus: EpisodeStatus): void => {
			describe(`${episodeStatus} episode without a status date`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.statusDate = "";
				});

				it("should return an empty string", (): Chai.Assertion => episode.statusWarning.should.equal(""));
			});

			describe(`${episodeStatus} episode with a status date in the future`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.statusDate = "2000-12-31";
					clock = sinon.useFakeTimers(new Date("2000-12-30").valueOf());
				});

				it("should return an empty string", (): Chai.Assertion => episode.statusWarning.should.equal(""));

				afterEach((): void => clock.restore());
			});

			describe(`${episodeStatus} episode with a status date in the past`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.statusDate = "2000-12-31";
					clock = sinon.useFakeTimers(new Date("2001-01-01").valueOf());
				});

				if ("Expected" === episodeStatus) {
					it("should return the CSS warning class", (): Chai.Assertion => episode.statusWarning.should.equal("warning"));
				} else {
					it("should return an empty string", (): Chai.Assertion => episode.statusWarning.should.equal(""));
				}

				afterEach((): void => clock.restore());
			});
		});
	});

	describe("unverifiedDisplay", (): void => {
		const statuses: EpisodeStatus[] = [
			"Watched",
			"Recorded"
		];

		statuses.forEach((episodeStatus: EpisodeStatus): void => {
			describe(`${episodeStatus} episode that is unverified`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.unverified = true;
				});

				if ("Watched" === episodeStatus) {
					it("should return an empty string", (): Chai.Assertion => episode.unverifiedDisplay.should.equal(""));
				} else {
					it("should return the CSS unverified class", (): Chai.Assertion => episode.unverifiedDisplay.should.equal("Unverified"));
				}
			});

			describe(`${episodeStatus} episode that is not unverified`, (): void => {
				beforeEach((): void => {
					episode.status = episodeStatus;
					episode.unverified = false;
				});

				it("should return an empty string", (): Chai.Assertion => episode.unverifiedDisplay.should.equal(""));
			});
		});
	});
});