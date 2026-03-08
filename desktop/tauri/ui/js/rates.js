(function (global) {
	'use strict';

	const Rates = {
		updateInputs(rates) {
			document.getElementById('gold-rate').value = rates.goldRate;
			document.getElementById('silver-rate').value = rates.silverRate;
			document.getElementById('default-interest-rate').value = rates.defaultInterestRate;
		}
	};

	global.Rates = Rates;
})(window);


