if (!phantom.injectJs('phantom-common.js')) {
	console.log("Initialization failed: couldn't inject phantom-common.js");
	phantom.exit();
}

// Used to prevent duplicate calls to the onReady handler
var processed = false;

// Main processing
var main = function() {
	waitFor(function(){
		// When the word "completed" is found in the test results; return true
		return page.evaluate(function(){
			var el = document.getElementById('browserIframe').contentDocument.getElementById('qunit-testresult');
			if (el && el.innerText.match('completed')) {
				return true;
			}
			return false;
		});
	}, function(){
		if (!processed) {
			processed = true;

			// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
			page.onConsoleMessage = function(msg) {
				console.log(msg);
			};

			var el, files, coverage;

			// Tests have finished running, so now click the summary tab.
			el = page.evaluate(function() {
				el = document.getElementById('summaryTab');
				return {
					"left": el.offsetLeft + el.offsetParent.offsetLeft,
					"top": el.offsetTop + el.offsetParent.offsetTop
				};
			});
			page.sendEvent('click', el.left, el.top);

			waitFor(function() {
				// When the summary total covered has a style attribute; return true
				return page.evaluate(function(){
					el = document.getElementById('summaryTotals').getElementsByClassName('covered')[0];
					if (el && el.getAttribute('style')) {
						return true;
					}
					return false;
				});
			}, function() {
				page.evaluate(function() {
					// Get the list of files tested
					el = document.getElementById("summaryTbody");
					files = el.getElementsByTagName("tr");
					for (var i = 0; i < files.length; i++) {
						el = files[i].getElementsByClassName("coverage")[0];
						el = el.getElementsByClassName("pct")[0];
						coverage = el.innerText;

						// Output the name of any files that don't have 100% coverage
						if ("100%" !== coverage) {
							el = files[i].getElementsByClassName("leftColumn")[0];
							el = el.getElementsByTagName("a")[0];
							console.log(el.innerText + ": " + coverage);
						}
					}
				});

				// Get the result totals
				coverage = page.evaluate(function(){
					try {
						el = document.getElementById('summaryTotals');
						el = el.getElementsByClassName('coverage')[0];
						el = el.getElementsByClassName('pct')[0];
						console.log("Total Coverage: " + el.innerText);
						return el.innerText;
					} catch (e) { }
					return 0;
				});
				phantom.exit("100%" !== coverage ? 1 : 0);
			}, 30000);
		}
	}, 30000);
};
