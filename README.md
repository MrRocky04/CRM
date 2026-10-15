# WooCommerce CRM

A full-stack, enterprise-grade Customer Relationship Management (CRM) platform designed specifically for WooCommerce merchants. The system centralizes customer intelligence, synchronized commerce orders, customer notes, follow-up reminders, reviewed transactional email communications via Resend, automated retention workflows, and an evidence-grounded CRM Action Agent.

Built on **React + Vite + Tailwind CSS** with the approved brand palette (`#111844`, `#4B5694`, `#F2F2F2`) on the frontend, and a **Node.js / Express / Prisma ORM** backend accessing **Supabase Database (managed PostgreSQL)**.

---

## 1. Architecture & Technology Stack

```text
CRM Authenticated User
          |
          v
  React + Vite Frontend (Tailwind CSS + shadcn/ui + Recharts)
  Brand Palette: #111844 (Dark Navy), #4B5694 (Indigo Accent), #F2F2F2 (Surface)
          |
          +-----------------------------------------+
          | (REST API + Sessions + CSRF Token)      |
          v                                         v
Express.js REST API                        Signed Inbound Webhooks
  - Zod Request Validation                   - WooCommerce (HMAC SHA-256)
  - Role-Based Authorization                 - Resend Delivery Events
  - Centralized Error Handling               - Idempotency Deduplication
          |                                         |
          +--------------------+--------------------+
                               |
                               v
                       Domain Services Layer
  - Customer Service (Identity linking, metric calculation)
  - Order Service (Read-only commerce authority)
  - Retention & Segmentation Engine (New, Repeat, Loyal, Inactive)
  - Follow-up Task & Notes Manager
  - Email Service (Placeholder validation {{name}}, {{email}})
  - Workflow Automation Engine (Idempotent runner, duplicate locks)
  - Deterministic CRM Action Agent (Evidence grounding, facts vs inferences)
                               |
                               v
                         Prisma ORM
                               |
                               v
               Supabase Database (Managed PostgreSQL)
```

---

## 2. Key Modules & Capabilities

- **Customer Data Management:** Searchable, filterable customer list with segmentation badges (`New`, `Repeat`, `Loyal`, `Inactive`), profile cards, CRM contact creation, customer notes, and WooCommerce identity protection.
- **WooCommerce Order Tracking:** Synchronized read-only order history with line items, billing/shipping details, status tracking, and customer associations.
- **Customer Segmentation:** Automated lifecycle segmentation with explicit documented precedence:
  1. `Inactive`: 60+ days without an order.
  2. `Loyal`: 5+ orders or $500+ spend.
  3. `Repeat`: 2-4 orders.
  4. `New`: 0-1 order, recent.
- **Follow-up Tasks:** Scheduling and tracking customer check-ins with priority badges, overdue indicators, and customer linking.
- **Transactional Communications:** Template management with strict placeholder validation (`{{name}}` and `{{email}}`), live rendered preview, and explicit two-step approval sending via Resend.
- **Workflow Automation:** Configurable rules (`INACTIVE_CUSTOMER`, `NEW_ORDER`, etc.) with action dispatchers (`CREATE_TASK`, `DRAFT_EMAIL`) and persistent run history with duplicate action prevention.
- **Retention & Cohort Analytics:** Interactive Recharts area chart (sales & volume over time) and bar chart (segment distribution) responding to time-range selection (`30d`, `90d`, `1y`, `all`).
- **CRM Action Agent:** Evidence-grounded recommendation engine that cites recorded store/customer facts, separates facts from rule-based inferences, and provides one-click prefilled task and draft email actions.

---

## 3. Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on Node `v25.9.0`)
- **npm**: `v9.0.0` or higher (verified on npm `11.12.1`)
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 4. Quick Start & Local Setup

### Step 1: Install Dependencies
Run the installation command from the repository root:
```bash
npm run install:all
```
*(Or install in subfolders: `npm install && npm --prefix server install && npm --prefix client install`)*

### Step 2: Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
cp .env.example server/.env
```

### Step 3: Database Setup & Demo Seeding
The project comes pre-configured with a zero-config SQLite mode for immediate local testing, and is 100% prepared for Supabase PostgreSQL in production.

Run database migrations and seed realistic demo records:
```bash
npm run prisma:migrate
npm run prisma:seed
```

### Step 4: Provision the First Administrator
Create the initial administrator account (reads from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`):
```bash
npm run admin:provision
```
**Default Credentials:**
- **Email:** `admin@crm.local`
- **Password:** `AdminPassword123!`

### Step 5: Start Development Servers
Start both backend (port 5000) and frontend (port 5173) concurrently:
```bash
npm run dev
```

Open your browser to: **`http://localhost:5173`** and sign in.

---

## 5. Supabase Database (Managed PostgreSQL) Setup

When deploying to Supabase:

1. Create a project in the [Supabase Dashboard](https://supabase.com).
2. Go to **Project Settings &gt; Database &gt; Connection string**:
   - Copy the **Pooled Connection string (Transaction mode, port 6543)** and set it as `DATABASE_URL` in `.env`.
   - Copy the **Direct Connection string (Session mode, port 5432)** and set it as `DIRECT_URL` in `.env`.
3. Switch the Prisma schema provider to Supabase PostgreSQL:
   ```bash
   npm run db:switch:supabase
   ```
4. Push the schema to your Supabase PostgreSQL instance:
   ```bash
   npm run prisma:migrate
   ```
5. Seed the initial CRM datasets into Supabase:
   ```bash
   npm run prisma:seed
   ```
6. To switch back to local mode at any time:
   ```bash
   npm run db:switch:local
   ```

---

## 6. WooCommerce Integration

### REST API v3 Synchronization
Set your store credentials in `.env`:
```dotenv
WOOCOMMERCE_STORE_URL="https://yourstore.com"
WOOCOMMERCE_CONSUMER_KEY="ck_your_consumer_key"
WOOCOMMERCE_CONSUMER_SECRET="cs_your_consumer_secret"
```
In the CRM interface, navigate to **Integrations & Sync** and click **Trigger Manual Sync Now** to pull customers and orders.

### Inbound Webhook Configuration
In your WordPress Admin, go to **WooCommerce &gt; Settings &gt; Advanced &gt; Webhooks**:
- **Topic:** `Customer created`, `Customer updated`, `Order created`, `Order updated`.
- **Delivery URL:** `https://your-crm-domain.com/api/webhooks/woocommerce`
- **Secret:** Set to match `WOOCOMMERCE_WEBHOOK_SECRET` in your `.env`.
- **API Version:** WP REST API Integration v3.

Inbound webhooks are cryptographically validated against the raw body using HMAC SHA-256 (`x-wc-webhook-signature`).

---

## 7. Transactional Email (Resend)

Configure your Resend API credentials in `.env`:
```dotenv
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="Your Brand <crm@yourstore.com>"
RESEND_WEBHOOK_SECRET="whsec_your_resend_signing_secret"
```
In the Resend Dashboard, configure the webhook endpoint:
- **Webhook URL:** `https://your-crm-domain.com/api/webhooks/resend`
- **Events:** `email.delivered`, `email.bounced`, `email.complained`.

---

## 8. Verification & Automated Tests

Run the backend test suite:
```bash
npm test
```
The automated test suite verifies:
1. Session authentication, password hashing, and logout invalidation.
2. Customer segmentation rules and precedence (`Inactive` > `Loyal` > `Repeat` > `New`).
3. Template placeholder validation (permits `{{name}}` and `{{email}}`, rejects unsupported tags).
4. Read-only order query boundaries.
5. HMAC SHA-256 webhook signature verification with timing-safe checks.
6. Action Agent evidence citation and bounded capability declaration.
7. Workflow engine idempotency and duplicate run prevention.

To run end-to-end integration tests against the live server:
```bash
node --test server/test/e2e.test.js
```

To build production bundles:
```bash
npm run build
```

---

## 9. Project Directory Structure

```text
woocomerce/
├── package.json                   # Root orchestration scripts
├── .env.example                   # Environment configuration template
├── TRACEABILITY_MATRIX.md         # Full requirements traceability matrix
├── README.md                      # Complete setup & operations manual
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js               # Express server entry point & scheduler
│   │   ├── config/                # Thresholds, segment rules, constants
│   │   ├── db/                    # Prisma client singleton
│   │   ├── middleware/            # Auth, CSRF, validation, error handler
│   │   ├── controllers/           # REST endpoint controllers
│   │   ├── services/              # Domain logic (sync, segment, agent, email)
│   │   ├── validators/            # Zod validation schemas
│   │   └── routes/                # Modular Express routers
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma schema (SQLite dev mode)
│   │   ├── schema.postgresql.prisma # Prisma schema (Supabase PostgreSQL)
│   │   └── seed.js                # Realistic seed script across all segments
│   ├── scripts/
│   │   ├── provision-admin.js     # CLI admin provisioning tool
│   │   └── switch-db.js           # Database engine switcher script
│   └── test/
│       ├── crm.test.js            # Automated unit and domain test suite
│       └── e2e.test.js            # End-to-end live integration test suite
└── client/
    ├── package.json
    ├── vite.config.js             # Vite config with backend API proxy
    ├── tailwind.config.js         # Brand theme tokens (#111844, #4B5694, #F2F2F2)
    ├── index.html                 # HTML entry point with Inter font
    └── src/
        ├── index.css              # Tailwind base & custom utility tokens
        ├── main.jsx               # React DOM entry
        ├── App.jsx                # Router & protected route definitions
        ├── lib/
        │   ├── api.js             # API client with CSRF token management
        │   └── utils.js           # Currency, date, and badge formatting helpers
        ├── context/
        │   └── AuthContext.jsx    # Session auth context provider
        ├── components/
        │   ├── ui/                # Button, Input, Card, Badge, Dialog, Table, Tabs, Alert
        │   ├── layout/            # Sidebar, TopNav, AppLayout, ProtectedRoute
        │   └── common/            # StatCard, EmptyState
        └── pages/
            ├── Login.jsx          # Sign-in with quick-fill demo buttons
            ├── Dashboard.jsx      # Executive KPI overview & segments
            ├── Customers.jsx      # Customer table, search, and CRM creation
            ├── CustomerDetail.jsx # Customer profile with orders, notes, tasks, agent
            ├── Orders.jsx         # Read-only order tracking and detail modal
            ├── Tasks.jsx          # Follow-up task manager with overdue alerts
            ├── Communications.jsx # Two-step approved email dispatch & timeline
            ├── Templates.jsx      # Email template CRUD with placeholder validator
            ├── Workflows.jsx      # Automation engine with execution history
            ├── RetentionAnalytics.jsx # Recharts trends & customer segment balance
            ├── ActionAgent.jsx    # Deterministic evidence-grounded recommendations
            └── IntegrationSettings.jsx # WooCommerce sync, webhooks, & Supabase guide
```
