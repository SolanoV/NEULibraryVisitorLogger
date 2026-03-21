# NEU Library Visitor Logger

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

NEU Library Visitor Logger is a comprehensive, role-based visitor logging and management system built for the NEU Library. It streamlines the check-in process for students and staff while providing library administrators with a powerful, real-time dashboard to monitor traffic, analyze visit trends, and manage facility access.

🌐 **Live Demo:** [NEU Library Visitor Logger](https://neu-library-visitor-logger.vercel.app/)

## ✨ Key Features

- **Strict Role-Based Access Control (RBAC):** Secure, tailored experiences across four distinct tiers: Students, Staff (Observers), Administrators, and Superadmins.
- **Self-Service Check-in Portal:** A seamless, responsive setup wizard for first-time users and a one-click check-in system for returning visitors.
- **Real-Time Admin Dashboard:** View live entry logs with advanced filtering (by date, category, and search terms) and high-performance client-side pagination.
- **Analytics & Statistics:** Automated charts displaying traffic trends and reason frequencies using Recharts.
- **Access Moderation:** Administrators can instantly block or unblock users from accessing the facility, tracked via an immutable audit log.
- **Dynamic Profile Management:** Universal profile pages that adapt based on the viewer's role. Admins can edit student information inline, and Superadmins can seamlessly promote staff to administrative roles.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Authentication:** Supabase (PostgreSQL, Google OAuth)
- **Data Visualization:** Recharts

## 📖 How to Use

The application dynamically changes its interface based on the user's assigned role.

### For Students

1. Log in securely using your Google account.
2. On your first visit, complete your profile by providing your Full Name, School ID, and Department.
3. Select your reason(s) for visiting from the grid and click **Check In**.
4. Subsequent visits bypass the setup wizard for a seamless, one-click check-in experience.

### For Faculty / Staff (Observer Mode)

_Staff accounts must be pre-authorized by an Administrator via Supabase invites._

1. Log in to access the Dashboard.
2. Use the **Mode Toggle** at the top of the screen to switch between **Log a Visit** (to record your own entry) and **View Library Logs**.
3. In Log View, you can see real-time student entry logs, user profiles, and library statistics without having modification or blocking rights.

### For Administrators

1. Access the comprehensive **Admin Dashboard** upon login.
2. Monitor real-time traffic, filter entry logs, and view detailed user profiles.
3. **Manage Access:** Click "Block Access" on a user's profile to instantly prevent them from logging future visits.
4. **Edit Profiles:** Open a user's profile and click "Edit Profile Information" to fix typos in names, update Student IDs, or change departments. All actions are securely logged in the Administrative Actions audit trail.

### For Superadmins

1. The Superadmin inherits all Administrator features, plus exclusive system control.
2. **Promote Users:** Edit a Staff member's profile to reveal the hidden "System Role" dropdown. Use this to promote Staff members to "Administrator".
3. **Transfer Power:** The system operates on a strict single-Superadmin rule. You can transfer your Superadmin rights to another Administrator, which will automatically demote your account to a standard Admin to maintain hierarchy security.

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine and a [Supabase](https://supabase.com/) project set up.

### 1. Clone the repository

```bash
git clone [https://github.com/yourusername/neu-library-visitor-logger.git](https://github.com/yourusername/neu-library-visitor-logger.git)
cd neu-library-visitor-logger
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

- `profiles`: Stores user metadata, user types (`student` | `staff`), roles (`user` | `admin` | `superadmin`), and `avatar_url`.
- `visits`: Logs individual check-in events with timestamps and reasons.
- `admin_logs`: Tracks all administrative actions.

**Crucial Row Level Security (RLS) Policies Required:**

```sql
-- Allow Staff & Admins to read all profiles (via Security Definer Function to prevent recursion)
CREATE OR REPLACE FUNCTION get_user_type() RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT user_type FROM profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING ( get_user_type() = 'staff' );

-- Allow Admins to update profiles (for blocking users & editing info)
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin' OR role = 'superadmin')
);

-- Allow Admins to insert their own audit logs
CREATE POLICY "Admins can insert their own logs" ON admin_logs FOR INSERT WITH CHECK (auth.uid() = admin_id);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.
