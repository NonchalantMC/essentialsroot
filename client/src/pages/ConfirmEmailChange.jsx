import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/api';

export default function ConfirmEmailChange() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [status, setStatus]   = useState('confirming'); // confirming | success | error
  const [message, setMessage] = useState('');
  const ranOnce = useRef(false); // StrictMode/dev double-effect guard — this call has a side effect, must not fire twice

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    authService.confirmEmailChange(token)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message || 'Email confirmed and updated.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This confirmation link is invalid or has expired.');
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bone)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl w-full max-w-md p-8 text-center"
          style={{ boxShadow: '0 4px 24px rgba(33,40,54,.08)' }}>
        <Link to="/" className="flex-shrink-0 inline-block mb-6">
          <div className="font-semibold text-[22px]">
            <span style={{ color: '#808080' }}>essentials</span>
            <span style={{ color: 'var(--teal)' }}>256</span>
          </div>
        </Link>

        {status === 'confirming' && (
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Confirming your new email…</p>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>Email confirmed</h1>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{message}</p>
            <p className="text-xs mt-4" style={{ color: 'var(--ink-soft)' }}>Taking you to login…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold mb-2" style={{ color: '#e05252' }}>Link invalid or expired</h1>
            <p className="text-sm mb-5" style={{ color: 'var(--ink-soft)' }}>{message}</p>
            <Link to="/login" className="inline-block text-sm font-medium hover:underline" style={{ color: 'var(--teal)' }}>
              Back to login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
