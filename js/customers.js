(function (global) {
	'use strict';

	/**
	 * Customers feature: render and actions
	 * @namespace Customers
	 */
	const Customers = {
		/**
		 * Render the customers table.
		 * @param {any} app - reference to main app (LendingLedger)
		 * @param {Array<{id:number,name:string,fatherName:string,address:string}>} customers - list to render
		 */
		renderList(app, customers) {
			const tbody = document.getElementById('customers-tbody');
			if (!tbody) return;
			tbody.innerHTML = '';
			customers.forEach(customer => {
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${customer.id}</td>
					<td>${customer.name}</td>
					<td>${customer.fatherName}</td>
					<td>${customer.address}</td>
					<td>
						<button class="btn btn-success btn-sm" onclick="app.openLoanModal(null, ${customer.id})">
							<i class="fas fa-plus"></i> Add Loan
						</button>
						<button class="btn btn-info btn-sm" onclick="app.viewCustomerLoans(${customer.id})">
							<i class="fas fa-eye"></i> View Loans
						</button>
						<button class="btn btn-primary btn-sm" onclick="app.openCustomerModal(${customer.id})">
							<i class="fas fa-edit"></i> Edit
						</button>
						<button class="btn btn-danger btn-sm" onclick="app.deleteCustomer(${customer.id})">
							<i class="fas fa-trash"></i> Delete
						</button>
					</td>
				`;
				tbody.appendChild(row);
			});
		}
	};

	global.Customers = Customers;
})(window);
