TestController = function(args) {
	"use strict";

	this.args = args;
	this.header = {
		label: "test-header",
		leftButton: {
			eventHandler: this.buttonClicked,
			style: "left-button-style",
			label: "left-button"
		},
		rightButton: {
			eventHandler: this.buttonClicked,
			style: "right-button-style",
			label: "right-button"
		}
	};
	this.footer = {
		label: "test-footer",
		leftButton: {
			eventHandler: this.buttonClicked,
			style: "left-button-style",
			label: "left-button"
		},
		rightButton: {
			eventHandler: this.buttonClicked,
			style: "right-button-style",
			label: "right-button"
		}
	};
};

TestController.prototype.buttonClicked = function(e, button) {
	"use strict";

	ok(true, "Bind " + button + " button " + e.type + " event listener");
};

TestController.prototype.setup = function() {
	"use strict";

	equals($("#content").html(), "<div></div>", "content");
	start();
};

TestController.prototype.activate = function(args) {
	"use strict";

	equals(args, "Activated", "Activate arguments");
	equals($("#content").html(), "<div></div>", "content");
	start();
};
