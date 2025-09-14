
# Technical Plan: Phase 1 - The Foundation

## 1. 🏛️ Infrastructure & Project Setup

### Vercel (Frontend)
- **Framework**: Next.js with TypeScript.
- **Initialization**: `npx create-next-app@latest --typescript`
- **Repository**: Create a new GitHub repository and link it to a new Vercel project for continuous deployment.
- **Environment Variables**:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project `anon` key.
    - `NEXT_PUBLIC_API_URL`: The URL of your Render backend service (e.g., `https://your-app.onrender.com`).
    - `NEXTAUTH_SECRET`: A secret key for NextAuth session encryption, generated via `openssl rand -hex 32`.

### Render (Backend)
- **Framework**: Python with FastAPI.
- **Setup**: Initialize a Python project with a virtual environment (`python -m venv venv`).
- **Dependencies (`requirements.txt`)**:
    - `fastapi`: The web framework.
    - `uvicorn[standard]`: The ASGI server to run the app.
    - `supabase-py`: The official Python client for Supabase.
    - `python-dotenv`: For managing environment variables locally.
- **Hosting**:
    - Create a new "Web Service" on Render, linked to the backend's code directory.
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
    - `SUPABASE_URL`: Your Supabase project URL.
    - `SUPABASE_KEY`: Your Supabase project `service_role` key (this key bypasses RLS, essential for admin tasks).

### Supabase (Database & Auth)
- **Project Setup**: Create a new project on the Supabase dashboard.
- **Authentication**:
    - Navigate to **Authentication > Providers** and enable the **Google** provider.
    - You will need to create OAuth 2.0 credentials in the Google Cloud Console and add the **Client ID** and **Client Secret** to the Supabase settings.
    - In Google Cloud, add Supabase's authorized redirect URI: `https://<YOUR_PROJECT_ID>.supabase.co/auth/v1/callback`.
- **Database**: Use the built-in SQL Editor to execute the schema defined in the next section.

---

## 2. 🧱 Database Schema (Supabase SQL)

This SQL script should be run in the Supabase SQL Editor to create our application's tables.

-- Create an enumerated type for user roles for data consistency.
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 1. USERS Table
-- Stores public-facing profile information for users.
-- Mirrors the private auth.users table.
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user'
);

-- 2. TEAMS Table
-- Defines the teams in the application.
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- 3. TEAM_MEMBERSHIPS Table
-- A "join table" that maps users to teams, defining who is on which team.
CREATE TABLE team_memberships (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (team_id, user_id) -- Ensures a user can't be on the same team twice.
);

-- Function to automatically create a public user profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new user is created in the auth schema.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


3. ⚙️ API Endpoint Design (Render - Python/FastAPI)
All endpoints will require a valid Supabase JWT for authentication.
/users/sync (POST)
 * Purpose: Syncs auth data with our public users table on first login.
 * Logic: While the trigger handles creation, this endpoint can be used to ensure the profile is consistent or to sync updated metadata if needed. The frontend calls this after a successful login.
 * Returns: The user's full profile from the users table, including their role.
/teams (GET)
 * Purpose: Fetches all teams the current authenticated user belongs to.
 * Logic:
   * Extract user_id from the JWT.
   * Query team_memberships for all team_ids associated with the user_id.
   * Join with the teams table to get full team details.
 * Returns: 200 OK with [{"id": "...", "name": "..."}, ...].
/admin/users (GET)
 * Purpose: (Admin Only) Fetches all users in the system.
 * Protection: Requires a middleware that checks if the JWT's user role is admin.
 * Logic: Performs a SELECT * FROM users. Can be augmented to join with team_memberships to show team status.
 * Returns: 200 OK with [{"id": "...", "email": "...", "role": "..."}, ...].
/admin/teams (POST)
 * Purpose: (Admin Only) Creates a new team.
 * Protection: Admin-only middleware.
 * Request Body: { "name": "Project Phoenix" }
 * Logic: Inserts a new row into the teams table.
 * Returns: 201 Created with the new team object.
/admin/teams/{team_id}/members (POST)
 * Purpose: (Admin Only) Assigns a user to a team.
 * Protection: Admin-only middleware.
 * Request Body: { "user_id": "user-uuid-to-add" }
 * Logic: Inserts a new row into the team_memberships table.
 * Returns: 200 OK with { "message": "User added to team successfully." }.
4. 🎨 Frontend Implementation (Vercel - Next.js)
Authentication & State Management
 * Library: Use @supabase/auth-helpers-nextjs for seamless Supabase integration.
 * Login Flow:
   * A single "Login with Google" button triggers supabase.auth.signInWithOAuth({ provider: 'google' }).
   * Create a /auth/callback route for the redirect.
   * Use a client-side hook (useEffect) in the main layout to listen for auth state changes (onAuthStateChange).
   * On SIGNED_IN event, call the backend /users/sync endpoint.
 * Session Management: Wrap the root _app.tsx component with Supabase's <SessionContextProvider>.
UI Components & Pages
 * /login: The public-facing login page. Redirects to the dashboard if a user is already authenticated.
 * / (Dashboard):
   * Protected route; redirects to /login if no user session exists.
   * Fetches user's teams from the backend /teams endpoint.
   * Conditional Rendering:
     * If teams.length === 0, display the "Lobby / Waiting for Assignment" UI.
     * If teams.length > 0, display a list of teams.
 * /admin:
   * Protected route that also checks if user.role === 'admin'. Redirects to / if the user is not an admin.
   * Fetches data from /admin/users and /admin/teams.
   * Provides UI forms and buttons to perform admin actions (create teams, assign users).
<!-- end list -->

