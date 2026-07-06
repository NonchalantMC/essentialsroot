import { Link } from 'react-router-dom';

// ─── Shared layout wrapper ─────────────────────────────────────────────────────
function StaticPage({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-sm text-[#999] mb-4">
        <Link to="/" className="hover:text-[#2C5F2D] transition-colors">Home</Link>
        {' '}/{' '}
        <span>{title}</span>
      </div>
      <h1 className="font-semibold text-4xl font-medium mb-8" style={{color:'#141414'}}>{title}</h1>
      <div className="prose prose-sm max-w-none text-[#5a5a5a] leading-relaxed space-y-5">
        {children}
      </div>
    </div>
  );
}

// ─── SIZE GUIDE ───────────────────────────────────────────────────────────────
export function SizeGuide() {
  const rows = [
    { eu:35, uk:2.5, us:5,   cm:21.5 },
    { eu:36, uk:3,   us:5.5, cm:22.1 },
    { eu:37, uk:4,   us:6.5, cm:22.8 },
    { eu:38, uk:5,   us:7.5, cm:23.5 },
    { eu:39, uk:6,   us:8.5, cm:24.1 },
    { eu:40, uk:6.5, us:9,   cm:24.8 },
    { eu:41, uk:7.5, us:10,  cm:25.4 },
    { eu:42, uk:8,   us:10.5,cm:26.0 },
  ];
  return (
    <StaticPage title="Size Guide">
      <p>
        Our footwear follows standard EU sizing. To find your perfect fit, measure
        your foot length from heel to longest toe while standing, then use the chart below.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{background:'#e8f2e8'}}>
              {['EU','UK','US','Foot Length (cm)'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-[#141414] border border-[#ede9e2]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.eu} style={{background: i%2===0 ? '#fff' : '#faf7f2'}}>
                <td className="px-4 py-2.5 border border-[#ede9e2] font-semibold" style={{color:'#2C5F2D'}}>{r.eu}</td>
                <td className="px-4 py-2.5 border border-[#ede9e2]">{r.uk}</td>
                <td className="px-4 py-2.5 border border-[#ede9e2]">{r.us}</td>
                <td className="px-4 py-2.5 border border-[#ede9e2]">{r.cm} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#e8f2e8] border border-[#2C5F2D]/20 rounded-xl p-4 text-sm">
        <strong style={{color:'#2C5F2D'}}>Tip:</strong> If you're between sizes or have wider feet,
        we recommend sizing up half a size. Contact our WhatsApp support for personalised
        fitting advice.
      </div>
      <div className="flex gap-3 pt-2">
        <Link to="/footwear"
              className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{background:'#2C5F2D'}}>
          Shop Footwear
        </Link>
        <a href="https://wa.me/256700000000" target="_blank" rel="noopener noreferrer"
           className="inline-block rounded-full px-6 py-3 text-sm font-medium border border-[#ede9e2] text-[#5a5a5a] hover:border-[#2C5F2D] hover:text-[#2C5F2D] transition-colors">
          Ask on WhatsApp
        </a>
      </div>
    </StaticPage>
  );
}

// ─── RETURNS POLICY ───────────────────────────────────────────────────────────
export function Returns() {
  return (
 <StaticPage title="Return & Replacement Policy">
      <p className="text-base text-[#141414]">
        At <strong>Essentials256</strong>, we want you to be happy with your purchase. Please read our return policy carefully before requesting a return, replacement, or refund[cite: 5].
      </p>

      <hr className="my-6" style={{ borderColor: '#ede9e2' }} />

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">1. Reporting a Return</h2>
      <p>
        Any issue with your order must be reported to us <strong>within 24 hours of delivery</strong>. This can be done via WhatsApp, Instagram DM, or email provided in our contacts[cite: 5].
      </p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li className="text-[#e05252] font-medium">Issues reported after the 24-hour window will not be eligible for return, replacement, or refund[cite: 5].</li>
        <li>Please inspect your item(s) immediately upon delivery[cite: 5].</li>
      </ul>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">2. Eligible Reasons for Return</h2>
      <p>We accept return requests for the following[cite: 5]:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Wrong size delivered[cite: 5]</li>
        <li>Wrong item delivered[cite: 5]</li>
        <li>Wrong color delivered[cite: 5]</li>
        <li>Wrong package delivered[cite: 5]</li>
      </ul>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">3. Condition of Returned Items</h2>
      <p>To qualify for a return or replacement, the item must[cite: 5]:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Be unused, unworn, and in its original condition[cite: 5]</li>
        <li>Include all original packaging, tags, and special wrapping (e.g. shoe boxes, decor packaging, protective wrap)[cite: 5]</li>
        <li>Show no signs of damage caused by the customer[cite: 5]</li>
      </ul>
      <p className="mt-3 bg-[#fffaf0] border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        We do not accept damaged goods. If an item is returned without its original special wrapping, or shows signs of use or damage not caused by us, the return will be declined and the item sent back to the customer[cite: 5].
      </p>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">4. Replacement Process (Size / Item Disparity)</h2>
      <p>If the issue is a wrong size or other correctable disparity[cite: 5]:</p>
      <ol className="list-decimal list-inside space-y-1 pl-2">
        <li>We collect the incorrect item from you[cite: 5].</li>
        <li>Once received and inspected, we dispatch the correct item[cite: 5].</li>
      </ol>
      <p className="mt-2">
        If the exact size/item is unavailable for direct exchange (not "equally replaceable"), a refund will be issued to a mobile money number of your choice instead[cite: 5].
      </p>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">5. Refunds</h2>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Refunds are issued only when a like-for-like replacement isn't possible[cite: 5].</li>
        <li>Refunds are sent via mobile money to the number the customer provides[cite: 5].</li>
        <li>Refunds are processed within <strong>1-2 business days</strong> of us receiving and inspecting the returned item[cite: 5].</li>
      </ul>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">6. Who Covers Return Costs</h2>
      <ul className="list-none space-y-3 pl-2">
        <li>
          🟢 <strong>Our mistake</strong> (wrong item sent, wrong size shipped, etc.): Essentials256 covers all return/exchange delivery costs[cite: 5].
        </li>
        <li>
          🟠 <strong>Customer-side reasons</strong> (changed mind, ordered wrong size by mistake, etc.): The customer covers the cost of returning the item, and any redelivery cost for the replacement[cite: 5].
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">7. Non-Returnable Situations</h2>
      <p>Returns will not be accepted if[cite: 5]:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>The 24-hour reporting window has passed[cite: 5]</li>
        <li>The item is damaged, worn, used, or missing original packaging/special wrapping[cite: 5]</li>
        <li>The item was purchased on final sale/clearance[cite: 5]</li>
        <li>No proof of purchase (order number, receipt, or payment confirmation) is provided[cite: 5]</li>
      </ul>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">8. How to Start a Return</h2>
      <ol className="list-decimal list-inside space-y-1.5 pl-2">
        <li>Contact us within 24 hours of delivery via WhatsApp or Direct Call[cite: 5].</li>
        <li>Provide your order number, a description of the issue, and photos of the item (including packaging)[cite: 5].</li>
        <li>We'll confirm eligibility and share pickup/drop-off instructions[cite: 5].</li>
        <li>Once we receive and inspect the item, we'll process a replacement or refund as outlined above[cite: 5].</li>
      </ol>

      <h2 className="text-xl font-semibold text-[#141414] mt-6 mb-2">9. Contact Us</h2>
      <div className="bg-[#e8f2e8] rounded-2xl p-5 border border-[#2C5F2D]/10 space-y-2 text-sm text-[#141414]">
        <div><strong>WhatsApp:</strong> <a href="https://wa.me/256749156332" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{color:'#2C5F2D'}}>+256749156332</a></div>
        <div><strong>Instagram DM:</strong> <a href="https://instagram.com/essentials256" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{color:'#2C5F2D'}}>@essentials256</a></div>
        <div><strong>Email:</strong> <a href="mailto:comms@essentials256.com" className="underline font-semibold" style={{color:'#2C5F2D'}}>comms@essentials256.com</a></div>
      </div>

      <div className="flex gap-3 pt-4">
        <a href="https://wa.me/256749156332?text=Hi, I need to report an issue with my order within the 24-hour window"
           target="_blank" rel="noopener noreferrer"
           className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
           style={{background:'#2C5F2D'}}>
          Start a Return on WhatsApp
        </a>
      </div>
    </StaticPage>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
export function Contact() {
  return (
    <StaticPage title="Contact Us">
      <p>We'd love to hear from you. Reach us through any of the channels below.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {[
          { icon:'💬', title:'WhatsApp (fastest)', detail:'+256 749 156 332', href:'https://wa.me/256749156332' },
          { icon:'📧', title:'Email', detail:'comms@essentials256.com', href:'mailto:comms@essentials256.com' },
        ].map(c => (
          <div key={c.title} className="bg-white border border-[#ede9e2] rounded-2xl p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="font-semibold text-[#141414] mb-1">{c.title}</div>
            {c.href ? (
              <a href={c.href} target="_blank" rel="noopener noreferrer"
                 className="text-sm transition-colors hover:underline" style={{color:'#2C5F2D'}}>
                {c.detail}
              </a>
            ) : (
              <p className="text-sm text-[#5a5a5a] whitespace-pre-line">{c.detail}</p>
            )}
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold text-[#141414] mt-8 mb-2">Business Hours</h2>
      <p>Monday – Saturday: 8:00 AM – 7:00 PM (EAT)</p>
      <p>Sunday: 10:00 AM – 4:00 PM (EAT)</p>
      <p className="text-sm text-[#999]">WhatsApp support available 7 days a week.</p>
    </StaticPage>
  );
}

// ─── PRIVACY POLICY ───────────────────────────────────────────────────────────
export function Privacy() {
  return (
    <StaticPage title="Privacy Policy">
      <div className="border-b pb-4 mb-6" style={{borderColor:'var(--border)'}}>
        <h2 className="text-xl font-semibold mb-1" style={{color:'#141414'}}>Essentials256 Privacy Policy</h2>
        <p className="text-xs text-[#999]">Last Updated: 3rd July, 2026</p>
      </div>

      <p>
        Essentials256 ("we," "us," "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information when you use our website (the "Site") or interact with us on social media.
      </p>
      <p className="font-medium" style={{color:'#2C5F2D'}}>
        This policy is designed to align with Uganda's Data Protection and Privacy Act, 2019.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">1. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      
      <h3 className="text-sm font-bold text-[#141414] mt-3 mb-1">Information you provide directly:</h3>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Full name</li>
        <li>Phone number</li>
        <li>Delivery address (including delivery zone)</li>
        <li>Email address (if provided)</li>
        <li>Order details (items purchased, order history)</li>
        <li>Communications you send us (WhatsApp, Instagram DMs, email, customer support messages)</li>
      </ul>

      <h3 className="text-sm font-bold text-[#141414] mt-4 mb-1">Information collected automatically:</h3>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>IP address, browser type, and device information</li>
        <li>Pages visited and time spent on the Site</li>
        <li>Cookies and similar tracking technologies (see Section 5)</li>
      </ul>

      <h3 className="text-sm font-bold text-[#141414] mt-4 mb-1">Payment information:</h3>
      <p>
        Payments are processed through PesaPal. We do not collect or store your full card number, mobile money PIN, or banking credentials. PesaPal processes and secures this information under its own privacy and security policies.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Process and fulfill your orders (including calculating delivery fees by zone)</li>
        <li>Communicate with you about your order (confirmations, delivery updates, return/replacement requests)</li>
        <li>Provide customer support</li>
        <li>Send you promotional content, offers, or updates, where you have opted in</li>
        <li>Improve our Site, products, and customer experience</li>
        <li>Detect and prevent fraud, abuse, or violations of our Terms of Use</li>
        <li>Comply with legal obligations under Ugandan law</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">3. How We Share Your Information</h2>
      <p>We do not sell your personal information. We may share your information with:</p>
      <ul className="list-disc list-inside space-y-2 pl-2">
        <li><strong>PesaPal</strong> — to process payments securely.</li>
        <li><strong>Delivery/courier partners</strong> — to fulfill and deliver your order to the correct zone/address.</li>
        <li><strong>Meta (Facebook/Instagram) and TikTok</strong> — for advertising and marketing purposes (e.g. ad targeting, retargeting website visitors), where you have interacted with our ads or Site and applicable ad tracking is enabled.</li>
        <li><strong>Service providers</strong> — such as hosting or technical providers who support our website and business operations, bound by confidentiality obligations.</li>
        <li><strong>Legal authorities</strong> — where required by law, court order, or to protect our legal rights.</li>
      </ul>
      <p className="mt-2">We do not share your information with third parties for their own independent marketing purposes without your consent.</p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">4. Data Retention</h2>
      <p>We retain your personal information for as long as necessary to:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Fulfill the purpose it was collected for (e.g. completing an order)</li>
        <li>Maintain business records (e.g. for accounting, tax, or dispute resolution)</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p className="mt-2">Once no longer needed, we take reasonable steps to delete or anonymize your information.</p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">5. Cookies & Tracking</h2>
      <p>Our Site may use cookies and similar technologies to:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Keep your cart/session active</li>
        <li>Understand how visitors use the Site</li>
        <li>Support advertising and retargeting through Meta Ads and TikTok</li>
      </ul>
      <p className="mt-2">You can control or disable cookies through your browser settings, though this may affect certain Site features.</p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">6. Data Security</h2>
      <p>
        We take reasonable technical and organizational measures to protect your personal information from unauthorized access, loss, misuse, or alteration. However, no method of transmission or storage over the internet is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">7. Your Rights</h2>
      <p>Under Uganda's Data Protection and Privacy Act, 2019, you have the right to:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Know what personal data we hold about you</li>
        <li>Request access to your personal data</li>
        <li>Request correction of inaccurate or incomplete data</li>
        <li>Request deletion of your personal data, where applicable</li>
        <li>Withdraw consent for marketing communications at any time</li>
        <li>Object to certain uses of your data</li>
      </ul>
      <p className="mt-2">To exercise any of these rights, contact us using the details in Section 10.</p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">8. Children's Privacy</h2>
      <p>
        Our Site and products are not directed at children. We do not knowingly collect personal information from anyone under 18. If you believe a child has provided us with personal information, please contact us so we can remove it.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Any changes will be posted on this page with an updated "Last Updated" date. Continued use of the Site after changes are posted constitutes acceptance of the revised policy.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">10. Contact Us</h2>
      <p>If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:</p>
      <ul className="list-none space-y-1 pl-2 font-medium">
        <li>WhatsApp: <a href="https://wa.me/256749156332" target="_blank" rel="noopener noreferrer" style={{color:'#2C5F2D'}} className="hover:underline">+256 749 156 332</a></li>
        <li>Instagram: <a href="https://instagram.com/essentials256" target="_blank" rel="noopener noreferrer" style={{color:'#2C5F2D'}} className="hover:underline">@essentials256</a></li>
        <li>Email: <a href="mailto:comms@essentials256.com" style={{color:'#2C5F2D'}} className="hover:underline">comms@essentials256.com</a></li>
      </ul>
    </StaticPage>
  );
}

// ─── TERMS OF SERVICE / USER AGREEMENT ─────────────────────────────────────────
export function Terms() {
  return (
    <StaticPage title="Terms of Use">
      <div className="border-b pb-4 mb-6" style={{borderColor:'var(--border)'}}>
        <h2 className="text-xl font-semibold mb-1" style={{color:'#141414'}}>Essentials256 Terms of Use / User Agreement</h2>
        <p className="text-xs text-[#999]">Last Updated: {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</p>
      </div>

      <p className="italic">
        Please read these Terms of Use ("Terms," "Agreement") carefully before using the Essentials256 website ("Site," "we," "us," "our"). By accessing or placing an order on this Site, you ("customer," "you," "user") agree to be bound by these Terms. If you do not agree, please do not use this Site.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">1. About Essentials256</h2>
      <p>
        Essentials256 is an online retailer based in Nakawa, Kampala, Uganda, selling footwear (sandals, slippers, flip flops), home decor items (ceramic vases, dried flowers, and related products) and other items as shall be displayed for purchase through this Site and our social media channels.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">2. Eligibility</h2>
      <p>By using this Site, you confirm that:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>You are at least 18 years old, or are using the Site under the supervision of a parent/guardian.</li>
        <li>You are legally capable of entering into binding contracts.</li>
        <li>All information you provide us (name, phone number, delivery address, payment details) is accurate and truthful.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">3. Products & Availability</h2>
      <ul className="list-disc list-inside space-y-2 pl-2">
        <li>We make reasonable efforts to display product images, descriptions, and prices accurately. Minor variations in color, texture, or finish may occur, particularly for handmade or natural items (e.g. dried flowers, ceramic decor).</li>
        <li>All products are subject to availability. We reserve the right to limit quantities, discontinue a product, or refuse an order at our discretion, including in cases of suspected fraud or pricing errors.</li>
        <li>Prices are listed in UGX and may change without prior notice. The price charged will be the price displayed at the time your order is confirmed.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">4. Orders & Payment</h2>
      <ul className="list-disc list-inside space-y-2 pl-2">
        <li>Orders are placed through the Site and confirmed once payment is successfully processed.</li>
        <li>Payments are processed securely via PesaPal. Essentials256 does not store your full payment card or mobile money PIN details.</li>
        <li>An order confirmation does not guarantee stock availability; if an item becomes unavailable after purchase, we will notify you and issue a refund or offer an alternative.</li>
        <li>You are responsible for ensuring your delivery contact details (phone number, address, delivery zone) are correct at checkout. We are not liable for failed or delayed delivery caused by incorrect information provided by you.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">5. Delivery</h2>
      <ul className="list-disc list-inside space-y-2 pl-2">
        <li>Delivery fees are calculated based on your delivery zone, dispatched from our Nakawa origin point.</li>
        <li>Estimated delivery timeframes are provided at checkout but are not guaranteed and may be affected by factors outside our control (traffic, weather, courier delays, incorrect address).</li>
        <li>Risk of loss or damage to items passes to you once the item is delivered to the address provided at checkout.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">6. Returns, Replacements & Refunds</h2>
      <p>
        Returns, replacements, and refunds are governed by our separate <Link to="/returns" style={{color:'#2C5F2D'}} className="hover:underline font-medium">Return & Replacement Policy</Link>, which forms part of these Terms. Please review it before making a purchase. In summary:
      </p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Issues must be reported within 24 hours of delivery.</li>
        <li>Items must be returned unused, in original condition, with all original packaging/special wrapping.</li>
        <li>Replacements are issued where possible; where not possible, refunds are sent via mobile money.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">7. User Conduct</h2>
      <p>When using this Site, you agree not to:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Provide false, misleading, or fraudulent information (including payment or delivery details).</li>
        <li>Use the Site for any unlawful purpose or in violation of Ugandan law.</li>
        <li>Attempt to interfere with, hack, or disrupt the Site's operation or security.</li>
        <li>Copy, reproduce, or misuse our product images, content, or branding without written permission.</li>
        <li>Place orders with the intent not to pay, or engage in chargeback fraud.</li>
      </ul>
      <p className="mt-2">We reserve the right to refuse service, cancel orders, or restrict access to the Site for any user who violates these Terms.</p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">8. Intellectual Property</h2>
      <p>
        All content on this Site including logos, product photography, videos, graphics, and written content is the property of Essentials256 unless otherwise stated, and is protected under applicable Ugandan and international intellectual property laws. You may not reproduce, distribute, or use our content for commercial purposes without our prior written consent.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">9. Third-Party Services</h2>
      <p>
        This Site integrates with third-party services, including PesaPal for payment processing and courier/delivery partners. We are not responsible for outages, errors, or issues arising from these third-party services, though we will assist in resolving any related order issues where possible.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">10. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Essentials256 is not liable for indirect, incidental, or consequential damages arising from your use of the Site or products purchased.</li>
        <li>Our total liability for any claim relating to an order is limited to the amount you paid for that order.</li>
        <li>We are not responsible for delays or failures caused by events beyond our reasonable control (e.g. courier disruptions, network outages, natural events).</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">11. Privacy</h2>
      <p>
        Your personal information (name, phone number, delivery address, order history) is collected and used solely to process orders, deliver products, and communicate with you. We do not sell your personal data to third parties.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">12. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time to reflect changes in our operations or legal requirements. Continued use of the Site after changes are posted constitutes acceptance of the updated Terms.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Uganda. Any disputes arising from your use of this Site or purchase of products shall be subject to the jurisdiction of the courts of Uganda.
      </p>

      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">14. Contact Us</h2>
      <p>For questions about these Terms, please contact us at:</p>
      <ul className="list-none space-y-1 pl-2 font-medium">
        <li>WhatsApp: <a href="https://wa.me/256749156332" target="_blank" rel="noopener noreferrer" style={{color:'#2C5F2D'}} className="hover:underline">+256 749 156 332</a></li>
        <li>Instagram: <a href="https://instagram.com/essentials256" target="_blank" rel="noopener noreferrer" style={{color:'#2C5F2D'}} className="hover:underline">@essentials256</a></li>
        <li>Email: <a href="mailto:comms@essentials256.com" style={{color:'#2C5F2D'}} className="hover:underline">comms@essentials256.com</a></li>
      </ul>
    </StaticPage>
  );
}

