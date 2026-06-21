import { useState, useEffect } from 'react';
import { api } from '../stores';

const inputCls = "w-full px-3 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors bg-white";
const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1";

const DEFAULT = {
  eyebrow:      'New Season Arrivals',
  heading:      'Where *Style* Meets Your Space',
  subheading:   'Your Essentials for a Perfect Home & Lifestyle',
  ctaPrimary:   { label: 'Shop Footwear', link: '/footwear' },
  ctaSecondary: { label: 'Explore Decor', link: '/decor'    },
  stat1: { value: '500+', label: 'Products'   },
  stat2: { value: '4.8★', label: 'Avg Rating' },
  stat3: { value: '1K+',  label: 'Customers'  },
  images: [
    { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=85&fit=crop', name: 'Classic Pumps', price: 'UGX 145,000', link: '/products/classic-pump-heels' },
    { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=85&fit=crop', name: 'Boho Cushions', price: 'UGX 65,000', link: '/products/boho-cushion-covers' },
  ],
};

export default function AdminHero() {
  const [config,  setConfig]  = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/hero')
      .then(({ data }) => setConfig(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (path, value) => {
    // Supports dot-notation: 'ctaPrimary.label', 'images.0.url', 'stat1.value'
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev)); // deep clone
      const keys = path.split('.');
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) {
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addImage = () => {
    setConfig(prev => ({
      ...prev,
      images: [...prev.images, { url: '', name: '', price: '', link: '/' }],
    }));
  };

  const removeImage = (i) => {
    setConfig(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== i),
    }));
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/hero', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#f5f2ed] rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-medium mb-1">Hero Section</h2>
          <p className="text-sm text-[#999]">Edit the homepage hero banner — changes go live instantly on save.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: saved ? '#2a7d2e' : '#2C5F2D' }}>
          {saving
            ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm bg-[#fef2f2] text-[#e05252] border border-[#fecaca]">
          {error}
        </div>
      )}

      {/* Live preview strip */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-[#ede9e2]"
           style={{ background: 'linear-gradient(145deg,#0f1f0f,#2C5F2D)', minHeight: 120 }}>
        <div className="p-5">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2"
               style={{ background: 'rgba(184,151,58,.2)', border: '1px solid rgba(184,151,58,.3)' }}>
            <span className="text-[#f0d882] text-[10px] tracking-widest uppercase">{config.eyebrow}</span>
          </div>
          <h3 className="font-semibold text-white text-xl mb-1 leading-tight"
              dangerouslySetInnerHTML={{ __html: config.heading.replace(/\*(.+?)\*/g, '<em style="color:#f0d882">$1</em>') }} />
          <p className="text-white/60 text-xs mb-3">{config.subheading}</p>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#141414]"
                  style={{ background: '#b8973a' }}>{config.ctaPrimary.label}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium text-white border border-white/25">
              {config.ctaSecondary.label}
            </span>
          </div>
          <div className="flex gap-6 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
            {[config.stat1, config.stat2, config.stat3].map(s => (
              <div key={s.label}>
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-white/40 text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Text content ── */}
        <Card title="Text Content">
          <Field label="Main heading — wrap italic text in *asterisks* e.g. Where *Style* Meets Your Space">
            <input value={config.heading} onChange={e => set('heading', e.target.value)} className={inputCls} placeholder="Where *Style* Meets Your Space" />
            <p className="text-[11px] text-[#999] mt-1">
              Preview: <span dangerouslySetInnerHTML={{ __html: config.heading.replace(/\*(.+?)\*/g, '<em style="color:#b8973a">$1</em>') }} />
            </p>
          </Field>
          <Field label="Subheading">
            <input value={config.subheading} onChange={e => set('subheading', e.target.value)} className={inputCls} placeholder="Your Essentials for a Perfect Home & Lifestyle" />
          </Field>
          <Field label="Left Panel Background Image URL (optional)">
             <input value={config.bgImage || ''}
               onChange={e => set('bgImage', e.target.value)}
                  className={inputCls}
               placeholder="https://images.unsplash.com/photo-...?w=800&q=85&fit=crop"
           />
                 <p className="text-[11px] text-[#999] mt-1">
                 Leave empty to use the default dark gradient. Image will be overlaid with the gradient so text stays readable.
                </p>
</Field>
        </Card>

        {/* ── CTA Buttons ── */}
        <Card title="Call-to-Action Buttons">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#2C5F2D] uppercase tracking-wide">Primary Button (gold)</div>
              <Field label="Button Label">
                <input value={config.ctaPrimary.label} onChange={e => set('ctaPrimary.label', e.target.value)} className={inputCls} placeholder="Shop Footwear" />
              </Field>
              <Field label="Link (URL path)">
                <input value={config.ctaPrimary.link} onChange={e => set('ctaPrimary.link', e.target.value)} className={inputCls} placeholder="/footwear" />
              </Field>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#999] uppercase tracking-wide">Secondary Button (outline)</div>
              <Field label="Button Label">
                <input value={config.ctaSecondary.label} onChange={e => set('ctaSecondary.label', e.target.value)} className={inputCls} placeholder="Explore Decor" />
              </Field>
              <Field label="Link (URL path)">
                <input value={config.ctaSecondary.link} onChange={e => set('ctaSecondary.link', e.target.value)} className={inputCls} placeholder="/decor" />
              </Field>
            </div>
          </div>
        </Card>

        {/* ── Stats ── */}
        <Card title="Statistics Bar">
          <div className="grid grid-cols-3 gap-4">
            {['stat1','stat2','stat3'].map((key, i) => (
              <div key={key} className="space-y-2">
                <div className="text-xs font-semibold text-[#999] uppercase tracking-wide">Stat {i+1}</div>
                <Field label="Value">
                  <input value={config[key].value} onChange={e => set(`${key}.value`, e.target.value)} className={inputCls} placeholder="500+" />
                </Field>
                <Field label="Label">
                  <input value={config[key].label} onChange={e => set(`${key}.label`, e.target.value)} className={inputCls} placeholder="Products" />
                </Field>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Images ── */}
        <Card title="Hero Images (right side)">
          <p className="text-xs text-[#999] mb-4">
            Add up to 4 images. Use Unsplash URLs or your Cloudinary image URLs.
            Images are displayed side-by-side in equal columns.
          </p>
          <div className="space-y-4">
            {config.images.map((img, i) => (
              <div key={i} className="border border-[#ede9e2] rounded-xl p-4 relative">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-[11px] text-[#999] font-medium">Image {i+1}</span>
                  {config.images.length > 1 && (
                    <button onClick={() => removeImage(i)}
                            className="w-6 h-6 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-[#e05252] text-xs hover:bg-red-100 transition-colors">
                      ✕
                    </button>
                  )}
                </div>

                {/* Image preview */}
                <div className="flex gap-4 mb-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#ede9e2]"
                       style={{ background: '#f5f2ed' }}>
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover"
                           onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-[#ccc]">🖼</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Field label="Image URL">
                      <input value={img.url}
                             onChange={e => set(`images.${i}.url`, e.target.value)}
                             className={inputCls}
                             placeholder="https://images.unsplash.com/photo-...?w=700&q=85&fit=crop" />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Caption (product name)">
                    <input value={img.name}
                           onChange={e => set(`images.${i}.name`, e.target.value)}
                           className={inputCls} placeholder="Classic Pumps" />
                  </Field>
                  <Field label="Price label">
                    <input value={img.price}
                           onChange={e => set(`images.${i}.price`, e.target.value)}
                           className={inputCls} placeholder="UGX 145,000" />
                  </Field>
                  <Field label="Click link">
                    <input value={img.link}
                           onChange={e => set(`images.${i}.link`, e.target.value)}
                           className={inputCls} placeholder="/products/classic-pump-heels" />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          {config.images.length < 4 && (
            <button onClick={addImage}
                    className="mt-4 w-full border-2 border-dashed border-[#ede9e2] rounded-xl py-3 text-sm text-[#999] hover:border-[#2C5F2D] hover:text-[#2C5F2D] transition-colors">
              + Add another image
            </button>
          )}
        </Card>

      </div>

      {/* Bottom save */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#ede9e2]">
        <p className="text-xs text-[#999]">Changes are saved to the database and go live immediately.</p>
        <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: saved ? '#2a7d2e' : '#2C5F2D' }}>
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// Helpers
function Card({ title, children }) {
  return (
    <div className="bg-white border border-[#ede9e2] rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-4 pb-3 border-b border-[#f5f2ed] text-[#141414]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}
