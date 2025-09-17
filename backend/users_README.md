# Users Router Documentation (`api/routers/users.py`)

This file handles user profile management endpoints for the Raindropio-clone backend. It provides functionality for syncing user profiles from Supabase authentication and updating profile information. The file is 248 lines long and includes complex file upload handling and database operations.

## Overview

The users router (`/users`) contains endpoints for user profile operations. These endpoints are protected by authentication and allow users to manage their own profiles.

## Endpoints

### Profile Synchronization

#### `POST /users/sync`
- **Purpose**: Sync user profile from Supabase auth to local profiles table
- **Access**: Authenticated users
- **Response**: `SyncResponse` with user profile data
- **Functionality**:
  - Checks if profile exists in local database
  - Creates new profile if not found
  - Updates existing profile with latest auth data
  - Handles user metadata (name, avatar, favorite color)
- **Database Optimization**: Uses `@with_db_optimization` decorator
- **Error Handling**: Validates user data from token, handles database errors

### Profile Updates

#### `PUT /users/profile`
- **Purpose**: Update user profile with optional avatar upload
- **Access**: Authenticated users
- **Input**: Form data (full_name, favorite_color, avatar file)
- **Response**: Updated profile data
- **Functionality**:
  - Validates current user ownership
  - Handles avatar file upload to Supabase Storage
  - Updates profile fields in database
  - Uses upsert strategy to handle RLS policies
  - Verifies update success with follow-up query
- **File Upload**:
  - Uploads to 'nis' bucket under 'avatars/' folder
  - Generates unique filename: `avatars/{user_id}_{filename}`
  - Converts to public URL for storage
- **Database Strategy**:
  - Attempts regular update first
  - Falls back to upsert if update fails
  - Includes extensive logging and verification

## Key Features

### Authentication Integration
- Uses `get_current_user` dependency for authentication
- Extracts user ID from JWT token
- Validates token before operations

### File Upload Handling
- Supports multipart form data
- Handles optional avatar uploads
- Automatic filename sanitization
- Supabase Storage integration with public URLs

### Database Operations
- Optimized queries with concurrency control
- Complex upsert logic for profile updates
- Extensive error checking and logging
- Verification of update success

### Error Handling
- HTTP exceptions for validation failures
- Database error catching and user-friendly messages
- Detailed logging for debugging
- Graceful handling of optional fields

### Security Considerations
- Users can only update their own profiles
- File upload validation
- Database operation logging
- RLS policy compatibility

## Dependencies

- `get_current_user`: Authentication dependency
- `UserProfile`: Pydantic model for user data
- `supabase_service`: Database client
- `with_db_optimization`: Database performance decorator
- FastAPI components: File uploads, form handling, routing

## Usage Examples

### Sync Profile
```python
# POST /users/sync
# Headers: Authorization: Bearer <jwt_token>
# Response: {"profile": {...}, "message": "Profile synced successfully"}
```

### Update Profile
```python
# PUT /users/profile
# Form data: full_name="John Doe", favorite_color="blue", avatar=<file>
# Response: {"message": "Profile updated successfully", "profile": {...}}
```

## Database Schema

The endpoints interact with the `profiles` table which includes:
- `user_id`: Primary key (matches Supabase auth)
- `email`: User email
- `full_name`: Display name
- `avatar_url`: Profile picture URL
- `favorite_color`: User preference
- `role`: User role (user/admin)
- `created_at`: Profile creation timestamp

## Notes

- Profile sync creates profiles on first login
- Avatar uploads are stored in Supabase Storage
- Updates use upsert to handle Row Level Security
- Extensive logging helps with debugging RLS issues
- All operations are optimized for concurrent access