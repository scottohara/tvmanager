define(
	() => {
		"use strict";

		class CacheControllerMock {
			constructor(callback) {
				this.callback = callback;
				this.update = sinon.stub();
			}
		}

		return CacheControllerMock;
	}
);
