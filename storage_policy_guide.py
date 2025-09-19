#!/usr/bin/env python3
"""
Guide for applying storage policies to Supabase
Since direct SQL execution fails, use this guide to create policies manually
"""

def print_policy_guide():
    print("🔧 SUPABASE STORAGE POLICY SETUP GUIDE")
    print("=" * 50)
    print()

    print("📋 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets")
    print("   → Select the 'nis' bucket")
    print("   → Go to the 'Policies' tab")
    print("   → Click 'Create Policy' for each policy below")
    print()

    policies = [
        {
            "name": "authenticated_users_can_upload_bookmark_images",
            "operation": "INSERT",
            "definition": """auth.role() = 'authenticated'
AND bucket_id = 'nis'
AND (storage.foldername(name))[1] = 'bookmarks'
AND (split_part(storage.filename(name), '_', 1))::uuid = auth.uid()"""
        },
        {
            "name": "authenticated_users_can_view_bookmark_images",
            "operation": "SELECT",
            "definition": """auth.role() = 'authenticated'
AND bucket_id = 'nis'
AND (storage.foldername(name))[1] = 'bookmarks'"""
        },
        {
            "name": "users_can_update_own_bookmark_images",
            "operation": "UPDATE",
            "definition": """auth.role() = 'authenticated'
AND bucket_id = 'nis'
AND (storage.foldername(name))[1] = 'bookmarks'
AND (split_part(storage.filename(name), '_', 1))::uuid = auth.uid()"""
        },
        {
            "name": "users_can_delete_own_bookmark_images",
            "operation": "DELETE",
            "definition": """auth.role() = 'authenticated'
AND bucket_id = 'nis'
AND (storage.foldername(name))[1] = 'bookmarks'
AND (split_part(storage.filename(name), '_', 1))::uuid = auth.uid()"""
        },
        {
            "name": "service_role_full_access",
            "operation": "ALL",
            "definition": "auth.role() = 'service_role'"
        }
    ]

    for i, policy in enumerate(policies, 1):
        print(f"🔹 Policy {i}: {policy['name']}")
        print(f"   Operation: {policy['operation']}")
        print("   Using:")
        print(f"   {policy['definition']}")
        print()

    print("✅ Once all policies are created, bookmark image uploads will work!")
    print()
    print("🧪 Test by:")
    print("   1. Going to a team site")
    print("   2. Clicking edit on a bookmark")
    print("   3. Uploading an image file")
    print("   4. Saving the bookmark")

if __name__ == '__main__':
    print_policy_guide()