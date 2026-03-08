(function(global){
  'use strict';
  const base = (global.backend && global.backend.baseUrl) || 'http://127.0.0.1:8765';
  async function req(path, opts){
    const r = await fetch(base + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!r.ok) throw new Error(await r.text());
    if (r.status === 204) return null;
    return r.json();
  }

  const API = {
    // Customers
    listCustomers(){ return req('/customers'); },
    createCustomer(payload){ return req('/customers', { method:'POST', body: JSON.stringify(payload) }); },
    updateCustomer(id, payload){ return req(`/customers/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    deleteCustomer(id){ return req(`/customers/${id}`, { method:'DELETE' }); },

    // Loans
    listLoans(){ return req('/loans'); },
    createLoan(payload){ return req('/loans', { method:'POST', body: JSON.stringify(payload) }); },
    updateLoan(id, payload){ return req(`/loans/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    deleteLoan(id){ return req(`/loans/${id}`, { method:'DELETE' }); },

    // Transactions
    listTransactions(loanId){ return req('/transactions' + (loanId ? `?loan_id=${loanId}` : '')); },
    createTransaction(payload){ return req('/transactions', { method:'POST', body: JSON.stringify(payload) }); },
    updateTransaction(id, payload){ return req(`/transactions/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    deleteTransaction(id){ return req(`/transactions/${id}`, { method:'DELETE' }); },

    // Rates
    getRates(){ return req('/rates'); },
    updateRates(payload){ return req('/rates', { method:'PUT', body: JSON.stringify(payload) }); }
  };

  global.API = API;
})(window);


