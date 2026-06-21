import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/api';
import { api } from '../stores';
import ProductCard from '../components/products/ProductCard';
import { COLLECTION_IMAGES } from '../utils/images';

const CATS = [
  { id:'all',      label:'All',      icon:'' },
  { id:'footwear', label:'Footwear', icon:'' },
  { id:'decor',    label:'Decor',    icon:'' },
];

const COLLECTIONS = [
  { key:'officeChic',   title:'All',   sub:'Professional elegance',     href:'/products' },
  { key:'bohoHome',     title:'Decor',     sub:'Natural textures & warmth', href:'/decor'    },
  { key:'weekendVibes', title:'Footwear', sub:'Relaxed, effortless style', href:'/footwear' },
  { key:'partySeason',  title:'Accessories',  sub:'Statement pieces to shine', href:'/accessories' },
];

const DEFAULT_HERO = {
  eyebrow:      'New Season Arrivals',
  heading:      'Where *Style* Meets Your Space',
  subheading:   'Your Essentials for a Perfect Home & Lifestyle',
  ctaPrimary:   { label:'Shop Footwear', link:'/footwear' },
  ctaSecondary: { label:'Explore Decor', link:'/decor'    },
  stat1: { value:'500+', label:'Products'   },
  stat2: { value:'4.8★', label:'Avg Rating' },
  stat3: { value:'1K+',  label:'Customers'  },
  images: [
    { url:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=85&fit=crop', name:'Classic Pumps', price:'UGX 145,000', link:'/products/classic-pump-heels' },
    { url:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=85&fit=crop', name:'Boho Cushions', price:'UGX 65,000', link:'/products/boho-cushion-covers' },
  ],
  bgImage: '',
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [hero,     setHero]     = useState(DEFAULT_HERO);

  useEffect(() => {
    api.get('/hero').then(({ data }) => setHero(data)).catch(() => {});
    productService.list({ status:'active', limit:100 })
      .then(({ data }) => { if (data.products?.length) setProducts(data.products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? products : products.filter(p => p.type === tab);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hidden md:block" 
        style={{
          backgroundImage: hero.bgImage
            ? `linear-gradient(145deg, rgba(21,30,42,0.82) 0%, rgba(33,40,54,0.78) 45%, rgba(26,74,56,0.75) 75%, rgba(30,128,95,0.72) 100%), url("${hero.bgImage}")`
            : 'linear-gradient(145deg, #151e2a 0%, #212836 45%, #1a4a38 75%, #1e805f 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative flex flex-col justify-center px-6 md:px-10 py-8 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full" style={{ background: 'rgba(134,232,196,0.06)' }} />
            <div className="relative z-10 flex flex-col gap-6">
              <motion.h1 initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.45}}
                  className="font-semibold text-white leading-tight"
                  style={{fontSize:'clamp(36px,4.5vw,54px)',fontWeight:500,lineHeight:1.1}}
                  dangerouslySetInnerHTML={{__html:hero.heading.replace(/\*(.+?)\*/g,'<em style="color:#86e8c4">$1</em>')}} />
              <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.12}}
                  className="text-white/65 leading-relaxed font-light"
                  style={{fontSize:'clamp(14px,1.4vw,17px)',maxWidth:380}}>
                {hero.subheading}
              </motion.p>
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="flex flex-wrap gap-3">
                <Link to={hero.ctaPrimary.link} className="btn-primary" style={{padding:'13px 30px',fontSize:14}}>{hero.ctaPrimary.label}</Link>
                <Link to={hero.ctaSecondary.link} className="btn-ghost" style={{padding:'13px 30px',fontSize:14}}>{hero.ctaSecondary.label}</Link>
              </motion.div>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.28}} className="flex gap-8 pt-4" style={{borderTop:'1px solid rgba(255,255,255,.1)'}}>
                {[hero.stat1,hero.stat2,hero.stat3].map(s=>(
                  <div key={s.label}>
                    <div className="font-bold text-white leading-none" style={{fontSize:22}}>{s.value}</div>
                    <div className="text-white/45 mt-1" style={{fontSize:11,letterSpacing:'.4px'}}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
          <div className="grid gap-[2px]" style={{background:'#0d1a14',gridTemplateColumns:`repeat(${Math.min(hero.images.length,2)},1fr)`,minHeight:'200px'}}>
            {hero.images.slice(0,2).map((img,i)=>(
              <Link key={i} to={img.link||'/'} className="relative overflow-hidden group block" style={{minHeight:'200px'}}>
                <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{position:'absolute',inset:0,width:'100%',height:'100%'}} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
                  {img.name&&<div className="text-white font-semibold text-sm leading-tight">{img.name}</div>}
                  {img.price&&<div style={{color:'#86e8c4'}} className="text-[13px] font-medium mt-1">{img.price}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      <section className="px-5 md:px-7 pt-10 pb-4">
        {/* Changed container to hidden on mobile, flex on desktop to gracefully hide the whole header block */}
        <div className="hidden md:flex items-baseline justify-between mb-5">
          <h2 className="font-semibold text-[28px] font-medium tracking-tight">Featured Collections</h2>
          <Link to="/products" className="text-sm font-medium hover:underline" style={{color:'#2C5F2D'}}>View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {COLLECTIONS.map((c, i) => (
            <motion.div key={c.key} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.07}}>
              <Link to={c.href} className="collection-card block" style={{height:190}}>
                <img src={COLLECTION_IMAGES[c.key]} alt={c.title} className="w-full h-full object-cover" />
                <div className="collection-overlay">
                  <h3 className="font-semibold text-[20px] text-white leading-tight">{c.title}</h3>
                  <p className="text-white/70 text-[11px] mt-1">{c.sub}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="px-5 md:px-7 pb-14">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-7">
          <div className="hidden md:block">
            <h2 className="font-semibold text-[24px] md:text-[28px] font-medium tracking-tight" style={{color:'var(--ink)'}}>
              {tab==='all'?'Featured Products':tab==='footwear'?'Footwear':'Interior Decor'}
            </h2>
            <p className="text-sm mt-0.5" style={{color:'var(--ink-soft)'}}>
              {loading ? 'Loading...' : `${filtered.length} product${filtered.length!==1?'s':''}`}
            </p>
          </div>
          <div className="flex rounded-full p-1 gap-0.5" style={{background:'var(--border)'}}>
            {CATS.map(cat=>(
              <button key={cat.id} onClick={()=>setTab(cat.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
                  style={tab===cat.id
                    ? {background:'var(--ink)',color:'#fff',boxShadow:'0 2px 8px rgba(33,40,54,.2)'}
                    : {color:'var(--ink-soft)'}}>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {Array.from({length:10}).map((_,i)=>(
              <div key={i} className="bg-white rounded-2xl overflow-hidden border animate-pulse" style={{borderColor:'var(--border)'}}>
                <div className="h-60" style={{background:'var(--teal-pale)'}} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded w-1/2" style={{background:'var(--teal-pale)'}} />
                  <div className="h-4 rounded w-3/4" style={{background:'var(--teal-pale)'}} />
                  <div className="h-4 rounded w-1/3" style={{background:'var(--teal-pale)'}} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {filtered.map((p,i)=>(
              <ProductCard key={p._id||p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{tab==='footwear'?'👟':tab==='decor'?'🏺':'🛍'}</div>
            <h3 className="font-semibold text-xl mb-2" style={{color:'var(--ink)'}}>No {tab==='all'?'':tab} products yet</h3>
            <p className="text-sm mb-6" style={{color:'var(--ink-soft)'}}>Products added in the admin panel will appear here automatically.</p>
            <Link to="/admin/products" className="inline-block rounded-full px-6 py-3 text-sm font-semibold text-white" style={{background:'var(--teal)'}}>Add Products in Admin</Link>
          </div>
        )}
      </section>
    </div>
  );
}