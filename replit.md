# Pyramid Books — Distribution Management System

## Overview
A full-stack book distribution management system built with Node.js/Express, PostgreSQL, and Bootstrap. Features custom email/password authentication, simplified 3-role access control, stock management, CSV import/export, reporting, customer storefront with shopping cart, percentage-based discount rules, customer profile management, and school lists feature.

## Tech Stack
- **Backend**: Express.js + TypeScript, Drizzle ORM, PostgreSQL (Neon)
- **Frontend**: React + TypeScript, Bootstrap 5, wouter routing, TanStack Query v5
- **Auth**: Custom email/password authentication with bcrypt hashing, express-session with PostgreSQL session store (connect-pg-simple)
- **Styling**: Custom CSS with glassmorphic design, professional blue color scheme (#2C3E50/#3498DB)

## Project Architecture
```
shared/
  schema.ts         – Drizzle tables, Zod schemas, TypeScript types
  routes.ts         – API route definitions with Zod validation
  models/
    auth.ts         – Auth request/response types (LoginRequest, RegisterRequest)
server/
  index.ts          – Entry point
  routes.ts         – Express route handlers
  storage.ts        – Database storage layer (IStorage interface + DatabaseStorage)
  db.ts             – Database connection
  vite.ts           – Vite dev server integration
  replit_integrations/auth/
    routes.ts       – Auth endpoints (register, login, logout)
    replitAuth.ts   – Session middleware setup, isAuthenticated guard
    storage.ts      – Auth-specific DB operations (getUserByEmail, upsertUser)
client/src/
  App.tsx           – Root component with role-based routes
  index.css         – Theme variables, glassmorphic styles, Bootstrap harmony
  lib/
    queryClient.ts  – TanStack Query client, apiRequest helper
    auth-utils.ts   – Auth utility functions (redirectToLogin)
  components/
    AppShell.tsx     – Admin layout with sidebar + topbar navigation
    CustomerLayout.tsx – Customer storefront layout with top navbar
    RequireRole.tsx  – Role-based access guard component
    GlassCard.tsx    – Glassmorphic card component
    SectionHeader.tsx – Page header component
    Seo.tsx         – SEO meta tags
    ConfirmDialog.tsx – Confirmation dialog
    EmptyState.tsx  – Empty state component
  pages/
    Landing.tsx     – Public landing page with auth links
    Login.tsx       – Login page (email/password) with "Forgot password?" link
    Signup.tsx      – Registration page (name, email, phone, password with strength meter)
    ForgotPassword.tsx – Forgot password request page (email form)
    ResetPassword.tsx – Reset password page (token from URL, new password form)
    Dashboard.tsx   – Main dashboard with KPIs
    Books.tsx       – Book management (CRUD)
    Customers.tsx   – Customer management (CRUD)
    OrdersList.tsx  – Orders list
    OrderCreate.tsx – Create new order
    OrderDetail.tsx – Order detail view
    Payments.tsx    – Payment management
    Users.tsx       – User management (admin only, create users)
    StockReceipts.tsx – Stock receipt management
    Reports.tsx     – Analytics and reports
    CsvImportExport.tsx – CSV import/export
    DiscountRules.tsx – Discount rule management (admin only)
    StoreCatalog.tsx – Customer book browsing/catalog
    StoreCart.tsx    – Customer shopping cart
    StoreOrders.tsx – Customer order history
    StorePayments.tsx – Customer payment history
    StoreProfile.tsx – Customer profile management (profile type, password change)
    StoreSchoolLists.tsx – School lists management (create, manage, add to cart)
  hooks/
    use-me.ts, use-books.ts, use-customers.ts, use-orders.ts,
    use-payments.ts, use-users.ts, use-dashboard.ts,
    use-stock-receipts.ts, use-reports.ts, use-cart.ts,
    use-discounts.ts
```

## Authentication
- Custom email/password auth (replaced Replit OIDC)
- bcrypt password hashing (10 rounds)
- express-session with PostgreSQL session store
- Session stored in `session` table
- Default admin: admin@pyramidbooks.example / admin123
- All new signups get "customer" role
- Admin can create users (salesman, customer, admin) via POST /api/admin/users

## Roles
- `admin` – Full access, user management, CSV import/export, discount rules
- `salesman` – Manage assigned customers, create orders/payments, stock receipts, reports
- `customer` – Browse catalog, shopping cart, view own orders/payments, school lists, profile management

## Key Features
- **Books**: CRUD, search, filter by category, low stock alerts, buying_price tracking
- **Customers**: CRUD, assigned to salesmen, credit limits
- **Orders**: Create with line items, auto-calculate totals, stock deduction, percentage discounts
- **Payments**: Record payments against customers/orders
- **Stock Receipts**: Track inventory received from publishers, auto-update stock
- **Reports**: Sales by month, top books, top customers, outstanding balances, salesman performance
- **CSV Import/Export**: Bulk import/export books and customers, download templates
- **User Management**: Role assignment, activation/deactivation, admin can create users directly
- **Shopping Cart**: Add books, adjust quantities, checkout with auto-discount application
- **Discount Rules**: Admin-configurable percentage discounts with min order thresholds and date ranges
- **Customer Storefront**: Separate layout for customers with book catalog, cart, and order history
- **Customer Profile**: Profile type selection (Individual/School/Company), company/tax info, password change
- **School Lists**: Create named lists for schools/institutions, add books with quantities, add all items to cart

## Role-Based Routing
- Admin/Salesman users: `/` redirects to Dashboard with admin sidebar layout (AppShell)
- Customer users: `/` redirects to `/store` with customer top-navbar layout (CustomerLayout)
- Public routes: `/landing`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Store routes: `/store`, `/store/cart`, `/store/orders`, `/store/payments`, `/store/profile`, `/store/school-lists`
- Admin routes: `/dashboard`, `/books`, `/customers`, `/orders`, `/payments`, `/stock`, `/reports`, `/csv`, `/discounts`, `/users`

## API Endpoints
- Auth: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, POST /api/auth/forgot-password, POST /api/auth/reset-password
- Profile: GET /api/me, PATCH /api/profile, PATCH /api/profile/password
- Admin: POST /api/admin/users (create user accounts), GET /api/admin/password-resets (pending reset requests)
- School Lists: GET/POST /api/school-lists, PATCH/DELETE /api/school-lists/:id
- School List Items: POST /api/school-lists/:id/items, PATCH/DELETE /api/school-lists/:listId/items/:itemId
- Add to Cart: POST /api/school-lists/:id/add-to-cart

## Database Tables
users, customers, books, orders, order_items, payments, stock_receipts, stock_receipt_items, shopping_cart, discount_rules, school_lists, school_list_items, password_reset_tokens, session

## Recent Changes (Feb 2026)
- Replaced Replit OIDC with custom email/password authentication
- Simplified roles from 4 (super_admin, salesman, fixed_customer, local_customer) to 3 (admin, salesman, customer)
- Added Login and Signup pages with password strength meter
- Added customer profile page with profile type (Individual/School/Company) and password change
- Added school lists feature (create lists, add books, add all to cart)
- Added admin user creation (POST /api/admin/users)
- Added profileType, companyName, taxNumber, address fields to users table
- Added school_lists and school_list_items tables
- Removed fixed_customer_users table
- Added forgot password / reset password flow (admin-assisted, no email service)
- Admin can view pending password reset requests on Users page and copy reset links
- Password reset tokens stored in password_reset_tokens table (1-hour expiry, single-use)
- Stock quantity hidden from customers (shows "Available"/"Out of stock" instead of numbers)
- API strips stockQty, buyingPrice, reorderLevel from books response for customer role
- Note: No email service configured (Resend dismissed). Password resets are admin-assisted (admin copies reset link to share with user)
