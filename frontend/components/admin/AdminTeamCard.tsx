import React from "react";
import { Team } from "../../types/api";

interface AdminTeamCardProps {
  team: Team;
  selected?: boolean;
  onSelect?: (team: Team) => void;
}

export default function AdminTeamCard({ team, selected, onSelect }: AdminTeamCardProps) {
  return (
    <div
      className={`admin-team-card${selected ? " selected" : ""}`}
      style={{
        background: "var(--surface)",
        border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
        borderRadius: "var(--rounded-lg)",
        boxShadow: "var(--shadow-md)",
        padding: 24,
        marginBottom: 16,
        cursor: "pointer",
        transition: "box-shadow var(--transition-speed) var(--transition-ease), border-color var(--transition-speed) var(--transition-ease)",
        transform: selected ? "translateY(-2px) scale(1.02)" : "none"
      }}
      onClick={() => onSelect?.(team)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt={team.name}
            style={{ width: 48, height: 48, borderRadius: "var(--rounded-full)", objectFit: "cover", boxShadow: "var(--shadow-md)" }}
            onError={e => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: "var(--rounded-full)", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24, color: "#212529" }}>
            {team.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>{team.name}</div>
          {team.description && (
            <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: 4 }}>{team.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
