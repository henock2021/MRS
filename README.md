# 🌲 Nature Club Member Registration & Activity Management System

A full-stack, production-ready club management system built with **Next.js 16 (App Router, TypeScript)**, **Tailwind CSS**, **SQLite**, **Prisma ORM**, and **Auth.js (NextAuth v5)**.

Designed for nature clubs, outdoor conservation groups, hiking societies, and environmental organizations that organize trail hikes, tree planting campaigns, clean-up drives, bird watching walks, and wilderness camping trips.

---

## 🌟 Key Features

### 1. Public Member Registration
- **Comprehensive Application Form**: Collects full name, phone, email, residential address, date of birth, gender, occupation/school, membership tier, interests, emergency contact, and health/allergy notes.
- **Under-18 Guardian Consent**: Real-time age detection automatically prompts for guardian name, phone, and signed consent for minors under 18 years old.
- **Club Rules & Liability Waiver**: Required legal checkboxes acknowledging outdoor safety rules and environmental stewardship.
- **Duplicate Prevention**: Rejects duplicate email or phone registrations with friendly user guidance.
- **Sequential Member ID**: Automatically assigns unique club identifiers (e.g. `NC-000101`, `NC-000102`).
- **Confirmation Page**: Visual registration slip and step-by-step next steps for new applicants.

### 2. Admin & Staff Operations
- **Filterable & Searchable Directory**: Search members by name, email, phone, or code; filter by approval status, membership tier, and interest areas.
- **Member Lifecycle Management**: Approve pending applications, record admin rejection notes, edit member details, or deactivate members.
- **Membership Tier Management**: Configure membership tiers (Student, Adult, Family, Supporter) with custom fees and validity durations.
- **Payments & Expiry Tracking**: Log dues payments with payment method (Cash, Bank Transfer, Mobile Money), receipt notes, and auto-calculated expiration dates.
- **30-Day Renewal Alerts**: Visual warnings and dedicated filter tabs for members whose dues are expiring within 30 days or have expired.

### 3. Events, Outings & Attendance
- **Event Scheduling**: Create outings with titles, categories (hikes, tree planting, clean-ups, camping, workshops), meeting points, description, dates, capacity limits, and fees.
- **Capacity Management**: Real-time capacity meters prevent overbooking.
- **1-Click Attendance Checklists**: On-the-trail check-in for registered participants.
- **Trip Safety Sheet Export**: Export participant rosters with emergency contact numbers and allergies to CSV for leader trip safety.

### 4. Executive Dashboard & Data Export
- **Operational Metrics**: Total members, new registrations this month, pending approvals, expiring in 30 days, upcoming events, and monthly dues revenue.
- **Interests Distribution Chart**: Responsive visualization breaking down member participation across hiking, conservation, camping, bird watching, and photography.
- **Filtered CSV Export**: Export member records to CSV respecting active search and filter parameters.

### 5. Role-Based Access Control (RBAC)
- **Administrator**: Full system access, staff account management, entity deletion, and master CSV exports.
- **Staff / Volunteer Coordinator**: Can register/edit members, log payments, manage events, and track attendance. Barred from deletions, master CSV exports, and staff settings.
- **Member**: Access to the personal Member Portal only. Strictly barred from administrative routes on the server.

### 6. Self-Service Member Portal
- **Dashboard**: Personalized welcome card, active membership tier, validity countdown, and next scheduled outing highlight.
- **Profile Self-Service**: Update personal phone number, residential address, emergency contacts, and medical preferences with zero risk of editing other members' records.
- **Outings Browser & 1-Click RSVP**: Reserve spots in upcoming outings or release reservations if plans change.
- **Outing History**: Review past completed outings with verified attendance badges.
- **Dues Standing & Payment Receipts**: View active expiration date, days remaining, renewal instructions, and past payment receipts.

### 7. Security, Privacy & Recovery
- **Bcrypt Password Encryption**: All passwords hashed using bcrypt (12 salt rounds); plain-text passwords are never stored.
- **In-Memory Rate Limiting**: Progressive lockout protection against brute-force login attempts (15-minute lockout after 5 consecutive failures).
- **Server-Side Enforcement**: All permissions checked in Server Actions, API routes, and Server Components (not just hidden in the UI).
- **Password Reset Flow**: Cryptographically secure 64-character tokens with automatic 1-hour expiration.
- **Automated SQLite Point-in-Time Backup**: 1-command snapshot backups with automated rotation.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, React 19) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS (Earth & Green Theme) |
| **Database** | SQLite (`prisma/dev.db`) |
| **ORM** | Prisma ORM 6 |
| **Authentication** | Auth.js v5 (NextAuth Credentials Provider + JWT) |
| **Validation** | Zod (Client & Server Validation) |
| **Password Hashing** | bcryptjs |
| **Icons** | Lucide React |

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- **Node.js** v18.0.0 or later (v20+ or v24+ recommended)
- **npm** v9+ (included with Node.js)
- *No Docker or external database server required! SQLite is self-contained.*

### Step 1: Clone or Navigate to the Project
```bash
cd MRS
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the provided `.env.example` file to create your active `.env`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On macOS / Linux:
cp .env.example .env
```

Your `.env` file contains:
```env
# SQLite Database connection string
DATABASE_URL="file:./dev.db"

# NextAuth / Auth.js secret key
AUTH_SECRET="nature-club-super-secret-key-change-in-production-32chars"
NEXTAUTH_URL="http://localhost:3000"

# Initial Administrator account created by `npm run db:seed`
ADMIN_EMAIL="admin@natureclub.org"
ADMIN_PASSWORD="NatureAdmin2026!Secure"
ADMIN_NAME="Chief Club Warden"
```

### Step 4: Initialize the SQLite Database
Push the Prisma schema to create the local SQLite database file (`prisma/dev.db`):
```bash
npm run db:push
```

### Step 5: Seed the Initial Data & Accounts
Populate the database with membership tiers, sample outings, and pre-configured test accounts:
```bash
npm run db:seed
```

### Step 6: Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Configured Test Accounts

The seed script creates pre-configured accounts representing each system role:

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Administrator** | `admin@natureclub.org` | `NatureAdmin2026!Secure` | `/admin/*` (Full Access, Staff Team, Delete, Export) |
| **Staff / Coordinator** | `staff@natureclub.org` | `NatureStaff2026!Secure` | `/admin/*` (Operations only: Members, Outings, Dues) |
| **Approved Member** | `sarah.greenwood@example.com` | `MemberPass2026!Secure` | `/portal/*` (Member ID: `NC-000101`, Adult Tier) |
| **Pending Applicant** | `liam.chen@example.com` | *(Pending Review)* | Member ID: `NC-000102` (Student Minor, testing approval) |

---

## 🧪 Automated Testing

The project includes an automated test suite comprising **141 unit and integration tests** verifying security gates, validation, duplicate detection, and role boundaries:

```bash
# Run the complete test suite across all stages (141 tests)
npm test

# Run stage-specific test suites
npm run test:stage2   # Public registration validation, under-18 consent, ID generator
npm run test:stage3   # Password verification, rate limiting, status transitions
npm run test:stage4   # Expiry calculations, 30-day alerts, tier CRUD, payment logging
npm run test:stage5   # Event capacity, duplicate RSVP prevention, safety roster
npm run test:stage6   # Dashboard KPI aggregation, interest distribution, CSV export
npm run test:stage7   # Role gates (Admin vs Staff deletion and export restrictions)
npm run test:stage8   # Member portal isolation, RSVP, cancellation, profile self-service
npm run test:stage9   # Password reset token generation, single-use check, SQLite backup
```

---

## 📦 Database Backup & Restore

### Why SQLite is Simple & Safe to Backup
SQLite stores the entire relational database (tables, indexes, relations) inside a single file: `prisma/dev.db`. There is no separate database server process to configure.

### Creating a Point-in-Time Backup
Run the automated backup script:
```bash
npm run db:backup
```
**What this script does:**
1. Creates an atomic snapshot in the `backups/` directory with a timestamped filename (e.g. `backups/natureclub-backup-2026-10-16_14-31-53.db`).
2. Automatically copies active WAL (Write-Ahead Logging) and shared memory files if present.
3. Queries Prisma to verify database integrity and prints record counts.
4. Automatically retains the 10 most recent backups, cleaning up older snapshots to save disk space.

### Restoring from a Backup
To restore your database from a backup snapshot:
1. Stop the application server (`Ctrl + C`).
2. Copy your desired backup file over `prisma/dev.db`:
   ```bash
   # Windows PowerShell:
   Copy-Item "backups/natureclub-backup-YYYY-MM-DD_HH-mm-ss.db" "prisma/dev.db"

   # macOS / Linux:
   cp "backups/natureclub-backup-YYYY-MM-DD_HH-mm-ss.db" "prisma/dev.db"
   ```
3. Restart the server:
   ```bash
   npm run dev
   ```

---

## 🌐 Production Deployment Guide (Low-Cost / Free)

### Option 1: Render / Railway (Recommended for SQLite)
Since SQLite requires persistent file storage, platforms that offer persistent disk volumes are ideal:

1. Push your repository to GitHub.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service** connected to your repository.
3. Configure the build and start commands:
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:** `npm start`
4. Attach a **Persistent Disk** (e.g. mount path `/data` or keep `prisma/` persistent).
5. Set Environment Variables:
   - `DATABASE_URL="file:/data/dev.db"`
   - `AUTH_SECRET="<generate-random-32-character-secret>"`
   - `NEXTAUTH_URL="https://your-domain.onrender.com"`
   - `ADMIN_EMAIL="admin@yournatureclub.org"`
   - `ADMIN_PASSWORD="<YourSecurePassword>"`
   - `NODE_ENV="production"`
6. Run `npm run db:seed` once via the platform console to initialize the admin account and membership tiers.

### Option 2: Vercel + Turso (Serverless SQLite)
If deploying to Vercel's serverless edge:
1. Create a free distributed SQLite database at [Turso](https://turso.tech).
2. Update `prisma/schema.prisma` datasource provider or use the `@prisma/adapter-libsql` driver.
3. Point `DATABASE_URL` to your `libsql://your-db.turso.io` URL with your auth token.
4. Deploy to Vercel with one click.

---

## 🔒 Security & Privacy Best Practices Implemented

- **Password Hashing**: Bcrypt with 12 rounds of salt.
- **Brute-Force Rate Limiting**: Exponential cooldown after 5 consecutive failed attempts on any single account.
- **No Insecure Direct Object References (IDOR)**: Member queries and profile updates never accept a user ID from the client; all operations are strictly scoped to `session.user.id` on the server.
- **Sensitive Data Segregation**: Emergency contact details and confidential health/allergy notes are never exposed on public API endpoints or to unauthorized users.
- **Strict Role Boundaries**: Server-side guards (`requireAdmin()`, `requireStaffOrAdmin()`, and `requireMemberSession()`) check authorization before any database read or write occurs.
- **Safe File Uploads**: Photo uploads are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`), size-limited to 5MB, and renamed with unique cryptographic timestamps to prevent directory traversal.

---

## 📄 License
This project is open-source and free to use for nature clubs, conservation trusts, hiking communities, and environmental educators.
