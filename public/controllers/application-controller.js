/**
 * @file (Controllers) ApplicationController
 * @author Scott O'Hara
 * @copyright 2010 Scott O'Hara, oharagroup.net
 * @license MIT
 */

define(
	[
		'require',
		'components/toucheventproxy',
		'controllers/cache-controller',
		'controllers/database-controller',
		'framework/sw/spinningwheel',
		'framework/abc/abc',
		'framework/jquery',
		'framework/jquery.iphoneui'
	],

	/**
	 * @exports controllers/application-controller
	 */
	function(require, TouchEventProxy, CacheController, DatabaseController, SpinningWheel, Abc, $) {
		"use strict";
	
		/**
		 * @class HeaderFooter
		 * @classdesc Anonymous object containing the properties of a view header/footer
		 * @private
		 * @property {String} label - the header/footer label
		 * @property {NavButton} [leftButton] - the button to display on the left-hand side
		 * @property {NavButton} [rightButton] - the button to display on the right-hand side
		 */

		/**
		 * @class View
		 * @classdesc Anonymous object containing the properties of a view
		 * @private
		 * @property {String} name - the name of the view
		 * @property {Object} controller - instance of the view controller
		 * @property {Number} scrollPos - the current scroll position for the view
		 */

		/**
		 * @class NoticeStack
		 * @classdesc Anonymous object containing the properties of the notices stack 
		 * @private
		 * @property {Number} height - the height of the notices stack
		 * @property {Array<Notice>} notice - the array of notices displayed
		 */

		/**
		 * @class Notice
		 * @classdesc Anonymous object containing the properties of a notice
		 * @private
		 * @property {String} id - unique notice identifier
		 * @property {String} label - the message to be displayed
		 * @property {NavButton} [leftButton] - the button to display on the left-hand side
		 * @property {NavButton} [rightButton] - the button to display on the right-hand side
		 */

		/**
		 * @class NavButton
		 * @classdesc Anonymous object containing the properties of a navigation button
		 * @private
		 * @property {String} style - the CSS class name to use for the button
		 * @property {String} label - the button label
		 */

		/**
		 * @class ApplicationController
		 * @classdesc Main application controller. Manages the view stack, headers/footers, scroll positions, notices etc.
		 * @property {Array<View>} viewStack - an array of views currently loaded. Last item on the array is the view currently visible.
		 * @property {NoticeStack} noticeStack - contains the array of notices displayed, and the total height of the notices
		 * @property {abc} abc - scroll helper object
		 * @property {TouchEventProxy} abctoucheventproxy - remaps touch events for the scroll helper
		 * @property {CacheController} cache - the application cache controller
		 * @property {DatabaseController} db - the database controller
		 * @property {String} appVersion - the application version number
		 * @property {Number} maxDataAgeDays - the number of days since the last import/export before a warning notice is displayed
		 * @property {Object} viewControllers - a hash of all view controller objects that can be pushed
		 * @this ApplicationController
		 * @constructor ApplicationController
		 */
		var ApplicationController = function () {
			// App controller is a singleton, so if an instance already exists, return it
			if (ApplicationController.prototype.singletonInstance) {
				return ApplicationController.prototype.singletonInstance;
			}

			// No existing instance, so make this instance the singleton
			ApplicationController.prototype.singletonInstance = this;

			this.viewStack = [];
			this.noticeStack = {
				height: 0,
				notice: []
			};

			// Bind a handler for transition end events
			$("#contentWrapper").bind('transitionend', this.contentShown);

			// Increase the default cell height of the SpinningWheel (44px default is incorrect)
			SpinningWheel.cellHeight = 45;

			// Create a scroll helper and associate it with the content
			this.abc = new Abc($("#abc").get(0), $("#content"));

			// Scroll helper only listens for touch events, so to make it work in desktop browsers we need to remap the mouse events
			this.abctoucheventproxy = new TouchEventProxy($("#abc").get(0));

			// Create the cache controller
			this.cache = new CacheController();

			// Run an initial update check
			this.cache.update($.proxy(function(updated, message, noticeId) {
				// If an update occurred...
				if (updated) {
					// We get notified as every file is downloaded, so if a notice is already visible just update the message 
					if ($("#" + noticeId).length > 0) {
						$("#" + noticeId).html(message);
					} else {
						// Otherwise, create a new notice
						this.showNotice({
							id: noticeId,
							label: message,
							leftButton: {
								style: "cautionButton",
								label: "OK"
							}
						});
					}
				}
			}, this));
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method start
		 * @desc Start the application
		 */
		ApplicationController.prototype.start = function() {
			// Load the database configuration settings
			$.get("/dbConfig", $.proxy(function(config, status, jqXHR) {
				// A 302 Not Modified returns undefined, so we need to get the config from the jqXHR object instead
				if (config === undefined) {
					config = $.parseJSON(jqXHR.responseText);
				}

				// Create the database controller
				this.db = new DatabaseController(config.databaseName,
					$.proxy(function(version) {
						// If the version number changed, it means we ran a migration so we need the user to restart the application
						if (version.initial !== version.current) {
							// Show a notice to the user asking them to restart
							this.showNotice({
								label: "Database has been successfully upgraded from version " + version.initial + " to version " + version.current + ". Please restart the application.",
								leftButton: {
									style: "cautionButton",
									label: "OK"
								}
							});
						} else {
							// Load all of the view controllers, and populate a hash so that they can be referenced later dynamically by name
							this.loadDependencies(
								[
									'controllers/about-controller',
									'controllers/dataSync-controller',
									'controllers/episode-controller',
									'controllers/episodes-controller',
									'controllers/program-controller',
									'controllers/programs-controller',
									'controllers/registration-controller',
									'controllers/report-controller',
									'controllers/schedule-controller',
									'controllers/series-controller',
									'controllers/seriesList-controller',
									'controllers/settings-controller',
									'controllers/unscheduled-controller'
								],
								
								$.proxy(function(AboutController, DataSyncController, EpisodeController, EpisodesController, ProgramController, ProgramsController, RegistrationController, ReportController, ScheduleController, SeriesController, SeriesListController, SettingsController, UnscheduledController) {
									this.viewControllers = {
										AboutController: AboutController,
										DataSyncController: DataSyncController,
										EpisodeController: EpisodeController,
										EpisodesController: EpisodesController,
										ProgramController: ProgramController,
										ProgramsController: ProgramsController,
										RegistrationController: RegistrationController,
										ReportController: ReportController,
										ScheduleController: ScheduleController,
										SeriesController: SeriesController,
										SeriesListController: SeriesListController,
										SettingsController: SettingsController,
										UnscheduledController: UnscheduledController
									};

									// Display the schedule view
									this.pushView("schedule");
								}, this)
							);
						}
					}, this),
					$.proxy(function(error) {
						// An error occurred opening the database, so display a notice to the user
						this.showNotice({
							label: error.message,
							leftButton: {
								style: "cautionButton",
								label: "OK"
							}
						});
					}, this)
				);

				// If no errors occurred, get the application configuration settings
				if (this.db.version) {
					$.get("/appConfig", $.proxy(this.gotAppConfig, this), "json");
				}
			}, this), "json");
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method loadDependencies
		 * @description Loads any dependent modules that couldn't be specified in this module's define due to circular dependencies
		 * @param {Array<String>} dependencies - the array of dependent modules to load
		 * @param {Function} callback - function to call after the dependencies are loaded
		 */
		ApplicationController.prototype.loadDependencies = function(dependencies, callback) {
			require(dependencies, callback);
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method gotAppConfig
		 * @desc Parses the application configuration settings and sets the application version
		 * @param {ApplicationConfig} config - the application configuration settings
		 * @param {String} status - the HTTP response code
		 * @param {Object} jqXHR - the jQuery jqXHR object
		 */
		ApplicationController.prototype.gotAppConfig = function(config, status, jqXHR) {
			// A 302 Not Modified returns undefined, so we need to get the config from the jqXHR object instead
			if (config === undefined) {
				config = $.parseJSON(jqXHR.responseText);
			}

			// Set the application version
			this.appVersion = config.appVersion;

			// Set the max data age days
			this.maxDataAgeDays = config.maxDataAgeDays;

			// Load the setting model if it's not already loaded
			this.loadDependencies(['models/setting-model'], $.proxy(function(Setting) {
				// Get the last sync time
				Setting.get("LastSyncTime", $.proxy(this.gotLastSyncTime, this));
			}, this));
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method pushView
		 * @desc Saves the current scroll position of the current view (if any), then pushes a new view onto the view stack and displays it
		 * @param {String} view - the name of the view to push
		 * @param {Object} [args] - arguments to pass to the view controller
		 */
		ApplicationController.prototype.pushView = function(view, args) {
			// If a current view is displayed, save the current scroll position and clear the existing header/footer
			if (this.viewStack.length > 0) {
				this.getScrollPosition();
				this.clearFooter();
				this.clearHeader();
			}

			// Push the view onto the stack and instantiate the controller with the specified arguments
			this.viewStack.push({
				name: view,
				controller: new this.viewControllers[view.charAt(0).toUpperCase() + view.substr(1) + "Controller"](args),
				scrollPos: 0
			});

			// Display the view
			this.show($.proxy(this.viewPushed, this));
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method viewPushed
		 * @desc Sets up the view controller for the view just pushed, and sets the header
		 */
		ApplicationController.prototype.viewPushed = function() {
			// Call the view controller's setup method
			this.viewStack[this.viewStack.length - 1].controller.setup();

			// Set the header (based on the configuration set by the view controller)
			this.setHeader();

			// Tell the application controller that we've finished loading
			window.setTimeout(this.contentShown, 1000);
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method popView
		 * @desc Pops the current view off the stack, revealing the previous view
		 * @param {Object} [args] - arguments to pass to the previous view controller
		 */
		ApplicationController.prototype.popView = function(args) {
			// Clear the header/footer
			this.clearFooter();
			this.clearHeader();

			// Pop the view off the stack
			this.viewStack.pop();

			// Display the previous view
			this.show($.proxy(this.viewPopped, this), args);
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method viewPopped
		 * @desc Activates the view that was revealed
		 * @param {Object} [args] - arguments to pass to the revealed view controller
		 */
		ApplicationController.prototype.viewPopped = function(args) {
			// Call the view controller's activate method
			this.viewStack[this.viewStack.length - 1].controller.activate(args);
			
			// Set the header (based on the configuration set by the view controller)
			this.setHeader();

			// Tell the application controller that we've finished loading
			window.setTimeout(this.contentShown, 1000);
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method show
		 * @desc Loads the content for the current view
		 * @param {Function} onSuccess - function to call after loading the view contents
		 * @param {Object} [args] - arguments to pass to the view controller
		 */
		ApplicationController.prototype.show = function(onSuccess, args) {
			// Hide the scroll helper
			this.hideScrollHelper();

			//TODO: Fixed conflict with webkit-transform and webkit-overflow-scrolling
			//$("#nowLoading").addClass("loading");
			
			// Load the view template 
			$("#content").load("views/" + this.viewStack[this.viewStack.length - 1].name + "-view.html", function(responseText, status, jqXHR) {
				// A 302 Not Modified returns undefined, so we need to get the template from the jqXHR object instead
				if (responseText === undefined) {
					$(this).html(jqXHR.responseText);
				}

				//TODO: Fixed conflict with webkit-transform and webkit-overflow-scrolling
				//$("#contentWrapper").addClass("loading");

				// Call the success function, passing through the arguments
				onSuccess(args);
			});
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method getScrollPosition
		 * @desc Saves the current scroll position of the active view
		 */
		ApplicationController.prototype.getScrollPosition = function() {
			this.viewStack[this.viewStack.length - 1].scrollPos = $("#content").children(":first").scrollTop();
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method setScrollPosition
		 * @desc Restores the saved scroll position of the active view
		 */
		ApplicationController.prototype.setScrollPosition = function() {
			// If the scroll position is -1, set it to the bottom element
			if (-1 === this.viewStack[this.viewStack.length - 1].scrollPos) {
				this.viewStack[this.viewStack.length - 1].scrollPos = $("#content").children(":first").children(":last").position().top;
			}

			// Scroll to the saved position
			$("#content").children(":first").scrollTop(this.viewStack[this.viewStack.length - 1].scrollPos);
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method contentShown
		 * @desc Toggles the now loading indicator
		 */
		ApplicationController.prototype.contentShown = function() {
			if ($("#contentWrapper").hasClass("loading")) {
				$("#contentWrapper").removeClass("loading");
				$("#contentWrapper").addClass("loaded");
				$("#nowLoading").removeClass("loading");
			} else if ($("#contentWrapper").hasClass("loaded")) {
				$("#contentWrapper").removeClass("loaded");
			}
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method setHeader
		 * @desc Displays the view header (contents of the header are set by the view controller)
		 */
		ApplicationController.prototype.setHeader = function() {
			// If the view controller specified a left-hand button, set it up
			if (this.viewStack[this.viewStack.length - 1].controller.header.leftButton) {
				// Bind the event handler for the button
				$("#headerLeftButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.header.leftButton.eventHandler);

				// Style the button
				$("#headerLeftButton")
					.removeClass()
					.addClass("button header left " + this.viewStack[this.viewStack.length - 1].controller.header.leftButton.style);

				// Set the button label
				$("#headerLeftButton").text(this.viewStack[this.viewStack.length - 1].controller.header.leftButton.label);

				// Show the button
				$("#headerLeftButton").show();
			}

			// If the view controller specified a header, set up the header label 
			if (this.viewStack[this.viewStack.length - 1].controller.header) {
				// Set the header label
				$("#headerLabel").text(this.viewStack[this.viewStack.length - 1].controller.header.label);

				// Show the header label
				$("#headerLabel").show();
			}

			// If the view controller specified a right-hand button, set it up
			if (this.viewStack[this.viewStack.length - 1].controller.header.rightButton) {
				// Bind the event handler for the button
				$("#headerRightButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.header.rightButton.eventHandler);
				
				// Style the button
				$("#headerRightButton")
					.removeClass()
					.addClass("button header right " + this.viewStack[this.viewStack.length - 1].controller.header.rightButton.style);

				// Set the button label
				$("#headerRightButton").text(this.viewStack[this.viewStack.length - 1].controller.header.rightButton.label);

				// Show the button
				$("#headerRightButton").show();
			}

			// Update the content height to accommodate the header
			this.setContentHeight();
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method clearHeader
		 * @desc Clears and hides the view header
		 */
		ApplicationController.prototype.clearHeader = function() {
			// If the view controller specified a left-hand button, unbind the event handler
			if (this.viewStack[this.viewStack.length - 1].controller.header.leftButton) {
				$("#headerLeftButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.header.leftButton.eventHandler);
			}

			// If the view controller specified a right-hand button, unbind the event handler
			if (this.viewStack[this.viewStack.length - 1].controller.header.rightButton) {
				$("#headerRightButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.header.rightButton.eventHandler);
			}

			// Hide the buttons and header label
			$("#headerLeftButton").hide();
			$("#headerLabel").hide();
			$("#headerRightButton").hide();

			// Update the content height to reclaim the header space
			this.setContentHeight();
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method setFooter
		 * @desc Displays the view footer (contents of the footer are set by the view controller)
		 */
		ApplicationController.prototype.setFooter = function() {
			// Only proceed if the view controller specified a footer
			if (this.viewStack[this.viewStack.length - 1].controller.footer) {
				// If the view controller specified a left-hand button, set it up
				if (this.viewStack[this.viewStack.length - 1].controller.footer.leftButton) {
					// Bind the event handler for the button
					$("#footerLeftButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.eventHandler);
					
					// Style the button
					$("#footerLeftButton")
						.removeClass()
						.addClass("button footer left " + this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.style);

					// Set the button label
					$("#footerLeftButton").text(this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.label);

					// Show the button
					$("#footerLeftButton").show();
				}

				// If the view controller specified a footer label, set it up
				if (this.viewStack[this.viewStack.length - 1].controller.footer.label) {
					$("#footerLabel").text(this.viewStack[this.viewStack.length - 1].controller.footer.label);
				}
				
				// Show the footer label
				$("#footerLabel").show();

				// If the view controller specified a right-hand button, set it up
				if (this.viewStack[this.viewStack.length - 1].controller.footer.rightButton) {
					// Bind the event handler for the button
					$("#footerRightButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.eventHandler);

					// Style the button
					$("#footerRightButton")
						.removeClass()
						.addClass("button footer right " + this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.style);

					// Set the button label
					$("#footerRightButton").text(this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.label);

					// Show the button
					$("#footerRightButton").show();
				}

				// Update the content height to accommodate the footer
				this.setContentHeight();
			}
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method clearFooter
		 * @desc Clears and hides the view footer
		 */
		ApplicationController.prototype.clearFooter = function() {
			// Only proceed if the view controller specified a footer
			if (this.viewStack[this.viewStack.length - 1].controller.footer) {
				// If the view controller specified a left-hand button, unbind the event handler
				if (this.viewStack[this.viewStack.length - 1].controller.footer.leftButton) {
					$("#footerLeftButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.eventHandler);
				}

				// If the view controller specified a right-hand button, unbind the event handler
				if (this.viewStack[this.viewStack.length - 1].controller.footer.rightButton) {
					$("#footerRightButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.eventHandler);
				}
			}

			// Hide the buttons and footer label
			$("#footerLeftButton").hide();
			$("#footerLabel").val("");
			$("#footerLabel").hide();
			$("#footerRightButton").hide();

			// Update the content height to reclaim the footer space
			this.setContentHeight();
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method setContentHeight
		 * @desc Sets the height of the content area to the available height less any space required by the header/footer
		 */
		ApplicationController.prototype.setContentHeight = function() {
			$("#content").children(":first").outerHeight(window.innerHeight - $("#header").outerHeight() - $("#footer").outerHeight());
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method showNotice
		 * @desc Pushes a notice onto the notice stack and displays it
		 * @param {Notice} notice - the notice to display
		 */
		ApplicationController.prototype.showNotice = function(notice) {
			// Create a div for the new notice
			var noticeContainer = $("<div>")
				.addClass("notice")
				.appendTo($("#notices"));

			// If the notice specified a left-hand button, set it up
			var noticeLeftButton = $("<a>").appendTo(noticeContainer);
			if (notice.leftButton) {
				// Bind the event handler for the button
				if (notice.leftButton.eventHandler) {
					noticeLeftButton.bind('click', notice.leftButton.eventHandler);
				}

				// Also bind a function to hide the notice when the button is clicked
				noticeLeftButton.bind('click', $.proxy(function(notice) { return $.proxy(function() { this.hideNotice(notice); }, this);}, this)(noticeContainer));

				// Style the button
				noticeLeftButton
					.removeClass()
					.addClass("button left " + notice.leftButton.style);

				// Set the button label
				noticeLeftButton.text(notice.leftButton.label);

				// Show the button
				noticeLeftButton.show();
			}

			// Set the notice label
			var noticeLabel = $("<p>")
				.html(notice.label)
				.appendTo(noticeContainer);

			// If the notice specified an identifier, set it
			if (notice.id) {
				noticeLabel.attr("id", notice.id);
			}

			// If the notice specified a right-hand button, set it up
			var noticeRightButton = $("<a>").appendTo(noticeContainer);
			if (notice.rightButton) {
				// Bind the event handler for the button
				if (notice.rightButton.eventHandler) {
					noticeRightButton.bind('click', notice.rightButton.eventHandler);
				}
				
				// Style the button
				noticeRightButton
					.removeClass()
					.addClass("button right " + notice.rightButton.style);

				// Set the button label
				noticeRightButton.text(notice.rightButton.label);

				// Show the button
				noticeRightButton.show();
			}

			// If there are currently no notices displayed, position the notices container just off screen (at the bottom) and make it visible
			if (0 === this.noticeStack.notice.length) {
				$("#notices").css('top', window.innerHeight + window.pageYOffset + 'px');
				$("#notices").css("visibility", "visible");
			}

			// Update the height of the notices stack to accommodate the new notice
			this.noticeStack.height -= noticeContainer.height();

			// Push the notice onto the stack
			this.noticeStack.notice.push(noticeContainer);

			// Slide up the notices container to reveal the notice
			$("#notices").animate({top: $(window).height() + this.noticeStack.height}, $.proxy(this.noticesMoved, this));
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method hideNotice
		 * @desc Marks a notice as acknowledged by the user, and hides it
		 * @param {Object} notice - HTML DOM element of the notice
		 */
		ApplicationController.prototype.hideNotice = function(notice) {
			// Update the height of the notices stack to reclaim the space for the notice
			this.noticeStack.height += notice.height();

			// Mark the notice as acknowledged
			notice.data("acknowledged", true);

			// Slide down the notice element to hide the notice
			notice.animate({height: 0}, $.proxy(this.noticeHidden, this));
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method noticeHidden
		 * @desc Repositions the notices container after a notice is hidden
		 * @param {Object} [event] - a browser event object
		 */
		ApplicationController.prototype.noticeHidden = function(event) {
			// Slide down the notices container to the height of the notices stack
			$("#notices").animate({top: "-=" + this.noticeStack.height}, $.proxy(this.noticesMoved, this));
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method noticesMoved
		 * @desc Removes any acknowledged notices from the stack, and hides the notices container after the last notice is removed
		 * @param {Object} [event] - a browser event object
		 */
		ApplicationController.prototype.noticesMoved = function(event) {
			// Iterate in reverse order over the notices in the stack
			for (var i = this.noticeStack.notice.length - 1; i >= 0; i--) {
				// Check if the notice has been acknowledged
				if (this.noticeStack.notice[i].data("acknowledged")) {
					// Remove the DOM element for the notice
					this.noticeStack.notice[i].remove();

					// Remove the notice from the stack
					this.noticeStack.notice.splice(i,1);
				}
			}

			// If there are no more notices visible, hide the notices container
			if (0 === this.noticeStack.notice.length) {
				$("#notices").css("visibility", "hidden");
			}
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method showScrollHelper
		 * @desc Displays the scroll helper
		 */
		ApplicationController.prototype.showScrollHelper = function() {
			$("#abc").show();
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method hideScrollHelper
		 * @desc Hides the scroll helper
		 */
		ApplicationController.prototype.hideScrollHelper = function() {
			$("#abc").hide();
		};

		/**
		 * @memberof ApplicationController
		 * @this ApplicationController
		 * @instance
		 * @method gotLastSyncTime
		 * @desc Calculates the time since the last import/export, and displays a notice if it was more than 7 days ago
		 * @param {Setting} lastSyncTime - a Setting object containing the last time an import/export was run
		 */
		ApplicationController.prototype.gotLastSyncTime = function(lastSyncTime) {
			// Only proceed if we have a last sync time
			if (lastSyncTime.settingValue) {
				// Constants for the notification threshold
				var MILLISECONDS_IN_ONE_DAY = 1000 * 60 * 60 * 24;

				// Get the current date and the last sync date
				var now = new Date();
				var lastSync = new Date(lastSyncTime.settingValue);

				// Check if the last sync was more that the specified threshold
				if (Math.round(Math.abs(now.getTime() - lastSync.getTime()) / MILLISECONDS_IN_ONE_DAY) > this.maxDataAgeDays) {
					// Show a notice to the user
					this.showNotice({
						label: "The last data sync was over " + this.maxDataAgeDays + " days ago",
						leftButton: {
							style: "cautionButton",
							label: "OK"
						}
					});
				}
			}
		};

		return ApplicationController;
	}
);
