define(
	() => {
		"use strict";

		const saveStub = sinon.stub().yields(999),
					removeStub = sinon.stub(),
					listByProgramStub = sinon.stub(),
					listByNowShowingStub = sinon.stub(),
					findStub = sinon.stub(),
					countStub = sinon.stub(),
					removeAllStub = sinon.stub(),
					fromJsonStub = sinon.stub();

		let series = [],
				removeAllOK;

		class SeriesMock {
			constructor(id, seriesName, nowShowing, programId, programName, episodeCount, watchedCount, recordedCount, expectedCount, missedCount, statusWarningCount) {
				this.id = id;
				this.seriesName = seriesName;
				this.nowShowing = nowShowing;
				this.programId = programId;
				this.programName = programName;
				this.episodeCount = episodeCount;
				this.watchedCount = watchedCount;
				this.recordedCount = recordedCount;
				this.expectedCount = expectedCount;
				this.missedCount = missedCount;
				this.statusWarningCount = statusWarningCount;
				this.toJson = sinon.stub().returns({});

				saveStub.reset();
				removeStub.reset();
			}

			get save() {
				return saveStub;
			}

			get remove() {
				return removeStub;
			}

			static removeAllOK() {
				removeAllOK = true;
			}

			static removeAllFail() {
				removeAllOK = false;
			}

			static get series() {
				return series;
			}

			static set series(items) {
				series = items;
			}

			static get listByProgram() {
				return listByProgramStub.yields(this.series);
			}

			static get listByNowShowing() {
				return listByNowShowingStub.yields(this.series);
			}

			static get listByStatus() {
				return sinon.stub();
			}

			static get listByIncomplete() {
				return sinon.stub();
			}

			static get find() {
				return findStub.yields(new SeriesMock(findStub.args[0], "test-series"));
			}

			static get count() {
				return countStub.yields(1);
			}

			static get removeAll() {
				if (removeAllOK) {
					removeAllStub.yields();
				} else {
					removeAllStub.yields("Force failed");
				}

				return removeAllStub;
			}

			static get fromJson() {
				return fromJsonStub.returns(new SeriesMock());
			}

			static get NOW_SHOWING() {
				return {1: "Mondays"};
			}
		}

		return SeriesMock;
	}
);