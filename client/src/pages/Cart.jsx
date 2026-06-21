import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../stores';

const fmt = n => `UGX ${n?.toLocaleString()}`;

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">🛒</div>
        <h2 className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>Your cart is empty</h2>
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Browse our collection and add items you love</p>
        <Link to="/"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: 'var(--teal)' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl mb-8" style={{ color: 'var(--ink)' }}>
        Shopping Cart{' '}
        <span className="text-lg font-sans font-normal ml-2" style={{ color: 'var(--ink-soft)' }}>
          ({items.length} item{items.length !== 1 ? 's' : ''})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Items ── */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 flex gap-4 border"
              style={{ borderColor: 'var(--border)' }}
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden border"
                   style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name}
                       className="w-full h-full object-cover" />
                ) : item.product.type === 'footwear' ? '👠' : '🏺'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
                      {item.product.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                      {item.size ? `EU ${item.size}` : item.product.category}
                      {item.color ? ` · ${item.color}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.key)}
                          className="flex-shrink-0 transition-colors"
                          style={{ color: 'var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#e05252'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--border)'}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center rounded-full overflow-hidden border"
                       style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => updateQty(item.key, item.qty - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm"
                            style={{ color: 'var(--ink-mid)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bone)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium" style={{ color: 'var(--ink)' }}>
                      {item.qty}
                    </span>
                    <button onClick={() => updateQty(item.key, item.qty + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm"
                            style={{ color: 'var(--ink-mid)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bone)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      +
                    </button>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--teal)' }}>
                    {fmt(item.product.price * item.qty)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 sticky top-24 border"
               style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-base mb-5" style={{ color: 'var(--ink)' }}>
              Order Summary
            </h3>

            <hr className="mb-4" style={{ borderColor: 'var(--border)' }} />

            <div className="flex justify-between font-bold text-base mb-5">
              <span style={{ color: 'var(--ink)' }}>Total</span>
              <span style={{ color: 'var(--teal)' }}>{fmt(subtotal)}</span>
            </div>

            <Link to="/checkout"
                  className="flex items-center justify-center w-full rounded-full py-3.5 text-sm font-semibold text-white transition-colors"
                  style={{ background: 'var(--ink)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--ink-mid)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}>
              🔒 Proceed to Checkout
            </Link>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs"
                 style={{ color: 'var(--ink-soft)' }}>
              <span>🔒</span>
              <span>Secure checkout via PesaPal</span>
            </div>

            <div className="flex justify-center gap-2 mt-3">
              {['MTN MoMo', 'Airtel', 'Visa', 'Mastercard'].map(m => (
                <span key={m}
                      className="text-[9px] rounded px-1.5 py-1 border"
                      style={{ background: 'var(--bone)', borderColor: 'var(--border)', color: 'var(--ink-soft)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
