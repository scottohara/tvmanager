var db;

function ApplicationController() {
	this.viewStack = [];
	this.noticeStack = {
		height: 0,
		notice: []
	};

	$("contentWrapper").addEventListener('webkitTransitionEnd', this.contentShown.bind(this));

	window.onload = function() {
		setTimeout( function() {
			this.scroller = new iScroll($("content"), "y");
			this.toucheventproxy = new TouchEventProxy($("content"));
			this.abc = new abc($("abc"), this.scroller);
			this.abctoucheventproxy = new TouchEventProxy($("abc"));
		}.bind(this), 100)
	}.bind(this);

	this.cache = new CacheController();
	this.cache.update(
		function(updated, message, noticeId) {
			if (updated) {
				if ($(noticeId)) {
					$(noticeId).innerHTML = message;
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
		}.bind(this)
	);
}

ApplicationController.prototype.start = function() {
	db = new DatabaseController(
		function(version) {
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
		}.bind(this),
		function(error) {
			this.showNotice({
				label: error.message,
				leftButton: {
					style: "redButton",
					label: "OK"
				}
			});
		}.bind(this)
	);
}

ApplicationController.prototype.pushView = function(view, args) {
	if (this.viewStack.length > 0) {
		this.clearHeader();
		this.clearFooter();
		this.viewStack[this.viewStack.length - 1].scrollPos = this.scroller._yPos;
	}

	this.viewStack.push({
		name: view,
		controller: new window[view.charAt(0).toUpperCase() + view.substr(1) + "Controller"](args),
		scrollPos: 0
	});
	this.show(this.viewPushed.bind(this));
}

ApplicationController.prototype.viewPushed = function() {
	this.viewStack[this.viewStack.length - 1].controller.setup();
	this.setHeader();
	setTimeout(this.contentShown.bind(this), 1000);
}

ApplicationController.prototype.popView = function(args) {
	this.clearHeader();
	this.clearFooter();
	this.viewStack.pop();
	this.show(this.viewPopped.bind(this), args);
}

ApplicationController.prototype.viewPopped = function(args) {
	this.toucheventproxy.enabled = true;
	this.viewStack[this.viewStack.length - 1].controller.activate(args);
	this.setHeader();
	setTimeout(this.contentShown.bind(this), 1000);
}

ApplicationController.prototype.show = function(onSuccess, args) {
	this.hideScrollHelper();
	$("nowLoading").className = "loading";
	new Ajax.Updater("content", "views/" + this.viewStack[this.viewStack.length - 1].name + "-view.html", {
		method: 'get',
		onComplete: function() {
			$("contentWrapper").className = "loading";
			onSuccess(args);
		}.bind(this)
	});
}

ApplicationController.prototype.refreshScroller = function() {
	this.scroller.refresh();
	if (this.viewStack[this.viewStack.length - 1].scrollPos === -1) {
		this.viewStack[this.viewStack.length - 1].scrollPos = this.scroller.maxScrollY;
	}
	this.scroller.scrollTo(0, this.viewStack[this.viewStack.length - 1].scrollPos);
}

ApplicationController.prototype.contentShown = function() {
	switch ($("contentWrapper").className) {
		case "loading":
			$("contentWrapper").className = "loaded";
			$("nowLoading").className = "";
			break;

		case "loaded":
			$("contentWrapper").className = "";
			break;
	}
}

ApplicationController.prototype.setHeader = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.header.leftButton) {
		$("headerLeftButton").addEventListener('click', this.viewStack[this.viewStack.length - 1].controller.header.leftButton.eventHandler);
		$("headerLeftButton").className = "button header left " + this.viewStack[this.viewStack.length - 1].controller.header.leftButton.style;
		$("headerLeftButton").textContent = this.viewStack[this.viewStack.length - 1].controller.header.leftButton.label;
		$("headerLeftButton").style.display = "inline";
	}

	if (this.viewStack[this.viewStack.length - 1].controller.header) {
		$("headerLabel").textContent = this.viewStack[this.viewStack.length - 1].controller.header.label;
		$("headerLabel").style.display = "block";
	}

	if (this.viewStack[this.viewStack.length - 1].controller.header.rightButton) {
		$("headerRightButton").addEventListener('click', this.viewStack[this.viewStack.length - 1].controller.header.rightButton.eventHandler);
		$("headerRightButton").className = "button header right " + this.viewStack[this.viewStack.length - 1].controller.header.rightButton.style;
		$("headerRightButton").textContent = this.viewStack[this.viewStack.length - 1].controller.header.rightButton.label;
		$("headerRightButton").style.display = "inline";
	}

	this.setContentHeight();
}

ApplicationController.prototype.clearHeader = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.header.leftButton) {
		$("headerLeftButton").removeEventListener('click', this.viewStack[this.viewStack.length - 1].controller.header.leftButton.eventHandler);
	}

	if (this.viewStack[this.viewStack.length - 1].controller.header.rightButton) {
		$("headerRightButton").removeEventListener('click', this.viewStack[this.viewStack.length - 1].controller.header.rightButton.eventHandler);
	}

	$("headerLeftButton").style.display = "none";
	$("headerLabel").display = "none";
	$("headerRightButton").style.display = "none";

	this.setContentHeight();
}

ApplicationController.prototype.setFooter = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.footer) {
		if (this.viewStack[this.viewStack.length - 1].controller.footer.leftButton) {
			$("footerLeftButton").addEventListener('click', this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.eventHandler);
			$("footerLeftButton").className = "button footer left " + this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.style;
			$("footerLeftButton").textContent = this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.label;
			$("footerLeftButton").style.display = "inline";
		}

		if (this.viewStack[this.viewStack.length - 1].controller.footer.label) {
			$("footerLabel").textContent = this.viewStack[this.viewStack.length - 1].controller.footer.label;
		}
		$("footerLabel").style.display = "block";

		if (this.viewStack[this.viewStack.length - 1].controller.footer.rightButton) {
			$("footerRightButton").addEventListener('click', this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.eventHandler);
			$("footerRightButton").className = "button footer right " + this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.style;
			$("footerRightButton").textContent = this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.label;
			$("footerRightButton").style.display = "inline";
		}

		this.setContentHeight();
	}
}

ApplicationController.prototype.clearFooter = function() {
	if (this.viewStack[this.viewStack.length - 1].controller.footer) {
		if (this.viewStack[this.viewStack.length - 1].controller.footer.leftButton) {
			$("footerLeftButton").removeEventListener('click', this.viewStack[this.viewStack.length - 1].controller.footer.leftButton.eventHandler);
		}

		if (this.viewStack[this.viewStack.length - 1].controller.footer.rightButton) {
			$("footerRightButton").removeEventListener('click', this.viewStack[this.viewStack.length - 1].controller.footer.rightButton.eventHandler);
		}
	}

	$("footerLeftButton").style.display = "none";
	$("footerLabel").textContent = "";
	$("footerLabel").style.display = "none";
	$("footerRightButton").style.display = "none";
	this.setContentHeight();
}

ApplicationController.prototype.setContentHeight = function() {
	$("contentWrapper").style.height = window.innerHeight - $("header").offsetHeight - $("footer").offsetHeight + 'px';
}

ApplicationController.prototype.showNotice = function(notice) {
	var noticeContainer = document.createElement("DIV");

	var noticeLeftButton = document.createElement("A");
	if (notice.leftButton) {
		if (notice.leftButton.eventHandler) {
			noticeLeftButton.addEventListener('click', notice.leftButton.eventHandler);
		}
		noticeLeftButton.addEventListener('click', function(notice) { return function() { this.hideNotice(notice); }.bind(this);}.bind(this)(noticeContainer));
		noticeLeftButton.className = "button footer left " + notice.leftButton.style;
		noticeLeftButton.textContent = notice.leftButton.label;
		noticeLeftButton.style.display = "inline";
	}

	var noticeLabel = document.createElement("P");
	noticeLabel.innerHTML = notice.label;
	if (notice.id) {
		noticeLabel.id = notice.id
	}

	var noticeRightButton = document.createElement("A");
	if (notice.rightButton) {
		if (notice.rightButton.eventHandler) {
			noticeRightButton.addEventListener('click', notice.rightButton.eventHandler);
		}
		noticeRightButton.className = "button footer right " + notice.rightButton.style;
		noticeRightButton.textContent = notice.rightButton.label;
		noticeRightButton.style.display = "inline";
	}

	noticeContainer.className = "notice";
	noticeContainer.appendChild(noticeLabel);
	noticeContainer.appendChild(noticeLeftButton);
	noticeContainer.appendChild(noticeRightButton);
	noticeContainer.addEventListener('webkitTransitionEnd', this.noticeHidden.bind(this));
	$("notices").appendChild(noticeContainer);

	if (0 === this.noticeStack.notice.length) {
		$("notices").style.top = window.innerHeight + window.pageYOffset + 'px';
		$("notices").style.visibility = "visible";
		$("notices").webkitTransitionTimingFunction = 'ease-out';
		$("notices").addEventListener('webkitTransitionEnd', this.noticesMoved.bind(this));
	}

	this.noticeStack.height -= noticeContainer.clientHeight;
	this.noticeStack.notice.push(noticeContainer);
	$("notices").style.webkitTransform = 'translate3d(0, ' + this.noticeStack.height + 'px, 0)';
}

ApplicationController.prototype.hideNotice = function(notice) {
	this.noticeStack.height += notice.clientHeight;
	notice.acknowledged = true;
	notice.style.webkitTransform = 'scaleY(0)';
}

ApplicationController.prototype.noticeHidden = function(event) {
	$("notices").style.webkitTransform = 'translate3d(0, ' + this.noticeStack.height + 'px, 0)';
}

ApplicationController.prototype.noticesMoved = function(event) {
	for (var i = this.noticeStack.notice.length - 1; i >= 0; i--) {
		if (this.noticeStack.notice[i].acknowledged) {
			$("notices").removeChild(this.noticeStack.notice[i]);
			this.noticeStack.notice.splice(i,1);
		}
	}

	if (this.noticeStack.notice.length == 0) {
		$("notices").style.visibility = "hidden";
	}
}

ApplicationController.prototype.showScrollHelper = function() {
	$("abc").style.display = "block";
}

ApplicationController.prototype.hideScrollHelper = function() {
	$("abc").style.display = "none";
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

var appController = new ApplicationController();
appController.start();

Setting.get("LastSyncTime", appController.gotLastSyncTime.bind(appController));