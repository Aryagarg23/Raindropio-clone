import React from 'react';
import { CreateTeamRequest, UserProfile } from '../types/api';

interface TeamFormProps {
  teamForm: CreateTeamRequest;
  setTeamForm: (form: CreateTeamRequest) => void;
  users: UserProfile[];
  newTeamMembers: string[];
  setNewTeamMembers: (ids: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  error?: string | null;
}

export default function TeamForm({ teamForm, setTeamForm, users, newTeamMembers, setNewTeamMembers, onSubmit, onCancel, error }: TeamFormProps) {
  const toggleMember = (userId: string) => {
    setNewTeamMembers(
      newTeamMembers.includes(userId)
        ? newTeamMembers.filter(id => id !== userId)
        : [...newTeamMembers, userId]
    );
  };

  return (
    <form onSubmit={onSubmit} className="mb-6 p-6 bg-[var(--surface)] rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-[var(--primary)] mb-4">Create Team</h2>
      {error && <div className="mb-4 text-[var(--accent)] text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Team Name *</label>
          <input
            type="text"
            value={teamForm.name}
            onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
            placeholder="Enter team name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
          <textarea
            value={teamForm.description}
            onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
            placeholder="Enter team description"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Logo URL</label>
          <input
            type="url"
            value={teamForm.logo_url}
            onChange={e => setTeamForm({ ...teamForm, logo_url: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
            placeholder="https://example.com/logo.png"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Team Members ({newTeamMembers.length} selected)</label>
          <div className="max-h-40 overflow-y-auto border border-[var(--border)] rounded-md bg-[var(--background)]">
            {users.map(user => (
              <div
                key={user.user_id}
                className={`flex items-center space-x-3 p-2 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--surface)] ${
                  newTeamMembers.includes(user.user_id) ? 'bg-[var(--primary)] bg-opacity-10' : ''
                }`}
                onClick={() => toggleMember(user.user_id)}
              >
                <input
                  type="checkbox"
                  checked={newTeamMembers.includes(user.user_id)}
                  onChange={() => toggleMember(user.user_id)}
                  className="w-4 h-4 text-[var(--primary)]"
                />
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || user.email} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-[var(--surface)] rounded-full flex items-center justify-center">
                    <span className="text-xs text-[var(--text-secondary)]">{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{user.full_name || user.email}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="p-4 text-center text-[var(--text-secondary)] text-sm">No users available</p>
            )}
          </div>
        </div>
        <div className="flex space-x-4 mt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-[var(--primary)] text-[var(--text-primary)] rounded-md font-semibold shadow-md hover:bg-[var(--secondary)] transition-colors"
          >
            Create Team {newTeamMembers.length > 0 && `with ${newTeamMembers.length} member(s)`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-[var(--surface)] text-[var(--text-secondary)] rounded-md border border-[var(--border)] hover:bg-[var(--background)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
