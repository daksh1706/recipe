# CRFTD Point of Sale (POS) & Coffee Shop Management Suite

A modern, production-ready, glassmorphic Point of Sale (POS) and inventory control system built with the MERN stack and Supabase. Crafted with rich warm coffee-themed aesthetics, detailed responsive transitions, and robust multi-tenant data isolation.

---

## ☕ Core Features

### 🛒 Point of Sale & Kitchen Workflow
- **Kinetic Hearth Theme POS**: Premium dark/glassmorphic responsive POS layout. Quickly search items, filter by category, and update orders instantly.
- **Steaming Kitchen Display System**: Live real-time kitchen tracking tickets with dynamic status transitions (*"Preparing"*, *"Ready"*, *"Served"*).
- **80mm Receipt Generator**: High-fidelity thermal-style PDF receipts available for download or immediate WhatsApp sharing.

### 📦 Artisan Recipe & Inventory Engine
- **Automated Recipe Depletion**: Link menu items to raw material inventory ingredients. Selling an item automatically deducts stock in real time.
- **Low-Stock Alert thresholds**: Set alert thresholds to receive notification warnings when materials drop below safety levels.
- **Enhanced Form Layout**: Expiry Date and Minimum Safety Stock Level sit side-by-side in custom equal-width grid alignments. Includes beautiful micro-interacting submit actions.

### 🏢 6-Digit Multi-Tenant Workspace Sharing
- **100% Data Isolation**: All administrative modules (Orders, Menu, Inventory, Roster, Ledger) are partitioned and protected by workspace boundaries.
- **6-Digit Invite Obfuscation**: Deterministic symmetric encryption (`aes-256-cbc`) hides code values in the database, while remaining visible and manageable by workspace owners and administrators.
- **Admin Workspace Auto-Creation**: Administrators are instantly assigned a default, auto-created workspace upon signup. They bypass onboarding forms and go straight to the dashboard to begin inviting their team.
- **Automatic Workspace Gating**: Cashiers, Baristas, and Managers are required to enter a valid 6-digit code to join an active workspace session before using the POS.
- **Brute Force Defense**: Rate-limiting blocks workspace joining for client IPs following $\ge 5$ failed attempts per hour.
- **Administrative Access Controls**: Administrators can view, copy, regenerate, and share invitation codes via WhatsApp, view workspace members, and revoke staff access at will.

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), React Router DOM, Recharts (Sales Trends), jsPDF & html2canvas, Lucide React (Icons), QRCode.react
- **Backend**: Node.js, Express.js, JWT, Bcrypt.js, Crypto (obfuscation)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

---

## 🔑 Pre-Configured Demo Accounts

Use these pre-approved demo accounts to explore different user permission tiers. 

| Full Name | Role | Email Address | Phone Number | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Demo Test Account** | Administrator (Full access) | `test@gmail.com` | `9999999999` | `password123` |
| **Jane Manager** | Manager | `manager@coffee.com` | `9876543211` | `password123` |
| **Bob Barista** | Barista | `barista@coffee.com` | `9876543212` | `password123` |
| **Charlie Cashier** | Cashier | `cashier@coffee.com` | `9876543213` | `password123` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase account and database project

### Installation & Launch

1. **Clone the Repository**
   ```bash
   git clone https://github.com/daksh1706/recipe.git
   cd recipe
   ```

2. **Configure Backend Environment**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file inside `backend/`:
   ```env
   PORT=5001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_signature_secret
   ```

3. **Configure Frontend Environment**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file inside `frontend/`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_publishable_key
   ```

4. **Prepare Database Tables**
   - Execute [supabase_schema.sql](file:///Users/daksh/Desktop/antigravity/supabase_schema.sql) in your Supabase SQL Editor.
   - Apply [workspace_sharing_system.sql](file:///Users/daksh/Desktop/antigravity/workspace_sharing_system.sql) in the SQL Editor to build multi-tenant tables, backfill default workspaces, and configure Row Level Security (RLS) policies.
   - Run the custom seeding scripts inside the `backend/` directory if you wish to pre-load materials and menu categories:
     ```bash
     node setup_db.js
     ```

5. **Start Dev Servers**
   - **Launch Backend**: Inside `backend/` run `npm run dev` (starts on port `5001`).
   - **Launch Frontend**: Inside `frontend/` run `npm run dev` (starts the Vite hot-reloading server).

---

## 📜 License
Proprietary / Closed Source
