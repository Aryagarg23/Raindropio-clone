import { useState } from "react";
import { getClosestColorName, stickyPalette } from "../utils/colors";
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
  const [color, setColor] = useState(profile?.favorite_color || stickyPalette[0]);
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
    <div className="w-full max-w-2xl">
      <form 
        onSubmit={handleProfileSubmit} 
        className="bg-white rounded-xl shadow-md p-8 space-y-6 border border-grey-accent-200"
      >
        <h2 className="text-3xl font-bold text-grey-accent-900 mb-2">Complete Your Profile</h2>
        <p className="text-grey-accent-600 mb-6">Please fill out your information to get started.</p>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-semibold text-grey-accent-700 mb-2">
              Full Name
            </label>
            <input 
              id="profile-name"
              name="fullName"
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-grey-accent-50 border border-grey-accent-200 rounded-lg text-grey-accent-900 placeholder-grey-accent-400 focus:outline-none focus:ring-2 focus:ring-grey-accent-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="profile-avatar" className="block text-sm font-semibold text-grey-accent-700 mb-2">
              Profile Picture (PNG/JPG)
            </label>
            <input 
              id="profile-avatar"
              name="avatar"
              type="file" 
              accept="image/png, image/jpeg" 
              onChange={handleAvatarChange} 
              required={!profile || !profile.avatar_url || profile.avatar_url === ""} 
              className="w-full px-4 py-3 bg-grey-accent-50 border border-grey-accent-200 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-grey-accent-100 file:text-grey-accent-700 hover:file:bg-grey-accent-200 focus:outline-none focus:ring-2 focus:ring-grey-accent-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="profile-color" className="block text-sm font-semibold text-grey-accent-700 mb-2">
              Favorite Color
            </label>
            <div className="flex items-center space-x-4">
              <input 
                id="profile-color"
                name="favoriteColor"
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)} 
                className="w-12 h-12 border-2 border-grey-accent-200 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-grey-accent-900">{getClosestColorName(color)}</span>
                <div className="text-xs text-grey-accent-500 mt-1">Click the color box to choose your favorite color</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting} 
          className="w-full bg-grey-accent-800 hover:bg-grey-accent-900 disabled:bg-grey-accent-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
        >
          {submitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </div>
          ) : (
            "Save Profile"
          )}
        </button>
      </form>
    </div>
  );
}
