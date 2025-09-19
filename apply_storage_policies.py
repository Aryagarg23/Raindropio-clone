#!/usr/bin/env python3
"""
Apply storage policies to Supabase database
Run this script to set up RLS policies for bookmark image uploads
"""

import os
from supabase import create_client
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv('database/.env')

    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print('❌ Missing Supabase credentials in database/.env')
        print('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
        return

    # Initialize Supabase client with service role
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Read the SQL file
    sql_file = 'database/017_add_storage_policies.sql'
    try:
        with open(sql_file, 'r') as f:
            sql = f.read()
    except FileNotFoundError:
        print(f'❌ SQL file not found: {sql_file}')
        return

    print('🔄 Applying storage policies...')

    try:
        # Execute the SQL using rpc function
        result = supabase.rpc('exec_sql', {'sql': sql})
        print('✅ Storage policies applied successfully!')
        print('')
        print('📋 Applied policies:')
        print('  - authenticated_users_can_upload_bookmark_images')
        print('  - authenticated_users_can_view_bookmark_images')
        print('  - users_can_update_own_bookmark_images')
        print('  - users_can_delete_own_bookmark_images')
        print('  - service_role_full_access')

    except Exception as e:
        print(f'❌ Failed to apply storage policies: {e}')
        print('')
        print('💡 Alternative: Copy and paste this SQL into your Supabase SQL editor:')
        print('=' * 60)
        print(sql)
        print('=' * 60)

if __name__ == '__main__':
    main()