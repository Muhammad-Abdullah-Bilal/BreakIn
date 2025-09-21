'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmissionService } from '@/lib/services/api';
import { SubmissionType, SubmissionFile } from '@/lib/types/domain';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Code, 
  Image, 
  Video,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface SubmissionFormProps {
  taskId: string;
  onSuccess?: (submissionId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function SubmissionForm({ taskId, onSuccess, onCancel, className }: SubmissionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [type, setType] = useState<SubmissionType>('file');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Create submission mutation
  const createSubmissionMutation = useMutation({
    mutationFn: (data: {
      taskId: string;
      type: SubmissionType;
      description: string;
      repositoryUrl?: string;
      files: SubmissionFile[];
    }) => SubmissionService.create(data),
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      onSuccess?.(submission.id);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const uploadedFile = await SubmissionService.uploadFile(file);
        return uploadedFile;
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);
      setFiles([]);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!description.trim()) return;
    if (type === 'repository' && !repositoryUrl.trim()) return;
    if (type === 'file' && uploadedFiles.length === 0 && files.length === 0) return;

    // Upload remaining files if any
    if (files.length > 0) {
      await handleFileUpload();
    }

    createSubmissionMutation.mutate({
      taskId,
      type,
      description: description.trim(),
      repositoryUrl: type === 'repository' ? repositoryUrl.trim() : undefined,
      files: uploadedFiles,
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.includes('text') || fileType.includes('code')) return <Code className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const canSubmit = description.trim() && 
    (type !== 'repository' || repositoryUrl.trim()) &&
    (type !== 'file' || uploadedFiles.length > 0 || files.length > 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Submit Your Work</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submission Type */}
          <div className="space-y-2">
            <Label>Submission Type</Label>
            <Select value={type} onValueChange={(value: SubmissionType) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    File Upload
                  </div>
                </SelectItem>
                <SelectItem value="repository">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Repository Link
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    External Link
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your submission, approach, and any important notes..."
              rows={4}
              required
            />
          </div>

          {/* Repository URL */}
          {type === 'repository' && (
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL *</Label>
              <Input
                id="repositoryUrl"
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                required
              />
            </div>
          )}

          {/* External Link */}
          {type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="externalUrl">External URL *</Label>
              <Input
                id="externalUrl"
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
          )}

          {/* File Upload */}
          {type === 'file' && (
            <div className="space-y-4">
              <Label>Files</Label>
              
              {/* File Input */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop files here or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline" size="sm" type="button">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Selected Files ({files.length})</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleFileUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileRemove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded bg-green-50">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{file.filename}</span>
                          <span className="text-xs text-muted-foreground">
                            {file.size && `(${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission Guidelines */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Submission Guidelines</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Provide clear description of your work and approach</li>
                  <li>• Include all necessary files or provide accessible repository</li>
                  <li>• Test your submission before submitting</li>
                  <li>• Follow any specific requirements mentioned in the task</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!canSubmit || createSubmissionMutation.isPending || isUploading}
            >
              {createSubmissionMutation.isPending ? 'Submitting...' : 'Submit Work'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}