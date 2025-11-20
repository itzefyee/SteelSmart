'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import ProfileSection from './ProfileSection';
import CADHistorySection from './CADHistorySection';
import AccountStatsSection from './AccountStatsSection';
import { UserProfile } from '@/types';

interface AccountPageClientProps {
  initialProfile: UserProfile;
}

export default function AccountPageClient({ initialProfile }: AccountPageClientProps) {
  const { updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const { error } = await updateProfile(updates);

    if (error) {
      setErrorMessage('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } else {
      // Update local state with new values
      setProfile((prev) => ({
        ...prev,
        ...updates,
        updated_at: new Date().toISOString(),
      }));
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Profile and Stats Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section - Square and Boxy */}
        <div className="lg:col-span-1">
          <ProfileSection profile={profile} onUpdate={handleUpdateProfile} />
        </div>

        {/* Account Stats Section - 2x2 Grid */}
        <div className="lg:col-span-2">
          <AccountStatsSection userId={profile.id} memberSince={profile.created_at} />
        </div>
      </div>

      {/* CAD History Section */}
      <CADHistorySection userId={profile.id} />
    </div>
  );
}
