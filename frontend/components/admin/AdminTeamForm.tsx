import React from "react";
import { CreateTeamRequest, UpdateTeamRequest, UserProfile } from "../../types/api";
import AdminUserCard from "./AdminUserCard";

interface AdminTeamFormProps {
  teamForm: CreateTeamRequest | UpdateTeamRequest;
  setTeamForm: (form: CreateTeamRequest | UpdateTeamRequest) => void;
  users: UserProfile[];
  selectedMembers: string[];
  setSelectedMembers: (ids: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  error?: string | null;
  loading?: boolean;
  mode: 'create' | 'edit';
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
}

export default function AdminTeamForm({
  teamForm,
  setTeamForm,
  users,
  selectedMembers,
  setSelectedMembers,
  onSubmit,
  onCancel,
  error,
  loading,
  mode,
  logoFile,
  setLogoFile
}: AdminTeamFormProps) {
  const toggleMember = (userId: string) => {
    setSelectedMembers(
      selectedMembers.includes(userId)
        ? selectedMembers.filter((id) => id !== userId)
        : [...selectedMembers, userId]
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Team Name */}
      <div>
        <label className="block text-sm font-medium text-grey-accent-700 mb-2">
          Team Name *
        </label>
        <input
          type="text"
          value={teamForm.name}
          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
          className="w-full px-4 py-3 border border-grey-accent-300 rounded-lg bg-grey-accent-50 focus:bg-white focus:border-grey-accent-500 focus:ring-2 focus:ring-grey-accent-100 text-grey-accent-900 placeholder-grey-accent-500 transition-all duration-200"
          placeholder="Enter team name"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-grey-accent-700 mb-2">
          Description
        </label>
        <textarea
          value={teamForm.description}
          onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
          className="w-full px-4 py-3 border border-grey-accent-300 rounded-lg bg-grey-accent-50 focus:bg-white focus:border-grey-accent-500 focus:ring-2 focus:ring-grey-accent-100 text-grey-accent-900 placeholder-grey-accent-500 transition-all duration-200 resize-none"
          placeholder="Enter team description"
          rows={3}
        />
      </div>

      {/* Team Logo */}
      <div>
        <label className="block text-sm font-medium text-grey-accent-700 mb-2">
          Team Logo (PNG/JPG, optional)
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleLogoChange}
            className="block w-full text-sm text-grey-accent-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-grey-accent-100 file:text-grey-accent-700 hover:file:bg-grey-accent-200 file:cursor-pointer cursor-pointer border border-grey-accent-300 rounded-lg bg-grey-accent-50 focus:bg-white transition-all duration-200"
          />
          {logoFile && (
            <div className="mt-2 text-xs text-grey-accent-600 bg-grey-accent-100 px-3 py-2 rounded-md">
              Selected: {logoFile.name}
            </div>
          )}
        </div>
      </div>

      {/* Add Members (only for create mode) */}
      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-grey-accent-700 mb-2">
            Add Members ({selectedMembers.length})
          </label>
          <div className="max-h-64 overflow-y-scroll scrollbar-hide bg-grey-accent-50 border border-grey-accent-200 rounded-lg p-2 space-y-1">
            {users.map((user) => (
              <AdminUserCard
                key={user.user_id}
                user={user}
                selected={selectedMembers.includes(user.user_id)}
                onSelect={() => toggleMember(user.user_id)}
                compact={true}
              />
            ))}
            {users.length === 0 && (
              <div className="text-grey-accent-500 text-center py-8">
                <div className="text-2xl mb-2">👥</div>
                <div>No users available</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-grey-accent-100">
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-grey-accent-800 hover:bg-grey-accent-900 disabled:bg-grey-accent-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
            </div>
          ) : (
            mode === 'create' ? 
              `Create Team${selectedMembers.length > 0 ? ` with ${selectedMembers.length} member(s)` : ""}` : 
              'Update Team'
          )}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="px-6 py-3 bg-white border border-grey-accent-300 text-grey-accent-700 hover:bg-grey-accent-50 hover:border-grey-accent-400 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
