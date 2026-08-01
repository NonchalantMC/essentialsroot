import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores';
import Navbar        from './components/common/Navbar';
import Footer        from './components/common/Footer';
import CartDrawer    from './components/cart/CartDrawer';
import MobileNav     from './components/common/MobileNav';
import Toast         from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import WhatsAppButton from './components/common/WhatsAppButton';

// ── Core pages ────────────────────────────────────────────────────────────────
const Home              = lazy(() => import('./pages/Home'));
const Products          = lazy(() => import('./pages/Products'));
const ProductDetail     = lazy(() => import('./pages/ProductDetail'));
const Cart              = lazy(() => import('./pages/Cart'));
const Checkout          = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Profile           = lazy(() => import('./pages/Profile'));
const Login             = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register          = lazy(() => import('./pages/Login').then(m => ({ default: m.Register })));
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword     = lazy(() => import('./pages/ResetPassword'));
const ConfirmEmailChange = lazy(() => import('./pages/ConfirmEmailChange'));
const Admin             = lazy(() => import('./pages/Admin'));
const PaymentCallback   = lazy(() => import('./pages/PaymentCallback'));

// ── Static / informational pages ─────────────────────────────────────────────
const SizeGuide = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.SizeGuide })));
const Returns   = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Returns   })));
const Contact   = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Contact   })));
const About     = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About     })));
const Privacy   = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Privacy   })));
const Terms     = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Terms     })));
const Blog      = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Blog      })));

// ── Loading spinner ───────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf7f2' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: '#2C5F2D', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: '#999' }}>Loading...</p>
    </div>
  </div>
);

// ── Scroll restoration ────────────────────────────────────────────────────────
// React Router doesn't reset scroll position on navigation the way a full page
// load does — without this, clicking a footer/nav link leaves you wherever you
// were scrolled to on the previous page. This runs on every route change and
// fixes it app-wide (footer links, navbar links, product cards, everywhere).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// ── Protected route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  let token = null;
  let role  = null;
  try {
    const raw = localStorage.getItem('essentials256-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.state?.token      || null;
      role  = parsed?.state?.user?.role || null;
    }
  } catch {}

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { refreshUser, isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn()) refreshUser();
  }, []); // eslint-disable-line

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#faf7f2' }}>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                   element={<Home />} />
            <Route path="/footwear"           element={<Products type="footwear" />} />
            <Route path="/decor"              element={<Products type="decor" />} />
            <Route path="/accessories"        element={<Products type="accessories" />} />
            <Route path="/products"           element={<Products />} />
            <Route path="/products/:slug"     element={<ProductDetail />} />
            <Route path="/cart"               element={<Cart />} />
            <Route path="/checkout"           element={<Checkout />} />
            <Route path="/login"              element={<Login />} />
            <Route path="/register"           element={<Register />} />
            <Route path="/forgot-password"    element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/confirm-email/:token" element={<ConfirmEmailChange />} />
            <Route path="/payment/callback"   element={<PaymentCallback />} />

            {/* ── Static pages ── */}
            <Route path="/size-guide"         element={<SizeGuide />} />
            <Route path="/returns"            element={<Returns />} />
            <Route path="/contact"            element={<Contact />} />
            <Route path="/about"              element={<About />} />
            <Route path="/privacy"            element={<Privacy />} />
            <Route path="/terms"              element={<Terms />} />
            <Route path="/blog"               element={<Blog />} />

            {/* ── Protected ── */}
            <Route path="/order/:orderNumber" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/profile"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin/*"            element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

            <Route path="*"                   element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <MobileNav />
      <Toast />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <AppShell />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
