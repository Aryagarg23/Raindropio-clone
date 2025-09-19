export interface UserProfile {
  user_id: string;  // Changed to match backend
  email: string;
  full_name?: string;
  avatar_url?: string;
  favorite_color?: string;
  role: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    favorite_color?: string;
  };
}

export interface SyncResponse {
  profile: UserProfile;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  created_by?: string;
  member_count?: number;
}

export interface TeamMembership {
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface ListTeamsResponse {
  teams: Team[];
  message: string;
}

export interface ListUsersResponse {
  users: UserProfile[];
  message: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  logo_url?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  logo_url?: string;
}

export interface CreateTeamResponse {
  team: Team;
  message: string;
}

export interface UpdateTeamResponse {
  team: Team;
  message: string;
}

export interface AddMemberRequest {
  user_id: string;
}

export interface AddMemberResponse {
  message: string;
  team_id: string;
  user_id: string;
}

// Team Site types (collections, bookmarks, highlights, annotations)

export interface Collection {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  color: string;
  parent_id?: string;
  sort_order?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Extended collection with creator and nesting info
export interface CollectionWithCreator extends Collection {
  creator_name?: string;
  creator_avatar?: string;
  level?: number;
  path?: string[];
  children?: CollectionWithCreator[];
}

// Extended bookmark with creator info  
export interface BookmarkWithCreator extends Bookmark {
  creator_name?: string;
  creator_avatar?: string;
}

export interface Bookmark {
  id: string;
  team_id: string;
  collection_id?: string;
  url: string;
  title?: string;
  description?: string;
  favicon_url?: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamEvent {
  id: string;
  team_id: string;
  event_type: string; // 'bookmark.created', 'collection.updated', 'highlight.created', etc
  actor_id: string;
  data: Record<string, any>; // JSON payload
  created_at: string;
}

export interface Presence {
  team_id: string;
  user_id: string;
  last_seen: string;
  current_page?: string;
}

export interface Highlight {
  id: string;
  bookmark_id: string;
  team_id: string;
  created_by: string;
  selected_text: string;
  text_before?: string;
  text_after?: string;
  start_offset?: number;
  end_offset?: number;
  xpath_start?: string;
  xpath_end?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  bookmark_id: string;
  highlight_id?: string; // null = annotation on bookmark itself
  team_id: string;
  created_by: string;
  content: string;
  annotation_type: 'comment' | 'question' | 'important' | 'idea';
  created_at: string;
  updated_at: string;
}

export interface AnnotationReaction {
  id: string;
  annotation_id: string;
  team_id: string;
  created_by: string;
  reaction_type: 'like' | 'agree' | 'disagree' | 'question';
  created_at: string;
}

// Extended types with creator info (returned by helper functions)

export interface HighlightWithCreator extends Highlight {
  creator_name?: string;
  creator_avatar?: string;
  creator_id: string;
}

export interface AnnotationWithCreator extends Annotation {
  creator_name?: string;
  creator_avatar?: string;
  creator_id: string;
  like_count: number;
  user_liked: boolean;
}

// Request/Response types for team-site operations

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  color?: string;
  parent_id?: string;
  sort_order?: number;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  color?: string;
  parent_id?: string;
  sort_order?: number;
}

export interface CreateBookmarkRequest {
  url: string;
  collection_id?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateBookmarkRequest {
  collection_id?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface CreateHighlightRequest {
  bookmark_id: string;
  selected_text: string;
  text_before?: string;
  text_after?: string;
  start_offset?: number;
  end_offset?: number;
  xpath_start?: string;
  xpath_end?: string;
  color?: string;
}

export interface CreateAnnotationRequest {
  bookmark_id: string;
  highlight_id?: string;
  content: string;
  annotation_type?: 'comment' | 'question' | 'important' | 'idea';
}

export interface UpdateAnnotationRequest {
  content?: string;
  annotation_type?: 'comment' | 'question' | 'important' | 'idea';
}

export interface CreateReactionRequest {
  annotation_id: string;
  reaction_type: 'like' | 'agree' | 'disagree' | 'question';
}

// Team site activity feed item
export interface ActivityItem {
  id: string;
  type: 'bookmark' | 'collection' | 'highlight' | 'annotation';
  action: 'created' | 'updated' | 'deleted';
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
  target: {
    id: string;
    title: string;
    url?: string;
  };
  timestamp: string;
  preview?: string;
}
