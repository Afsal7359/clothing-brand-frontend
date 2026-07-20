# clothing-brand-frontend
# underdawg — Full-Stack Streetwear Ecommerce

A complete streetwear ecommerce template built with:

- **Frontend:** Next.js 14 (App Router, JSX), Swiper.js
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Multer uploads
- **Admin panel:** Product/Collection/Order management with image uploads

## Project structure

```
underdawg/
├── backend/              # Express + MongoDB API
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, upload, errors
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   ├── server.js     # Entry point
│   │   └── seed.js       # Seed admin + sample data
│   ├── uploads/          # Uploaded product images (gitignored)
│   ├── .env.example
│   └── package.json
│
└── frontend/             # Next.js 14 app
    ├── src/
    │   ├── app/
    │   │   ├── page.jsx                  # Homepage
    │   │   ├── product/[slug]/           # Product detail
    │   │   ├── collections/              # Collections browse
    │   │   ├── cart/                     # Checkout
    │   │   └── admin/                    # Admin panel
    │   ├── components/                   # Shared components
    │   ├── context/                      # Cart + Admin contexts
    │   └── lib/api.js                    # API client
    ├── .env.local.example
    └── package.json
```

## Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB** running locally (or a MongoDB Atlas connection string)

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set MONGO_URI and JWT_SECRET
npm install
npm run seed    # creates admin user + sample products & collections
npm run dev     # starts on http://localhost:5005
```

Default admin credentials (change these in `.env` before seeding):
- Email: `admin@underdawg.com`
- Password: `admin12345`

### 2. Frontend

In a separate terminal:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev     # starts on http://localhost:3000
```

Open:
- Storefront: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Features

### Storefront
- Responsive homepage with stories strip, hero banner (separate desktop/mobile images), product grids
- **Mobile-optimized Discover Collection swiper** with Swiper.js creative 3D transition
- Product detail page with image gallery, size picker, add-to-cart
- Collection browse pages
- Cart drawer with localStorage persistence
- Full checkout flow with order placement
- Touch-friendly interactions (tap-to-swap product images on mobile)
- Safe-area awareness for notched phones
- Minimum 44px tap targets throughout

### Admin panel
- JWT-based authentication
- Dashboard with revenue and order stats
- Products: create, edit, delete with image upload (up to 10 per product)
- Collections: manage homepage collections with separate desktop/mobile images
- Orders: view details, update status (pending → shipped → delivered)
- Variants and stock tracking per size

## API endpoints

### Public
- `GET /api/health`
- `GET /api/products` — query: `q`, `category`, `collection`, `featured`, `isNew`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`
- `GET /api/products/:idOrSlug`
- `GET /api/collections` — query: `featured`, `active`
- `GET /api/collections/:idOrSlug`
- `POST /api/orders` — place an order

### Protected (admin JWT)
- `POST /api/admin/login`
- `GET /api/admin/me`
- `POST /api/admin/upload` — multipart form with `files[]`
- `POST|PUT|DELETE /api/products[/:id]`
- `POST|PUT|DELETE /api/collections[/:id]`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`

## Mobile responsiveness

Major mobile improvements applied throughout:

- **Viewport units:** `dvh` (dynamic viewport height) instead of `vh` — fixes iOS Safari address bar jumps
- **Safe-area insets:** padding accounts for notches and home indicators via `env(safe-area-inset-*)`
- **Touch-friendly:** 44px minimum tap targets on all interactive elements
- **Responsive breakpoints:** 360 / 420 / 520 / 700 / 760 / 900 / 1100 px
- **Touch detection:** `@media (hover: none)` swaps hover effects for tap-to-toggle
- **Horizontal scroll on mobile:** Product rails, stories strip, PDP gallery all become swipeable
- **Full-bleed mobile:** Discover swiper breaks out of section padding for edge-to-edge feel
- **Creative transition:** Swiper.js drives scale/translate/rotate on swipe for the Discover carousel (≤700px)

## Replace placeholder images

The seed script and components use `picsum.photos` as placeholders. To replace:

1. Run the backend and frontend locally
2. Log into `/admin`
3. For each product: click Edit → upload your real product images (uploads are stored in `backend/uploads/`)
4. For each collection: upload desktop + mobile hero images

Uploads are served from `http://localhost:5005/uploads/<filename>` during development.

## Deploying

### Backend (e.g., Render, Railway, Fly.io)
- Set env vars matching `.env.example`
- Use a managed MongoDB (Atlas) for `MONGO_URI`
- For image uploads in production, swap `multer.diskStorage` in `backend/src/middleware/upload.js` for S3 / Cloudinary / Bunny — local disk won't persist across deploys

### Frontend (e.g., Vercel)
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_UPLOADS_URL` to your deployed backend URL
- `npm run build` → `npm start`

## Extending

- **Payments:** Plug Razorpay / Stripe / Cashfree into `backend/src/controllers/orderController.js#createOrder` after creating the order — return a payment intent/order to the frontend for gateway redirect
- **Customer accounts:** Add a `User` model mirroring `Admin`, add login/register routes and a `/account` page
- **Search:** For better search, add a text index on Product (`productSchema.index({ title: 'text', description: 'text' })`) and swap the regex query in `listProducts`
- **Email:** On order creation, send confirmation via Nodemailer + a transactional provider (Postmark, Resend)

## License

This code is for your own use — customize, fork, ship. The design and all markup are original.
