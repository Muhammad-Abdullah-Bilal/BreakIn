'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/services/identity-api';
import { Profile } from '@/lib/types/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { 
  Camera, 
  X, 
  Plus, 
  Loader2, 
  Upload,
  AlertCircle,
  CheckCircle,
  Github,
  Linkedin,
  Link as LinkIcon,
  MapPin,
  User,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  website: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  githubUrl: z.string()
    .url('Please enter a valid GitHub URL')
    .optional()
    .or(z.literal('')),
  linkedinUrl: z.string()
    .url('Please enter a valid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  skills: z.array(z.string())
    .max(20, 'Maximum 20 skills allowed'),
  isPublic: z.boolean(),
  showEmail: z.boolean(),
  showLocation: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  className?: string;
}

export function ProfileEditForm({ className }: ProfileEditFormProps) {
  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current profile
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.get(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      location: '',
      website: '',
      githubUrl: '',
      linkedinUrl: '',
      skills: [],
      isPublic: true,
      showEmail: false,
      showLocation: true,
    },
  });

  const skills = watch('skills');

  // Set form values when profile loads
  React.useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        skills: profile.skills,
        isPublic: profile.isPublic,
        showEmail: profile.showEmail,
        showLocation: profile.showLocation,
      });
    }
  }, [profile, reset]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => profileService.update(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', 'me'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
      
      router.push('/profile');
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarFile(null);
      setAvatarPreview(null);
      setUploadingAvatar(false);
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    },
    onError: (error: any) => {
      setUploadingAvatar(false);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        setUploadingAvatar(true);
        await uploadAvatarMutation.mutateAsync(avatarFile);
      }

      // Update profile
      await updateProfileMutation.mutateAsync({
        displayName: data.displayName,
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        skills: data.skills,
        isPublic: data.isPublic,
        showEmail: data.showEmail,
        showLocation: data.showLocation,
      });
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    
    if (skills.includes(skill)) {
      toast({
        title: 'Skill already added',
        description: 'This skill is already in your list.',
        variant: 'destructive',
      });
      return;
    }

    if (skills.length >= 20) {
      toast({
        title: 'Too many skills',
        description: 'Maximum 20 skills allowed.',
        variant: 'destructive',
      });
      return;
    }

    setValue('skills', [...skills, skill], { shouldDirty: true });
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setValue('skills', skills.filter(skill => skill !== skillToRemove), { shouldDirty: true });
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-semibold mb-2">Error loading profile</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={avatarPreview || profile?.userId} 
                  alt={profile?.displayName || 'Profile'} 
                />
                <AvatarFallback className="text-2xl">
                  {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {avatarPreview && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeAvatarPreview}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {avatarFile ? 'Change Photo' : 'Upload Photo'}
                </Button>
                
                {avatarFile && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => uploadAvatarMutation.mutate(avatarFile)}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Save Photo
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max file size 5MB.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="Your display name"
              {...register('displayName')}
              error={errors.displayName?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              rows={4}
              {...register('bio')}
              error={errors.bio?.message}
            />
            <p className="text-sm text-muted-foreground">
              {watch('bio')?.length || 0}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="City, Country"
                className="pl-10"
                {...register('location')}
                error={errors.location?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                placeholder="https://yourwebsite.com"
                className="pl-10"
                {...register('website')}
                error={errors.website?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub</Label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="githubUrl"
                placeholder="https://github.com/username"
                className="pl-10"
                {...register('githubUrl')}
                error={errors.githubUrl?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/username"
                className="pl-10"
                {...register('linkedinUrl')}
                error={errors.linkedinUrl?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleSkillKeyPress}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSkill}
              disabled={!skillInput.trim() || skills.length >= 20}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeSkill(skill)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {skills.length}/20 skills added
          </p>
          
          {errors.skills && (
            <p className="text-sm text-destructive">{errors.skills.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={watch('isPublic')}
              onCheckedChange={(checked) => setValue('isPublic', checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showEmail">Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Display your email address on your profile
              </p>
            </div>
            <Switch
              id="showEmail"
              checked={watch('showEmail')}
              onCheckedChange={(checked) => setValue('showEmail', checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showLocation">Show Location</Label>
              <p className="text-sm text-muted-foreground">
                Display your location on your profile
              </p>
            </div>
            <Switch
              id="showLocation"
              checked={watch('showLocation')}
              onCheckedChange={(checked) => setValue('showLocation', checked, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/profile')}
          disabled={isSubmitting}
          className="sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}