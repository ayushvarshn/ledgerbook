(function (global) {
	'use strict';

	/**
	 * Rates UI updater
	 * @namespace Rates
	 */
	const Rates = {
		/** Update inputs from rates object */
		updateInputs(rates) {
			document.getElementById('gold-rate').value = rates.goldRate;
			document.getElementById('silver-rate').value = rates.silverRate;
			document.getElementById('default-interest-rate').value = rates.defaultInterestRate;
		}
	};

	global.Rates = Rates;
})(window);
