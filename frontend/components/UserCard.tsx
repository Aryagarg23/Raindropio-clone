import React from 'react';
import { UserProfile } from '../types/api';

interface UserCardProps {
  user: UserProfile;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function UserCard({ user, selected, onClick, disabled }: UserCardProps) {
  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-md border transition-all duration-[var(--transition-speed)] cursor-pointer ${
        selected ? 'border-[var(--primary)] bg-[var(--surface)] scale-[1.02]' : 'border-[var(--border)] hover:shadow-md hover:-translate-y-1'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ marginBottom: '8px' }}
    >
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.full_name || user.email}
          className="w-8 h-8 rounded-full border border-[var(--border)]"
        />
      ) : (
        <div className="w-8 h-8 bg-[var(--background)] rounded-full flex items-center justify-center border border-[var(--border)]">
          <span className="text-xs text-[var(--text-secondary)]">
            {(user.full_name || user.email).charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--text-primary)] truncate">{user.full_name || user.email}</p>
        <p className="text-sm text-[var(--text-secondary)] truncate">{user.email}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`px-2 py-1 text-xs rounded-full ${
            user.role === 'admin'
              ? 'bg-purple-900 text-purple-100'
              : 'bg-gray-700 text-gray-200'
          }`}>
            {user.role}
          </span>
          {user.favorite_color && (
            <div
              className="w-4 h-4 rounded-full border border-[var(--border)]"
              style={{ backgroundColor: user.favorite_color }}
              title={`Favorite color: ${user.favorite_color}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
