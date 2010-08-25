function ApplicationController() {
	this.viewStack = [];
	this.noticeStack = {
		height: 0,
		notice: []
	};

	$("#contentWrapper").bind('webkitTransitionEnd', this.contentShown);
	SpinningWheel.cellHeight = 45;

	window.setTimeout($.proxy(function() {
		$(document).bind("touchmove", function(e) {
			e.preventDefault();
		});

		this.initScroller();
		this.abc = new abc($("#abc").get(0), this.scroller);
		this.abctoucheventproxy = new TouchEventProxy($("#abc").get(0));
	}, this),	100);

	this.cache = new CacheController();
	this.cache.update($.proxy(function(updated, message, noticeId) {
		if (updated) {
			if ($("#" + noticeId)) {
				$("#" + noticeId).html = message;
			} else {
				this.showNotice({
					id: noticeId,
					label: message,
					leftButton: {
						style: "redButton",
						label: "OK"
					}
				});
			}
		}
	}, this));
}

ApplicationController.prototype.start = function() {
	$.get("config.json", $.proxy(function(config) {
		this.config = config;
		this.db = new DatabaseController(
			$.proxy(function(version) {
				if (version.initial != version.current) {
					this.showNotice({
						label: "Database has been successfully upgraded from version " + version.initial + " to version " + version.current + ". Please restart the application.",
						leftButton: {
							style: "redButton",
							label: "OK"
						}
					});
				} else {
					this.pushView("schedule");
				}
			}, this),
			$.proxy(function(error) {
				this.showNotice({
					label: error.message,
					leftButton: {
						style: "redButton",
						label: "OK"
					}
				});
			}, this)
		);

		Setting.get("LastSyncTime", $.proxy(this.gotLastSyncTime, this));
	}, this), "json");
}

ApplicationController.prototype.pushView = function(view, args) {
	if (this.viewStack.length > 0) {
		this.clearHeader();
		this.clearFooter();
		this.viewStack[this.viewStack.length - 1].scrollPos = this.scroller.y;
	}

	this.viewStack.push({
		name: view,
		controller: new window[view.charAt(0).toUpperCase() + view.substr(1) + "Controller"](args),
		scrollPos: 0
	});
	this.show($.proxy(this.viewPushed, this));
}

ApplicationController.prototype.viewPushed = function() {
	this.viewStack[this.viewStack.length - 1].controller.setup();
	this.setHeader();
	window.setTimeout(this.contentShown, 1000);
}

ApplicationController.prototype.popView = function(args) {
	this.clearHeader();
	this.clearFooter();
	this.viewStack.pop();
	this.show($.proxy(this.viewPopped, this), args);
}

ApplicationController.prototype.viewPopped = function(args) {
	this.viewStack[this.viewStack.length - 1].controller.activate(args);
	this.setHeader();
	window.setTimeout(this.contentShown, 1000);
}

ApplicationController.prototype.show = function(onSuccess, args) {
	this.hideScrollHelper();
	$("#nowLoading").addClass("loading");
	$("#content").load("views/" + this.viewStack[this.viewStack.length - 1].name + "-view.html", function() {
		$("#contentWrapper").addClass("loading");
		onSuccess(args);
	});
}

ApplicationController.prototype.initScroller = function() {
	this.scroller = new iScroll($("#content").get(0), {
		desktopCompatibility: true,
		checkDOMChanges: false
	});
}

ApplicationController.prototype.refreshScroller = function() {
	this.scroller.refresh();
	if (this.viewStack[this.viewStack.length - 1].scrollPos === -1) {
		this.viewStack[this.viewStack.length - 1].scrollPos = this.scroller.maxScrollY;
	}
	this.scroller.scrollTo(0, this.viewStack[this.viewStack.length - 1].scrollPos, "0ms");
}

ApplicationController.prototype.contentShown = function() {
	switch (true) {
		case $("#contentWrapper").hasClass("loading"):
			$("#contentWrapper").removeClass("loading");
			$("#contentWrapper").addClass("loaded");
			$("#nowLoading").removeClass("loading");
			break;

		case $("#contentWrapper").hasClass("loaded"):
			$("#contentWrapper").removeClass("loaded");
			break;
	}
}

ApplicationController.prototype.setHeader = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.header.leftButton) {
		$("#headerLeftButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.header.leftButton.eventHandler);
		$("#headerLeftButton")
			.removeClass()
			.addClass("button header left " + this.viewStack[this.viewStack.length - 1].controller.header.leftButton.style);
		$("#headerLeftButton").text(this.viewStack[this.viewStack.length - 1].controller.header.leftButton.label);
		$("#headerLeftButton").show();
	}

	if (this.viewStack[this.viewStack.length - 1].controller.header) {
		$("#headerLabel").text(this.viewStack[this.viewStack.length - 1].controller.header.label);
		$("#headerLabel").show();
	}

	if (this.viewStack[this.viewStack.length - 1].controller.header.rightButton) {
		$("#headerRightButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.header.rightButton.eventHandler);
		$("#headerRightButton")
			.removeClass()
			.addClass("button header right " + this.viewStack[this.viewStack.length - 1].controller.header.rightButton.style);
		$("#headerRightButton").text(this.viewStack[this.viewStack.length - 1].controller.header.rightButton.label);
		$("#headerRightButton").show();
	}

	this.setContentHeight();
}

ApplicationController.prototype.clearHeader = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.header.leftButton) {
		$("#headerLeftButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.header.leftButton.eventHandler);
	}

	if (this.viewStack[this.viewStack.length - 1].controller.header.rightButton) {
		$("#headerRightButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.header.rightButton.eventHandler);
	}

	$("#headerLeftButton").hide();
	$("#headerLabel").hide();
	$("#headerRightButton").hide();

	this.setContentHeight();
}

ApplicationController.prototype.setFooter = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.footer) {
		if (this.viewStack[this.viewStack.length - 1].controller.footer.leftButton) {
			$("#footerLeftButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.eventHandler);
			$("#footerLeftButton")
				.removeClass()
				.addClass("button footer left " + this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.style);
			$("#footerLeftButton").text(this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.label);
			$("#footerLeftButton").show();
		}

		if (this.viewStack[this.viewStack.length - 1].controller.footer.label) {
			$("#footerLabel").text(this.viewStack[this.viewStack.length - 1].controller.footer.label);
		}
		$("#footerLabel").show();

		if (this.viewStack[this.viewStack.length - 1].controller.footer.rightButton) {
			$("#footerRightButton").bind('click', this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.eventHandler);
			$("#footerRightButton")
				.removeClass()
				.addClass("button footer right " + this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.style);
			$("#footerRightButton").text(this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.label);
			$("#footerRightButton").show();
		}

		this.setContentHeight();
	}
}

ApplicationController.prototype.clearFooter = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.footer) {
		if (this.viewStack[this.viewStack.length - 1].controller.footer.leftButton) {
			$("#footerLeftButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.eventHandler);
		}

		if (this.viewStack[this.viewStack.length - 1].controller.footer.rightButton) {
			$("#footerRightButton").unbind('click', this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.eventHandler);
		}
	}

	$("#footerLeftButton").hide();
	$("#footerLabel").val("");
	$("#footerLabel").hide();
	$("#footerRightButton").hide();
	this.setContentHeight();
}

ApplicationController.prototype.setContentHeight = function() {
	$("#contentWrapper").height(window.innerHeight - $("#header").outerHeight() - $("#footer").outerHeight());
}

ApplicationController.prototype.showNotice = function(notice) {
	var noticeContainer = $("<div>")
		.addClass("notice")
		.appendTo($("#notices"));

	var noticeLeftButton = $("<a>").appendTo(noticeContainer);
	if (notice.leftButton) {
		if (notice.leftButton.eventHandler) {
			noticeLeftButton.bind('click', notice.leftButton.eventHandler);
		}
		noticeLeftButton.bind('click', $.proxy(function(notice) { return $.proxy(function() { this.hideNotice(notice); }, this);}, this)(noticeContainer));
		noticeLeftButton
			.removeClass()
			.addClass("button footer left " + notice.leftButton.style);
		noticeLeftButton.text(notice.leftButton.label);
		noticeLeftButton.show();
	}

	var noticeLabel = $("<p>")
		.html(notice.label)
		.appendTo(noticeContainer);
	if (notice.id) {
		noticeLabel.attr("id", notice.id);
	}

	var noticeRightButton = $("<a>").appendTo(noticeContainer);
	if (notice.rightButton) {
		if (notice.rightButton.eventHandler) {
			noticeRightButton.bind('click', notice.rightButton.eventHandler);
		}
		noticeRightButton
			.removeClass()
			.addClass("button footer right " + notice.rightButton.style);
		noticeRightButton.text(notice.rightButton.label);
		noticeRightButton.show();
	}

	if (0 === this.noticeStack.notice.length) {
		$("#notices").css('top', window.innerHeight + window.pageYOffset + 'px');
		$("#notices").css("visibility", "visible");
	}

	this.noticeStack.height -= noticeContainer.height();
	this.noticeStack.notice.push(noticeContainer);
	$("#notices").animate({top: $(window).height() + this.noticeStack.height}, $.proxy(this.noticesMoved, this));
}

ApplicationController.prototype.hideNotice = function(notice) {
	this.noticeStack.height += notice.height();
	notice.data("acknowledged", true);
	notice.animate({height: 0}, $.proxy(this.noticeHidden, this));
}

ApplicationController.prototype.noticeHidden = function(event) {
	$("#notices").animate({top: "-=" + this.noticeStack.height}, $.proxy(this.noticesMoved, this));
}

ApplicationController.prototype.noticesMoved = function(event) {
	for (var i = this.noticeStack.notice.length - 1; i >= 0; i--) {
		if (this.noticeStack.notice[i].data("acknowledged")) {
			this.noticeStack.notice[i].remove();
			this.noticeStack.notice.splice(i,1);
		}
	}

	if (this.noticeStack.notice.length == 0) {
		$("#notices").css("visibility", "hidden");
	}
}

ApplicationController.prototype.showScrollHelper = function() {
	$("#abc").show();
}

ApplicationController.prototype.hideScrollHelper = function() {
	$("#abc").hide();
}

ApplicationController.prototype.gotLastSyncTime = function(lastSyncTime) {
	if (lastSyncTime.settingValue) {
		var MAX_DATA_AGE_DAYS = 7;
		var MILLISECONDS_IN_ONE_DAY = 1000 * 60 * 60 * 24;

		var now = new Date();
		var lastSync = new Date(lastSyncTime.settingValue);

		if (Math.round(Math.abs(now.getTime() - lastSync.getTime()) / MILLISECONDS_IN_ONE_DAY) > MAX_DATA_AGE_DAYS) {
			this.showNotice({
				label: "The last data sync was over " + MAX_DATA_AGE_DAYS + " days ago",
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});
		}
	}
}

$(function() {
	window.appController = new ApplicationController();
	appController.start();
});