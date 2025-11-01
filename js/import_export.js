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
			const headers = ['Loan ID', 'Customer ID', 'Customer Name', 'Interest Rate', 'Collateral Items', 'Net Principal', 'As Of Date'];
			const rows = app.loans.map(loan => {
				const customer = app.customers.find(c => c.id === loan.customerId);
				const customerName = customer ? customer.name : 'Unknown';
				// Prefer stored interest-aware values, fallback to principal-only calc
				const netPrincipal = (typeof loan.netPrincipal === 'number') ? loan.netPrincipal
					: (typeof loan.netDue === 'number') ? loan.netDue
					: app.calculateNetDue(loan.id);
				const asOfDate = loan.asOfDate || loan.netDate || '';
				const collateralDisplay = app.formatCollateralItems(loan);
				return [loan.id, loan.customerId, customerName, loan.interestRate, collateralDisplay, Number(netPrincipal).toFixed(2), asOfDate];
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
			const importType = event.target.dataset.importType;
			const ext = (file.name.split('.').pop() || '').toLowerCase();
			if (ext === 'xlsx') {
				if (!window.XLSX) { alert('XLSX parser not available. Please switch to CSV or check your network.'); return; }
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const data = new Uint8Array(e.target.result);
						const wb = XLSX.read(data, { type: 'array' });
						const sheet = wb.SheetNames[0];
						const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheet]);
						switch (importType) {
							case 'customers': app.importCustomersFromCSV(csv); break;
							case 'loans': app.importLoansFromCSV(csv); break;
							case 'transactions': app.importTransactionsFromCSV(csv); break;
							case 'legacy': ImportExport.importLegacyFromCSV(app, csv); break;
						}
					} catch (error) {
						alert('Error importing XLSX: ' + error.message);
					}
				};
				reader.readAsArrayBuffer(file);
				return;
			}
			// Default CSV path
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target.result;
				try {
					switch(importType) {
						case 'customers': app.importCustomersFromCSV(content); break;
						case 'loans': app.importLoansFromCSV(content); break;
						case 'transactions': app.importTransactionsFromCSV(content); break;
						case 'legacy': ImportExport.importLegacyFromCSV(app, content); break;
					}
				} catch (error) {
					alert('Error importing file: ' + error.message);
				}
			};
			reader.readAsText(file);
		},

		// Legacy CSV importer
		importLegacyFromCSV(app, content) {
			const lines = content.split(/\r?\n/).filter(line => line.trim());
			if (lines.length <= 1) return alert('No legacy rows found.');
			const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
			const norm = s => (s || '').toLowerCase().replace(/\s+/g, '');
			const idx = (name) => headers.findIndex(h => norm(h) === norm(name));
			const idxName = headers.findIndex(h => /^name$/i.test(h.trim()));
			const idxFather = headers.findIndex(h => /father/i.test(h));
			const idxVillage = headers.findIndex(h => /village/i.test(h));
			const idxParticulars = headers.findIndex(h => /particulars|collateral/i.test(h));

			// Identify debit/credit columns pairs
			const debitPairs = [];
			const creditPairs = [];
			for (let i = 0; i < headers.length; i++) {
				const h = norm(headers[i]);
				if (/^debit\d*$/.test(h)) {
					const amtIdx = i;
					const dateIdx = (i + 1 < headers.length && /date/i.test(headers[i+1])) ? i + 1 : -1;
					debitPairs.push({ amtIdx, dateIdx });
				}
				if (/^credit\d*$/.test(h)) {
					const amtIdx = i;
					const dateIdx = (i + 1 < headers.length && /date/i.test(headers[i+1])) ? i + 1 : -1;
					creditPairs.push({ amtIdx, dateIdx });
				}
			}

			let createdCount = 0;
			for (let i = 1; i < lines.length; i++) {
				const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
				if (values.length === 0) continue;
				const name = idxName >= 0 ? values[idxName] : '';
				if (!name) continue;
				const father = idxFather >= 0 ? values[idxFather] : '';
				const village = idxVillage >= 0 ? values[idxVillage] : '';
				const particularsRaw = idxParticulars >= 0 ? values[idxParticulars] : '';

				// Ensure customer
				let customer = app.customers.find(c => (c.name||'').trim().toLowerCase() === name.toLowerCase() && (c.fatherName||'').trim().toLowerCase() === father.toLowerCase());
				if (!customer) {
					customer = { id: app.currentCustomerId++, name, fatherName: father, address: village };
					app.customers.push(customer);
				}

				// Create loan
				const loan = {
					id: app.currentLoanId++,
					customerId: customer.id,
					interestRate: app.rates.defaultInterestRate,
					collateralItems: ImportExport.parseLegacyParticulars(particularsRaw),
					netDue: 0,
					netDate: new Date().toISOString().split('T')[0],
					netPrincipal: 0,
					asOfDate: new Date().toISOString().split('T')[0]
				};
				app.loans.push(loan);

				// Create collateral transaction
				app.transactions.push({ id: app.currentTransactionId++, loanId: loan.id, type: 'collateral', amount: 0, description: app.formatCollateralItems(loan), date: loan.netDate });

				// Debits
				debitPairs.forEach(pair => {
					const amtStr = values[pair.amtIdx] || '';
					const amt = parseFloat(amtStr);
					if (Number.isFinite(amt) && amt > 0) {
						const date = pair.dateIdx >= 0 ? (values[pair.dateIdx] || loan.netDate) : loan.netDate;
						app.transactions.push({ id: app.currentTransactionId++, loanId: loan.id, type: 'debit', amount: amt, description: '', date });
					}
				});
				// Credits
				creditPairs.forEach(pair => {
					const amtStr = values[pair.amtIdx] || '';
					const amt = parseFloat(amtStr);
					if (Number.isFinite(amt) && amt > 0) {
						const date = pair.dateIdx >= 0 ? (values[pair.dateIdx] || loan.netDate) : loan.netDate;
						app.transactions.push({ id: app.currentTransactionId++, loanId: loan.id, type: 'credit', amount: amt, description: '', date });
					}
				});

				// Update effective principal for the loan
				app.updateLoanEffectivePrincipal(loan.id);
				createdCount++;
			}

			app.saveData('customers', app.customers);
			app.saveData('loans', app.loans);
			app.saveData('transactions', app.transactions);
			app.saveData('currentCustomerId', app.currentCustomerId);
			app.saveData('currentLoanId', app.currentLoanId);
			app.saveData('currentTransactionId', app.currentTransactionId);

			app.renderCustomers(); app.renderTransactions(); app.updateDashboard(); app.updateRates();
			alert(`Imported ${createdCount} legacy rows as loans with transactions.`);
		},

		parseLegacyParticulars(text) {
			const items = [];
			if (!text) return items;
			let norm = String(text)
				.replace(/\r/g, '\n')
				.replace(/Sona/gi, 'Gold')
				.replace(/Chandi/gi, 'Silver');
			// Split by commas, periods, or newlines
			const parts = norm.split(/[\n,\.]+/).map(s => s.trim()).filter(Boolean);
			parts.forEach(part => {
				// Remove hyphen separators
				const cleaned = part.replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim();
				// Extract weight (number before g or gm)
				const weightMatch = cleaned.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:gm|g)\b/i);
				let weight = 0;
				if (weightMatch) weight = parseFloat(weightMatch[1]);
				// Determine metal
				let metalType = '';
				if (/\bgold\b/i.test(cleaned)) metalType = 'gold';
				else if (/\bsilver\b/i.test(cleaned)) metalType = 'silver';
				// Name is the words between metal and weight
				let name = cleaned;
				if (metalType) {
					name = name.replace(/\bgold\b/i, '').replace(/\bsilver\b/i, '').trim();
				}
				if (weightMatch) {
					name = name.replace(weightMatch[0], '').trim();
				}
				name = name.replace(/\s{2,}/g, ' ').trim();
				if (metalType && name && Number.isFinite(weight) && weight > 0) {
					items.push({ name, metalType, weight, purity: 0, netWeight: weight });
				}
			});
			return items;
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
		},

		// Auto-backup (hourly) via File System Access API (Chromium)
		autoBackupState: { timerId: null, dirHandle: null },
		isAutoBackupEnabled() { return !!ImportExport.autoBackupState.timerId && !!ImportExport.autoBackupState.dirHandle; },
		toggleAutoBackup(app) { return ImportExport.isAutoBackupEnabled() ? (ImportExport.disableAutoBackup(), false) : (ImportExport.enableAutoBackup(app), true); },
		async enableAutoBackup(app) {
			try {
				if (!window.showDirectoryPicker) {
					alert('Auto backup requires a Chromium browser with File System Access API.');
					return;
				}
				const dirHandle = await window.showDirectoryPicker();
				ImportExport.autoBackupState.dirHandle = dirHandle;
				// write immediately
				await ImportExport.writeBackupToDirectory(app);
				// schedule hourly
				if (ImportExport.autoBackupState.timerId) clearInterval(ImportExport.autoBackupState.timerId);
				ImportExport.autoBackupState.timerId = setInterval(() => {
					ImportExport.writeBackupToDirectory(app).catch(() => {});
				}, 60 * 60 * 1000);
				alert('Auto backup enabled. A backup will be written every hour. Keep this tab open.');
			} catch (e) {
				alert('Could not enable auto backup: ' + (e && e.message ? e.message : e));
			}
		},
		disableAutoBackup() {
			if (ImportExport.autoBackupState.timerId) {
				clearInterval(ImportExport.autoBackupState.timerId);
				ImportExport.autoBackupState.timerId = null;
			}
			ImportExport.autoBackupState.dirHandle = null;
			alert('Auto backup disabled.');
		},
		async writeBackupToDirectory(app) {
			const dir = ImportExport.autoBackupState.dirHandle;
			if (!dir) throw new Error('No backup folder selected');
			const stamp = new Date();
			const pad = n => String(n).padStart(2, '0');
			const name = `lending_ledger_backup_${stamp.getFullYear()}-${pad(stamp.getMonth()+1)}-${pad(stamp.getDate())}_${pad(stamp.getHours())}-${pad(stamp.getMinutes())}.json`;
			const fileHandle = await dir.getFileHandle(name, { create: true });
			const writable = await fileHandle.createWritable();
			const payload = {
				customers: app.customers,
				loans: app.loans,
				transactions: app.transactions,
				rates: app.rates,
				exportDate: new Date().toISOString(),
				version: '1.0'
			};
			await writable.write(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
			await writable.close();
		}
	};

	global.ImportExport = ImportExport;
})(window);
