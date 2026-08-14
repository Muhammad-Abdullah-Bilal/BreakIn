'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Edit, 
  Calendar,
  Trophy,
  TrendingUp,
  Award,
  Target,
  Users,
  Code,
  MessageSquare,
  Camera,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getRoleDashboardRoute } from '@/lib/roleRouting';

export default function ProfilePage() {
  const { user: currentUser, updateUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Here you would upload to your backend
      // For now, we'll simulate an upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user avatar (simulate API call)
      if (updateUser) {
        const newAvatarUrl = URL.createObjectURL(file);
        await updateUser({
          avatar: newAvatarUrl
        });
      }

      console.log('Avatar uploaded successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900/95 to-blue-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-6">
          {/* Profile Header */}
          <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar with Upload */}
                <div className="relative group">
                  <Avatar 
                    className="h-24 w-24 md:h-32 md:w-32 cursor-pointer transition-all duration-200 group-hover:opacity-80"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage 
                      src={avatarPreview || currentUser?.avatar} 
                      alt={currentUser?.displayName || currentUser?.username || 'User avatar'} 
                    />
                    <AvatarFallback className="text-2xl bg-blue-600 text-white">
                      {currentUser?.displayName?.charAt(0).toUpperCase() || 
                       currentUser?.username?.charAt(0).toUpperCase() ||
                       currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Upload overlay */}
                  <div 
                    className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {currentUser?.email || 'User Profile'}
                    </h1>
                    <Button 
                      asChild 
                      size="sm" 
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      <Link href="/profile/edit">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>

                  <p className="text-gray-300 max-w-2xl">
                    Welcome to your profile page. Here you can view and manage your information.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {format(new Date(), 'MMMM yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-white/5">
                  <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="contributions" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Code className="h-4 w-4 mr-2" />
                    Contributions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-5 w-5" />
                        Profile Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-gray-400">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Profile statistics will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <MessageSquare className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Recent activity will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contributions">
                  <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Code className="h-5 w-5" />
                        Contributions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-gray-400">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Contributions will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">0</div>
                    <div className="text-sm text-gray-400">Reputation</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">0</div>
                    <div className="text-sm text-gray-400">Badges</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="h-5 w-5" />
                    Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-gray-400">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No badges earned yet</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start border-white/10 text-white hover:bg-white/5"
                  >
                    <Link href="/profile/settings">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start border-white/10 text-white hover:bg-white/5"
                  >
                    <Link href={getRoleDashboardRoute(currentUser?.role)}>
                      <Users className="h-4 w-4 mr-2" />
                      View Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}