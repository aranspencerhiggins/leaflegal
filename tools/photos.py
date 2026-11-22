# Unsplash photos, hotlinked from images.unsplash.com as Unsplash's guidelines ask (each one was "downloaded" through the API so the
# photographer is credited in their stats). Unsplash licence: free for commercial use, no attribution required.
# Chosen for warm, natural light (owner, 2026-11-21: "nicer photos ... colouring, lighting").

def U(pid, w=1400):
    return f'https://images.unsplash.com/photo-{pid}?ixlib=rb-4.1.0&auto=format&fit=crop&w={w}&q=80'


P = {
    'trademarks': '1498075702571-ecb018f3752d', 'storefront': '1768180316485-2c7306ab38ff',
    'conveyancing': '1758523671413-cd178a883d6a',      # couple with moving boxes
    'keys': '1744782351841-9cc6b86a5add',              # hand holding house keys
    'street': '1495368427887-e88d33a44e0f',            # terraced street, Kensington
    'lease-extensions': '1772205412282-333cee91a92f',  # red brick, arched windows
    'immigration': '1532968899863-5b52ef155913',       # sunlit airport
    'passport': '1655722725332-9925c96dd627',          # passport with stamps
    'family-law': '1783995343999-9247e0b5a14e',        # woman and child in a park
    'licensing': '1558210598-89ba75b1724e',            # people at a bar
    'debt-recovery': '1499914485622-a88fac536970',     # woman at a laptop
    'desk-warm': '1768471126072-ef7efb2d4939',         # woman at desk, plants
    'golden-street': '1549928489-41f8868d7750',        # city street at golden hour
    'partner-call': '1621255457330-7ef4e88ec27f',      # businessman on the phone with a client
    'partner-sunlit': '1791079380346-afdc7785b3cb',    # sunlit workspace
    'lawyer-desk': '1787532378729-fe4241197405',       # man writing at a desk in an office
}

# Hero photo per practice area, plus a second one so matter pages alternate.
AREA = {
    'conveyancing': ('conveyancing', 'keys'), 'lease-extensions': ('lease-extensions', 'street'),
    'immigration': ('immigration', 'passport'), 'family-law': ('family-law', 'desk-warm'),
    'licensing': ('licensing', 'golden-street'),
    'debt-recovery': ('debt-recovery', 'desk-warm'), 'trademarks': ('trademarks', 'storefront'),
}
PARTNER = ['partner-call', 'partner-sunlit', 'lawyer-desk', 'desk-warm']


def photo(key, w=1400):
    return U(P[key], w)
