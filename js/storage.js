(function (global) {
	'use strict';

	/**
	 * Storage helpers wrapping localStorage JSON serialization
	 * @namespace Storage
	 */
	const Storage = {
		/**
		 * Load JSON data by key.
		 * @param {string} key
		 * @returns {any|null}
		 */
		load(key) {
			try {
				const data = localStorage.getItem(key);
				return data ? JSON.parse(data) : null;
			} catch (_) {
				return null;
			}
		},

		/**
		 * Save JSON serializable data by key.
		 * @param {string} key
		 * @param {any} value
		 */
		save(key, value) {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (_) {
				// no-op
			}
		}
	};

	global.Storage = Storage;
})(window);
