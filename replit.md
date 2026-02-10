# Pyramid Books — Distribution Management System

## Overview
A full-stack book distribution management system built with Node.js/Express, PostgreSQL, and Bootstrap. Features role-based access control, stock management, CSV import/export, and reporting.

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
  App.tsx           – Root component with routes
  index.css         – Theme variables, glassmorphic styles, Bootstrap harmony
  components/
    AppShell.tsx     – Layout with sidebar + topbar navigation
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
  hooks/
    use-me.ts, use-books.ts, use-customers.ts, use-orders.ts,
    use-payments.ts, use-users.ts, use-dashboard.ts,
    use-stock-receipts.ts, use-reports.ts
```

## Roles
- `super_admin` – Full access, user management, CSV import/export
- `salesman` – Manage assigned customers, create orders/payments, stock receipts, reports
- `fixed_customer` – View own orders and payments
- `local_customer` – Limited access

## Key Features
- **Books**: CRUD, search, filter by category, low stock alerts
- **Customers**: CRUD, assigned to salesmen, credit limits
- **Orders**: Create with line items, auto-calculate totals, stock deduction
- **Payments**: Record payments against customers/orders
- **Stock Receipts**: Track inventory received from publishers, auto-update stock
- **Reports**: Sales by month, top books, top customers, outstanding balances, salesman performance
- **CSV Import/Export**: Bulk import/export books and customers, download templates
- **User Management**: Role assignment, activation/deactivation

## Recent Changes (Feb 2026)
- Updated color scheme to professional blue (#2C3E50/#3498DB)
- Added stock_receipts and stock_receipt_items tables
- Added stock receipt management (create, list, auto-update inventory)
- Added CSV import/export for books/customers with templates
- Added reporting system with date filters and CSV export
- Added navigation items for Stock, Reports, Import/Export
- Enhanced glassmorphic design with improved shadows and gradients

## Database Tables
users, customers, books, orders, order_items, payments, fixed_customer_users, stock_receipts, stock_receipt_items
