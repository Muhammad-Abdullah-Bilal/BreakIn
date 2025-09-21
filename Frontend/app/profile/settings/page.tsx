'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Camera,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsPage() {
  const { user: currentUser, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: currentUser?.displayName || '',
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    bio: '',
    location: '',
    website: ''
  });

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: currentUser?.preferences?.emailUpdates ?? true,
    pushNotifications: currentUser?.preferences?.notifications ?? true,
    marketingEmails: false,
    profileVisibility: 'public',
    activityStatus: true
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateUser({
        displayName: profileForm.displayName,
        username: profileForm.username,
        email: profileForm.email
      });
      
      // Show success message
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate password update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      console.log('Password updated successfully');
    } catch (error) {
      console.error('Failed to update password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (updateUser) {
        const newAvatarUrl = URL.createObjectURL(file);
        await updateUser({
          avatar: newAvatarUrl
        });
      }

      console.log('Avatar updated successfully');
    } catch (error) {
      console.error('Failed to update avatar:', error);
      setAvatarPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    try {
      // Update user preferences
      await updateUser({
        preferences: {
          ...currentUser?.preferences,
          notifications: key === 'pushNotifications' ? value : preferences.pushNotifications,
          emailUpdates: key === 'emailNotifications' ? value : preferences.emailNotifications
        }
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      // Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900/95 to-blue-950/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            asChild 
            className="mb-4 border-white/10 text-white hover:bg-white/5"
          >
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-white/5">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-blue-600">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="text-white data-[state=active]:bg-blue-600">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-blue-600">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="text-white data-[state=active]:bg-blue-600">
              <Shield className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar 
                      className="h-20 w-20 cursor-pointer transition-all duration-200 group-hover:opacity-80"
                      onClick={handleAvatarClick}
                    >
                      <AvatarImage 
                        src={avatarPreview || currentUser?.avatar} 
                        alt="Profile picture" 
                      />
                      <AvatarFallback className="text-xl bg-blue-600 text-white">
                        {profileForm.displayName?.charAt(0).toUpperCase() || 
                         profileForm.username?.charAt(0).toUpperCase() ||
                         profileForm.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div 
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-white font-medium">Profile Picture</h3>
                    <p className="text-gray-400 text-sm">Click to upload a new avatar</p>
                    <p className="text-gray-500 text-xs mt-1">JPG, PNG or GIF. Max size 5MB.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-white">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                        placeholder="Your display name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">Location</Label>
                      <Input
                        id="location"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-white">Website</Label>
                      <Input
                        id="website"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                        placeholder="https://yoursite.com"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSecuritySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 pr-10"
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Email Notifications</Label>
                      <p className="text-gray-400 text-sm">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferencesUpdate('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Push Notifications</Label>
                      <p className="text-gray-400 text-sm">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => handlePreferencesUpdate('pushNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Marketing Emails</Label>
                      <p className="text-gray-400 text-sm">Receive updates about new features and promotions</p>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => handlePreferencesUpdate('marketingEmails', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Activity Status</Label>
                      <p className="text-gray-400 text-sm">Show when you're online to other users</p>
                    </div>
                    <Switch
                      checked={preferences.activityStatus}
                      onCheckedChange={(checked) => handlePreferencesUpdate('activityStatus', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">Account Status</h3>
                    <p className="text-gray-400 text-sm">Your account is active and in good standing.</p>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-white font-medium mb-2">Export Data</h3>
                    <p className="text-gray-400 text-sm mb-4">Download a copy of your account data.</p>
                    <Button 
                      variant="outline" 
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      Download Data
                    </Button>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}