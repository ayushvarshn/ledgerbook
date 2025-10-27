(function (global) {
	'use strict';

	/**
	 * Import/Export/Backup handlers
	 * @namespace ImportExport
	 */
	const ImportExport = {
		exportToCSV(app, dataType) {
			let csvContent = '';
			let filename = '';
			switch(dataType) {
				case 'customers':
					csvContent = ImportExport.convertCustomersToCSV(app);
					filename = `customers_${ImportExport.getCurrentDate()}.csv`;
					break;
				case 'loans':
					csvContent = ImportExport.convertLoansToCSV(app);
					filename = `loans_${ImportExport.getCurrentDate()}.csv`;
					break;
				case 'transactions':
					csvContent = ImportExport.convertTransactionsToCSV(app);
					filename = `transactions_${ImportExport.getCurrentDate()}.csv`;
					break;
			}
			ImportExport.downloadCSV(csvContent, filename);
		},

		exportAllData(app) {
			const allData = {
				customers: app.customers,
				loans: app.loans,
				transactions: app.transactions,
				rates: app.rates,
				exportDate: new Date().toISOString(),
				version: '1.0'
			};
			const jsonContent = JSON.stringify(allData, null, 2);
			const filename = `lending_ledger_backup_${ImportExport.getCurrentDate()}.json`;
			ImportExport.downloadFile(jsonContent, filename, 'application/json');
		},

		convertCustomersToCSV(app) {
			const headers = ['ID', 'Name', 'Father Name', 'Address'];
			const rows = app.customers.map(c => [c.id, c.name, c.fatherName, c.address]);
			return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
		},

		convertLoansToCSV(app) {
			const headers = ['Loan ID', 'Customer ID', 'Customer Name', 'Interest Rate', 'Collateral Items', 'Net Due'];
			const rows = app.loans.map(loan => {
				const customer = app.customers.find(c => c.id === loan.customerId);
				const customerName = customer ? customer.name : 'Unknown';
				const netDue = app.calculateNetDue(loan.id);
				const collateralDisplay = app.formatCollateralItems(loan);
				return [loan.id, loan.customerId, customerName, loan.interestRate, collateralDisplay, netDue.toFixed(2)];
			});
			return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
		},

		convertTransactionsToCSV(app) {
			const headers = ['Transaction ID', 'Loan ID', 'Customer Name', 'Type', 'Amount', 'Description', 'Date'];
			const rows = [];
			app.transactions.forEach(transaction => {
				const loan = app.loans.find(l => l.id === transaction.loanId);
				const customer = loan ? app.customers.find(c => c.id === loan.customerId) : null;
				const customerName = customer ? customer.name : 'Unknown';
				rows.push([
					transaction.id,
					transaction.loanId,
					customerName,
					transaction.type.toUpperCase(),
					transaction.amount,
					transaction.description || '',
					transaction.date
				]);
			});
			app.loans.forEach(loan => {
				const hasCollateralTx = app.transactions.some(t => t.loanId === loan.id && (t.type || '').toLowerCase() === 'collateral');
				const description = app.formatCollateralItems(loan);
				if (!hasCollateralTx && description && description !== 'No collateral') {
					const customer = app.customers.find(c => c.id === loan.customerId);
					const customerName = customer ? customer.name : 'Unknown';
					rows.push(['', loan.id, customerName, 'COLLATERAL', '', description, '']);
				}
			});
			return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
		},

		downloadCSV(content, filename) {
			if (!filename.toLowerCase().endsWith('.csv')) filename += '.csv';
			const csvContent = '\uFEFF' + content;
			ImportExport.downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
		},

		downloadFile(content, filename, mimeType) {
			const blob = new Blob([content], { type: mimeType });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		},

		getCurrentDate() { return new Date().toISOString().split('T')[0]; },

		importFromCSV(app, dataType) {
			const input = document.getElementById('import-file');
			input.dataset.importType = dataType;
			input.click();
		},

		handleFileImport(app, event) {
			const file = event.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target.result;
				const importType = event.target.dataset.importType;
				try {
					switch(importType) {
						case 'customers': app.importCustomersFromCSV(content); break;
						case 'loans': app.importLoansFromCSV(content); break;
						case 'transactions': app.importTransactionsFromCSV(content); break;
					}
				} catch (error) {
					alert('Error importing file: ' + error.message);
				}
			};
			reader.readAsText(file);
		},

		createBackup(app) { ImportExport.exportAllData(app); alert('Backup created successfully!'); },
		restoreBackup(app) {
			const input = document.createElement('input');
			input.type = 'file'; input.accept = '.json';
			input.onchange = (e) => {
				const file = e.target.files[0]; if (!file) return;
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const backupData = JSON.parse(e.target.result);
						if (confirm('This will replace all current data. Are you sure?')) {
							app.customers = backupData.customers || [];
							app.loans = backupData.loans || [];
							app.transactions = backupData.transactions || [];
							app.rates = backupData.rates || { goldRate: 0, silverRate: 0 };
							app.saveData('customers', app.customers);
							app.saveData('loans', app.loans);
							app.saveData('transactions', app.transactions);
							app.saveData('rates', app.rates);
							app.renderCustomers(); app.renderTransactions(); app.updateDashboard(); app.updateRates();
							alert('Data restored successfully!');
						}
					} catch (error) { alert('Error restoring backup: ' + error.message); }
				};
				reader.readAsText(file);
			};
			input.click();
		}
	};

	global.ImportExport = ImportExport;
})(window);
