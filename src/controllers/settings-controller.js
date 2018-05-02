/**
 * @file (Controllers) SettingsController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/settings-controller
 * @requires jquery
 * @requires models/series-model
 * @requires controllers/view-controller
 */
import $ from "jquery";
import Series from "models/series-model";
import SettingsView from "views/settings-view.html";
import ViewController from "controllers/view-controller";

/**
 * @class SettingsController
 * @classdesc Controller for the settings view
 * @extends ViewController
 * @property {HeaderFooter} header - the view header bar
 */
export default class SettingsController extends ViewController {
	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	get view() {
		return SettingsView;
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	setup() {
		// Setup the header
		this.header = {
			label: "Settings",
			leftButton: {
				eventHandler: this.goBack.bind(this),
				style: "backButton",
				label: "Schedule"
			}
		};

		// Activate the controller
		this.activate();
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 */
	activate() {
		// Bind events for all of the buttons/controls
		$("#dataSyncRow").on("click", this.viewDataSync.bind(this));
		$("#aboutRow").on("click", this.viewAbout.bind(this));
		$("#recordedReportRow").on("click", this.viewRecordedReport.bind(this));
		$("#expectedReportRow").on("click", this.viewExpectedReport.bind(this));
		$("#missedReportRow").on("click", this.viewMissedReport.bind(this));
		$("#incompleteReportRow").on("click", this.viewIncompleteReport.bind(this));
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method goBack
	 * @desc Pop the view off the stack
	 */
	goBack() {
		this.appController.popView();
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method viewDataSync
	 * @desc Display the dataSync view
	 */
	viewDataSync() {
		this.appController.pushView("dataSync");
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method viewAbout
	 * @desc Display the about view
	 */
	viewAbout() {
		this.appController.pushView("about");
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method viewRecordedReport
	 * @desc Display the All Recorded report view
	 */
	viewRecordedReport() {
		this.appController.pushView("report", {reportName: "All Recorded", dataSource: Series.listByStatus.bind(Series), args: "Recorded"});
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method viewExpectedReport
	 * @desc Display the All Expected report view
	 */
	viewExpectedReport() {
		this.appController.pushView("report", {reportName: "All Expected", dataSource: Series.listByStatus.bind(Series), args: "Expected"});
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method viewMissedReport
	 * @desc Display the All Missed report view
	 */
	viewMissedReport() {
		this.appController.pushView("report", {reportName: "All Missed", dataSource: Series.listByStatus.bind(Series), args: "Missed"});
	}

	/**
	 * @memberof SettingsController
	 * @this SettingsController
	 * @instance
	 * @method viewIncompleteReport
	 * @desc Display the All Incomplete report view
	 */
	viewIncompleteReport() {
		this.appController.pushView("report", {reportName: "All Incomplete", dataSource: Series.listByIncomplete.bind(Series), args: null});
	}
}