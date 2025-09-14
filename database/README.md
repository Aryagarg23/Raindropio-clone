# Database

This folder documents the Supabase setup for Raindropio-clone.

- Uses Supabase cloud (no local Postgres).
- Bucket: `nis` with subfolders `avatars`, `bookmarks`, `attachments`.
- See `phase1.md` for keys and URLs.
- See `PROJECT_PLAN.md` for schema, migrations, and RLS policies.

## Migration Files

- `001_create_users_profile.sql` - Initial profiles table with RLS policies
- `002_fix_service_role_policies.sql` - Service role access policies  
- `003_create_teams_memberships.sql` - Teams and team memberships tables with RLS
- `004_promote_admin_user.sql` - Script to promote users to admin role

## Setup Instructions

1. **Run Migrations in Order**
	- Run each SQL file in Supabase SQL Editor in numerical order:
	- `001_create_users_profile.sql` - Creates profiles table and auth trigger
	- `002_fix_service_role_policies.sql` - Adds service role policies
	- `003_create_teams_memberships.sql` - Creates teams and memberships tables
	- `004_promote_admin_user.sql` - Promotes your user to admin (edit email first)

2. **Enable Storage Bucket**
	- Create a bucket named `nis` in Supabase Storage.
	- Add subfolders: `avatars`, `bookmarks`, `attachments`.
	- Restrict uploads to PNG/JPG for avatars.

3. **RLS Policies**
	- RLS is enabled for `users`.
	- Users can read/update their own profile; admins can read/update all.

4. **Profile Completion**
	- After Google sign-in, users must complete their profile (name, avatar, favorite color).
	- Avatar uploads should be compressed before saving (handled in backend or frontend).
	- Favorite color can be any hex value; frontend will snap to the closest named color.

## References
- See `schema.sql` for table and policy definitions.
- See `phase1.md` for environment keys and URLs.
- See `PROJECT_PLAN.md` for architecture and milestones.
