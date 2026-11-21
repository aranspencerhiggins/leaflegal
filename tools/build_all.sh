#!/bin/sh
# Full rebuild: legal pages, generated pages + sitewide header/footer, then strip builder traces.
set -e
cd "$(dirname "$0")/.."
python3 tools/legal.py
python3 tools/build_pages.py
python3 tools/detemplate.py
node tools/test_loan_math.cjs
node tools/test_platform.mjs && node tools/test_flows.mjs > /dev/null && node tools/test_admin_finance.cjs public/assets/platform.js > /dev/null
