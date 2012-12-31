/**
 * @file (Controllers) SettingsController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @class SettingsController
 * @classdesc Controller for the settings view
 * @property {HeaderFooter} header - the view header bar
 * @this SettingsController
 * @constructor
 */
var SettingsController = function () {
	"use strict";
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method setup
 * @desc Initialises the controller
 */
SettingsController.prototype.setup = function() {
	"use strict";

	// Setup the header
	this.header = {
		label: "Settings",
		leftButton: {
			eventHandler: this.goBack,
			style: "backButton",
			label: "Schedule"
		}
	};

	// Activate the controller
	this.activate();
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method activate
 * @desc Activates the controller
 */
SettingsController.prototype.activate = function() {
	"use strict";

	// Bind events for all of the buttons/controls
	$("#dataSyncRow").bind('click', this.viewDataSync);
	$("#aboutRow").bind('click', this.viewAbout);
	$("#recordedReportRow").bind('click', this.viewRecordedReport);
	$("#expectedReportRow").bind('click', this.viewExpectedReport);
	$("#missedReportRow").bind('click', this.viewMissedReport);
	$("#incompleteReportRow").bind('click', this.viewIncompleteReport);
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method goBack
 * @desc Pop the view off the stack
 */
SettingsController.prototype.goBack = function() {
	"use strict";

	appController.popView();
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method viewDataSync
 * @desc Display the dataSync view
 */
SettingsController.prototype.viewDataSync = function() {
	"use strict";

	appController.pushView("dataSync");
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method viewAbout
 * @desc Display the about view
 */
SettingsController.prototype.viewAbout = function() {
	"use strict";

	appController.pushView("about");
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method viewRecordedReport
 * @desc Display the All Recorded report view
 */
SettingsController.prototype.viewRecordedReport = function() {
	"use strict";

	appController.pushView("report", { reportName: "All Recorded", dataSource: Series.listByStatus, args: 'Recorded' });
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method viewExpectedReport
 * @desc Display the All Expected report view
 */
SettingsController.prototype.viewExpectedReport = function() {
	"use strict";

	appController.pushView("report", { reportName: "All Expected", dataSource: Series.listByStatus, args: 'Expected' });
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method viewMissedReport
 * @desc Display the All Missed report view
 */
SettingsController.prototype.viewMissedReport = function() {
	"use strict";

	appController.pushView("report", { reportName: "All Missed", dataSource: Series.listByStatus, args: 'Missed' });
};

/**
 * @memberof SettingsController
 * @this SettingsController
 * @instance
 * @method viewIncompleteReport
 * @desc Display the All Incomplete report view
 */
SettingsController.prototype.viewIncompleteReport = function() {
	"use strict";

	appController.pushView("report", { reportName: "All Incomplete", dataSource: Series.listByIncomplete, args: null });
};
