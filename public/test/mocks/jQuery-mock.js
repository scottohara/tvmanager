define(
	[
		'framework/jquery'
	],

	function($) {
		"use strict";

		var jQueryMock = {
			originalGet: $.get,
			originalLoad: $.fn.load,
			originalAjax: $.ajax,
			originalScrollTop: $.fn.scrollTop,
			originalPosition: $.fn.position,
			originalInit: $.fn.init,
			scrollPos: 0,
			get: function(url, success) {
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
				$.fn.load = jQueryMock.originalLoad;
				jQueryMock.get(url, $.proxy(complete, this));
			},
			ajax: function(options) {
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
				if (position) {
					jQueryMock.scrollPos = position;
				} else {
					return jQueryMock.scrollPos;
				}
			},
			position: function() {
				return {
					top: 999
				};
			},
			sandbox: function(id) {
				return $("<div>")
					.attr("id", "sandbox-" + id)
					.hide()
					.appendTo(document.body);
			},
			setDefaultContext: function(defaultContext) {
				$.fn.init = function(selector, context, rootjQuery) {
					return new jQueryMock.originalInit(selector, defaultContext, rootjQuery);
				};
			},
			clearDefaultContext: function() {
				$.fn.init = jQueryMock.originalInit;
			}
		};

		return jQueryMock;
	}
);
