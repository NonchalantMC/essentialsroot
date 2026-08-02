import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/api';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const orderNumber = searchParams.get('orderNumber');
    if (!orderNumber) { navigate('/'); return; }

    // Registered users prove identity via their session token automatically.
    // Guests have none — this is the phone Checkout.jsx stashed right after
    // order creation, letting the status check confirm it's the same guest
    // rather than trusting orderNumber alone (order numbers are sequential
    // and guessable, unlike the random order-doc IDs used elsewhere).
    const guestPhone = sessionStorage.getItem('guestOrderPhone');

    // Poll payment status
    const check = async () => {
      try {
        const { data } = await paymentService.checkStatus(orderNumber, guestPhone);
        if (data.paymentStatus === 'paid') {
          sessionStorage.removeItem('guestOrderPhone');
          navigate(`/order/${orderNumber}`, { replace: true });
        } else if (data.paymentStatus === 'failed') {
          sessionStorage.removeItem('guestOrderPhone');
          setStatus('failed');
        } else {
          // Still pending — retry in 3 seconds
          setTimeout(check, 3000);
        }
      } catch {
        setStatus('failed');
      }
    };
    check();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'checking' ? (
          <>
            <div className="w-12 h-12 border-3 border-sage-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Confirming your payment...</p>
            <p className="text-sm text-gray-400 mt-2">Please wait, do not close this page.</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-lg font-medium text-red-600">Payment failed or was cancelled</p>
            <p className="text-sm text-gray-400 mt-2 mb-6">Your order has not been placed.</p>
            <button onClick={() => navigate('/checkout')} className="btn-sage px-6 py-2.5">Try Again</button>
          </>
        )}
      </div>
    </div>
  );
}
