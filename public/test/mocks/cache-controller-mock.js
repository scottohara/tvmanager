define(
	() => {
		"use strict";

		class CacheControllerMock {
			constructor() {
				this.update = sinon.stub().yields();
			}
		}

		return CacheControllerMock;
	}
);
