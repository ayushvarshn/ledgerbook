(function (global) {
	'use strict';

	/**
	 * Transactions feature: render and actions
	 * @namespace Transactions
	 */
	const Transactions = {
		/** Render transactions table */
		renderList(app, transactions, loans, customers) {
			const tbody = document.getElementById('transactions-tbody');
			if (!tbody) return;
			tbody.innerHTML = '';
			transactions.forEach(transaction => {
				const loan = loans.find(l => l.id === transaction.loanId);
				const customer = loan ? customers.find(c => c.id === loan.customerId) : null;
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${transaction.id}</td>
					<td>${transaction.loanId}</td>
					<td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-danger'}">${transaction.type.toUpperCase()}</span></td>
					<td>${app.formatCurrency(transaction.amount)}</td>
					<td>${app.formatDate(transaction.date)}</td>
					<td>
						<button class="btn btn-primary btn-sm" onclick="app.openTransactionModal(${transaction.id})"><i class="fas fa-edit"></i> Edit</button>
						<button class="btn btn-danger btn-sm" onclick="app.deleteTransaction(${transaction.id})"><i class="fas fa-trash"></i> Delete</button>
					</td>
				`;
				tbody.appendChild(row);
			});
		}
	};

	global.Transactions = Transactions;
})(window);
