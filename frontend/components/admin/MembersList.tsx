import React from 'react';
import { UserProfile } from '../../types/api';
import AdminUserCard from './AdminUserCard';

interface MembersListProps {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  onUserSelect: (user: UserProfile) => void;
}

export default function MembersList({ users, selectedUser, onUserSelect }: MembersListProps) {
  return (
    <div>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        marginBottom: 24 
      }}>
        Members ({users.length})
      </h2>
      <div style={{ 
        maxHeight: 500, 
        overflowY: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 'var(--rounded-lg)',
        background: 'var(--surface)'
      }}>
        {users.map((user, index) => (
          <div key={user.user_id} style={{
            borderBottom: index < users.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <AdminUserCard
              user={user}
              selected={selectedUser?.user_id === user.user_id}
              onSelect={() => onUserSelect(user)}
              disabled={false}
            />
          </div>
        ))}
        {users.length === 0 && (
          <div style={{ 
            color: 'var(--text-secondary)', 
            textAlign: 'center', 
            padding: 32,
            fontStyle: 'italic'
          }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}