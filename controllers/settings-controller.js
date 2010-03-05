function SettingsController() {

}

SettingsController.prototype.setup = function() {
	this.header = {
		label: "Settings",
		leftButton: {
			eventHandler: this.goBack.bind(this),
			style: "backButton",
			label: "Schedule"
		}
	};

	this.activate();
}

SettingsController.prototype.activate = function() {
	$("dataSyncRow").addEventListener('click', this.viewDataSync.bind(this));
	$("aboutRow").addEventListener('click', this.viewAbout.bind(this));

	appController.toucheventproxy.enabled = false;
	appController.refreshScroller();
}

SettingsController.prototype.goBack = function() {
	appController.popView();
}

SettingsController.prototype.viewDataSync = function() {
	appController.pushView("dataSync");
}

SettingsController.prototype.viewAbout = function() {
	appController.pushView("about");
}