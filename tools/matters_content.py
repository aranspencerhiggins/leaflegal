# All matter pages and location data. Built by tools/build_pages.py.
from matters_property import CONVEYANCING, LEASE
from matters_people import FAMILY, IMMIGRATION
from matters_business import LICENSING, DEBT
from matters_ip import TRADEMARKS

MATTERS = {'conveyancing': CONVEYANCING, 'lease-extensions': LEASE, 'family-law': FAMILY, 'immigration': IMMIGRATION,
           'licensing': LICENSING, 'debt-recovery': DEBT,
           'trademarks': TRADEMARKS}

# Location pages: /solicitors/<city> hub and /<area>/<city>. England and Wales cities (trademarks are UK wide but still get city pages).
# Immigration is deliberately left out: introductions are national and not tied to a town.
LOCAL_AREAS = ['conveyancing', 'family-law', 'licensing', 'debt-recovery', 'lease-extensions', 'trademarks']
# (slug, name, region, nearby places)
CITIES = [
    ('london', 'London', 'Greater London', ['Westminster', 'Camden', 'Islington', 'Croydon', 'Wandsworth', 'Hackney']),
    ('birmingham', 'Birmingham', 'the West Midlands', ['Solihull', 'Sutton Coldfield', 'West Bromwich', 'Dudley', 'Walsall']),
    ('manchester', 'Manchester', 'Greater Manchester', ['Salford', 'Stockport', 'Trafford', 'Oldham', 'Bolton']),
    ('leeds', 'Leeds', 'West Yorkshire', ['Bradford', 'Wakefield', 'Harrogate', 'Huddersfield', 'Halifax']),
    ('liverpool', 'Liverpool', 'Merseyside', ['Birkenhead', 'St Helens', 'Southport', 'Bootle', 'Warrington']),
    ('sheffield', 'Sheffield', 'South Yorkshire', ['Rotherham', 'Barnsley', 'Doncaster', 'Chesterfield']),
    ('bristol', 'Bristol', 'the South West', ['Bath', 'Weston-super-Mare', 'Clevedon', 'Keynsham']),
    ('newcastle', 'Newcastle', 'Tyne and Wear', ['Gateshead', 'Sunderland', 'North Shields', 'South Shields']),
    ('nottingham', 'Nottingham', 'the East Midlands', ['Derby', 'Beeston', 'Mansfield', 'Loughborough']),
    ('leicester', 'Leicester', 'the East Midlands', ['Loughborough', 'Hinckley', 'Market Harborough', 'Melton Mowbray']),
    ('cardiff', 'Cardiff', 'South Wales', ['Newport', 'Barry', 'Penarth', 'Caerphilly', 'Bridgend']),
    ('swansea', 'Swansea', 'South Wales', ['Neath', 'Port Talbot', 'Llanelli', 'Gower']),
    ('southampton', 'Southampton', 'Hampshire', ['Eastleigh', 'Winchester', 'Romsey', 'Totton']),
    ('portsmouth', 'Portsmouth', 'Hampshire', ['Southsea', 'Fareham', 'Havant', 'Gosport']),
    ('brighton', 'Brighton', 'East Sussex', ['Hove', 'Worthing', 'Lewes', 'Shoreham-by-Sea']),
    ('reading', 'Reading', 'Berkshire', ['Wokingham', 'Bracknell', 'Newbury', 'Henley-on-Thames']),
    ('oxford', 'Oxford', 'Oxfordshire', ['Abingdon', 'Didcot', 'Witney', 'Bicester']),
    ('cambridge', 'Cambridge', 'Cambridgeshire', ['Ely', 'Huntingdon', 'St Neots', 'Newmarket']),
    ('milton-keynes', 'Milton Keynes', 'Buckinghamshire', ['Bletchley', 'Newport Pagnell', 'Bedford', 'Northampton']),
    ('norwich', 'Norwich', 'Norfolk', ['Great Yarmouth', 'Wymondham', 'Dereham', 'Lowestoft']),
    ('coventry', 'Coventry', 'the West Midlands', ['Warwick', 'Leamington Spa', 'Nuneaton', 'Rugby']),
    ('stoke-on-trent', 'Stoke-on-Trent', 'Staffordshire', ['Newcastle-under-Lyme', 'Stafford', 'Stone', 'Leek']),
    ('hull', 'Hull', 'East Yorkshire', ['Beverley', 'Hessle', 'Cottingham', 'Goole']),
    ('plymouth', 'Plymouth', 'Devon', ['Plymstock', 'Saltash', 'Ivybridge', 'Tavistock']),
    ('exeter', 'Exeter', 'Devon', ['Exmouth', 'Crediton', 'Newton Abbot', 'Tiverton']),
    ('york', 'York', 'North Yorkshire', ['Harrogate', 'Selby', 'Malton', 'Tadcaster']),
]

# What locals typically need, per area, used to vary the location copy (kept generic: no named courts or councils).
LOCAL_ANGLE = {
    'conveyancing': ('moving home', 'Whether you are buying your first flat, selling a family home or remortgaging, a conveyancer who knows the local market and the local searches can keep things moving.'),
    'family-law': ('separating', 'If you are separating, you can speak to a family solicitor who deals with local family courts and understands what clients in your area are going through.'),
    'licensing': ('running a licensed business', 'Pubs, bars, restaurants, late night venues and drivers deal with the local council’s licensing team. A licensing solicitor who knows how local committees work is a real advantage.'),
    'debt-recovery': ('owed money by another business', 'If another business owes you money, a debt recovery solicitor can act quickly with a letter before action, a court claim and enforcement.'),
    'trademarks': ('protecting a brand', 'Whether you are launching a new business, protecting a product range or dealing with a copycat, a trademark specialist can search, file and enforce your rights. Trademark work is handled by phone, email and video, so your firm does not need to be round the corner.'),
    'lease-extensions': ('extending a lease', 'If you own a leasehold flat, a solicitor and surveyor who deal with leasehold regularly can help you extend your lease or buy your freehold.'),
}
