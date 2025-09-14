
import { useEffect, useState, ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

const namedColors: { [hex: string]: string } = {
  "#A0D2EB": "Light Blue",
  "#E57373": "Light Coral",
  "#C41230": "UC Red",
  "#1A202C": "Dark Slate",
  "#2D3748": "Light Slate",
  "#F7FAFC": "Off-White",
  "#A0AEC0": "Light Gray",
  "#4A5568": "Gray",
  "#F8F9FA": "Off-White",
  "#FFFFFF": "Pure White",
  "#212529": "Dark Gray",
  "#6C757D": "Lighter Gray",
  "#E9ECEF": "Light Gray"
};

function getClosestColorName(hex: string) {
  // Simple snap: if exact match, return name; else return hex
  return namedColors[hex.toUpperCase()] || hex;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [color, setColor] = useState("#A0D2EB");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndProfile() {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
      if (data?.user) {
        // Wait for Supabase trigger to create profile row
        let tries = 0;
        let profileRow = null;
        while (tries < 10) {
          const { data: existing } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("user_id", data.user.id)
            .single();
          if (existing) {
            profileRow = existing;
            break;
          }
          await new Promise(res => setTimeout(res, 500));
          tries++;
        }
        if (!profileRow) {
          alert("Profile row was not created by Supabase trigger. Please try signing in again or check Supabase configuration.");
        } else {
          await fetchProfile(data.user.id);
        }
      }
      setLoading(false);
    }
    fetchUserAndProfile();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, favorite_color")
      .eq("user_id", userId)
      .single();
    setProfile(data);
    if (data) {
      setName(data.full_name || "");
      setColor(data.favorite_color || "#A0D2EB");
    }
    if (error) {
      console.log("Profile fetch error:", error);
    }
    console.log("Fetched profile:", data);
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    let avatarUrl = profile?.avatar_url || "";
    // Only update profile fields (name, avatar, color)
    if (avatar && user?.id) {
      const fileExt = avatar.name.split(".").pop();
      const safeExt = fileExt ? fileExt.replace(/[^a-zA-Z0-9]/g, "") : "png";
      const fileName = `${user.id}.${safeExt}`;
      const filePath = `avatars/${fileName}`;
      try {
        const { data, error } = await supabase.storage
          .from("nis")
          .upload(filePath, avatar, { upsert: true });
        if (error) {
          alert("Avatar upload failed: " + error.message);
        } else {
          const { data: urlData } = supabase.storage
            .from("nis")
            .getPublicUrl(filePath);
          avatarUrl = urlData?.publicUrl || "";
        }
      } catch (err: any) {
        alert("Avatar upload error: " + err?.message);
      }
    }
    // Update profile fields
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: name, avatar_url: avatarUrl, favorite_color: color })
      .eq("user_id", user.id);
    if (updateError) {
      alert("Error updating profile: " + updateError.message);
      console.error("Supabase update error:", updateError);
    } else {
      console.log("Profile updated successfully");
    }
    setSubmitting(false);
    fetchProfile(user.id);
  }

  return (
    <main
      style={{
        background: "var(--background)",
        color: "var(--text-primary)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, Nunito Sans, sans-serif"
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 32 }}>
        Raindropio Clone
      </h1>
      {loading ? (
        <div>Loading...</div>
      ) : !user ? (
        <>
          <div style={{ marginBottom: 16, color: "#E57373" }}>
            {/* Debug output for user state */}
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
          <button
            onClick={signInWithGoogle}
            style={{
              background: "var(--primary)",
              color: "#212529",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "1.2em",
              fontWeight: 600,
              boxShadow: "var(--shadow-md)",
              border: "none",
              cursor: "pointer",
              transition: "background 200ms ease-out, box-shadow 200ms ease-out"
            }}
          >
            Sign in with Google
          </button>
        </>
      ) : (!profile ||
        !profile.full_name || profile.full_name === "" ||
        !profile.avatar_url || profile.avatar_url === "" ||
        !profile.favorite_color || profile.favorite_color === ""
      ) ? (
        <>
          <div style={{ marginBottom: 16, color: "#E57373" }}>
            {/* Debug output for user and profile state */}
            <div>User:</div>
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <div>Profile:</div>
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          </div>
          <form
            onSubmit={handleProfileSubmit}
            style={{
              background: "var(--surface)",
              borderRadius: "16px",
              boxShadow: "var(--shadow-md)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              minWidth: "320px"
            }}
          >
            <h2 style={{ fontSize: "2rem", fontWeight: 700 }}>Complete Your Profile</h2>
            <label style={{ fontWeight: 600 }}>
              Name
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px",
                  marginTop: "8px",
                  fontSize: "1rem"
                }}
              />
            </label>
            <label style={{ fontWeight: 600 }}>
              Avatar (PNG/JPG)
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleAvatarChange}
                required={!profile || !profile.avatar_url || profile.avatar_url === ""}
                style={{ marginTop: "8px" }}
              />
            </label>
            <label style={{ fontWeight: 600 }}>
              Favorite Color
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ marginLeft: "8px", verticalAlign: "middle" }}
              />
              <span style={{ marginLeft: "16px", fontWeight: 400 }}>
                {getClosestColorName(color)}
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "var(--primary)",
                color: "#212529",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "1.1em",
                fontWeight: 600,
                boxShadow: "var(--shadow-md)",
                border: "none",
                cursor: "pointer",
                transition: "background 200ms ease-out, box-shadow 200ms ease-out"
              }}
            >
              {submitting ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </>
      ) : (
        profile ? (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <img
              src={profile.avatar_url || "/default-avatar.png"}
              alt="Avatar"
              style={{ width: 96, height: 96, borderRadius: "9999px", boxShadow: "var(--shadow-md)", marginBottom: 16 }}
            />
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>{profile.full_name || "Unnamed User"}</h2>
            <p style={{ color: profile.favorite_color || "#A0D2EB", fontWeight: 600 }}>
              Favorite Color: {getClosestColorName(profile.favorite_color || "#A0D2EB")}
            </p>
          </div>
        ) : null
      )}
    </main>
  );
}
