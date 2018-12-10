/**
 * @file (Controllers) ApplicationController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

/**
 * @module controllers/application-controller
 * @requires jquery
 * @requires framework/abc
 * @requires controllers/about-controller
 * @requires controllers/dataSync-controller
 * @requires controllers/database-controller
 * @requires controllers/episode-controller
 * @requires controllers/episodes-controller
 * @requires controllers/program-controller
 * @requires controllers/programs-controller
 * @requires controllers/registration-controller
 * @requires controllers/report-controller
 * @requires controllers/schedule-controller
 * @requires controllers/series-controller
 * @requires controllers/seriesList-controller
 * @requires models/setting-model
 * @requires controllers/settings-controller
 * @requires framework/spinningwheel
 * @requires components/toucheventproxy
 * @requires controllers/unscheduled-controller
 */
import {
	Notice,
	NoticeStack,
	View,
	ViewControllerSet
} from "controllers";
import $ from "jquery";
import Abc from "framework/abc";
import AboutController from "controllers/about-controller";
import DataSyncController from "controllers/dataSync-controller";
import DatabaseService from "services/database-service";
import {DatabaseVersion} from "services";
import EpisodeController from "controllers/episode-controller";
import EpisodesController from "controllers/episodes-controller";
import ProgramController from "controllers/program-controller";
import ProgramsController from "controllers/programs-controller";
import {PublicInterface} from "global";
import RegistrationController from "controllers/registration-controller";
import ReportController from "controllers/report-controller";
import ScheduleController from "controllers/schedule-controller";
import SeriesController from "controllers/series-controller";
import SeriesListController from "controllers/seriesList-controller";
import Setting from "models/setting-model";
import SettingsController from "controllers/settings-controller";
import SpinningWheel from "framework/spinningwheel";
import TouchEventProxy from "components/toucheventproxy";
import UnscheduledController from "controllers/unscheduled-controller";
import window from "components/window";

declare const MAX_DATA_AGE_DAYS: number;

/**
 * @class ApplicationController
 * @classdesc Main application controller. Manages the view stack, headers/footers, scroll positions, notices etc.
 * @this ApplicationController
 * @property {Array<View>} viewStack - an array of views currently loaded. Last item on the array is the view currently visible.
 * @property {NoticeStack} noticeStack - contains the array of notices displayed, and the total height of the notices
 * @property {abc} abc - scroll helper object
 * @property {TouchEventProxy} abctoucheventproxy - remaps touch events for the scroll helper
 * @property {Database} db - the database
 * @property {Number} maxDataAgeDays - the number of days since the last import/export before a warning notice is displayed
 * @property {Object} viewControllers - a hash of all view controller objects that can be pushed
 */
export default class ApplicationController {
	private static singletonInstance?: ApplicationController;

	public db!: Database;

	public viewStack: View[] = [];

	// Create a scroll helper and associate it with the content
	public readonly abc: Abc = new Abc($("#abc").get(0), $("#content"));

	// Scroll helper only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
	public readonly abctoucheventproxy: TouchEventProxy = new TouchEventProxy($("#abc").get(0));

	private noticeStack: NoticeStack = {
		height: 0,
		notice: []
	};

	private viewControllers!: ViewControllerSet;

	// Set the max data age days
	private readonly maxDataAgeDays: number = Number(MAX_DATA_AGE_DAYS);

	public constructor() {
		// App controller is a singleton, so if an instance already exists, return it
		if (ApplicationController.singletonInstance) {
			return ApplicationController.singletonInstance;
		}

		// No existing instance, so make this instance the singleton
		ApplicationController.singletonInstance = this;

		// Bind a handler for transition end events
		$("#contentWrapper").on("transitionend", this.contentShown);

		// Increase the default cell height of the SpinningWheel (44px default is incorrect)
		SpinningWheel.cellHeight = 45;

		return this;
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method start
	 * @desc Start the application
	 */
	public start(): void {
		// Connect to the database
		this.db = DatabaseService.connect("TVManager", (version: DatabaseVersion): void => {
			// If the version number changed, it means we ran a migration so we need the user to restart the application
			if (version.initial === version.current) {
				// Populate an object with all of the view controllers, so that they can be referenced later dynamically by name
				this.viewControllers = {
					about: AboutController,
					dataSync: DataSyncController,
					episode: EpisodeController,
					episodes: EpisodesController,
					program: ProgramController,
					programs: ProgramsController,
					registration: RegistrationController,
					report: ReportController,
					schedule: ScheduleController,
					series: SeriesController,
					seriesList: SeriesListController,
					settings: SettingsController,
					unscheduled: UnscheduledController
				};

				// Display the schedule view
				window.setTimeout((): void => this.pushView("schedule"), 0);
			} else {
				// Show a notice to the user asking them to restart
				this.showNotice({
					label: `Database has been successfully upgraded from version ${version.initial} to version ${version.current}. Please restart the application.`,
					leftButton: {
						style: "cautionButton",
						label: "OK"
					}
				});
			}
		}, (error: SQLError): void => {
			// An error occurred opening the database, so display a notice to the user
			this.showNotice({
				label: error.message,
				leftButton: {
					style: "cautionButton",
					label: "OK"
				}
			});
		});

		// If no errors occurred, get the application configuration settings
		if (this.db && this.db.version) {
			// Get the last sync time
			Setting.get("LastSyncTime", this.gotLastSyncTime.bind(this));
		}
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method popView
	 * @desc Pops the current view off the stack, revealing the previous view
	 * @param {Object} [args] - arguments to pass to the previous view controller
	 */
	public popView(args?: object): void {
		// Clear the header/footer
		this.clearFooter();
		this.clearHeader();

		// Pop the view off the stack
		this.viewStack.pop();

		// Display the previous view
		this.show(this.viewPopped.bind(this), args);
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method getScrollPosition
	 * @desc Saves the current scroll position of the active view
	 */
	public getScrollPosition(): void {
		this.currentView.scrollPos = Number($("#content").children(":first").scrollTop());
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method setScrollPosition
	 * @desc Restores the saved scroll position of the active view
	 */
	public setScrollPosition(): void {
		// If the scroll position is -1, set it to the bottom element
		if (-1 === this.currentView.scrollPos) {
			this.currentView.scrollPos = $("#content").children(":first").children(":last").position().top;
		}

		// Scroll to the saved position
		$("#content").children(":first").scrollTop(this.currentView.scrollPos);
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method setFooter
	 * @desc Displays the view footer (contents of the footer are set by the view controller)
	 */
	public setFooter(): void {
		// Only proceed if the view controller specified a footer
		if (this.currentView.controller.footer) {
			// If the view controller specified a left-hand button, set it up
			if (this.currentView.controller.footer.leftButton) {
				// Bind the event handler for the button
				if (this.currentView.controller.footer.leftButton.eventHandler) {
					$("#footerLeftButton").on("click", this.currentView.controller.footer.leftButton.eventHandler);
				}

				// Style the button
				$("#footerLeftButton")
					.removeClass()
					.addClass(`button footer left ${this.currentView.controller.footer.leftButton.style}`);

				// Set the button label
				$("#footerLeftButton").text(this.currentView.controller.footer.leftButton.label);

				// Show the button
				$("#footerLeftButton").show();
			}

			// If the view controller specified a footer label, set it up
			if (this.currentView.controller.footer.label) {
				$("#footerLabel").text(this.currentView.controller.footer.label);
			}

			// Show the footer label
			$("#footerLabel").show();

			// If the view controller specified a right-hand button, set it up
			if (this.currentView.controller.footer.rightButton) {
				// Bind the event handler for the button
				if (this.currentView.controller.footer.rightButton.eventHandler) {
					$("#footerRightButton").on("click", this.currentView.controller.footer.rightButton.eventHandler);
				}

				// Style the button
				$("#footerRightButton")
					.removeClass()
					.addClass(`button footer right ${this.currentView.controller.footer.rightButton.style}`);

				// Set the button label
				$("#footerRightButton").text(this.currentView.controller.footer.rightButton.label);

				// Show the button
				$("#footerRightButton").show();
			}

			// Update the content height to accommodate the footer
			this.setContentHeight();
		}
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method showScrollHelper
	 * @desc Displays the scroll helper
	 */
	public showScrollHelper(): void {
		$("#abc").show();
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method hideScrollHelper
	 * @desc Hides the scroll helper
	 */
	public hideScrollHelper(): void {
		$("#abc").hide();
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method pushView
	 * @desc Saves the current scroll position of the current view (if any), then pushes a new view onto the view stack and displays it
	 * @param {String} view - the name of the view to push
	 * @param {Object} [args] - arguments to pass to the view controller
	 */
	public pushView(view: string, args?: object): void {
		// If a current view is displayed, save the current scroll position and clear the existing header/footer
		if (this.viewStack.length > 0) {
			this.getScrollPosition();
			this.clearFooter();
			this.clearHeader();
		}

		// Push the view onto the stack and instantiate the controller with the specified arguments
		this.viewStack.push({
			controller: new this.viewControllers[view](args),
			scrollPos: 0
		});

		// Display the view
		this.show(this.viewPushed.bind(this));
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method showNotice
	 * @desc Pushes a notice onto the notice stack and displays it
	 * @param {Notice} notice - the notice to display
	 */
	public showNotice(notice: Notice): void {
		// Create a div for the new notice
		const noticeContainer: JQuery<HTMLElement> = $("<div>")
						.addClass("notice")
						.appendTo($("#notices")),
					noticeLeftButton: JQuery<HTMLElement> = $("<a>").appendTo(noticeContainer),
					noticeLabel: JQuery<HTMLElement> = $("<p>")
						.html(notice.label as string)
						.appendTo(noticeContainer),
					noticeRightButton: JQuery<HTMLElement> = $("<a>").appendTo(noticeContainer);

		// If the notice specified a left-hand button, set it up
		if (notice.leftButton) {
			// Bind the event handler for the button
			if (notice.leftButton.eventHandler) {
				noticeLeftButton.on("click", notice.leftButton.eventHandler);
			}

			// Also bind a function to hide the notice when the button is clicked
			noticeLeftButton.on("click", (): void => this.hideNotice(noticeContainer));

			// Style the button
			noticeLeftButton
				.removeClass()
				.addClass(`button left ${notice.leftButton.style}`);

			// Set the button label
			noticeLeftButton.text(notice.leftButton.label);
		}

		// If the notice specified an identifier, set it
		if (notice.id) {
			noticeLabel.attr("id", notice.id);
		}

		// If the notice specified a right-hand button, set it up
		if (notice.rightButton) {
			// Bind the event handler for the button
			if (notice.rightButton.eventHandler) {
				noticeRightButton.on("click", notice.rightButton.eventHandler);
			}

			// Style the button
			noticeRightButton
				.removeClass()
				.addClass(`button right ${notice.rightButton.style}`);

			// Set the button label
			noticeRightButton.text(notice.rightButton.label);
		}

		// If there are currently no notices displayed, position the notices container just off screen (at the bottom) and make it visible
		if (0 === this.noticeStack.notice.length) {
			$("#notices").css("top", `${window.innerHeight}px`);
			$("#notices").css("visibility", "visible");
		}

		// Update the height of the notices stack to accommodate the new notice
		this.noticeStack.height -= Number(noticeContainer.height());

		// Push the notice onto the stack
		this.noticeStack.notice.push(noticeContainer);

		// Slide up the notices container to reveal the notice
		$("#notices").animate({top: Number($(window).height()) + this.noticeStack.height}, this.noticesMoved.bind(this));
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method clearFooter
	 * @desc Clears and hides the view footer
	 */
	public clearFooter(): void {
		// Only proceed if the view controller specified a footer
		if (this.currentView.controller.footer) {
			// If the view controller specified a left-hand button, unbind the event handler
			if (this.currentView.controller.footer.leftButton) {
				$("#footerLeftButton").off("click", this.currentView.controller.footer.leftButton.eventHandler);
			}

			// If the view controller specified a right-hand button, unbind the event handler
			if (this.currentView.controller.footer.rightButton) {
				$("#footerRightButton").off("click", this.currentView.controller.footer.rightButton.eventHandler);
			}
		}

		// Hide the buttons and footer label
		$("#footerLeftButton").hide();
		$("#footerLabel").val("");
		$("#footerLabel").hide();
		$("#footerRightButton").hide();

		// Update the content height to reclaim the footer space
		this.setContentHeight();
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method currentView
	 * @returns {View} the current view on the top of the stack
	 */
	private get currentView(): View {
		return this.viewStack[this.viewStack.length - 1];
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method viewPushed
	 * @desc Sets up the view controller for the view just pushed, and sets the header
	 */
	private viewPushed(): void {
		const DELAY_MS = 1000;

		// Call the view controller's setup method
		this.currentView.controller.setup();

		// Set the header (based on the configuration set by the view controller)
		this.setHeader();

		// Tell the application controller that we've finished loading
		window.setTimeout(this.contentShown, DELAY_MS);
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method viewPopped
	 * @desc Activates the view that was revealed
	 * @param {Object} [args] - arguments to pass to the revealed view controller
	 */
	private viewPopped(args: object): void {
		const DELAY_MS = 1000;

		// Call the view controller's activate method
		if (this.currentView.controller.activate) {
			this.currentView.controller.activate(args);
		}

		// Set the header (based on the configuration set by the view controller)
		this.setHeader();

		// Tell the application controller that we've finished loading
		window.setTimeout(this.contentShown, DELAY_MS);
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method show
	 * @desc Loads the content for the current view
	 * @param {Function} onSuccess - function to call after loading the view contents
	 * @param {Object} [args] - arguments to pass to the view controller
	 */
	private show(onSuccess: (args?: object) => void, args?: object): void {
		// Hide the scroll helper
		this.hideScrollHelper();

		// Show the now loading indicator
		$("#nowLoading").addClass("loading");

		// Load the view template
		$("#content").html(this.currentView.controller.view);

		// Slide in the new view from the right
		$("#contentWrapper").addClass("loading");

		// Call the success function, passing through the arguments
		onSuccess(args);
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method contentShown
	 * @desc Toggles the now loading indicator
	 */
	private contentShown(): void {
		if ($("#contentWrapper").hasClass("loading")) {
			$("#contentWrapper").removeClass("loading");
			$("#contentWrapper").addClass("loaded");
			$("#nowLoading").removeClass("loading");
		} else if ($("#contentWrapper").hasClass("loaded")) {
			$("#contentWrapper").removeClass("loaded");
		}
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method setHeader
	 * @desc Displays the view header (contents of the header are set by the view controller)
	 */
	private setHeader(): void {
		// If the view controller specified a left-hand button, set it up
		if (this.currentView.controller.header.leftButton) {
			// Bind the event handler for the button
			if (this.currentView.controller.header.leftButton.eventHandler) {
				$("#headerLeftButton").on("click", this.currentView.controller.header.leftButton.eventHandler);
			}

			// Style the button
			$("#headerLeftButton")
				.removeClass()
				.addClass(`button header left ${this.currentView.controller.header.leftButton.style}`);

			// Set the button label
			$("#headerLeftButton").text(this.currentView.controller.header.leftButton.label);

			// Show the button
			$("#headerLeftButton").show();
		}

		// If the view controller specified a header, set up the header label
		if (this.currentView.controller.header.label) {
			// Set the header label
			$("#headerLabel").text(this.currentView.controller.header.label);

			// Show the header label
			$("#headerLabel").show();
		}

		// If the view controller specified a right-hand button, set it up
		if (this.currentView.controller.header.rightButton) {
			// Bind the event handler for the button
			if (this.currentView.controller.header.rightButton.eventHandler) {
				$("#headerRightButton").on("click", this.currentView.controller.header.rightButton.eventHandler);
			}

			// Style the button
			$("#headerRightButton")
				.removeClass()
				.addClass(`button header right ${this.currentView.controller.header.rightButton.style}`);

			// Set the button label
			$("#headerRightButton").text(this.currentView.controller.header.rightButton.label);

			// Show the button
			$("#headerRightButton").show();
		}

		// Update the content height to accommodate the header
		this.setContentHeight();
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method clearHeader
	 * @desc Clears and hides the view header
	 */
	private clearHeader(): void {
		// If the view controller specified a left-hand button, unbind the event handler
		if (this.currentView.controller.header.leftButton) {
			$("#headerLeftButton").off("click", this.currentView.controller.header.leftButton.eventHandler);
		}

		// If the view controller specified a right-hand button, unbind the event handler
		if (this.currentView.controller.header.rightButton) {
			$("#headerRightButton").off("click", this.currentView.controller.header.rightButton.eventHandler);
		}

		// Hide the buttons and header label
		$("#headerLeftButton").hide();
		$("#headerLabel").hide();
		$("#headerRightButton").hide();

		// Update the content height to reclaim the header space
		this.setContentHeight();
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method setContentHeight
	 * @desc Sets the height of the content area to the available height less any space required by the header/footer
	 */
	private setContentHeight(): void {
		$("#content").children(":first").outerHeight(window.innerHeight - Number($("#header").outerHeight()) - Number($("#footer").outerHeight()));
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method hideNotice
	 * @desc Marks a notice as acknowledged by the user, and hides it
	 * @param {Object} notice - HTML DOM element of the notice
	 */
	private hideNotice(notice: JQuery<HTMLElement>): void {
		// Update the height of the notices stack to reclaim the space for the notice
		this.noticeStack.height += Number(notice.height());

		// Mark the notice as acknowledged
		notice.data("acknowledged", true);

		// Slide down the notice element to hide the notice
		notice.animate({height: 0}, this.noticeHidden.bind(this));
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method noticeHidden
	 * @desc Repositions the notices container after a notice is hidden
	 */
	private noticeHidden(): void {
		// Slide down the notices container to the height of the notices stack
		$("#notices").animate({top: `-=${this.noticeStack.height}`}, this.noticesMoved.bind(this));
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method noticesMoved
	 * @desc Removes any acknowledged notices from the stack, and hides the notices container after the last notice is removed
	 */
	private noticesMoved(): void {
		// Iterate in reverse order over the notices in the stack
		for (let i: number = this.noticeStack.notice.length - 1; i >= 0; i--) {
			// Check if the notice has been acknowledged
			if (this.noticeStack.notice[i].data("acknowledged")) {
				// Remove the DOM element for the notice
				this.noticeStack.notice[i].remove();

				// Remove the notice from the stack
				this.noticeStack.notice.splice(i, 1);
			}
		}

		// If there are no more notices visible, hide the notices container
		if (0 === this.noticeStack.notice.length) {
			$("#notices").css("visibility", "hidden");
		}
	}

	/**
	 * @memberof ApplicationController
	 * @this ApplicationController
	 * @instance
	 * @method gotLastSyncTime
	 * @desc Calculates the time since the last import/export, and displays a notice if it was more than 7 days ago
	 * @param {Setting} lastSyncTime - a Setting object containing the last time an import/export was run
	 */
	private gotLastSyncTime(lastSyncTime: PublicInterface<Setting>): void {
		// Only proceed if we have a last sync time
		if (lastSyncTime.settingValue) {
			// Constants for the notification threshold, current date and last sync date
			const HOURS_IN_ONE_DAY = 24,
						MINUTES_IN_ONE_HOUR = 60,
						SECONDS_IN_ONE_MINUTE = 60,
						MILLISECONDS_IN_ONE_SECOND = 1000,
						MILLISECONDS_IN_ONE_DAY = MILLISECONDS_IN_ONE_SECOND * SECONDS_IN_ONE_MINUTE * MINUTES_IN_ONE_HOUR * HOURS_IN_ONE_DAY,
						now: Date = new Date(),
						lastSync: Date = new Date(lastSyncTime.settingValue);

			// Check if the last sync was more that the specified threshold
			if (Math.round(Math.abs(now.getTime() - lastSync.getTime()) / MILLISECONDS_IN_ONE_DAY) > this.maxDataAgeDays) {
				// Show a notice to the user
				this.showNotice({
					label: `The last data sync was over ${this.maxDataAgeDays} days ago`,
					leftButton: {
						style: "cautionButton",
						label: "OK"
					}
				});
			}
		}
	}
}