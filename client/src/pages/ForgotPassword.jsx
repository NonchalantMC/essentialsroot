import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authService } from '../services/api';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

const inp = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-[#a0adb8]";
const lbl = "block text-[11px] font-bold uppercase tracking-wide mb-1.5";

export default function ForgotPassword() {
  const [serverError, setServerError] = useState('');
  const [submitted, setSubmitted]      = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }) => {
    setServerError('');
    try {
      // Backend always returns the same generic message whether or not the
      // account exists, so we can safely show it as-is.
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bone)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl w-full max-w-md p-8"
          style={{ boxShadow: '0 4px 24px rgba(33,40,54,.08)' }}>
        <div className="text-center mb-8">
          <Link to="/" className="flex-shrink-0 ml-5">
            <div className="font-semibold text-[22px] mb-1">
              <span style={{ color: '#808080' }}>essentials</span>
              <span style={{ color: 'var(--teal)' }}>256</span>
            </div>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>Reset your password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              If an account exists for that email, a reset link is on its way. It'll expire in 1 hour.
            </p>
            <Link to="/login" className="inline-block text-sm font-medium hover:underline" style={{ color: 'var(--teal)' }}>
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={lbl} style={{ color: 'var(--ink-soft)' }}>Email</label>
              <input {...register('email')} type="email" autoComplete="email"
                     placeholder="jane@example.com"
                     className={inp}
                     style={{ border: `1px solid ${errors.email ? '#e05252' : 'var(--border)'}`, color: 'var(--ink)' }}
                     onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = '0 0 0 3px rgba(30,128,95,.1)'; }}
                     onBlur={e => { e.target.style.borderColor = errors.email ? '#e05252' : 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
              {errors.email && <p className="text-xs mt-1" style={{ color: '#e05252' }}>{errors.email.message}</p>}
            </div>

            {serverError && <p className="text-xs" style={{ color: '#e05252' }}>{serverError}</p>}

            <button type="submit" disabled={isSubmitting}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ background: 'var(--teal)' }}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
              Remembered your password?{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--teal)' }}>Sign in</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
