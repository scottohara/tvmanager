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

		$("import").addEventListener('click', this.doImport.bind(this));
		$("export").addEventListener('click', this.doExport.bind(this));
		$("update").addEventListener('click', this.cacheUpdate.bind(this));

		appController.toucheventproxy.enabled = false;
		appController.refreshScroller();
}

SettingsController.prototype.goBack = function() {
    appController.popView();
}

SettingsController.prototype.doImport = function(e) {
	if (!this.importing) {
		this.importing = true;
		$("status").value = "Starting import";

		var sync = new DataSyncController();
		sync.dataImport($("status"),
			function(successful) {
				var label = "Database has been successfully imported.";

				if (!successful) {
					label = "Import failed.";
				}

				appController.showNotice({
					label: label,
					leftButton: {
						eventHandler: appController.hideNotice.bind(this),
						style: "redButton",
						label: "OK"
					}
				});

				this.importing = false;
			}.bind(this)
		);
	} else {
		$("status").value = "An import is already running";
	}
}

SettingsController.prototype.doExport = function() {
	if (!this.exporting) {
		this.exporting = true;
		$("status").value = "Starting export";

		var sync = new DataSyncController();
		sync.dataExport($("status"),
			function(successful) {
				var label = "Database has been successfully exported.";
				if (!successful) {
					label = "Export failed.";
				}

				appController.showNotice({
					label: label,
					leftButton: {
						eventHandler: appController.hideNotice.bind(this),
						style: "redButton",
						label: "OK"
					}
				});

				this.exporting = false;
			}.bind(this)
		);
	} else {
		$("status").value = "An export is already running";
	}
}

SettingsController.prototype.cacheUpdate = function() {
	if (!this.updating) {
		this.updating = true;
		var label = "Application cache has been successfully updated.";

		if (!appController.cache.update()) {
			label = "This browser does not support application caching."
		}

		appController.showNotice({
			label: label,
			leftButton: {
				eventHandler: appController.hideNotice.bind(this),
				style: "redButton",
				label: "OK"
			}
		});

		this.updating = false;
	}
}