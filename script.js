// Lending Ledger Application JavaScript

class LendingLedger {
    constructor() {
        this.customers = [];
        this.loans = [];
        this.transactions = [];
        this.rates = { goldRate: 0, silverRate: 0, defaultInterestRate: 12.0 };
        this.currentCustomerId = 1;
        this.currentLoanId = 1;
        this.currentTransactionId = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initFromDB().then(() => {
            this.updateDashboard();
            this.renderCustomers();
            this.renderTransactions();
            this.updateRates();
            this.setDefaultDate();
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSection(e.target.dataset.section);
            });
        });

        // Customer modal
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            this.openCustomerModal();
        });

        document.getElementById('customer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        document.getElementById('cancel-customer').addEventListener('click', () => {
            this.closeModal('customer-modal');
        });

        // Loan modal (opened via customers tab actions)
        document.getElementById('loan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveLoan();
        });

        document.getElementById('cancel-loan').addEventListener('click', () => {
            this.closeModal('loan-modal');
        });

        // Removed calculate button in Add Loan modal

        // Transaction modal
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        document.getElementById('cancel-transaction').addEventListener('click', () => {
            this.closeModal('transaction-modal');
        });

        // Rates
        document.getElementById('update-gold-rate').addEventListener('click', () => {
            this.updateRate('gold');
        });

        document.getElementById('update-silver-rate').addEventListener('click', () => {
            this.updateRate('silver');
        });

        document.getElementById('update-default-interest-rate').addEventListener('click', () => {
            this.updateRate('defaultInterest');
        });

        // Data Management - Export
        document.getElementById('export-customers').addEventListener('click', () => {
            ImportExport.exportToCSV(this, 'customers');
        });

        document.getElementById('export-loans').addEventListener('click', () => {
            ImportExport.exportToCSV(this, 'loans');
        });

        document.getElementById('export-transactions').addEventListener('click', () => {
            ImportExport.exportToCSV(this, 'transactions');
        });

        document.getElementById('export-all').addEventListener('click', () => {
            ImportExport.exportAllData(this);
        });

        // Data Management - Import
        document.getElementById('import-customers').addEventListener('click', () => {
            ImportExport.importFromCSV(this, 'customers');
        });

        document.getElementById('import-loans').addEventListener('click', () => {
            ImportExport.importFromCSV(this, 'loans');
        });

        document.getElementById('import-transactions').addEventListener('click', () => {
            ImportExport.importFromCSV(this, 'transactions');
        });

        const importLegacyBtn = document.getElementById('import-legacy');
        if (importLegacyBtn) {
            importLegacyBtn.addEventListener('click', () => {
                ImportExport.importFromCSV(this, 'legacy');
            });
        }

        // Data Management - Backup & Restore
        document.getElementById('create-backup').addEventListener('click', () => {
            ImportExport.createBackup(this);
        });

        document.getElementById('restore-backup').addEventListener('click', () => {
            ImportExport.restoreBackup(this);
        });

        const toggleAutoBtn = document.getElementById('toggle-auto-backup');
        if (toggleAutoBtn) {
            toggleAutoBtn.addEventListener('click', async () => {
                if (!window.ImportExport) return;
                const wasEnabled = ImportExport.isAutoBackupEnabled();
                await ImportExport.toggleAutoBackup(this);
                this.updateAutoBackupButton();
                // Optional toast when disabling only
                if (wasEnabled && !ImportExport.isAutoBackupEnabled()) {
                    // No-op; ImportExport already alerted
                }
            });
            this.updateAutoBackupButton();
        }

        document.getElementById('import-file').addEventListener('change', (e) => {
            ImportExport.handleFileImport(this, e);
        });

        // Hide transactions section (loans tab removed)

        // Collateral Items Management
        document.getElementById('add-collateral-item').addEventListener('click', () => {
            this.addCollateralItem();
        });

        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Customers per-column filters (reusable)
        if (window.TableFiltering) {
            TableFiltering.wireInputs(['cust-filter-id','cust-filter-name','cust-filter-father','cust-filter-address'], () => this.renderCustomers());
        }


		// Transactions per-column filters (reusable)
        if (window.TableFiltering) {
            TableFiltering.wireInputs(['tx-filter-id','tx-filter-loanId','tx-filter-customer','tx-filter-loanDetails','tx-filter-type','tx-filter-amount','tx-filter-description','tx-filter-note','tx-filter-date-from','tx-filter-date-to'], () => this.renderTransactions());
        }

		// Clear Filters button
		const clearFiltersBtn = document.getElementById('clear-transaction-filters');
		if (clearFiltersBtn) {
			clearFiltersBtn.addEventListener('click', () => {
                if (window.TableFiltering) {
                    TableFiltering.clearInputs(['tx-filter-id','tx-filter-loanId','tx-filter-customer','tx-filter-loanDetails','tx-filter-type','tx-filter-amount','tx-filter-description','tx-filter-note','tx-filter-date-from','tx-filter-date-to']);
                }
				this.renderTransactions();
			});
		}

		// Customers Clear Filters button
		const clearCustomerFiltersBtn = document.getElementById('clear-customer-filters');
		if (clearCustomerFiltersBtn) {
			clearCustomerFiltersBtn.addEventListener('click', () => {
				if (window.TableFiltering) {
					TableFiltering.clearInputs(['cust-filter-id','cust-filter-name','cust-filter-father','cust-filter-address']);
				}
				this.renderCustomers();
			});
		}
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');
    }

    // Data Management (IndexedDB backed with fallback migration)
    async initFromDB() {
        try {
            const migrated = await DB.get('migrated');
            if (!migrated) {
                // migrate from localStorage if present
                const keys = ['customers','loans','transactions','rates','currentCustomerId','currentLoanId','currentTransactionId'];
                const entries = [];
                keys.forEach(k => {
                    const v = localStorage.getItem(k);
                    if (v !== null) {
                        entries.push([k, JSON.parse(v)]);
                    }
                });
                if (entries.length) await DB.bulkSet(entries);
                await DB.set('migrated', true);
            }
            this.customers = (await DB.get('customers')) || [];
            this.loans = (await DB.get('loans')) || [];
            this.transactions = (await DB.get('transactions')) || [];
            this.rates = (await DB.get('rates')) || { goldRate: 0, silverRate: 0, defaultInterestRate: 12.0 };
            this.currentCustomerId = (await DB.get('currentCustomerId')) || 1;
            this.currentLoanId = (await DB.get('currentLoanId')) || 1;
            this.currentTransactionId = (await DB.get('currentTransactionId')) || 1;
        } catch (e) {
            // fallback to previous localStorage values
            const ls = (k, d) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; };
            this.customers = ls('customers', []);
            this.loans = ls('loans', []);
            this.transactions = ls('transactions', []);
            this.rates = ls('rates', { goldRate: 0, silverRate: 0, defaultInterestRate: 12.0 });
            this.currentCustomerId = ls('currentCustomerId', 1);
            this.currentLoanId = ls('currentLoanId', 1);
            this.currentTransactionId = ls('currentTransactionId', 1);
        }
    }

    async saveData(key, data) {
        try { await DB.set(key, data); } catch (_) { localStorage.setItem(key, JSON.stringify(data)); }
    }

    // Customer Management
    openCustomerModal(customerId = null) {
        const modal = document.getElementById('customer-modal');
        const form = document.getElementById('customer-form');
        const title = document.getElementById('customer-modal-title');
        
        if (customerId) {
            const customer = this.customers.find(c => c.id === customerId);
            title.textContent = 'Edit Customer';
            document.getElementById('customer-name').value = customer.name;
            document.getElementById('customer-father').value = customer.fatherName;
            document.getElementById('customer-address').value = customer.address;
            form.dataset.customerId = customerId;
        } else {
            title.textContent = 'Add Customer';
            form.reset();
            delete form.dataset.customerId;
        }
        
        modal.style.display = 'block';
    }

    saveCustomer() {
        const form = document.getElementById('customer-form');
        const customerId = form.dataset.customerId;
        
        const customer = {
            name: document.getElementById('customer-name').value,
            fatherName: document.getElementById('customer-father').value,
            address: document.getElementById('customer-address').value
        };

        if (customerId) {
            // Update existing customer
            const index = this.customers.findIndex(c => c.id === parseInt(customerId));
            this.customers[index] = { ...customer, id: parseInt(customerId) };
        } else {
            // Add new customer
            customer.id = this.currentCustomerId++;
            this.customers.push(customer);
        }

        this.saveData('customers', this.customers);
        this.saveData('currentCustomerId', this.currentCustomerId);
        this.renderCustomers();
        this.updateDashboard();
        this.closeModal('customer-modal');
    }

    deleteCustomer(customerId) {
        if (confirm('Are you sure you want to delete this customer? This will also delete all associated loans and transactions.')) {
            this.customers = this.customers.filter(c => c.id !== customerId);
            this.loans = this.loans.filter(l => l.customerId !== customerId);
            this.transactions = this.transactions.filter(t => {
                const loan = this.loans.find(l => l.id === t.loanId);
                return loan && loan.customerId !== customerId;
            });
            
            this.saveData('customers', this.customers);
            this.saveData('loans', this.loans);
            this.saveData('transactions', this.transactions);
            this.renderCustomers();
            this.renderTransactions();
            this.updateDashboard();
        }
    }

    renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        tbody.innerHTML = '';

        let filtered = this.customers;
        if (window.TableFiltering) {
            filtered = TableFiltering.applyFilters(this.customers, [
                { inputId: 'cust-filter-id', accessor: (c) => String(c.id || '') },
                { inputId: 'cust-filter-name', accessor: (c) => c.name || '' },
                { inputId: 'cust-filter-father', accessor: (c) => c.fatherName || '' },
                { inputId: 'cust-filter-address', accessor: (c) => c.address || '' }
            ]);
        }

        filtered.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${this.escapeHTML(customer.name)}</td>
                <td>${this.escapeHTML(customer.fatherName)}</td>
                <td>${this.escapeHTML(customer.address)}</td>
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

    // Loan Management
    openLoanModal(loanId = null, customerId = null) {
        const modal = document.getElementById('loan-modal');
        const form = document.getElementById('loan-form');
        const title = document.getElementById('loan-modal-title');
        
        // Populate customer dropdown
        const customerSelect = document.getElementById('loan-customer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>';
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (ID: ${customer.id})`;
            customerSelect.appendChild(option);
        });
        // Reset disabled state by default; will be locked if opened from a specific context
        customerSelect.disabled = false;

        // Reset collateral items container
        this.resetCollateralItems();

        if (loanId) {
            const loan = this.loans.find(l => l.id === loanId);
            title.textContent = 'Edit Loan';
            document.getElementById('loan-customer').value = loan.customerId;
            // Lock customer selection when editing an existing loan
            customerSelect.disabled = true;
            const irEl = document.getElementById('loan-interest-rate');
            if (irEl) irEl.value = loan.interestRate;
            
            // // Show interest rate field for editing
            // document.getElementById('interest-rate-group').style.display = 'block';
            
            // Populate collateral items
            this.populateCollateralItems(loan.collateralItems);
            form.dataset.loanId = loanId;
            // Set loan date from existing collateral transaction if present
            const existingCollateralTx = this.transactions.find(t => t.loanId === parseInt(loanId) && (t.type || '').toLowerCase() === 'collateral');
            document.getElementById('loan-date').value = existingCollateralTx ? existingCollateralTx.date : new Date().toISOString().split('T')[0];
        } else {
            title.textContent = 'Add Loan';
            form.reset();
            this.resetCollateralItems();
            delete form.dataset.loanId;
            
            // Set default interest rate for new loans
            const irEl = document.getElementById('loan-interest-rate');
            if (irEl) irEl.value = this.rates.defaultInterestRate;
            
            // Pre-select customer if provided
            if (customerId) {
                document.getElementById('loan-customer').value = customerId;
                // Lock customer selection when opened from a specific customer's Add Loan button
                customerSelect.disabled = true;
            }
            // Default loan date to today
            document.getElementById('loan-date').value = new Date().toISOString().split('T')[0];
        }
        
        modal.style.display = 'block';
    }

    saveLoan() {
        const form = document.getElementById('loan-form');
        const loanId = form.dataset.loanId;
        
        // Collect collateral items
        const collateralItems = this.collectCollateralItems();
        const loanDate = (document.getElementById('loan-date').value || '').trim();
        
        if (collateralItems.length === 0) {
            alert('Please add at least one collateral item.');
            return;
        }
        if (!loanDate) {
            alert('Please select a valid loan date.');
            return;
        }

        const interestInput = document.getElementById('loan-interest-rate');
        const interestRate = parseFloat(interestInput && interestInput.value ? interestInput.value : this.rates.defaultInterestRate);
        const loan = {
            customerId: parseInt(document.getElementById('loan-customer').value),
            interestRate: Number.isFinite(interestRate) ? interestRate : this.rates.defaultInterestRate,
            collateralItems: collateralItems
        };

        if (loanId) {
            // Update existing loan
            const index = this.loans.findIndex(l => l.id === parseInt(loanId));
            this.loans[index] = { ...loan, id: parseInt(loanId) };
            // Ensure a COLLATERAL transaction represents this loan state
            const existingCollateralTx = this.transactions.find(t => t.loanId === parseInt(loanId) && (t.type || '').toLowerCase() === 'collateral');
            if (existingCollateralTx) {
                existingCollateralTx.description = this.formatCollateralItems(this.loans[index]);
                existingCollateralTx.amount = 0;
                existingCollateralTx.date = loanDate;
            } else {
                this.transactions.push({
                    id: this.currentTransactionId++,
                    loanId: parseInt(loanId),
                    type: 'collateral',
                    amount: 0,
                    description: this.formatCollateralItems(this.loans[index]),
                    date: loanDate
                });
            }
            // Recompute net principal as of latest transaction date for this loan
            const lastTxDate = this.getTransactionsSorted(parseInt(loanId)).slice(-1)[0]?.date || loanDate;
            this.updateLoanNetDue(parseInt(loanId), lastTxDate);
        } else {
            // Add new loan
            loan.id = this.currentLoanId++;
            loan.netDue = 0; // Calculated from transactions
            loan.netDate = loanDate;
            loan.netPrincipal = 0;
            loan.asOfDate = loanDate;
            this.loans.push(loan);

            // Create a COLLATERAL transaction to represent the loan creation
            this.transactions.push({
                id: this.currentTransactionId++,
                loanId: loan.id,
                type: 'collateral',
                amount: 0,
                description: this.formatCollateralItems(loan),
                date: loanDate
            });
            // Net principal remains 0 at creation; save
            this.saveData('loans', this.loans);
        }

        this.saveData('loans', this.loans);
        this.saveData('currentLoanId', this.currentLoanId);
        this.saveData('transactions', this.transactions);
        this.saveData('currentTransactionId', this.currentTransactionId);
        this.updateDashboard();
        this.closeModal('loan-modal');
    }

    deleteLoan(loanId) {
        const loan = this.loans.find(l => l.id === loanId);
        const customerId = loan ? loan.customerId : null;
        if (confirm('Are you sure you want to delete this loan? This will also delete all associated transactions.')) {
            this.loans = this.loans.filter(l => l.id !== loanId);
            this.transactions = this.transactions.filter(t => t.loanId !== loanId);
            
            this.saveData('loans', this.loans);
            this.saveData('transactions', this.transactions);
            this.renderTransactions();
            this.updateDashboard();
            const modal = document.getElementById('customer-loans-modal');
            if (modal && modal.style.display === 'block' && customerId) {
                this.viewCustomerLoans(customerId);
            }
        }
    }

    // renderLoans removed (loans tab deleted); loan views are accessed via customer modal

    // Transaction Management
    openTransactionModal(transactionId = null, preselectLoanId = null) {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const title = document.getElementById('transaction-modal-title');
        
        // Populate loan dropdown
        const loanSelect = document.getElementById('transaction-loan');
        loanSelect.innerHTML = '<option value="">Select Loan</option>';
        this.loans.forEach(loan => {
            const customer = this.customers.find(c => c.id === loan.customerId);
            const customerName = customer ? customer.name : 'Unknown Customer';
            const option = document.createElement('option');
            option.value = loan.id;
            option.textContent = `Loan ${loan.id} - ${customerName}`;
            loanSelect.appendChild(option);
        });

        if (transactionId) {
            const transaction = this.transactions.find(t => t.id === transactionId);
            title.textContent = 'Edit Transaction';
            document.getElementById('transaction-loan').value = transaction.loanId;
            document.getElementById('transaction-type').value = transaction.type;
            document.getElementById('transaction-amount').value = transaction.amount;
            const noteEl = document.getElementById('transaction-note');
            if (noteEl) noteEl.value = transaction.note || '';
            document.getElementById('transaction-date').value = transaction.date;
            form.dataset.transactionId = transactionId;
            // Setup RETURN_ITEMS UI for edit
            this.updateReturnItemsVisibility();
            if ((transaction.type || '').toLowerCase() === 'return_items') {
                const labels = (transaction.description || '').split(':')[1] || '';
                const selected = new Set(labels.split(',').map(s => s.trim()).filter(Boolean));
                this.renderReturnItemsChecklist(transaction.loanId, selected);
            }
        } else {
            title.textContent = 'Add Transaction';
            form.reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
            if (preselectLoanId) {
                document.getElementById('transaction-loan').value = preselectLoanId;
            }
            delete form.dataset.transactionId;
            this.updateReturnItemsVisibility();
        }
        
        modal.style.display = 'block';

        // Wire changes for type and loan to update RETURN_ITEMS UI
        const typeEl = document.getElementById('transaction-type');
        const loanEl = document.getElementById('transaction-loan');
        typeEl.onchange = () => this.updateReturnItemsVisibility();
        loanEl.onchange = () => this.updateReturnItemsVisibility();
    }

    saveTransaction() {
        const form = document.getElementById('transaction-form');
        const transactionId = form.dataset.transactionId;
        
        const typeVal = document.getElementById('transaction-type').value;
        const transaction = {
            loanId: parseInt(document.getElementById('transaction-loan').value),
            type: typeVal,
            amount: (typeVal && typeVal.toLowerCase() === 'return_items') ? 0 : parseFloat(document.getElementById('transaction-amount').value),
            description: '',
            note: (document.getElementById('transaction-note').value || '').trim(),
            date: document.getElementById('transaction-date').value
        };

        // If RETURN_ITEMS, collect selected items
        if ((transaction.type || '').toLowerCase() === 'return_items') {
            const container = document.getElementById('return-items-list');
            const selectedLabels = [];
            if (container) {
                container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (cb.checked) selectedLabels.push(cb.dataset.label);
                });
            }
            transaction.description = selectedLabels.length ? `Returned: ${selectedLabels.join(', ')}` : 'Returned:';

            // Update the loan's collateral items to remove the returned items
            const loan = this.loans.find(l => l.id === transaction.loanId);
            if (loan && Array.isArray(loan.collateralItems) && selectedLabels.length) {
                const selectedSet = new Set(selectedLabels);
                const remaining = loan.collateralItems.filter(item => !selectedSet.has(this.buildCollateralItemLabel(item)));
                loan.collateralItems = remaining;
                // Persist loan changes
                this.saveData('loans', this.loans);
            }
        }

        if (transactionId) {
            // Update existing transaction
            const index = this.transactions.findIndex(t => t.id === parseInt(transactionId));
            this.transactions[index] = { ...transaction, id: parseInt(transactionId) };
        } else {
            // Add new transaction
            transaction.id = this.currentTransactionId++;
            this.transactions.push(transaction);
        }

        this.saveData('transactions', this.transactions);
        this.saveData('currentTransactionId', this.currentTransactionId);
        // Update loan effective principal (interest-aware) after this transaction
        this.updateLoanEffectivePrincipal(transaction.loanId);
        this.renderTransactions();
        this.updateDashboard();
        this.closeModal('transaction-modal');
    }

    updateReturnItemsVisibility() {
        const container = document.getElementById('return-items-container');
        if (!container) return;
        const typeVal = (document.getElementById('transaction-type').value || '').toLowerCase();
        const loanId = parseInt(document.getElementById('transaction-loan').value);
        if (typeVal === 'return_items' && Number.isFinite(loanId)) {
            container.style.display = 'block';
            this.renderReturnItemsChecklist(loanId);
        } else {
            container.style.display = 'none';
            const list = document.getElementById('return-items-list');
            if (list) list.innerHTML = '';
        }

        // Toggle Amount field for RETURN_ITEMS
        const amountInput = document.getElementById('transaction-amount');
        if (amountInput) {
            const amountGroup = amountInput.closest('.form-group');
            if (typeVal === 'return_items') {
                if (amountGroup) amountGroup.style.display = 'none';
                amountInput.disabled = true;
                amountInput.removeAttribute('required');
                amountInput.value = '0';
            } else {
                if (amountGroup) amountGroup.style.display = 'block';
                amountInput.disabled = false;
                amountInput.setAttribute('required', '');
            }
        }
    }

    renderReturnItemsChecklist(loanId, preselectedSet = new Set()) {
        const list = document.getElementById('return-items-list');
        if (!list) return;
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan || !loan.collateralItems || loan.collateralItems.length === 0) {
            list.innerHTML = '<div class="text-muted">No collateral items found for this loan.</div>';
            return;
        }
        list.innerHTML = '';
        loan.collateralItems.forEach((item, idx) => {
            const label = this.buildCollateralItemLabel(item);
            const id = `return-item-${idx}`;
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.marginBottom = '6px';
            wrapper.innerHTML = `
                <input type="checkbox" id="${id}" data-label="${this.escapeHTML(label)}">
                <label for="${id}">${this.escapeHTML(label)}</label>
            `;
            list.appendChild(wrapper);
            if (preselectedSet.has(label)) {
                const cb = wrapper.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = true;
            }
        });
    }

    buildCollateralItemLabel(item) {
        const parts = [];
        if (item.metalType) parts.push(item.metalType.charAt(0).toUpperCase() + item.metalType.slice(1));
        if (item.name) parts.push(item.name);
        if (Number(item.weight) > 0) parts.push(`${item.weight}g`);
        if (Number(item.purity) > 0) parts.push(this.formatPurityTag(item.purity));
        return parts.join(' ').trim();
    }

    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const tx = this.transactions.find(t => t.id === transactionId);
            this.transactions = this.transactions.filter(t => t.id !== transactionId);
            
            this.saveData('transactions', this.transactions);
            if (tx) {
                // Recalculate effective principal for this loan
                this.updateLoanEffectivePrincipal(tx.loanId);
            }
            this.renderTransactions();
            this.updateDashboard();
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactions-tbody');
        tbody.innerHTML = '';

        // Apply reusable per-column filtering
        let filteredTransactions = this.transactions;
        if (window.TableFiltering) {
            filteredTransactions = TableFiltering.applyFilters(this.transactions, [
                { inputId: 'tx-filter-id', accessor: (t) => String(t.id || '') },
                { inputId: 'tx-filter-loanId', accessor: (t) => String(t.loanId || '') },
                { inputId: 'tx-filter-customer', accessor: (t) => {
                    const loan = this.loans.find(l => l.id === t.loanId);
                    const customer = loan ? this.customers.find(c => c.id === loan.customerId) : null;
                    return customer ? (customer.name || '') : '';
                } },
                { inputId: 'tx-filter-loanDetails', accessor: (t) => {
                    const loan = this.loans.find(l => l.id === t.loanId);
                    return loan ? `${this.formatMonthlyRate(loan.interestRate)} - ${this.formatCollateralItems(loan)}` : '';
                } },
                { inputId: 'tx-filter-type', accessor: (t) => t.type || '' },
                { inputId: 'tx-filter-amount', accessor: (t) => String(t.amount || '') },
                { inputId: 'tx-filter-description', accessor: (t) => t.description || '' },
                { inputId: 'tx-filter-note', accessor: (t) => t.note || '' }
            ]);
        }

        // Apply date range filter
        const fromEl = document.getElementById('tx-filter-date-from');
        const toEl = document.getElementById('tx-filter-date-to');
        const fromVal = fromEl && fromEl.value ? new Date(fromEl.value) : null;
        const toVal = toEl && toEl.value ? new Date(toEl.value) : null;
        let dateFiltered = filteredTransactions;
        if (fromVal || toVal) {
            dateFiltered = filteredTransactions.filter(t => {
                const td = new Date(t.date);
                if (fromVal && td < fromVal) return false;
                if (toVal) {
                    const end = new Date(toEl.value);
                    end.setHours(23,59,59,999);
                    if (td > end) return false;
                }
                return true;
            });
        }

        // Sort by date ascending, then by ID to break ties
        const sortedFiltered = [...dateFiltered].sort((a, b) => {
            const da = new Date(a.date), db = new Date(b.date);
            if (da - db !== 0) return da - db;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
        });
        sortedFiltered.forEach(transaction => {
            const loan = this.loans.find(l => l.id === transaction.loanId);
            const customer = loan ? this.customers.find(c => c.id === loan.customerId) : null;
            const customerName = customer ? this.escapeHTML(customer.name) : 'Unknown Customer';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${transaction.loanId}</td>
                <td>${customerName}</td>
                <td>${loan ? `${this.formatMonthlyRate(loan.interestRate)} - ${this.formatCollateralItems(loan)}` : '-'}</td>
                <td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : (transaction.type === 'debit' ? 'badge-danger' : 'badge')}">${transaction.type.toUpperCase()}</span></td>
                <td>${this.formatCurrency(transaction.amount)}</td>
                <td>${transaction.description ? this.escapeHTML(transaction.description) : '-'}</td>
                <td>${transaction.note ? this.escapeHTML(transaction.note) : '-'}</td>
                <td>${this.formatDate(transaction.date)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="app.openTransactionModal(${transaction.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Rates Management
    updateRate(type) {
        let rateInput, rateKey, displayName;
        
        if (type === 'defaultInterest') {
            rateInput = document.getElementById('default-interest-rate');
            rateKey = 'defaultInterestRate';
            displayName = 'Default Monthly Interest';
        } else {
            rateInput = document.getElementById(`${type}-rate`);
            rateKey = `${type}Rate`;
            displayName = type.charAt(0).toUpperCase() + type.slice(1);
        }
        
        const rate = parseFloat(rateInput.value);
        
        if (isNaN(rate) || rate < 0) {
            alert('Please enter a valid rate');
            return;
        }

        this.rates[rateKey] = rate;
        this.saveData('rates', this.rates);
        this.updateRates();
        
        alert(`${displayName} rate updated successfully!`);
    }

    updateRates() {
        document.getElementById('gold-rate').value = this.rates.goldRate;
        document.getElementById('silver-rate').value = this.rates.silverRate;
        document.getElementById('default-interest-rate').value = this.rates.defaultInterestRate;
    }

    updateAutoBackupButton() {
        const btn = document.getElementById('toggle-auto-backup');
        if (!btn || !window.ImportExport) return;
        const enabled = ImportExport.isAutoBackupEnabled();
        btn.classList.remove('btn-primary','btn-secondary');
        if (enabled) {
            btn.classList.add('btn-secondary');
            btn.innerHTML = '<i class="fas fa-clock"></i> Auto Backup: ON (Click to Disable)';
        } else {
            btn.classList.add('btn-primary');
            btn.innerHTML = '<i class="fas fa-clock"></i> Enable Auto Backup (Hourly)';
        }
    }

    // Dashboard
    updateDashboard() {
        const totalCustomers = this.customers.length;
        const totalLoans = this.loans.length;
        const totalTransactions = this.transactions.length;
        
        // Calculate total outstanding principal amount using stored netDue when present
        let totalOutstanding = 0;
        this.loans.forEach(loan => {
            const netDue = (typeof loan.netDue === 'number') ? loan.netDue : this.calculateNetDue(loan.id);
            totalOutstanding += netDue;
        });

        document.getElementById('total-customers').textContent = totalCustomers;
        document.getElementById('total-loans').textContent = totalLoans;
        document.getElementById('total-outstanding').textContent = this.formatCurrency(totalOutstanding);
        document.getElementById('total-transactions').textContent = totalTransactions;
    }

    // Utility Methods
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
    }

    // Formatting and calculations
    escapeHTML(value) {
        const str = String(value == null ? '' : value);
        return str.replace(/[&<>"]|'/g, (ch) => {
            switch (ch) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return ch;
            }
        });
    }

    formatCurrency(amount) {
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return formatter.format(Number(amount) || 0);
    }
    // Principal outstanding helpers (debits - credits) up to a given date (inclusive)
    getTransactionsSorted(loanId) {
        const txs = this.getLoanTransactions(loanId);
        return [...txs].sort((a, b) => {
            const da = new Date(a.date), db = new Date(b.date);
            if (da - db !== 0) return da - db;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
        });
    }

    computePrincipalOutstandingUpToDate(loanId, asOfDate) {
        const sorted = this.getTransactionsSorted(loanId);
        let principal = 0;
        const cutoff = asOfDate ? new Date(asOfDate) : null;
        for (const t of sorted) {
            const td = new Date(t.date);
            if (cutoff && td > cutoff) break;
            if ((t.type || '').toLowerCase() === 'debit') principal += Number(t.amount) || 0;
            else if ((t.type || '').toLowerCase() === 'credit') principal -= Number(t.amount) || 0;
        }
        return principal;
    }

    updateLoanNetDue(loanId, asOfDate) {
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan) return;
        const dateISO = asOfDate || (this.getTransactionsSorted(loanId).slice(-1)[0]?.date) || new Date().toISOString().split('T')[0];
        const principal = this.computePrincipalOutstandingUpToDate(loanId, dateISO);
        loan.netDue = Number(principal.toFixed(2));
        loan.netDate = dateISO;
        this.saveData('loans', this.loans);
    }

    // Compute NetPrincipal and AsOfDate using interest-aware schedule
    updateLoanEffectivePrincipal(loanId) {
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan) return;
        const txs = this.getLoanTransactions(loanId);
        if (!window.Finance) {
            // Fallback to principal-only method
            this.updateLoanNetDue(loanId);
            // Mirror into new fields
            loan.netPrincipal = loan.netDue;
            loan.asOfDate = loan.netDate;
            this.saveData('loans', this.loans);
            return;
        }
        const schedule = window.Finance.calculateLoanSchedule(loan, txs);
        let lastChangeDate = null;
        let prevPrincipal = 0;
        // Iterate schedule entries (aligned to each transaction date)
        (schedule.entries || []).forEach((e, idx) => {
            if (idx === 0) {
                if (e.principalDue !== 0) lastChangeDate = e.date;
            } else {
                if (e.principalDue !== prevPrincipal) {
                    lastChangeDate = e.date;
                }
            }
            prevPrincipal = e.principalDue;
        });
        const finalPrincipal = schedule.today ? schedule.today.principalDue : (schedule.entries?.slice(-1)[0]?.principalDue || 0);
        // Also reconcile collateral items based on RETURN_ITEMS transactions (in case earlier step missed it)
        try {
            const returnedLabels = new Set();
            txs.filter(t => (t.type || '').toLowerCase() === 'return_items').forEach(t => {
                const desc = String(t.description || '');
                const after = desc.includes(':') ? desc.split(':').slice(1).join(':') : desc;
                after.split(',').forEach(s => { const lbl = s.trim(); if (lbl) returnedLabels.add(lbl); });
            });
            if (returnedLabels.size && Array.isArray(loan.collateralItems)) {
                const remaining = loan.collateralItems.filter(item => !returnedLabels.has(this.buildCollateralItemLabel(item)));
                if (remaining.length !== loan.collateralItems.length) {
                    loan.collateralItems = remaining;
                }
            }
        } catch (_) { /* ignore parsing issues */ }
        // Update fields: new durable fields, and keep legacy in sync
        loan.netPrincipal = Number(Number(finalPrincipal).toFixed(2));
        loan.asOfDate = lastChangeDate || (schedule.entries?.slice(-1)[0]?.date) || new Date().toISOString().split('T')[0];
        loan.netDue = loan.netPrincipal;
        loan.netDate = loan.asOfDate;
        this.saveData('loans', this.loans);
    }


    formatCurrencyNoDecimals(amount) {
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(Math.round(Number(amount) || 0));
    }

    formatDate(value) {
        return new Date(value).toLocaleDateString();
    }

    trimTrailingZeros(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return String(value || '');
        const s = String(n);
        if (s.includes('e') || s.includes('E')) return n.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
        return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }

    formatMonthlyRate(ratePct) {
        const trimmed = this.trimTrailingZeros(ratePct);
        return `R${trimmed}`;
    }

    formatPurityTag(pct) {
        const trimmed = this.trimTrailingZeros(pct);
        return `[P${trimmed}]`;
    }

    sanitizeDescriptionRaw(text) {
        if (!text) return '';
        let out = String(text);
        out = out.replace(/\b0g\s*\(0%\)\b/gi, '');
        out = out.replace(/\s{2,}/g, ' ').replace(/\s*,\s*,/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '');
        return out.trim();
    }

    // one-time migration removed as per request

    getLoanTransactions(loanId) {
        return this.transactions.filter(t => t.loanId === loanId);
    }

    calculateNetDue(loanId) {
        const loanTransactions = this.getLoanTransactions(loanId);
        let netDue = 0;
        loanTransactions.forEach(transaction => {
            if (transaction.type === 'credit') {
                netDue -= transaction.amount; // Payment reduces due amount
            } else if (transaction.type === 'debit') {
                netDue += transaction.amount; // Disbursement increases due amount
            }
        });
        return netDue;
    }

    calculateTransactionTotals(transactions) {
        let totalCredit = 0;
        let totalDebit = 0;
        transactions.forEach(t => {
            if (t.type === 'credit') totalCredit += t.amount;
            else if (t.type === 'debit') totalDebit += t.amount;
        });
        return { totalCredit, totalDebit, netAmount: totalDebit - totalCredit };
    }

    // Helper function to format collateral items display
    formatCollateralItems(loan) {
        if (loan.collateralItems && loan.collateralItems.length > 0) {
            return loan.collateralItems.map(item => {
                const parts = [];
                if (item.metalType) parts.push(this.escapeHTML(item.metalType.charAt(0).toUpperCase() + item.metalType.slice(1)));
                if (item.name) parts.push(this.escapeHTML(item.name));
                if (Number(item.weight) > 0) parts.push(`${item.weight}g`);
                if (Number(item.purity) > 0) parts.push(this.formatPurityTag(item.purity));
                return parts.join(' ').trim();
            }).join(', ');
        } else if (loan.collateral) {
            const parts = [];
            if (loan.collateral.item) parts.push(this.escapeHTML(loan.collateral.item));
            if (Number(loan.collateral.weight) > 0) parts.push(`${loan.collateral.weight}g`);
            if (Number(loan.collateral.purity) > 0) parts.push(this.formatPurityTag(loan.collateral.purity));
            return parts.join(' ').trim() || 'No collateral';
        } else {
            return 'No collateral';
        }
    }

    // Customer Loans View
    viewCustomerLoans(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            alert('Customer not found!');
            return;
        }

        const customerLoans = this.loans.filter(l => l.customerId === customerId);
        
        // Update modal title
        document.getElementById('customer-loans-modal-title').textContent = `Loans - ${customer.name}`;
        
        // Populate customer info
        this.populateCustomerInfo(customer);
        
        // Populate loans summary
        this.populateLoansSummary(customerLoans);
        
        // Populate loans table
        this.populateCustomerLoansTable(customerLoans);

        // Reset/hide transactions sub-section when switching customers or reopening modal
        const txSection = document.getElementById('transactions-section');
        if (txSection) {
            txSection.style.display = 'none';
        }
        const txTbody = document.getElementById('customer-transactions-tbody');
        if (txTbody) {
            txTbody.innerHTML = '';
        }
        const txThead = document.querySelector('#customer-transactions-table thead tr');
        if (txThead) {
            txThead.innerHTML = `
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
            `;
        }
        
        // Show modal
        document.getElementById('customer-loans-modal').style.display = 'block';
    }

    populateCustomerInfo(customer) {
        const customerInfo = document.getElementById('customer-loans-info');
        customerInfo.innerHTML = `
            <div class="customer-details">
                <h4><i class="fas fa-user"></i> Customer Details</h4>
                <div class="customer-details-grid">
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${customer.name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Father's Name:</label>
                        <span>${customer.fatherName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Address:</label>
                        <span>${customer.address}</span>
                    </div>
                    <div class="detail-item">
                        <label>Customer ID:</label>
                        <span>${customer.id}</span>
                    </div>
                </div>
            </div>
        `;
    }

    populateLoansSummary(customerLoans) {
        const summary = document.getElementById('loans-summary');
        
        const totalLoans = customerLoans.length;
        let totalOutstanding = 0;
        let totalCollateralItems = 0;
        let totalCollateralValue = 0; // INR value based on weight * purity * metal rate
        
        customerLoans.forEach(loan => {
            // Calculate net due for this loan (prefer stored principal)
            const netDue = (typeof loan.netDue === 'number') ? loan.netDue : this.calculateNetDue(loan.id);
            totalOutstanding += netDue;
            
            // Count collateral items and compute collateral value
            if (loan.collateralItems && loan.collateralItems.length > 0) {
                totalCollateralItems += loan.collateralItems.length;
                loan.collateralItems.forEach(item => {
                    const weight = Number(item.weight) || 0;
                    const purity = Number(item.purity) || 0; // percent
                    const netWeight = weight * (purity / 100);
                    const rate = (item.metalType === 'gold') ? (Number(this.rates.goldRate) || 0)
                              : (item.metalType === 'silver') ? (Number(this.rates.silverRate) || 0)
                              : 0;
                    totalCollateralValue += netWeight * rate;
                });
            } else if (loan.collateral) {
                totalCollateralItems += 1;
                const weight = Number(loan.collateral.weight) || 0;
                const purity = Number(loan.collateral.purity) || 0;
                const netWeight = weight * (purity / 100);
                // Legacy collateral may not have metal type – skip value if unknown
                const rate = 0;
                totalCollateralValue += netWeight * rate;
            }
        });
        
        summary.innerHTML = `
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-hand-holding-usd"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${totalLoans}</h3>
                        <p>Total Loans</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="summary-content">
                        <h3 class="${totalOutstanding > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(totalOutstanding)}</h3>
                        <p>Total Outstanding</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-gem"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${totalCollateralItems}</h3>
                        <p>Collateral Items</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${this.formatCurrencyNoDecimals(totalCollateralValue)}</h3>
                        <p>Estimated Collateral Value</p>
                    </div>
                </div>
            </div>
        `;
    }

    populateCustomerLoansTable(customerLoans) {
        const tbody = document.getElementById('customer-loans-tbody');
        tbody.innerHTML = '';

        customerLoans.forEach(loan => {
            // Net due principal: prefer stored interest-aware value
            const netDue = (typeof loan.netPrincipal === 'number') ? loan.netPrincipal
                : (typeof loan.netDue === 'number') ? loan.netDue
                : this.calculateNetDue(loan.id);

            // Format collateral items display using helper function
            const collateralDisplay = this.formatCollateralItems(loan);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.id}</td>
                <td>${this.formatMonthlyRate(loan.interestRate)}</td>
                <td>${collateralDisplay}</td>
                <td class="${netDue > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(netDue)}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="app.viewLoanTransactions(${loan.id})">
                        <i class="fas fa-list"></i> View Transactions
                    </button>
                    <button class="btn btn-success btn-sm" onclick="app.openTransactionModal(null, ${loan.id}); app.closeModal('customer-loans-modal');">
                        <i class="fas fa-plus"></i> Add Transaction
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="app.openLoanModal(${loan.id}); app.closeModal('customer-loans-modal');">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteLoan(${loan.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    viewLoanTransactions(loanId) {
        const loanTransactions = this.transactions.filter(t => t.loanId === loanId);
        const transactionsSection = document.getElementById('transactions-section');
        const transactionsTbody = document.getElementById('customer-transactions-tbody');
        
        if (loanTransactions.length === 0) {
            transactionsTbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No transactions found for this loan</td>
                </tr>
            `;
        } else {
            transactionsTbody.innerHTML = '';
            // Compute schedule entries
            let schedule = { entries: [], today: null };
            if (window.Finance) {
                const loan = this.loans.find(l => l.id === loanId);
                schedule = window.Finance.calculateLoanSchedule(loan, loanTransactions);
            }
            const mapDateToDue = new Map(schedule.entries.map(e => [e.date, e]));

            // Header may need dues columns
        const thead = document.querySelector('#customer-transactions-table thead tr');
        if (thead && thead.children.length === 4) {
            thead.innerHTML = `
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Items</th>
                <th>Principal Due</th>
                <th>Interest Due</th>
            `;
        }

            // Sort by date ascending, then by ID to break ties
            const sortedByDate = [...loanTransactions].sort((a, b) => {
                const da = new Date(a.date), db = new Date(b.date);
                if (da - db !== 0) return da - db;
                return (Number(a.id) || 0) - (Number(b.id) || 0);
            });
            sortedByDate.forEach(transaction => {
                const row = document.createElement('tr');
                const due = mapDateToDue.get(transaction.date);
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-danger'}">${transaction.type.toUpperCase()}</span></td>
                    <td>${this.formatCurrency(transaction.amount)}</td>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${transaction.description ? this.escapeHTML(transaction.description) : '-'}</td>
                    <td>${due ? this.formatCurrency(due.principalDue) : '-'}</td>
                    <td>${due ? this.formatCurrency(due.interestDue) : '-'}</td>
                `;
                transactionsTbody.appendChild(row);
            });

            // Append Today row with highlight and items based on transactions (remaining collateral)
            if (schedule.today) {
                const row = document.createElement('tr');
                row.className = 'today-row';
                const remainingLabels = this.getRemainingCollateralLabels(loanId);
                const itemsText = remainingLabels.length ? remainingLabels.join(', ') : '—';
                row.innerHTML = `
                    <td>—</td>
                    <td><span class="badge badge-info">TODAY</span></td>
                    <td>—</td>
                    <td>${this.formatDate(schedule.today.date)}</td>
                    <td>${itemsText}</td>
                    <td>${this.formatCurrency(schedule.today.principalDue)}</td>
                    <td>${this.formatCurrency(schedule.today.interestDue)}</td>
                `;
                transactionsTbody.appendChild(row);
            }
        }
        
        transactionsSection.style.display = 'block';
        transactionsSection.scrollIntoView({ behavior: 'smooth' });
    }

    getRemainingCollateralLabels(loanId) {
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan) return [];
        const baseLabels = (loan.collateralItems || []).map(item => this.buildCollateralItemLabel(item));
        const returned = new Set();
        const txs = this.transactions.filter(t => t.loanId === loanId && (t.type || '').toLowerCase() === 'return_items');
        txs.forEach(t => {
            const desc = t.description || '';
            const parts = desc.split(':');
            if (parts.length > 1) {
                parts[1].split(',').forEach(s => {
                    const label = s.trim();
                    if (label) returned.add(label);
                });
            }
        });
        return baseLabels.filter(lbl => !returned.has(lbl));
    }

    // Loan Transactions from Main Table
    viewLoanTransactionsFromTable(loanId) {
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan) {
            alert('Loan not found!');
            return;
        }

        const customer = this.customers.find(c => c.id === loan.customerId);
        const customerName = customer ? customer.name : 'Unknown Customer';
        const loanTransactions = this.transactions.filter(t => t.loanId === loanId);
        
        // Update section title
        document.getElementById('loan-transactions-title').textContent = `Transactions - Loan ${loanId} (${customerName})`;
        
        // Populate loan info
        this.populateSelectedLoanInfo(loan, customerName);
        
        // Add calculate button and results slot
        const loanInfoCard = document.getElementById('selected-loan-info');
        const existingCalcBar = loanInfoCard.querySelector('.calc-bar');
        if (!existingCalcBar) {
            const calcBar = document.createElement('div');
            calcBar.className = 'calc-bar';
            calcBar.style.display = 'flex';
            calcBar.style.justifyContent = 'space-between';
            calcBar.style.alignItems = 'center';
            calcBar.style.marginTop = '10px';
            calcBar.innerHTML = `
                <button class="btn btn-primary btn-sm" id="calculate-loan-dues-btn">
                    <i class="fas fa-calculator"></i> Calculate
                </button>
                <div id="loan-dues-results" class="loan-dues-results"></div>
            `;
            loanInfoCard.appendChild(calcBar);
        }

        // Populate transactions summary
        this.populateLoansTransactionsSummary(loanTransactions);
        
        // Populate transactions table
        this.populateLoansTransactionsTable(loanTransactions);
        
        // Show transactions section
        document.getElementById('loan-transactions-section').style.display = 'block';
        
        // Scroll to transactions section
        document.getElementById('loan-transactions-section').scrollIntoView({ behavior: 'smooth' });

        // Wire calculate button
        const calcBtn = document.getElementById('calculate-loan-dues-btn');
        if (calcBtn) {
            calcBtn.onclick = () => this.calculateAndRenderLoanDues(loan);
        }
    }

    calculateAndRenderLoanDues(loan) {
        if (!window.Finance) {
            alert('Finance module not loaded');
            return;
        }
        const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
        const result = window.Finance.calculateLoanDues(loan, loanTransactions);
        const el = document.getElementById('loan-dues-results');
        if (el) {
            el.innerHTML = `
                <div class="summary-cards" style="margin-top: 10px;">
                    <div class="summary-card"><div class="summary-content"><p>Principal Disbursed</p><h3>${this.formatCurrency(result.principalDisbursed)}</h3></div></div>
                    <div class="summary-card"><div class="summary-content"><p>Payments Received</p><h3>${this.formatCurrency(result.paymentsReceived)}</h3></div></div>
                    <div class="summary-card"><div class="summary-content"><p>Principal Due</p><h3 class="${result.principalDue > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(result.principalDue)}</h3></div></div>
                    <div class="summary-card"><div class="summary-content"><p>Interest Due</p><h3 class="${result.interestDue > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(result.interestDue)}</h3></div></div>
                    <div class="summary-card"><div class="summary-content"><p>Total Due</p><h3 class="${result.totalDue > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(result.totalDue)}</h3></div></div>
                </div>
            `;
        }
    }

    hideLoanTransactions() {
        document.getElementById('loan-transactions-section').style.display = 'none';
    }

    populateSelectedLoanInfo(loan, customerName) {
        const loanInfo = document.getElementById('selected-loan-info');
        const collateralDisplay = this.formatCollateralItems(loan);
        
        // Calculate net due
        const netDue = (typeof loan.netDue === 'number') ? loan.netDue : this.calculateNetDue(loan.id);
        
        loanInfo.innerHTML = `
            <div class="selected-loan-details">
                <h4><i class="fas fa-hand-holding-usd"></i> Selected Loan Details</h4>
                <div class="selected-loan-grid">
                    <div class="detail-item">
                        <label>Loan ID:</label>
                        <span>${loan.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Customer:</label>
                        <span>${this.escapeHTML(customerName)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Interest Rate:</label>
                        <span>${this.formatMonthlyRate(loan.interestRate)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Net Due:</label>
                        <span class="${netDue > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(netDue)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Net Date:</label>
                        <span>${loan.netDate ? this.formatDate(loan.netDate) : '-'}</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Collateral Items:</label>
                        <span>${collateralDisplay}</span>
                    </div>
                </div>
            </div>
        `;
    }

    populateLoansTransactionsSummary(loanTransactions) {
        const summary = document.getElementById('loans-transactions-summary');
        
        const totalTransactions = loanTransactions.length;
        const { totalCredit, totalDebit, netAmount } = this.calculateTransactionTotals(loanTransactions);
        
        summary.innerHTML = `
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${totalTransactions}</h3>
                        <p>Total Transactions</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-arrow-up text-success"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${this.formatCurrency(totalDebit)}</h3>
                        <p>Total Disbursed</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-arrow-down text-danger"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${this.formatCurrency(totalCredit)}</h3>
                        <p>Total Received</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-balance-scale"></i>
                    </div>
                    <div class="summary-content">
                        <h3 class="${netAmount > 0 ? 'text-danger' : 'text-success'}">${this.formatCurrency(netAmount)}</h3>
                        <p>Net Outstanding</p>
                    </div>
                </div>
            </div>
        `;
    }

    populateLoansTransactionsTable(loanTransactions) {
        const tbody = document.getElementById('loans-transactions-tbody');
        tbody.innerHTML = '';

        if (loanTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No transactions found for this loan</td>
                </tr>
            `;
            return;
        }

        // Sort transactions by date (oldest first), then by ID to break ties
        const sortedTransactions = [...loanTransactions].sort((a, b) => {
            const da = new Date(a.date), db = new Date(b.date);
            if (da - db !== 0) return da - db;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
        });

        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-danger'}">${transaction.type.toUpperCase()}</span></td>
                <td>${this.formatCurrency(transaction.amount)}</td>
                <td>${this.formatDate(transaction.date)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="app.openTransactionModal(${transaction.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteTransaction(${transaction.id}); app.viewLoanTransactionsFromTable(${transaction.loanId});">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Collateral Items Management
    resetCollateralItems() {
        const container = document.getElementById('collateral-items-container');
        container.innerHTML = `
            <div class="collateral-item" data-item-index="0">
                <div class="collateral-item-header">
                    <h4>Item 1</h4>
                    <button type="button" class="btn btn-danger btn-sm remove-collateral-item" style="display: none;">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div class="collateral-fields">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" class="collateral-item-name" placeholder="e.g., Chain, Ring" required>
                    </div>
                    <div class="form-group">
                        <label>Metal Type *</label>
                        <select class="collateral-metal-type" required>
                            <option value="">Select Metal</option>
                            <option value="gold">Gold</option>
                            <option value="silver">Silver</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Weight (grams) *</label>
                        <input type="number" class="collateral-weight" step="0.01" placeholder="e.g., 10.5" required>
                    </div>
                    <div class="form-group">
                        <label>Purity (%) *</label>
                        <input type="number" class="collateral-purity" step="0.01" placeholder="e.g., 91.6" required>
                    </div>
                </div>
            </div>
        `;
        this.updateCollateralItemNumbers();
        this.setupCollateralItemEventListeners();
    }

    addCollateralItem() {
        const container = document.getElementById('collateral-items-container');
        const itemCount = container.children.length;
        const newItem = document.createElement('div');
        newItem.className = 'collateral-item';
        newItem.dataset.itemIndex = itemCount;
        
        newItem.innerHTML = `
            <div class="collateral-item-header">
                <h4>Item ${itemCount + 1}</h4>
                <button type="button" class="btn btn-danger btn-sm remove-collateral-item">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="collateral-fields">
                <div class="form-group">
                    <label>Item Name *</label>
                    <input type="text" class="collateral-item-name" placeholder="e.g., Chain, Ring" required>
                </div>
                <div class="form-group">
                    <label>Metal Type *</label>
                    <select class="collateral-metal-type" required>
                        <option value="">Select Metal</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Weight (grams) *</label>
                    <input type="number" class="collateral-weight" step="0.01" placeholder="e.g., 10.5" required>
                </div>
                <div class="form-group">
                    <label>Purity (%) *</label>
                    <input type="number" class="collateral-purity" step="0.01" placeholder="e.g., 91.6" required>
                </div>
            </div>
        `;
        
        container.appendChild(newItem);
        this.updateCollateralItemNumbers();
        this.setupCollateralItemEventListeners();
    }

    removeCollateralItem(itemElement) {
        const container = document.getElementById('collateral-items-container');
        if (container.children.length > 1) {
            itemElement.remove();
            this.updateCollateralItemNumbers();
            this.setupCollateralItemEventListeners();
        }
    }

    updateCollateralItemNumbers() {
        const container = document.getElementById('collateral-items-container');
        const items = container.querySelectorAll('.collateral-item');
        
        items.forEach((item, index) => {
            const header = item.querySelector('.collateral-item-header h4');
            header.textContent = `Item ${index + 1}`;
            item.dataset.itemIndex = index;
            
            // Show/hide remove button based on item count
            const removeBtn = item.querySelector('.remove-collateral-item');
            removeBtn.style.display = items.length > 1 ? 'block' : 'none';
        });
    }

    setupCollateralItemEventListeners() {
        // Remove event listeners to prevent duplicates
        document.querySelectorAll('.remove-collateral-item').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // Add new event listeners
        document.querySelectorAll('.remove-collateral-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemElement = e.target.closest('.collateral-item');
                this.removeCollateralItem(itemElement);
            });
        });
    }

    collectCollateralItems() {
        const items = [];
        const container = document.getElementById('collateral-items-container');
        const itemElements = container.querySelectorAll('.collateral-item');
        
        itemElements.forEach(item => {
            const name = item.querySelector('.collateral-item-name').value.trim();
            const metalType = item.querySelector('.collateral-metal-type').value;
            const weight = parseFloat(item.querySelector('.collateral-weight').value);
            const purity = parseFloat(item.querySelector('.collateral-purity').value);
            
            if (name && metalType && !isNaN(weight) && !isNaN(purity)) {
                const netWeight = weight * (purity / 100);
                items.push({
                    name: name,
                    metalType: metalType,
                    weight: weight,
                    purity: purity,
                    netWeight: netWeight
                });
            }
        });
        
        return items;
    }

    populateCollateralItems(collateralItems) {
        if (!collateralItems || collateralItems.length === 0) {
            this.resetCollateralItems();
            return;
        }
        
        const container = document.getElementById('collateral-items-container');
        container.innerHTML = '';
        
        collateralItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'collateral-item';
            itemElement.dataset.itemIndex = index;
            
            itemElement.innerHTML = `
                <div class="collateral-item-header">
                    <h4>Item ${index + 1}</h4>
                    <button type="button" class="btn btn-danger btn-sm remove-collateral-item" ${collateralItems.length > 1 ? '' : 'style="display: none;"'}>
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div class="collateral-fields">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" class="collateral-item-name" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Metal Type *</label>
                        <select class="collateral-metal-type" required>
                            <option value="">Select Metal</option>
                            <option value="gold" ${item.metalType === 'gold' ? 'selected' : ''}>Gold</option>
                            <option value="silver" ${item.metalType === 'silver' ? 'selected' : ''}>Silver</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Weight (grams) *</label>
                        <input type="number" class="collateral-weight" step="0.01" value="${item.weight}" required>
                    </div>
                    <div class="form-group">
                        <label>Purity (%) *</label>
                        <input type="number" class="collateral-purity" step="0.01" value="${item.purity}" required>
                    </div>
                </div>
            `;
            
            container.appendChild(itemElement);
        });
        
        this.setupCollateralItemEventListeners();
    }

    // CSV Export Methods
    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // Export moved to ImportExport module

    // CSV Import Methods
    // Export moved to ImportExport module

    // Export moved to ImportExport module

    importCustomersFromCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        const newCustomers = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            if (values.length >= 4) {
                newCustomers.push({
                    id: parseInt(values[0]) || this.currentCustomerId++,
                    name: values[1],
                    fatherName: values[2],
                    address: values[3]
                });
            }
        }
        
        this.customers = [...this.customers, ...newCustomers];
        this.saveData('customers', this.customers);
        this.saveData('currentCustomerId', this.currentCustomerId);
        this.renderCustomers();
        this.updateDashboard();
        
        alert(`Successfully imported ${newCustomers.length} customers!`);
    }

    importLoansFromCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        const newLoans = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            if (values.length >= 6) {
                // For CSV import, we'll create a single placeholder collateral item
                // Users can edit the loan to add proper collateral items
                newLoans.push({
                    id: parseInt(values[0]) || this.currentLoanId++,
                    customerId: parseInt(values[1]),
                    interestRate: parseFloat(values[3]),
                    collateralItems: [{
                        name: 'Imported Item',
                        metalType: 'gold',
                        weight: parseFloat(values[5]) || 0,
                        purity: 91.6,
                        netWeight: parseFloat(values[5]) || 0
                    }],
                    netDue: 0,
                    netDate: new Date().toISOString().split('T')[0],
                    netPrincipal: 0,
                    asOfDate: new Date().toISOString().split('T')[0]
                });
            }
        }
        
        this.loans = [...this.loans, ...newLoans];
        this.saveData('loans', this.loans);
        this.saveData('currentLoanId', this.currentLoanId);
        this.updateDashboard();
        
        alert(`Successfully imported ${newLoans.length} loans! Note: Collateral items were set to placeholder values. Please edit each loan to add proper collateral details.`);
    }

    importTransactionsFromCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length <= 1) return alert('No transaction rows found.');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const colIndex = (name) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
        const idxId = colIndex('Transaction ID');
        const idxLoanId = colIndex('Loan ID');
        const idxCustomerName = colIndex('Customer Name');
        const idxType = colIndex('Type');
        const idxAmount = colIndex('Amount');
        const idxDescription = colIndex('Description');
        const idxDate = colIndex('Date');

        const newTransactions = [];
        const createdLoans = new Set();
        const createdCustomers = new Set();

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            if (idxLoanId === -1 || idxType === -1 || idxAmount === -1 || idxDate === -1) continue;

            const parsedId = idxId >= 0 ? parseInt(values[idxId]) : NaN;
            const loanId = parseInt(values[idxLoanId]);
            const type = (values[idxType] || '').toLowerCase();
            const amount = parseFloat(values[idxAmount]);
            const description = idxDescription >= 0 ? (values[idxDescription] || '') : '';
            const date = values[idxDate];

            // Ensure loan exists; create if missing
            let loan = this.loans.find(l => l.id === loanId);
            if (!loan) {
                // Determine customer from CSV (optional)
                let customerId = null;
                const customerNameCsv = idxCustomerName >= 0 ? (values[idxCustomerName] || '').trim() : '';
                if (customerNameCsv) {
                    let customer = this.customers.find(c => (c.name || '').trim().toLowerCase() === customerNameCsv.toLowerCase());
                    if (!customer) {
                        customer = { id: this.currentCustomerId++, name: customerNameCsv, fatherName: '', address: '' };
                        this.customers.push(customer);
                        createdCustomers.add(customer.id);
                    }
                    customerId = customer.id;
                } else {
                    // Fallback: create placeholder customer
                    const placeholderName = `Customer-${loanId}`;
                    const customer = { id: this.currentCustomerId++, name: placeholderName, fatherName: '', address: '' };
                    this.customers.push(customer);
                    createdCustomers.add(customer.id);
                    customerId = customer.id;
                }

                loan = {
                    id: loanId,
                    customerId,
                    interestRate: this.rates.defaultInterestRate,
                    collateralItems: [],
                    netDue: 0,
                    netDate: date,
                    netPrincipal: 0,
                    asOfDate: date
                };
                this.loans.push(loan);
                createdLoans.add(loanId);
            }

            // Create transaction
            const transaction = {
                id: Number.isFinite(parsedId) ? parsedId : this.currentTransactionId++,
                loanId,
                type,
                amount: Number.isFinite(amount) ? amount : 0,
                description: this.sanitizeDescriptionRaw(description),
                date
            };
            newTransactions.push(transaction);

            // If this is a COLLATERAL type, optionally map description to collateralItems (best-effort)
            if (type === 'collateral' && description) {
                const items = description.split(',').map(s => s.trim()).filter(Boolean);
                const parsedItems = items.map(txt => ({ name: txt, metalType: 'gold', weight: 0, purity: 0, netWeight: 0 }));
                if (parsedItems.length) {
                    loan.collateralItems = parsedItems;
                }
            }
        }

        // Merge and save
        this.transactions = [...this.transactions, ...newTransactions];
        this.saveData('customers', this.customers);
        this.saveData('loans', this.loans);
        this.saveData('transactions', this.transactions);
        this.saveData('currentCustomerId', this.currentCustomerId);
        this.saveData('currentLoanId', this.currentLoanId);
        this.saveData('currentTransactionId', this.currentTransactionId);

        // Recalculate effective principal for affected loans
        const affectedLoanIds = new Set(newTransactions.map(t => t.loanId));
        affectedLoanIds.forEach(loanId => {
            this.updateLoanEffectivePrincipal(loanId);
        });

        this.renderCustomers();
        this.renderTransactions();
        this.updateDashboard();
        this.updateRates();

        alert(`Imported ${newTransactions.length} transactions. Created ${createdLoans.size} loans and ${createdCustomers.size} customers from transactions.`);
    }

    // Backup Methods
    // Export moved to ImportExport module

    // Export moved to ImportExport module
}

// Initialize the application
const app = new LendingLedger();

// Add some CSS for badges
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    .badge-success {
        background: #c6f6d5;
        color: #22543d;
    }
    .badge-danger {
        background: #fed7d7;
        color: #742a2a;
    }
`;
document.head.appendChild(style);
