import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../stores';

const fmt = n => `UGX ${n?.toLocaleString()}`;

export default function CartDrawer() {
  // Pulling state and update methods from your custom cart store[cite: 2]
  const { isOpen, closeCart, items, updateQty, removeItem, subtotal, updateSize } = useCartStore();

  // Helper function to handle size selection dynamically[cite: 2]
  const handleSizeChange = (itemKey, newSize) => {
    if (updateSize) {
      updateSize(itemKey, newSize);
    } else {
      console.warn("updateSize action is not defined in your useCartStore. Please update your stores/index.js file.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50"
              style={{background:'rgba(33,40,54,.45)'}}
              onClick={closeCart} />

          <motion.div
            initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
            transition={{type:'spring',damping:30,stiffness:300}}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col"
            style={{boxShadow:'0 0 40px rgba(33,40,54,.18)'}}>

            <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'var(--border)'}}>
              <div>
                <h2 className="font-semibold text-lg" style={{color:'var(--ink)'}}>Shopping Cart</h2>
                <p className="text-xs mt-0.5" style={{color:'var(--ink-soft)'}}>{items.length} item{items.length!==1?'s':''}</p>
              </div>
              <button onClick={closeCart}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{background:'var(--bone)',color:'var(--ink-soft)'}}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {items.length===0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:'var(--teal-pale)'}}>
                    <svg className="w-7 h-7" fill="none" stroke="var(--teal)" viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium" style={{color:'var(--ink)'}}>Your cart is empty</p>
                    <p className="text-sm mt-0.5" style={{color:'var(--ink-soft)'}}>Add items to get started</p>
                  </div>
                  <Link to="/products"
                   onClick={closeCart}
                       className="mt-2 px-5 py-2.5 rounded-full text-sm font-medium text-white inline-block text-center"
                       style={{background:'var(--teal)'}}>
                       Browse Products
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map(item => {
                    // Extract the footwear sizes defined in the admin panel schema[cite: 4]
                    const availableSizes = item.product.footwearDetails?.sizes || [];

                    return (
                      <div key={item.key} className="flex gap-3 py-4 border-b last:border-0" style={{borderColor:'var(--border)'}}>
                        <div className="w-[72px] h-[72px] rounded-xl flex-shrink-0 overflow-hidden border" style={{background:'var(--cream)',borderColor:'var(--border)'}}>
                          {item.product.images?.[0]
                            ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center text-2xl">{item.product.type==='footwear'?'👠':'🏺'}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1" style={{color:'var(--ink)'}}>{item.product.name}</p>
                          
                          {/* Dynamic Size Selector (Footwear) vs Static Label (Non-Footwear)[cite: 2] */}
                          {item.product.type === 'footwear' ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] font-medium" style={{color:'var(--ink-soft)'}}>Size:</span>
                              
                              {availableSizes.length > 0 ? (
                                <select
                                  value={item.size || ''}
                                  onChange={(e) => handleSizeChange(item.key, Number(e.target.value))}
                                  className="text-xs font-semibold bg-transparent border rounded px-2 py-0.5 outline-none cursor-pointer"
                                  style={{borderColor: 'var(--border)', color: 'var(--ink)'}}
                                >
                                  <option value="" disabled>Select Size</option>
                                  {availableSizes.map(size => (
                                    <option key={size} value={size}>
                                      EU {size}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs italic" style={{color:'var(--ink-soft)'}}>
                                  {item.size ? `EU ${item.size}` : 'No sizes configured'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs mt-0.5" style={{color:'var(--ink-soft)'}}>
                              {item.size ? `EU ${item.size}` : item.product.category}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2.5">
                            <span className="text-sm font-bold" style={{color:'var(--teal)'}}>{fmt(item.product.price*item.qty)}</span>
                            
                            {/* Quantity Controls with explicit "Qty:" label[cite: 2] */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-medium mr-1" style={{color:'var(--ink-soft)'}}>Qty:</span>
                              <button onClick={()=>updateQty(item.key,item.qty-1)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                                      style={{background:'var(--bone)',color:'var(--ink)'}}>−</button>
                              <span className="w-6 text-center text-sm font-medium" style={{color:'var(--ink)'}}>{item.qty}</span>
                              <button onClick={()=>updateQty(item.key,item.qty+1)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                                      style={{background:'var(--bone)',color:'var(--ink)'}}>+</button>
                              <button onClick={()=>removeItem(item.key)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center ml-1 transition-colors"
                                      style={{color:'#ccc'}}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length>0 && (
              <div className="border-t px-5 py-4 space-y-3" style={{borderColor:'var(--border)'}}>
                <div className="flex justify-between font-bold text-base">
                  <span style={{color:'var(--ink)'}}>Total</span>
                  <span style={{color:'var(--teal)'}}>{fmt(subtotal)}</span>
                </div>
                <Link to="/checkout" onClick={closeCart}
                      className="flex items-center justify-center gap-2 w-full rounded-full py-3.5 text-sm font-semibold text-white transition-colors"
                      style={{background:'var(--ink)'}}>
                  🔒 Checkout via PesaPal
                </Link>
                <p className="text-[11px] mb-5" style={{ color:'var(--ink-soft)' }}></p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <img src="/images/pesapal.webp"   alt="PesaPal"     className="h-5 w-auto object-contain" />
                <img src="/images/mtn.webp"       alt="MTN MoMo"   className="h-5 w-auto object-contain" />
                <img src="/images/airtel.webp"    alt="Airtel"      className="h-5 w-auto object-contain" />
                <img src="/images/visa.webp"      alt="Visa"        className="h-5 w-auto object-contain" />
                <img src="/images/Mastercard.webp" alt="Mastercard" className="h-5 w-auto object-contain" />
              </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}