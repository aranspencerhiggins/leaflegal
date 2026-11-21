# Writes the Leaflegal Privacy Policy and Terms of Service into the existing page shells.
# Run from the repo root:  python3 tools/legal.py
import re

EFFECTIVE = '4 November 2026'
CO = ('<strong>Vertical Brands Ltd</strong>, registered in England and Wales, '
      'company number 14254961. Registered office: 20–22 Wenlock Road, London, N1 7GU, United Kingdom. '
      'Email: <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.')

PRIVACY = f'''
<p><strong>Last updated: {EFFECTIVE}</strong></p>
<p>This policy explains how Leaflegal collects, uses and shares your personal information when you use leaflegal.co and our legal enquiry form. Please read it together with our <a href="/terms-conditions">Terms of Service</a>.</p>

<h2>1. Who we are</h2>
<p>Leaflegal is a trading name of {CO}</p>
<p>We are the data controller for the personal information we collect through this website. This means we decide how and why it is used, and we are responsible for it under UK data protection law (the UK GDPR and the Data Protection Act 2018).</p>
<p>Leaflegal is an introduction service. We are <strong>not</strong> a law firm, we do <strong>not</strong> give legal advice, and we are <strong>not</strong> regulated by the Solicitors Regulation Authority (SRA). With your permission, we pass your enquiry to one independent, regulated law firm that may be able to help you.</p>

<h2>2. The information we collect</h2>
<p>When you complete our enquiry form, we collect:</p>
<ul>
<li><strong>Contact details:</strong> your first and last name, email address and mobile number, and your business name if the enquiry is for a business.</li>
<li><strong>Details about your matter:</strong> the area of law, the type of matter, how urgent it is, your postcode, whether you are able to pay privately for legal help, and a short summary if you choose to give one.</li>
<li><strong>Records of your consent:</strong> the wording you agreed to (including the boxes you ticked) and when.</li>
</ul>
<p>When you visit the website, we and our service providers also collect:</p>
<ul>
<li><strong>Technical and usage information:</strong> your IP address, browser and device type, pages visited, the website or advert that referred you, and campaign tags in the web address.</li>
<li><strong>Cookie information:</strong> see our <a href="/cookie-policy">Cookie Policy</a>.</li>
</ul>
<p>We do not collect information from anyone under 18.</p>

<h2>3. Sensitive information</h2>
<p>Some legal matters can reveal sensitive information. A family law enquiry may reveal details about your relationships, health or children. An immigration enquiry may reveal your nationality or ethnic origin. A motoring offence enquiry relates to an alleged criminal offence. UK data protection law gives this information extra protection, as "special category" data (Article 9 UK GDPR) and "criminal offence" data (Article 10 UK GDPR).</p>
<ul>
<li>We only use this information with your <strong>explicit consent</strong>, which you give by ticking the box on our form that lets us share your enquiry with a law firm. For criminal offence data we also rely on the condition in Schedule 1 of the Data Protection Act 2018 for processing with consent, and, where relevant, for the purpose of obtaining legal advice.</li>
<li>We ask only for what a firm needs to decide whether it can help. Please keep any summary short and do not include anything you would not want a law firm to read.</li>
<li>We <strong>never</strong> send details of your matter to advertising platforms such as Meta or LinkedIn.</li>
<li>We keep this information for a shorter time than other records (see section 9).</li>
</ul>

<h2>4. How we use your information</h2>
<ul>
<li>To review your enquiry and decide which law firm to introduce you to.</li>
<li>To pass your enquiry to that firm so it can contact you about your matter.</li>
<li>To contact you about your enquiry by email, text message or phone, for example to check your details or tell you which firm you have been matched with.</li>
<li>To check that enquiries are genuine and to prevent spam, fraud and misuse.</li>
<li>To understand how people use our website and adverts, and to improve them.</li>
<li>To keep records, deal with complaints and meet our legal obligations.</li>
</ul>

<h2>5. Our legal reasons for using your information</h2>
<ul>
<li><strong>Consent:</strong> we share your enquiry with a law firm only if you tick the box agreeing to it. We use the Meta Pixel and the LinkedIn Insight Tag in your browser only if you accept marketing cookies. You can withdraw your consent at any time (see section 11, or use the Cookie settings link at the bottom of every page).</li>
<li><strong>Explicit consent:</strong> for special category and criminal offence data, as explained in section 3.</li>
<li><strong>Legitimate interests:</strong> we use your contact details and technical information to run our service, check the quality of enquiries, measure how well our advertising works, prevent fraud, keep records and defend legal claims. We only do this where it does not override your rights.</li>
<li><strong>Legal obligation:</strong> where the law requires us to keep or share information.</li>
</ul>

<h2>6. Who we share your information with</h2>
<p><strong>The law firm we match you with.</strong> If you agree, we share your contact details and form answers with <strong>one</strong> law firm we select for your enquiry. The firm may contact you by phone, email or text message.</p>
<ul>
<li>The firm is an independent business, not part of Leaflegal. It is regulated by the SRA, CILEx Regulation, the Council for Licensed Conveyancers or, for immigration only, the Immigration Advice Authority. You can check a solicitor on the SRA's register at <a href="https://www.sra.org.uk/consumers/register/" target="_blank" rel="noopener">sra.org.uk</a>.</li>
<li>Once it receives your information, the firm is a separate data controller and is responsible for how it uses it, under its own privacy notice.</li>
<li>The firm decides whether it can take on your matter. If you instruct it, your relationship is with the firm, on its own terms of business.</li>
</ul>
<p><strong>Meta (advertising measurement).</strong> If you accept marketing cookies, we share limited information with Meta Platforms Ireland Ltd (which runs Facebook and Instagram) to measure our adverts. This is limited to the fact that a form was viewed or submitted, your IP address and browser details, any advert click ID and a hashed (scrambled) version of your email address and phone number. We <strong>never</strong> share the area of law, your matter or your answers.</p>
<p><strong>LinkedIn (advertising measurement).</strong> If you accept marketing cookies, the LinkedIn Insight Tag tells LinkedIn Ireland Unlimited Company which pages you visit and when you submit an enquiry, along with your IP address and browser details. We don't send LinkedIn your name, contact details or anything about your matter.</p>
<p><strong>Our service providers.</strong> These include website hosting, email delivery, phone and email checking services and advertising measurement providers. They act on our instructions and are not allowed to use your information for their own purposes.</p>
<p><strong>Others, where necessary.</strong> These include our professional advisers, police, regulators, courts or other authorities where the law requires it, or a buyer of our business if Leaflegal or Vertical Brands Ltd is ever sold or restructured.</p>
<p>We do not sell your information to data brokers or list sellers, and we never share one enquiry with more than one firm at a time.</p>

<h2>7. How we are paid</h2>
<p>Our service is free to use. The law firm we introduce you to pays us a fee for the introduction. This does not change what the firm charges you. The firm must tell you about the fee in writing.</p>

<h2>8. Transfers outside the UK</h2>
<p>Some of our service providers store or process information outside the UK, for example in the European Economic Area or the United States. Where this happens, we make sure appropriate safeguards are in place, such as UK adequacy regulations, the UK–US data bridge, or the UK International Data Transfer Agreement or Addendum.</p>

<h2>9. How long we keep your information</h2>
<p>We keep the details of your matter for up to 12 months after you last contacted us, and your contact details for up to 24 months. We keep records of your consent for up to 6 years, so that we can show what you agreed to if there is ever a dispute. We may keep information for longer where the law requires it. After that we securely delete it or make it anonymous.</p>

<h2>10. Keeping your information secure</h2>
<p>We use appropriate technical and organisational measures to protect your information, including encrypted connections (HTTPS) and limiting who can access it. No method of sending or storing data is completely secure, but we work to protect your information and to deal promptly with any security incident.</p>

<h2>11. Your rights</h2>
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
<p>To use any of these rights, email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>. We will respond within one month. If you withdraw your consent after we have shared your enquiry, we will tell the firm you no longer want to be contacted. You should also contact the firm directly, because it controls its own copy of your information.</p>
<p>If you are unhappy with how we have handled your information, please tell us first. You also have the right to complain to the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener">ico.org.uk</a> or on 0303 123 1113.</p>

<h2>12. Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version will always be on this page, with the date it was last updated.</p>

<h2>13. Contact us</h2>
<p>Leaflegal is a trading name of {CO}</p>
'''

TERMS = f'''
<p><strong>Last updated: {EFFECTIVE}</strong></p>
<p>These terms apply when you use leaflegal.co and our legal enquiry service. By using the website or submitting an enquiry, you agree to these terms and to our <a href="/privacy-policy">Privacy Policy</a>. If you do not agree, please do not use our website or service.</p>

<h2>1. About us</h2>
<p>Leaflegal is a trading name of {CO}</p>

<h2>2. What Leaflegal does</h2>
<p>Leaflegal is a free introduction service for people and businesses looking for legal help. You tell us about your matter. If you agree, we pass your enquiry to one independent, regulated law firm we think may be able to help, and the firm contacts you.</p>
<p>Please be aware that Leaflegal:</p>
<ul>
<li>is <strong>not</strong> a law firm and does not provide legal services;</li>
<li>does <strong>not</strong> give legal advice, and nothing on this website is legal advice;</li>
<li>does <strong>not</strong> give immigration advice or services of any kind;</li>
<li>is <strong>not</strong> regulated by the Solicitors Regulation Authority (SRA) or any other legal regulator; and</li>
<li>does <strong>not</strong> guarantee that a firm will contact you, take on your matter, or achieve any particular result.</li>
</ul>

<h2>3. Who can use our service</h2>
<p>Our service is for individuals and businesses. By submitting an enquiry you confirm that:</p>
<ul>
<li>you are at least 18 years old;</li>
<li>the enquiry is about your own matter, or you are authorised to make it on behalf of the business or person concerned; and</li>
<li>for conveyancing, family law, motoring offences, licensing and lease extensions, the matter is governed by the law of England and Wales.</li>
</ul>
<p>Debt recovery enquiries are for businesses recovering money owed by other businesses only. We do not deal with personal injury, clinical negligence, housing disrepair or financial mis-selling claims, or with matters where you are looking only for legal aid.</p>

<h2>4. The law firms we introduce you to</h2>
<ul>
<li>Firms are independent businesses. They are not part of Leaflegal, and we do not act for them or for you.</li>
<li>Every firm we work with is regulated by the SRA, CILEx Regulation or the Council for Licensed Conveyancers. Immigration enquiries go only to firms or advisers allowed to give immigration advice under the Immigration and Asylum Act 1999.</li>
<li>Any legal service a firm provides is between you and the firm, on its own terms of business and client care letter. Please read them carefully.</li>
<li>The firm decides whether it can help you and what it charges. It should explain its fees before you agree to anything.</li>
<li>If you have a complaint about a firm, you should raise it with the firm first. If you are not happy with its answer, you can usually go to the <a href="https://www.legalombudsman.org.uk" target="_blank" rel="noopener">Legal Ombudsman</a>. Concerns about a solicitor's conduct can be reported to the <a href="https://www.sra.org.uk" target="_blank" rel="noopener">SRA</a>.</li>
<li>We are not responsible for what firms say or do, or for any legal service or advice they provide.</li>
</ul>

<h2>5. Your information</h2>
<ul>
<li>You must make sure the information you give us is true, accurate and complete. Firms rely on it.</li>
<li>You must only give information about other people if you are entitled to share it.</li>
<li>We will only share your enquiry with a firm if you tick the box agreeing to it. The firm may then contact you by phone, email or text message about your enquiry.</li>
<li>We use your information as described in our <a href="/privacy-policy">Privacy Policy</a>.</li>
</ul>
<p>We may decide not to pass on an enquiry, for example if it is outside the areas we cover or appears to be false.</p>

<h2>6. Cost and how we are paid</h2>
<p>Our service is free for you to use. The firm we introduce you to pays us a fee for the introduction. This does not change what the firm charges you, and the firm must tell you about it in writing.</p>

<h2>7. Our responsibility to you</h2>
<p>We provide our website and service with reasonable care and skill. We try to keep them available and accurate, but we do not promise they will always be available or error-free.</p>
<p>As far as the law allows, we are not liable for:</p>
<ul>
<li>any loss arising from a decision you make, or from any legal service or advice provided by a firm;</li>
<li>any loss of profit, revenue, business, opportunity or goodwill (this applies to business users only); or</li>
<li>any loss that was not reasonably foreseeable.</li>
</ul>
<p>Nothing in these terms limits or excludes liability that cannot be limited or excluded by law, including liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or your statutory rights as a consumer under the Consumer Rights Act 2015.</p>

<h2>8. Using our website</h2>
<ul>
<li>You must not misuse our website. This includes submitting false or fake enquiries, trying to gain unauthorised access, introducing viruses, and collecting data from the site with automated tools.</li>
<li>The content, design and branding of this website belong to us or our licensors. You may view it for your own use but must not copy or reuse it without our permission.</li>
<li>General information on this website is not legal advice and may not apply to your situation.</li>
<li>Links to other websites are provided for convenience. We are not responsible for their content.</li>
</ul>

<h2>9. Changes to these terms</h2>
<p>We may update these terms from time to time. The version on this page when you submit an enquiry applies to that enquiry.</p>

<h2>10. Law and disputes</h2>
<p>These terms are governed by the law of England and Wales. If you are a consumer living in Scotland or Northern Ireland, you can also bring proceedings in your local courts.</p>

<h2>11. Contact us</h2>
<p>If you have any questions or a complaint about our service, email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a> or write to us at 20–22 Wenlock Road, London, N1 7GU.</p>
'''


COOKIES = f'''
<p><strong>Last updated: {EFFECTIVE}</strong></p>
<p>This policy explains how Leaflegal uses cookies and similar technologies on leaflegal.co. Leaflegal is a trading name of {CO}</p>

<h2>1. What cookies are</h2>
<p>Cookies are small files a website stores on your device. Similar technologies, such as your browser's local storage, work in the same way. In this policy, "cookies" covers all of them.</p>

<h2>2. Your choices</h2>
<p>When you first visit, we ask whether you accept analytics and marketing cookies. You can accept all, reject all, or choose each type. Only essential cookies are used unless you say yes.</p>
<p>You can change your mind at any time using the <a href="#" data-cookie-settings>Cookie settings</a> link at the bottom of every page. You can also delete cookies in your browser settings.</p>

<h2>3. The cookies we use</h2>
<p><strong>Essential (always on).</strong> These are needed for the site and enquiry form to work, so they don't need your consent:</p>
<ul>
<li><strong>ll-cookies</strong>: remembers your cookie choices. Kept until you change them or clear your browser.</li>
<li><strong>ll-apply-v2</strong> and <strong>lg-partner-enquiry-v1</strong>: save your answers while you fill in a form, so you don't lose them if the page reloads. Cleared when you submit.</li>
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
<p>If you have any questions, email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>. For more about how we use personal information, see our <a href="/privacy-policy">Privacy Policy</a>.</p>
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


write('public/privacy-policy.html', 'Privacy Policy | Leaflegal', 'Privacy Policy', PRIVACY,
      'How Leaflegal, a trading name of Vertical Brands Ltd, collects, uses and shares your information.')
write('public/terms-conditions.html', 'Terms of Service | Leaflegal', 'Terms of Service', TERMS,
      'The terms that apply when you use Leaflegal, a legal introduction service from Vertical Brands Ltd.')
print('ok')
write('public/cookie-policy.html', 'Cookie Policy | Leaflegal', 'Cookie Policy', COOKIES,
      'How Leaflegal uses cookies, and how to accept, reject or change your cookie choices.')
