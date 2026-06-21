import { useState } from 'react';
import { api } from '../stores';

export default function AdminSettings() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const inputCls = "w-full px-3 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors bg-white";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1";

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.put('/admin/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setMessage({ text: '✓ Password updated successfully!', type: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white border border-[#ede9e2] rounded-2xl p-6">
      <h3 className="font-semibold text-xl font-medium mb-1 text-[#141414]">Security Settings</h3>
      <p className="text-xs text-[#999] mb-5">Update your administrator account access credentials.</p>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${
          message.type === 'success' 
            ? 'bg-[#e8f2e8] text-[#2C5F2D] border-[#c2e0c2]' 
            : 'bg-[#fef2f2] text-[#e05252] border-[#fecaca]'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className={labelCls}>Current Password</label>
          <input type="password" value={form.currentPassword} 
                 onChange={e => setForm({...form, currentPassword: e.target.value})}
                 className={inputCls} required placeholder="••••••••" />
        </div>
        <div>
          <label className={labelCls}>New Password</label>
          <input type="password" value={form.newPassword} 
                 onChange={e => setForm({...form, newPassword: e.target.value})}
                 className={inputCls} required placeholder="••••••••" />
        </div>
        <div>
          <label className={labelCls}>Confirm New Password</label>
          <input type="password" value={form.confirmPassword} 
                 onChange={e => setForm({...form, confirmPassword: e.target.value})}
                 className={inputCls} required placeholder="••••••••" />
        </div>

        <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60 mt-2"
                style={{ background: '#2C5F2D' }}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}