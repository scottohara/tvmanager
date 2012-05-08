if (!phantom.injectJs('phantom-common.js')) {
	console.log("Initialization failed: couldn't inject phantom-common.js");
	phantom.exit();
}

// Main processing
var main = function() {
	waitFor(function(){
		// When the word "completed" is found in the test results; return true
		return page.evaluate(function(){
			var el = document.getElementById('qunit-testresult');
			if (el && el.innerText.match('completed')) {
				return true;
			}
			return false;
		});
	}, function(){
		// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
		page.onConsoleMessage = function(msg) {
			console.log(msg);
		};

		// Tests have finished running, so now check the results.
		page.evaluate(function() {
			// Get any tests that failed
			var failedTests = $("li.fail:has('.module-name')");
			var failedAssertNum = 0;
			for (var i = 0; i < failedTests.length; i++) {
				var failedTest = $(failedTests[i]);
				// Output the name of the module and the name of the test that failed
				var failedTestName = $(failedTest.find('.module-name')[0]).text() + ": " + $(failedTest.find('.test-name')[0]).text();
				console.log(Array(failedTestName.length + 1).join("="));
				console.log(failedTestName);
				console.log(Array(failedTestName.length + 1).join("-"));

				// Get the assertions that failed
				var assertFailures = failedTest.find("li.fail");
				for (var j = 0; j < assertFailures.length; j++) {
					failedAssertNum++;
					console.log(failedAssertNum + ") " + $(assertFailures[j]).text());
				}

				console.log(failedTest.html());

				// Blank line
				console.log("");
			}
		});

		// Get the result totals
		var failedNum = page.evaluate(function(){
			var el = document.getElementById('qunit-testresult');
			console.log(el.innerText);
			try {
				return el.getElementsByClassName('failed')[0].innerHTML;
			} catch (e) { }
			return 10000;
		});
		phantom.exit((parseInt(failedNum, 10) > 0) ? 1 : 0);
	}, 30000);
};
