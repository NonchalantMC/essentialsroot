import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useAuthStore, api } from '../stores';
import { useToast } from '../hooks/useToast';
import { getDeliveryFee, DELIVERY_ZONES } from '../utils/deliveryZones';

const fmt = n => `UGX ${n?.toLocaleString()}`;

const toTitleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());

// Finds which zone a given town/area string belongs to (used to pre-select
// the Region dropdown when a saved address already has a city value).
function findZoneKeyForTown(town) {
  if (!town) return '';
  const q = town.toLowerCase().trim();
  for (const [key, zone] of Object.entries(DELIVERY_ZONES)) {
    if (zone.areas.includes(q)) return key;
  }
  return '';
}

// Removed email validation requirement completely
const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  phone:     z.string().min(9, 'Valid phone required'),
  city:      z.string().min(2, 'Please enter your specific area/suburb'),
});

const inputCls = "w-full px-4 py-3 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#1e805f] focus:ring-2 focus:ring-[#1e805f]/10 transition-all bg-white";
const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#8a9bb0] mb-1.5";

function SmsModal({ phone, onVerified, onClose }) {
  const [step,    setStep]    = useState('send');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const sendCode = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/orders/guest/send-otp', { phone });
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification SMS');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/orders/guest/verify-otp', { phone, code });
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background:'rgba(33,40,54,.5)' }}>
      <motion.div initial={{ scale:.93, opacity:0 }} animate={{ scale:1, opacity:1 }}
          className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ boxShadow:'0 24px 80px rgba(33,40,54,.2)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-semibold text-lg" style={{ color:'var(--ink)' }}>
              {step==='send' ? 'Verify your number' : 'Enter Code'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color:'var(--ink-soft)' }}>
              {step==='send' ? "We'll send a quick verification code" : `6-digit code sent to ${phone}`}
            </p>
          </div>
          <button onClick={onClose} type="button" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors ml-4 flex-shrink-0" style={{ background:'var(--bone)', color:'var(--ink-soft)' }}>✕</button>
        </div>

        <AnimatePresence mode="wait">
          {step==='send' ? (
            <motion.div key="send" initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}}>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4" style={{ background:'var(--bone)' }}>
                <span className="text-2xl">📱</span>
                <div>
                  <div className="text-xs mb-0.5" style={{ color:'var(--ink-soft)' }}>Sending code to</div>
                  <div className="font-semibold text-sm" style={{ color:'var(--ink)' }}>{phone}</div>
                </div>
              </div>
              {error && <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background:'#fef2f2', color:'#e05252', border:'1px solid #fecaca' }}>{error}</div>}
              <button type="button" onClick={sendCode} disabled={loading} className="w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background:'var(--teal)' }}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending...</span> : 'Send verification code →'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="verify" initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}}>
              <p className="text-sm mb-4" style={{ color:'var(--ink-soft)' }}>Enter the 6-digit code from your SMS:</p>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="0  0  0  0  0  0" maxLength={6} autoFocus className="w-full text-center font-bold tracking-[14px] px-4 py-4 border-2 rounded-xl outline-none mb-3" style={{ fontSize: 24, borderColor: 'var(--border)', color: 'var(--ink)' }} onFocus={e => e.target.style.borderColor='var(--teal)'} onBlur={e => e.target.style.borderColor='var(--border)'}/>
              {error && <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background:'#fef2f2', color:'#e05252', border:'1px solid #fecaca' }}>{error}</div>}
              
              <button type="button" onClick={verifyCode} disabled={loading || code.length !== 6} className="w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-60 mb-3" style={{ background:'var(--teal)' }}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Verifying...</span> : 'Confirm & continue →'}
              </button>
              <button onClick={() => { setStep('send'); setCode(''); setError(''); }} type="button" className="w-full text-sm py-1 transition-colors" style={{ color:'var(--ink-soft)' }}>← Resend or change number</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const { showToast }   = useToast();
  const navigate        = useNavigate();

  const isLoggedIn = !!token;
  const [guestMode,    setGuestMode]    = useState(isLoggedIn ? null : 'choice');
  const [smsVerified,  setSmsVerified]  = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [selPayment,   setSelPayment]   = useState('momo'); // Kept intact for the backend requirement payload
  const [loading,      setLoading]      = useState(false);

  // ── STEP 5: Coupon State Management Engine ──
  const [couponCode,       setCouponCode]       = useState('');
  const [appliedCoupon,    setAppliedCoupon]    = useState(null);
  const [couponLoading,    setCouponLoading]    = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Pre-fill from the user's default saved address if available
  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0] || null;
  const [differentAddress, setDifferentAddress] = useState(false);

  const prefillCity = user?.addresses?.find(a => a.isDefault)?.city || user?.addresses?.[0]?.city || '';

  const { register, handleSubmit, watch, setValue, formState:{ errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
      phone:     user?.phone || '',
      city:      prefillCity,
    },
  });

  // Drives the Town dropdown's available options; pre-selected from any
  // saved address so returning users don't lose their region on load.
  const [selectedZone, setSelectedZone] = useState(() => findZoneKeyForTown(prefillCity));

  const phoneValue = watch('phone');
  const cityValue  = watch('city');
  const showForm   = isLoggedIn || guestMode === 'sms';

  const deliveryInfo = getDeliveryFee(cityValue, subtotal);

  // ── STEP 5: Use Server-Computed Discount Directly ──
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;

  // Fetch eligible coupons for logged-in users and verified guests.
  useEffect(() => {
    const isVerifiedGuest = !isLoggedIn && smsVerified && phoneValue;
    if (!isLoggedIn && !isVerifiedGuest) return;
    const params = isVerifiedGuest ? { phone: phoneValue } : {};
    api.get('/coupons/available', { params })
      .then(({ data }) => setAvailableCoupons(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isLoggedIn, smsVerified, phoneValue]);

  const dynamicTotal = Math.max(0, (subtotal - discountAmount) + deliveryInfo.fee);

  const requiresVerification = guestMode === 'sms' && !smsVerified;
  const isPayDisabled = loading || requiresVerification || !deliveryInfo.isValid;

  // ── STEP 5: Async Coupon Verification API Pipeline ──
  const handleApplyCoupon = async (codeOverride) => {
    const codeToApply = typeof codeOverride === 'string' ? codeOverride : couponCode.trim();
    if (!codeToApply) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: codeToApply,
        subtotal,
        phone: phoneValue || null
      });
      setAppliedCoupon(data.coupon);
      showToast('🎉 Coupon discount applied successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid or expired coupon code.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Coupon removed.');
  };

  const onSubmit = async (formData) => {
    if (requiresVerification) { 
      setShowSmsModal(true); 
      return; 
    }
    if (!items.length) { showToast('Your cart is empty'); return; }
    setLoading(true);
    try {
      const guestInfo = !isLoggedIn ? {
        name:  `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        smsVerified,
      } : null;

      const orderPayload = {
        items: items.map(i => ({
          productId: i.product._id || i.product.id,
          sku:       i.product.sku  || `E256-${i.product._id || i.product.id}`,
          name:      i.product.name,
          image:     i.product.images?.[0] || '',
          price:     i.product.price,
          quantity:  i.qty,
          size:      i.size,
          color:     i.color,
        })),
        subtotal,
        discountAmount, 
        couponCode: appliedCoupon ? appliedCoupon.code : null, 
        shippingFee: deliveryInfo.fee,
        total:       dynamicTotal,
        guestInfo,
        shippingAddress: {
          name:     `${formData.firstName} ${formData.lastName}`,
          phone:    formData.phone,
          city:     formData.city, 
          district: '',
          country:  'Uganda',
        },
        billingAddress: {
          name:     `${formData.firstName} ${formData.lastName}`,
          phone:    formData.phone,
          city:     formData.city,
          district: '',
          country:  'Uganda',
        },
      };

      const endpoint = isLoggedIn ? '/orders' : '/orders/guest';
      const { data: order }   = await api.post(endpoint, orderPayload);
      const { data: payment } = await api.post('/payments/pesapal/initiate', {
        orderId: order._id || order.id,
        guestInfo,
        paymentMethod: selPayment,
      });

      if (payment.redirectUrl) {
        clearCart();
        window.location.href = payment.redirectUrl;
      } else {
        throw new Error('No redirect URL from PesaPal');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">🛒</div>
        <h2 className="font-semibold text-2xl" style={{ color:'var(--ink)' }}>Your cart is empty</h2>
        <Link to="/" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background:'var(--teal)' }}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-semibold text-3xl font-medium mb-6" style={{ color:'var(--ink)' }}>Checkout</h1>

      {showSmsModal && (
        <SmsModal phone={phoneValue} onVerified={() => { setSmsVerified(true); setShowSmsModal(false); }} onClose={() => setShowSmsModal(false)} />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── LEFT SIDE ── */}
          <div className="lg:col-span-3 space-y-5">
            {!isLoggedIn && guestMode === 'choice' && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-white border rounded-2xl p-6" style={{ borderColor:'var(--border)' }}>
                <h2 className="font-semibold text-base mb-1" style={{ color:'var(--ink)' }}>How would you like to continue?</h2>
                <p className="text-sm mb-5" style={{ color:'var(--ink-soft)' }}>Choose an option to proceed to checkout</p>
                <div className="space-y-3">
                  {[
                    { icon:'📱', title:'Continue with phone number', sub:"Quick SMS verification — no account needed", action:()=>setGuestMode('sms') },
                    { icon:'🔑', title:'Sign in to your account', sub:'Access saved addresses and order history', action:()=>navigate('/login',{state:{from:{pathname:'/checkout'}}}) },
                    { icon:'✨', title:'Create a free account', sub:'Save your details and get exclusive offers', action:()=>navigate('/register',{state:{from:{pathname:'/checkout'}}}) },
                  ].map(opt => (
                    <button key={opt.title} type="button" onClick={opt.action} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group" style={{ borderColor:'var(--border)' }} onMouseEnter={e => { e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.background='var(--teal-pale)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background=''; }}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background:'var(--teal-pale)' }}>{opt.icon}</div>
                      <div className="flex-1"><div className="font-semibold text-sm" style={{ color:'var(--ink)' }}>{opt.title}</div><div className="text-xs mt-0.5" style={{ color:'var(--ink-soft)' }}>{opt.sub}</div></div>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" style={{ color:'var(--border)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {!isLoggedIn && guestMode === 'sms' && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
                {smsVerified ? (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                    <span className="text-xl">✅</span>
                    <div className="flex-1"><div className="text-sm font-semibold" style={{ color:'#166534' }}>Phone number verified</div><div className="text-xs mt-0.5" style={{ color:'#16a34a' }}>{phoneValue} · confirmed</div></div>
                    <button type="button" onClick={() => { setGuestMode('choice'); setSmsVerified(false); }} className="text-xs underline" style={{ color:'var(--ink-soft)' }}>Change</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background:'#fdf8ec', border:'1px solid rgba(201,168,64,.4)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📱</span>
                      <div>
                        <div className="text-sm font-semibold" style={{ color:'var(--ink)' }}>Phone verification required</div>
                        <div className="text-xs mt-0.5" style={{ color:'var(--ink-soft)' }}>Enter your phone number below then tap Send code</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => setShowSmsModal(true)} disabled={!phoneValue || phoneValue.replace(/\D/g,'').length < 9} className="text-xs font-semibold px-3.5 py-2 rounded-full text-white disabled:opacity-40" style={{ background:'var(--teal)' }}>Send code</button>
                      <button type="button" onClick={() => setGuestMode('choice')} className="text-[10px] underline" style={{ color:'var(--ink-soft)' }}>Go back</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-5">
                  {/* Contact */}
                  <div className="bg-white border rounded-2xl p-6" style={{ borderColor:'var(--border)' }}>
                    <h2 className="font-semibold text-base mb-5 pb-3 border-b" style={{ color:'var(--ink)', borderColor:'var(--bone)' }}>1. Contact Information</h2>
                    <div className="space-y-4">
                      {isLoggedIn ? (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background:'var(--bone)', borderColor:'var(--border)' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background:'var(--teal)' }}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color:'var(--ink)' }}>{user?.name}</div>
                            <div className="text-xs" style={{ color:'var(--ink-soft)' }}>Delivering to your account name</div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>First Name</label>
                            <input {...register('firstName')} className={inputCls} placeholder="Jane" />
                            {errors.firstName && <p className="text-xs mt-1" style={{ color:'#e05252' }}>{errors.firstName.message}</p>}
                          </div>
                          <div>
                            <label className={labelCls}>Last Name</label>
                            <input {...register('lastName')} className={inputCls} placeholder="Doe" />
                            {errors.lastName && <p className="text-xs mt-1" style={{ color:'#e05252' }}>{errors.lastName.message}</p>}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        {isLoggedIn ? (
                          <div>
                            <label className={labelCls}>Phone Number</label>
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background:'var(--bone)', borderColor:'var(--border)' }}>
                              <span className="text-sm" style={{ color:'var(--ink)' }}>{user?.phone || 'No phone on account'}</span>
                              <span className="text-[10px]" style={{ color:'var(--ink-soft)' }}>Change in Account Settings</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className={labelCls}>Phone Number {guestMode==='sms' && <span className="ml-1 font-normal normal-case" style={{ color:'var(--teal)' }}>— used for verification</span>}</label>
                            <input {...register('phone')} type="tel" className={inputCls} placeholder="+256 700 123 456" />
                            {errors.phone && <p className="text-xs mt-1" style={{ color:'#e05252' }}>{errors.phone.message}</p>}
                            {guestMode==='sms' && !smsVerified && phoneValue?.replace(/\D/g,'').length >= 9 && (
                              <button type="button" onClick={() => setShowSmsModal(true)} className="mt-2 text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color:'var(--teal)' }}>📱 Tap to send verification SMS →</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="bg-white border rounded-2xl p-6" style={{ borderColor:'var(--border)' }}>
                    <h2 className="font-semibold text-base mb-5 pb-3 border-b" style={{ color:'var(--ink)', borderColor:'var(--bone)' }}>2. Delivery Address</h2>
                    <div className="space-y-4">
                      {isLoggedIn && defaultAddress && !differentAddress && (
                        <div className="rounded-xl border p-4" style={{ background:'var(--teal-pale)', borderColor:'var(--teal)' }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--teal)' }}>📍 Saved Address</div>
                              <div className="text-sm font-medium" style={{ color:'var(--ink)' }}>{defaultAddress.city}{defaultAddress.district ? `, ${defaultAddress.district}` : ''}</div>
                              {defaultAddress.country && <div className="text-xs mt-0.5" style={{ color:'var(--ink-soft)' }}>{defaultAddress.country}</div>}
                            </div>
                            <button
                              type="button"
                              onClick={() => setDifferentAddress(true)}
                              className="text-xs font-semibold whitespace-nowrap hover:underline flex-shrink-0"
                              style={{ color:'var(--teal)' }}
                            >
                              Use different address
                            </button>
                          </div>
                        </div>
                      )}

                      {(!isLoggedIn || !defaultAddress || differentAddress) && (
                        <div>
                          {differentAddress && (
                            <button
                              type="button"
                              onClick={() => setDifferentAddress(false)}
                              className="text-xs font-semibold mb-3 hover:underline"
                              style={{ color:'var(--teal)' }}
                            >
                              ← Use saved address instead
                            </button>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Region</label>
                              <select
                                value={selectedZone}
                                onChange={e => {
                                  const zoneKey = e.target.value;
                                  setSelectedZone(zoneKey);
                                  setValue('city', '', { shouldValidate: false });
                                }}
                                className={inputCls}
                              >
                                <option value="">Select region…</option>
                                {Object.entries(DELIVERY_ZONES).map(([key, zone]) => (
                                  <option key={key} value={key}>{zone.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Town</label>
                              <select
                                value={cityValue || ''}
                                onChange={e => setValue('city', e.target.value, { shouldValidate: true })}
                                disabled={!selectedZone}
                                className={inputCls}
                              >
                                <option value="">{selectedZone ? 'Select town…' : 'Pick region first'}</option>
                                {selectedZone && [...DELIVERY_ZONES[selectedZone].areas]
                                  .sort((a, b) => a.localeCompare(b))
                                  .map(area => (
                                    <option key={area} value={area}>{toTitleCase(area)}</option>
                                  ))}
                              </select>
                            </div>
                          </div>
                          {errors.city && <p className="text-xs mt-1" style={{ color:'#e05252' }}>{errors.city.message}</p>}
                        </div>
                      )}

                      <div className="rounded-xl p-4 border text-xs space-y-1.5 transition-all duration-300" 
                           style={{ 
                             background: deliveryInfo.isEstimated ? 'var(--bone)' : 'var(--teal-pale)', 
                             borderColor: deliveryInfo.isEstimated ? 'var(--border)' : 'var(--teal)' 
                           }}>
                        <div className="flex justify-between font-semibold">
                          <span style={{ color: 'var(--ink)' }}>Detected Location Tier:</span>
                          <span style={{ color: deliveryInfo.fee === 0 && !deliveryInfo.isEstimated ? 'var(--teal)' : 'var(--ink)' }}>{deliveryInfo.label}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Estimated Delivery Time:</span>
                          <span className="font-medium">{deliveryInfo.eta}</span>
                        </div>
                        {deliveryInfo.isEstimated && cityValue?.length >= 2 && (
                          <p className="text-[10px] italic mt-1 text-amber-600 font-medium">
                            ⚠️ Area name unlisted. Defaulting to standard flat rate. You can complete checkout or verify coordinates with support via WhatsApp.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── ORDER SUMMARY (mobile only) ── */}
                  <div className="lg:hidden bg-white border rounded-2xl p-5 mt-2" style={{ borderColor:'var(--border)' }}>
                    <h3 className="font-semibold text-base mb-4" style={{ color:'var(--ink)' }}>Order Summary</h3>
                    <div className="space-y-3 mb-5">
                      {items.map(item => (
                        <div key={item.key} className="flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border" style={{ background:'var(--cream)', borderColor:'var(--border)' }}>
                            {item.product.images?.[0] ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">{item.product.type==='footwear'?'👠':'🏺'}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-1" style={{ color:'var(--ink)' }}>{item.product.name}</p>
                            {item.size && <p className="text-[10px]" style={{ color:'var(--ink-soft)' }}>EU {item.size} × {item.qty}</p>}
                          </div>
                          <span className="text-xs font-semibold whitespace-nowrap" style={{ color:'var(--teal)' }}>{fmt(item.product.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <hr className="mb-4" style={{ borderColor:'var(--border)' }} />
                    
                    <div className="mb-4">
                      {(isLoggedIn || (smsVerified && !isLoggedIn)) && availableCoupons.length > 0 && !appliedCoupon && (
                        <div className="mb-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a9bb0] mb-2">🎉 Welcome Offer</div>
                          <div className="flex flex-wrap gap-2">
                            {availableCoupons.map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => handleApplyCoupon(c.code)}
                                disabled={couponLoading}
                                className="group flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:border-[#1e805f] hover:bg-[#e8f5ef]"
                                style={{ borderColor:'var(--border)', background:'var(--bone)', color:'var(--ink)' }}
                              >
                                <span className="text-sm">🎫</span>
                                <div className="text-left">
                                  <div style={{ color:'#1e805f' }}>{c.code}</div>
                                  <div className="text-[10px] font-normal" style={{ color:'var(--ink-soft)' }}>
                                    {c.discountType === 'percentage'
                                      ? `${c.discountValue}% off`
                                      : `UGX ${Number(c.discountValue).toLocaleString()} off`}
                                    {c.minSubtotalRequired > 0 ? ` · min UGX ${Number(c.minSubtotalRequired).toLocaleString()}` : ''}
                                  </div>
                                </div>
                                <span className="ml-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:'#1e805f' }}>Tap to apply →</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8a9bb0] mb-1.5">Promo Coupon</label>
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="E.g. EXTRA20" 
                            className="flex-1 px-3 py-2 border rounded-xl text-xs uppercase outline-none focus:border-[#1e805f] bg-white transition-all"
                            style={{ borderColor: 'var(--border)' }}
                          />
                          <button 
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#141414] hover:bg-[#222] transition-colors disabled:opacity-40"
                          >
                            {couponLoading ? '...' : 'Apply'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 rounded-xl border text-xs" style={{ background: 'var(--teal-pale)', borderColor: 'var(--teal)' }}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🎫</span>
                            <div>
                              <span className="font-bold text-[#1e805f]">{appliedCoupon.code}</span>
                              <span className="text-[10px] block text-gray-500">
                                {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% Off Promo Applied` : `UGX ${appliedCoupon.discountValue?.toLocaleString()} Flat Value Subtracted`}
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={handleRemoveCoupon} 
                            className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <hr className="mb-3" style={{ borderColor:'var(--border)' }} />
                    
                    <div className="space-y-1.5 text-xs mb-3 font-medium">
                      <div className="flex justify-between" style={{ color:'var(--ink-soft)' }}>
                        <span>Subtotal</span>
                        <span>{fmt(subtotal)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-[#1e805f] font-semibold">
                          <span>Coupon Discount</span>
                          <span>-{fmt(discountAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between" style={{ color:'var(--ink-soft)' }}>
                        <span>Delivery Fee</span>
                        <span className={deliveryInfo.fee === 0 && cityValue?.length >= 2 ? "text-green-600 font-bold" : ""}>
                          {deliveryInfo.fee === 0 && cityValue?.length >= 2 ? "FREE" : fmt(deliveryInfo.fee)}
                        </span>
                      </div>
                    </div>

                    <hr className="mb-3" style={{ borderColor:'var(--border)' }} />
                    <div className="flex justify-between font-bold text-base mb-1">
                      <span style={{ color:'var(--ink)' }}>Total</span>
                      <span style={{ color:'var(--teal)' }}>{fmt(dynamicTotal)}</span>
                    </div>
                    <p className="text-[11px] mb-5" style={{ color:'var(--ink-soft)' }}>VAT inclusive where applicable</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      <img src="/images/pesapal.webp"   alt="PesaPal"     className="h-5 w-auto object-contain" />
                      <img src="/images/mtn.webp"       alt="MTN MoMo"   className="h-5 w-auto object-contain" />
                      <img src="/images/airtel.webp"    alt="Airtel"      className="h-5 w-auto object-contain" />
                      <img src="/images/visa.webp"      alt="Visa"        className="h-5 w-auto object-contain" />
                      <img src="/images/Mastercard.webp" alt="Mastercard" className="h-5 w-auto object-contain" />
                    </div>
                  </div>

                  {/* Payment Section */}
<div className="bg-white border rounded-2xl p-6" style={{ borderColor:'var(--border)' }}>
  <h2 className="font-semibold text-base mb-4 pb-3 border-b" style={{ color:'var(--ink)', borderColor:'var(--bone)' }}>
    3. Payment via PesaPal
  </h2>
  <div className="flex items-start gap-3 rounded-xl p-4 text-sm" style={{ background:'#eff6ff', color:'var(--ink-mid)' }}>
    <div className="space-y-3">
                        {/* PAYMENT ACTION BUTTON */}
                  <motion.button 
                    type="submit" 
                    disabled={isPayDisabled} 
                    whileTap={isPayDisabled ? {} : {scale:.98}} 
                    className={`w-full rounded-full py-4 text-sm font-semibold text-white transition-all duration-300 ${requiresVerification ? 'opacity-60 cursor-not-allowed select-none pointer-events-none' : 'disabled:opacity-60'}`}
                    style={{ background: requiresVerification ? '#a0aec0' : 'var(--teal)' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Redirecting to PesaPal...
                      </span>
                    ) : (
                      ` Pay ${fmt(dynamicTotal)} via PesaPal`
                    )}
                  </motion.button>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <img src="/images/pesapal.webp"    alt="PesaPal"     className="h-5 w-auto object-contain" />
        <img src="/images/mtn.webp"        alt="MTN MoMo"    className="h-5 w-auto object-contain" />
        <img src="/images/airtel.webp"     alt="Airtel"       className="h-5 w-auto object-contain" />
        <img src="/images/visa.webp"       alt="Visa"         className="h-5 w-auto object-contain" />
        <img src="/images/Mastercard.webp" alt="Mastercard"   className="h-5 w-auto object-contain" />
      </div>
      <p className="text-xs sm:text-sm leading-relaxed">
        🔒 Payments processed securely — East Africa's leading PCI-DSS Level 1 gateway.
      </p>
    </div>
  </div>
</div>
                  <p className="text-center text-xs" style={{ color:'var(--ink-soft)' }}>A confirmation details layout will be shown after payment. {!isLoggedIn && <> <Link to="/register" className="font-medium hover:underline" style={{ color:'var(--teal)' }}>Create an account</Link> to track orders anytime.</>}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ORDER SUMMARY (RIGHT BOX — desktop only) ── */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white border rounded-2xl p-5 sticky top-24" style={{ borderColor:'var(--border)' }}>
              <h3 className="font-semibold text-base mb-4" style={{ color:'var(--ink)' }}>Order Summary</h3>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.key} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border" style={{ background:'var(--cream)', borderColor:'var(--border)' }}>
                      {item.product.images?.[0] ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">{item.product.type==='footwear'?'👠':'🏺'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1" style={{ color:'var(--ink)' }}>{item.product.name}</p>
                      {item.size && <p className="text-[10px]" style={{ color:'var(--ink-soft)' }}>EU {item.size} × {item.qty}</p>}
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color:'var(--teal)' }}>{fmt(item.product.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <hr className="mb-4" style={{ borderColor:'var(--border)' }} />
              
              <div className="mb-4">
                {(isLoggedIn || (smsVerified && !isLoggedIn)) && availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a9bb0] mb-2">🎉 Welcome Offer</div>
                    <div className="flex flex-wrap gap-2">
                      {availableCoupons.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          disabled={couponLoading}
                          className="group flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:border-[#1e805f] hover:bg-[#e8f5ef]"
                          style={{ borderColor:'var(--border)', background:'var(--bone)', color:'var(--ink)' }}
                        >
                          <span className="text-sm">🎫</span>
                          <div className="text-left">
                            <div style={{ color:'#1e805f' }}>{c.code}</div>
                            <div className="text-[10px] font-normal" style={{ color:'var(--ink-soft)' }}>
                              {c.discountType === 'percentage'
                                ? `${c.discountValue}% off`
                                : `UGX ${Number(c.discountValue).toLocaleString()} off`}
                              {c.minSubtotalRequired > 0 ? ` · min UGX ${Number(c.minSubtotalRequired).toLocaleString()}` : ''}
                            </div>
                          </div>
                          <span className="ml-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:'#1e805f' }}>Tap to apply →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8a9bb0] mb-1.5">Promo Coupon</label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="E.g. EXTRA20" 
                      className="flex-1 px-3 py-2 border rounded-xl text-xs uppercase outline-none focus:border-[#1e805f] bg-white transition-all"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#141414] hover:bg-[#222] transition-colors disabled:opacity-40"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border text-xs" style={{ background: 'var(--teal-pale)', borderColor: 'var(--teal)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎫</span>
                      <div>
                        <span className="font-bold text-[#1e805f]">{appliedCoupon.code}</span>
                        <span className="text-[10px] block text-gray-500">
                          {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% Off Promo Applied` : `UGX ${appliedCoupon.discountValue?.toLocaleString()} Flat Value Subtracted`}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleRemoveCoupon} 
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <hr className="mb-3" style={{ borderColor:'var(--border)' }} />
              
              <div className="space-y-1.5 text-xs mb-3 font-medium">
                <div className="flex justify-between" style={{ color:'var(--ink-soft)' }}>
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-[#1e805f] font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{fmt(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between" style={{ color:'var(--ink-soft)' }}>
                  <span>Delivery Fee</span>
                  <span className={deliveryInfo.fee === 0 && cityValue?.length >= 2 ? "text-green-600 font-bold" : ""}>
                    {deliveryInfo.fee === 0 && cityValue?.length >= 2 ? "FREE" : fmt(deliveryInfo.fee)}
                  </span>
                </div>
              </div>

              <hr className="mb-3" style={{ borderColor:'var(--border)' }} />
              <div className="flex justify-between font-bold text-base mb-1">
                <span style={{ color:'var(--ink)' }}>Total</span>
                <span style={{ color:'var(--teal)' }}>{fmt(dynamicTotal)}</span>
              </div>
              <p className="text-[11px] mb-5" style={{ color:'var(--ink-soft)' }}>VAT inclusive where applicable</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <img src="/images/pesapal.webp"   alt="PesaPal"     className="h-5 w-auto object-contain" />
                <img src="/images/mtn.webp"       alt="MTN MoMo"   className="h-5 w-auto object-contain" />
                <img src="/images/airtel.webp"    alt="Airtel"      className="h-5 w-auto object-contain" />
                <img src="/images/visa.webp"      alt="Visa"        className="h-5 w-auto object-contain" />
                <img src="/images/Mastercard.webp" alt="Mastercard" className="h-5 w-auto object-contain" />
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}