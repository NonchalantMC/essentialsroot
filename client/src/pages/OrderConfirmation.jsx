import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderService } from '../services/api';

const fmt = (n) => `UGX ${n?.toLocaleString()}`;

const STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: '✓' },
  { key: 'processing', label: 'Processing',     icon: '⚙' },
  { key: 'shipped',    label: 'Shipped',        icon: '🚚' },
  { key: 'delivered',  label: 'Delivered',      icon: '📦' },
];

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getByNumber(orderNumber)
      .then(({ data }) => setOrder(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" /></div>;

  const currentStep = STEPS.findIndex(s => s.key === order?.orderStatus) ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}>
        <div className="text-6xl mb-4">🎉</div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="font-serif text-4xl text-sage-600 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 text-lg mb-8">
          Thank you for shopping with Essentials256. We'll send updates to your email.
        </p>

        {/* Order number */}
        <div className="bg-sage-50 border border-sage-100 rounded-2xl p-6 mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Order Number</p>
          <p className="text-2xl font-bold text-sage-600 tracking-wider">{orderNumber}</p>
          {order?.total && (
            <p className="text-sm text-gray-500 mt-2">Total paid: <span className="font-semibold text-gray-700">{fmt(order.total)}</span></p>
          )}
        </div>

        {/* Tracking timeline */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-6">Order Status</h3>
          <div className="relative flex justify-between">
            <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-100 -z-0" />
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < currentStep ? 'bg-sage-500 text-white' :
                  i === currentStep ? 'bg-white border-2 border-sage-500 text-sage-600' :
                  'bg-white border-2 border-gray-200 text-gray-300'
                }`}>
                  {i < currentStep ? '✓' : step.icon}
                </div>
                <span className={`text-xs ${i <= currentStep ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        {order?.items?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.size ? `EU ${item.size} · ` : ''}Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-sage-600">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp support */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-8">
          <p className="text-sm font-medium text-green-800 mb-1">📱 Need help with your order?</p>
          <p className="text-xs text-green-600">Chat with us on WhatsApp for instant support</p>
          <a
            href={`https://wa.me/256700000000?text=Hi! I need help with order ${orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 bg-green-500 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-green-600 transition-colors"
          >
            WhatsApp Support
          </a>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/" className="btn-sage px-6 py-3">Continue Shopping</Link>
          <Link to="/profile?tab=orders" className="btn-outline border-gray-200 text-gray-600 px-6 py-3">View All Orders</Link>
        </div>
      </motion.div>
    </div>
  );
}
