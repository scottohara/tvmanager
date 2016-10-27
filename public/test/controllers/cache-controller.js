define(
	[
		"controllers/cache-controller",
		"test/mocks/window-mock"
	],

	(CacheController, window) => {
		"use strict";

		describe("CacheController", () => {
			let cacheController;

			beforeEach(() => {
				window.appCacheSupported = true;
				window.appCache.swapCache.reset();
				window.appCache.addEventListener.reset();
				window.appCache.update.reset();
				cacheController = new CacheController();
				cacheController.callback = sinon.stub();
			});

			describe("object constructor", () => {
				describe("without application cache", () => {
					it("should return a CacheController instance", () => {
						window.appCacheSupported = false;
						window.appCache.addEventListener.reset();
						this.cacheController = new CacheController();
						cacheController.should.be.an.instanceOf(CacheController);
						window.appCache.addEventListener.should.not.have.been.called;
					});
				});

				describe("with application cache", () => {
					it("should return a CacheController instance", () => cacheController.should.be.an.instanceOf(CacheController));
					it("should attach a downloading event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("downloading", sinon.match.func, false));
					it("should attach a progress event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("progress", sinon.match.func, false));
					it("should attach an updateready event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("updateready", sinon.match.func, false));
					it("should attach an error event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("error", sinon.match.func));
					it("should attach a noupdate event handler", () => window.applicationCache.addEventListener.should.have.been.calledWith("noupdate", sinon.match.func));
				});
			});

			describe("NOTICE_ID", () => {
				it("should return the notice id", () => cacheController.NOTICE_ID.should.equal("appCacheUpdateNotice"));
			});

			describe("cacheStatusValues", () => {
				it("should return an array of status values", () => cacheController.cacheStatusValues.should.be.an.Array);
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
					it("should invoke the callback", () => {
						window.navigator.onLine = true;
						cacheController.error();
						cacheController.callback.should.have.been.calledWith(false, "Error reading application cache manifest (status: uncached)");
					});
				});
			});

			describe("noUpdate", () => {
				describe("without callback", () => {
					it("should do nothing", () => {
						const callback = cacheController.callback;

						cacheController.callback = null;
						cacheController.noUpdate();
						callback.should.not.have.been.called;
					});
				});

				describe("with callback", () => {
					it("should invoke the callback", () => {
						cacheController.noUpdate();
						cacheController.callback.should.have.been.calledWith(false, "You are currently running the latest version. No updates are available at this time.");
					});
				});
			});

			describe("update", () => {
				let callback;

				beforeEach(() => (callback = sinon.stub()));

				describe("without application cache", () => {
					it("should invoke the passed callback", () => {
						window.appCacheSupported = false;
						cacheController.update(callback);
						callback.should.have.been.calledWith(false, "This browser does not support application caching.");
					});
				});

				describe("with application cache", () => {
					beforeEach(() => cacheController.update(callback));

					it("should set the callback", () => cacheController.callback.should.equal(callback));
					it("should update the cache", () => window.applicationCache.update.should.have.been.called);
				});
			});
		});
	}
);