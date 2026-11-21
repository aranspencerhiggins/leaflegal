// Standard amortising loan maths (fixed rate, equal monthly repayments). Used by the calculator page; tested by tools/test_loan_math.js.
(function (root) {
  // Monthly repayment for principal P over n months at annual rate (percent).
  function monthly(P, annualPct, n) {
    if (!(P > 0) || !(n > 0)) return 0;
    const r = annualPct / 100 / 12;
    return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
  }
  // Year-by-year breakdown: [{year, paid, interest, principal, balance}]
  function schedule(P, annualPct, n) {
    const r = annualPct / 100 / 12, m = monthly(P, annualPct, n), rows = [];
    let bal = P, y = null;
    for (let k = 1; k <= n; k++) {
      const int = bal * r, prin = Math.min(m - int, bal);
      bal = Math.max(0, bal - prin);
      if (!y || (k - 1) % 12 === 0) { y = { year: rows.length + 1, paid: 0, interest: 0, principal: 0, balance: 0 }; rows.push(y); }
      y.paid += prin + int; y.interest += int; y.principal += prin; y.balance = bal;
    }
    return rows;
  }
  function summary(P, annualPct, n) {
    const m = monthly(P, annualPct, n), total = m * n;
    return { monthly: m, total, interest: total - P, perPound: P ? total / P : 0 };
  }
  const api = { monthly, schedule, summary };
  if (typeof module !== 'undefined') module.exports = api; else root.loanMath = api;
})(this);
