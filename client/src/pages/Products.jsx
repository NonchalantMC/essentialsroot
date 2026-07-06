import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productService } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const SORTS = [
  { value: '-createdAt',  label: 'Latest'               },
  { value: 'price',       label: 'Price: Low → High'    },
  { value: '-price',      label: 'Price: High → Low'    },
  { value: 'name',        label: 'Alphabetically (A→Z)' },
  { value: 'best-selling',label: 'Best Selling'         },
];

const TYPES = [
  { value: '',            label: 'All Products' },
  { value: 'footwear',    label: '👠 Footwear'  },
  { value: 'decor',       label: '🏺 Decor'     },
  { value: 'accessories', label: '✨ Accessories'},
];

export default function Products({ type: propType }) {
  const [params, setParams]       = useSearchParams();
  const navigate                  = useNavigate();
  const [products,   setProducts] = useState([]);
  const [loading,    setLoading]  = useState(true);
  const [total,      setTotal]    = useState(0);
  const [page,       setPage]     = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [search,     setSearch]   = useState(params.get('search') || '');
  const searchRef                 = useRef(null);

  const tag = params.get('tag') || '';

  const [filters, setFilters] = useState({
    type:     propType || '',
    sort:     '-createdAt',
    minPrice: '',
    maxPrice: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const searchTerm = params.get('search') || '';
      const query = {
        status: 'active',
        limit:  100,
        page:   1,
        ...(filters.type                  && { type:     filters.type }),
        ...(searchTerm                    && { search:   searchTerm   }),
        ...(filters.minPrice              && { minPrice: filters.minPrice }),
        ...(filters.maxPrice              && { maxPrice: filters.maxPrice }),
        ...(filters.sort === 'best-selling' && { sort: 'best-selling' }),
      };
      const { data } = await productService.list(query);
      let list = data.products || [];

      // Tag filters
      if (tag === 'sale') {
        list = list.filter(p =>
          p.tags?.includes('sale') || (p.compareAtPrice && p.compareAtPrice > p.price)
        );
      } else if (tag === 'new') {
        list = list.filter(p => p.tags?.includes('new'));
      } else if (tag === 'featured') {
        list = list.filter(p => p.tags?.includes('featured') || p.featured);
      }

      // Client-side sort (best-selling already sorted by backend)
      if (filters.sort !== 'best-selling') {
        list = [...list].sort((a, b) => {
          switch (filters.sort) {
            case 'price':      return a.price - b.price;
            case '-price':     return b.price - a.price;
            case 'name':       return a.name.localeCompare(b.name);
            case '-createdAt':
            default:           return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          }
        });
      }

      setProducts(list);
      setTotal(list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, params, tag]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [tag]);

  // Sync propType into filters when it changes (e.g. navigating /footwear → /decor)
  useEffect(() => {
    if (propType && propType !== filters.type) {
      setFilters(f => ({ ...f, type: propType }));
    }
  }, [propType]);

  const updateFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: propType || '', sort: '-createdAt', minPrice: '', maxPrice: '' });
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setParams({ search: search.trim() });
    } else {
      setParams({});
    }
    setPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setParams({});
    setPage(1);
    searchRef.current?.focus();
  };

  // Pagination
  const PAGE_SIZE  = 20;
  const paginated  = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const activeFilters = [
    filters.type && !propType,
    filters.sort !== '-createdAt',
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  const title = tag === 'sale'      ? 'Sale'
    : tag === 'new'                 ? 'New Arrivals'
    : filters.type === 'footwear'   ? 'Footwear'
    : filters.type === 'decor'      ? 'Decor'
    : filters.type === 'accessories'? 'Accessories'
    : propType === 'footwear'       ? 'Footwear'
    : propType === 'decor'          ? 'Decor'
    : 'All Products';

  const inp = "w-full px-3 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#1e805f] transition-colors bg-white";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Search bar (visible on all screen sizes) ── */}
      <form onSubmit={handleSearch} className="relative mb-5">
        <div className="relative flex items-center">
          <svg className="absolute left-3.5 w-4 h-4 pointer-events-none" style={{ color:'var(--ink-soft)' }}
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-10 pr-24 py-3 border border-[#ede9e2] rounded-2xl text-sm outline-none focus:border-[#1e805f] focus:ring-2 focus:ring-[#1e805f]/10 transition-all bg-white"
            style={{ color:'var(--ink)' }}
          />
          {search && (
            <button type="button" onClick={clearSearch}
                    className="absolute right-20 text-sm p-1 rounded-full transition-colors"
                    style={{ color:'var(--ink-soft)' }}>
              ✕
            </button>
          )}
          <button type="submit"
                  className="absolute right-2 px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background:'var(--teal)' }}>
            Search
          </button>
        </div>
      </form>

      {/* ── Header row: title + filter toggle ── */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="font-semibold text-2xl sm:text-3xl" style={{ color:'var(--ink)' }}>{title}</h1>
          <p className="text-xs mt-0.5" style={{ color:'var(--ink-soft)' }}>
            {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex-shrink-0"
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
          <span className="hidden sm:inline">Filter & Sort</span>
          <span className="sm:hidden">Filter</span>
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center"
                  style={{ background:'var(--teal)' }}>
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Sale banner */}
      {tag === 'sale' && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
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

      {/* Search result tag */}
      {params.get('search') && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color:'var(--ink-soft)' }}>Results for:</span>
          <span className="text-sm font-semibold px-3 py-1 rounded-full border"
                style={{ background:'var(--teal-pale)', color:'var(--teal)', borderColor:'rgba(30,128,95,.2)' }}>
            "{params.get('search')}"
          </span>
          <button onClick={clearSearch} className="text-xs hover:underline"
                  style={{ color:'var(--ink-soft)' }}>
            ✕ Clear
          </button>
        </div>
      )}

      {/* ── Filter / Sort panel ── */}
      <AnimatePresence>
        {showFilter && (
          <>
            {/* Mobile backdrop */}
            <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setShowFilter(false)} />

            {/* Panel — bottom sheet on mobile, inline on desktop */}
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:20 }}
              className="fixed bottom-0 left-0 right-0 z-50 sm:relative sm:z-auto sm:mb-5"
            >
              <div className="bg-white border-t sm:border sm:rounded-2xl p-5 sm:mb-0"
                   style={{ borderColor:'var(--border)', maxHeight:'85vh', overflowY:'auto',
                            borderTopLeftRadius:'1.5rem', borderTopRightRadius:'1.5rem' }}>

                {/* Panel header */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-semibold text-sm" style={{ color:'var(--ink)' }}>Filter & Sort</span>
                  <div className="flex items-center gap-3">
                    {activeFilters > 0 && (
                      <button onClick={clearFilters} className="text-xs font-semibold hover:underline"
                              style={{ color:'#e05252' }}>
                        Clear all
                      </button>
                    )}
                    {/* Close — mobile only */}
                    <button onClick={() => setShowFilter(false)}
                            className="sm:hidden w-7 h-7 flex items-center justify-center rounded-full"
                            style={{ background:'var(--bone)', color:'var(--ink-mid)' }}>
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-6">

                  {/* ── 1. Product Category ── */}
                  {!propType && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide mb-3"
                           style={{ color:'var(--ink-soft)' }}>
                        Product Category
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {TYPES.map(t => (
                          <button
                            key={t.value}
                            onClick={() => updateFilter('type', t.value)}
                            className="px-3 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all"
                            style={{
                              borderColor: filters.type === t.value ? 'var(--teal)' : 'var(--border)',
                              background:  filters.type === t.value ? 'var(--teal-pale)' : 'white',
                              color:       filters.type === t.value ? 'var(--teal)' : 'var(--ink-mid)',
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 2. Sort By ── */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-3"
                         style={{ color:'var(--ink-soft)' }}>
                      Sort By
                    </div>
                    <div className="space-y-2">
                      {SORTS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => updateFilter('sort', s.value)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all"
                          style={{
                            borderColor: filters.sort === s.value ? 'var(--teal)' : 'var(--border)',
                            background:  filters.sort === s.value ? 'var(--teal-pale)' : 'white',
                            color:       filters.sort === s.value ? 'var(--teal)' : 'var(--ink-mid)',
                          }}
                        >
                          {s.label}
                          {filters.sort === s.value && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── 3. Price Range ── */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-3"
                         style={{ color:'var(--ink-soft)' }}>
                      Price Range (UGX)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold mb-1 block" style={{ color:'var(--ink-soft)' }}>
                          Min Price
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={filters.minPrice}
                          onChange={e => updateFilter('minPrice', e.target.value)}
                          className={inp}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold mb-1 block" style={{ color:'var(--ink-soft)' }}>
                          Max Price
                        </label>
                        <input
                          type="number"
                          placeholder="Any"
                          value={filters.maxPrice}
                          onChange={e => updateFilter('maxPrice', e.target.value)}
                          className={inp}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Apply button — mobile only */}
                <button
                  onClick={() => setShowFilter(false)}
                  className="sm:hidden w-full mt-6 py-3.5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background:'var(--teal)' }}
                >
                  Show {total} Result{total !== 1 ? 's' : ''}
                </button>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Products grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl animate-pulse"
                 style={{ height: 220, background: 'var(--teal-pale)' }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">{tag === 'sale' ? '🏷️' : '🔍'}</div>
          <p className="font-semibold mb-2" style={{ color:'var(--ink)' }}>
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
