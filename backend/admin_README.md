# Admin Router Documentation (`api/routers/admin.py`)

This file contains all administrative endpoints for the Raindropio-clone backend. It provides comprehensive admin functionality for managing users, teams, and memberships. The file is 402 lines long and handles complex operations with proper error handling and validation.

## Overview

The admin router (`/admin`) contains endpoints that require admin role access. All endpoints use the `require_admin` dependency to enforce role-based access control.

## Endpoints

### User Management

#### `GET /admin/users`
- **Purpose**: Retrieve all users in the system
- **Access**: Admin only
- **Response**: List of `UserProfile` objects
- **Functionality**:
  - Queries `profiles` table for all users
  - Returns user data including email, name, avatar, role
  - Includes error handling for database issues

### Team Management

#### `POST /admin/teams`
- **Purpose**: Create a new team
- **Access**: Admin only
- **Input**: Form data (name, description, logo file)
- **Response**: `CreateTeamResponse` with new team data
- **Functionality**:
  - Validates team name (2-80 chars)
  - Handles logo upload to Supabase Storage
  - Creates team record in database
  - Returns structured response with team details

#### `PUT /admin/teams/{team_id}`
- **Purpose**: Update existing team
- **Access**: Admin only
- **Input**: Form data (name, description, logo file)
- **Response**: `UpdateTeamResponse` with updated team data
- **Functionality**:
  - Updates only provided fields
  - Handles logo replacement if new file uploaded
  - Validates team exists before update
  - Returns updated team information

#### `GET /admin/teams`
- **Purpose**: List all teams in the system
- **Access**: Admin only
- **Response**: List of `Team` objects
- **Functionality**:
  - Retrieves all teams from database
  - Returns basic team information (id, name, description, etc.)

### Team Membership Management

#### `POST /admin/teams/{team_id}/members`
- **Purpose**: Add a user to a team
- **Access**: Admin only
- **Input**: `AddMemberRequest` with user_id
- **Response**: `AddMemberResponse` confirming addition
- **Validation**:
  - Verifies team exists
  - Verifies user exists
  - Checks user is not already a member
- **Functionality**:
  - Creates new membership record
  - Returns success confirmation

#### `DELETE /admin/teams/{team_id}/members/{user_id}`
- **Purpose**: Remove a user from a team
- **Access**: Admin only
- **Response**: Confirmation message
- **Validation**:
  - Checks membership exists before deletion
- **Functionality**:
  - Deletes membership record
  - Returns success confirmation

#### `GET /admin/teams/{team_id}/members`
- **Purpose**: Get all members of a specific team
- **Access**: Admin only
- **Response**: List of team members with profile data
- **Functionality**:
  - Joins team_memberships with profiles table
  - Returns member details including user profiles

#### `GET /admin/users/{user_id}/teams`
- **Purpose**: Get all teams for a specific user
- **Access**: Admin only
- **Response**: List of user's teams
- **Functionality**:
  - Joins team_memberships with teams table
  - Returns team details for user's memberships

## Key Features

### File Upload Handling
- Logo uploads for teams
- Automatic filename generation with user/team context
- Supabase Storage integration
- Public URL generation for uploaded files

### Error Handling
- Comprehensive HTTP exception raising
- Database error catching and logging
- Validation of foreign key relationships
- Conflict detection (duplicate memberships)

### Database Operations
- Direct Supabase client usage
- Complex queries with joins
- Upsert operations for updates
- Proper error checking on database responses

### Security
- Admin role requirement on all endpoints
- Input validation using Pydantic models
- SQL injection prevention through Supabase client

## Dependencies

- `require_admin`: Dependency for admin access control
- `UserProfile`, `Team` models: Data validation and serialization
- `supabase_service`: Database client
- FastAPI components: Routing, file uploads, form handling

## Usage Examples

### Creating a Team
```python
# POST /admin/teams
# Form data: name="Engineering", description="Dev team", logo=<file>
# Response: {"team": {...}, "message": "Team created successfully"}
```

### Adding Team Member
```python
# POST /admin/teams/{team_id}/members
# Body: {"user_id": "user-uuid"}
# Response: {"message": "User added to team successfully", "team_id": "...", "user_id": "..."}
```

## Notes

- All endpoints log operations for audit purposes
- File uploads use the 'nis' Supabase bucket
- Membership operations prevent duplicates and validate relationships
- Admin access is enforced at the dependency level