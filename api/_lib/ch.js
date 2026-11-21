// Companies House public register (REST API). Env COMPANIESHOUSE_API = REST key (basic auth: key as username, blank password).
export const CH = 'https://api.company-information.service.gov.uk';
export const chUrl = (number) => `https://find-and-update.company-information.service.gov.uk/company/${number}`;

export async function chGet(path) {
  const key = process.env.COMPANIESHOUSE_API;
  if (!key) throw new Error('companies house: no key');
  const r = await fetch(CH + path, { headers: { Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64') }, signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`companies house ${r.status}`);
  return r.json();
}

// "SMITH, John David" → "John David Smith"
export const person = (n) => {
  const [last = '', first = ''] = String(n || '').split(',').map((x) => x.trim());
  const cap = (w) => w.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());
  return [first, cap(last)].filter(Boolean).join(' ');
};

// Month and year of birth of a current director / LLP member, as Companies House publishes it ("1978-03"), or null.
const DIR_ROLES = new Set(['director', 'llp-member', 'llp-designated-member']);
export async function directorDob(number, name) {
  const want = String(name || '').trim().toLowerCase();
  if (!want) return null;
  const d = await chGet(`/company/${number}/officers?items_per_page=100`);
  const o = (d.items || []).find((x) => !x.resigned_on && DIR_ROLES.has(x.officer_role) && person(x.name).toLowerCase() === want);
  const dob = o?.date_of_birth;
  return dob?.year && dob?.month ? `${dob.year}-${String(dob.month).padStart(2, '0')}` : null;
}
// "1978-03" → "March 1978"
export const dobLabel = (v) => (/^\d{4}-\d{2}$/.test(v || '') ? new Date(`${v}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : null);

const TYPES = { ltd: 'Private limited company', llp: 'Limited liability partnership', plc: 'Public limited company',
  'private-limited-guarant-nsc': 'Company limited by guarantee', 'private-limited-guarant-nsc-limited-exemption': 'Company limited by guarantee',
  'private-unlimited': 'Private unlimited company', 'private-limited-shares-section-30-exemption': 'Private limited company' };
export const typeLabel = (t) => TYPES[t] || (t ? t.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : null);

// SIC 2007: the first two digits give the industry section.
const SECTIONS = [[1, 3, 'Agriculture, forestry and fishing'], [5, 9, 'Mining and quarrying'], [10, 33, 'Manufacturing'], [35, 35, 'Energy supply'],
  [36, 39, 'Water and waste'], [41, 43, 'Construction'], [45, 47, 'Wholesale and retail'], [49, 53, 'Transport and storage'], [55, 56, 'Hospitality and food'],
  [58, 63, 'Information and communication'], [64, 66, 'Finance and insurance'], [68, 68, 'Real estate'], [69, 75, 'Professional and technical services'],
  [77, 82, 'Business support services'], [84, 84, 'Public administration'], [85, 85, 'Education'], [86, 88, 'Health and social care'],
  [90, 93, 'Arts and recreation'], [94, 96, 'Other services'], [97, 98, 'Household activities'], [99, 99, 'Extraterritorial organisations']];
export const industry = (code) => {
  if (String(code) === '99999') return 'Dormant company';
  const d = Number(String(code).slice(0, 2));
  return SECTIONS.find(([a, b]) => d >= a && d <= b)?.[2] || null;
};

// Incorporation date → the form's "time trading" bands. Incorporation stands in for trading start.
export function tradingBand(iso) {
  const months = (Date.now() - Date.parse(iso)) / (30.44 * 864e5);
  if (!(months >= 0)) return null;
  return months < 6 ? 'Under 6 months' : months < 12 ? '6 to 12 months' : months < 24 ? '1 to 2 years' : months < 60 ? '2 to 5 years' : '5+ years';
}

// The full company record, trimmed to what brokers use.
export async function chProfile(number) {
  const c = await chGet(`/company/${number}`);
  const a = c.registered_office_address || {};
  const sic = c.sic_codes || [];
  return {
    title: c.company_name || null, number: c.company_number, status: c.company_status || null, type: c.type || null,
    incorporated: c.date_of_creation || null,
    address: [a.address_line_1, a.address_line_2, a.locality, a.region, a.postal_code].filter(Boolean).join(', ') || null,
    locality: a.locality || null, sic, industries: [...new Set(sic.map(industry).filter(Boolean))],
    accounts_overdue: !!c.accounts?.overdue, confirmation_overdue: !!c.confirmation_statement?.overdue,
    insolvency_history: !!c.has_insolvency_history, charges: !!c.has_charges,
  };
}
