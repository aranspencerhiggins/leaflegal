# Writes the Loanleaf Privacy Policy and Terms of Service into the existing page shells.
# Run from ~/loanleaf-site:  python3 tools/legal.py
import re

EFFECTIVE = '4 November 2026'
CO = ('<strong>Vertical Brands Ltd</strong>, registered in England and Wales, '
      'company number 14254961. Registered office: 20–22 Wenlock Road, London, N1 7GU, United Kingdom. '
      'Email: <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.')

PRIVACY = f'''
<p><strong>Last updated: {EFFECTIVE}</strong></p>
<p>This policy explains how Loanleaf collects, uses and shares your personal information when you use loanleaf.co and our business finance enquiry form. Please read it together with our <a href="/terms-conditions">Terms of Service</a>.</p>

<h2>1. Who we are</h2>
<p>Loanleaf is a trading name of {CO}</p>
<p>We are the data controller for the personal information we collect through this website. This means we decide how and why it is used, and we are responsible for it under UK data protection law (the UK GDPR and the Data Protection Act 2018).</p>
<p>Loanleaf is an introduction service. We are <strong>not</strong> a lender or a broker, we do <strong>not</strong> give financial advice, and we are <strong>not</strong> authorised or regulated by the Financial Conduct Authority (FCA). We pass your enquiry to a finance broker who may be able to help your business.</p>

<h2>2. The information we collect</h2>
<p>When you complete our enquiry form, we collect:</p>
<ul>
<li><strong>Contact details:</strong> your first and last name, business name, email address and mobile number.</li>
<li><strong>Details about your funding needs:</strong> how much you want to borrow, what it is for and how soon you need it.</li>
<li><strong>Details about your business:</strong> how it is set up, its annual revenue, how long it has been trading, whether there have been missed payments, defaults or County Court Judgments (CCJs) in the last 6 years, and whether it has existing loans or finance, including roughly how much is left to repay and the monthly repayments.</li>
<li><strong>Records of your consent:</strong> the wording you agreed to (including any boxes you ticked) and when.</li>
</ul>
<p>When you visit the website, we and our service providers also collect:</p>
<ul>
<li><strong>Technical and usage information:</strong> your IP address, browser and device type, pages visited, the website or advert that referred you, and campaign tags in the web address.</li>
<li><strong>Cookie information:</strong> see our <a href="/cookie-policy">Cookie Policy</a>.</li>
</ul>
<p>Some of the answers you give, such as credit history and existing borrowing, may relate to you personally as a director or member of the business. Please only give information that is accurate and that you are entitled to share.</p>
<p>Our service is for businesses, not for children. We do not knowingly collect information from anyone under 18.</p>

<h2>3. How we use your information</h2>
<ul>
<li>To review your enquiry and decide which broker to introduce you to.</li>
<li>To pass your enquiry to that broker so they can contact you about business finance.</li>
<li>To contact you about your enquiry by email, text message or WhatsApp, for example to check your details or tell you which broker you've been matched with.</li>
<li>To check that enquiries are genuine and to prevent spam, fraud and misuse.</li>
<li>To understand how people use our website and adverts, and to improve them.</li>
<li>To keep records, deal with complaints and meet our legal obligations.</li>
</ul>

<h2>4. Our legal reasons for using your information</h2>
<ul>
<li><strong>Contract:</strong> when you send an enquiry you are asking us to introduce you to a broker, so we pass it to the broker we match you with so they can contact you about it.</li>
<li><strong>Consent:</strong> we only use the Meta Pixel and the LinkedIn Insight Tag in your browser if you accept marketing cookies. You can withdraw your consent at any time (see section 10, or use the Cookie settings link at the bottom of every page).</li>
<li><strong>Legitimate interests:</strong> we use your information to run our service, check and improve the quality of enquiries, measure how well our advertising works (including through Meta’s Conversions API), prevent fraud, keep records and defend legal claims. We only do this where it doesn't override your rights.</li>
<li><strong>Legal obligation:</strong> where the law requires us to keep or share information.</li>
</ul>

<h2>5. Who we share your information with</h2>
<p><strong>The broker we match you with.</strong> If you agree, we share your contact details and form answers with a finance broker we select for your enquiry. The broker will usually contact you by phone, email or text message.</p>
<ul>
<li>The broker is an independent business, not part of Loanleaf. Once it receives your information, the broker is responsible for how it uses it, under its own privacy notice.</li>
<li>The broker <strong>may or may not be authorised by the FCA</strong>. You can check a firm's status on the FCA Register at <a href="https://register.fca.org.uk" target="_blank" rel="noopener">register.fca.org.uk</a>.</li>
<li>The broker may share your information with lenders and may carry out credit and identity checks on your business and its directors. It should tell you about this before doing so.</li>
</ul>
<p><strong>Meta (advertising measurement).</strong> We share limited information with Meta Platforms Ireland Ltd (which runs Facebook and Instagram) to measure and improve our adverts. This includes events such as viewing or submitting a form, your IP address and browser details, any advert click ID and, when you submit an enquiry or application, a hashed (scrambled) version of your email address, phone number and name. We don’t share your answers about your business or its finances. Meta uses this information under its own terms and privacy policy.</p>
<p><strong>LinkedIn (advertising measurement).</strong> If you accept marketing cookies, the LinkedIn Insight Tag tells LinkedIn Ireland Unlimited Company which pages you visit and when you submit an enquiry, along with your IP address and browser details, so we can measure and improve our LinkedIn adverts. We don’t send LinkedIn your name, contact details or your answers about your business. If you’re a broker who registers for or pays for a plan on Loanleaf Platform, we also tell LinkedIn about that from our server, with a hashed (scrambled) version of your email address, your name and your firm’s name, so we can measure our LinkedIn adverts. LinkedIn uses this information under its own terms and privacy policy.</p>
<p><strong>Our service providers.</strong> These include website hosting, email delivery and analytics and advertising-tracking providers. They act on our instructions and are not allowed to use your information for their own purposes.</p>
<p><strong>Others, where necessary.</strong> These include our professional advisers, police, regulators, courts or other authorities where the law requires it, or a buyer of our business if Loanleaf or Vertical Brands Ltd is ever sold or restructured.</p>
<p>We do not sell your information to data brokers or list sellers.</p>

<h2>6. How we are paid</h2>
<p>Our service is free to use. We may be paid by the broker we introduce you to. Any fees or charges a broker or lender asks you to pay are set by them and should be explained to you before you agree to anything.</p>

<h2>7. Transfers outside the UK</h2>
<p>Some of our service providers store or process information outside the UK, for example in the European Economic Area or the United States. Where this happens, we make sure appropriate safeguards are in place, such as UK adequacy regulations, the UK–US data bridge, or the UK International Data Transfer Agreement or Addendum.</p>

<h2>8. How long we keep your information</h2>
<p>We keep enquiry information for up to 24 months after you last contacted us. We keep records of your consent for up to 6 years, so that we can show what you agreed to if there is ever a dispute. We may keep information for longer where the law requires it. After that we securely delete it or make it anonymous.</p>

<h2>9. Keeping your information secure</h2>
<p>We use appropriate technical and organisational measures to protect your information, including encrypted connections (HTTPS) and limiting who can access it. No method of sending or storing data is completely secure, but we work to protect your information and to deal promptly with any security incident.</p>

<h2>10. Your rights</h2>
<p>Under UK data protection law you have the right to:</p>
<ul>
<li>ask for a copy of the information we hold about you;</li>
<li>ask us to correct information that is wrong or incomplete;</li>
<li>ask us to delete your information;</li>
<li>ask us to restrict or stop using your information;</li>
<li>object to us using your information for our legitimate interests, or for direct marketing;</li>
<li>ask us to send your information to you or another organisation in a reusable format; and</li>
<li>withdraw your consent at any time.</li>
</ul>
<p>To use any of these rights, email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>. We will respond within one month. If you withdraw your consent after we have shared your enquiry, we will tell the broker you no longer want to be contacted. You should also contact the broker directly, because it controls its own copy of your information.</p>
<p>If you are unhappy with how we have handled your information, please tell us first. You also have the right to complain to the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener">ico.org.uk</a> or on 0303 123 1113.</p>

<h2>11. Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version will always be on this page, with the date it was last updated.</p>

<h2>12. Contact us</h2>
<p>Loanleaf is a trading name of {CO}</p>
'''

TERMS = f'''
<p><strong>Last updated: {EFFECTIVE}</strong></p>
<p>These terms apply when you use loanleaf.co and our business finance enquiry service. By using the website or submitting an enquiry, you agree to these terms and to our <a href="/privacy-policy">Privacy Policy</a>. If you do not agree, please do not use our website or service.</p>

<h2>1. About us</h2>
<p>Loanleaf is a trading name of {CO}</p>

<h2>2. What Loanleaf does</h2>
<p>Loanleaf is a free introduction service for businesses looking for finance. You tell us about your business and what you need. If you agree, we pass your enquiry to a finance broker we think may be able to help, and the broker contacts you.</p>
<p>Please be aware that Loanleaf:</p>
<ul>
<li>is <strong>not</strong> a lender and does not provide finance;</li>
<li>is <strong>not</strong> a broker and does not arrange, negotiate or apply for finance for you;</li>
<li>does <strong>not</strong> give financial, legal, tax or other advice, and does not recommend any product, broker or lender;</li>
<li>is <strong>not</strong> authorised or regulated by the Financial Conduct Authority (FCA); and</li>
<li>does <strong>not</strong> guarantee that you will be contacted, offered finance or approved, or that any terms will be available.</li>
</ul>

<h2>3. Who can use our service</h2>
<p>Our service is only for UK businesses that are limited companies or limited liability partnerships (LLPs) and are looking for finance for business purposes. By submitting an enquiry you confirm that:</p>
<ul>
<li>you are at least 18 years old;</li>
<li>you are a director, member or other person authorised to make the enquiry on behalf of the business; and</li>
<li>the finance is wholly or mainly for the business, not for personal, family or household use.</li>
</ul>
<p>We do not deal with enquiries from sole traders, ordinary partnerships or individuals, or for personal borrowing.</p>

<h2>4. The brokers we introduce you to</h2>
<ul>
<li>Brokers are independent businesses. They are not part of Loanleaf, and we do not act for them or for you.</li>
<li>A broker we introduce you to <strong>may or may not be authorised by the FCA</strong>. You can check a firm's status on the FCA Register at <a href="https://register.fca.org.uk" target="_blank" rel="noopener">register.fca.org.uk</a>.</li>
<li>Many types of lending to limited companies and LLPs are not regulated by the FCA. This means protections that apply to regulated finance, such as complaining to the Financial Ombudsman Service, may not be available to you.</li>
<li>Any service a broker provides, and any finance a lender offers, is between you and them, on their own terms. Please read their terms carefully and take independent advice if you are unsure.</li>
<li>Brokers and lenders make their own decisions. They may carry out credit and identity checks on your business and its directors, and may charge fees, which they should explain before you agree to anything.</li>
<li>We are not responsible for what brokers or lenders say or do, or for any finance, advice or service they provide.</li>
</ul>

<h2>5. Your information</h2>
<ul>
<li>You must make sure the information you give us is true, accurate and complete. Brokers and lenders rely on it.</li>
<li>You must only give information about other people, such as fellow directors, if you are entitled to share it.</li>
<li>By submitting our form, you agree to us sharing your details and answers with the broker we match you with, and to that broker contacting you by phone, email or text message about business finance.</li>
<li>We use your information as described in our <a href="/privacy-policy">Privacy Policy</a>.</li>
</ul>
<p>We may decide not to pass on an enquiry, for example if it does not meet a broker's criteria or appears to be false.</p>

<h2>6. Cost and how we are paid</h2>
<p>Our service is free for you to use. We may be paid by the broker we introduce you to. Any fees charged by a broker or lender are set by them.</p>

<h2>7. Our responsibility to you</h2>
<p>We provide our website and service "as is". We try to keep them available and accurate, but we do not promise they will always be available or error-free.</p>
<p>As far as the law allows, we are not liable for:</p>
<ul>
<li>any loss arising from a decision you or your business makes, or from any finance, advice or service provided by a broker or lender;</li>
<li>any loss of profit, revenue, business, opportunity or goodwill; or</li>
<li>any indirect or consequential loss.</li>
</ul>
<p>If we are found liable to you for any reason, our total liability will be limited to £100.</p>
<p>Nothing in these terms limits or excludes liability that cannot be limited or excluded by law, including liability for death or personal injury caused by our negligence, or for fraud or fraudulent misrepresentation.</p>

<h2>8. Using our website</h2>
<ul>
<li>You must not misuse our website. This includes submitting false or fake enquiries, trying to gain unauthorised access, introducing viruses, and collecting data from the site with automated tools.</li>
<li>The content, design and branding of this website belong to us or our licensors. You may view it for your own use but must not copy or reuse it without our permission.</li>
<li>Links to other websites are provided for convenience. We are not responsible for their content.</li>
</ul>

<h2>9. Changes to these terms</h2>
<p>We may update these terms from time to time. The version on this page when you submit an enquiry applies to that enquiry.</p>

<h2>10. Law and disputes</h2>
<p>These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.</p>

<h2>11. Contact us</h2>
<p>If you have any questions or a complaint, email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a> or write to us at 20–22 Wenlock Road, London, N1 7GU.</p>
'''


COOKIES = f'''
<p><strong>Last updated: {EFFECTIVE}</strong></p>
<p>This policy explains how Loanleaf uses cookies and similar technologies on loanleaf.co. Loanleaf is a trading name of {CO}</p>

<h2>1. What cookies are</h2>
<p>Cookies are small files a website stores on your device. Similar technologies, such as your browser's local storage, work in the same way. In this policy, "cookies" covers all of them.</p>

<h2>2. Your choices</h2>
<p>When you first visit, we ask whether you accept analytics and marketing cookies. You can accept all, reject all, or choose each type. Only essential cookies are used unless you say yes.</p>
<p>You can change your mind at any time using the <a href="#" data-cookie-settings>Cookie settings</a> link at the bottom of every page. You can also delete cookies in your browser settings.</p>

<h2>3. The cookies we use</h2>
<p><strong>Essential (always on).</strong> These are needed for the site and enquiry form to work, so they don't need your consent:</p>
<ul>
<li><strong>ll-cookies</strong>: remembers your cookie choices. Kept until you change them or clear your browser.</li>
<li><strong>ll-apply-v1</strong> and <strong>ll-partner-apply-v1</strong>: save your answers while you fill in a form, so you don't lose them if the page reloads. Cleared when you submit.</li>
</ul>
<p><strong>Advertising measurement.</strong> Used to link your enquiry to the advert you clicked:</p>
<ul>
<li><strong>ll-fbc</strong>: if you arrive from one of our Facebook or Instagram adverts, remembers the advert click ID for your visit so your enquiry can be linked to that advert. Cleared when you close your browser.</li>
</ul>
<p><strong>Analytics (only with your consent).</strong> These help us understand how people use the site, such as which pages they visit, so we can improve it.</p>
<p><strong>Marketing (only with your consent).</strong> These help us measure how well our adverts work and show you relevant adverts on other websites.</p>
<ul>
<li><strong>Meta Pixel (_fbp, _fbc)</strong>: set by Meta when you accept marketing cookies. Lets Meta measure visits and enquiries from our Facebook and Instagram adverts and show you relevant adverts. Kept for up to 90 days.</li>
<li><strong>LinkedIn Insight Tag (li_fat_id, li_sugr, bcookie, lidc, UserMatchHistory, AnalyticsSyncHistory)</strong>: set by LinkedIn when you accept marketing cookies. Lets LinkedIn measure visits and enquiries from our LinkedIn adverts and show you relevant adverts. Kept for up to 2 years.</li>
</ul>
<p>We don't currently use any analytics cookies. See our <a href="/privacy-policy">Privacy Policy</a> for how we use your information.</p>

<h2>4. Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version will always be on this page.</p>

<h2>5. Contact us</h2>
<p>If you have any questions, email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>. For more about how we use personal information, see our <a href="/privacy-policy">Privacy Policy</a>.</p>
'''


def write(path, title, h1, body, desc):
    h = open(path).read()
    rt = re.search(r'(<div[^>]*class="privacy-rich-text [wu]-richtext">)(.*?)(</div></div></div></div></section>)', h, re.S)
    assert rt, path
    h = h[:rt.start(2)] + body.strip() + h[rt.end(2):]
    h = re.sub(r'(<h1[^>]*>)[^<]*(</h1>)', r'\g<1>' + h1 + r'\2', h, count=1)
    h = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', h)
    h = re.sub(r'content="[^"]*" name="description"', f'content="{desc}" name="description"', h)
    h = re.sub(r'(name="description" content=")[^"]*', r'\g<1>' + desc, h)
    open(path, 'w').write(h)


write('public/privacy-policy.html', 'Privacy Policy | Loanleaf', 'Privacy Policy', PRIVACY,
      'How Loanleaf, a trading name of Vertical Brands Ltd, collects, uses and shares your information.')
write('public/terms-conditions.html', 'Terms of Service | Loanleaf', 'Terms of Service', TERMS,
      'The terms that apply when you use Loanleaf, a business finance introduction service from Vertical Brands Ltd.')
print('ok')
write('public/cookie-policy.html', 'Cookie Policy | Loanleaf', 'Cookie Policy', COOKIES,
      'How Loanleaf uses cookies, and how to accept, reject or change your cookie choices.')
