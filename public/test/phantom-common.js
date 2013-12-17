/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */

/*jshint unused:false */

var waitFor = function (testFx, onReady, timeOutMillis) {
	"use strict";

	var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timout is 3s
	start = new Date().getTime(),
	condition = false,
	interval = setInterval(function() {
		if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
			// If not time-out yet and condition not yet fulfilled
			condition = testFx();
		} else {
			if(!condition) {
				// If condition still not fulfilled (timeout but condition is 'false')
				console.log("'waitFor()' timeout");
				phantom.exit(1);
			} else {
				// Condition fulfilled (timeout and/or condition is 'true')
				onReady(); //< Do what it's supposed to do once the condition is fulfilled
				clearInterval(interval); //< Stop this interval
			}
		}
	}, 100); //< repeat check every 100ms
};

// Check arguments and print usage statement
var system = require("system");
if (system.args.length !== 2) {
	console.log("Usage: " + system.args[0] + " URL");
	phantom.exit();
}

var page = new WebPage();
// Retrieve the requested URL
page.open(system.args[1], function(status){
	"use strict";

	if (status !== "success") {
		// If we couldn't get the page, abort
		console.log("Unable to access network");
		phantom.exit();
	} else {
		main();
	}
});
