# Pyramid Books — Distribution Management System

## Overview
A full-stack book distribution management system built with Node.js/Express, PostgreSQL, and Bootstrap. Features role-based access control, stock management, CSV import/export, reporting, customer storefront with shopping cart, and percentage-based discount rules.

## Tech Stack
- **Backend**: Express.js + TypeScript, Drizzle ORM, PostgreSQL (Neon)
- **Frontend**: React + TypeScript, Bootstrap 5, wouter routing, TanStack Query v5
- **Auth**: Replit OIDC Auth (OpenID Connect)
- **Styling**: Custom CSS with glassmorphic design, professional blue color scheme (#2C3E50/#3498DB)

## Project Architecture
```
shared/
  schema.ts         – Drizzle tables, Zod schemas, TypeScript types
  routes.ts         – API route definitions with Zod validation
server/
  index.ts          – Entry point
  routes.ts         – Express route handlers
  storage.ts        – Database storage layer (IStorage interface + DatabaseStorage)
  db.ts             – Database connection
  auth.ts           – Replit OIDC auth middleware
  vite.ts           – Vite dev server integration
client/src/
  App.tsx           – Root component with role-based routes
  index.css         – Theme variables, glassmorphic styles, Bootstrap harmony
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
    Landing.tsx     – Public landing page
    Dashboard.tsx   – Main dashboard with KPIs
    Books.tsx       – Book management (CRUD)
    Customers.tsx   – Customer management (CRUD)
    OrdersList.tsx  – Orders list
    OrderCreate.tsx – Create new order
    OrderDetail.tsx – Order detail view
    Payments.tsx    – Payment management
    Users.tsx       – User management (admin only)
    StockReceipts.tsx – Stock receipt management
    Reports.tsx     – Analytics and reports
    CsvImportExport.tsx – CSV import/export
    DiscountRules.tsx – Discount rule management (admin only)
    StoreCatalog.tsx – Customer book browsing/catalog
    StoreCart.tsx    – Customer shopping cart
    StoreOrders.tsx – Customer order history
    StorePayments.tsx – Customer payment history
  hooks/
    use-me.ts, use-books.ts, use-customers.ts, use-orders.ts,
    use-payments.ts, use-users.ts, use-dashboard.ts,
    use-stock-receipts.ts, use-reports.ts, use-cart.ts,
    use-discounts.ts
```

## Roles
- `super_admin` – Full access, user management, CSV import/export, discount rules
- `salesman` – Manage assigned customers, create orders/payments, stock receipts, reports
- `fixed_customer` – Browse catalog, shopping cart, view own orders and payments, credit limit enforced
- `local_customer` – Browse catalog, shopping cart, view own orders

## Key Features
- **Books**: CRUD, search, filter by category, low stock alerts, buying_price tracking
- **Customers**: CRUD, assigned to salesmen, credit limits
- **Orders**: Create with line items, auto-calculate totals, stock deduction, percentage discounts
- **Payments**: Record payments against customers/orders
- **Stock Receipts**: Track inventory received from publishers, auto-update stock
- **Reports**: Sales by month, top books, top customers, outstanding balances, salesman performance
- **CSV Import/Export**: Bulk import/export books and customers, download templates
- **User Management**: Role assignment, activation/deactivation
- **Shopping Cart**: Add books, adjust quantities, checkout with auto-discount application
- **Discount Rules**: Admin-configurable percentage discounts with min order thresholds and date ranges
- **Customer Storefront**: Separate layout for customers with book catalog, cart, and order history

## Role-Based Routing
- Admin/Salesman users: `/` redirects to Dashboard with admin sidebar layout (AppShell)
- Customer users: `/` redirects to `/store` with customer top-navbar layout (CustomerLayout)
- Store routes: `/store`, `/store/cart`, `/store/orders`, `/store/payments`
- Admin routes: `/dashboard`, `/books`, `/customers`, `/orders`, `/payments`, `/stock`, `/reports`, `/csv`, `/discounts`, `/users`

## Recent Changes (Feb 2026)
- Added shopping_cart and discount_rules tables
- Added buying_price to books, discount_percentage to orders
- Built customer storefront with catalog, cart, and checkout
- Implemented percentage-based discount rules with auto-application at checkout
- Added role-based route guards (RequireRole component)
- Created CustomerLayout for customer-facing pages
- Added cart API (CRUD + checkout with credit limit validation for fixed customers)
- Added discount rules API (CRUD, admin only)
- Updated OrdersListResponse to include subtotal, discount, discountPercentage, tax fields

## Database Tables
users, customers, books, orders, order_items, payments, fixed_customer_users, stock_receipts, stock_receipt_items, shopping_cart, discount_rules
