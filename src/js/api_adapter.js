(function(global){
  'use strict';
  const map = {
    toFrontCustomer(c){ return { id: c.id, name: c.name, fatherName: c.father_name || '', address: c.address || '' }; },
    toBackCustomer(c){ return { name: c.name, father_name: c.fatherName || '', address: c.address || '' }; },

    toFrontLoan(l){
      return {
        id: l.id,
        customerId: l.customer_id,
        interestRate: l.interest_rate,
        collateralItems: (l.collateral_items || []).map(i => ({ name: i.name || '', metalType: i.metalType || 'gold', weight: i.weight || 0, purity: i.purity || 0 })),
        netPrincipal: l.net_principal || 0,
        asOfDate: l.as_of_date || null
      };
    },
    toBackLoan(l){
      return {
        customer_id: l.customerId,
        interest_rate: l.interestRate,
        collateral_items: (l.collateralItems || []).map(i => ({ name: i.name || '', metalType: i.metalType || 'gold', weight: i.weight || 0, purity: i.purity || 0 })),
        net_principal: l.netPrincipal ?? 0,
        as_of_date: l.asOfDate ?? null
      };
    },

    toFrontTx(t){ return { id: t.id, loanId: t.loan_id, type: (t.type || '').toUpperCase(), amount: t.amount || 0, description: t.description || '', note: t.note || '', date: t.date }; },
    toBackTx(t){ return { loan_id: t.loanId, type: (t.type || '').toLowerCase(), amount: t.amount || 0, description: t.description || '', note: t.note || '', date: t.date }; },

    toFrontRates(r){ return { goldRate: r.gold_rate || 0, silverRate: r.silver_rate || 0, defaultInterestRate: r.default_interest_rate || 0 }; },
    toBackRates(r){ return { gold_rate: r.goldRate || 0, silver_rate: r.silverRate || 0, default_interest_rate: r.defaultInterestRate || 0 }; }
  };

  const API = global.API;

  const APIAdapter = {
    async loadAll(){
      const [customers, loans, rates] = await Promise.all([
        API.listCustomers(),
        API.listLoans(),
        API.getRates()
      ]);
      // Load all transactions for all loans in parallel
      const txsArrays = await Promise.all(loans.map(l => API.listTransactions(l.id)));
      const txs = ([]).concat(...txsArrays);
      return {
        customers: customers.map(map.toFrontCustomer),
        loans: loans.map(map.toFrontLoan),
        transactions: txs.map(map.toFrontTx),
        rates: map.toFrontRates(rates)
      };
    },

    async upsertCustomer(front){
      if (front.id) {
        const c = await API.updateCustomer(front.id, map.toBackCustomer(front));
        return map.toFrontCustomer(c);
      } else {
        const c = await API.createCustomer(map.toBackCustomer(front));
        return map.toFrontCustomer(c);
      }
    },
    async deleteCustomer(id){ await API.deleteCustomer(id); },

    async upsertLoan(front){
      if (front.id) {
        const l = await API.updateLoan(front.id, map.toBackLoan(front));
        return map.toFrontLoan(l);
      } else {
        const l = await API.createLoan(map.toBackLoan(front));
        return map.toFrontLoan(l);
      }
    },
    async deleteLoan(id){ await API.deleteLoan(id); },

    async upsertTransaction(front){
      if (front.id) {
        const t = await API.updateTransaction(front.id, map.toBackTx(front));
        return map.toFrontTx(t);
      } else {
        const t = await API.createTransaction(map.toBackTx(front));
        return map.toFrontTx(t);
      }
    },
    async deleteTransaction(id){ await API.deleteTransaction(id); },

    async getRates(){ const r = await API.getRates(); return map.toFrontRates(r); },
    async setRates(front){ const r = await API.updateRates(map.toBackRates(front)); return map.toFrontRates(r); }
  };

  global.APIAdapter = APIAdapter;
})(window);


