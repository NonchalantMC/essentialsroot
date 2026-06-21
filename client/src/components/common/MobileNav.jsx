import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../stores';

const NAV = [
  { to: '/',        icon: HomeIcon,   label: 'Home'    },
  { to: '/products',icon: SearchIcon, label: 'Search'  },
  { to: '/cart',    icon: CartIcon,   label: 'Cart',   badge: true },
  { to: '/profile', icon: UserIcon,   label: 'Profile' },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const { count } = useCartStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 md:hidden safe-area-pb">
      <div className="flex">
        {NAV.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link key={to} to={to} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative">
              <div className={`relative transition-colors ${active ? 'text-sage-500' : 'text-gray-400'}`}>
                <Icon className="w-5 h-5" />
                {badge && count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold-500 text-gray-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-sage-500' : 'text-gray-400'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function SearchIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function CartIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
}
function UserIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
