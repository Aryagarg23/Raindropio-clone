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
  mode
}: AdminTeamFormProps) {
  const toggleMember = (userId: string) => {
    setSelectedMembers(
      selectedMembers.includes(userId)
        ? selectedMembers.filter((id) => id !== userId)
        : [...selectedMembers, userId]
    );
  };

  return (
    <form onSubmit={onSubmit} style={{ background: "var(--surface)", borderRadius: "var(--rounded-lg)", boxShadow: "var(--shadow-md)", padding: 32, marginBottom: 24, maxWidth: 480 }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        {mode === 'create' ? 'Create Team' : 'Edit Team'}
      </h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 500, marginBottom: 8, color: "var(--text-secondary)" }}>Team Name *</label>
        <input
          type="text"
          value={teamForm.name}
          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
          style={{ width: "100%", padding: "12px", borderRadius: "var(--rounded-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "1rem", marginBottom: 8 }}
          placeholder="Enter team name"
          required
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 500, marginBottom: 8, color: "var(--text-secondary)" }}>Description</label>
        <textarea
          value={teamForm.description}
          onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
          style={{ width: "100%", padding: "12px", borderRadius: "var(--rounded-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "1rem", marginBottom: 8 }}
          placeholder="Enter team description"
          rows={2}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 500, marginBottom: 8, color: "var(--text-secondary)" }}>Logo URL</label>
        <input
          type="url"
          value={teamForm.logo_url}
          onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
          style={{ width: "100%", padding: "12px", borderRadius: "var(--rounded-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontSize: "1rem", marginBottom: 8 }}
          placeholder="https://example.com/logo.png"
        />
      </div>
      {mode === 'create' && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 8, color: "var(--text-secondary)" }}>Add Members ({selectedMembers.length})</label>
          <div style={{ maxHeight: 180, overflowY: "auto", background: "var(--background)", borderRadius: "var(--rounded-md)", border: "1px solid var(--border)", padding: 8 }}>
            {users.map((user) => (
              <AdminUserCard
                key={user.user_id}
                user={user}
                selected={selectedMembers.includes(user.user_id)}
                onSelect={() => toggleMember(user.user_id)}
              />
            ))}
            {users.length === 0 && (
              <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: 16 }}>No users available</div>
            )}
          </div>
        </div>
      )}
      {error && <div style={{ color: "var(--accent)", marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "flex", gap: 16 }}>
        <button type="submit" disabled={loading} style={{ background: "var(--primary)", color: "#212529", padding: "12px 24px", borderRadius: "var(--rounded-md)", fontWeight: 600, fontSize: "1rem", border: "none", boxShadow: "var(--shadow-md)", cursor: loading ? "not-allowed" : "pointer", transition: "background var(--transition-speed) var(--transition-ease), box-shadow var(--transition-speed) var(--transition-ease)" }}>
          {loading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? `Create Team${selectedMembers.length > 0 ? ` with ${selectedMembers.length} member(s)` : ""}` : 'Update Team')}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "var(--surface)", color: "var(--text-secondary)", padding: "12px 24px", borderRadius: "var(--rounded-md)", fontWeight: 500, fontSize: "1rem", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", cursor: "pointer", transition: "background var(--transition-speed) var(--transition-ease), box-shadow var(--transition-speed) var(--transition-ease)" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
