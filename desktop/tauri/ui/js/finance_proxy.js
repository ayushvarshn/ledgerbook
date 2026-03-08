(function(global){
  'use strict';
  const base = (global.backend && global.backend.baseUrl) || 'http://127.0.0.1:8765';
  async function getJSON(url){ const r = await fetch(url); if(!r.ok) throw new Error('Request failed'); return r.json(); }

  const FinanceProxy = {
    async calculateLoanDues(loan /*, transactions */) {
      if (!loan || !loan.id) throw new Error('Loan missing id');
      const data = await getJSON(`${base}/loans/${loan.id}/dues`);
      return {
        principalDisbursed: data.principal_disbursed,
        paymentsReceived: data.payments_received,
        principalDue: data.principal_due,
        interestDue: data.interest_due,
        totalDue: data.total_due
      };
    },
    async calculateLoanSchedule(loan /*, transactions */) {
      if (!loan || !loan.id) throw new Error('Loan missing id');
      const data = await getJSON(`${base}/loans/${loan.id}/schedule`);
      return data;
    }
  };

  global.Finance = FinanceProxy;
})(window);


