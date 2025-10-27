(function (global) {
	'use strict';

	function assertNumber(value, fallback) {
		const n = Number(value);
		return Number.isFinite(n) ? n : (fallback ?? 0);
	}

	// Annual simple interest calculation per day basis
	function calculateInterestSimple(amount, annualRatePct, startDateISO, endDateISO) {
		const principal = assertNumber(amount, 0);
		const rate = assertNumber(annualRatePct, 0) / 100;
		const start = new Date(startDateISO);
		const end = new Date(endDateISO);
		if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || end <= start) {
			return 0;
		}
		const msPerDay = 24 * 60 * 60 * 1000;
		const days = Math.floor((end - start) / msPerDay);
		return principal * rate * (days / 365);
	}

	// Compute aggregates from transactions
	function summarizeTransactions(transactions) {
		let totalCredit = 0; // incoming payments reduce principal/interest due
		let totalDebit = 0;  // disbursements increase principal
		const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
		for (const t of sorted) {
			if (t.type === 'credit') totalCredit += assertNumber(t.amount, 0);
			else if (t.type === 'debit') totalDebit += assertNumber(t.amount, 0);
		}
		return { totalCredit, totalDebit, sorted };
	}

	// High-level calculation: principal due, interest due, totals
	// Strategy (simple version):
	// - Principal is increased by each debit amount
	// - Interest accrues daily on current principal using loan.interestRate (annual %)
	// - Credits first pay interest due, then reduce principal
	function calculateLoanDues(loan, transactions, todayISO) {
		const { totalCredit, totalDebit, sorted } = summarizeTransactions(transactions);
		let principal = 0;
		let interestAccrued = 0;
		let lastDate = null;
		const annualRate = assertNumber(loan.interestRate, 0);

		for (const t of sorted) {
			const txDate = t.date;
			if (lastDate) {
				// accrue interest from lastDate to txDate on current principal
				interestAccrued += calculateInterestSimple(principal, annualRate, lastDate, txDate);
			}
			lastDate = txDate;

			if (t.type === 'debit') {
				principal += assertNumber(t.amount, 0);
			} else if (t.type === 'credit') {
				let payment = assertNumber(t.amount, 0);
				// pay interest first
				const interestPayment = Math.min(payment, interestAccrued);
				interestAccrued -= interestPayment;
				payment -= interestPayment;
				// remaining reduces principal
				principal = Math.max(0, principal - payment);
			}
		}

		// accrue interest from last transaction date to today
		const today = todayISO || new Date().toISOString().split('T')[0];
		if (lastDate) {
			interestAccrued += calculateInterestSimple(principal, annualRate, lastDate, today);
		}

		const result = {
			principalDisbursed: totalDebit,
			paymentsReceived: totalCredit,
			principalDue: Number(principal.toFixed(2)),
			interestDue: Number(Math.max(0, interestAccrued).toFixed(2)),
			totalDue: Number((principal + Math.max(0, interestAccrued)).toFixed(2))
		};
		return result;
	}

	// Build per-transaction schedule of dues (principal/interest) and a "today" entry
	function calculateLoanSchedule(loan, transactions, todayISO) {
		const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
		let principal = 0;
		let interestAccrued = 0;
		let lastDate = null;
		const annualRate = assertNumber(loan.interestRate, 0);

		const entries = [];
		for (const t of sorted) {
			const txDate = t.date;
			if (lastDate) {
				interestAccrued += calculateInterestSimple(principal, annualRate, lastDate, txDate);
			}
			lastDate = txDate;

			if (t.type === 'debit') {
				principal += assertNumber(t.amount, 0);
			} else if (t.type === 'credit') {
				let payment = assertNumber(t.amount, 0);
				const interestPayment = Math.min(payment, interestAccrued);
				interestAccrued -= interestPayment;
				payment -= interestPayment;
				principal = Math.max(0, principal - payment);
			}

			entries.push({
				date: txDate,
				principalDue: Number(principal.toFixed(2)),
				interestDue: Number(Math.max(0, interestAccrued).toFixed(2))
			});
		}

		const today = todayISO || new Date().toISOString().split('T')[0];
		let todayEntry = { date: today, principalDue: Number(principal.toFixed(2)), interestDue: Number(Math.max(0, interestAccrued).toFixed(2)) };
		if (lastDate) {
			const addl = calculateInterestSimple(principal, annualRate, lastDate, today);
			const interestToday = Math.max(0, interestAccrued + addl);
			todayEntry = { date: today, principalDue: Number(principal.toFixed(2)), interestDue: Number(interestToday.toFixed(2)) };
		}

		return { entries, today: todayEntry };
	}

	global.Finance = {
		calculateInterestSimple,
		summarizeTransactions,
		calculateLoanDues,
		calculateLoanSchedule
	};

})(window);
