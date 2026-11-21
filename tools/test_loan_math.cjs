// node tools/test_loan_math.js — checks the calculator maths against known values.
const assert = require('assert');
// loan-math.js is a browser script (UMD); run it as CommonJS whatever the package "type" says.
const mod = { exports: {} };
new Function('module', 'exports', require('fs').readFileSync(require('path').join(__dirname, '../public/assets/loan-math.js'), 'utf8'))(mod, mod.exports);
const { monthly, schedule, summary } = mod.exports;
const near = (a, b, tol = 0.01) => assert(Math.abs(a - b) <= tol, `${a} != ${b}`);

near(monthly(100000, 10, 60), 2124.70);        // £100k, 10% APR-style nominal, 5 years
near(monthly(50000, 0, 24), 2083.33);           // zero rate = straight split
near(monthly(250000, 7.5, 120), 2967.54);       // 10 years
near(monthly(10000, 12, 12), 888.49);           // 1 year
const s = summary(100000, 10, 60);
near(s.total, 127482.27, 0.05); near(s.interest, 27482.27, 0.05);  // from the unrounded monthly figure
const rows = schedule(100000, 10, 60);
assert.strictEqual(rows.length, 5);
near(rows.at(-1).balance, 0, 0.01);
near(rows.reduce((t, r) => t + r.principal, 0), 100000, 0.05);
near(rows.reduce((t, r) => t + r.interest, 0), s.interest, 0.05);
assert.strictEqual(schedule(30000, 9, 18).length, 2);  // partial final year
assert.strictEqual(monthly(0, 10, 12), 0);
console.log('loan maths ok');
