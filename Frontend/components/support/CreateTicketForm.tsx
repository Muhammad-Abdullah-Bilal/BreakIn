'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/lib/services/identity-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus,
  Upload,
  X,
  FileText,
  Image,
  File,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Bug,
  CreditCard,
  User,
  Settings,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().min(1, 'Priority is required'),
  userEmail: z.string().email('Valid email is required').optional(),
  userName: z.string().min(1, 'Name is required').optional(),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

interface CreateTicketFormProps {
  onSuccess?: (ticketId: string) => void;
  onCancel?: () => void;
  isDialog?: boolean;
  defaultUserInfo?: {
    email?: string;
    name?: string;
  };
}

interface FileUpload {
  file: File;
  preview?: string;
  id: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'technical':
      return <Settings className="h-4 w-4" />;
    case 'billing':
      return <CreditCard className="h-4 w-4" />;
    case 'account':
      return <User className="h-4 w-4" />;
    case 'feature_request':
      return <MessageSquare className="h-4 w-4" />;
    case 'bug_report':
      return <Bug className="h-4 w-4" />;
    case 'other':
      return <HelpCircle className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical':
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case 'high':
      return <ArrowUp className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <Minus className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function CreateTicketForm({ 
  onSuccess, 
  onCancel, 
  isDialog = false,
  defaultUserInfo
}: CreateTicketFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: 'medium',
      userEmail: defaultUserInfo?.email || '',
      userName: defaultUserInfo?.name || '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketFormData & { attachments?: File[] }) => 
      supportService.createTicket(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      toast({
        title: 'Ticket created',
        description: `Your support ticket #${result.id.slice(-8)} has been created successfully.`,
      });
      reset();
      setUploadedFiles([]);
      onSuccess?.(result.id);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating ticket',
        description: error.message || 'Something went wrong while creating your ticket.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateTicketFormData) => {
    const attachments = uploadedFiles.map(f => f.file);
    createTicketMutation.mutate({ ...data, attachments });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: FileUpload[] = [];
    
    Array.from(files).forEach((file, index) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Unsupported file type',
          description: `${file.name} is not a supported file type.`,
          variant: 'destructive',
        });
        return;
      }
      
      const fileUpload: FileUpload = {
        file,
        id: `${Date.now()}-${index}`,
      };
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileUpload.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev, fileUpload]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(fileUpload);
      }
    });
    
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const categories = [
    { value: 'technical', label: 'Technical Issue', icon: <Settings className="h-4 w-4" /> },
    { value: 'billing', label: 'Billing & Payment', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'account', label: 'Account & Profile', icon: <User className="h-4 w-4" /> },
    { value: 'feature_request', label: 'Feature Request', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'bug_report', label: 'Bug Report', icon: <Bug className="h-4 w-4" /> },
    { value: 'other', label: 'Other', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const priorities = [
    { value: 'low', label: 'Low', description: 'General questions, minor issues' },
    { value: 'medium', label: 'Medium', description: 'Standard support requests' },
    { value: 'high', label: 'High', description: 'Important issues affecting workflow' },
    { value: 'critical', label: 'Critical', description: 'Urgent issues, system down' },
  ];

  const FormContent = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Information (if not logged in) */}
      {!defaultUserInfo && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name *</label>
            <Input
              {...register('userName')}
              placeholder="Enter your full name"
              className={errors.userName ? 'border-destructive' : ''}
            />
            {errors.userName && (
              <p className="text-sm text-destructive">{errors.userName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address *</label>
            <Input
              {...register('userEmail')}
              type="email"
              placeholder="your.email@example.com"
              className={errors.userEmail ? 'border-destructive' : ''}
            />
            {errors.userEmail && (
              <p className="text-sm text-destructive">{errors.userEmail.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Subject *</label>
        <Input
          {...register('subject')}
          placeholder="Brief description of your issue"
          className={errors.subject ? 'border-destructive' : ''}
        />
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {watch('subject')?.length || 0}/200 characters
        </p>
      </div>

      {/* Category and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <Select
            value={watch('category')}
            onValueChange={(value) => setValue('category', value)}
          >
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <span>{category.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority *</label>
          <Select
            value={watch('priority')}
            onValueChange={(value) => setValue('priority', value)}
          >
            <SelectTrigger className={errors.priority ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(priority.value)}
                      <span className="font-medium">{priority.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {priority.description}
                    </p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description *</label>
        <Textarea
          {...register('description')}
          placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
          rows={6}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {watch('description')?.length || 0}/5000 characters
        </p>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Attachments</label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or{' '}
            <label className="text-primary cursor-pointer hover:underline">
              browse
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: Images, PDF, Text, Word documents (max 10MB each)
          </p>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploaded Files:</p>
            <div className="space-y-2">
              {uploadedFiles.map((fileUpload) => (
                <div key={fileUpload.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-shrink-0">
                    {fileUpload.preview ? (
                      <img
                        src={fileUpload.preview}
                        alt={fileUpload.file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : fileUpload.file.type === 'application/pdf' ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : (
                      <File className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileUpload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileUpload.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {isDialog && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );

  if (isDialog) {
    return <FormContent />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Support Ticket
        </CardTitle>
        <p className="text-muted-foreground">
          Need help? Submit a support ticket and our team will get back to you soon.
        </p>
      </CardHeader>
      <CardContent>
        <FormContent />
      </CardContent>
    </Card>
  );
}

// Dialog wrapper component
interface CreateTicketDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (ticketId: string) => void;
  defaultUserInfo?: {
    email?: string;
    name?: string;
  };
}

export function CreateTicketDialog({ 
  trigger, 
  onSuccess,
  defaultUserInfo 
}: CreateTicketDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (ticketId: string) => {
    setOpen(false);
    onSuccess?.(ticketId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Submit a support request and our team will assist you promptly.
          </DialogDescription>
        </DialogHeader>
        <CreateTicketForm
          isDialog
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
          defaultUserInfo={defaultUserInfo}
        />
      </DialogContent>
    </Dialog>
  );
}