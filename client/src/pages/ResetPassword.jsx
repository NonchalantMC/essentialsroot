import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authService } from '../services/api';

// Mirrors the server's password policy in auth.js — kept in sync so the
// user sees the same rule before submitting, not just after a 400 comes back.
const resetSchema = z.object({
  password: z.string().min(8, 'At least 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need a number'),
  confirm:  z.string(),
}).refine(data => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

const inp = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-[#a0adb8]";
const lbl = "block text-[11px] font-bold uppercase tracking-wide mb-1.5";

export default function ResetPassword() {
  const { token }   = useParams();
  const navigate    = useNavigate();
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ password }) => {
    setServerError('');
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'This reset link is invalid or has expired.');
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
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>Choose a new password</h1>
        </div>

        {done ? (
          <p className="text-center text-sm" style={{ color: 'var(--ink)' }}>
            Password updated. Taking you to login…
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={lbl} style={{ color: 'var(--ink-soft)' }}>New password</label>
              <input {...register('password')} type="password" autoComplete="new-password"
                     placeholder="••••••••"
                     className={inp}
                     style={{ border: `1px solid ${errors.password ? '#e05252' : 'var(--border)'}`, color: 'var(--ink)' }}
                     onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = '0 0 0 3px rgba(30,128,95,.1)'; }}
                     onBlur={e => { e.target.style.borderColor = errors.password ? '#e05252' : 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
              {errors.password && <p className="text-xs mt-1" style={{ color: '#e05252' }}>{errors.password.message}</p>}
            </div>

            <div>
              <label className={lbl} style={{ color: 'var(--ink-soft)' }}>Confirm password</label>
              <input {...register('confirm')} type="password" autoComplete="new-password"
                     placeholder="••••••••"
                     className={inp}
                     style={{ border: `1px solid ${errors.confirm ? '#e05252' : 'var(--border)'}`, color: 'var(--ink)' }}
                     onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = '0 0 0 3px rgba(30,128,95,.1)'; }}
                     onBlur={e => { e.target.style.borderColor = errors.confirm ? '#e05252' : 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
              {errors.confirm && <p className="text-xs mt-1" style={{ color: '#e05252' }}>{errors.confirm.message}</p>}
            </div>

            {serverError && <p className="text-xs" style={{ color: '#e05252' }}>{serverError}</p>}

            <button type="submit" disabled={isSubmitting}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ background: 'var(--teal)' }}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
