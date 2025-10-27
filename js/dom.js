(function (global) {
	'use strict';

	/**
	 * DOM helper utilities
	 * @namespace Dom
	 */
	const Dom = {
		/**
		 * Query single element.
		 * @param {string} selector
		 * @param {ParentNode} [root=document]
		 * @returns {Element|null}
		 */
		qs(selector, root) {
			return (root || document).querySelector(selector);
		},

		/**
		 * Query multiple elements as array.
		 * @param {string} selector
		 * @param {ParentNode} [root=document]
		 * @returns {Element[]}
		 */
		qsa(selector, root) {
			return Array.from((root || document).querySelectorAll(selector));
		},

		/**
		 * Add event listener.
		 * @param {Element|Window|Document} el
		 * @param {string} type
		 * @param {EventListenerOrEventListenerObject} handler
		 * @param {boolean|AddEventListenerOptions} [opts]
		 */
		on(el, type, handler, opts) {
			if (el && el.addEventListener) el.addEventListener(type, handler, opts);
		}
	};

	global.Dom = Dom;
})(window);
