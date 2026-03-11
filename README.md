# NEU Library Visitor Logger

NEU Library Visitor Logger is a comprehensive, role-based visitor logging and management system built for the NEU Library. It streamlines the check-in process for students and staff while providing library administrators with a powerful, real-time dashboard to monitor traffic, analyze visit trends, and manage facility access.

## ✨ Key Features

- **Role-Based Access Control:** Secure, tailored experiences for Students, Staff Members, Administrators, and Superadmins.
- **Self-Service Check-in Portal:** A seamless, responsive setup wizard for first-time users and a one-click check-in system for returning visitors.
- **Real-Time Admin Dashboard:** View live entry logs with advanced filtering (by date, category, and search terms) and high-performance client-side pagination.
- **Analytics & Statistics:** Automated charts displaying traffic trends and reason frequencies using Recharts.
- **Access Moderation:** Administrators can instantly block or unblock users from accessing the facility, tracked via an immutable audit log.
- **Dynamic Profile System:** Universal profile pages that adapt based on the viewer's role, displaying personal visit history for students or administrative actions for staff.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Authentication:** Supabase (PostgreSQL, Google OAuth)
- **Data Visualization:** Recharts

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine and a [Supabase](https://supabase.com/) project set up.

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/neu-library-visitor-logger.git
cd hope-library-logger
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of your project and add your Supabase connection details:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)

Ensure your Supabase PostgreSQL database has the following core tables configured:

- `profiles`: Stores user metadata, roles, and `avatar_url`.
- `visits`: Logs individual check-in events with timestamps and reasons.
- `admin_logs`: Tracks all administrative actions (e.g., blocking/unblocking users).

**Crucial Row Level Security (RLS) Policies Required:**

```sql
-- Allow Admins to update profiles (for blocking users)
create policy "Admins can update profiles" on profiles for update using (
auth.uid() in (select id from profiles where role = 'admin' or role = 'superadmin')
);

-- Allow Admins to insert their own audit logs
create policy "Admins can insert their own logs" on admin_logs for insert with check (auth.uid() = admin_id);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## 📂 Project Structure Overview

- `app/profile/[id]/page.tsx` - Dynamic routing for universal user profiles.
- `components/UserDashboard.tsx` - The primary check-in interface and role-selection wizard.
- `components/AdminDashboard.tsx` - The central hub for monitoring logs, rendering analytics, and managing access.
- `components/ProfileClient.tsx` - Handles the rendering logic for personal visit histories vs. admin audit trails.

## 🔒 Future Roadmap

- **Superadmin Staff Management Module:** An upcoming UI to securely elevate user roles from Student/Staff to Administrator directly within the dashboard.
