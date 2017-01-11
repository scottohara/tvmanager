import CacheController from "../../../src/controllers/cache-controller";
import window from "components/window";

describe("CacheController", () => {
	let cacheController,
			callback;

	beforeEach(() => {
		window.appCacheSupported = true;
		window.appCache.swapCache.reset();
		window.appCache.addEventListener.reset();
		window.appCache.update.reset();
		callback = sinon.stub();
		cacheController = new CacheController(callback);
	});

	describe("object constructor", () => {
		it("should set the callback", () => cacheController.callback.should.equal(callback));

		describe("without application cache", () => {
			it("should return a CacheController instance", () => {
				window.appCacheSupported = false;
				window.appCache.addEventListener.reset();
				cacheController = new CacheController();
				cacheController.should.be.an.instanceOf(CacheController);
				window.appCache.addEventListener.should.not.have.been.called;
			});
		});

		describe("with application cache", () => {
			it("should return a CacheController instance", () => cacheController.should.be.an.instanceOf(CacheController));
			it("should attach a downloading event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("downloading", sinon.match.func, false));
			it("should attach a progress event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("progress", sinon.match.func, false));
			it("should attach a cached event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("cached", sinon.match.func, false));
			it("should attach an updateready event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("updateready", sinon.match.func, false));
			it("should attach an error event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("error", sinon.match.func));
			it("should attach a noupdate event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("noupdate", sinon.match.func));
		});
	});

	describe("NOTICE_ID", () => {
		it("should return the notice id", () => cacheController.NOTICE_ID.should.equal("appCacheUpdateNotice"));
	});

	describe("cacheStatusValues", () => {
		it("should return an array of status values", () => cacheController.cacheStatusValues.should.be.an("array"));
	});

	describe("downloading", () => {
		it("should invoke the callback", () => {
			cacheController.downloading();
			cacheController.callback.should.have.been.calledWith(true, "Updating application to the latest version...<br/>Please wait.", cacheController.NOTICE_ID);
		});
	});

	describe("progress", () => {
		it("should invoke the callback", () => {
			cacheController.progress({loaded: 1, total: 2});
			cacheController.callback.should.have.been.calledWith(true, "Updating application to the latest version...<br/>Downloaded 1/2", cacheController.NOTICE_ID);
		});
	});

	describe("cached", () => {
		it("should invoke the callback", () => {
			cacheController.cached();
			cacheController.callback.should.have.been.calledWith(true, "Application has been updated to the latest version. Please restart the application.", cacheController.NOTICE_ID);
		});
	});

	describe("updateReady", () => {
		describe("idle", () => {
			beforeEach(() => {
				window.applicationCache.status = 1;
				cacheController.updateReady();
			});

			it("should not swap the cache", () => window.applicationCache.swapCache.should.not.have.been.called);
			it("should not invoke the callback", () => cacheController.callback.should.not.have.been.called);
		});

		describe("not idle", () => {
			beforeEach(() => {
				window.applicationCache.status = 0;
				cacheController.updateReady();
			});

			it("should swap the cache", () => window.applicationCache.swapCache.should.have.been.called);
			it("should invoke the callback", () => cacheController.callback.should.have.been.calledWith(true, "Application has been updated to the latest version. Please restart the application.", cacheController.NOTICE_ID));
		});
	});

	describe("error", () => {
		describe("not online", () => {
			it("should not invoke the callback", () => {
				window.navigator.onLine = false;
				cacheController.error();
				cacheController.callback.should.not.have.been.called;
			});
		});

		describe("online", () => {
			beforeEach(() => (window.navigator.onLine = true));

			describe("don't notify on error", () => {
				it("should invoke the callback and not notify the user", () => {
					cacheController.notifyOnError = false;
					cacheController.error();
					cacheController.callback.should.have.been.calledWith(false, "Error reading application cache manifest (status: uncached)");
				});
			});

			describe("notify on error", () => {
				it("should invoke the callback and notify the user", () => {
					cacheController.notifyOnError = true;
					cacheController.error();
					cacheController.callback.should.have.been.calledWith(true, "Error reading application cache manifest (status: uncached)");
				});
			});
		});
	});

	describe("noUpdate", () => {
		describe("don't notify on error", () => {
			it("should invoke the callback and not notify the user", () => {
				cacheController.notifyOnError = false;
				cacheController.noUpdate();
				cacheController.callback.should.have.been.calledWith(false, "You are currently running the latest version. No updates are available at this time.");
			});
		});

		describe("notify on error", () => {
			it("should invoke the callback and notify the user", () => {
				cacheController.notifyOnError = true;
				cacheController.noUpdate();
				cacheController.callback.should.have.been.calledWith(true, "You are currently running the latest version. No updates are available at this time.");
			});
		});
	});

	describe("update", () => {
		describe("without application cache", () => {
			beforeEach(() => (window.appCacheSupported = false));

			describe("don't notify on error", () => {
				beforeEach(() => cacheController.update(false));

				it("should set the notify on error flag", () => cacheController.notifyOnError.should.be.false);
				it("should not update the cache", () => window.appCache.update.should.not.have.been.called);
				it("should invoke the passed callback and not notify the user", () => cacheController.callback.should.have.been.calledWith(false, "This browser does not support application caching."));
			});

			describe("notify on error", () => {
				beforeEach(() => cacheController.update(true));

				it("should set the notify on error flag", () => cacheController.notifyOnError.should.be.true);
				it("should not update the cache", () => window.appCache.update.should.not.have.been.called);
				it("should invoke the passed callback and notify the user", () => cacheController.callback.should.have.been.calledWith(true, "This browser does not support application caching."));
			});
		});

		describe("with application cache", () => {
			describe("cache not idle", () => {
				beforeEach(() => {
					window.applicationCache.status = 2;
					cacheController.update(true);
				});

				it("should set the notify on error flag", () => cacheController.notifyOnError.should.be.true);
				it("should not update the cache", () => window.appCache.update.should.not.have.been.called);
				it("should not invoke the passed callback", () => cacheController.callback.should.not.have.been.called);
			});

			describe("cache idle", () => {
				beforeEach(() => {
					window.applicationCache.status = 1;
					cacheController.update(true);
				});

				it("should set the notify on error flag", () => cacheController.notifyOnError.should.be.true);
				it("should update the cache", () => window.appCache.update.should.have.been.called);
				it("should not invoke the passed callback", () => cacheController.callback.should.not.have.been.called);
			});
		});
	});
});