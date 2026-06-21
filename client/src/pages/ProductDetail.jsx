import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/api';
import { useCartStore, useWishlistStore } from '../stores';
import { useToast } from '../hooks/useToast';
import { PRODUCT_IMAGES, getProductImage } from '../utils/images';

const fmt = n => `UGX ${n?.toLocaleString()}`;

export default function ProductDetail() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { addItem } = useCartStore();
  const { toggle, isWished } = useWishlistStore();
  const { showToast, showError } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg,  setActiveImg]  = useState(0);
  const [selSize,    setSelSize]    = useState(null);
  const [qty,        setQty]        = useState(1);
  const [activeTab,  setActiveTab]  = useState('details');
  const [adding,     setAdding]     = useState(false);

  useEffect(() => {
    setLoading(true);
    productService.getBySlug(slug)
      .then(({ data }) => { setProduct(data); })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-7 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div><div className="rounded-2xl animate-pulse" style={{height:440,background:'#f0ede8'}} /></div>
      <div className="space-y-4">{[200,60,80,140,60].map((w,i)=><div key={i} className="rounded animate-pulse" style={{height:20,background:'#f0ede8',width:`${w}px`}}/>)}</div>
    </div>
  );
  if (!product) return null;

  const isFW = product.type === 'footwear';
  const details = isFW ? product.footwearDetails : product.decorDetails;
  const discount = product.compareAtPrice ? Math.round((1-product.price/product.compareAtPrice)*100) : 0;
  const wished = isWished(product._id);

  // Build image gallery — prefer stored images, fall back to Unsplash map
  const storedImgs = product.images?.filter(Boolean) || [];
  const unsplashImgs = PRODUCT_IMAGES[product.slug] || [];
  const gallery = storedImgs.length ? storedImgs : unsplashImgs.length ? unsplashImgs : [getProductImage(product.slug)];

  const TABS_FW = [{id:'details',l:'Details'},{id:'sizing',l:'Sizing Guide'}];
  const TABS_DC = [{id:'details',l:'Details'},{id:'specs',l:'Specs'},{id:'care',l:'Care'}];
  const tabs = isFW ? TABS_FW : TABS_DC;

  const handleAdd = async () => {
    if (isFW && !selSize) { showError('Please select a size'); return; }
    setAdding(true);
    await new Promise(r => setTimeout(r, 280));
    addItem(product, { size: selSize, qty });
    showToast(`✓ ${product.name} added to cart`);
    setAdding(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-7 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#999] mb-8">
        <Link to="/" className="hover:text-[#2C5F2D]">Home</Link>
        <span>/</span>
        <Link to={`/${isFW?'footwear':'decor'}`} className="hover:text-[#2C5F2D]">{isFW?'Footwear':'Decor'}</Link>
        <span>/</span>
        <span className="text-[#5a5a5a]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* GALLERY */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div key={activeImg} initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:.25}}
                className="relative rounded-2xl overflow-hidden border border-[#ede9e2]"
                style={{height:440,background:'#f5f2ed'}}>
              <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              {discount > 0 && (
                <div className="absolute top-4 left-4 badge badge-sale">−{discount}%</div>
              )}
              {product.stock < 10 && product.stock > 0 && (
                <div className="absolute top-4 right-4 badge badge-low">Only {product.stock} left</div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-2">
            {gallery.map((src, i) => (
              <button key={i} onClick={()=>setActiveImg(i)}
                  className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImg===i?'border-[#2C5F2D]':'border-transparent'}`}
                  style={{width:70,height:70,background:'#f5f2ed'}}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div>
          <div className="text-[11px] text-[#999] uppercase tracking-[1.2px] mb-2">{product.category}</div>
          <h1 className="font-semibold leading-tight mb-4 tracking-tight" style={{fontSize:'clamp(30px,3.5vw,42px)',fontWeight:500}}>
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="font-bold text-[#2C5F2D]" style={{fontSize:30}}>{fmt(product.price)}</span>
            {product.compareAtPrice > 0 && <>
              <span className="text-[18px] text-[#aaa] line-through">{fmt(product.compareAtPrice)}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:'#e8f5e8',color:'#2a7d2e'}}>Save {discount}%</span>
            </>}
          </div>

          {isFW && details?.sizes?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-[#999] uppercase tracking-[.8px]">Select Size (EU)</div>
                <button className="text-xs text-[#2C5F2D] font-medium hover:underline">📏 Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {details.sizes.map(s => (
                  <button key={s} onClick={()=>setSelSize(s)}
                      className={`size-btn ${selSize===s?'selected':''}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decor dims */}
          {!isFW && details?.dimensions && (
            <div className="rounded-xl p-4 mb-5 text-sm grid grid-cols-2 gap-2.5"
                 style={{background:'#faf7f2'}}>
              {Object.entries({
                Height: details.dimensions.height && `${details.dimensions.height}cm`,
                Width:  details.dimensions.width  && `${details.dimensions.width}cm`,
                Weight: details.weight && `${details.weight}kg`,
                Style:  details.style?.join(', '),
              }).filter(([,v])=>v).map(([k,v]) => (
                <div key={k}><span className="text-[#999]">{k}:</span> <strong>{v}</strong></div>
              ))}
            </div>
          )}

          {/* Qty + Add */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-[#ede9e2] rounded-full overflow-hidden">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))}
                  className="w-10 h-11 flex items-center justify-center text-[18px] text-[#5a5a5a] hover:bg-[#1e805f] transition-colors">−</button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={()=>setQty(q=>Math.min(product.stock,q+1))}
                  className="w-10 h-11 flex items-center justify-center text-[18px] text-[#5a5a5a] hover:bg-[#1e805f] transition-colors">+</button>
            </div>
            <motion.button onClick={handleAdd} disabled={adding || product.stock===0} whileTap={{scale:.97}}
                className="flex-1 btn-sage py-3.5 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#1e805f', color: '#fff',border: 'none', borderRadius: '9999px' }}
                >
              {adding
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/></span>
                : product.stock===0 ? 'Out of Stock'
                : `Add to Cart — ${fmt(product.price*qty)}`}
            </motion.button>
            <button onClick={()=>{ const a=toggle(product); showToast(a?'♥ Added to wishlist':'Removed from wishlist'); }}
                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${wished?'border-red-300 bg-red-50':'border-[#ede9e2] hover:border-red-200'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wished?'#e05252':'none'}
                   stroke={wished?'#e05252':'#aaa'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>


          {/* Trust row */}
<div className="grid grid-cols-4 gap-2 mb-6">
  {[
    { img: 'https://i.postimg.cc/tCtkDmVd/Mo-Mo-logo.png', title: '', subtitle: '' },
    { img: 'https://i.postimg.cc/tnHFTGBL/Airtel-logo-01.png', title: '', subtitle: '' },
    { img: 'https://i.postimg.cc/64NC3xMF/Visa-Inc-logo-(2021-present)-svg.png', title: '', subtitle: '' },
    { img: 'https://i.postimg.cc/0Kq7Q1t1/Mastercard-logo-svg.png', title: '', subtitle: '' }
  ].map((item, idx) => (
    <div key={idx} className="rounded-xl p-3 text-center" style={{ background: '#faf7f2' }}>
      <div className="flex justify-center mb-2">
        <img src={item.img} alt={item.title} width="48" height="48" className="object-contain" />
      </div>
      <div className="text-[10px] font-semibold text-[#141414] leading-tight">{item.title}</div>
      <div className="text-[9px] text-[#999] mt-0.5">{item.subtitle}</div>
    </div>
  ))}
</div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-[#ede9e2]">
              {tabs.map(tab => (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                      activeTab===tab.id ? 'border-[#2C5F2D] text-[#2C5F2D] font-medium' : 'border-transparent text-[#aaa] hover:text-[#5a5a5a]'
                    }`}>
                  {tab.l}
                </button>
              ))}
            </div>
            <div className="py-5 text-sm text-[#5a5a5a] leading-relaxed">
              {activeTab==='details' && (
                <div>
                  <p className="mb-4">{product.description}</p>
                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    {details?.material && <div><span className="text-[#999]">Material:</span> <strong>{details.material}</strong></div>}
                    {isFW && details?.heelHeight && <div><span className="text-[#999]">Heel:</span> <strong>{details.heelHeight}cm</strong></div>}
                    <div><span className="text-[#999]">SKU:</span> <strong>{product.sku}</strong></div>
                    <div><span className="text-[#999]">Stock:</span> <strong className="text-green-600">{product.stock} available</strong></div>
                  </div>
                </div>
              )}
              {activeTab==='sizing' && (
                <div>
                  <p className="mb-4">Measure your foot length and compare to the chart below.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[35,36,37,38,39,40,41,42].map(s=>(
                      <div key={s} className="rounded-lg p-3 text-center" style={{background:'#faf7f2'}}>
                        <div className="font-bold text-[#2C5F2D]">{s}</div>
                        <div className="text-[11px] text-[#999] mt-0.5">{(21.5+(s-35)*.65).toFixed(1)}cm</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab==='specs' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[['Material',details?.material],['Dimensions',details?.dimensions?`${details.dimensions.height}×${details.dimensions.width}cm`:null],
                    ['Weight',details?.weight&&`${details.weight}kg`],['Style',details?.style?.join(', ')],['Room',details?.room?.join(', ')]]
                    .filter(([,v])=>v).map(([k,v])=>(
                    <div key={k}><span className="text-[#999]">{k}:</span> <strong>{v}</strong></div>
                  ))}
                </div>
              )}
              {activeTab==='care' && <p>{details?.careInstructions||'Please refer to the product label for care instructions.'}</p>}
              {activeTab==='reviews' && (
                <div className="space-y-5">
                  {[{n:'Jane D.',r:5,t:'Absolutely perfect!',c:'True to size and incredibly comfortable. Exactly as described — the leather quality is exceptional.',fit:'True to size'},
                    {n:'Mary S.',r:4,t:'Beautiful craftsmanship',c:'Fast delivery, gorgeous finish. Would definitely order again.',fit:'Runs slightly small'}].map((rev,i)=>(
                    <div key={i} className="border-b border-[#ede9e2] pb-5 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                             style={{background:'#e8f2e8',color:'#2C5F2D'}}>{rev.n[0]}</div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            {rev.n}
                            <span className="text-[10px] px-2 py-0.5 rounded-full border"
                                  style={{background:'#e8f5e8',color:'#2a7d2e',borderColor:'#c3e6cb'}}>✓ Verified</span>
                          </div>
                          <div className="text-[#c9a840] text-xs">{'★'.repeat(rev.r)}</div>
                        </div>
                      </div>
                      <p className="font-medium text-sm mb-1">{rev.t}</p>
                      <p className="text-[#5a5a5a] text-sm">{rev.c}</p>
                      {rev.fit && isFW && <p className="text-xs text-[#999] mt-1.5">Fit: <strong>{rev.fit}</strong></p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
