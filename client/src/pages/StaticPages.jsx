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
      <h1 className="font-serif text-4xl font-medium mb-8" style={{color:'#141414'}}>{title}</h1>
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
    <StaticPage title="Returns Policy">
      <p>
        We want you to love every purchase. If something isn't right, we offer a
        <strong> 14-day hassle-free return policy</strong> on all items.
      </p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Eligibility</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Item must be returned within <strong>14 days</strong> of delivery</li>
        <li>Item must be unworn, unwashed and in original packaging</li>
        <li>Proof of purchase (order number or receipt) required</li>
        <li>Sale items marked <em>Final Sale</em> are not eligible</li>
      </ul>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">How to Return</h2>
      <ol className="list-decimal list-inside space-y-2">
        <li>Contact us via WhatsApp or email with your order number</li>
        <li>We'll provide a return address and instructions within 24 hours</li>
        <li>Ship the item back at your own cost (or drop off at our Kampala / Kigali location)</li>
        <li>Refund is processed within <strong>3–5 business days</strong> of receiving the item</li>
      </ol>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Refunds</h2>
      <p>
        Refunds are issued to the original payment method (MTN MoMo, Airtel Money,
        or card). Allow 3–5 business days for the funds to appear.
      </p>
      <div className="flex gap-3 pt-2">
        <a href="https://wa.me/256700000000?text=Hi, I'd like to return an order"
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
          { icon:'💬', title:'WhatsApp (fastest)', detail:'+256 700 000 000', href:'https://wa.me/256700000000' },
          { icon:'📧', title:'Email', detail:'hello@essentials256.com', href:'mailto:hello@essentials256.com' },
          { icon:'📍', title:'Kampala Office', detail:'Kampala Road, Plot 23\nCentral Division, Uganda', href:null },
          { icon:'📍', title:'Kigali Office', detail:'KG 11 Ave, Kacyiru\nKigali, Rwanda', href:null },
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

// ─── ABOUT ────────────────────────────────────────────────────────────────────
export function About() {
  return (
    <StaticPage title="About Essentials256">
      <p className="text-lg text-[#141414] font-light leading-relaxed">
        Essentials256 is a premium e-commerce platform for ladies footwear and interior decor,
        built for the modern African woman in Rwanda and Uganda.
      </p>
      <p>
        We curate styles that blend global trends with East African taste — from classic pumps
        and contemporary sneakers to handcrafted home decor that transforms your space.
      </p>
      <p>
        Founded with the belief that premium style should be accessible, we offer genuine quality
        products, transparent pricing in UGX/RWF, and payments through PesaPal — supporting
        MTN MoMo, Airtel Money, Visa, and Mastercard.
      </p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-3">Our Values</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon:'💎', title:'Quality First',    desc:'Every product is carefully selected for craftsmanship and durability.' },
          { icon:'🌍', title:'Local & Proud',    desc:'Based in Kigali and Kampala, we understand what East African women love.' },
          { icon:'🔒', title:'Safe Shopping',    desc:'PCI-DSS Level 1 payments, 14-day returns, and transparent policies.' },
        ].map(v => (
          <div key={v.title} className="bg-[#e8f2e8] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">{v.icon}</div>
            <div className="font-semibold text-[#141414] mb-1">{v.title}</div>
            <p className="text-sm text-[#5a5a5a]">{v.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-4">
        <Link to="/footwear"
              className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{background:'#2C5F2D'}}>
          Shop Now
        </Link>
        <Link to="/contact"
              className="inline-block rounded-full px-6 py-3 text-sm font-medium border border-[#ede9e2] text-[#5a5a5a] hover:border-[#2C5F2D] hover:text-[#2C5F2D] transition-colors">
          Get in Touch
        </Link>
      </div>
    </StaticPage>
  );
}

// ─── PRIVACY POLICY ───────────────────────────────────────────────────────────
export function Privacy() {
  return (
    <StaticPage title="Privacy Policy">
      <p className="text-sm text-[#999]">Last updated: {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</p>
      <p>Essentials256 is committed to protecting your personal information. This policy explains what we collect, how we use it, and your rights.</p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">What We Collect</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Name, email address and phone number when you create an account or place an order</li>
        <li>Delivery address for shipping purposes</li>
        <li>Payment details — processed securely by PesaPal; we never store card data</li>
        <li>Browsing behaviour on our site (via analytics) to improve your experience</li>
      </ul>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">How We Use It</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>To process and deliver your orders</li>
        <li>To send order confirmations and shipping updates</li>
        <li>To send promotional emails — you can unsubscribe at any time</li>
        <li>To improve our products and services</li>
      </ul>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Your Rights</h2>
      <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:privacy@essentials256.com" style={{color:'#2C5F2D'}}>privacy@essentials256.com</a>.</p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Third Parties</h2>
      <p>We share your data with PesaPal (payment processing) and our delivery partners only as necessary to fulfil your order. We do not sell your data.</p>
    </StaticPage>
  );
}

// ─── TERMS OF SERVICE ─────────────────────────────────────────────────────────
export function Terms() {
  return (
    <StaticPage title="Terms of Service">
      <p className="text-sm text-[#999]">Last updated: {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</p>
      <p>By using Essentials256 you agree to these terms. Please read them carefully.</p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Orders & Payments</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>All prices are displayed in UGX (Ugandan Shillings)</li>
        <li>Payments are processed securely through PesaPal</li>
        <li>An order is confirmed once payment is successfully processed</li>
        <li>We reserve the right to cancel orders in cases of stock unavailability or pricing errors</li>
      </ul>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Delivery</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Standard delivery: 3–5 business days within Uganda and Rwanda</li>
        <li>Express delivery: 1–2 business days</li>
        <li>Delivery times are estimates and not guaranteed</li>
      </ul>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Returns</h2>
      <p>
        See our <Link to="/returns" style={{color:'#2C5F2D'}} className="hover:underline">Returns Policy</Link> for
        full details on eligibility and the return process.
      </p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Intellectual Property</h2>
      <p>All content on this site — including images, text and branding — is the property of Essentials256 and may not be reproduced without permission.</p>
      <h2 className="text-lg font-semibold text-[#141414] mt-6 mb-2">Contact</h2>
      <p>Questions? Reach us at <a href="mailto:legal@essentials256.com" style={{color:'#2C5F2D'}}>legal@essentials256.com</a> or via <Link to="/contact" style={{color:'#2C5F2D'}} className="hover:underline">our contact page</Link>.</p>
    </StaticPage>
  );
}

// ─── BLOG PLACEHOLDER ─────────────────────────────────────────────────────────
export function Blog() {
  const posts = [
    { title:'5 Heel Styles Every Woman Should Own', date:'12 April 2025', cat:'Footwear', slug:'5-heel-styles' },
    { title:'How to Style Boho Decor in a Modern Home', date:'3 March 2025', cat:'Decor', slug:'boho-decor-modern-home' },
    { title:'The Ultimate Shoe Care Guide', date:'18 February 2025', cat:'Footwear', slug:'shoe-care-guide' },
  ];
  return (
    <StaticPage title="Blog">
      <p>Style tips, home inspiration and news from Essentials256.</p>
      <div className="grid gap-5 mt-4">
        {posts.map(post => (
          <div key={post.slug} className="bg-white border border-[#ede9e2] rounded-2xl p-5 hover:border-[#2C5F2D] transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{background:'#e8f2e8',color:'#2C5F2D'}}>
                {post.cat}
              </span>
              <span className="text-xs text-[#999]">{post.date}</span>
            </div>
            <h3 className="font-semibold text-[#141414]">{post.title}</h3>
            <p className="text-sm text-[#2C5F2D] mt-2 font-medium">Read article →</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
