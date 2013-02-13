define(
	function() {
		"use strict";

		var testHash = "test-hash";
		var hex_md5 = function(data) {
			return testHash;
		};

		hex_md5.setHash = function(hash) {
			testHash = hash;
		};

		return hex_md5;
	}
);
