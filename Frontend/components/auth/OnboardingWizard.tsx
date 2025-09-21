'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { onboardingService } from '@/lib/services/identity-api';
import { OnboardingStep } from '@/lib/types/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowRight, 
  ArrowLeft,
  Check,
  Loader2,
  User,
  Settings,
  Bell,
  Rocket
} from 'lucide-react';

const personalInfoSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Please enter a valid GitHub URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
});

const skillsSchema = z.object({
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  interests: z.array(z.string()),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(1, 'Please select a language'),
  timezone: z.string().min(1, 'Please select a timezone'),
  emailDigest: z.enum(['daily', 'weekly', 'monthly', 'never']),
  notifications: z.object({
    email: z.object({
      mentions: z.boolean(),
      directMessages: z.boolean(),
      submissions: z.boolean(),
      reviews: z.boolean(),
      communityActivity: z.boolean(),
      systemUpdates: z.boolean(),
    }),
    push: z.object({
      mentions: z.boolean(),
      directMessages: z.boolean(),
      submissions: z.boolean(),
      reviews: z.boolean(),
    }),
  }),
});

const skillOptions = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET',
  'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'Git', 'CI/CD', 'Testing', 'DevOps',
];

const interestOptions = [
  'Web Development', 'Mobile Development', 'Desktop Applications',
  'Machine Learning', 'Data Science', 'DevOps', 'Cloud Computing',
  'Cybersecurity', 'Game Development', 'Blockchain', 'IoT',
  'UI/UX Design', 'Product Management', 'Technical Writing',
];

interface OnboardingWizardProps {
  className?: string;
}

export function OnboardingWizard({ className }: OnboardingWizardProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Fetch onboarding steps
  const {
    data: steps,
    isLoading: stepsLoading,
  } = useQuery({
    queryKey: ['onboarding', 'steps'],
    queryFn: () => onboardingService.getSteps(),
  });

  // Save step mutation
  const saveStepMutation = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: any }) =>
      onboardingService.saveStep(stepId, data),
    onSuccess: (step) => {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      queryClient.setQueryData(
        ['onboarding', 'steps'],
        (old: OnboardingStep[] | undefined) =>
          old?.map(s => s.id === step.id ? step : s) || []
      );
    },
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: () => onboardingService.complete(),
    onSuccess: async (response) => {
      await refreshUser();
      toast({
        title: 'Welcome to BreakIn!',
        description: 'Your profile has been set up successfully.',
        variant: 'default',
      });
      
      // Redirect to role-based home
      const homePath = getRoleBasedHomePath(user?.role || 'junior');
      router.push(homePath);
    },
  });

  const stepSchemas = [
    personalInfoSchema,
    skillsSchema,
    preferencesSchema,
  ];

  const currentSchema = stepSchemas[currentStep];

  const form = useForm({
    resolver: currentSchema ? zodResolver(currentSchema) : undefined,
    mode: 'onChange',
  });

  // Load existing step data
  useEffect(() => {
    if (steps && steps[currentStep]?.data) {
      const stepData = steps[currentStep].data;
      Object.entries(stepData).forEach(([key, value]) => {
        form.setValue(key, value);
      });
    }
  }, [currentStep, steps, form]);

  const handleNextStep = async (data: any) => {
    if (!steps) return;

    const currentStepData = steps[currentStep];
    
    try {
      await saveStepMutation.mutateAsync({
        stepId: currentStepData.id,
        data,
      });

      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        form.reset();
      } else {
        // Complete onboarding
        await completeOnboardingMutation.mutateAsync();
      }
    } catch (error) {
      console.error('Failed to save step:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getRoleBasedHomePath = (role: string): string => {
    switch (role) {
      case 'junior':
        return '/developer-dashboard';
      case 'mentor':
        return '/mentor';
      case 'recruiter':
        return '/company-dashboard';
      default:
        return '/';
    }
  };

  if (stepsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">No onboarding steps available.</p>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Card>
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to BreakIn!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Let's set up your profile to get you started
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index < currentStep || completedSteps.has(index)
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep || completedSteps.has(index) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </div>

          <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-6">
            {currentStep === 0 && <PersonalInfoStep form={form} />}
            {currentStep === 1 && <SkillsStep form={form} />}
            {currentStep === 2 && <PreferencesStep form={form} />}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                type="submit"
                disabled={saveStepMutation.isPending || completeOnboardingMutation.isPending}
              >
                {saveStepMutation.isPending || completeOnboardingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : currentStep === steps.length - 1 ? (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components
function PersonalInfoStep({ form }: { form: any }) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h4 className="font-medium">Personal Information</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            {...register('displayName')}
            className={errors.displayName ? 'border-destructive' : ''}
          />
          {errors.displayName && (
            <p className="text-sm text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g., San Francisco, CA"
            {...register('location')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us a bit about yourself..."
          rows={3}
          {...register('bio')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourwebsite.com"
            {...register('website')}
            className={errors.website ? 'border-destructive' : ''}
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub Profile</Label>
          <Input
            id="githubUrl"
            type="url"
            placeholder="https://github.com/username"
            {...register('githubUrl')}
            className={errors.githubUrl ? 'border-destructive' : ''}
          />
          {errors.githubUrl && (
            <p className="text-sm text-destructive">{errors.githubUrl.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
        <Input
          id="linkedinUrl"
          type="url"
          placeholder="https://linkedin.com/in/username"
          {...register('linkedinUrl')}
          className={errors.linkedinUrl ? 'border-destructive' : ''}
        />
        {errors.linkedinUrl && (
          <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>
        )}
      </div>
    </div>
  );
}

function SkillsStep({ form }: { form: any }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const selectedSkills = watch('skills') || [];
  const selectedInterests = watch('interests') || [];

  const toggleSkill = (skill: string) => {
    const current = selectedSkills.includes(skill);
    if (current) {
      setValue('skills', selectedSkills.filter((s: string) => s !== skill));
    } else {
      setValue('skills', [...selectedSkills, skill]);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = selectedInterests.includes(interest);
    if (current) {
      setValue('interests', selectedInterests.filter((i: string) => i !== interest));
    } else {
      setValue('interests', [...selectedInterests, interest]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h4 className="font-medium">Skills & Experience</h4>
        </div>

        <div className="space-y-2">
          <Label>Experience Level *</Label>
          <Select onValueChange={(value) => setValue('experience', value)}>
            <SelectTrigger className={errors.experience ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
              <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
              <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
            </SelectContent>
          </Select>
          {errors.experience && (
            <p className="text-sm text-destructive">{errors.experience.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Skills *</Label>
          <p className="text-sm text-muted-foreground">Select the technologies you work with</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((skill) => (
            <Badge
              key={skill}
              variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
        
        {errors.skills && (
          <p className="text-sm text-destructive">{errors.skills.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label>Interests</Label>
          <p className="text-sm text-muted-foreground">What areas are you interested in?</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <Badge
              key={interest}
              variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({ form }: { form: any }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const notifications = watch('notifications') || {
    email: {},
    push: {},
  };

  const updateNotificationSetting = (type: 'email' | 'push', key: string, value: boolean) => {
    setValue(`notifications.${type}.${key}`, value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h4 className="font-medium">Preferences</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select onValueChange={(value) => setValue('theme', value)} defaultValue="system">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select onValueChange={(value) => setValue('language', value)} defaultValue="en">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select onValueChange={(value) => setValue('timezone', value)} defaultValue="UTC">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Email Digest</Label>
          <Select onValueChange={(value) => setValue('emailDigest', value)} defaultValue="weekly">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Email Notifications</Label>
        <div className="space-y-3">
          {[
            { key: 'mentions', label: 'Mentions and replies' },
            { key: 'directMessages', label: 'Direct messages' },
            { key: 'submissions', label: 'Submission updates' },
            { key: 'reviews', label: 'Review notifications' },
            { key: 'communityActivity', label: 'Community activity' },
            { key: 'systemUpdates', label: 'System updates' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`email-${key}`}
                checked={notifications.email[key] || false}
                onCheckedChange={(checked) => 
                  updateNotificationSetting('email', key, checked as boolean)
                }
              />
              <Label htmlFor={`email-${key}`} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Push Notifications</Label>
        <div className="space-y-3">
          {[
            { key: 'mentions', label: 'Mentions and replies' },
            { key: 'directMessages', label: 'Direct messages' },
            { key: 'submissions', label: 'Submission updates' },
            { key: 'reviews', label: 'Review notifications' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`push-${key}`}
                checked={notifications.push[key] || false}
                onCheckedChange={(checked) => 
                  updateNotificationSetting('push', key, checked as boolean)
                }
              />
              <Label htmlFor={`push-${key}`} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}