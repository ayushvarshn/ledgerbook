(function (global) {
	'use strict';

	/**
	 * Utility helpers (formatting, dates)
	 * @namespace Utils
	 */
	const Utils = {
		formatCurrency(amount) {
			const formatter = new Intl.NumberFormat('en-IN', {
				style: 'currency',
				currency: 'INR',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
			return formatter.format(Number(amount) || 0);
		},
		formatDate(value) {
			return new Date(value).toLocaleDateString();
		},
		getCurrentDate() {
			return new Date().toISOString().split('T')[0];
		}
	};

	global.Utils = Utils;
})(window);


