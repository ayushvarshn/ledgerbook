// Lending Ledger Application JavaScript

class LendingLedger {
    constructor() {
        this.customers = this.loadData('customers') || [];
        this.loans = this.loadData('loans') || [];
        this.transactions = this.loadData('transactions') || [];
        this.rates = this.loadData('rates') || { goldRate: 0, silverRate: 0, defaultInterestRate: 12.0 };
        this.currentCustomerId = this.loadData('currentCustomerId') || 1;
        this.currentLoanId = this.loadData('currentLoanId') || 1;
        this.currentTransactionId = this.loadData('currentTransactionId') || 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderCustomers();
        this.renderLoans();
        this.renderTransactions();
        this.updateRates();
        this.setDefaultDate();
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

        // Loan modal
        document.getElementById('add-loan-btn').addEventListener('click', () => {
            this.openLoanModal();
        });

        document.getElementById('loan-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveLoan();
        });

        document.getElementById('cancel-loan').addEventListener('click', () => {
            this.closeModal('loan-modal');
        });

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
            this.exportToCSV('customers');
        });

        document.getElementById('export-loans').addEventListener('click', () => {
            this.exportToCSV('loans');
        });

        document.getElementById('export-transactions').addEventListener('click', () => {
            this.exportToCSV('transactions');
        });

        document.getElementById('export-all').addEventListener('click', () => {
            this.exportAllData();
        });

        // Data Management - Import
        document.getElementById('import-customers').addEventListener('click', () => {
            this.importFromCSV('customers');
        });

        document.getElementById('import-loans').addEventListener('click', () => {
            this.importFromCSV('loans');
        });

        document.getElementById('import-transactions').addEventListener('click', () => {
            this.importFromCSV('transactions');
        });

        // Data Management - Backup & Restore
        document.getElementById('create-backup').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restore-backup').addEventListener('click', () => {
            this.restoreBackup();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Hide transactions section
        document.getElementById('hide-transactions-btn').addEventListener('click', () => {
            this.hideLoanTransactions();
        });

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

    // Data Management
    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
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
            this.renderLoans();
            this.renderTransactions();
            this.updateDashboard();
        }
    }

    renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        tbody.innerHTML = '';

        this.customers.forEach(customer => {
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

        // Reset collateral items container
        this.resetCollateralItems();

        if (loanId) {
            const loan = this.loans.find(l => l.id === loanId);
            title.textContent = 'Edit Loan';
            document.getElementById('loan-customer').value = loan.customerId;
            document.getElementById('loan-interest-rate').value = loan.interestRate;
            
            // Show interest rate field for editing
            document.getElementById('interest-rate-group').style.display = 'block';
            
            // Populate collateral items
            this.populateCollateralItems(loan.collateralItems);
            form.dataset.loanId = loanId;
        } else {
            title.textContent = 'Add Loan';
            form.reset();
            this.resetCollateralItems();
            delete form.dataset.loanId;
            
            // Hide interest rate field for new loans (uses default)
            document.getElementById('interest-rate-group').style.display = 'none';
            
            // Pre-select customer if provided
            if (customerId) {
                document.getElementById('loan-customer').value = customerId;
            }
        }
        
        modal.style.display = 'block';
    }

    saveLoan() {
        const form = document.getElementById('loan-form');
        const loanId = form.dataset.loanId;
        
        // Collect collateral items
        const collateralItems = this.collectCollateralItems();
        
        if (collateralItems.length === 0) {
            alert('Please add at least one collateral item.');
            return;
        }

        const loan = {
            customerId: parseInt(document.getElementById('loan-customer').value),
            interestRate: loanId ? parseFloat(document.getElementById('loan-interest-rate').value) : this.rates.defaultInterestRate,
            collateralItems: collateralItems
        };

        if (loanId) {
            // Update existing loan
            const index = this.loans.findIndex(l => l.id === parseInt(loanId));
            this.loans[index] = { ...loan, id: parseInt(loanId) };
        } else {
            // Add new loan
            loan.id = this.currentLoanId++;
            loan.netDue = 0; // Will be calculated based on transactions
            this.loans.push(loan);
        }

        this.saveData('loans', this.loans);
        this.saveData('currentLoanId', this.currentLoanId);
        this.renderLoans();
        this.updateDashboard();
        this.closeModal('loan-modal');
    }

    deleteLoan(loanId) {
        if (confirm('Are you sure you want to delete this loan? This will also delete all associated transactions.')) {
            this.loans = this.loans.filter(l => l.id !== loanId);
            this.transactions = this.transactions.filter(t => t.loanId !== loanId);
            
            this.saveData('loans', this.loans);
            this.saveData('transactions', this.transactions);
            this.renderLoans();
            this.renderTransactions();
            this.updateDashboard();
        }
    }

    renderLoans() {
        const tbody = document.getElementById('loans-tbody');
        tbody.innerHTML = '';

        this.loans.forEach(loan => {
            const customer = this.customers.find(c => c.id === loan.customerId);
            const customerName = customer ? customer.name : 'Unknown Customer';
            
            // Calculate net due
            const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
            let netDue = 0;
            loanTransactions.forEach(transaction => {
                if (transaction.type === 'credit') {
                    netDue -= transaction.amount; // Payment reduces due amount
                } else if (transaction.type === 'debit') {
                    netDue += transaction.amount; // Disbursement increases due amount
                }
            });

            // Format collateral items display using helper function
            const collateralDisplay = this.formatCollateralItems(loan);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.id}</td>
                <td>${customerName}</td>
                <td>${collateralDisplay}</td>
                <td>${loan.interestRate}%</td>
                <td class="${netDue > 0 ? 'text-danger' : 'text-success'}">₹${netDue.toFixed(2)}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="app.viewLoanTransactionsFromTable(${loan.id})">
                        <i class="fas fa-list"></i> View Transactions
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="app.openLoanModal(${loan.id})">
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

    // Transaction Management
    openTransactionModal(transactionId = null) {
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
            document.getElementById('transaction-date').value = transaction.date;
            form.dataset.transactionId = transactionId;
        } else {
            title.textContent = 'Add Transaction';
            form.reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
            delete form.dataset.transactionId;
        }
        
        modal.style.display = 'block';
    }

    saveTransaction() {
        const form = document.getElementById('transaction-form');
        const transactionId = form.dataset.transactionId;
        
        const transaction = {
            loanId: parseInt(document.getElementById('transaction-loan').value),
            type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            date: document.getElementById('transaction-date').value
        };

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
        this.renderTransactions();
        this.renderLoans(); // Update loan net due amounts
        this.updateDashboard();
        this.closeModal('transaction-modal');
    }

    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== transactionId);
            
            this.saveData('transactions', this.transactions);
            this.renderTransactions();
            this.renderLoans(); // Update loan net due amounts
            this.updateDashboard();
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactions-tbody');
        tbody.innerHTML = '';

        this.transactions.forEach(transaction => {
            const loan = this.loans.find(l => l.id === transaction.loanId);
            const customer = loan ? this.customers.find(c => c.id === loan.customerId) : null;
            const customerName = customer ? customer.name : 'Unknown Customer';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${transaction.loanId}</td>
                <td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-danger'}">${transaction.type.toUpperCase()}</span></td>
                <td>₹${transaction.amount.toFixed(2)}</td>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
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
            displayName = 'Default Interest';
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

    // Dashboard
    updateDashboard() {
        const totalCustomers = this.customers.length;
        const totalLoans = this.loans.length;
        const totalTransactions = this.transactions.length;
        
        // Calculate total outstanding amount
        let totalOutstanding = 0;
        this.loans.forEach(loan => {
            const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
            let netDue = 0;
            loanTransactions.forEach(transaction => {
                if (transaction.type === 'credit') {
                    netDue -= transaction.amount;
                } else if (transaction.type === 'debit') {
                    netDue += transaction.amount;
                }
            });
            totalOutstanding += netDue;
        });

        document.getElementById('total-customers').textContent = totalCustomers;
        document.getElementById('total-loans').textContent = totalLoans;
        document.getElementById('total-outstanding').textContent = `₹${totalOutstanding.toFixed(2)}`;
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

    // Helper function to format collateral items display
    formatCollateralItems(loan) {
        if (loan.collateralItems && loan.collateralItems.length > 0) {
            // New format with multiple items
            return loan.collateralItems.map(item => {
                const metalType = item.metalType.charAt(0).toUpperCase() + item.metalType.slice(1);
                return `${metalType} ${item.name} ${item.weight}g (${item.purity}%)`;
            }).join(', ');
        } else if (loan.collateral) {
            // Legacy single collateral format
            return `${loan.collateral.item} ${loan.collateral.weight}g (${loan.collateral.purity}%)`;
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
        let totalNetWeight = 0;
        
        customerLoans.forEach(loan => {
            // Calculate net due for this loan
            const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
            let netDue = 0;
            loanTransactions.forEach(transaction => {
                if (transaction.type === 'credit') {
                    netDue -= transaction.amount;
                } else if (transaction.type === 'debit') {
                    netDue += transaction.amount;
                }
            });
            totalOutstanding += netDue;
            
            // Count collateral items
            if (loan.collateralItems && loan.collateralItems.length > 0) {
                totalCollateralItems += loan.collateralItems.length;
                totalNetWeight += loan.collateralItems.reduce((sum, item) => sum + item.netWeight, 0);
            } else if (loan.collateral) {
                totalCollateralItems += 1;
                totalNetWeight += loan.collateral.netWeight || 0;
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
                        <h3 class="${totalOutstanding > 0 ? 'text-danger' : 'text-success'}">₹${totalOutstanding.toFixed(2)}</h3>
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
                        <i class="fas fa-weight"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${totalNetWeight.toFixed(2)}g</h3>
                        <p>Total Net Weight</p>
                    </div>
                </div>
            </div>
        `;
    }

    populateCustomerLoansTable(customerLoans) {
        const tbody = document.getElementById('customer-loans-tbody');
        tbody.innerHTML = '';

        customerLoans.forEach(loan => {
            // Calculate net due
            const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
            let netDue = 0;
            loanTransactions.forEach(transaction => {
                if (transaction.type === 'credit') {
                    netDue -= transaction.amount;
                } else if (transaction.type === 'debit') {
                    netDue += transaction.amount;
                }
            });

            // Format collateral items display using helper function
            const collateralDisplay = this.formatCollateralItems(loan);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.id}</td>
                <td>${loan.interestRate}%</td>
                <td>${collateralDisplay}</td>
                <td class="${netDue > 0 ? 'text-danger' : 'text-success'}">₹${netDue.toFixed(2)}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="app.viewLoanTransactions(${loan.id})">
                        <i class="fas fa-list"></i> View Transactions
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="app.openLoanModal(${loan.id}); app.closeModal('customer-loans-modal');">
                        <i class="fas fa-edit"></i> Edit
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
            loanTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-danger'}">${transaction.type.toUpperCase()}</span></td>
                    <td>₹${transaction.amount.toFixed(2)}</td>
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                `;
                transactionsTbody.appendChild(row);
            });
        }
        
        transactionsSection.style.display = 'block';
        transactionsSection.scrollIntoView({ behavior: 'smooth' });
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
        
        // Populate transactions summary
        this.populateLoansTransactionsSummary(loanTransactions);
        
        // Populate transactions table
        this.populateLoansTransactionsTable(loanTransactions);
        
        // Show transactions section
        document.getElementById('loan-transactions-section').style.display = 'block';
        
        // Scroll to transactions section
        document.getElementById('loan-transactions-section').scrollIntoView({ behavior: 'smooth' });
    }

    hideLoanTransactions() {
        document.getElementById('loan-transactions-section').style.display = 'none';
    }

    populateSelectedLoanInfo(loan, customerName) {
        const loanInfo = document.getElementById('selected-loan-info');
        const collateralDisplay = this.formatCollateralItems(loan);
        
        // Calculate net due
        const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
        let netDue = 0;
        loanTransactions.forEach(transaction => {
            if (transaction.type === 'credit') {
                netDue -= transaction.amount;
            } else if (transaction.type === 'debit') {
                netDue += transaction.amount;
            }
        });
        
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
                        <span>${customerName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Interest Rate:</label>
                        <span>${loan.interestRate}%</span>
                    </div>
                    <div class="detail-item">
                        <label>Net Due:</label>
                        <span class="${netDue > 0 ? 'text-danger' : 'text-success'}">₹${netDue.toFixed(2)}</span>
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
        let totalCredit = 0;
        let totalDebit = 0;
        
        loanTransactions.forEach(transaction => {
            if (transaction.type === 'credit') {
                totalCredit += transaction.amount;
            } else if (transaction.type === 'debit') {
                totalDebit += transaction.amount;
            }
        });
        
        const netAmount = totalDebit - totalCredit;
        
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
                        <h3>₹${totalDebit.toFixed(2)}</h3>
                        <p>Total Disbursed</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-arrow-down text-danger"></i>
                    </div>
                    <div class="summary-content">
                        <h3>₹${totalCredit.toFixed(2)}</h3>
                        <p>Total Received</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-balance-scale"></i>
                    </div>
                    <div class="summary-content">
                        <h3 class="${netAmount > 0 ? 'text-danger' : 'text-success'}">₹${netAmount.toFixed(2)}</h3>
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

        // Sort transactions by date (newest first)
        const sortedTransactions = loanTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td><span class="badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-danger'}">${transaction.type.toUpperCase()}</span></td>
                <td>₹${transaction.amount.toFixed(2)}</td>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
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
                        <input type="text" class="collateral-item-name" placeholder="e.g., Gold Chain, Silver Ring" required>
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
                    <input type="text" class="collateral-item-name" placeholder="e.g., Gold Chain, Silver Ring" required>
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
    exportToCSV(dataType) {
        console.log('Exporting CSV for:', dataType); // Debug log
        let csvContent = '';
        let filename = '';
        
        switch(dataType) {
            case 'customers':
                csvContent = this.convertCustomersToCSV();
                filename = `customers_${this.getCurrentDate()}.csv`;
                break;
            case 'loans':
                csvContent = this.convertLoansToCSV();
                filename = `loans_${this.getCurrentDate()}.csv`;
                break;
            case 'transactions':
                csvContent = this.convertTransactionsToCSV();
                filename = `transactions_${this.getCurrentDate()}.csv`;
                break;
        }
        
        console.log('CSV Content preview:', csvContent.substring(0, 200)); // Debug log
        console.log('Filename:', filename); // Debug log
        this.downloadCSV(csvContent, filename);
    }

    exportAllData() {
        const allData = {
            customers: this.customers,
            loans: this.loans,
            transactions: this.transactions,
            rates: this.rates,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonContent = JSON.stringify(allData, null, 2);
        const filename = `lending_ledger_backup_${this.getCurrentDate()}.json`;
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    convertCustomersToCSV() {
        const headers = ['ID', 'Name', 'Father Name', 'Address'];
        const rows = this.customers.map(customer => [
            customer.id,
            customer.name,
            customer.fatherName,
            customer.address
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    convertLoansToCSV() {
        const headers = ['Loan ID', 'Customer ID', 'Customer Name', 'Interest Rate', 'Collateral Items', 'Net Due'];
        const rows = this.loans.map(loan => {
            const customer = this.customers.find(c => c.id === loan.customerId);
            const customerName = customer ? customer.name : 'Unknown';
            
            // Calculate net due
            const loanTransactions = this.transactions.filter(t => t.loanId === loan.id);
            let netDue = 0;
            loanTransactions.forEach(transaction => {
                if (transaction.type === 'credit') {
                    netDue -= transaction.amount;
                } else if (transaction.type === 'debit') {
                    netDue += transaction.amount;
                }
            });
            
            // Format collateral items using helper function
            const collateralDisplay = this.formatCollateralItems(loan);
            
            return [
                loan.id,
                loan.customerId,
                customerName,
                loan.interestRate,
                collateralDisplay,
                netDue.toFixed(2)
            ];
        });
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    convertTransactionsToCSV() {
        const headers = ['Transaction ID', 'Loan ID', 'Customer Name', 'Type', 'Amount', 'Date'];
        const rows = this.transactions.map(transaction => {
            const loan = this.loans.find(l => l.id === transaction.loanId);
            const customer = loan ? this.customers.find(c => c.id === loan.customerId) : null;
            const customerName = customer ? customer.name : 'Unknown';
            
            return [
                transaction.id,
                transaction.loanId,
                customerName,
                transaction.type.toUpperCase(),
                transaction.amount,
                transaction.date
            ];
        });
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    downloadCSV(content, filename) {
        // Ensure filename has .csv extension
        if (!filename.toLowerCase().endsWith('.csv')) {
            filename += '.csv';
        }
        // Add BOM for proper UTF-8 encoding in Excel
        const csvContent = '\uFEFF' + content;
        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
    }

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
    }

    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    // CSV Import Methods
    importFromCSV(dataType) {
        const input = document.getElementById('import-file');
        input.dataset.importType = dataType;
        input.click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const importType = event.target.dataset.importType;
            
            try {
                switch(importType) {
                    case 'customers':
                        this.importCustomersFromCSV(content);
                        break;
                    case 'loans':
                        this.importLoansFromCSV(content);
                        break;
                    case 'transactions':
                        this.importTransactionsFromCSV(content);
                        break;
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }

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
                    netDue: 0
                });
            }
        }
        
        this.loans = [...this.loans, ...newLoans];
        this.saveData('loans', this.loans);
        this.saveData('currentLoanId', this.currentLoanId);
        this.renderLoans();
        this.updateDashboard();
        
        alert(`Successfully imported ${newLoans.length} loans! Note: Collateral items were set to placeholder values. Please edit each loan to add proper collateral details.`);
    }

    importTransactionsFromCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        const newTransactions = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            if (values.length >= 6) {
                newTransactions.push({
                    id: parseInt(values[0]) || this.currentTransactionId++,
                    loanId: parseInt(values[1]),
                    type: values[3].toLowerCase(),
                    amount: parseFloat(values[4]),
                    date: values[5]
                });
            }
        }
        
        this.transactions = [...this.transactions, ...newTransactions];
        this.saveData('transactions', this.transactions);
        this.saveData('currentTransactionId', this.currentTransactionId);
        this.renderTransactions();
        this.renderLoans(); // Update loan net due amounts
        this.updateDashboard();
        
        alert(`Successfully imported ${newTransactions.length} transactions!`);
    }

    // Backup Methods
    createBackup() {
        this.exportAllData();
        alert('Backup created successfully!');
    }

    restoreBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    if (confirm('This will replace all current data. Are you sure?')) {
                        this.customers = backupData.customers || [];
                        this.loans = backupData.loans || [];
                        this.transactions = backupData.transactions || [];
                        this.rates = backupData.rates || { goldRate: 0, silverRate: 0 };
                        
                        this.saveData('customers', this.customers);
                        this.saveData('loans', this.loans);
                        this.saveData('transactions', this.transactions);
                        this.saveData('rates', this.rates);
                        
                        this.renderCustomers();
                        this.renderLoans();
                        this.renderTransactions();
                        this.updateDashboard();
                        this.updateRates();
                        
                        alert('Data restored successfully!');
                    }
                } catch (error) {
                    alert('Error restoring backup: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
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
