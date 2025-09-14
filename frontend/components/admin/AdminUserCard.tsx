import React from "react";
import { UserProfile } from "../../types/api";

interface AdminUserCardProps {
  user: UserProfile;
  selected?: boolean;
  onSelect?: (user: UserProfile) => void;
  disabled?: boolean;
}

export default function AdminUserCard({ user, selected, onSelect, disabled }: AdminUserCardProps) {
  return (
    <div
      className={`admin-user-card${selected ? " selected" : ""}`}
      style={{
        background: "var(--surface)",
        border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
        borderRadius: "var(--rounded-md)",
        boxShadow: "var(--shadow-md)",
        padding: 16,
        marginBottom: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "box-shadow var(--transition-speed) var(--transition-ease), border-color var(--transition-speed) var(--transition-ease)",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}
      onClick={() => !disabled && onSelect?.(user)}
    >
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.full_name || user.email}
          style={{ width: 32, height: 32, borderRadius: "var(--rounded-full)", objectFit: "cover", boxShadow: "var(--shadow-md)" }}
        />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: "var(--rounded-full)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 16, color: "#212529" }}>
          {(user.full_name || user.email).charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "1rem" }}>{user.full_name || user.email}</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{user.email}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: "0.8rem", background: user.role === "admin" ? "#C41230" : "#2D3748", color: "#fff", borderRadius: "var(--rounded-sm)", padding: "2px 8px", fontWeight: 600 }}>
            {user.role}
          </span>
          {user.favorite_color && (
            <span style={{ width: 16, height: 16, borderRadius: "var(--rounded-full)", background: user.favorite_color, border: "1px solid var(--border)" }} title={`Favorite color: ${user.favorite_color}`}></span>
          )}
        </div>
      </div>
    </div>
  );
}
