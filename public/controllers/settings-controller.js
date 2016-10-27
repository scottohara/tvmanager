/**
 * @file (Controllers) SettingsController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"controllers/application-controller",
		"models/series-model",
		"framework/jquery"
	],

	/**
	 * @exports controllers/settings-controller
	 */
	(ApplicationController, Series, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class SettingsController
		 * @classdesc Controller for the settings view
		 * @property {HeaderFooter} header - the view header bar
		 */
		class SettingsController {
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
						eventHandler: this.goBack,
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
				$("#dataSyncRow").on("click", this.viewDataSync);
				$("#aboutRow").on("click", this.viewAbout);
				$("#recordedReportRow").on("click", this.viewRecordedReport);
				$("#expectedReportRow").on("click", this.viewExpectedReport);
				$("#missedReportRow").on("click", this.viewMissedReport);
				$("#incompleteReportRow").on("click", this.viewIncompleteReport);
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method goBack
			 * @desc Pop the view off the stack
			 */
			goBack() {
				appController.popView();
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method viewDataSync
			 * @desc Display the dataSync view
			 */
			viewDataSync() {
				appController.pushView("dataSync");
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method viewAbout
			 * @desc Display the about view
			 */
			viewAbout() {
				appController.pushView("about");
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method viewRecordedReport
			 * @desc Display the All Recorded report view
			 */
			viewRecordedReport() {
				appController.pushView("report", {reportName: "All Recorded", dataSource: Series.listByStatus.bind(Series), args: "Recorded"});
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method viewExpectedReport
			 * @desc Display the All Expected report view
			 */
			viewExpectedReport() {
				appController.pushView("report", {reportName: "All Expected", dataSource: Series.listByStatus.bind(Series), args: "Expected"});
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method viewMissedReport
			 * @desc Display the All Missed report view
			 */
			viewMissedReport() {
				appController.pushView("report", {reportName: "All Missed", dataSource: Series.listByStatus.bind(Series), args: "Missed"});
			}

			/**
			 * @memberof SettingsController
			 * @this SettingsController
			 * @instance
			 * @method viewIncompleteReport
			 * @desc Display the All Incomplete report view
			 */
			viewIncompleteReport() {
				appController.pushView("report", {reportName: "All Incomplete", dataSource: Series.listByIncomplete.bind(Series), args: null});
			}
		}

		return SettingsController;
	}
);
