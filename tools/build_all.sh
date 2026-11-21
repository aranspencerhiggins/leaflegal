#!/bin/sh
# Full rebuild: legal pages, generated pages + sitewide header/footer, then strip builder traces.
set -e
cd "$(dirname "$0")/.."
python3 tools/legal.py
python3 tools/build_pages.py
python3 tools/detemplate.py
node tools/test_enquiry.mjs
