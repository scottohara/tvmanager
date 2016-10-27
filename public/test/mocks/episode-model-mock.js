define(
	() => {
		"use strict";

		const saveStub = sinon.stub().yields(999),
					removeStub = sinon.stub(),
					listBySeriesStub = sinon.stub(),
					listByUnscheduledStub = sinon.stub(),
					findStub = sinon.stub(),
					totalCountStub = sinon.stub(),
					countByStatusStub = sinon.stub(),
					removeAllStub = sinon.stub(),
					fromJsonStub = sinon.stub();

		let episodes = [],
				removeAllOK;

		class EpisodeMock {
			constructor(id, episodeName, status, statusDate, unverified, unscheduled, sequence, seriesId) {
				this.id = id;
				this.episodeName = episodeName;
				this.status = status;
				this.statusDate = statusDate;
				this.unverified = unverified;
				this.unscheduled = unscheduled;
				this.sequence = sequence;
				this.seriesId = seriesId;
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

			static get episodes() {
				return episodes;
			}

			static set episodes(items) {
				episodes = items;
			}

			static get listBySeries() {
				return listBySeriesStub.yields(this.episodes);
			}

			static get listByUnscheduled() {
				return listByUnscheduledStub.yields([{}]);
			}

			static get find() {
				return findStub.yields(new EpisodeMock(findStub.args[0], "test-episode"));
			}

			static get totalCount() {
				return totalCountStub.yields(1);
			}

			static get countByStatus() {
				return countByStatusStub.withArgs("Watched").yields(1);
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
				return fromJsonStub.returns(new EpisodeMock());
			}
		}

		return EpisodeMock;
	}
);