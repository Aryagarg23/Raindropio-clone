import React from "react";
import { UserProfile } from "../../types/api";

interface AdminUserCardProps {
  user: UserProfile;
  selected?: boolean;
  onSelect?: (user: UserProfile) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function AdminUserCard({ user, selected, onSelect, disabled, compact = false }: AdminUserCardProps) {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200 ${
          selected 
            ? 'bg-grey-accent-100 border border-grey-accent-400 shadow-sm' 
            : 'bg-white border border-grey-accent-200 hover:bg-grey-accent-50 hover:border-grey-accent-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onSelect?.(user)}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || user.email}
            className="w-8 h-8 rounded-full object-cover shadow-sm border border-white"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white font-medium text-sm shadow-sm">
            {(user.full_name || user.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-grey-accent-900 truncate text-sm">
            {user.full_name || user.email}
          </div>
          <div className="text-xs text-grey-accent-600 truncate">
            {user.email}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            user.role === "admin" 
              ? 'bg-red-100 text-red-700' 
              : 'bg-grey-accent-100 text-grey-accent-700'
          }`}>
            {user.role}
          </span>
          {user.favorite_color && (
            <div 
              className="w-3 h-3 rounded-full border border-white shadow-sm" 
              style={{ backgroundColor: user.favorite_color }}
              title={`Favorite color: ${user.favorite_color}`}
            />
          )}
          {selected && (
            <div className="text-grey-accent-600 ml-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        selected 
          ? 'bg-grey-accent-100 border-2 border-grey-accent-400 shadow-md' 
          : 'bg-white border border-grey-accent-200 hover:bg-grey-accent-50 hover:border-grey-accent-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onSelect?.(user)}
    >
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.full_name || user.email}
          className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white font-semibold shadow-sm">
          {(user.full_name || user.email).charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-grey-accent-900 truncate">
          {user.full_name || user.email}
        </div>
        <div className="text-sm text-grey-accent-600 truncate">
          {user.email}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            user.role === "admin" 
              ? 'bg-red-100 text-red-700' 
              : 'bg-grey-accent-100 text-grey-accent-700'
          }`}>
            {user.role}
          </span>
          {user.favorite_color && (
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: user.favorite_color }}
              title={`Favorite color: ${user.favorite_color}`}
            />
          )}
        </div>
      </div>
      {selected && (
        <div className="text-grey-accent-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
