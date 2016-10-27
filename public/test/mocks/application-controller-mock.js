define(
	[
		"test/mocks/database-mock",
		"test/mocks/cache-controller-mock"
	],

	(DatabaseMock, CacheControllerMock) => {
		"use strict";

		class ApplicationControllerMock {
			constructor() {
				// App controller is a singleton, so if an instance already exists, return it
				if (ApplicationControllerMock.prototype.singletonInstance) {
					return ApplicationControllerMock.prototype.singletonInstance;
				}

				// No existing instance, so make this instance the singleton
				ApplicationControllerMock.prototype.singletonInstance = this;

				this.db = new DatabaseMock();
				this.cache = new CacheControllerMock();
				this.notice = [];
				this.appVersion = "v1.0";

				this.pushView = sinon.stub();
				this.popView = sinon.stub();
				this.clearFooter = sinon.stub();
				this.setFooter = sinon.stub();
				this.getScrollPosition = sinon.stub();
				this.setScrollPosition = sinon.stub();
				this.showNotice = sinon.stub();
				this.showScrollHelper = sinon.stub();
				this.hideScrollHelper = sinon.stub();

				return this;
			}
		}

		return ApplicationControllerMock;
	}
);
