DatabaseControllerMock = function(databaseName, callback, errorCallback) {
	callback({initial: "1.1", current: "1.1"});
	return { version: "1.1" };
}

DatabaseControllerMockFail = function(databaseName, callback, errorCallback) {
	errorCallback({message: "Error"});
	return {};
}

DatabaseControllerMockUpgrade = function(databaseName, callback, errorCallback) {
	callback({initial: "1.0", current: "1.1"});
	return { version: "1.1" };
}