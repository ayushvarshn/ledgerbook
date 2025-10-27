(function (global) {
	'use strict';

	/**
	 * Utility helpers (formatting, dates)
	 * @namespace Utils
	 */
	const Utils = {
		/**
		 * Format amount as INR currency using en-IN locale.
		 * @param {number|string} amount - Numeric amount
		 * @returns {string} Formatted currency string
		 */
		formatCurrency(amount) {
			const formatter = new Intl.NumberFormat('en-IN', {
				style: 'currency',
				currency: 'INR',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
			return formatter.format(Number(amount) || 0);
		},

		/**
		 * Format ISO date or Date-like value to locale date string.
		 * @param {string|Date} value - Date value
		 * @returns {string} Locale date string
		 */
		formatDate(value) {
			return new Date(value).toLocaleDateString();
		},

		/**
		 * Get YYYY-MM-DD (ISO date) for today in local time.
		 * @returns {string}
		 */
		getCurrentDate() {
			return new Date().toISOString().split('T')[0];
		}
	};

	global.Utils = Utils;
})(window);
