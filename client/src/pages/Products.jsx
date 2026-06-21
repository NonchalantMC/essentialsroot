import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const SIZES  = [35,36,37,38,39,40,41,42];
const STYLES = ['Modern','Boho','Minimalist','Vintage','Abstract','Natural'];
const ROOMS  = ['Living Room','Bedroom','Kitchen','Office','Balcony'];

const SORTS = [
  { value:'-createdAt', label:'Newest First'      },
  { value:'price',      label:'Price: Low → High'  },
  { value:'-price',     label:'Price: High → Low'  },
  { value:'name',       label:'Name: A → Z'         },
];

export default function Products({ type }) {
  const [params, setParams] = useSearchParams();
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [showFilter,  setShowFilter]  = useState(false);

  const tag = params.get('tag') || '';

  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    size:     '',
    style:    '',
    room:     '',
    sort:     '-createdAt',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        status:  'active',
        limit:   100, // fetch all then sort/filter client-side for sale tag accuracy
        page:    1,
        ...(type               && { type }),
        ...(params.get('search')   && { search:   params.get('search') }),
        ...(filters.minPrice       && { minPrice: filters.minPrice }),
        ...(filters.maxPrice       && { maxPrice: filters.maxPrice }),
        ...(filters.size           && { size:     filters.size }),
        ...(filters.style          && { style:    filters.style }),
        ...(filters.room           && { room:     filters.room }),
      };
      const { data } = await productService.list(query);
      let list = data.products || [];

      // ── Sale filter: match products tagged 'sale' OR with a compareAtPrice ──
      if (tag === 'sale') {
        list = list.filter(p =>
          p.tags?.includes('sale') || (p.compareAtPrice && p.compareAtPrice > p.price)
        );
      } else if (tag === 'new') {
        list = list.filter(p => p.tags?.includes('new'));
      } else if (tag === 'featured') {
        list = list.filter(p => p.tags?.includes('featured') || p.featured);
      }

      // ── Client-side sort ──────────────────────────────────────────────────
      list = [...list].sort((a, b) => {
        switch (filters.sort) {
          case 'price':      return a.price - b.price;
          case '-price':     return b.price - a.price;
          case 'name':       return a.name.localeCompare(b.name);
          case '-createdAt':
          default:
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
      });

      setProducts(list);
      setTotal(list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [type, filters, params]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [tag]);

  const updateFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ minPrice:'', maxPrice:'', size:'', style:'', room:'', sort:'-createdAt' });
    setPage(1);
  };

  // Pagination — slice client-side
  const PAGE_SIZE   = 20;
  const paginated   = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const activeFilters = Object.entries(filters)
    .filter(([k, v]) => v && !(k === 'sort' && v === '-createdAt')).length;

  // Page title
  const title = tag === 'sale'
    ? ' Sale'
    : tag === 'new'
    ? ' New Arrivals'
    : type === 'footwear'
    ? ' Footwear'
    : type === 'decor'
    ? ' Decor'
    : type === 'accessories'
    ? 'Accessories'
    : ' All Products';

  const inp = "px-3 py-2 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#1e805f] transition-colors bg-white";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-semibold text-3xl" style={{ color:'var(--ink)' }}>{title}</h1>
          <p className="text-sm mt-1" style={{ color:'var(--ink-soft)' }}>
            {loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Sort dropdown */}
          <select
            value={filters.sort}
            onChange={e => updateFilter('sort', e.target.value)}
            className={inp + ' pr-8'}
            style={{ color:'var(--ink)' }}
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
            style={{
              borderColor: activeFilters > 0 ? 'var(--teal)' : 'var(--border)',
              color:       activeFilters > 0 ? 'var(--teal)' : 'var(--ink-mid)',
              background:  activeFilters > 0 ? 'var(--teal-pale)' : 'white',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                    style={{ background:'var(--teal)' }}>
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sale banner */}
      {tag === 'sale' && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
             style={{ background:'linear-gradient(135deg,#212836,#1e805f)' }}>
          <span className="text-2xl">🏷️</span>
          <div>
            <div className="font-semibold text-white text-sm">Sale Products</div>
            <div className="text-white/65 text-xs mt-0.5">
              {total} item{total !== 1 ? 's' : ''} on sale — reduced prices and special offers
            </div>
          </div>
        </div>
      )}

      {/* Filters panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border rounded-2xl p-5 mb-6" style={{ borderColor:'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-sm" style={{ color:'var(--ink)' }}>Filter Products</span>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-xs hover:underline" style={{ color:'#e05252' }}>
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

                {/* Price range */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide mb-2"
                         style={{ color:'var(--ink-soft)' }}>
                    Price (UGX)
                  </label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={filters.minPrice}
                           onChange={e => updateFilter('minPrice', e.target.value)}
                           className={inp} style={{ width:90 }} />
                    <input type="number" placeholder="Max" value={filters.maxPrice}
                           onChange={e => updateFilter('maxPrice', e.target.value)}
                           className={inp} style={{ width:90 }} />
                  </div>
                </div>

                {/* Size (footwear only) */}
                {(!type || type === 'footwear') && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide mb-2"
                           style={{ color:'var(--ink-soft)' }}>
                      EU Size
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZES.map(s => (
                        <button key={s} onClick={() => updateFilter('size', filters.size == s ? '' : s)}
                                className="w-9 h-9 rounded-lg text-xs font-medium border transition-all"
                                style={{
                                  borderColor: filters.size == s ? 'var(--teal)' : 'var(--border)',
                                  background:  filters.size == s ? 'var(--teal-pale)' : 'white',
                                  color:       filters.size == s ? 'var(--teal)' : 'var(--ink-mid)',
                                }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decor style */}
                {(!type || type === 'decor') && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide mb-2"
                           style={{ color:'var(--ink-soft)' }}>
                      Style
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLES.map(s => (
                        <button key={s} onClick={() => updateFilter('style', filters.style === s ? '' : s)}
                                className="px-3 py-1.5 rounded-full text-xs border transition-all"
                                style={{
                                  borderColor: filters.style === s ? 'var(--teal)' : 'var(--border)',
                                  background:  filters.style === s ? 'var(--teal-pale)' : 'white',
                                  color:       filters.style === s ? 'var(--teal)' : 'var(--ink-mid)',
                                }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room */}
                {(!type || type === 'decor') && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide mb-2"
                           style={{ color:'var(--ink-soft)' }}>
                      Room
                    </label>
                    <select value={filters.room} onChange={e => updateFilter('room', e.target.value)}
                            className={inp} style={{ color:'var(--ink)' }}>
                      <option value="">All Rooms</option>
                      {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search result header */}
      {params.get('search') && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-sm" style={{ color:'var(--ink-soft)' }}>Results for:</span>
          <span className="text-sm font-medium px-3 py-1 rounded-full border"
                style={{ background:'var(--teal-pale)', color:'var(--teal)', borderColor:'rgba(30,128,95,.2)' }}>
            "{params.get('search')}"
          </span>
          <button onClick={() => setParams({})} className="text-xs ml-1 hover:underline"
                  style={{ color:'var(--ink-soft)' }}>
            ✕ Clear
          </button>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {Array.from({ length:8 }).map((_,i) => (
            <div key={i} className="rounded-2xl animate-pulse"
                 style={{ height:220, background:'var(--teal-pale)' }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">
            {tag === 'sale' ? '🏷️' : '🔍'}
          </div>
          <p className="font-medium mb-2" style={{ color:'var(--ink)' }}>
            {tag === 'sale' ? 'No sale products right now' : 'No products found'}
          </p>
          <p className="text-sm mb-6" style={{ color:'var(--ink-soft)' }}>
            {tag === 'sale'
              ? 'Check back soon — new deals are added regularly'
              : 'Try adjusting your filters or search term'}
          </p>
          {activeFilters > 0 && (
            <button onClick={clearFilters}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    style={{ background:'var(--teal)' }}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {paginated.map((p, i) => (
            <ProductCard key={p._id || p.id} product={p} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="rounded-full px-5 py-2.5 text-sm border transition-all disabled:opacity-40"
                  style={{ borderColor:'var(--border)', color:'var(--ink-mid)' }}>
            ← Previous
          </button>
          <span className="px-5 py-2.5 text-sm" style={{ color:'var(--ink-soft)' }}>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="rounded-full px-5 py-2.5 text-sm border transition-all disabled:opacity-40"
                  style={{ borderColor:'var(--border)', color:'var(--ink-mid)' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
