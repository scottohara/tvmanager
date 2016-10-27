/**
 * @file (Controllers) ReportController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		"components/list",
		"controllers/application-controller",
		"framework/jquery"
	],

	/**
	 * @exports controllers/report-controller
	 */
	(List, ApplicationController, $) => {
		"use strict";

		// Get a reference to the application controller singleton
		const appController = new ApplicationController();

		/**
		 * @class Report
		 * @classdesc Anonymous object containing the properties of a report
		 * @private
		 * @property {String} reportName - the name of the report
		 * @property {Function} dataSource - the function that returns data for the report
		 * @property {Object} args - arguments to pass to the data source function
		 */

		/**
		 * @class ReportController
		 * @classdesc Controller for the report view
		 * @property {HeaderFooter} header - the view header bar
		 * @property {Report} report - the report to display
		 * @property {List} reportList - the list of series to display
		 * @property {HeaderFooter} footer - the view footer bar
		 */
		class ReportController {
			/**
			 * @constructor ReportController
			 * @this ReportController
			 * @param {Report} report - the report to display
			 */
			constructor(report) {
				this.report = report;
			}

			/**
			 * @memberof ReportController
			 * @this ReportController
			 * @instance
			 * @method setup
			 * @desc Initialises the controller
			 */
			setup() {
				// Setup the header
				this.header = {
					label: this.report.reportName,
					leftButton: {
						eventHandler: this.goBack,
						style: "backButton",
						label: "Settings"
					}
				};

				// Instantiate a List object
				this.reportList = new List("list", "views/reportListTemplate.html", null, [], this.viewItem.bind(this));

				// Activate the controller
				this.activate();
			}

			/**
			 * @memberof ReportController
			 * @this ReportController
			 * @instance
			 * @method activate
			 * @desc Activates the controller
			 */
			activate() {
				// Get the data for the report
				this.report.dataSource(this.listRetrieved.bind(this), this.report.args);
			}

			/**
			 * @memberof ReportController
			 * @this ReportController
			 * @instance
			 * @method listRetrieved
			 * @desc Callback function after the list of report data is retrieved
			 * @param {Array<Series>} reportList - array of series objects
			 */
			listRetrieved(reportList) {
				// Set the list items
				this.reportList.items = reportList;

				// Refresh the list
				this.reportList.refresh();

				// Set to view mode
				this.viewItems();
			}

			/**
			 * @memberof ReportController
			 * @this ReportController
			 * @instance
			 * @method goBack
			 * @desc Pops the view off the stack
			 */
			goBack() {
				appController.popView();
			}

			/**
			 * @memberof ReportController
			 * @this ReportController
			 * @instance
			 * @method viewItem
			 * @desc Displays the Episodes view for a series
			 * @param {Number} itemIndex - the list index of the series to view
			 */
			viewItem(itemIndex) {
				appController.pushView("episodes", {source: "Report", listIndex: itemIndex, series: this.reportList.items[itemIndex]});
			}

			/**
			 * @memberof ReportController
			 * @this ReportController
			 * @instance
			 * @method viewItems
			 * @desc Sets the list to view mode
			 */
			viewItems() {
				// Set the list to view mode
				this.reportList.setAction("view");

				// Clear the view footer
				appController.clearFooter();

				// Show the view icons next to each list item
				$("#list").removeClass();

				// Setup the footer
				this.footer = {
					label: `v${appController.db.version}`
				};

				// Set the view footer
				appController.setFooter();
			}
		}

		return ReportController;
	}
);
