# Database

This folder documents the Supabase setup for Raindropio-clone.

- Uses Supabase cloud (no local Postgres).
- Bucket: `nis` with subfolders `avatars`, `bookmarks`, `attachments`.
- See `phase1.md` for keys and URLs.
- See `PROJECT_PLAN.md` for schema, migrations, and RLS policies.

No local database files are stored here; use Supabase dashboard for migrations and storage.

## Setup Instructions

1. **Create Users Table**
	- Run the SQL in `schema.sql` via Supabase SQL editor or CLI.
	- This creates the `users` table, trigger for syncing from `auth.users`, and RLS policies.

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
