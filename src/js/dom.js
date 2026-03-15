(function (global) {
	'use strict';

	const Dom = {
		qs(selector, root) {
			return (root || document).querySelector(selector);
		},
		qsa(selector, root) {
			return Array.from((root || document).querySelectorAll(selector));
		},
		on(el, type, handler, opts) {
			if (el && el.addEventListener) el.addEventListener(type, handler, opts);
		}
	};

	global.Dom = Dom;
})(window);


