DatabaseControllerMock = function(databaseName, callback, errorCallback) {
	"use strict";

	callback({initial: "1.1", current: "1.1"});
	return { version: "1.1" };
};

DatabaseControllerMockNotModified = function(databaseName, callback, errorCallback) {
	"use strict";

	$.get = jQueryMock.originalGet;
	equals(databaseName, "TVManager", "databaseName property");
	start();
};

DatabaseControllerMockFail = function(databaseName, callback, errorCallback) {
	"use strict";

	errorCallback({message: "Error"});
	return {};
};

DatabaseControllerMockUpgrade = function(databaseName, callback, errorCallback) {
	"use strict";

	callback({initial: "1.0", current: "1.1"});
	return { version: "1.1" };
};
