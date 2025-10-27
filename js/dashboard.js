(function (global) {
	'use strict';

	/**
	 * Dashboard summary computations and UI
	 * @namespace Dashboard
	 */
	const Dashboard = {
		/** Compute total outstanding using app helper */
		computeOutstanding(app, loans) {
			let totalOutstanding = 0;
			loans.forEach(loan => { totalOutstanding += app.calculateNetDue(loan.id); });
			return totalOutstanding;
		},
		/** Update summary counters */
		render(app) {
			document.getElementById('total-customers').textContent = app.customers.length;
			document.getElementById('total-loans').textContent = app.loans.length;
			document.getElementById('total-transactions').textContent = app.transactions.length;
			const totalOutstanding = this.computeOutstanding(app, app.loans);
			document.getElementById('total-outstanding').textContent = app.formatCurrency(totalOutstanding);
		}
	};

	global.Dashboard = Dashboard;
})(window);
