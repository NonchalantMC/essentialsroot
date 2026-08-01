import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuthStore } from '../stores';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const inputCls = "w-full px-3 py-2.5 border border-[#ede9e2] rounded-xl text-sm outline-none focus:border-[#2C5F2D] transition-colors bg-white";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[#999] mb-1";

  // ── Password ────────────────────────────────────────────────────────────
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMessage({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    if (!/[A-Z]/.test(pwForm.newPassword)) {
      setPwMessage({ text: 'Password must include an uppercase letter.', type: 'error' });
      return;
    }
    if (!/[0-9]/.test(pwForm.newPassword)) {
      setPwMessage({ text: 'Password must include a number.', type: 'error' });
      return;
    }

    setPwLoading(true);
    setPwMessage({ text: '', type: '' });

    try {
      await api.put('/admin/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMessage({ text: '✓ Password updated. Logging you out…', type: 'success' });
      setTimeout(async () => { await logout(); navigate('/login', { replace: true }); }, 1500);
    } catch (err) {
      setPwMessage({ text: err.response?.data?.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPwLoading(false);
    }
  };

  // ── Email ───────────────────────────────────────────────────────────────
  const [emailForm, setEmailForm]   = useState({ currentPassword: '', newEmail: '', confirmEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: '', type: '' });

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    const newEmail = emailForm.newEmail.trim().toLowerCase();
    const confirmEmail = emailForm.confirmEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailMessage({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }
    if (newEmail !== confirmEmail) {
      setEmailMessage({ text: 'Email addresses do not match.', type: 'error' });
      return;
    }
    if (newEmail === user?.email?.toLowerCase()) {
      setEmailMessage({ text: 'That is already your current email address.', type: 'error' });
      return;
    }

    setEmailLoading(true);
    setEmailMessage({ text: '', type: '' });

    try {
      const { data } = await api.put('/admin/change-email', {
        currentPassword: emailForm.currentPassword,
        newEmail,
      });
      setEmailForm({ currentPassword: '', newEmail: '', confirmEmail: '' });
      // The email doesn't change yet — a confirmation link just went to the
      // NEW address. Nothing here invalidates the current session, so no
      // logout/redirect until that link is actually clicked.
      setEmailMessage({ text: `✓ ${data.message}`, type: 'success' });
    } catch (err) {
      setEmailMessage({ text: err.response?.data?.message || 'Failed to update email.', type: 'error' });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
        <h3 className="font-semibold text-xl font-medium mb-1 text-[#141414]">Email</h3>
        <p className="text-xs text-[#999] mb-1">
          Current: <span className="font-medium text-[#141414]">{user?.email}</span>
        </p>
        <p className="text-xs text-[#999] mb-5">We'll email a confirmation link to the new address — it only takes effect once you click it.</p>

        {emailMessage.text && (
          <div className={`mb-4 p-3 rounded-xl text-sm border ${
            emailMessage.type === 'success' 
              ? 'bg-[#e8f2e8] text-[#2C5F2D] border-[#c2e0c2]' 
              : 'bg-[#fef2f2] text-[#e05252] border-[#fecaca]'
          }`}>
            {emailMessage.text}
          </div>
        )}

        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" value={emailForm.currentPassword} 
                   onChange={e => setEmailForm({...emailForm, currentPassword: e.target.value})}
                   className={inputCls} required placeholder="••••••••" />
          </div>
          <div>
            <label className={labelCls}>New Email</label>
            <input type="email" value={emailForm.newEmail} 
                   onChange={e => setEmailForm({...emailForm, newEmail: e.target.value})}
                   className={inputCls} required placeholder="you@example.com" />
          </div>
          <div>
            <label className={labelCls}>Confirm New Email</label>
            <input type="email" value={emailForm.confirmEmail} 
                   onChange={e => setEmailForm({...emailForm, confirmEmail: e.target.value})}
                   className={inputCls} required placeholder="you@example.com" />
          </div>

          <button type="submit" disabled={emailLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60 mt-2"
                  style={{ background: '#2C5F2D' }}>
            {emailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>
      <div className="bg-white border border-[#ede9e2] rounded-2xl p-6">
        <h3 className="font-semibold text-xl font-medium mb-1 text-[#141414]">Password</h3>
        <p className="text-xs text-[#999] mb-5">Update your administrator account access credentials.</p>

        {pwMessage.text && (
          <div className={`mb-4 p-3 rounded-xl text-sm border ${
            pwMessage.type === 'success' 
              ? 'bg-[#e8f2e8] text-[#2C5F2D] border-[#c2e0c2]' 
              : 'bg-[#fef2f2] text-[#e05252] border-[#fecaca]'
          }`}>
            {pwMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" value={pwForm.currentPassword} 
                   onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
                   className={inputCls} required placeholder="••••••••" />
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <input type="password" value={pwForm.newPassword} 
                   onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                   className={inputCls} required placeholder="••••••••" />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} 
                   onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
                   className={inputCls} required placeholder="••••••••" />
          </div>

          <button type="submit" disabled={pwLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60 mt-2"
                  style={{ background: '#2C5F2D' }}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
