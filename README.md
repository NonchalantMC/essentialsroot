# Essentials256 🛍️

> Premium ladies footwear and interior decor e-commerce platform for Rwanda & Uganda.
> Built with React + Vite, Node.js + Express, MongoDB, and PesaPal payments.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- PesaPal sandbox account → [developer.pesapal.com](https://developer.pesapal.com)
- Cloudinary account (free tier) → [cloudinary.com](https://cloudinary.com)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/essentials256.git
cd essentials256

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

```bash
# In the project root
cp .env.example server/.env
```

Edit `server/.env` with your actual credentials:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/essentials256
JWT_SECRET=your_super_secret_key_min_32_chars
CLIENT_URL=http://localhost:5173

# PesaPal (get from developer.pesapal.com)
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_CONSUMER_KEY=your_key
PESAPAL_CONSUMER_SECRET=your_secret
PESAPAL_CALLBACK_URL=http://localhost:5173/payment/callback
PESAPAL_IPN_URL=http://localhost:5000/api/payments/pesapal/ipn

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

Create `client/.env`:
```env
VITE_API_URL=/api
```

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates:
- **Admin**: `admin@essentials256.com` / `Admin@123`
- **Customer**: `jane@example.com` / `Customer@123`
- **Customer**: `mary@example.com` / `Customer@123`
- 10 products (5 footwear, 5 decor)
- 3 sample orders
- Sample reviews

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173** 🎉

---

## 💳 PesaPal Integration

### Sandbox Setup

1. Register at [developer.pesapal.com](https://developer.pesapal.com)
2. Create a sandbox app → get Consumer Key & Secret
3. Add them to `server/.env`

### Test Payment Flow

1. Add items to cart → Checkout → "Pay via PesaPal"
2. You'll be redirected to PesaPal's sandbox hosted page
3. Use these sandbox test credentials:

**MTN MoMo (Uganda)**
```
Phone: 0777000000
PIN:   1234
```

**Visa Card**
```
Card:  4111 1111 1111 1111
Exp:   12/26
CVV:   123
Name:  Test User
```

**Airtel Money**
```
Phone: 0750000000
PIN:   1234
```

### IPN Testing (Webhooks)

For local development, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 5000
# Copy the https URL, e.g. https://abc123.ngrok.io
```

Update `.env`:
```
PESAPAL_IPN_URL=https://abc123.ngrok.io/api/payments/pesapal/ipn
PESAPAL_CALLBACK_URL=http://localhost:5173/payment/callback
```

### Payment Flow (Code)

```
1. POST /api/orders          → Create order in DB
2. POST /api/payments/pesapal/initiate  → Get PesaPal redirect URL
3. Redirect to PesaPal        → Customer pays
4. PesaPal → Callback URL    → Update order status
5. PesaPal → IPN URL         → Webhook confirmation
```

---

## 📁 Project Structure

```
essentials256/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Navbar, Footer, Toast, MobileNav
│   │   │   ├── cart/          # CartDrawer
│   │   │   └── products/      # ProductCard
│   │   ├── pages/             # All page components
│   │   ├── stores/            # Zustand state (cart, auth, wishlist)
│   │   ├── services/          # API service layer
│   │   ├── hooks/             # useToast
│   │   └── App.jsx            # Router setup
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                    # Node.js + Express backend
│   ├── config/database.js     # MongoDB connection
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── ReviewCartCoupon.js
│   ├── routes/                # Express routers
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── payments.js        # PesaPal integration
│   │   ├── admin.js
│   │   └── upload.js
│   ├── middleware/            # auth.js, errorHandler.js
│   ├── utils/
│   │   ├── pesapal.js         # PesaPal API wrapper
│   │   ├── email.js           # Nodemailer
│   │   └── seed.js            # Database seeder
│   └── server.js
│
├── .env.example
└── README.md
```

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd client
npm run build

# Deploy with Vercel CLI
npx vercel --prod
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL = https://api.essentials256.com/api
```

### Backend → Railway

1. Create new Railway project
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. Add all env variables from `.env.example`
5. Railway auto-deploys on push

### Backend → Render

```yaml
# render.yaml
services:
  - type: web
    name: essentials256-api
    env: node
    rootDir: server
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
```

### Custom Domain

1. Add `essentials256.com` in Vercel
2. Add `api.essentials256.com` in Railway/Render (as custom domain)
3. Update `PESAPAL_CALLBACK_URL` and `PESAPAL_IPN_URL` to production URLs
4. Switch `PESAPAL_ENVIRONMENT=production` and add production keys

---

## 🛠️ API Reference

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Create account    |
| POST   | /api/auth/login       | Sign in           |
| GET    | /api/auth/me          | Current user      |
| PATCH  | /api/auth/profile     | Update profile    |

### Products
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| GET    | /api/products         | List with filters |
| GET    | /api/products/:slug   | Get by slug       |
| POST   | /api/products         | Create (admin)    |
| PATCH  | /api/products/:id     | Update (admin)    |
| DELETE | /api/products/:id     | Delete (admin)    |

### Payments (PesaPal)
| Method | Endpoint                            | Description          |
|--------|-------------------------------------|----------------------|
| POST   | /api/payments/pesapal/initiate      | Start payment        |
| GET    | /api/payments/pesapal/callback      | Payment return       |
| POST   | /api/payments/pesapal/ipn           | Webhook notification |
| GET    | /api/payments/pesapal/status/:order | Check status         |

---

## 🧪 Common Issues

**MongoDB connection fails**
- Ensure MongoDB is running: `mongod --dbpath /data/db`
- For Atlas: whitelist your IP, check connection string format

**PesaPal redirect 404**
- Check `PESAPAL_CALLBACK_URL` matches your frontend URL exactly
- Ensure the `/payment/callback` route exists in React Router

**Font not loading**
- Place `CircularStd-*.woff2` files in `client/public/fonts/`
- Google Fonts (DM Sans) serves as fallback automatically

---

## 📱 Mobile

The app features a bottom navigation bar on mobile (`< 768px`):
- **Home** → `/`
- **Search** → `/products`
- **Cart** → `/cart`
- **Profile** → `/profile`

---

## 🔒 Security Features

- JWT authentication (7-day expiry)
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- CORS configured for specific origins
- Rate limiting (100 req/15min per IP)
- Input validation with Zod
- Admin-only route protection

---

## 📄 License

MIT © Essentials256

---

**Built with ❤️ for the modern African woman**
