/**
 * @file (Controllers) ReportController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/report-controller
 * @requires jquery
 * @requires components/list
 * @requires controllers/view-controller
 */
import type {
	NavButtonEventHandler,
	Report
} from "controllers";
import $ from "jquery";
import DatabaseService from "services/database-service";
import List from "components/list";
import type { PublicInterface } from "global";
import ReportListTemplate from "views/reportListTemplate.html";
import ReportView from "views/report-view.html";
import type Series from "models/series-model";
import ViewController from "controllers/view-controller";

/**
 * @class ReportController
 * @classdesc Controller for the report view
 * @extends ViewController
 * @this ReportController
 * @property {HeaderFooter} header - the view header bar
 * @property {Report} report - the report to display
 * @property {List} reportList - the list of series to display
 * @property {HeaderFooter} footer - the view footer bar
 * @param {Report} report - the report to display
 */
export default class ReportController extends ViewController {
	private reportList!: PublicInterface<List>;

	public constructor(private readonly report: Report) {
		super();
	}

	/**
	 * @memberof ReportController
	 * @this ReportController
	 * @instance
	 * @property {String} view - the view template HTML
	 * @desc Returns the HTML for the controller's view
	 */
	public get view(): string {
		return ReportView;
	}

	/**
	 * @memberof ReportController
	 * @this ReportController
	 * @instance
	 * @method setup
	 * @desc Initialises the controller
	 */
	public async setup(): Promise<void> {
		// Setup the header
		this.header = {
			label: this.report.reportName,
			leftButton: {
				eventHandler: this.goBack.bind(this) as NavButtonEventHandler,
				style: "backButton",
				label: "Settings"
			}
		};

		// Instantiate a List object
		this.reportList = new List("list", ReportListTemplate, null, [], this.viewItem.bind(this));

		// Activate the controller
		return this.activate();
	}

	/**
	 * @memberof ReportController
	 * @this ReportController
	 * @instance
	 * @method activate
	 * @desc Activates the controller
	 */
	public override async activate(): Promise<void> {
		// Get the data for the report
		this.reportList.items = await this.report.dataSource(this.report.args);

		// Refresh the list
		this.reportList.refresh();

		// Set to view mode
		return this.viewItems();
	}

	/**
	 * @memberof ReportController
	 * @this ReportController
	 * @instance
	 * @method goBack
	 * @desc Pops the view off the stack
	 */
	private async goBack(): Promise<void> {
		return this.appController.popView();
	}

	/**
	 * @memberof ReportController
	 * @this ReportController
	 * @instance
	 * @method viewItem
	 * @desc Displays the Episodes view for a series
	 * @param {Number} listIndex - the list index of the series to view
	 */
	private async viewItem(listIndex: number): Promise<void> {
		return this.appController.pushView("episodes", { source: "Report", listIndex, series: this.reportList.items[listIndex] as PublicInterface<Series> });
	}

	/**
	 * @memberof ReportController
	 * @this ReportController
	 * @instance
	 * @method viewItems
	 * @desc Sets the list to view mode
	 */
	private async viewItems(): Promise<void> {
		// Set the list to view mode
		this.reportList.setAction("view");

		// Clear the view footer
		this.appController.clearFooter();

		// Show the view icons next to each list item
		$("#list").removeClass();

		// Setup the footer
		this.footer = {
			label: `v${(await DatabaseService).version}`
		};

		// Set the view footer
		this.appController.setFooter();
	}
}