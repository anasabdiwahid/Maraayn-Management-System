# Maraayn Management System
> **Ganacsigaaga, Hal Meel.**

Maraayn is a modern, secure, responsive, multi-tenant SaaS application that allows multiple independent businesses to manage their inventory, sales, debts, customers, payments, expenses, receipts, and reports from one unified platform.

---

## 🎨 Brand Identity

- **Full System Name:** Maraayn Management System
- **Business Dashboard:** Maraayn Business
- **Brand Slogan:** Ganacsigaaga, Hal Meel
- **Primary Brand Colors:**
  - Navy Blue: `#142746`
  - Golden Amber: `#E6AE43`
  - White: `#FFFFFF`
  - Light Background: `#F5F7FB`
  - Success: `#16A34A`
  - Danger: `#DC2626`
- **Assets:**
  - Brand Logo: `assets/logo.png`
  - Brand Favicon: `assets/favicon.png`

---

## 🚀 Key Features

1. **Multi-Tenant Architecture:**
   - Complete data isolation scoped by `tenantId` on all database operations.
   - Server-side authorization derivation from JWT sessions.
   - Independent branding, logos, colors, currency, timezone, and receipt settings per business.

2. **One Central Login Page:**
   - Single login portal serving Super Admin, Admin, and Business Users.
   - Role-based automatic redirection to **Maraayn Control Center** (`/admin`) or **Maraayn Business** (`/business`).

3. **Super Admin & Admin Dashboard (Maraayn Control Center):**
   - Platform-wide statistics: total registered markets, active vs suspended, total storage used/allocated.
   - Interactive charts: monthly registration growth and business category distribution.
   - Market management: search, filter, suspend with reason, reactivate, adjust storage quota in GB.
   - Administrator management: create and toggle admin accounts (Super Admin only).
   - Administrative audit log history.

4. **Business Workspace (Maraayn Business):**
   - **Dashboard:** 10 core financial metrics (Revenue, Net Profit, Gross Profit, COGS, Outstanding Debt, Debt Repaid, Inventory Value, Customers, etc.) with period filtering ('today', '7days', 'month', 'year').
   - **Products & Inventory:** Product catalog with SKU/Barcode search, stock levels, low-stock warnings, and stock adjustment auditing.
   - **Customer Management:** Customer database with debt balances, purchase history, and one-click WhatsApp statement sharing.
   - **Point of Sale (New Sale):** Interactive POS cart, cash vs credit sales, instant branded thermal receipt modal, PDF download, and WhatsApp receipt share.
   - **Credit Sales & Debt Management:** Real credit ledger, tracking down payments, partial and full repayments, automatic status updates (`UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`), and celebration effects on debt clearance.
   - **Payment Ledger:** Complete record of cash payments and debt repayments with receipts.
   - **Expense Tracking:** Categorized operational costs included in Net Profit calculations.
   - **Reports:** Interactive reports for Sales, Inventory Valuation, Debts, and Expenses with CSV export and print layouts.
   - **Storage Metering & Quota Auto-Suspension:** Real byte-level storage metering with visual alerts at 80%, 90%, and auto-suspension at 100%.

---

## 🔑 Default Seeded Accounts

| Role | Email / Identifier | Password | Destination |
|---|---|---|---|
| **Super Admin** | `anasabdiwahidhussein@gmail.com` | `yDnSl700` | Maraayn Control Center (`/admin`) |
| **Admin** | `admin@maraayn.com` | `Admin@2026` | Maraayn Control Center (`/admin`) |
| **Business User (Supermarket)** | `albaraka@maraayn.com` | `Baraka@2026` | Maraayn Business (`/business`) |
| **Business User (Pharmacy)** | `shaafi@maraayn.com` | `Shaafi@2026` | Maraayn Business (`/business`) |

---

## 💻 Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router, Canvas Confetti.
- **Backend:** NestJS 12, Node.js 24, TypeScript, Passport JWT, bcryptjs, Class Validator, PDFKit.
- **Database:** MongoDB & Mongoose.

---

## 🛠️ Local Development & Running

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Start Backend Server
```bash
cd backend
npm install
npm run build
npm run start:prod
# API runs at http://localhost:4000/api/v1
```

### 2. Start Frontend Server
```bash
cd frontend
npm install
npm run dev
# Web application runs at http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
npm run test
```
