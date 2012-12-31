jQueryMock = {
	originalGet: $.get,
	originalLoad: $.fn.load,
	originalAjax: $.ajax,
	originalScrollTop: $.fn.scrollTop,
	originalPosition: $.fn.position,
	scrollPos: 0,
	get: function(url, success) {
		"use strict";

		$.get = jQueryMock.originalGet;

		$.get(url, function(data, status, jqXHR) {
			data = undefined;
			status = "notmodified";
			jqXHR.status = 304;
			jqXHR.statusText = status;
			success(data, status, jqXHR);
		});
	},
	load: function(url, complete) {
		"use strict";

		$.fn.load = jQueryMock.originalLoad;
		jQueryMock.get(url, $.proxy(complete, this));
	},
	ajax: function(options) {
		"use strict";

		$.ajax = jQueryMock.originalAjax;

		var originalSuccess = $.proxy(options.success, options.context);
		options.success = function(data, status, jqXHR) {
			data = undefined;
			status = "notmodified";
			jqXHR.status = 304;
			jqXHR.statusText = status;
			originalSuccess(data, status, jqXHR);
		};

		$.ajax(options);
	},
	scrollTop: function(position) {
		"use strict";

		if (position) {
			jQueryMock.scrollPos = position;
		} else {
			return jQueryMock.scrollPos;
		}
	},
	position: function() {
		"use strict";

		return {
			top: 999
		};
	}
};
