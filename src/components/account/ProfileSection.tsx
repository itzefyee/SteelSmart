'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserProfile } from '@/types';

interface ProfileSectionProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  const { user, signOut, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState(profile.company || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [errors, setErrors] = useState<{ company?: string; phone?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { company?: string; phone?: string } = {};

    // Phone validation (optional, but if provided must be valid)
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        company: company || null,
        phone: phone || null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCompany(profile.company || '');
    setPhone(profile.phone || '');
    setErrors({});
    setIsEditing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      // Force a page refresh to get the latest data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // AuthProvider handles the redirect, no need to reset loading state
      // as the page will be replaced
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="glass-container glass-container-with-liquid p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            Email
            <div className="relative ml-2">
              <svg 
                className="w-4 h-4 text-gray-400 cursor-help" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.display = 'block';
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  if (tooltip) tooltip.style.display = 'none';
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              {/* Tooltip */}
              <div 
                className="absolute left-0 top-6 z-50 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap"
                style={{ display: 'none' }}
              >
                Email cannot be changed
              </div>
            </div>
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
            {profile.email || user?.email || 'Not available'}
          </div>
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          {isEditing ? (
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="glass-input"
              placeholder="Enter your company name"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {profile.company || 'Not provided'}
            </div>
          )}
          {errors.company && (
            <p className="mt-1 text-sm text-red-600">{errors.company}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          {isEditing ? (
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input"
              placeholder="Enter your phone number"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {profile.phone || 'Not provided'}
            </div>
          )}
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Action buttons (only shown in edit mode) */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Logout button (always shown) */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging Out...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
