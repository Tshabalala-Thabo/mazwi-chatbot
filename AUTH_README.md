# ProSuite GRC Authentication System

## Overview
A complete authentication system for the ProSuite GRC (Governance, Risk & Compliance) platform built with Next.js 16, TypeScript, and SQLite.

## Features

### ✅ Authentication
- **Login System**: Secure login with email and password
- **Session Management**: Cookie-based sessions with 7-day expiration
- **Protected Routes**: Middleware-based route protection
- **Auto-redirect**: Automatic redirects based on authentication state

### ✅ Dashboard
- **Overview Statistics**: Real-time stats for all GRC modules
  - Total Risks
  - Total Assets
  - Total Incidents
  - Active Audits
  - Compliance Packages
  - Active Policies
- **Recent Risks**: Display of latest risk assessments with inherent and residual scores
- **Color-coded Risk Levels**: Visual indicators for Critical, High, Medium, and Low risks

### ✅ Sidebar Navigation
- **Dynamic Module Loading**: Automatically loads enabled modules from database
- **Module Icons**: Custom icons for each GRC module
  - Risk Management (Shield)
  - Asset Management (Package)
  - Compliance (FileCheck)
  - Governance (Scale)
  - Incident Management (AlertTriangle)
  - Audit Management (FileSearch)
  - Performance Management (TrendingUp)
- **Responsive Design**: Mobile-friendly with hamburger menu
- **Tenant Information**: Displays organization details
- **Logout Functionality**: Secure session termination

## Design System

### Primary Color
- **#036DAD** - Used throughout the UI for:
  - Buttons and CTAs
  - Active navigation items
  - Branding elements
  - Focus states

### Color Palette
- Primary: `#036DAD`
- Primary Hover: `#025a8f`
- Primary Dark: `#024d7a`

## Demo Credentials

### Users from Database
Any user from the `users` table can log in. Examples:
- **Email**: `sysadmin@acme-fs.demo`
- **Email**: `john.risk@acme-fs.demo`
- **Email**: `sarah.compliance@acme-fs.demo`
- **Email**: `mike.auditor@acme-fs.demo`
- **Email**: `lisa.assets@acme-fs.demo`

### Password
- `password` or `demo123` (works for all users)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Authentication**: Custom cookie-based sessions

## File Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # Login endpoint
│   │   │   ├── logout/route.ts      # Logout endpoint
│   │   │   └── session/route.ts     # Session check endpoint
│   │   ├── dashboard/route.ts       # Dashboard data endpoint
│   │   └── modules/route.ts         # Modules list endpoint
│   ├── dashboard/
│   │   ├── layout.tsx               # Protected layout with sidebar
│   │   └── page.tsx                 # Dashboard page
│   ├── login/
│   │   └── page.tsx                 # Login page
│   └── page.tsx                     # Root redirect to login
├── components/
│   └── Sidebar.tsx                  # Navigation sidebar component
├── lib/
│   ├── auth.ts                      # Authentication utilities
│   ├── db.ts                        # Database connection
│   └── session.ts                   # Session management
├── middleware.ts                    # Route protection middleware
└── database.sqlite                  # SQLite database
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/session` - Check current session

### Data
- `GET /api/modules` - Get enabled modules
- `GET /api/dashboard` - Get dashboard statistics and data

## Running the Application

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Import Data to Database** (if not already done)
   ```bash
   node import-json-to-sqlite.js
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open browser to `http://localhost:3000`
   - You'll be redirected to `/login`
   - Use any demo credentials above

## Security Notes

⚠️ **For Demo Purposes Only**
- Passwords are not hashed (accepts hardcoded passwords)
- No rate limiting on login attempts
- Sessions stored in cookies without encryption
- For production, implement:
  - Proper password hashing (bcrypt)
  - Rate limiting
  - CSRF protection
  - Encrypted session tokens
  - Environment-based secrets

## Database Schema

The system reads from the following tables:
- `users` - User accounts
- `tenants` - Organization information
- `modules` - GRC modules
- `risks` - Risk assessments
- `assets` - Asset inventory
- `incidents` - Incident records
- `audit_engagements` - Audit activities
- `compliance_packages` - Compliance frameworks
- `governance_policies` - Policy documents

## Customization

### Changing Primary Color
Update all instances of `#036DAD` in:
- `app/login/page.tsx`
- `components/Sidebar.tsx`
- `app/dashboard/page.tsx`

### Adding New Modules
Modules are automatically loaded from the database. To add a new module:
1. Add entry to `modules` table
2. Add corresponding icon to `moduleIcons` object in `Sidebar.tsx`
3. Create route at `/dashboard/[module-slug]`

## License
ISC
