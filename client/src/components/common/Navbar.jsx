import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../../stores';

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const { count, openCart }       = useCartStore();
  const { user, token, logout }   = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const loggedIn = !!token;
  const isAdmin  = user?.role === 'admin';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const isActive = (path) => {
  if (path === '/') return location.pathname === '/';
  if (path === '/products?tag=sale') {
    return location.pathname === '/products' && location.search === '?tag=sale';
  }
  return location.pathname.startsWith(path);
};

  return (
    <>
      

      <nav className="sticky top-0 z-50 transition-all duration-300 border-b"
     style={{
       borderColor: '#212836',
       backgroundColor: '#212836'
     }}>
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 relative -left-05">
            <div className="font-semibold text-[22px] leading-none">
                  <span style={{ color: '#ffffffff' }}>essentials</span>
                         <span style={{ color: 'var(--teal)' }}>256</span>
                       </div>
          </Link>

          {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
  {[
    { label: 'Home', to: '/' },
    { label: 'Footwear', to: '/footwear' },
    { label: 'Decor', to: '/decor' },
    { label: 'Sale', to: '/products?tag=sale' },
  ].map(link => {
    const active = isActive(link.to);
    return (
      <Link
        key={link.to}
        to={link.to}
        className="px-4 py-2 rounded-full text-sm border transition-all duration-200"
        style={
          active
            ? {
                color: 'var(--teal)',
                background: 'var(--teal-pale)',
                borderColor: 'rgba(30,128,95,.15)',
                fontWeight: 500,
              }
            : { color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }
        }
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.borderColor = 'var(--teal)';
            e.currentTarget.style.color = 'var(--teal)';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.color = '#ffffff';
          }
        }}
      >
        {link.label}
      </Link>
    );
  })}
</div>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Account */}
            {loggedIn ? (
              <div className="relative">
                <button
  onClick={() => setMenuOpen(o => !o)}
  className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200"
  style={{ borderColor: menuOpen ? 'var(--teal)' : 'rgba(255,255,255,0.3)' }}
  onMouseEnter={e => {
    if (!menuOpen) {
      e.currentTarget.style.borderColor = 'var(--teal)';
    }
  }}
  onMouseLeave={e => {
    if (!menuOpen) {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
    }
  }}
>
  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
       style={{ background: 'var(--teal)' }}>
    {user?.name?.[0]?.toUpperCase() || '?'}
  </div>
  <span className="hidden sm:block text-sm max-w-[90px] truncate"
        style={{ color: '#ffffff' }}>
    {user?.name?.split(' ')[0] || 'Account'}
  </span>
  <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
       style={{ color: '#ffffff' }}
       fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
</button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border py-2 z-50"
                         style={{borderColor:'var(--border)',boxShadow:'0 8px 32px rgba(33,40,54,.12)'}}>
                      <div className="px-4 py-2 border-b mb-1" style={{borderColor:'var(--border)'}}>
                        <div className="text-sm font-semibold truncate" style={{color:'var(--ink)'}}>{user?.name}</div>
                        <div className="text-xs truncate" style={{color:'var(--ink-soft)'}}>{user?.email}</div>
                      </div>
                      {[
                        {to:'/profile',             icon:'👤', label:'My Account'},
                        {to:'/profile?tab=orders',  icon:'📦', label:'My Orders'},
                        {to:'/profile?tab=wishlist',icon:'♡',  label:'Wishlist'},
                      ].map(item => (
                        <Link key={item.to} to={item.to}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bone)]"
                              style={{color:'var(--ink-mid)'}}>
                          <span>{item.icon}</span> {item.label}
                        </Link>
                      ))}
                      {isAdmin && (
                        <>
                          <div className="border-t my-1" style={{borderColor:'var(--border)'}} />
                          <Link to="/admin"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors"
                                style={{color:'var(--teal)'}}>
                            <span>⚙️</span> Admin Dashboard
                          </Link>
                        </>
                      )}
                      <div className="border-t my-1" style={{borderColor:'var(--border)'}} />
                      <button onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#fef2f2]"
                              style={{color:'#e05252'}}>
                        <span>→</span> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login"
           className="hidden sm:flex items-center px-4 py-2 rounded-full border text-sm transition-all"
             style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#ffffff'; }}>
                          Sign In
                </Link>
            )}

            {/* Cart */}
            <button onClick={openCart}
        className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border"
        style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff', background: 'transparent' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--teal)';
          e.currentTarget.style.color = 'var(--teal)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.color = '#ffffff';
        }}>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
  <span className="hidden sm:block">Cart</span>
  {count > 0 && (
    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: 'var(--teal)', color: '#212836' }}>
      {count > 9 ? '9+' : count}
    </span>
  )}
</button>          </div>
        </div>
      </nav>
    </>
  );
}
