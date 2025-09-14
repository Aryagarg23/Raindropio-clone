import { useState } from "react";
import { getClosestColorName } from "../utils/colors";
import { apiClient, ApiError } from "../modules/apiClient";
import { AuthUser, UserProfile } from "../types/api";

interface ProfileFormProps {
  user: AuthUser;
  profile: UserProfile | null;
  onProfileUpdated: () => void;
}

export default function ProfileForm({ user, profile, onProfileUpdated }: ProfileFormProps) {
  const [name, setName] = useState(profile?.full_name || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [color, setColor] = useState(profile?.favorite_color || "#A0D2EB");
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await apiClient.updateProfile(name, color, avatar || undefined);
      onProfileUpdated();
    } catch (error) {
      if (error instanceof ApiError) {
        alert(`Profile update failed: ${error.message}`);
      } else {
        alert("Profile update failed. Please try again.");
      }
      console.error("Profile update error:", error);
    }
    
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleProfileSubmit} style={{ background: "var(--surface)", borderRadius: "16px", boxShadow: "var(--shadow-md)", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", minWidth: "320px" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: 700 }}>Complete Your Profile</h2>
      <label style={{ fontWeight: 600 }}>
        Name
        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px", marginTop: "8px", fontSize: "1rem" }} />
      </label>
      <label style={{ fontWeight: 600 }}>
        Avatar (PNG/JPG)
        <input type="file" accept="image/png, image/jpeg" onChange={handleAvatarChange} required={!profile || !profile.avatar_url || profile.avatar_url === ""} style={{ marginTop: "8px" }} />
      </label>
      <label style={{ fontWeight: 600 }}>
        Favorite Color
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ marginLeft: "8px", verticalAlign: "middle" }} />
        <span style={{ marginLeft: "16px", fontWeight: 400 }}>{getClosestColorName(color)}</span>
      </label>
      <button type="submit" disabled={submitting} style={{ background: "var(--primary)", color: "#212529", padding: "12px 24px", borderRadius: "8px", fontSize: "1.1em", fontWeight: 600, boxShadow: "var(--shadow-md)", border: "none", cursor: "pointer", transition: "background 200ms ease-out, box-shadow 200ms ease-out" }}>{submitting ? "Saving..." : "Save Profile"}</button>
    </form>
  );
}
